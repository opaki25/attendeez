import os
import uuid
import base64
from dotenv import load_dotenv
from datetime import datetime
from flask import Flask, render_template, redirect, url_for, request, flash, send_file, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, DateTimeField, SelectField, FileField, SubmitField, PasswordField
from wtforms.validators import DataRequired, Email
from flask_login import LoginManager, login_user, logout_user, login_required, UserMixin, current_user
from werkzeug.utils import secure_filename
import csv
import io
import smtplib
from email.message import EmailMessage
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from flask_cors import CORS

# Optional: reportlab for PDF export (may not work on all serverless platforms)
try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

# Optional: qrcode for QR generation
try:
    import qrcode
    QRCODE_AVAILABLE = True
except ImportError:
    QRCODE_AVAILABLE = False

# Optional: Supabase Storage for file uploads
try:
    from supabase import create_client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False

# Load environment variables from .env file
load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'change-me')

# Database configuration - Use PostgreSQL (Supabase) in production, SQLite locally
database_url = os.environ.get('DATABASE_URL')
if database_url:
    # Fix for Heroku/Supabase postgres:// vs postgresql://
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'attendly.db')

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Use /tmp for uploads on Vercel (serverless is read-only)
if os.environ.get('VERCEL'):
    app.config['UPLOAD_FOLDER'] = '/tmp/uploads'
else:
    app.config['UPLOAD_FOLDER'] = os.path.join(basedir, 'static', 'uploads')

try:
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
except OSError:
    pass  # Ignore if can't create (read-only filesystem)

# Supabase Storage setup
supabase_client = None
SUPABASE_BUCKET = 'event-images'
if SUPABASE_AVAILABLE and os.environ.get('SUPABASE_URL') and os.environ.get('SUPABASE_KEY'):
    try:
        supabase_client = create_client(
            os.environ.get('SUPABASE_URL'),
            os.environ.get('SUPABASE_KEY')
        )
        print(f"Supabase client initialized for {os.environ.get('SUPABASE_URL')}")
    except Exception as e:
        print(f"Supabase client init failed: {e}")
        supabase_client = None
else:
    print(f"Supabase not configured - AVAILABLE:{SUPABASE_AVAILABLE}, URL:{bool(os.environ.get('SUPABASE_URL'))}, KEY:{bool(os.environ.get('SUPABASE_KEY'))}")

def upload_to_supabase(file_data, filename):
    """Upload file to Supabase Storage and return public URL"""
    if not supabase_client:
        print("Supabase client not initialized")
        return None
    try:
        # Generate unique filename
        ext = os.path.splitext(filename)[1].lower()
        unique_name = f"{uuid.uuid4()}{ext}"
        
        # Read file content
        file_content = file_data.read()
        file_data.seek(0)  # Reset for potential local save
        
        # Determine content type
        content_type = getattr(file_data, 'content_type', 'image/jpeg')
        if ext in ['.png']:
            content_type = 'image/png'
        elif ext in ['.gif']:
            content_type = 'image/gif'
        elif ext in ['.webp']:
            content_type = 'image/webp'
        
        print(f"Uploading {unique_name} to Supabase Storage...")
        
        # Upload to Supabase Storage
        result = supabase_client.storage.from_(SUPABASE_BUCKET).upload(
            path=unique_name,
            file=file_content,
            file_options={"content-type": content_type}
        )
        
        print(f"Upload result: {result}")
        
        # Get public URL
        public_url = supabase_client.storage.from_(SUPABASE_BUCKET).get_public_url(unique_name)
        print(f"Public URL: {public_url}")
        return public_url
    except Exception as e:
        print(f"Supabase upload failed: {e}")
        import traceback
        traceback.print_exc()
        return None

db = SQLAlchemy(app)
CORS(app, supports_credentials=True)
login_manager = LoginManager(app)
login_manager.login_view = 'organizer_login'

# Models
class Attendee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(128), nullable=False)
    contact = db.Column(db.String(64))
    status = db.Column(db.String(64))

    attendances = db.relationship('Attendance', back_populates='attendee')

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(256), nullable=False)
    description = db.Column(db.Text)
    datetime = db.Column(db.DateTime)
    end_datetime = db.Column(db.DateTime)
    venue = db.Column(db.String(256))
    poster = db.Column(db.String(256))

    attendances = db.relationship('Attendance', back_populates='event')

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'))
    attendee_id = db.Column(db.Integer, db.ForeignKey('attendee.id'))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    checked_in = db.Column(db.Boolean, default=False)
    check_in_time = db.Column(db.DateTime, nullable=True)
    check_in_token = db.Column(db.String(64), unique=True, nullable=True)

    event = db.relationship('Event', back_populates='attendances')
    attendee = db.relationship('Attendee', back_populates='attendances')
    
    def generate_token(self):
        """Generate a unique check-in token."""
        self.check_in_token = str(uuid.uuid4())
        return self.check_in_token

