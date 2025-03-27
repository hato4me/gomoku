const boardSize = 15;
let board = [];
let currentPlayer = 1; // 1: user, 2: CPU
let gameOver = false;

const boardDiv = document.getElementById("board");
const statusP = document.getElementById("status");

function initBoard() {
  board = Array.from({ length: boardSize }, () => Array(boardSize).fill(0));
  boardDiv.innerHTML = "";
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
  currentPlayer = 1;
  gameOver = false;
  statusP.textContent = "あなたの番です。";
}

function handlePlayerMove(e) {
  if (gameOver || currentPlayer !== 1) return;

  const x = +e.target.dataset.x;
  const y = +e.target.dataset.y;
  if (board[y][x] !== 0) return;

  makeMove(x, y, 1);
  if (checkWin(x, y, 1)) {
    statusP.textContent = "あなたの勝ち！";
    gameOver = true;
    return;
  }

  currentPlayer = 2;
  statusP.textContent = "CPUの番です...";
  setTimeout(() => {
    cpuMove();
  }, 300);
}

function makeMove(x, y, player) {
  board[y][x] = player;
  const index = y * boardSize + x;
  const cell = boardDiv.children[index];
  cell.classList.add(player === 1 ? "black" : "white");
}

function checkWin(x, y, player) {
  const directions = [
    [1, 0], [0, 1], [1, 1], [1, -1]
  ];
  for (const [dx, dy] of directions) {
    let count = 1;
    for (let dir = -1; dir <= 1; dir += 2) {
      let nx = x, ny = y;
      while (true) {
        nx += dx * dir;
        ny += dy * dir;
        if (
          nx >= 0 && ny >= 0 &&
          nx < boardSize && ny < boardSize &&
          board[ny][nx] === player
        ) {
          count++;
        } else {
          break;
        }
      }
    }
    if (count >= 5) return true;
  }
  return false;
}

function cpuMove() {
  const level = +document.getElementById("difficulty").value;
  const [x, y] = cpuStrategy(level);
  makeMove(x, y, 2);
  if (checkWin(x, y, 2)) {
    statusP.textContent = "CPUの勝ち！";
    gameOver = true;
    return;
  }
  currentPlayer = 1;
  statusP.textContent = "あなたの番です。";
}

function cpuStrategy(level) {
  if (level === 1) return randomMove();
  if (level === 2) return defensiveMove();
  return smartMove();
}

function randomMove() {
  const empty = [];
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board[y][x] === 0) empty.push([x, y]);
    }
  }
  return empty[Math.floor(Math.random() * empty.length)];
}

function defensiveMove() {
  const block = findWinningMove(1);
  return block || randomMove();
}

function smartMove() {
  return (
    findWinningMove(2) ||
    findWinningMove(1) ||
    centerBiasMove()
  );
}

function findWinningMove(player) {
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board[y][x] === 0) {
        board[y][x] = player;
        if (checkWin(x, y, player)) {
          board[y][x] = 0;
          return [x, y];
        }
        board[y][x] = 0;
      }
    }
  }
  return null;
}

function centerBiasMove() {
  const center = Math.floor(boardSize / 2);
  let best = null;
  let bestScore = Infinity;
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

function resetGame() {
  initBoard();
}

initBoard();
