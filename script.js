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
  coordTop.innerHTML = "";
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
  setTimeout(cpuMove, 300);
}

function placeStone(x, y, player) {
  board[y][x] = player;
  const index = y * boardSize + x;
  const cell = boardDiv.children[index];
  cell.classList.add(player === 1 ? "black" : "white");
}

function checkWin(x, y, player) {
  const directions = [[1,0],[0,1],[1,1],[1,-1]];
  for (const [dx, dy] of directions) {
    let count = 1;
    for (let dir = -1; dir <= 1; dir += 2) {
      let nx = x, ny = y;
      while (true) {
        nx += dx * dir;
        ny += dy * dir;
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
  const [x, y] = (level === 4 ? minimaxRoot(2) : level === 3 ? smartMove() : level === 2 ? defensiveMove() : randomMove());
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

// 既存AI（ランダム/防御/攻防/ミニマックス）※省略可能
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

function minimaxRoot(depth) {
  let bestScore = -Infinity, bestMove = null;
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board[y][x] === 0) {
        board[y][x] = 2;
        const score = minimax(depth - 1, false);
        board[y][x] = 0;
        if (score > bestScore) {
          bestScore = score;
          bestMove = [x, y];
        }
      }
    }
  }
  return bestMove;
}

function minimax(depth, isMax) {
  const score = evaluateBoard();
  if (depth === 0) return score;

  if (isMax) {
    let maxEval = -Infinity;
    for (let y = 0; y < boardSize; y++)
      for (let x = 0; x < boardSize; x++)
        if (board[y][x] === 0) {
          board[y][x] = 2;
          maxEval = Math.max(maxEval, minimax(depth - 1, false));
          board[y][x] = 0;
        }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let y = 0; y < boardSize; y++)
      for (let x = 0; x < boardSize; x++)
        if (board[y][x] === 0) {
          board[y][x] = 1;
          minEval = Math.min(minEval, minimax(depth - 1, true));
          board[y][x] = 0;
        }
    return minEval;
  }
}

function evaluateBoard() {
  let score = 0;
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      for (const [dx, dy] of dirs) {
        let count2 = 0, count1 = 0;
        for (let i = 0; i < 4; i++) {
          const nx = x + dx * i, ny = y + dy * i;
          if (nx < boardSize && ny < boardSize) {
            if (board[ny][nx] === 2) count2++;
            if (board[ny][nx] === 1) count1++;
          }
        }
        if (count2 > 0 && count1 === 0) score += Math.pow(10, count2);
        if (count1 > 0 && count2 === 0) score -= Math.pow(10, count1);
      }
    }
  }
  return score;
}

initBoard();
