"""Migration script to add columns for multi-user authentication system."""
import sqlite3
import os
import uuid

basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'attendly.db')

if not os.path.exists(db_path):
    print("Database not found. It will be created when app starts.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if user table exists and create it if not
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user'")
    if not cursor.fetchone():
        cursor.execute('''
            CREATE TABLE user (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(120) UNIQUE NOT NULL,
                password_hash VARCHAR(256) NOT NULL,
                reset_token VARCHAR(100),
                reset_token_expiry DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print('Created user table')
    else:
        print('user table already exists')
        # Check if reset_token columns exist
        cursor.execute('PRAGMA table_info(user)')
        user_columns = [col[1] for col in cursor.fetchall()]
        if 'reset_token' not in user_columns:
            cursor.execute('ALTER TABLE user ADD COLUMN reset_token VARCHAR(100)')
            print('Added reset_token column to user')
        else:
            print('reset_token column already exists in user')
        if 'reset_token_expiry' not in user_columns:
            cursor.execute('ALTER TABLE user ADD COLUMN reset_token_expiry DATETIME')
            print('Added reset_token_expiry column to user')
        else:
            print('reset_token_expiry column already exists in user')
        
        # Add profile fields to user table
        if 'username' not in user_columns:
            cursor.execute('ALTER TABLE user ADD COLUMN username VARCHAR(64) UNIQUE')
            print('Added username column to user')
        else:
            print('username column already exists in user')
        if 'profile_picture' not in user_columns:
            cursor.execute('ALTER TABLE user ADD COLUMN profile_picture VARCHAR(500)')
            print('Added profile_picture column to user')
        else:
            print('profile_picture column already exists in user')
        if 'bio' not in user_columns:
            cursor.execute('ALTER TABLE user ADD COLUMN bio TEXT')
            print('Added bio column to user')
        else:
            print('bio column already exists in user')
        if 'phone' not in user_columns:
            cursor.execute('ALTER TABLE user ADD COLUMN phone VARCHAR(20)')
            print('Added phone column to user')
        else:
            print('phone column already exists in user')
    
    # Get existing columns for event table
    cursor.execute('PRAGMA table_info(event)')
    event_columns = [col[1] for col in cursor.fetchall()]
    print('Event table columns:', event_columns)
    
    # Add creator_id to event table
    if 'creator_id' not in event_columns:
        cursor.execute('ALTER TABLE event ADD COLUMN creator_id INTEGER')
        print('Added creator_id column to event')
    else:
        print('creator_id column already exists in event')
    
    # Add passcode to event table
    if 'passcode' not in event_columns:
        cursor.execute('ALTER TABLE event ADD COLUMN passcode VARCHAR(50)')
        # Generate passcodes for existing events
        cursor.execute('SELECT id FROM event WHERE passcode IS NULL')
        events = cursor.fetchall()
        for event in events:
            passcode = uuid.uuid4().hex[:8].upper()
            cursor.execute('UPDATE event SET passcode = ? WHERE id = ?', (passcode, event[0]))
        print(f'Added passcode column and generated passcodes for {len(events)} existing events')
    else:
        print('passcode column already exists in event')
    
    # Get existing columns for attendance table
    cursor.execute('PRAGMA table_info(attendance)')
    attendance_columns = [col[1] for col in cursor.fetchall()]
    print('Attendance table columns:', attendance_columns)
    
    # Add user_id to attendance table
    if 'user_id' not in attendance_columns:
        cursor.execute('ALTER TABLE attendance ADD COLUMN user_id INTEGER')
        print('Added user_id column to attendance')
    else:
        print('user_id column already exists in attendance')
    
    # Add new columns if they don't exist (original migration)
    if 'checked_in' not in attendance_columns:
        cursor.execute('ALTER TABLE attendance ADD COLUMN checked_in BOOLEAN DEFAULT 0')
        print('Added checked_in column')
    else:
        print('checked_in column already exists')
    
    if 'check_in_time' not in attendance_columns:
        cursor.execute('ALTER TABLE attendance ADD COLUMN check_in_time DATETIME')
        print('Added check_in_time column')
    else:
        print('check_in_time column already exists')
    
    if 'check_in_token' not in attendance_columns:
        cursor.execute('ALTER TABLE attendance ADD COLUMN check_in_token VARCHAR(64)')
        print('Added check_in_token column')
        # Generate tokens for existing records
        cursor.execute('SELECT id FROM attendance WHERE check_in_token IS NULL')
        rows = cursor.fetchall()
        for row in rows:
            token = uuid.uuid4().hex
            cursor.execute('UPDATE attendance SET check_in_token = ? WHERE id = ?', (token, row[0]))
        print(f'Generated tokens for {len(rows)} existing attendance records')
    else:
        print('check_in_token column already exists')
    
    conn.commit()
    conn.close()
    print('Migration complete!')
