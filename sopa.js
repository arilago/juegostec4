let nivel = 1;
const nivelSpan = document.getElementById("nivel");
const sopaDiv = document.getElementById("sopa");
const palabrasSpan = document.getElementById("palabras");
const mensaje = document.getElementById("mensaje");

// Palabras por nivel
const listaPalabras = [
  ["SOL","LUNA"],
  ["GATO","PERRO","RATA"],
  ["CASA","ARBOL","NUBE","FLOR"]
];

let palabrasActuales = [];
let seleccion = [];
let seleccionActiva = false;
let encontradas = [];

function generarSopa(n) {
  sopaDiv.innerHTML = "";
  mensaje.textContent = "";
  nivelSpan.textContent = n;

  palabrasActuales = listaPalabras[n-1] || ["FIN"];
  encontradas = [];
  seleccion = [];

  palabrasSpan.textContent = palabrasActuales.join(", ");

  // tamaño de la sopa
  let size = 6 + n*2;
  let grid = Array.from({length:size}, () => Array(size).fill("."));

  // colocar palabras horizontalmente
  palabrasActuales.forEach((p, idx) => {
    let fila = (idx*2) % size;
    for (let i=0; i<p.length; i++) {
      grid[fila][i] = p[i];
    }
  });

  // llenar espacios vacíos
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let f=0; f<size; f++) {
    for (let c=0; c<size; c++) {
      if (grid[f][c] === ".") grid[f][c] = letras[Math.floor(Math.random()*letras.length)];
    }
  }

  // mostrar en pantalla
  grid.forEach((fila, filaIdx) => {
    const row = document.createElement("div");
    fila.forEach((letra, colIdx) => {
      const span = document.createElement("span");
      span.textContent = letra + " ";
      span.dataset.fila = filaIdx;
      span.dataset.col = colIdx;
      span.style.cursor = "pointer";
      span.style.padding = "2px";
      span.style.display = "inline-block";
      span.onmousedown = iniciarSeleccion;
      span.onmouseover = arrastrarSeleccion;
      span.onmouseup = terminarSeleccion;
      row.appendChild(span);
    });
    sopaDiv.appendChild(row);
  });
}

function iniciarSeleccion(e) {
  seleccionActiva = true;
  e.target.style.backgroundColor = "#ffb6c1";
  seleccion.push(e.target);
}

function arrastrarSeleccion(e) {
  if (!seleccionActiva) return;
  if (!seleccion.includes(e.target)) {
    e.target.style.backgroundColor = "#ffb6c1";
    seleccion.push(e.target);
  }
}

function terminarSeleccion(e) {
  seleccionActiva = false;
  const palabraFormada = seleccion.map(span => span.textContent.trim()).join("");
  
  if (palabrasActuales.includes(palabraFormada) && !encontradas.includes(palabraFormada)) {
    encontradas.push(palabraFormada);
    mensaje.textContent = `✅ Encontraste: ${palabraFormada}`;
    seleccion.forEach(span => span.style.backgroundColor = "#80d4ff"); // marcar encontrada
  } else {
    seleccion.forEach(span => span.style.backgroundColor = ""); // resetear si no coincide
  }

  seleccion = [];

  if (encontradas.length === palabrasActuales.length) {
    mensaje.textContent = "🎉 ¡Nivel superado!";
    nivel++;
    setTimeout(() => generarSopa(nivel), 1500);
  }
}

// iniciar nivel 1
generarSopa(nivel);
