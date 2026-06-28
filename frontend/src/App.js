import React, { useState } from 'react';

const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const PLAYER = 1;
const AI = 2;

function createBoard() {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
}

function App() {
  const [board, setBoard] = useState(createBoard());
  const [gameOver, setGameOver] = useState(false);
  const [status, setStatus] = useState('Your turn!');
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [moveLog, setMoveLog] = useState([]);
  const [aiLevel, setAiLevel] = useState('Med');
  const [aiStyle, setAiStyle] = useState('Balanced');
  const [aiDifficulty, setAiDifficulty] = useState(40);
  const [history, setHistory] = useState([]);
  const [hint, setHint] = useState(null);

  const checkWinner = (b, piece) => {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS - 3; c++)
        if ([0,1,2,3].every(i => b[r][c+i] === piece)) return true;
    for (let r = 0; r < ROWS - 3; r++)
      for (let c = 0; c < COLS; c++)
        if ([0,1,2,3].every(i => b[r+i][c] === piece)) return true;
    for (let r = 0; r < ROWS - 3; r++)
      for (let c = 0; c < COLS - 3; c++)
        if ([0,1,2,3].every(i => b[r+i][c+i] === piece)) return true;
    for (let r = 3; r < ROWS; r++)
      for (let c = 0; c < COLS - 3; c++)
        if ([0,1,2,3].every(i => b[r-i][c+i] === piece)) return true;
    return false;
  };

  const getDepth = () => {
    if (aiLevel === 'Easy') return 2;
    if (aiLevel === 'Med') return 4;
    return 6;
  };

  const dropPiece = async (col) => {
    if (gameOver) return;
    setHint(null);

    const newBoard = board.map(r => [...r]);
    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newBoard[r][col] === EMPTY) { row = r; break; }
    }
    if (row === -1) return;

    setHistory(h => [...h, board.map(r => [...r])]);
    newBoard[row][col] = PLAYER;
    setBoard(newBoard);
    setMoveLog(l => [`P1: Col ${col + 1}`, ...l].slice(0, 10));

    if (checkWinner(newBoard, PLAYER)) {
      setStatus('🎉 You win!');
      setScores(s => ({ ...s, player: s.player + 1 }));
      setGameOver(true);
      return;
    }

    setStatus('AI is thinking...');

    // Update AI style based on player column preference
    const colCounts = Array(COLS).fill(0);
    newBoard.forEach(r => r.forEach((cell, c) => { if (cell === PLAYER) colCounts[c]++; }));
    const maxCol = colCounts.indexOf(Math.max(...colCounts));
    const centre = Math.floor(COLS / 2);
    if (Math.abs(maxCol - centre) <= 1) setAiStyle('Aggressive');
    else setAiStyle('Defensive');
    setAiDifficulty(aiLevel === 'Easy' ? 25 : aiLevel === 'Med' ? 55 : 85);

    try {
      const res = await fetch('http://localhost:5000/api/game/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: newBoard, player: AI, depth: getDepth() })
      });
      const data = await res.json();
      const aiCol = data.column;

      const aiBoard = newBoard.map(r => [...r]);
      let aiRow = -1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (aiBoard[r][aiCol] === EMPTY) { aiRow = r; break; }
      }
      aiBoard[aiRow][aiCol] = AI;
      setBoard(aiBoard);
      setMoveLog(l => [`AI: Col ${aiCol + 1}`, ...l].slice(0, 10));

      if (checkWinner(aiBoard, AI)) {
        setStatus('AI wins! Better luck next time.');
        setScores(s => ({ ...s, ai: s.ai + 1 }));
        setGameOver(true);
      } else {
        setStatus('Your turn!');
      }
    } catch {
      setStatus('Your turn! (AI offline)');
    }
  };

  const undoMove = () => {
    if (history.length < 2) return;
    const prev = history[history.length - 2];
    setBoard(prev);
    setHistory(h => h.slice(0, -2));
    setMoveLog(l => l.slice(2));
    setGameOver(false);
    setStatus('Your turn!');
  };

  const resetGame = () => {
    setBoard(createBoard());
    setGameOver(false);
    setStatus('Your turn!');
    setMoveLog([]);
    setHistory([]);
    setHint(null);
  };

  const showHint = () => {
    const valid = [];
    for (let c = 0; c < COLS; c++) {
      if (board[0][c] === EMPTY) valid.push(c);
    }
    if (valid.length > 0) {
      const h = valid[Math.floor(valid.length / 2)];
      setHint(h);
      setTimeout(() => setHint(null), 2000);
    }
  };

  const cellColor = (cell, r, c) => {
    if (hint === c && cell === EMPTY) return '#ffd700';
    if (cell === PLAYER) return '#ff6b6b';
    if (cell === AI) return '#888888';
    return '#1a1a2e';
  };

  return (
    <div style={{ fontFamily: 'Arial', background: '#1a1a2e', minHeight: '100vh', color: 'white' }}>

      {/* HEADER */}
      <div style={{ background: '#16213e', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e94560' }}>
        <h2 style={{ margin: 0, color: '#e94560' }}>Connect Four</h2>
        <button onClick={resetGame} style={{ padding: '8px 16px', background: '#e94560', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          New Game / Settings
        </button>
      </div>

      <div style={{ padding: '16px', maxWidth: '900px', margin: '0 auto' }}>

        {/* PLAYER INFO */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ background: '#16213e', border: '2px solid #ff6b6b', borderRadius: '10px', padding: '12px 24px', textAlign: 'center', minWidth: '160px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#ff6b6b', border: '3px solid white' }} />
              <strong>Player 1</strong>
            </div>
            <div style={{ fontSize: '12px', color: '#aaa', margin: '4px 0' }}>● Your turn</div>
            <div style={{ color: '#ff6b6b', fontWeight: 'bold' }}>WINS: {scores.player}</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#aaa' }}>VS</div>
            <div style={{ fontSize: '14px', color: status.includes('thinking') ? '#ffd700' : '#aaa', marginTop: '4px' }}>{status}</div>
          </div>

          <div style={{ background: '#16213e', border: '2px solid #888', borderRadius: '10px', padding: '12px 24px', textAlign: 'center', minWidth: '160px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#888', border: '3px solid white' }} />
              <strong>Player 2</strong>
            </div>
            <div style={{ fontSize: '12px', color: '#aaa', margin: '4px 0' }}>AI Opponent · awaiting</div>
            <div style={{ color: '#888', fontWeight: 'bold' }}>WINS: {scores.ai}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>

          {/* GAME BOARD */}
          <div style={{ flex: 1 }}>
            {/* Column numbers */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
              {Array(COLS).fill(0).map((_, c) => (
                <div key={c} style={{ width: '60px', textAlign: 'center', fontSize: '12px', color: '#aaa', margin: '0 4px' }}>C{c+1}</div>
              ))}
            </div>

            <div style={{ display: 'inline-block', background: '#2563eb', padding: '8px', borderRadius: '10px' }}>
              {board.map((row, r) => (
                <div key={r} style={{ display: 'flex' }}>
                  {row.map((cell, c) => (
                    <div key={c} style={{ display: 'flex', alignItems: 'center' }}>
                      <div
                        onClick={() => dropPiece(c)}
                        style={{
                          width: '56px', height: '56px', margin: '3px',
                          borderRadius: '50%', cursor: gameOver ? 'default' : 'pointer',
                          background: cellColor(cell, r, c),
                          border: hint === c && cell === EMPTY ? '3px solid #ffd700' : '2px solid #1e40af',
                          transition: 'background 0.2s',
                          boxShadow: cell !== EMPTY ? 'inset 0 -3px 6px rgba(0,0,0,0.3)' : 'none'
                        }}
                      />
                      <div style={{ fontSize: '10px', color: '#aaa', width: '12px', textAlign: 'center' }}>{r+1}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* AI FEEDBACK */}
            <div style={{ background: '#16213e', border: '1px solid #2563eb', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontWeight: 'bold', color: '#4ecdc4', marginBottom: '8px' }}>AI Adaptive Feedback</div>
              <div style={{ fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#aaa' }}>AI Behaviour Style (play): </span>
                <span style={{ background: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{aiStyle}</span>
              </div>
              <div style={{ fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#aaa' }}>Difficulty: </span>
                <div style={{ background: '#333', borderRadius: '4px', height: '10px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ background: '#2563eb', width: `${aiDifficulty}%`, height: '100%', borderRadius: '4px', transition: 'width 0.5s' }} />
                </div>
                <span style={{ fontSize: '11px', color: '#aaa' }}>{aiLevel === 'Easy' ? 'LOW' : aiLevel === 'Med' ? 'MED-HIGH' : 'HIGH'}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#ffd700' }}>⚡ AI adapting to counter your Col 3</div>
            </div>

            {/* GAME CONTROLS */}
            <div style={{ background: '#16213e', border: '1px solid #333', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Game Controls</div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <button onClick={undoMove} style={{ flex: 1, padding: '6px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>↩ Undo</button>
                <button onClick={resetGame} style={{ flex: 1, padding: '6px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>↺ Restart</button>
                <button onClick={showHint} style={{ flex: 1, padding: '6px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>💡 Hint</button>
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>AI Level:</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['Easy', 'Med', 'High'].map(l => (
                  <button key={l} onClick={() => setAiLevel(l)} style={{ flex: 1, padding: '5px', background: aiLevel === l ? '#e94560' : '#333', color: 'white', border: '1px solid #555', borderRadius: '20px', cursor: 'pointer', fontSize: '11px', fontWeight: aiLevel === l ? 'bold' : 'normal' }}>{l}</button>
                ))}
              </div>
            </div>

            {/* MOVE HISTORY */}
            <div style={{ background: '#16213e', border: '1px solid #333', borderRadius: '10px', padding: '12px', flex: 1 }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Move Log</div>
              <div style={{ fontSize: '12px', color: '#aaa', maxHeight: '150px', overflowY: 'auto' }}>
                {moveLog.length === 0 && <div>No moves yet.</div>}
                {moveLog.map((m, i) => (
                  <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #222', color: m.startsWith('P1') ? '#ff6b6b' : '#888' }}>{m}</div>
                ))}
                <div style={{ color: '#555', marginTop: '4px', fontSize: '11px' }}>Scroll log – shows last 10 moves</div>
              </div>
            </div>

          </div>
        </div>

        {/* LEGEND */}
        <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '13px', color: '#aaa' }}>
          <span>Legend:</span>
          <span><span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', background: '#ff6b6b', verticalAlign: 'middle', marginRight: '4px' }}/>Player 1</span>
          <span><span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', background: '#888', verticalAlign: 'middle', marginRight: '4px' }}/>AI Player 2</span>
          <span><span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', background: '#ffd700', verticalAlign: 'middle', marginRight: '4px' }}/>Hint / Winner</span>
        </div>

      </div>
    </div>
  );
}

export default App;