# Organizer user (simple static single user)
class Organizer(UserMixin):
    id = 1
    username = os.environ.get('ORG_USER', 'admin')
    password = os.environ.get('ORG_PASS', 'password')

    def get_id(self):
        return self.id

@login_manager.user_loader
def load_user(user_id):
    if int(user_id) == Organizer.id:
        return Organizer()
    return None

# Forms
class EventForm(FlaskForm):
    name = StringField('Event Name', validators=[DataRequired()])
    description = TextAreaField('Description')
    datetime = DateTimeField('Start Time', format='%Y-%m-%dT%H:%M', validators=[DataRequired()])
    end_datetime = DateTimeField('End Time', format='%Y-%m-%dT%H:%M')
    venue = StringField('Venue', validators=[DataRequired()])
    poster = FileField('Event Poster')
    submit = SubmitField('Publish Event')

class AttendeeForm(FlaskForm):
    name = StringField('Full Name', validators=[DataRequired()])
    email = StringField('Email Address', validators=[DataRequired(), Email()])
    contact = StringField('Contact Number')
    status = SelectField('Status', choices=[('Student','Student'),('Working','Working'),('Other','Other')])
    submit = SubmitField('Confirm Attendance')

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')

# Routes
@app.route('/debug/supabase')
def debug_supabase():
    """Debug endpoint to check Supabase configuration"""
    info = {
        'supabase_available': SUPABASE_AVAILABLE,
        'supabase_url_set': bool(os.environ.get('SUPABASE_URL')),
        'supabase_key_set': bool(os.environ.get('SUPABASE_KEY')),
        'client_initialized': supabase_client is not None,
        'bucket': SUPABASE_BUCKET
    }
    if supabase_client:
        try:
            # Try to list files in bucket
            files = supabase_client.storage.from_(SUPABASE_BUCKET).list()
            info['bucket_accessible'] = True
            info['files_count'] = len(files) if files else 0
        except Exception as e:
            info['bucket_accessible'] = False
            info['bucket_error'] = str(e)
    return jsonify(info)

@app.route('/debug/rsvp-test/<int:event_id>')
def debug_rsvp_test(event_id):
    """Debug endpoint to test RSVP functionality"""
    try:
        event = Event.query.get_or_404(event_id)
        
        # Test creating an attendee
        test_email = f"test_{event_id}@debug.com"
        attendee = Attendee.query.filter_by(email=test_email).first()
        if not attendee:
            attendee = Attendee(name="Test User", email=test_email, contact="123", status="Student")
            db.session.add(attendee)
            db.session.flush()
        
        # Check existing attendance
        existing = Attendance.query.filter_by(event_id=event_id, attendee_id=attendee.id).first()
        if existing:
            return jsonify({
                'success': True,
                'message': 'Test attendee already exists',
                'attendee_id': attendee.id,
                'attendance_id': existing.id
            })
        
        # Test creating attendance
        attendance = Attendance(event_id=event_id, attendee_id=attendee.id)
        attendance.generate_token()
        db.session.add(attendance)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'RSVP test successful',
            'attendee_id': attendee.id,
            'attendance_id': attendance.id,
            'token': attendance.check_in_token
        })
    except Exception as e:
        db.session.rollback()
        import traceback
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/')
def index():
    events = Event.query.order_by(Event.datetime.asc()).all()
    return render_template('index.html', events=events)

@app.route('/event/<int:event_id>')
def event_detail(event_id):
    event = Event.query.get_or_404(event_id)
    return render_template('event.html', event=event)

