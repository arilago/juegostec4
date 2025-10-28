let nivel = 1;
const nivelSpan = document.getElementById("nivel");
const tablero = document.getElementById("tablero");
const mensaje = document.getElementById("mensaje");

const frutas = ["🍎","🍌","🍇","🍓","🍉","🍍","🥝","🍑","🍒","🥭"];
let primera = null;
let segunda = null;
let bloqueo = false;
let parejasEncontradas = 0;

function generarCartas(n) {
  tablero.innerHTML = "";
  mensaje.textContent = "";
  nivelSpan.textContent = n;

  // Cantidad de pares según nivel
  const pares = Math.min(n + 2, frutas.length);
  let cartas = frutas.slice(0, pares);
  cartas = [...cartas, ...cartas]; // duplicar para pares
  cartas.sort(() => Math.random() - 0.5);

  cartas.forEach(fruta => {
    const carta = document.createElement("div");
    carta.className = "carta";
    carta.dataset.valor = fruta;
    carta.textContent = "?";
    carta.onclick = () => voltearCarta(carta);
    tablero.appendChild(carta);
  });

  parejasEncontradas = 0;
  primera = null;
  segunda = null;
}

function voltearCarta(carta) {
  if (bloqueo || carta.classList.contains("acertada") || carta === primera) return;

  carta.textContent = carta.dataset.valor;

  if (!primera) {
    primera = carta;
  } else {
    segunda = carta;
    verificarPareja();
  }
}

function verificarPareja() {
  bloqueo = true;

  if (primera.dataset.valor === segunda.dataset.valor) {
    primera.classList.add("acertada");
    segunda.classList.add("acertada");
    parejasEncontradas++;
    mensaje.textContent = "✅ ¡Pareja encontrada!";
    resetSeleccion();

    if (parejasEncontradas === Math.min(nivel + 2, frutas.length)) {
      mensaje.textContent = "🎉 ¡Nivel superado!";
      nivel++;
      setTimeout(() => {
        generarCartas(nivel);
      }, 1500);
    }
  } else {
    setTimeout(() => {
      primera.textContent = "?";
      segunda.textContent = "?";
      resetSeleccion();
    }, 1000);
  }
}

function resetSeleccion() {
  primera = null;
  segunda = null;
  bloqueo = false;
}

// iniciar nivel 1
generarCartas(nivel);
