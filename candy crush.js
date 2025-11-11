const board = document.getElementById("board");
const scoreDisplay = document.getElementById("score");

const width = 8;
const candies = ["red", "yellow", "orange", "green", "blue", "purple"];
let squares = [];
let score = 0;

// ======= Crear el tablero =======
function createBoard() {
  for (let i = 0; i < width * width; i++) {
    const square = document.createElement("div");
    // Eliminamos drag HTML5 (no usado en móvil)
    // square.setAttribute("draggable", true);
    square.setAttribute("id", i);
    square.classList.add("candy");

    const randomColor = candies[Math.floor(Math.random() * candies.length)];
    square.style.backgroundColor = randomColor;

    board.appendChild(square);
    squares.push(square);
  }
}
createBoard();

// ================================
//   DnD con Pointer Events (PC+Móvil)
// ================================
board.style.touchAction = "none";
board.style.userSelect = "none";
board.style.webkitUserSelect = "none";

let dragging = false;
let activePointerId = null;
let startIdx = null;     // índice inicial (0..63)
let hoverIdx = null;     // índice actual bajo el puntero

function getTileIndexFromPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  const tile = el.closest(".candy");
  if (!tile || !board.contains(tile)) return null;
  return parseInt(tile.id, 10);
}

function isAdjacent(i, j) {
  if (i == null || j == null) return false;
  const r1 = Math.floor(i / width), c1 = i % width;
  const r2 = Math.floor(j / width), c2 = j % width;
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

function swapColors(i, j) {
  const a = squares[i];
  const b = squares[j];
  const ca = a.style.backgroundColor;
  const cb = b.style.backgroundColor;
  a.style.backgroundColor = cb;
  b.style.backgroundColor = ca;
}

function clearHoverHighlight() {
  if (hoverIdx != null) squares[hoverIdx].classList.remove("hover");
  hoverIdx = null;
}

board.addEventListener("pointerdown", (e) => {
  const idx = getTileIndexFromPoint(e.clientX, e.clientY);
  if (idx == null) return;
  e.preventDefault();

  try { board.setPointerCapture(e.pointerId); } catch { }
  dragging = true;
  activePointerId = e.pointerId;
  startIdx = idx;

  squares[startIdx].classList.add("dragging");
  clearHoverHighlight();
});

window.addEventListener("pointermove", (e) => {
  if (!dragging || e.pointerId !== activePointerId) return;
  e.preventDefault();

  const idx = getTileIndexFromPoint(e.clientX, e.clientY);
  if (idx == null || idx === startIdx) {
    clearHoverHighlight();
    return;
  }

  if (isAdjacent(startIdx, idx)) {
    if (hoverIdx !== idx) {
      clearHoverHighlight();
      hoverIdx = idx;
      squares[hoverIdx].classList.add("hover");
    }
  } else {
    clearHoverHighlight();
  }
}, { passive: false });

function finishPointer(e) {
  if (!dragging || (activePointerId !== null && e.pointerId !== activePointerId)) return;
  e.preventDefault();

  const endIdx = (hoverIdx != null && isAdjacent(startIdx, hoverIdx)) ? hoverIdx : null;
  if (endIdx != null) {
    // Igual que tu lógica original: si es adyacente, hacemos swap visual.
    swapColors(startIdx, endIdx);
  }
  // limpiar estado
  squares[startIdx]?.classList.remove("dragging");
  clearHoverHighlight();
  dragging = false;
  startIdx = null;
  activePointerId = null;

  try { board.releasePointerCapture(e.pointerId); } catch { }
}

window.addEventListener("pointerup", finishPointer, { passive: false });
window.addEventListener("pointercancel", finishPointer, { passive: false });
window.addEventListener("lostpointercapture", finishPointer, { passive: false });

// ================================
//   Lógica de juego (tu misma)
// ================================

// Revisa filas de 3
function checkRowForThree() {
  for (let i = 0; i < 61; i++) {
    const rowOfThree = [i, i + 1, i + 2];
    const decidedColor = squares[i].style.backgroundColor;
    const isBlank = decidedColor === "";

    const notValid = [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55];
    if (notValid.includes(i)) continue;

    if (rowOfThree.every(index => squares[index].style.backgroundColor === decidedColor && !isBlank)) {
      score += 30;
      scoreDisplay.textContent = score;
      rowOfThree.forEach(index => squares[index].style.backgroundColor = "");
    }
  }
}

// Revisa columnas de 3
function checkColumnForThree() {
  for (let i = 0; i < 47; i++) {
    const columnOfThree = [i, i + width, i + width * 2];
    const decidedColor = squares[i].style.backgroundColor;
    const isBlank = decidedColor === "";

    if (columnOfThree.every(index => squares[index].style.backgroundColor === decidedColor && !isBlank)) {
      score += 30;
      scoreDisplay.textContent = score;
      columnOfThree.forEach(index => squares[index].style.backgroundColor = "");
    }
  }
}

// Dejar caer caramelos vacíos
function moveDown() {
  for (let i = 0; i < 55; i++) {
    if (squares[i + width].style.backgroundColor === "") {
      squares[i + width].style.backgroundColor = squares[i].style.backgroundColor;
      squares[i].style.backgroundColor = "";
      if (i < width && squares[i].style.backgroundColor === "") {
        const randomColor = candies[Math.floor(Math.random() * candies.length)];
        squares[i].style.backgroundColor = randomColor;
      }
    }
  }
}

// Bucle del juego
window.setInterval(function () {
  moveDown();
  checkRowForThree();
  checkColumnForThree();
}, 150);
