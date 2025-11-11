// =========================
// SOPA DE LETRAS - JS (arrastre robusto)
// =========================

(function ensureViewportMeta() {
  if (!document.querySelector('meta[name="viewport"]')) {
    const m = document.createElement('meta');
    m.name = 'viewport';
    m.content = 'width=device-width, initial-scale=1, maximum-scale=1';
    document.head.appendChild(m);
  }
})();

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
let grid = [];
let size = 0;

// Estado de selección
let seleccionActiva = false;
let activePointerId = null;
let start = null;            // {fila, col}
let end = null;              // {fila, col}
let celdasMarcadas = [];     // spans actualmente resaltados

// Estilos base del tablero (independiente de CSS externo)
sopaDiv.style.margin = "0 auto";
sopaDiv.style.touchAction = "none";
sopaDiv.style.userSelect = "none";
sopaDiv.style.webkitUserSelect = "none";

const BOARD_MAX_PX = 640;  // ancho máximo visible del tablero
const MIN_CELL = 28;       // tamaño mínimo de celda
const MAX_CELL = 46;       // tamaño máximo de celda

let listenersReady = false;

// ------- Helpers de pintado -------
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

// ------- Selección / Validación -------
function finalizarSeleccion() {
  if (!seleccionActiva || !start || !end) {
    resetSeleccion();
    return;
  }

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
      celdasMarcadas.forEach(s => s.style.backgroundColor = "#80d4ff");
      celdasMarcadas = [];
    } else {
      limpiarMarcado();
    }

    if (encontradas.length === palabrasActuales.length) {
      mensaje.textContent = "🎉 ¡Nivel superado!";
      nivel++;
      setTimeout(() => generarSopa(nivel), 1200);
    }
  } else {
    limpiarMarcado();
  }

  resetSeleccion();
}

function resetSeleccion() {
  seleccionActiva = false;
  activePointerId = null;
  start = null;
  end = null;
}

function coordDesdePuntero(clientX, clientY) {
  // Buscamos la celda bajo el punto actual; si hay huecos, closest sube al span correcto
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

// ------- Medición robusta del ancho -------
function medirAnchoTablero() {
  let w = sopaDiv.getBoundingClientRect().width;
  if (!w || w <= 0) {
    const safe = Math.min(window.innerWidth - 16, BOARD_MAX_PX);
    sopaDiv.style.maxWidth = BOARD_MAX_PX + "px";
    sopaDiv.style.width = "100%";
    w = Math.min(safe, BOARD_MAX_PX);
  }
  w = Math.min(w, BOARD_MAX_PX, window.innerWidth - 16);
  return Math.max(200, w);
}

// ------- Render / Generación -------
function generarSopa(n) {
  sopaDiv.innerHTML = "";
  mensaje.textContent = "";
  nivelSpan.textContent = n;

  palabrasActuales = listaPalabras[n - 1] || ["FIN"];
  encontradas = [];
  palabrasSpan.textContent = palabrasActuales.join(", ");

  size = 6 + n * 2;
  grid = Array.from({ length: size }, () => Array(size).fill("."));

  // Colocar palabras horizontalmente
  palabrasActuales.forEach((p, idx) => {
    const fila = (idx * 2) % size;
    for (let i = 0; i < p.length && i < size; i++) {
      grid[fila][i] = p[i];
    }
  });

  // Llenar vacíos
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let f = 0; f < size; f++) {
    for (let c = 0; c < size; c++) {
      if (grid[f][c] === ".") grid[f][c] = letras[Math.floor(Math.random() * letras.length)];
    }
  }

  // Tamaño de celda con límites
  const contWidth = medirAnchoTablero();
  const raw = Math.floor(contWidth / (size + 1));
  const cellSize = Math.max(MIN_CELL, Math.min(MAX_CELL, raw));

  // Render filas/celdas
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
      const fontPx = Math.min(24, Math.floor(cellSize * 0.6));
      span.style.fontSize = fontPx + "px";
      span.style.border = "1px solid #ccc";
      span.style.boxSizing = "border-box";
      span.style.cursor = "pointer";
      span.style.borderRadius = "6px";
      span.style.margin = "1px";          // margen chico para reducir “huecos”
      span.style.userSelect = "none";

      row.appendChild(span);
    }
    sopaDiv.appendChild(row);
  }

  if (!listenersReady) {
    sopaDiv.addEventListener("contextmenu", (e) => e.preventDefault());

    // Iniciar selección (capturamos en el CONTENEDOR)
    sopaDiv.addEventListener("pointerdown", (e) => {
      if (seleccionActiva) return; // evita segundas pulsaciones simultáneas
      const pt = coordDesdePuntero(e.clientX, e.clientY);
      if (!pt) return;
      e.preventDefault();

      try { sopaDiv.setPointerCapture(e.pointerId); } catch { }
      seleccionActiva = true;
      activePointerId = e.pointerId;

      start = { fila: pt.fila, col: pt.col };
      end = { fila: pt.fila, col: pt.col };
      marcarRangoFila(start.fila, start.col, end.col, "#ffb6c1");
    });

    // Arrastre global (para no perderlo si salís del tablero)
    window.addEventListener("pointermove", (e) => {
      if (!seleccionActiva || e.pointerId !== activePointerId) return;
      e.preventDefault(); // evita que el táctil “salte” o haga scroll
      const pt = coordDesdePuntero(e.clientX, e.clientY);
      if (!pt) return;
      if (pt.fila === start.fila) {
        end = { fila: pt.fila, col: pt.col };
        marcarRangoFila(start.fila, start.col, end.col, "#ffb6c1");
      }
    }, { passive: false });

    // Finalizar
    const endAll = (e) => {
      if (!seleccionActiva || (activePointerId !== null && e.pointerId !== activePointerId)) return;
      finalizarSeleccion();
      try { sopaDiv.releasePointerCapture(e.pointerId); } catch { }
    };

    window.addEventListener("pointerup", endAll);
    window.addEventListener("pointercancel", endAll);
    window.addEventListener("lostpointercapture", endAll);

    listenersReady = true;
  }
}

// Recalcular en resize/rotación con límites coherentes
window.addEventListener("resize", () => generarSopa(nivel));

// Inicial
generarSopa(nivel);
