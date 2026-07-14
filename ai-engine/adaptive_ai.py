from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from database import init_db, start_session, record_move, end_session, record_behaviour, get_player_stats

app = Flask(__name__)
CORS(app)

ROWS = 6
COLS = 7
PLAYER = 1
AI = 2

# Initialise database on startup
init_db()

# Current session tracking
current_session = {'id': None, 'move_number': 0, 'player_moves': []}

def create_board():
    return np.zeros((ROWS, COLS), dtype=int)

def is_valid_location(board, col):
    return board[0][col] == 0

def get_next_open_row(board, col):
    for r in range(ROWS-1, -1, -1):
        if board[r][col] == 0:
            return r

def drop_piece(board, row, col, piece):
    board[row][col] = piece

def winning_move(board, piece):
    for c in range(COLS-3):
        for r in range(ROWS):
            if all(board[r][c+i] == piece for i in range(4)):
                return True
    for c in range(COLS):
        for r in range(ROWS-3):
            if all(board[r+i][c] == piece for i in range(4)):
                return True
    for c in range(COLS-3):
        for r in range(ROWS-3):
            if all(board[r+i][c+i] == piece for i in range(4)):
                return True
    for c in range(COLS-3):
        for r in range(3, ROWS):
            if all(board[r-i][c+i] == piece for i in range(4)):
                return True
    return False

def score_position(board, piece):
    score = 0
    centre = [int(i) for i in list(board[:, COLS//2])]
    score += centre.count(piece) * 3
    for r in range(ROWS):
        row_array = [int(i) for i in list(board[r,:])]
        for c in range(COLS-3):
            window = row_array[c:c+4]
            score += evaluate_window(window, piece)
    for c in range(COLS):
        col_array = [int(i) for i in list(board[:,c])]
        for r in range(ROWS-3):
            window = col_array[r:r+4]
            score += evaluate_window(window, piece)
    return score

def evaluate_window(window, piece):
    score = 0
    opp = PLAYER if piece == AI else AI
    if window.count(piece) == 4:
        score += 100
    elif window.count(piece) == 3 and window.count(0) == 1:
        score += 5
    elif window.count(piece) == 2 and window.count(0) == 2:
        score += 2
    if window.count(opp) == 3 and window.count(0) == 1:
        score -= 4
    return score

def is_terminal_node(board):
    return winning_move(board, PLAYER) or winning_move(board, AI) or len(get_valid_locations(board)) == 0

def get_valid_locations(board):
    return [c for c in range(COLS) if is_valid_location(board, c)]

def minimax(board, depth, alpha, beta, maximising):
    valid_locations = get_valid_locations(board)
    terminal = is_terminal_node(board)

    if terminal:
        if winning_move(board, AI):
            return (None, 100000)
        elif winning_move(board, PLAYER):
            return (None, -100000)
        else:
            return (None, 0)

    if depth == 0:
        return (None, score_position(board, AI))

    if maximising:
        value = -np.inf
        best_col = valid_locations[0]
        for col in valid_locations:
            row = get_next_open_row(board, col)
            temp_board = board.copy()
            drop_piece(temp_board, row, col, AI)
            new_score = minimax(temp_board, depth-1, alpha, beta, False)[1]
            if new_score > value:
                value = new_score
                best_col = col
            alpha = max(alpha, value)
            if alpha >= beta:
                break
        return best_col, value
    else:
        value = np.inf
        best_col = valid_locations[0]
        for col in valid_locations:
            row = get_next_open_row(board, col)
            temp_board = board.copy()
            drop_piece(temp_board, row, col, PLAYER)
            new_score = minimax(temp_board, depth-1, alpha, beta, True)[1]
            if new_score < value:
                value = new_score
                best_col = col
            beta = min(beta, value)
            if alpha >= beta:
                break
        return best_col, value

player_history = []

def get_adaptive_depth():
    if len(player_history) < 5:
        return 4
    recent = player_history[-5:]
    win_rate = recent.count('win') / 5
    if win_rate > 0.6:
        return 6
    elif win_rate < 0.3:
        return 3
    return 4

def analyse_player_behaviour():
    moves = current_session['player_moves']
    if not moves:
        return [0]*COLS, 3, 'Balanced'
    col_freq = [0]*COLS
    for m in moves:
        col_freq[m] += 1
    dominant_col = col_freq.index(max(col_freq))
    centre = COLS // 2
    if abs(dominant_col - centre) <= 1:
        style = 'Aggressive'
    else:
        style = 'Defensive'
    return col_freq, dominant_col, style

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'AI engine is running!'})

@app.route('/ai/start_session', methods=['POST'])
def start_new_session():
    data = request.json
    ai_level = data.get('ai_level', 'Med')
    session_id = start_session(ai_level)
    current_session['id'] = session_id
    current_session['move_number'] = 0
    current_session['player_moves'] = []
    return jsonify({'session_id': session_id, 'message': 'Session started'})

@app.route('/ai/move', methods=['POST'])
def ai_move():
    data = request.json
    board_list = data.get('board')
    player_col = data.get('player_column')
    board = np.array(board_list, dtype=int)

    # Record player move
    if player_col is not None and current_session['id']:
        current_session['move_number'] += 1
        current_session['player_moves'].append(player_col)
        record_move(
            current_session['id'],
            current_session['move_number'],
            'player',
            player_col
        )

    depth = get_adaptive_depth()
    col, score = minimax(board, depth, -np.inf, np.inf, True)

    # Record AI move
    if current_session['id']:
        current_session['move_number'] += 1
        record_move(
            current_session['id'],
            current_session['move_number'],
            'ai',
            int(col)
        )

    # Analyse behaviour
    col_freq, dominant_col, style = analyse_player_behaviour()
    if current_session['id']:
        wins = player_history.count('win')
        total = len(player_history) if player_history else 1
        record_behaviour(
            current_session['id'],
            col_freq,
            dominant_col,
            style,
            wins/total
        )

    return jsonify({
        'column': int(col),
        'score': int(score),
        'depth': depth,
        'player_style': style,
        'dominant_column': dominant_col
    })

@app.route('/ai/result', methods=['POST'])
def record_result():
    data = request.json
    result = data.get('result')
    player_history.append(result)

    if current_session['id']:
        end_session(
            current_session['id'],
            result,
            current_session['move_number']
        )

    return jsonify({'message': 'Result recorded', 'history': player_history})

@app.route('/ai/stats', methods=['GET'])
def get_stats():
    stats = get_player_stats()
    return jsonify({'stats': stats})

if __name__ == '__main__':
    print("Starting AI engine on http://localhost:5001")
    app.run(port=5001, debug=False)