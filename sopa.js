let nivel = 1;
const nivelSpan = document.getElementById("nivel");
const sopaDiv = document.getElementById("sopa");
const palabrasSpan = document.getElementById("palabras");
const mensaje = document.getElementById("mensaje");

const listaPalabras = [
  ["SOL", "LUNA"],
  ["GATO", "PERRO", "RATA"],
  ["CASA", "ARBOL", "NUBE", "FLOR"]
];

let palabrasActuales = [];
let encontradas = [];

let grid = [];                // guardamos la grilla de letras
let size = 0;

// Estado de selección
let seleccionActiva = false;
let start = null;             // {fila, col}
let end = null;               // {fila, col}
let celdasMarcadas = [];      // spans actualmente resaltados

function limpiarMarcado() {
  celdasMarcadas.forEach(s => s.style.backgroundColor = "");
  celdasMarcadas = [];
}

function marcarRangoFila(fila, c1, c2, color = "#ffb6c1") {
  const [minC, maxC] = [Math.min(c1, c2), Math.max(c1, c2)];
  limpiarMarcado();
  for (let c = minC; c <= maxC; c++) {
    const span = document.querySelector(`span[data-fila="${fila}"][data-col="${c}"]`);
    if (span) {
      span.style.backgroundColor = color;
      celdasMarcadas.push(span);
    }
  }
}

function palabraEnFila(fila, c1, c2) {
  const [minC, maxC] = [Math.min(c1, c2), Math.max(c1, c2)];
  let s = "";
  for (let c = minC; c <= maxC; c++) s += grid[fila][c];
  return s;
}

function finalizarSeleccion() {
  if (!seleccionActiva || !start || !end) {
    seleccionActiva = false;
    limpiarMarcado();
    return;
  }

  // Solo aceptamos misma fila
  if (start.fila === end.fila && start.col !== end.col) {
    const palabra = palabraEnFila(start.fila, start.col, end.col);
    const inversa = palabra.split("").reverse().join("");

    let encontrada = null;
    for (const p of palabrasActuales) {
      if (!encontradas.includes(p) && (p === palabra || p === inversa)) {
        encontrada = p;
        break;
      }
    }

    if (encontrada) {
      encontradas.push(encontrada);
      mensaje.textContent = `✅ Encontraste: ${encontrada}`;
      // congelamos el color de encontrada
      celdasMarcadas.forEach(s => s.style.backgroundColor = "#80d4ff");
      celdasMarcadas = []; // vaciamos porque ya quedaron pintadas
    } else {
      limpiarMarcado();
    }

    if (encontradas.length === palabrasActuales.length) {
      mensaje.textContent = "🎉 ¡Nivel superado!";
      nivel++;
      setTimeout(() => generarSopa(nivel), 1200);
    }
  } else {
    // no válida (otra fila o una sola celda)
    limpiarMarcado();
  }

  seleccionActiva = false;
  start = null;
  end = null;
}

function coordDesdePuntero(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return null;
  const celda = el.closest && el.closest("[data-fila][data-col]");
  if (!celda) return null;
  return {
    fila: Number(celda.dataset.fila),
    col: Number(celda.dataset.col),
    el: celda
  };
}

function generarSopa(n) {
  sopaDiv.innerHTML = "";
  mensaje.textContent = "";
  nivelSpan.textContent = n;

  palabrasActuales = listaPalabras[n - 1] || ["FIN"];
  encontradas = [];
  palabrasSpan.textContent = palabrasActuales.join(", ");

  size = 6 + n * 2;
  grid = Array.from({ length: size }, () => Array(size).fill("."));

  // colocar palabras horizontalmente
  palabrasActuales.forEach((p, idx) => {
    const fila = (idx * 2) % size;
    for (let i = 0; i < p.length && i < size; i++) {
      grid[fila][i] = p[i];
    }
  });

  // llenar vacíos
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let f = 0; f < size; f++) {
    for (let c = 0; c < size; c++) {
      if (grid[f][c] === ".") grid[f][c] = letras[Math.floor(Math.random() * letras.length)];
    }
  }

  // calcular tamaño de celda
  const anchoDisponible = Math.min(window.innerWidth, sopaDiv.clientWidth || window.innerWidth) - 16;
  const cellSize = Math.max(32, Math.floor(anchoDisponible / (size + 1)));

  // render
  for (let f = 0; f < size; f++) {
    const row = document.createElement("div");
    row.style.whiteSpace = "nowrap";
    for (let c = 0; c < size; c++) {
      const span = document.createElement("span");
      span.textContent = grid[f][c];
      span.dataset.fila = f;
      span.dataset.col = c;
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
    }
    sopaDiv.appendChild(row);
  }

  // ——— Eventos Pointer con captura ———
  // Bloqueamos menú de contexto (long-press)
  sopaDiv.addEventListener("contextmenu", (e) => e.preventDefault());

  sopaDiv.addEventListener("pointerdown", (e) => {
    const pt = coordDesdePuntero(e.clientX, e.clientY);
    if (!pt) return;
    e.preventDefault();

    // Capturamos el puntero para no perder eventos aunque salga del elemento
    try { e.target.setPointerCapture(e.pointerId); } catch { }

    seleccionActiva = true;
    start = { fila: pt.fila, col: pt.col };
    end = { fila: pt.fila, col: pt.col };
    marcarRangoFila(start.fila, start.col, end.col, "#ffb6c1");
  });

  sopaDiv.addEventListener("pointermove", (e) => {
    if (!seleccionActiva) return;
    const pt = coordDesdePuntero(e.clientX, e.clientY);
    if (!pt) return;

    // Solo permitimos la misma fila
    if (pt.fila === start.fila) {
      end = { fila: pt.fila, col: pt.col };
      marcarRangoFila(start.fila, start.col, end.col, "#ffb6c1");
    }
  });

  const upHandler = () => finalizarSeleccion();
  window.addEventListener("pointerup", upHandler, { once: true }); // una vez por ciclo de selección
}

// iniciar
generarSopa(nivel);

// Recalcular en resize/rotación
window.addEventListener("resize", () => generarSopa(nivel));
