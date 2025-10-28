const board = document.getElementById("board");
const scoreDisplay = document.getElementById("score");

const width = 8;
const candies = ["red", "yellow", "orange", "green", "blue", "purple"];
let squares = [];
let score = 0;

// Crear el tablero
function createBoard() {
  for (let i = 0; i < width * width; i++) {
    const square = document.createElement("div");
    square.setAttribute("draggable", true);
    square.setAttribute("id", i);
    let randomColor = candies[Math.floor(Math.random() * candies.length)];
    square.style.backgroundColor = randomColor;
    square.classList.add("candy");
    board.appendChild(square);
    squares.push(square);
  }
}

createBoard();

// Variables de arrastre
let colorBeingDragged;
let colorBeingReplaced;
let squareIdBeingDragged;
let squareIdBeingReplaced;

// Eventos drag and drop
squares.forEach(square => square.addEventListener("dragstart", dragStart));
squares.forEach(square => square.addEventListener("dragover", e => e.preventDefault()));
squares.forEach(square => square.addEventListener("dragenter", e => e.preventDefault()));
squares.forEach(square => square.addEventListener("drop", dragDrop));
squares.forEach(square => square.addEventListener("dragend", dragEnd));

function dragStart() {
  colorBeingDragged = this.style.backgroundColor;
  squareIdBeingDragged = parseInt(this.id);
}

function dragDrop() {
  colorBeingReplaced = this.style.backgroundColor;
  squareIdBeingReplaced = parseInt(this.id);
  squares[squareIdBeingDragged].style.backgroundColor = colorBeingReplaced;
  squares[squareIdBeingReplaced].style.backgroundColor = colorBeingDragged;
}

function dragEnd() {
  const validMoves = [
    squareIdBeingDragged - 1,
    squareIdBeingDragged - width,
    squareIdBeingDragged + 1,
    squareIdBeingDragged + width
  ];
  const validMove = validMoves.includes(squareIdBeingReplaced);

  if (squareIdBeingReplaced && validMove) {
    squareIdBeingReplaced = null;
  } else if (squareIdBeingReplaced != null) {
    squares[squareIdBeingDragged].style.backgroundColor = colorBeingDragged;
    squares[squareIdBeingReplaced].style.backgroundColor = colorBeingReplaced;
  }
}

// Revisa filas de 3
function checkRowForThree() {
  for (let i = 0; i < 61; i++) {
    let rowOfThree = [i, i + 1, i + 2];
    let decidedColor = squares[i].style.backgroundColor;
    const isBlank = decidedColor === "";

    const notValid = [6,7,14,15,22,23,30,31,38,39,46,47,54,55];
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
    let columnOfThree = [i, i + width, i + width * 2];
    let decidedColor = squares[i].style.backgroundColor;
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
        let randomColor = candies[Math.floor(Math.random() * candies.length)];
        squares[i].style.backgroundColor = randomColor;
      }
    }
  }
}

// Bucle del juego
window.setInterval(function() {
  moveDown();
  checkRowForThree();
  checkColumnForThree();
}, 150);
