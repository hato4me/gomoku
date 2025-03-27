const boardSize = 15;
let board = [];
let currentPlayer = 1;
let gameOver = false;
let moveHistory = [];
let undoCount = 3;
const letters = "ABCDEFGHIJKLMNO";

const boardDiv = document.getElementById("board");
const statusP = document.getElementById("status");
const moveLog = document.getElementById("move-log");
const undoCountSpan = document.getElementById("undo-count");

function initBoard() {
  board = Array.from({ length: boardSize }, () => Array(boardSize).fill(0));
  boardDiv.innerHTML = "";
  moveLog.innerHTML = "";
  moveHistory = [];
  undoCount = 3;
  undoCountSpan.textContent = undoCount;
  currentPlayer = 1;
  gameOver = false;
  statusP.textContent = "あなたの番です。";
  drawCoordinates();

  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.addEventListener("click", handlePlayerMove);
      boardDiv.appendChild(cell);
    }
  }
}

function drawCoordinates() {
  const coordTop = document.getElementById("coordinate-top");
  const coordLeft = document.getElementById("coordinate-left");
  coordTop.innerHTML = '<span></span>';
  coordLeft.innerHTML = "";
  for (let i = 0; i < boardSize; i++) {
    const topSpan = document.createElement("span");
    topSpan.textContent = letters[i];
    coordTop.appendChild(topSpan);

    const leftSpan = document.createElement("span");
    leftSpan.textContent = i + 1;
    coordLeft.appendChild(leftSpan);
  }
}

function handlePlayerMove(e) {
  if (gameOver || currentPlayer !== 1) return;
  const x = +e.target.dataset.x;
  const y = +e.target.dataset.y;
  if (board[y][x] !== 0) return;
  placeStone(x, y, 1);
  moveHistory.push({ x, y, player: 1 });
  addMoveLog("あなた", x, y);
  if (checkWin(x, y, 1)) {
    statusP.textContent = "あなたの勝ち！";
    gameOver = true;
    return;
  }
  currentPlayer = 2;
  statusP.textContent = "CPUの番です...";
  setTimeout(cpuMove, 100);
}

function placeStone(x, y, player) {
  board[y][x] = player;
  const index = y * boardSize + x;
  const cell = boardDiv.children[index];
  cell.classList.add(player === 1 ? "black" : "white");
}

function checkWin(x, y, player) {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  for (const [dx, dy] of dirs) {
    let count = 1;
    for (let d = -1; d <= 1; d += 2) {
      let nx = x, ny = y;
      while (true) {
        nx += dx * d;
        ny += dy * d;
        if (nx >= 0 && ny >= 0 && nx < boardSize && ny < boardSize && board[ny][nx] === player) {
          count++;
        } else break;
      }
    }
    if (count >= 5) return true;
  }
  return false;
}

function cpuMove() {
  const level = +document.getElementById("difficulty").value;
  let move;
  if (level === 6) move = patternAI();
  else if (level === 5) move = scoreBasedAI();
  else if (level === 3) move = smartMove();
  else if (level === 2) move = defensiveMove();
  else move = randomMove();
  const [x, y] = move;
  placeStone(x, y, 2);
  moveHistory.push({ x, y, player: 2 });
  addMoveLog("CPU", x, y);
  if (checkWin(x, y, 2)) {
    statusP.textContent = "CPUの勝ち！";
    gameOver = true;
    return;
  }
  currentPlayer = 1;
  statusP.textContent = "あなたの番です。";
}

function addMoveLog(who, x, y) {
  const entry = document.createElement("li");
  entry.textContent = `${who}：${letters[x]}${y + 1}`;
  moveLog.appendChild(entry);
}

function undoMove() {
  if (undoCount === 0 || gameOver || moveHistory.length < 2) return;
  for (let i = 0; i < 2; i++) {
    const move = moveHistory.pop();
    if (!move) continue;
    board[move.y][move.x] = 0;
    const index = move.y * boardSize + move.x;
    boardDiv.children[index].classList.remove("black", "white");
    moveLog.lastChild?.remove();
  }
  currentPlayer = 1;
  undoCount--;
  undoCountSpan.textContent = undoCount;
  statusP.textContent = "待ったを使いました。あなたの番です。";
}

function resetGame() {
  initBoard();
}

function scoreBasedAI() {
  let best = null, bestScore = -Infinity;
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board[y][x] !== 0) continue;
      let score = 0;
      score += evaluatePosition(x, y, 2) * 1.1;
      score += evaluatePosition(x, y, 1);
      const center = Math.floor(boardSize / 2);
      score -= (Math.abs(x - center) + Math.abs(y - center)) * 0.1;
      if (score > bestScore) {
        bestScore = score;
        best = [x, y];
      }
    }
  }
  return best;
}

function evaluatePosition(x, y, player) {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  let score = 0;
  for (const [dx, dy] of dirs) {
    let count = 0;
    for (let i = 1; i < 5; i++) {
      const nx = x + dx * i, ny = y + dy * i;
      if (nx < 0 || ny < 0 || nx >= boardSize || ny >= boardSize) break;
      if (board[ny][nx] === player) count++;
      else break;
    }
    score += Math.pow(10, count);
  }
  return score;
}

function patternAI() {
  const patterns = [
    { regex: /2222_/, score: 10000 },
    { regex: /_1111/, score: 9000 },
    { regex: /222_2/, score: 8000 },
    { regex: /_111_/, score: 7000 },
    { regex: /22_22/, score: 6000 },
  ];
  let bestMove = null, bestScore = -Infinity;
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board[y][x] !== 0) continue;
      board[y][x] = 2;
      let score = 0;
      for (const [dx, dy] of [[1,0],[0,1],[1,1],[1,-1]]) {
        let line = "";
        for (let i = -4; i <= 4; i++) {
          const nx = x + dx * i, ny = y + dy * i;
          if (nx < 0 || ny < 0 || nx >= boardSize || ny >= boardSize) line += "9";
          else line += board[ny][nx];
        }
        for (const { regex, score: s } of patterns) {
          if (regex.test(line)) score += s;
        }
      }
      board[y][x] = 0;
      if (score > bestScore) {
        bestScore = score;
        bestMove = [x, y];
      }
    }
  }
  return bestMove || centerBiasMove();
}

function randomMove() {
  const empty = [];
  for (let y = 0; y < boardSize; y++)
    for (let x = 0; x < boardSize; x++)
      if (board[y][x] === 0) empty.push([x, y]);
  return empty[Math.floor(Math.random() * empty.length)];
}

function defensiveMove() {
  const block = findWinningMove(1);
  return block || randomMove();
}

function smartMove() {
  return findWinningMove(2) || findWinningMove(1) || centerBiasMove();
}

function findWinningMove(player) {
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board[y][x] === 0) {
        board[y][x] = player;
        const win = checkWin(x, y, player);
        board[y][x] = 0;
        if (win) return [x, y];
      }
    }
  }
  return null;
}

function centerBiasMove() {
  const center = Math.floor(boardSize / 2);
  let best = null, bestScore = Infinity;
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board[y][x] === 0) {
        const score = Math.abs(x - center) + Math.abs(y - center);
        if (score < bestScore) {
          best = [x, y];
          bestScore = score;
        }
      }
    }
  }
  return best;
}

initBoard();
