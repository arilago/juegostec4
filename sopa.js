let nivel = 1;
const nivelSpan = document.getElementById("nivel");
const sopaDiv = document.getElementById("sopa");
const palabrasSpan = document.getElementById("palabras");
const mensaje = document.getElementById("mensaje");

// Palabras por nivel
const listaPalabras = [
  ["SOL", "LUNA"],
  ["GATO", "PERRO", "RATA"],
  ["CASA", "ARBOL", "NUBE", "FLOR"]
];

let palabrasActuales = [];
let seleccion = [];
let seleccionActiva = false;
let encontradas = [];

// Helpers de selección
function marcar(span) {
  if (!seleccion.includes(span)) {
    span.style.backgroundColor = "#ffb6c1";
    seleccion.push(span);
  }
}

function celdaDesdePunto(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  if (el.dataset && el.dataset.fila !== undefined) return el;
  // si el punto cae en un hijo (raro), subimos al padre
  return el.closest && el.closest('[data-fila]') ? el.closest('[data-fila]') : null;
}

function iniciarSeleccionDesdeElemento(el) {
  seleccionActiva = true;
  seleccion = [];
  marcar(el);
}

function terminarSeleccion() {
  seleccionActiva = false;
  const palabraFormada = seleccion.map(span => span.textContent.trim()).join("");

  if (palabrasActuales.includes(palabraFormada) && !encontradas.includes(palabraFormada)) {
    encontradas.push(palabraFormada);
    mensaje.textContent = `✅ Encontraste: ${palabraFormada}`;
    seleccion.forEach(span => span.style.backgroundColor = "#80d4ff");
  } else {
    seleccion.forEach(span => span.style.backgroundColor = "");
  }
  seleccion = [];

  if (encontradas.length === palabrasActuales.length) {
    mensaje.textContent = "🎉 ¡Nivel superado!";
    nivel++;
    setTimeout(() => generarSopa(nivel), 1500);
  }
}

function generarSopa(n) {
  sopaDiv.innerHTML = "";
  mensaje.textContent = "";
  nivelSpan.textContent = n;

  palabrasActuales = listaPalabras[n - 1] || ["FIN"];
  encontradas = [];
  seleccion = [];

  palabrasSpan.textContent = palabrasActuales.join(", ");

  // tamaño de la sopa
  let size = 6 + n * 2;
  let grid = Array.from({ length: size }, () => Array(size).fill("."));

  // colocar palabras horizontalmente
  palabrasActuales.forEach((p, idx) => {
    const fila = (idx * 2) % size;
    for (let i = 0; i < p.length && i < size; i++) {
      grid[fila][i] = p[i];
    }
  });

  // llenar espacios vacíos
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let f = 0; f < size; f++) {
    for (let c = 0; c < size; c++) {
      if (grid[f][c] === ".") grid[f][c] = letras[Math.floor(Math.random() * letras.length)];
    }
  }

  // calcular tamaño de celda según pantalla
  const anchoDisponible = Math.min(window.innerWidth, sopaDiv.clientWidth || window.innerWidth) - 16;
  const cellSize = Math.max(32, Math.floor(anchoDisponible / (size + 1))); // mínimo 32px

  // mostrar en pantalla
  grid.forEach((fila, filaIdx) => {
    const row = document.createElement("div");
    row.style.whiteSpace = "nowrap";
    fila.forEach((letra, colIdx) => {
      const span = document.createElement("span");
      span.textContent = letra;
      span.dataset.fila = filaIdx;
      span.dataset.col = colIdx;
      span.style.display = "inline-flex";
      span.style.alignItems = "center";
      span.style.justifyContent = "center";
      span.style.width = cellSize + "px";
      span.style.height = cellSize + "px";
      span.style.fontSize = Math.floor(cellSize * 0.6) + "px";
      span.style.border = "1px solid #ccc";
      span.style.boxSizing = "border-box";
      span.style.cursor = "pointer";
      span.style.borderRadius = "6px";
      span.style.margin = "2px";
      span.style.userSelect = "none";
      row.appendChild(span);
    });
    sopaDiv.appendChild(row);
  });

  // Pointer Events (móvil y PC)
  // Iniciar selección
  sopaDiv.addEventListener("pointerdown", (e) => {
    const el = celdaDesdePunto(e.clientX, e.clientY);
    if (!el) return;
    e.preventDefault();
    iniciarSeleccionDesdeElemento(el);
  });

  // Arrastrar mientras está activo
  sopaDiv.addEventListener("pointermove", (e) => {
    if (!seleccionActiva) return;
    const el = celdaDesdePunto(e.clientX, e.clientY);
    if (el) marcar(el);
  });

  // Soltar
  const finalizar = () => { if (seleccionActiva) terminarSeleccion(); };
  sopaDiv.addEventListener("pointerup", finalizar);
  sopaDiv.addEventListener("pointercancel", finalizar);
  sopaDiv.addEventListener("pointerleave", finalizar);
}

// iniciar nivel 1
generarSopa(nivel);

// Opcional: vuelve a dibujar si cambian dimensiones (ej. rotación)
window.addEventListener("resize", () => {
  // conservamos nivel actual y regeneramos
  generarSopa(nivel);
});