@app.route('/rsvp/<int:event_id>', methods=['GET','POST'])
def rsvp(event_id):
    event = Event.query.get_or_404(event_id)
    form = AttendeeForm()
    # if returning attendee id provided via hidden field
    attendee_id = request.form.get('attendee_id')
    if form.validate_on_submit():
        try:
            attendee = None
            
            # If returning attendee ID provided, try to load them
            if attendee_id:
                attendee = Attendee.query.get(int(attendee_id))
                if attendee:
                    # Update their info
                    attendee.name = form.name.data
                    attendee.email = form.email.data
                    attendee.contact = form.contact.data
                    attendee.status = form.status.data
            
            # If no attendee yet, try to find by email or create new
            if not attendee:
                attendee = Attendee.query.filter_by(email=form.email.data).first()
                if attendee:
                    # Update existing attendee's info
                    attendee.name = form.name.data
                    attendee.contact = form.contact.data
                    attendee.status = form.status.data
                else:
                    # Create new attendee
                    attendee = Attendee(name=form.name.data,
                                        email=form.email.data,
                                        contact=form.contact.data,
                                        status=form.status.data)
                    db.session.add(attendee)
            
            # Flush to ensure attendee has an ID
            db.session.flush()
            
            # Check if already registered for this event
            existing_attendance = Attendance.query.filter_by(
                event_id=event_id,
                attendee_id=attendee.id
            ).first()
            if existing_attendance:
                flash('You have already registered for this event!', 'warning')
                return render_template('rsvp.html', event=event, form=form)
            
            # Create attendance record
            attendance = Attendance(event_id=event_id, attendee_id=attendee.id)
            attendance.generate_token()  # Generate unique QR token
            db.session.add(attendance)
            db.session.commit()
            
            # Send email confirmation with QR code (non-blocking)
            try:
                send_confirmation_email(attendee, event, attendance)
            except Exception as email_err:
                app.logger.warning(f"Email failed but RSVP succeeded: {email_err}")
            
            flash('Attendance confirmed!', 'success')
            return redirect(url_for('confirm'))
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"RSVP error: {e}")
            import traceback
            traceback.print_exc()
            flash('An error occurred. Please try again.', 'danger')
            return render_template('rsvp.html', event=event, form=form)
    return render_template('rsvp.html', event=event, form=form)

@app.route('/confirm')
def confirm():
    return render_template('confirm.html')

@app.route('/organizer/login', methods=['GET','POST'])
def organizer_login():
    form = LoginForm()
    if form.validate_on_submit():
        if form.username.data == Organizer.username and form.password.data == Organizer.password:
            user = Organizer()
            login_user(user)
            return redirect(url_for('organizer_dashboard'))
        flash('Invalid credentials', 'danger')
    return render_template('organizer_login.html', form=form)

@app.route('/organizer/logout')
@login_required
def organizer_logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/organizer')
@login_required
def organizer_dashboard():
    events = Event.query.order_by(Event.datetime.desc()).all()
    return render_template('organizer_dashboard.html', events=events)

@app.route('/organizer/event/create', methods=['GET','POST'])
@login_required
def create_event():
    form = EventForm()
    if form.validate_on_submit():
        poster_value = None
        if form.poster.data:
            f = form.poster.data
            # Try Supabase Storage first (for production)
            if supabase_client:
                public_url = upload_to_supabase(f, f.filename)
                if public_url:
                    poster_value = public_url
            # Fallback to local storage
            if not poster_value:
                filename = secure_filename(f.filename)
                f.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                poster_value = filename
        event = Event(name=form.name.data,
                      description=form.description.data,
                      datetime=form.datetime.data,
                      end_datetime=form.end_datetime.data,
                      venue=form.venue.data,
                      poster=poster_value)
        db.session.add(event)
        db.session.commit()
        flash('Event created successfully')
        return redirect(url_for('organizer_dashboard'))
    return render_template('create_event.html', form=form)


