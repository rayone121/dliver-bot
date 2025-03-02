import sqlite3

def init_db():
    conn = sqlite3.connect('sms_messages.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INT PRIMARY KEY,
            thread_id INT,
            phone_number TEXT,
            body TEXT,
            date INT
        )
    ''')
    conn.commit()
    conn.close()

def check_table_exists():
    conn = sqlite3.connect("sms_messages.db")
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='messages';")
    table_exists = cursor.fetchone() is not None
    conn.close()
    return table_exists

def store_sms(sms_list):
    conn = sqlite3.connect('sms_messages.db')
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM messages')
    existing_ids = set(row[0] for row in cursor.fetchall())

    for sms in sms_list:
        if sms['id'] not in existing_ids:
            cursor.execute('''
                INSERT INTO messages (id, thread_id, phone_number, body, date)
                VALUES (?, ?, ?, ?, ?)
            ''', (sms['id'], sms['thread_id'], sms['phone_number'], sms['body'], sms['date']))

    conn.commit()
    conn.close()

def get_lastID():
    try:
        conn = sqlite3.connect('sms_messages.db')
        cursor = conn.cursor()
        cursor.execute('SELECT MAX(id) FROM messages')
        last_id = cursor.fetchone()[0]
        conn.close()
        return last_id if last_id is not None else 0
    except:
        return 0