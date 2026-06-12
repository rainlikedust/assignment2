(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const scoreValue = document.getElementById("scoreValue");
  const waveValue = document.getElementById("waveValue");
  const healthValue = document.getElementById("healthValue");
  const thesisValue = document.getElementById("thesisValue");
  const startOverlay = document.getElementById("startOverlay");
  const gameOverOverlay = document.getElementById("gameOverOverlay");
  const gameOverTitle = document.getElementById("gameOverTitle");
  const gameOverMessage = document.getElementById("gameOverMessage");
  const finalScore = document.getElementById("finalScore");
  const finalWave = document.getElementById("finalWave");
  const characterGrid = document.getElementById("characterGrid");
  const startButton = document.getElementById("startButton");
  const cheatButton = document.getElementById("cheatButton");
  const sideCheatButton = document.getElementById("sideCheatButton");
  const cheatStatus = document.getElementById("cheatStatus");
  const pauseButton = document.getElementById("pauseButton");
  const restartButton = document.getElementById("restartButton");
  const playAgainButton = document.getElementById("playAgainButton");

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const CHEAT_CODE = "thesis";
  const keys = new Set();
  const pointer = { x: WIDTH / 2, y: HEIGHT / 2, down: false };

  const characters = [
    {
      id: "phd",
      name: "PhD Candidate",
      sprite: "P",
      copy: "Balanced movement, focus, and research resilience.",
      speed: 248,
      damage: 24,
      fireRate: 210,
      maxHealth: 110,
      color: "#2664c7",
      stats: ["Speed: Balanced", "Damage: Balanced", "Health: Strong"],
    },
    {
      id: "data",
      name: "Data Scientist",
      sprite: "D",
      copy: "Fast repositioning and rapid debugging under pressure.",
      speed: 300,
      damage: 18,
      fireRate: 155,
      maxHealth: 92,
      color: "#257c52",
      stats: ["Speed: High", "Damage: Light", "Fire Rate: High"],
    },
    {
      id: "lab",
      name: "Lab Engineer",
      sprite: "L",
      copy: "Tough defense with high-impact experimental fixes.",
      speed: 210,
      damage: 34,
      fireRate: 260,
      maxHealth: 135,
      color: "#c9891e",
      stats: ["Speed: Low", "Damage: High", "Health: Highest"],
    },
  ];

  const enemyTypes = [
    {
      id: "bug",
      label: "Bug",
      color: "#b73838",
      size: 18,
      speed: 78,
      hp: 36,
      damage: 8,
      points: 35,
    },
    {
      id: "deadline",
      label: "Deadline",
      color: "#c9891e",
      size: 24,
      speed: 54,
      hp: 74,
      damage: 18,
      points: 70,
    },
    {
      id: "reviewer",
      label: "Peer Reviewer",
      color: "#2664c7",
      size: 22,
      speed: 62,
      hp: 92,
      damage: 13,
      points: 95,
    },
  ];

  let selectedCharacter = null;
  let state = null;
  let cheatBuffer = "";
  let lastTime = performance.now();
  let animationFrame = 0;

  function createInitialState(character) {
    return {
      mode: "playing",
      score: 0,
      wave: 1,
      waveKills: 0,
      waveTarget: 9,
      spawnTimer: 0,
      spawnInterval: 950,
      nextShot: 0,
      shake: 0,
      player: {
        x: WIDTH / 2,
        y: HEIGHT / 2 + 150,
        radius: 17,
        health: character.maxHealth,
        maxHealth: character.maxHealth,
        speed: character.speed,
        damage: character.damage,
        fireRate: character.fireRate,
        color: character.color,
      },
      thesis: {
        x: WIDTH / 2,
        y: HEIGHT / 2,
        radius: 58,
        health: 100,
        maxHealth: 100,
      },
      bullets: [],
      enemies: [],
      particles: [],
      shockwaves: [],
      cheatBeams: [],
      cheatCooldown: 0,
      cheatBanner: 0,
    };
  }

  function renderCharacterCards() {
    characterGrid.innerHTML = "";

    characters.forEach((character) => {
      const button = document.createElement("button");
      button.className = "character-card";
      button.type = "button";
      button.dataset.character = character.id;
      button.innerHTML = `
        <span class="character-sprite" aria-hidden="true">${character.sprite}</span>
        <h3>${character.name}</h3>
        <p>${character.copy}</p>
        <span class="stat-row">
          ${character.stats.map((stat) => `<span>${stat}</span>`).join("")}
        </span>
      `;

      button.addEventListener("click", () => {
        selectedCharacter = character;
        document.querySelectorAll(".character-card").forEach((card) => {
          card.classList.toggle("is-selected", card === button);
        });
        startButton.disabled = false;
      });

      characterGrid.appendChild(button);
    });
  }

  function applyAutostartFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const autostartId = params.get("autostart");
    if (!autostartId) return;

    const character = characters.find((item) => item.id === autostartId);
    if (!character) return;

    selectedCharacter = character;
    const card = document.querySelector(`[data-character="${character.id}"]`);
    if (card) {
      card.classList.add("is-selected");
    }
    startButton.disabled = false;
    startGame();
    if (params.get("demo") === "1") {
      seedDemoThreats();
    }
    if (params.get("cheat") === "1") {
      activateCheatAttack();
    }
  }

  function seedDemoThreats() {
    if (!state) return;
    const demoPositions = [
      { type: enemyTypes[0], x: 210, y: 170 },
      { type: enemyTypes[1], x: 900, y: 575 },
      { type: enemyTypes[2], x: 930, y: 155 },
    ];

    demoPositions.forEach(({ type, x, y }) => {
      state.enemies.push({
        id: type.id,
        label: type.label,
        x,
        y,
        radius: type.size,
        speed: type.speed,
        hp: type.hp,
        maxHp: type.hp,
        damage: type.damage,
        points: type.points,
        color: type.color,
        hitCooldown: 0,
      });
    });
  }

  function startGame() {
    if (!selectedCharacter) return;
    state = createInitialState(selectedCharacter);
    cheatBuffer = "";
    startOverlay.classList.remove("is-visible");
    gameOverOverlay.classList.remove("is-visible");
    pauseButton.disabled = false;
    pauseButton.setAttribute("aria-label", "Pause game");
    pauseButton.title = "Pause";
    pauseButton.querySelector("span").textContent = "II";
    setCheatStatus("Citation Storm ready.");
    updateHud();
    lastTime = performance.now();
  }

  function resetToSelection() {
    state = null;
    keys.clear();
    cheatBuffer = "";
    selectedCharacter = null;
    startButton.disabled = true;
    document.querySelectorAll(".character-card").forEach((card) => card.classList.remove("is-selected"));
    startOverlay.classList.add("is-visible");
    gameOverOverlay.classList.remove("is-visible");
    pauseButton.disabled = true;
    setCheatStatus("Start a defense, then type THESIS.");
    drawTitleScene();
    updateHud();
  }

  function setCheatStatus(message) {
    if (cheatStatus) {
      cheatStatus.textContent = message;
    }
  }

  function pauseGame() {
    if (!state || state.mode === "over") return;
    state.mode = state.mode === "paused" ? "playing" : "paused";
    pauseButton.setAttribute("aria-label", state.mode === "paused" ? "Resume game" : "Pause game");
    pauseButton.title = state.mode === "paused" ? "Resume" : "Pause";
    pauseButton.querySelector("span").textContent = state.mode === "paused" ? ">" : "II";
  }

  function getCanvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function normalize(dx, dy) {
    const length = Math.hypot(dx, dy) || 1;
    return { x: dx / length, y: dy / length };
  }

  function fireBullet(now) {
    if (!state || state.mode !== "playing") return;
    if (now < state.nextShot) return;

    const player = state.player;
    const direction = normalize(pointer.x - player.x, pointer.y - player.y);
    state.bullets.push({
      x: player.x + direction.x * (player.radius + 12),
      y: player.y + direction.y * (player.radius + 12),
      vx: direction.x * 620,
      vy: direction.y * 620,
      radius: 6,
      damage: player.damage,
      life: 0.9,
    });
    state.nextShot = now + player.fireRate;
    addParticles(player.x, player.y, player.color, 4);
  }

  function spawnEnemy() {
    const waveBoost = 1 + state.wave * 0.08;
    const roll = Math.random();
    let type = enemyTypes[0];
    if (state.wave >= 2 && roll > 0.56) type = enemyTypes[1];
    if (state.wave >= 3 && roll > 0.76) type = enemyTypes[2];

    const side = Math.floor(Math.random() * 4);
    const margin = 34;
    let x = Math.random() * WIDTH;
    let y = Math.random() * HEIGHT;
    if (side === 0) y = -margin;
    if (side === 1) x = WIDTH + margin;
    if (side === 2) y = HEIGHT + margin;
    if (side === 3) x = -margin;

    state.enemies.push({
      id: type.id,
      label: type.label,
      x,
      y,
      radius: type.size,
      speed: type.speed * waveBoost,
      hp: type.hp * waveBoost,
      maxHp: type.hp * waveBoost,
      damage: type.damage,
      points: type.points,
      color: type.color,
      hitCooldown: 0,
    });
  }

  function nextWave() {
    state.wave += 1;
    state.waveKills = 0;
    state.waveTarget = 8 + state.wave * 3;
    state.spawnInterval = Math.max(360, 960 - state.wave * 74);
    state.thesis.health = clamp(state.thesis.health + 10, 0, state.thesis.maxHealth);
    state.player.health = clamp(state.player.health + 8, 0, state.player.maxHealth);
    addParticles(state.thesis.x, state.thesis.y, "#257c52", 28);
  }

  function addParticles(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 170;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 4,
        life: 0.35 + Math.random() * 0.4,
      });
    }
  }

  function activateCheatAttack() {
    if (!state || state.mode !== "playing") {
      setCheatStatus("Choose a student and start the defense first.");
      return;
    }

    if (state.cheatCooldown > 0) {
      setCheatStatus(`Citation Storm recharging: ${Math.ceil(state.cheatCooldown)}s.`);
      return;
    }

    const player = state.player;
    const beamColors = ["#38bdf8", "#f43f5e", "#facc15", "#22c55e", "#a855f7", "#fb923c"];
    const defeatedCount = state.enemies.length;

    state.cheatBanner = 2.1;
    state.cheatCooldown = 8;
    state.shake = 0.45;
    state.shockwaves.push({ x: player.x, y: player.y, radius: 18, maxRadius: 560, life: 1.25, color: "#38bdf8" });
    state.shockwaves.push({ x: player.x, y: player.y, radius: 8, maxRadius: 430, life: 1.45, color: "#facc15" });

    for (let i = 0; i < 36; i += 1) {
      const angle = (Math.PI * 2 * i) / 36;
      state.cheatBeams.push({
        x: player.x,
        y: player.y,
        angle,
        length: 760,
        width: 10 + (i % 3) * 4,
        color: beamColors[i % beamColors.length],
        life: 1.05 + (i % 4) * 0.08,
      });
    }

    for (let i = 0; i < 120; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 140 + Math.random() * 420;
      state.particles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: beamColors[i % beamColors.length],
        size: 4 + Math.random() * 7,
        life: 0.55 + Math.random() * 0.75,
      });
    }

    state.enemies.forEach((enemy) => {
      state.score += enemy.points + state.wave * 8;
      state.waveKills += 1;
      addParticles(enemy.x, enemy.y, enemy.color, 18);
    });
    state.enemies = [];
    state.player.health = clamp(state.player.health + 18, 0, state.player.maxHealth);
    state.thesis.health = clamp(state.thesis.health + 12, 0, state.thesis.maxHealth);

    setCheatStatus(defeatedCount > 0 ? `Citation Storm cleared ${defeatedCount} threats.` : "Citation Storm fired. No threats survived the peer-reviewed blast.");
    updateHud();
  }

  function update(dt, now) {
    if (!state || state.mode !== "playing") return;

    const player = state.player;
    const move = { x: 0, y: 0 };
    if (keys.has("arrowup") || keys.has("w")) move.y -= 1;
    if (keys.has("arrowdown") || keys.has("s")) move.y += 1;
    if (keys.has("arrowleft") || keys.has("a")) move.x -= 1;
    if (keys.has("arrowright") || keys.has("d")) move.x += 1;

    if (move.x || move.y) {
      const direction = normalize(move.x, move.y);
      player.x += direction.x * player.speed * dt;
      player.y += direction.y * player.speed * dt;
      player.x = clamp(player.x, player.radius + 8, WIDTH - player.radius - 8);
      player.y = clamp(player.y, player.radius + 8, HEIGHT - player.radius - 8);
    }

    if (pointer.down) {
      fireBullet(now);
    }

    state.cheatCooldown = Math.max(0, state.cheatCooldown - dt);
    state.cheatBanner = Math.max(0, state.cheatBanner - dt);

    state.spawnTimer += dt * 1000;
    if (state.spawnTimer >= state.spawnInterval && state.waveKills < state.waveTarget) {
      state.spawnTimer = 0;
      spawnEnemy();
    }

    state.bullets.forEach((bullet) => {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
    });
    state.bullets = state.bullets.filter((bullet) => {
      return bullet.life > 0 && bullet.x > -20 && bullet.x < WIDTH + 20 && bullet.y > -20 && bullet.y < HEIGHT + 20;
    });

    state.enemies.forEach((enemy) => {
      const direction = normalize(state.thesis.x - enemy.x, state.thesis.y - enemy.y);
      enemy.x += direction.x * enemy.speed * dt;
      enemy.y += direction.y * enemy.speed * dt;
      enemy.hitCooldown = Math.max(0, enemy.hitCooldown - dt);

      if (distance(enemy, player) < enemy.radius + player.radius && enemy.hitCooldown <= 0) {
        player.health -= enemy.damage * 0.55;
        enemy.hitCooldown = 0.7;
        state.shake = 0.15;
        addParticles(player.x, player.y, "#b73838", 8);
      }

      if (distance(enemy, state.thesis) < enemy.radius + state.thesis.radius && enemy.hitCooldown <= 0) {
        state.thesis.health -= enemy.damage;
        enemy.hp -= enemy.damage * 0.85;
        enemy.hitCooldown = 0.65;
        state.shake = 0.2;
        addParticles(state.thesis.x, state.thesis.y, "#c9891e", 10);
      }
    });

    for (let bulletIndex = state.bullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) {
      const bullet = state.bullets[bulletIndex];
      let consumed = false;
      for (let enemyIndex = state.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
        const enemy = state.enemies[enemyIndex];
        if (distance(bullet, enemy) < bullet.radius + enemy.radius) {
          enemy.hp -= bullet.damage;
          consumed = true;
          addParticles(bullet.x, bullet.y, enemy.color, 7);
          if (enemy.hp <= 0) {
            state.score += enemy.points + state.wave * 5;
            state.waveKills += 1;
            addParticles(enemy.x, enemy.y, enemy.color, 16);
            state.enemies.splice(enemyIndex, 1);
          }
          break;
        }
      }
      if (consumed) {
        state.bullets.splice(bulletIndex, 1);
      }
    }

    state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);

    state.particles.forEach((particle) => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.92;
      particle.vy *= 0.92;
      particle.life -= dt;
    });
    state.particles = state.particles.filter((particle) => particle.life > 0);
    state.shockwaves.forEach((wave) => {
      wave.radius += (wave.maxRadius - wave.radius) * Math.min(1, dt * 5.4);
      wave.life -= dt;
    });
    state.shockwaves = state.shockwaves.filter((wave) => wave.life > 0);
    state.cheatBeams.forEach((beam) => {
      beam.life -= dt;
      beam.angle += dt * 1.4;
    });
    state.cheatBeams = state.cheatBeams.filter((beam) => beam.life > 0);
    state.shake = Math.max(0, state.shake - dt);

    if (state.waveKills >= state.waveTarget && state.enemies.length === 0) {
      nextWave();
    }

    if (player.health <= 0 || state.thesis.health <= 0) {
      finishGame(player.health <= 0 ? "The student burned out." : "The thesis collapsed under pressure.");
    }

    updateHud();
  }

  function finishGame(reason) {
    state.mode = "over";
    gameOverTitle.textContent = state.score >= 900 ? "Committee Impressed" : "Defense Failed";
    gameOverMessage.textContent = `${reason} Final score: ${Math.max(0, Math.round(state.score))}.`;
    finalScore.textContent = `Score ${Math.max(0, Math.round(state.score))}`;
    finalWave.textContent = `Wave ${state.wave}`;
    gameOverOverlay.classList.add("is-visible");
    pauseButton.disabled = true;
  }

  function updateHud() {
    if (!state) {
      scoreValue.textContent = "0";
      waveValue.textContent = "1";
      healthValue.textContent = "100";
      thesisValue.textContent = "100";
      return;
    }
    scoreValue.textContent = Math.max(0, Math.round(state.score)).toString();
    waveValue.textContent = state.wave.toString();
    healthValue.textContent = Math.max(0, Math.ceil(state.player.health)).toString();
    thesisValue.textContent = Math.max(0, Math.ceil(state.thesis.health)).toString();
  }

  function drawGrid() {
    ctx.fillStyle = "#e9dcc6";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = "rgba(38, 50, 65, 0.12)";
    ctx.lineWidth = 2;
    for (let x = 0; x < WIDTH; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < HEIGHT; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }

    drawLabFurniture();
  }

  function drawLabFurniture() {
    drawPixelRect(58, 88, 210, 54, "#f6f0df", "#263241");
    drawPixelRect(72, 103, 40, 22, "#2664c7", "#263241");
    drawPixelRect(132, 103, 40, 22, "#257c52", "#263241");
    drawPixelRect(192, 103, 40, 22, "#b73838", "#263241");

    drawPixelRect(850, 86, 210, 64, "#263241", "#263241");
    ctx.fillStyle = "#dff0ff";
    ctx.font = "700 20px Segoe UI, Arial";
    ctx.fillText("Defense Board", 884, 124);

    drawPixelRect(70, 586, 250, 36, "#f6f0df", "#263241");
    drawPixelRect(850, 562, 190, 56, "#f6f0df", "#263241");
  }

  function drawPixelRect(x, y, width, height, fill, stroke) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, width, height);
  }

  function drawTitleScene() {
    drawGrid();
    drawThesis({ x: WIDTH / 2, y: HEIGHT / 2, radius: 58, health: 100, maxHealth: 100 });
  }

  function drawThesis(thesis) {
    drawPixelRect(thesis.x - 55, thesis.y - 44, 110, 88, "#fffaf0", "#263241");
    ctx.fillStyle = "#263241";
    ctx.font = "800 19px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillText("THESIS", thesis.x, thesis.y - 8);
    ctx.font = "700 13px Segoe UI, Arial";
    ctx.fillText("Chapter 5", thesis.x, thesis.y + 17);
    ctx.textAlign = "left";

    const barWidth = 118;
    const healthRatio = clamp(thesis.health / thesis.maxHealth, 0, 1);
    drawMeter(thesis.x - barWidth / 2, thesis.y + 60, barWidth, 12, healthRatio, "#257c52");
  }

  function drawMeter(x, y, width, height, ratio, color) {
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = "#263241";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = color;
    ctx.fillRect(x + 3, y + 3, Math.max(0, (width - 6) * ratio), height - 6);
  }

  function drawPlayer(player) {
    ctx.save();
    ctx.translate(player.x, player.y);
    const aim = Math.atan2(pointer.y - player.y, pointer.x - player.x);

    ctx.fillStyle = player.color;
    ctx.strokeStyle = "#263241";
    ctx.lineWidth = 4;
    ctx.fillRect(-15, -17, 30, 34);
    ctx.strokeRect(-15, -17, 30, 34);

    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(-10, -28, 20, 14);
    ctx.strokeRect(-10, -28, 20, 14);

    ctx.rotate(aim);
    ctx.fillStyle = "#263241";
    ctx.fillRect(11, -4, 24, 8);
    ctx.restore();

    drawMeter(player.x - 28, player.y + 30, 56, 9, clamp(player.health / player.maxHealth, 0, 1), "#2664c7");
  }

  function drawEnemy(enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.fillStyle = enemy.color;
    ctx.strokeStyle = "#263241";
    ctx.lineWidth = 4;

    if (enemy.id === "bug") {
      ctx.fillRect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
      ctx.strokeRect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
      ctx.fillStyle = "#263241";
      ctx.fillRect(-enemy.radius - 12, -3, 10, 5);
      ctx.fillRect(enemy.radius + 2, -3, 10, 5);
    } else if (enemy.id === "deadline") {
      ctx.fillRect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
      ctx.strokeRect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
      ctx.fillStyle = "#fffaf0";
      ctx.fillRect(-10, -13, 20, 26);
      ctx.strokeRect(-10, -13, 20, 26);
    } else {
      ctx.fillRect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
      ctx.strokeRect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
      ctx.fillStyle = "#fffaf0";
      ctx.fillRect(-12, -7, 24, 7);
      ctx.fillRect(-8, 7, 16, 5);
    }

    ctx.restore();
    drawMeter(enemy.x - enemy.radius, enemy.y + enemy.radius + 8, enemy.radius * 2, 7, clamp(enemy.hp / enemy.maxHp, 0, 1), enemy.color);
  }

  function drawBullet(bullet) {
    ctx.fillStyle = "#263241";
    ctx.fillRect(bullet.x - bullet.radius, bullet.y - bullet.radius, bullet.radius * 2, bullet.radius * 2);
  }

  function drawParticles() {
    state.particles.forEach((particle) => {
      ctx.globalAlpha = clamp(particle.life * 2, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
      ctx.globalAlpha = 1;
    });
  }

  function drawPaused() {
    if (!state || state.mode !== "paused") return;
    ctx.fillStyle = "rgba(25, 33, 42, 0.52)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#fffaf0";
    ctx.strokeStyle = "#263241";
    ctx.lineWidth = 5;
    ctx.fillRect(WIDTH / 2 - 130, HEIGHT / 2 - 54, 260, 108);
    ctx.strokeRect(WIDTH / 2 - 130, HEIGHT / 2 - 54, 260, 108);
    ctx.fillStyle = "#263241";
    ctx.font = "900 38px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillText("Paused", WIDTH / 2, HEIGHT / 2 + 13);
    ctx.textAlign = "left";
  }

  function draw() {
    const offsetX = state && state.shake ? (Math.random() - 0.5) * 8 : 0;
    const offsetY = state && state.shake ? (Math.random() - 0.5) * 8 : 0;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    drawGrid();

    if (state) {
      drawThesis(state.thesis);
      state.bullets.forEach(drawBullet);
    state.enemies.forEach(drawEnemy);
    drawPlayer(state.player);
      drawCheatEffects();
      drawParticles();
    } else {
      drawThesis({ x: WIDTH / 2, y: HEIGHT / 2, radius: 58, health: 100, maxHealth: 100 });
    }

    ctx.restore();
    drawPaused();
  }

  function drawCheatEffects() {
    if (!state) return;

    state.cheatBeams.forEach((beam) => {
      const alpha = clamp(beam.life * 2.6, 0, 0.86);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(beam.x, beam.y);
      ctx.rotate(beam.angle);
      ctx.fillStyle = beam.color;
      ctx.fillRect(16, -beam.width / 2, beam.length, beam.width);
      ctx.fillStyle = "#fffaf0";
      ctx.fillRect(20, -2, beam.length * 0.72, 4);
      ctx.restore();
      ctx.globalAlpha = 1;
    });

    state.shockwaves.forEach((wave) => {
      ctx.save();
      ctx.globalAlpha = clamp(wave.life, 0, 0.8);
      ctx.strokeStyle = wave.color;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#fffaf0";
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.radius * 0.74, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = 1;
    });

    if (state.cheatBanner > 0) {
      const alpha = clamp(state.cheatBanner, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(25, 33, 42, 0.76)";
      ctx.fillRect(WIDTH / 2 - 235, 86, 470, 54);
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 4;
      ctx.strokeRect(WIDTH / 2 - 235, 86, 470, 54);
      ctx.fillStyle = "#fffaf0";
      ctx.font = "900 28px Segoe UI, Arial";
      ctx.textAlign = "center";
      ctx.fillText("CITATION STORM", WIDTH / 2, 121);
      ctx.textAlign = "left";
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  function loop(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;
    update(dt, now);
    draw();
    animationFrame = requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " "].includes(key)) {
      event.preventDefault();
    }
    if (key === "p" || key === " ") {
      pauseGame();
      return;
    }
    if (/^[a-z]$/.test(key)) {
      cheatBuffer = (cheatBuffer + key).slice(-CHEAT_CODE.length);
      if (cheatBuffer === CHEAT_CODE) {
        activateCheatAttack();
        cheatBuffer = "";
        return;
      }
    }
    keys.add(key);
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.key.toLowerCase());
  });

  canvas.addEventListener("pointermove", (event) => {
    Object.assign(pointer, getCanvasPoint(event));
  });

  canvas.addEventListener("pointerdown", (event) => {
    canvas.setPointerCapture(event.pointerId);
    Object.assign(pointer, getCanvasPoint(event), { down: true });
    fireBullet(performance.now());
  });

  canvas.addEventListener("pointerup", (event) => {
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    pointer.down = false;
  });

  canvas.addEventListener("pointerleave", () => {
    pointer.down = false;
  });

  startButton.addEventListener("click", startGame);
  cheatButton.addEventListener("click", activateCheatAttack);
  sideCheatButton.addEventListener("click", activateCheatAttack);
  pauseButton.addEventListener("click", pauseGame);
  restartButton.addEventListener("click", resetToSelection);
  playAgainButton.addEventListener("click", resetToSelection);

  renderCharacterCards();
  pauseButton.disabled = true;
  drawTitleScene();
  applyAutostartFromUrl();
  animationFrame = requestAnimationFrame(loop);

  window.addEventListener("beforeunload", () => {
    cancelAnimationFrame(animationFrame);
  });
})();
