\# Connect Four — Adaptive AI

\*\*MSc Advanced Computer Science with Software Engineering\*\*

\*\*Student:\*\* Harshavardhan Mulavagili | \*\*Reg No:\*\* 202665279

\*\*Supervisor:\*\* Mr. Andrew Fagan | \*\*University of Strathclyde\*\*



\## Project Overview

An adaptive AI opponent for Connect Four that uses Minimax algorithm with Alpha-beta pruning and player behaviour modelling to dynamically adjust its strategy based on how the human plays.



\## Tech Stack

\- \*\*Frontend:\*\* React (port 3000)

\- \*\*Backend:\*\* Node.js + Express (port 5000)

\- \*\*AI Engine:\*\* Python + Flask — Minimax + Alpha-beta pruning (port 5001)



\## Features

\- 6x7 Connect Four game board

\- Adaptive AI with Easy / Medium / High difficulty

\- Player behaviour tracking and move log

\- AI style detection (Aggressive / Defensive)

\- Undo, Restart, and Hint controls



\## How to Run

\*\*Terminal 1 — Backend:\*\*

cd backend

node index.js



\*\*Terminal 2 — AI Engine:\*\*

cd ai-engine

venv\\Scripts\\Activate.ps1

python adaptive\_ai.py



\*\*Terminal 3 — Frontend:\*\*

cd frontend

npm start



Then open http://localhost:3000

