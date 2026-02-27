from datetime import datetime, timedelta
from app import db, Event, Attendee, Attendance, app

with app.app_context():
    # clear existing
    db.drop_all()
    db.create_all()

    # create sample events
    now = datetime.utcnow()
    e1 = Event(name='Global Tech Summit 2026', description='A full-day tech conference.', datetime=now + timedelta(days=20, hours=9), end_datetime=now + timedelta(days=20, hours=17), venue='Convention Center, NYC')
    e2 = Event(name='Design Systems Workshop', description='Hands-on design systems course.', datetime=now + timedelta(days=30, hours=10), end_datetime=now + timedelta(days=30, hours=16), venue='Creative Studio, London')
    e3 = Event(name='Startup Networking Night', description='Meet founders and investors.', datetime=now + timedelta(days=10, hours=18), end_datetime=now + timedelta(days=10, hours=21), venue='Innovation Hub, Berlin')
    db.session.add_all([e1,e2,e3])
    db.session.commit()

    # create an attendee and a previous attendance to demonstrate returning filtering
    a1 = Attendee(name='Jane Doe', email='jane@example.com', contact='+1234567890', status='Working')
    db.session.add(a1)
    db.session.commit()

    att = Attendance(event=e3, attendee=a1)
    db.session.add(att)
    db.session.commit()

    print('Sample data created: 3 events, 1 attendee with one attendance')
