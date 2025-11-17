let furyMode = false;
let furyTimer = 0;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let zombies = [];
let bullets = [];
let diamonds = [];
let player = { x: 50, y: canvas.height / 2, size: 20, speed: 20 };
let gameOver = false;
let level = 1;
let diamondsCollected = 0;

// ===== Anti-scroll de flechas/espacio (evita que "se suba" la página)
document.addEventListener('keydown', (e) => {
  const k = e.key;
  if (k === ' ' || k === 'Spacebar' || k.startsWith('Arrow')) e.preventDefault();
}, { passive: false });

// ===== Controles de teclado (PC)
document.addEventListener("keydown", (e) => {
  if (gameOver) return;
  if (e.key === "ArrowUp") {
    player.y = Math.max(0, player.y - player.speed);
  }
  if (e.key === "ArrowDown") {
    player.y = Math.min(canvas.height - player.size, player.y + player.speed);
  }
  if (e.key === " ") {
    shootBullet();
  }
});

// ===== Controles táctiles (móvil): D-pad simple inyectado
(function addTouchControlsIfMobile() {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouch) return;

  const wrap = document.createElement('div');
  wrap.id = 'touchControls';

  const bottomMobile = "18vh"; // más arriba en celu
  const bottomDesktop = "10px";
  const isMobileWidth = window.innerWidth <= 768;

  wrap.style.cssText = `
    position: fixed;
    left: 0;
    right: 0;
    bottom: ${isMobileWidth ? bottomMobile : bottomDesktop};
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 0 12px;
    z-index: 9999;
    touch-action: manipulation;
    pointer-events: auto;
  `;

  const left = document.createElement('div');
  left.style.cssText = `
    display: grid; grid-template-areas:
      ". up ."
      "left . right"
      ". down .";
    gap: 8px; justify-items: center; align-items: center;
  `;
  function mkBtn(txt, area) {
    const b = document.createElement('button');
    b.textContent = txt;
    b.style.cssText = `
      min-width: 64px; min-height: 52px; border-radius: 10px;
      background:#1f2937; color:#e5e7eb; border:1px solid #374151;
      font-size:18px; box-shadow:0 6px 14px rgba(0,0,0,.25);
    `;
    b.style.gridArea = area;
    return b;
  }
  const upBtn = mkBtn('⬆', 'up');
  const downBtn = mkBtn('⬇', 'down');
  const fireBtn = document.createElement('button');
  fireBtn.textContent = 'DISPARAR';
  fireBtn.style.cssText = `
    width: 100%; min-height: 120px; border-radius: 12px; font-weight:800; font-size:22px;
    background:#ef4444; color:#200; border:1px solid #b91c1c;
  `;

  left.appendChild(upBtn);
  left.appendChild(downBtn);
  left.appendChild(mkBtn('⬅', 'left')); // decorativo; no usamos izquierda/derecha en este juego
  left.appendChild(mkBtn('➡', 'right'));

  const right = document.createElement('div');
  right.appendChild(fireBtn);

  wrap.appendChild(left);
  wrap.appendChild(right);
  document.body.appendChild(wrap);

  function hold(btn, fn, interval = 120) {
    let t;
    const start = (ev) => { ev.preventDefault(); fn(); t = setInterval(fn, interval); };
    const stop = () => { clearInterval(t); t = null; };
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', stop);
    btn.addEventListener('touchcancel', stop);
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', stop);
    btn.addEventListener('mouseleave', stop);
  }

  hold(upBtn, () => { player.y = Math.max(0, player.y - player.speed); });
  hold(downBtn, () => { player.y = Math.min(canvas.height - player.size, player.y + player.speed); });
  hold(fireBtn, () => { shootBullet(); }, 220);
})();

// ===== Spawners
function spawnZombie() {
  const zombie = {
    x: canvas.width,
    y: Math.random() * (canvas.height - 30),
    size: 30,
    speed: 2 + Math.random() * 2.5
  };
  zombies.push(zombie);
}

function spawnDiamond() {
  diamonds.push({
    x: canvas.width,
    y: Math.random() * (canvas.height - 15),
    size: 15,
    speed: 2 + Math.random() * 2
  });
}

function shootBullet() {
  bullets.push({
    x: player.x + player.size,
    y: player.y + player.size / 2 - 2.5,
    size: 5,
    speed: 6
  });
}

// ===== DIBUJO NAVE / JUGADOR
function drawShip(x, y, size) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const half = size / 2;

  // Cuerpo nave
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(cx + half, cy);        // punta
  ctx.lineTo(cx - half, cy - half); // atrás arriba
  ctx.lineTo(cx - half, cy + half); // atrás abajo
  ctx.closePath();
  ctx.fill();

  // Cabina
  ctx.fillStyle = "#00e5ff";
  ctx.beginPath();
  ctx.arc(cx + half / 4, cy, size / 5, 0, Math.PI * 2);
  ctx.fill();

  // Fuego atrás
  ctx.fillStyle = "orange";
  ctx.beginPath();
  ctx.moveTo(cx - half, cy - size / 4);
  ctx.lineTo(cx - half - size / 3, cy);
  ctx.lineTo(cx - half, cy + size / 4);
  ctx.closePath();
  ctx.fill();
}