@app.route('/organizer/event/<int:event_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_event(event_id):
    event = Event.query.get_or_404(event_id)
    form = EventForm(obj=event)
    if form.validate_on_submit():
        event.name = form.name.data
        event.description = form.description.data
        event.datetime = form.datetime.data
        event.end_datetime = form.end_datetime.data
        event.venue = form.venue.data
        if form.poster.data:
            f = form.poster.data
            # Try Supabase Storage first (for production)
            if supabase_client:
                public_url = upload_to_supabase(f, f.filename)
                if public_url:
                    event.poster = public_url
            # Fallback to local storage
            if not event.poster or not event.poster.startswith('http'):
                filename = secure_filename(f.filename)
                f.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                event.poster = filename
        db.session.commit()
        flash('Event updated successfully')
        return redirect(url_for('organizer_dashboard'))
    return render_template('edit_event.html', form=form, event=event)


@app.route('/organizer/event/<int:event_id>/delete', methods=['POST'])
@login_required
def delete_event(event_id):
    event = Event.query.get_or_404(event_id)
    # Delete all attendances for this event
    Attendance.query.filter_by(event_id=event_id).delete()
    db.session.delete(event)
    db.session.commit()
    flash('Event deleted successfully')
    return redirect(url_for('organizer_dashboard'))


@app.route('/organizer/analytics')
@login_required
def analytics_dashboard():
    # Basic stats
    total_events = Event.query.count()
    total_attendees = Attendee.query.count()
    total_rsvps = Attendance.query.count()
    total_checked_in = Attendance.query.filter_by(checked_in=True).count()
    
    # Events with most attendees
    events = Event.query.all()
    top_events = sorted(events, key=lambda e: len(e.attendances), reverse=True)[:5]
    
    # Attendees by status
    status_counts = db.session.query(
        Attendee.status, db.func.count(Attendee.id)
    ).group_by(Attendee.status).all()
    
    # Recent registrations (last 10)
    recent_attendances = Attendance.query.order_by(
        Attendance.timestamp.desc()
    ).limit(10).all()
    
    # Events by month (for chart)
    events_by_month = db.session.query(
        db.func.strftime('%Y-%m', Event.datetime).label('month'),
        db.func.count(Event.id)
    ).filter(Event.datetime.isnot(None)).group_by('month').order_by('month').all()
    
    # RSVPs by month (for chart)
    rsvps_by_month = db.session.query(
        db.func.strftime('%Y-%m', Attendance.timestamp).label('month'),
        db.func.count(Attendance.id)
    ).group_by('month').order_by('month').all()
    
    return render_template('analytics.html',
        total_events=total_events,
        total_attendees=total_attendees,
        total_rsvps=total_rsvps,
        total_checked_in=total_checked_in,
        top_events=top_events,
        status_counts=status_counts,
        recent_attendances=recent_attendances,
        events_by_month=events_by_month,
        rsvps_by_month=rsvps_by_month
    )


@app.route('/organizer/event/<int:event_id>/analytics')
@login_required
def event_analytics(event_id):
    """Analytics dashboard for a specific event."""
    event = Event.query.get_or_404(event_id)
    
    # Basic stats for this event
    total_rsvps = len(event.attendances)
    checked_in_count = sum(1 for a in event.attendances if a.checked_in)
    check_in_rate = round((checked_in_count / total_rsvps * 100), 1) if total_rsvps > 0 else 0
    
    # Attendees by status for this event
    status_counts = {}
    for a in event.attendances:
        status = a.attendee.status or 'Other'
        status_counts[status] = status_counts.get(status, 0) + 1
    status_list = [(k, v) for k, v in status_counts.items()]
    
    # New vs returning attendees
    new_attendees = 0
    returning_attendees = 0
    for a in event.attendances:
        prior = Attendance.query.filter(
            Attendance.attendee_id == a.attendee_id,
            Attendance.timestamp < a.timestamp
        ).count()
        if prior > 0:
            returning_attendees += 1
        else:
            new_attendees += 1
    
    # Registrations over time (by day)
    rsvps_by_day = db.session.query(
        db.func.strftime('%Y-%m-%d', Attendance.timestamp).label('day'),
        db.func.count(Attendance.id)
    ).filter(Attendance.event_id == event_id).group_by('day').order_by('day').all()
    
    # Check-ins over time (by hour on event day)
    checkins_by_hour = db.session.query(
        db.func.strftime('%H:00', Attendance.check_in_time).label('hour'),
        db.func.count(Attendance.id)
    ).filter(
        Attendance.event_id == event_id,
        Attendance.checked_in == True
    ).group_by('hour').order_by('hour').all()
    
    # Recent activity for this event
    recent_rsvps = Attendance.query.filter_by(event_id=event_id).order_by(
        Attendance.timestamp.desc()
    ).limit(5).all()
    
    return render_template('event_analytics.html',
        event=event,
        total_rsvps=total_rsvps,
        checked_in_count=checked_in_count,
        check_in_rate=check_in_rate,
        status_counts=status_list,
        new_attendees=new_attendees,
        returning_attendees=returning_attendees,
        rsvps_by_day=rsvps_by_day,
        checkins_by_hour=checkins_by_hour,
        recent_rsvps=recent_rsvps
    )


@app.route('/organizer/event/<int:event_id>/checkin/<int:attendance_id>', methods=['POST'])
@login_required
def check_in_attendee(event_id, attendance_id):
    attendance = Attendance.query.get_or_404(attendance_id)
    if attendance.event_id != event_id:
        return jsonify({'error': 'Invalid attendance'}), 400
    
    attendance.checked_in = True
    attendance.check_in_time = datetime.utcnow()
    db.session.commit()
    
    if request.headers.get('Accept') == 'application/json':
        return jsonify({'success': True, 'checked_in': True, 'check_in_time': attendance.check_in_time.isoformat()})
    
    flash(f'{attendance.attendee.name} checked in successfully')
    return redirect(url_for('event_attendees', event_id=event_id))


@app.route('/organizer/event/<int:event_id>/checkout/<int:attendance_id>', methods=['POST'])
@login_required
def check_out_attendee(event_id, attendance_id):
    attendance = Attendance.query.get_or_404(attendance_id)
    if attendance.event_id != event_id:
        return jsonify({'error': 'Invalid attendance'}), 400
    
    attendance.checked_in = False
    attendance.check_in_time = None
    db.session.commit()
    
    if request.headers.get('Accept') == 'application/json':
        return jsonify({'success': True, 'checked_in': False})
    
    flash(f'{attendance.attendee.name} checked out')
    return redirect(url_for('event_attendees', event_id=event_id))


@app.route('/organizer/scanner')
@login_required
def qr_scanner():
    """QR code scanner page for quick check-ins."""
    events = Event.query.order_by(Event.datetime.desc()).all()
    return render_template('scanner.html', events=events)


@app.route('/api/checkin/qr', methods=['POST'])
@login_required
def qr_checkin():
    """Check in an attendee via QR code token."""
    data = request.get_json() or {}
    token = data.get('token', '').strip()
    
    if not token:
        return jsonify({'success': False, 'error': 'No QR code token provided'}), 400
    
    # Find attendance by token
    attendance = Attendance.query.filter_by(check_in_token=token).first()
    
    if not attendance:
        return jsonify({'success': False, 'error': 'Invalid QR code - ticket not found'}), 404
    
    if attendance.checked_in:
        return jsonify({
            'success': False, 
            'error': 'Already checked in',
            'attendee': {
                'name': attendance.attendee.name,
                'email': attendance.attendee.email,
                'event': attendance.event.name,
                'check_in_time': attendance.check_in_time.strftime('%I:%M %p') if attendance.check_in_time else None
            }
        }), 400
    
    # Check in the attendee
    attendance.checked_in = True
    attendance.check_in_time = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'{attendance.attendee.name} checked in successfully!',
        'attendee': {
            'name': attendance.attendee.name,
            'email': attendance.attendee.email,
            'status': attendance.attendee.status,
            'event': attendance.event.name,
            'event_id': attendance.event.id,
            'check_in_time': attendance.check_in_time.strftime('%I:%M %p')
        }
    })


