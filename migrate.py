"""Migration script to add check-in columns to attendance table."""
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
    
    # Get existing columns
    cursor.execute('PRAGMA table_info(attendance)')
    columns = [col[1] for col in cursor.fetchall()]
    print('Current columns:', columns)
    
    # Add new columns if they don't exist
    if 'checked_in' not in columns:
        cursor.execute('ALTER TABLE attendance ADD COLUMN checked_in BOOLEAN DEFAULT 0')
        print('Added checked_in column')
    else:
        print('checked_in column already exists')
    
    if 'check_in_time' not in columns:
        cursor.execute('ALTER TABLE attendance ADD COLUMN check_in_time DATETIME')
        print('Added check_in_time column')
    else:
        print('check_in_time column already exists')
    
    if 'check_in_token' not in columns:
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
