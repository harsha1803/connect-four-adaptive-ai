import sqlite3
import json
from datetime import datetime

DATABASE = 'game_data.db'

def init_db():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Table to store each game session
    c.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            start_time TEXT,
            end_time TEXT,
            result TEXT,
            total_moves INTEGER,
            ai_level TEXT
        )
    ''')
    
    # Table to store every single move
    c.execute('''
        CREATE TABLE IF NOT EXISTS moves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER,
            move_number INTEGER,
            player TEXT,
            column_chosen INTEGER,
            timestamp TEXT,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
    ''')
    
    # Table to store player behaviour patterns
    c.execute('''
        CREATE TABLE IF NOT EXISTS player_behaviour (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER,
            column_frequency TEXT,
            dominant_column INTEGER,
            play_style TEXT,
            win_rate REAL,
            timestamp TEXT
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialised successfully!")

def start_session(ai_level='Med'):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''
        INSERT INTO sessions (start_time, result, total_moves, ai_level)
        VALUES (?, ?, ?, ?)
    ''', (datetime.now().isoformat(), 'ongoing', 0, ai_level))
    session_id = c.lastrowid
    conn.commit()
    conn.close()
    return session_id

def record_move(session_id, move_number, player, column):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''
        INSERT INTO moves (session_id, move_number, player, column_chosen, timestamp)
        VALUES (?, ?, ?, ?, ?)
    ''', (session_id, move_number, player, column, datetime.now().isoformat()))
    conn.commit()
    conn.close()

def end_session(session_id, result, total_moves):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''
        UPDATE sessions
        SET end_time = ?, result = ?, total_moves = ?
        WHERE id = ?
    ''', (datetime.now().isoformat(), result, total_moves, session_id))
    conn.commit()
    conn.close()

def record_behaviour(session_id, col_frequency, dominant_col, play_style, win_rate):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''
        INSERT INTO player_behaviour 
        (session_id, column_frequency, dominant_column, play_style, win_rate, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (session_id, json.dumps(col_frequency), dominant_col, 
          play_style, win_rate, datetime.now().isoformat()))
    conn.commit()
    conn.close()

def get_player_stats():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''
        SELECT result, COUNT(*) as count 
        FROM sessions 
        WHERE result != 'ongoing'
        GROUP BY result
    ''')
    stats = c.fetchall()
    conn.close()
    return stats

def get_all_moves(session_id):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''
        SELECT move_number, player, column_chosen, timestamp
        FROM moves
        WHERE session_id = ?
        ORDER BY move_number
    ''', (session_id,))
    moves = c.fetchall()
    conn.close()
    return moves

if __name__ == '__main__':
    init_db()