@app.route('/api/attendance/<token>/qr')
def get_qr_code(token):
    """Generate QR code image for an attendance token."""
    attendance = Attendance.query.filter_by(check_in_token=token).first()
    if not attendance:
        return jsonify({'error': 'Invalid token'}), 404
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(token)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="#06b6d4", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return send_file(buffer, mimetype='image/png')


@app.route('/api/analytics')
def api_analytics():
    """Return analytics data for charts."""
    # Events by month
    events_by_month = db.session.query(
        db.func.strftime('%Y-%m', Event.datetime).label('month'),
        db.func.count(Event.id)
    ).filter(Event.datetime.isnot(None)).group_by('month').order_by('month').all()
    
    # RSVPs by month
    rsvps_by_month = db.session.query(
        db.func.strftime('%Y-%m', Attendance.timestamp).label('month'),
        db.func.count(Attendance.id)
    ).group_by('month').order_by('month').all()
    
    # Status breakdown
    status_counts = db.session.query(
        Attendee.status, db.func.count(Attendee.id)
    ).group_by(Attendee.status).all()
    
    # Check-in stats
    total_rsvps = Attendance.query.count()
    checked_in = Attendance.query.filter_by(checked_in=True).count()
    
    return jsonify({
        'events_by_month': [{'month': m, 'count': c} for m, c in events_by_month],
        'rsvps_by_month': [{'month': m, 'count': c} for m, c in rsvps_by_month],
        'status_breakdown': [{'status': s or 'Unknown', 'count': c} for s, c in status_counts],
        'check_in_stats': {'total': total_rsvps, 'checked_in': checked_in}
    })

@app.route('/organizer/event/<int:event_id>/attendees')
@login_required
def event_attendees(event_id):
    event = Event.query.get_or_404(event_id)
    status_filter = request.args.get('status')
    type_filter = request.args.get('type')
    search_query = request.args.get('q', '').strip().lower()
    attendances = list(event.attendances)
    # apply search filter
    if search_query:
        attendances = [a for a in attendances if 
            search_query in a.attendee.name.lower() or 
            search_query in a.attendee.email.lower() or 
            (a.attendee.contact and search_query in a.attendee.contact.lower())]
    # apply new/returning filter if requested
    if type_filter in ['new','returning']:
        filtered = []
        for a in attendances:
            # determine if attendee has previous attendance before this one
            prior = Attendance.query.filter(
                Attendance.attendee_id == a.attendee_id,
                Attendance.timestamp < a.timestamp
            ).count()
            is_returning = prior > 0
            if (type_filter == 'new' and not is_returning) or (type_filter == 'returning' and is_returning):
                filtered.append(a)
        attendances = filtered
    if status_filter:
        attendances = [a for a in attendances if a.attendee.status == status_filter]
    return render_template('attendees.html', event=event, attendances=attendances)

@app.route('/organizer/event/<int:event_id>/attendees/export')
@login_required
def export_attendees(event_id):
    event = Event.query.get_or_404(event_id)
    si = []
    for a in event.attendances:
        si.append([a.attendee.name, a.attendee.email, a.attendee.contact, a.attendee.status, a.timestamp])
    output = '\n'.join(','.join(map(str,row)) for row in si)
    return send_file(io.BytesIO(output.encode()),
                     mimetype='text/csv',
                     download_name=f"event_{event_id}_attendees.csv")