function drawPlayer() {
  drawShip(player.x, player.y, player.size);
}

// ===== Lógica principal
function update() {
  // mover entidades
  zombies.forEach(z => z.x -= z.speed);
  bullets.forEach(b => b.x += b.speed);
  diamonds.forEach(d => d.x -= d.speed);

  // limpiar fuera de pantalla
  zombies = zombies.filter(z => z.x + z.size > 0);
  bullets = bullets.filter(b => b.x < canvas.width + 20);
  diamonds = diamonds.filter(d => d.x + d.size > 0);

  // balas vs zombies
  bullets = bullets.filter(b => {
    let hit = false;
    zombies = zombies.filter(z => {
      const collision = b.x < z.x + z.size &&
        b.x + b.size > z.x &&
        b.y < z.y + z.size &&
        b.y + b.size > z.y;
      if (collision) hit = !furyMode; // en furia, la bala atraviesa y sigue
      return !collision;              // zombie eliminado si hubo colisión
    });
    return !hit; // quitar bala normal si pegó (salvo furia)
  });

  // zombies vs jugador
  for (const z of zombies) {
    const collision = player.x < z.x + z.size &&
      player.x + player.size > z.x &&
      player.y < z.y + z.size &&
      player.y + player.size > z.y;
    if (collision && !gameOver) {
      gameOver = true;
    }
  }

  // jugador vs diamantes (distancia por centros)
  diamonds = diamonds.filter(d => {
    const dx = (player.x + player.size / 2) - (d.x + d.size / 2);
    const dy = (player.y + player.size / 2) - (d.y + d.size / 2);
    const distance = Math.hypot(dx, dy);
    const collision = distance < (player.size / 2 + d.size / 2);
    if (!collision) return true;

    diamondsCollected++;

    // activar furia cada 3 diamantes
    if (!furyMode && diamondsCollected % 3 === 0) {
      furyMode = true;
      furyTimer = 300;     // ~5s a 60fps
      player.speed = 30;   // más rápido
    }

    // avance de nivel y victoria
    if (level === 1 && diamondsCollected >= 3) {
      level = 2;
      diamondsCollected = 0;
    } else if (level === 2 && diamondsCollected >= 5) {
      gameOver = true; // victoria, se muestra en draw
    }
    return false;
  });

  // temporizador de furia
  if (furyMode) {
    furyTimer--;
    if (furyTimer <= 0) {
      furyMode = false;
      player.speed = 20;
    }
  }
}

function draw() {
  // limpiar fondo primero
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // fondo por nivel
  if (level === 2) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255,0,0,0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#0a0"; // pasto tech
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // jugador (nave espacial)
  drawPlayer();

  // zombies
  ctx.fillStyle = "green";
  zombies.forEach(z => {
    ctx.fillRect(z.x, z.y, z.size, z.size);
  });

  // balas
  ctx.fillStyle = "red";
  bullets.forEach(b => {
    ctx.fillRect(b.x, b.y, b.size, b.size);
  });

  // diamantes
  ctx.fillStyle = "blue";
  diamonds.forEach(d => {
    ctx.beginPath();
    ctx.arc(d.x + d.size / 2, d.y + d.size / 2, d.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // HUD
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText(`Nivel: ${level}`, 10, 20);
  ctx.fillText(`Diamantes: ${diamondsCollected}`, 10, 40);
  if (furyMode) ctx.fillText(`FURIA!`, 10, 60);

  // fin de juego / victoria
  if (gameOver) {
    const win = (level === 2 && diamondsCollected >= 5);
    ctx.fillStyle = win ? "gold" : "red";
    ctx.font = "40px Arial";
    ctx.fillText(win ? "¡Ganaste!" : "¡Game Over!", canvas.width / 2 - 120, canvas.height / 2);
    if (win) {
      ctx.font = "28px Arial";
      ctx.fillText("🏆 ¡Trofeo conseguido!", canvas.width / 2 - 160, canvas.height / 2 + 40);
    }
  }
}

function resetGame() {
  zombies = [];
  bullets = [];
  diamonds = [];
  player.y = canvas.height / 2;
  furyMode = false; furyTimer = 0; player.speed = 20;
  gameOver = false;
  level = 1;
  diamondsCollected = 0;
}

function gameLoop() {
  if (!gameOver) {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  } else {
    draw();
  }
}

// spawners periódicos
setInterval(() => { if (!gameOver) spawnZombie(); }, 1500);
setInterval(() => { if (!gameOver) spawnDiamond(); }, 2000);

// iniciar
resetGame();
gameLoop();
