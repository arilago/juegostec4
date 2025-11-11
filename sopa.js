// =========================
// SOPA DE LETRAS - JS FULL
// =========================

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

// Estado general
let palabrasActuales = [];
let encontradas = [];
let grid = [];
let size = 0;

// Estado de selección
let seleccionActiva = false;
let start = null;            // {fila, col}
let end = null;              // {fila, col}
let celdasMarcadas = [];     // spans actualmente resaltados

// Para no duplicar listeners al regenerar
let listenersReady = false;

// -------- Helpers de pintado ----------
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

// -------- Selección / Validación ----------
function finalizarSeleccion() {
  if (!seleccionActiva || !start || !end) {
    seleccionActiva = false;
    limpiarMarcado();
    return;
  }

  // Solo aceptamos misma fila y al menos 2 celdas
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
      celdasMarcadas = []; // ya quedaron pintadas
      // (Opcional) tachar en la lista:
      // actualizarListaTachada();
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

// --------- Render / Generación ----------
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

  // Tamaño de celda con límites (para que en PC no quede gigante)
  const contWidth = (sopaDiv.clientWidth || window.innerWidth) - 16;
  const MIN_CELL = 28;   // px (cómodo para móvil)
  const MAX_CELL = 46;   // px (tope en desktop)
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
      span.style.margin = "2px";
      span.style.userSelect = "none";

      row.appendChild(span);
    }
    sopaDiv.appendChild(row);
  }

  // Listeners solo se agregan una vez
  if (!listenersReady) {
    // Bloquear menú de contexto (long-press)
    sopaDiv.addEventListener("contextmenu", (e) => e.preventDefault());

    // Iniciar selección
    sopaDiv.addEventListener("pointerdown", (e) => {
      const pt = coordDesdePuntero(e.clientX, e.clientY);
      if (!pt) return;
      e.preventDefault();

      // Capturar el puntero para no perder eventos aunque el dedo salga del elemento
      try { e.target.setPointerCapture(e.pointerId); } catch { }

      seleccionActiva = true;
      start = { fila: pt.fila, col: pt.col };
      end = { fila: pt.fila, col: pt.col };
      marcarRangoFila(start.fila, start.col, end.col, "#ffb6c1");
    });

    // Arrastre
    sopaDiv.addEventListener("pointermove", (e) => {
      if (!seleccionActiva) return;
      const pt = coordDesdePuntero(e.clientX, e.clientY);
      if (!pt) return;

      // Sólo misma fila
      if (pt.fila === start.fila) {
        end = { fila: pt.fila, col: pt.col };
        marcarRangoFila(start.fila, start.col, end.col, "#ffb6c1");
      }
    });

    // Soltar (aunque sea fuera del tablero)
    window.addEventListener("pointerup", () => finalizarSeleccion());

    listenersReady = true;
  }
}

// Recalcular en resize/rotación manteniendo nivel
window.addEventListener("resize", () => generarSopa(nivel));

// --------- Inicial ---------
generarSopa(nivel);

/* ------------------------------------------
   (Opcional) Si querés tachar la palabra en
   la lista cuando se encuentra, creá elementos
   <li> en #palabras y marcá con class "done".
   Acá dejamos el hook por si lo sumás:
function actualizarListaTachada() {
  // ejemplo de implementación si usás <ul id="palabras"> con <li data-palabra="...">
  [...document.querySelectorAll('#palabras [data-palabra]')].forEach(li => {
    li.classList.toggle('done', encontradas.includes(li.dataset.palabra));
  });
}
------------------------------------------- */