@app.route('/organizer/event/<int:event_id>/attendees/export-pdf')
@login_required
def export_attendees_pdf(event_id):
    """Export attendees list as a styled PDF document."""
    if not REPORTLAB_AVAILABLE:
        flash('PDF export is not available on this server.', 'error')
        return redirect(url_for('view_attendees', event_id=event_id))
    
    event = Event.query.get_or_404(event_id)
    
    # Create PDF buffer
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=60, bottomMargin=40)
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        spaceAfter=6,
        textColor=colors.HexColor('#06b6d4'),
        fontName='Helvetica-Bold'
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=20,
        textColor=colors.HexColor('#6b7280')
    )
    
    # Header
    elements.append(Paragraph("ATTENDEEZ", title_style))
    elements.append(Paragraph(f"Attendee Report for: {event.name}", subtitle_style))
    
    # Event details
    event_date = event.datetime.strftime('%B %d, %Y at %I:%M %p') if event.datetime else 'TBA'
    event_info = f"Date: {event_date} | Venue: {event.venue or 'TBA'} | Total Attendees: {len(event.attendances)}"
    elements.append(Paragraph(event_info, styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Table data
    data = [['#', 'Name', 'Email', 'Contact', 'Status', 'Registered']]
    for i, a in enumerate(event.attendances, 1):
        data.append([
            str(i),
            a.attendee.name or '',
            a.attendee.email or '',
            a.attendee.contact or '—',
            a.attendee.status or '',
            a.timestamp.strftime('%Y-%m-%d %H:%M') if a.timestamp else ''
        ])
    
    # Create table with styling
    table = Table(data, colWidths=[0.4*inch, 1.3*inch, 1.8*inch, 1.1*inch, 0.8*inch, 1.2*inch])
    table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#06b6d4')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        
        # Data rows
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f9fafb')),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#1f2937')),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        
        # Alternating row colors
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#ffffff'), colors.HexColor('#f3f4f6')]),
        
        # Grid
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),  # Center the # column
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    elements.append(table)
    
    # Footer
    elements.append(Spacer(1, 30))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#9ca3af')
    )
    elements.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", footer_style))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    
    return send_file(
        buffer,
        mimetype='application/pdf',
        download_name=f"event_{event_id}_attendees.pdf"
    )

def generate_qr_code_base64(data):
    """Generate a QR code and return as base64 string."""
    if not QRCODE_AVAILABLE:
        return None
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="#06b6d4", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return base64.b64encode(buffer.getvalue()).decode('utf-8')


def send_confirmation_email(attendee, event, attendance=None):
    """Send a styled confirmation email with QR code if SMTP is configured.
    Falls back to console log when not configured.
    """
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', 0) or 0)
    smtp_user = os.environ.get('SMTP_USER')
    smtp_pass = os.environ.get('SMTP_PASS')
    
    subject = f"🎉 You're confirmed for {event.name}!"
    
    # Format event datetime nicely
    event_date = event.datetime.strftime('%A, %B %d, %Y') if event.datetime else 'TBA'
    event_time = event.datetime.strftime('%I:%M %p') if event.datetime else 'TBA'
    end_time = event.end_datetime.strftime('%I:%M %p') if event.end_datetime else None
    time_display = f"{event_time} - {end_time}" if end_time else event_time
    
    # Plain text version
    plain_body = f"""Hi {attendee.name},

You're all set! Your RSVP for "{event.name}" has been confirmed.

EVENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Date: {event_date}
⏰ Time: {time_display}
📍 Venue: {event.venue or 'TBA'}

We're excited to see you there!

— The ATTENDEEZ Team
"""

    # HTML version with styling (email-compatible)
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header with cyan accent -->
                    <tr>
                        <td style="background-color: #06b6d4; padding: 30px 40px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">ATTENDEEZ</h1>
                        </td>
                    </tr>
                    
                    <!-- Success Icon & Message -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <table role="presentation" align="center" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="width: 70px; height: 70px; background-color: #dcfce7; border-radius: 50%; text-align: center; vertical-align: middle;">
                                        <span style="font-size: 32px; line-height: 70px; color: #22c55e;">✓</span>
                                    </td>
                                </tr>
                            </table>
                            <h2 style="margin: 20px 0 8px; font-size: 24px; font-weight: 600; color: #111827;">You're All Set, {attendee.name}!</h2>
                            <p style="margin: 0; font-size: 16px; color: #6b7280;">Your RSVP has been confirmed</p>
                        </td>
                    </tr>
                    
                    <!-- Event Card -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <table role="presentation" width="100%" style="background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h3 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #06b6d4;">{event.name}</h3>
                                        
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="padding: 10px 0;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td style="width: 40px; height: 40px; background-color: #e0f2fe; border-radius: 8px; text-align: center; vertical-align: middle;">
                                                                <span style="font-size: 18px; line-height: 40px;">📅</span>
                                                            </td>
                                                            <td style="padding-left: 14px;">
                                                                <p style="margin: 0; font-size: 12px; color: #6b7280;">Date</p>
                                                                <p style="margin: 2px 0 0; font-size: 15px; font-weight: 500; color: #111827;">{event_date}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td style="width: 40px; height: 40px; background-color: #e0f2fe; border-radius: 8px; text-align: center; vertical-align: middle;">
                                                                <span style="font-size: 18px; line-height: 40px;">⏰</span>
                                                            </td>
                                                            <td style="padding-left: 14px;">
                                                                <p style="margin: 0; font-size: 12px; color: #6b7280;">Time</p>
                                                                <p style="margin: 2px 0 0; font-size: 15px; font-weight: 500; color: #111827;">{time_display}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td style="width: 40px; height: 40px; background-color: #e0f2fe; border-radius: 8px; text-align: center; vertical-align: middle;">
                                                                <span style="font-size: 18px; line-height: 40px;">📍</span>
                                                            </td>
                                                            <td style="padding-left: 14px;">
                                                                <p style="margin: 0; font-size: 12px; color: #6b7280;">Venue</p>
                                                                <p style="margin: 2px 0 0; font-size: 15px; font-weight: 500; color: #111827;">{event.venue or 'To be announced'}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
