let furyMode = false;
let furyTimer = 0;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let zombies = [];
let bullets = [];
let diamonds = [];
let player = { x: 50, y: canvas.height / 2, size: 20, speed: 20 };
let gameOver = false;
let restartTimer = null;
let level = 1;
let diamondsCollected = 0;

function spawnZombie() {
  const zombie = {
    x: canvas.width,
    y: Math.random() * (canvas.height - 30),
    size: 30,
    speed: 2 + Math.random() * 2.5

  };
  zombies.push(zombie);
  console.log("Zombie generado:", zombie);
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

document.addEventListener("keydown", (e) => {
  if (!gameOver) {
    if (e.key === "ArrowUp") {
      player.y = Math.max(0, player.y - player.speed);
    }
    if (e.key === "ArrowDown") {
      player.y = Math.min(canvas.height - player.size, player.y + player.speed);
    }
    if (e.key === " ") {
      shootBullet();
    }
  }
});

function update() {
  // Mover zombies
  zombies.forEach(z => z.x -= z.speed);

  // Mover balas
  bullets.forEach(b => b.x += b.speed);

  // Mover diamantes
  diamonds.forEach(d => d.x -= d.speed);

  // Eliminar diamantes que salieron del canvas
  diamonds = diamonds.filter(d => d.x + d.size > 0);

  // Colisiones bala vs zombie
  bullets = bullets.filter(b => {
    let hit = false;
    zombies = zombies.filter(z => {
      const collision = b.x < z.x + z.size &&
                        b.x + b.size > z.x &&
                        b.y < z.y + z.size &&
                        b.y + b.size > z.y;
      if (collision) hit = !furyMode;
      return !collision;
    });
    return !hit;
  });

  // Colisión zombie vs jugador
  zombies.forEach(z => {
    const collision = player.x < z.x + z.size &&
                      player.x + player.size > z.x &&
                      player.y < z.y + z.size &&
                      player.y + player.size > z.y;
    if (collision && !gameOver) {
      gameOver = true;
      restartTimer = setTimeout(resetGame, 2000);
    }
  });

 // Colisión jugador vs diamante (usando distancia entre centros)
diamonds = diamonds.filter(d => {
  const dx = (player.x + player.size / 2) - (d.x + d.size / 2);
  const dy = (player.y + player.size / 2) - (d.y + d.size / 2);
  const distance = Math.sqrt(dx * dx + dy * dy);
  const collision = distance < (player.size / 2 + d.size / 2);

  if (collision) {
    diamondsCollected++;

    // Activar modo furia cada 3 diamantes recolectados
    if (!furyMode && diamondsCollected % 3 === 0) {
      furyMode = true;
      furyTimer = 300; // ~5 segundos a 60fps
      player.speed = 30; // velocidad aumentada
    }

if (level === 1 && diamondsCollected >= 3) {
  level = 2;
  diamondsCollected = 0;
} else if (level === 2 && diamondsCollected >= 5) {
  gameOver = true;
  restartTimer = setTimeout(resetGame, 4000);
}

    return false;
  }
  return true;

if (furyMode) {
  furyTimer--;
  if (furyTimer <= 0) {
    furyMode = false;
    player.speed = 20; // volver a velocidad normal
  }
}



});


  // Eliminar zombies que pasaron
  zombies = zombies.filter(z => z.x + z.size > 0);
}


function draw() {
  // Fondo dinámico según nivel
  if (level === 2) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#09eb3a"; // fondo original
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Jugador
  ctx.fillStyle = "cyan";
  ctx.fillRect(player.x, player.y, player.size, player.size);

  // Zombies
  ctx.fillStyle = "green";
  zombies.forEach(z => {
    ctx.fillRect(z.x, z.y, z.size, z.size);
  });

  // Balas
  ctx.fillStyle = "red";
  bullets.forEach(b => {
    ctx.fillRect(b.x, b.y, b.size, b.size);
  });

  // Diamantes
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

  // Game Over o Victoria
  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    const message = (level === 2 && diamondsCollected >= 5) ? "¡Ganaste!" : "¡Game Over!";
    ctx.fillText(message, canvas.width / 2 - 120, canvas.height / 2);

    if (level === 2 && diamondsCollected >= 5) {
      ctx.fillStyle = "gold";
      ctx.font = "30px Arial";
      ctx.fillText("🏆 ¡Ganaste un trofeo!", canvas.width / 2 - 150, canvas.height / 2 + 50);
    }
  }
}


{
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Jugador
  ctx.fillStyle = "cyan";
  ctx.fillRect(player.x, player.y, player.size, player.size);

  // Zombies
  ctx.fillStyle = "green";
  zombies.forEach(z => {
    ctx.fillRect(z.x, z.y, z.size, z.size);
  });

  // Balas
  ctx.fillStyle = "red";
  bullets.forEach(b => {
    ctx.fillRect(b.x, b.y, b.size, b.size);
  });

  // Diamantes
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

  // Game Over o Victoria
  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    const message = (level === 2 && diamondsCollected >= 10) ? "¡Ganaste!" : "¡Game Over!";
    ctx.fillText(message, canvas.width / 2 - 120, canvas.height / 2);
  }
}

function resetGame() {
  zombies = [];
  bullets = [];
  diamonds = [];
  player.y = canvas.height / 2;
  gameOver = false;
  restartTimer = null;
  level = 1;
  diamondsCollected = 0;
  gameLoop();
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

setInterval(() => {
  if (!gameOver) spawnZombie();
}, 1500);

setInterval(() => {
  if (!gameOver) spawnDiamond();
}, 2000);

gameLoop();