"""

    # Add QR code section if attendance has a token
    qr_section = ""
    qr_image_data = None
    if attendance and attendance.check_in_token:
        qr_image_data = generate_qr_code_base64(attendance.check_in_token)
        qr_section = """
                    <!-- QR Code Section -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <table role="presentation" width="100%" style="background-color: #f0fdfa; border-radius: 12px; border: 2px dashed #06b6d4;">
                                <tr>
                                    <td style="padding: 24px; text-align: center;">
                                        <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #0891b2;">🎟️ YOUR CHECK-IN QR CODE</p>
                                        <img src="cid:qrcode" alt="Check-in QR Code" width="180" height="180" style="width: 180px; height: 180px; border-radius: 8px; border: 1px solid #e5e7eb;">
                                        <p style="margin: 16px 0 0; font-size: 13px; color: #6b7280;">Present this QR code at the event for quick check-in</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
"""

    html_body += qr_section
    html_body += """
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                            <p style="margin: 0 0 8px; font-size: 14px; color: #374151;">We're excited to see you there! 🎉</p>
                            <p style="margin: 0; font-size: 12px; color: #6b7280;">— The ATTENDEEZ Team</p>
                        </td>
                    </tr>
                </table>
                
                <!-- Legal Footer -->
                <table role="presentation" width="100%" style="max-width: 600px; margin-top: 24px;">
                    <tr>
                        <td style="text-align: center;">
                            <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                                You received this email because you registered for an event on ATTENDEEZ.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

    if smtp_host and smtp_port and smtp_user and smtp_pass:
        try:
            # Use multipart/related to embed images with CID
            msg = MIMEMultipart('related')
            msg['Subject'] = subject
            msg['From'] = f"ATTENDEEZ <{smtp_user}>"
            msg['To'] = attendee.email
            
            # Create alternative part for plain text and HTML
            msg_alternative = MIMEMultipart('alternative')
            msg.attach(msg_alternative)
            
            # Attach both plain text and HTML versions
            part1 = MIMEText(plain_body, 'plain')
            part2 = MIMEText(html_body, 'html')
            msg_alternative.attach(part1)
            msg_alternative.attach(part2)
            
            # Attach QR code image if available
            if qr_image_data:
                qr_image = MIMEImage(base64.b64decode(qr_image_data), name='qrcode.png')
                qr_image.add_header('Content-ID', '<qrcode>')
                qr_image.add_header('Content-Disposition', 'inline', filename='qrcode.png')
                msg.attach(qr_image)

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as smtp:
                smtp.starttls()
                smtp.login(smtp_user, smtp_pass)
                smtp.sendmail(smtp_user, attendee.email, msg.as_string())
            app.logger.info(f"Confirmation email sent to {attendee.email}")
        except Exception as e:
            app.logger.warning(f"Failed to send email: {e}")
    else:
        # not configured — print to console for development
        print(f"[EMAIL] To: {attendee.email}\nSubject: {subject}\n\n{plain_body}")


@app.route('/search_attendee')
def search_attendee():
    term = request.args.get('q', '')
    if not term:
        return {'results': []}
    like = f"%{term}%"
    matches = Attendee.query.filter(Attendee.name.ilike(like)).limit(10).all()
    data = [{'id':a.id,'name':a.name,'email':a.email,'contact':a.contact,'status':a.status} for a in matches]
    return {'results': data}


@app.route('/api/events')
def api_events():
    events = Event.query.order_by(Event.datetime.asc()).all()
    data = []
    for e in events:
        # Handle both Supabase URLs and local file paths
        poster_url = None
        if e.poster:
            if e.poster.startswith('http'):
                poster_url = e.poster
            else:
                poster_url = url_for('static', filename='uploads/' + e.poster)
        data.append({
            'id': e.id,
            'name': e.name,
            'description': e.description,
            'datetime': e.datetime.isoformat() if e.datetime else None,
            'end_datetime': e.end_datetime.isoformat() if e.end_datetime else None,
            'venue': e.venue,
            'poster': poster_url
        })
    return jsonify(data)


@app.route('/api/stats')
def api_stats():
    """Return platform statistics - total events and attendees."""
    total_events = Event.query.count()
    total_attendees = Attendee.query.count()
    total_rsvps = Attendance.query.count()
    return jsonify({
        'total_events': total_events,
        'total_attendees': total_attendees,
        'total_rsvps': total_rsvps
    })


@app.route('/api/events/<int:event_id>')
def api_event_detail(event_id):
    e = Event.query.get_or_404(event_id)
    # Handle both Supabase URLs and local file paths
    poster_url = None
    if e.poster:
        if e.poster.startswith('http'):
            poster_url = e.poster
        else:
            poster_url = url_for('static', filename='uploads/' + e.poster)
    data = {
        'id': e.id,
        'name': e.name,
        'description': e.description,
        'datetime': e.datetime.isoformat() if e.datetime else None,
        'end_datetime': e.end_datetime.isoformat() if e.end_datetime else None,
        'venue': e.venue,
        'poster': poster_url
    }
    return jsonify(data)


@app.route('/api/rsvp', methods=['POST'])
def api_rsvp():
    try:
        payload = request.get_json() or {}
        event_id = payload.get('event_id')
        if not event_id:
            return jsonify({'error':'event_id required'}), 400
        event = Event.query.get_or_404(int(event_id))
        
        attendee = None
        email = payload.get('email')
        attendee_id = payload.get('attendee_id')
        
        # If attendee_id provided, try to load them
        if attendee_id:
            attendee = Attendee.query.get(int(attendee_id))
            if attendee:
                attendee.name = payload.get('name', attendee.name)
                attendee.email = payload.get('email', attendee.email)
                attendee.contact = payload.get('contact', attendee.contact)
                attendee.status = payload.get('status', attendee.status)
        
        # If no attendee yet, try to find by email or create new
        if not attendee and email:
            attendee = Attendee.query.filter_by(email=email).first()
            if attendee:
                # Update existing attendee's info
                attendee.name = payload.get('name', attendee.name)
                attendee.contact = payload.get('contact', attendee.contact)
                attendee.status = payload.get('status', attendee.status)
            else:
                # Create new attendee
                attendee = Attendee(
                    name=payload.get('name'),
                    email=email,
                    contact=payload.get('contact'),
                    status=payload.get('status')
                )
                db.session.add(attendee)
        
        if not attendee:
            return jsonify({'error': 'email or attendee_id required'}), 400
        
        # Flush to ensure attendee has an ID
        db.session.flush()
        
        # Check if already registered for this event
        existing_attendance = Attendance.query.filter_by(
            event_id=int(event_id),
            attendee_id=attendee.id
        ).first()
        if existing_attendance:
            return jsonify({'error': 'You have already registered for this event!'}), 400
        
        # Create attendance record
        attendance = Attendance(event_id=event.id, attendee_id=attendee.id)
        attendance.generate_token()  # Generate unique QR token
        db.session.add(attendance)
        db.session.commit()
        
        try:
            send_confirmation_email(attendee, event, attendance)
        except Exception as email_err:
            app.logger.warning(f"Email failed but API RSVP succeeded: {email_err}")
        
        return jsonify({'success': True, 'attendance_id': attendance.id})
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"API RSVP error: {e}")
        return jsonify({'error': 'An error occurred. Please try again.'}), 500

# Create tables on startup (for Vercel serverless)
try:
    with app.app_context():
        db.create_all()
except Exception as e:
    print(f"Database init error: {e}")

# Global error handler for debugging (REMOVE IN PRODUCTION)
@app.errorhandler(500)
def handle_500(e):
    import traceback
    error_traceback = traceback.format_exc()
    return f"""
    <h1>Internal Server Error</h1>
    <h2>Error: {str(e)}</h2>
    <h3>Traceback:</h3>
    <pre>{error_traceback}</pre>
    """, 500

if __name__ == '__main__':
    app.run(debug=True)
