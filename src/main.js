/* Dinosaurs and Soldiers - Mission 1 (Canvas, Vanilla JS) */
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Game State
  const State = {
    MENU: 'menu',
    CHARACTER: 'character',
    CONTROLS: 'controls',
    LANGUAGE: 'language',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover',
  };
  let gameState = State.MENU;

  // I18n
  I18N.applyI18n('en');

  // Inputs
  const keys = new Set();
  const onceKeys = new Set();
  window.addEventListener('keydown', e => { keys.add(e.key.toLowerCase()); onceKeys.add(e.key.toLowerCase()); if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault(); });
  window.addEventListener('keyup', e => { keys.delete(e.key.toLowerCase()); });

  // Camera
  const camera = { x: 0, y: 0 };

  // World/Level constants
  const GRAVITY = 2000; // px/s^2
  const FLOOR_Y = HEIGHT - 80; // base ground level
  const LEVEL_LENGTH = 4000; // pixels long for Mission 1

  // Player characters
  const PLAYERS = {
    nova: { name: 'Nova', maxHp: 100, speed: 200, jump: 650, fireRateMs: 140, bulletSpeed: 600, specialCooldown: 6000 },
    rex:  { name: 'Rex',  maxHp: 140, speed: 170, jump: 600, fireRateMs: 180, bulletSpeed: 650, specialCooldown: 7000 },
    talon:{ name: 'Talon',maxHp: 90,  speed: 230, jump: 700, fireRateMs: 110, bulletSpeed: 580, specialCooldown: 5000 },
  };
  let selectedCharKey = 'nova';

  // Entity lists
  const bullets = [];
  const enemyBullets = [];
  const enemies = [];
  const particles = [];
  const pickups = [];

  // Player object
  const player = {
    x: 100, y: FLOOR_Y - 40, w: 28, h: 40,
    vx: 0, vy: 0,
    onGround: false,
    dir: 1, // 1 right, -1 left
    canShootAtMs: 0,
    hp: 100,
    lives: 3,
    score: 0,
    invulnMs: 0,
  };

  function resetPlayerForCharacter() {
    const cfg = PLAYERS[selectedCharKey];
    player.hp = cfg.maxHp;
    player.x = 100; player.y = FLOOR_Y - player.h; player.vx = 0; player.vy = 0; player.onGround = false; player.dir = 1; player.invulnMs = 0;
    updateHud();
  }

  // HUD
  const hud = {
    char: document.getElementById('hudChar'),
    hp: document.getElementById('hudHealth'),
    livesVal: document.getElementById('hudLivesVal'),
    scoreVal: document.getElementById('hudScoreVal'),
  };
  function updateHud(){
    const cfg = PLAYERS[selectedCharKey];
    hud.char.textContent = cfg.name;
    hud.hp.textContent = 'HP: ' + Math.max(0, Math.ceil(player.hp));
    hud.livesVal.textContent = player.lives;
    hud.scoreVal.textContent = player.score;
  }

  // UI elements
  const el = {
    menu: document.getElementById('menu'),
    characterMenu: document.getElementById('characterMenu'),
    controlsMenu: document.getElementById('controlsMenu'),
    languageMenu: document.getElementById('languageMenu'),
    hud: document.getElementById('hud'),
    pause: document.getElementById('pause'),
    gameOver: document.getElementById('gameOver'),
    gameOverTitle: document.getElementById('gameOverTitle'),
    gameOverDesc: document.getElementById('gameOverDesc'),
  };

  // Menu click wiring
  document.getElementById('btnStart').addEventListener('click', () => startMission());
  document.getElementById('btnCharacters').addEventListener('click', () => switchMenu(State.CHARACTER));
  document.querySelectorAll('#characterMenu .char').forEach(btn => btn.addEventListener('click', () => { selectedCharKey = btn.dataset.char; document.getElementById('hudChar').textContent = PLAYERS[selectedCharKey].name; }));
  document.querySelectorAll('.back').forEach(btn => btn.addEventListener('click', () => switchMenu(State.MENU)));
  document.getElementById('btnControls').addEventListener('click', () => switchMenu(State.CONTROLS));
  document.getElementById('btnLanguage').addEventListener('click', () => switchMenu(State.LANGUAGE));
  document.querySelectorAll('.lang').forEach(btn => btn.addEventListener('click', () => { I18N.applyI18n(btn.dataset.lang); }));
  document.getElementById('btnResume').addEventListener('click', () => resumeGame());
  document.getElementById('btnQuit').addEventListener('click', () => backToMenu());
  document.getElementById('btnRetry').addEventListener('click', () => startMission());
  document.getElementById('btnBackToMenu').addEventListener('click', () => backToMenu());

  function switchMenu(target){
    gameState = target;
    el.menu.classList.add('hidden');
    el.characterMenu.classList.add('hidden');
    el.controlsMenu.classList.add('hidden');
    el.languageMenu.classList.add('hidden');
    el.pause.classList.add('hidden');
    el.gameOver.classList.add('hidden');

    if (target === State.MENU) el.menu.classList.remove('hidden');
    if (target === State.CHARACTER) el.characterMenu.classList.remove('hidden');
    if (target === State.CONTROLS) el.controlsMenu.classList.remove('hidden');
    if (target === State.LANGUAGE) el.languageMenu.classList.remove('hidden');
  }

  function showHud(show){ el.hud.classList.toggle('hidden', !show); }

  // Entities
  function spawnBullet(x,y,dir,speed){ bullets.push({ x, y, vx: dir*speed, vy: 0, w: 8, h: 3, life: 1.4 }); }
  function spawnEnemyBullet(x,y,dir,speed){ enemyBullets.push({ x, y, vx: dir*speed, vy: 0, w: 8, h: 3, life: 2 }); }

  function spawnParticle(x,y,color,life=0.6){ particles.push({ x, y, vx: (Math.random()*2-1)*120, vy: -Math.random()*200, color, life }); }

  function spawnRaptor(x,y){
    enemies.push({ type:'raptor', x, y, w: 34, h: 28, vx: -80, vy: 0, hp: 30, onGround:false, aiTimer:0 });
  }
  function spawnTurret(x,y){ enemies.push({ type:'turret', x, y, w: 26, h: 26, hp: 60, fireTimer: 0 }); }
  function spawnBoss(x,y){ enemies.push({ type:'rexBoss', x, y, w: 120, h: 90, vx: -60, vy: 0, hp: 600, onGround:false, stompCd:0, roarCd:0 }); }

  // Collision helper
  function aabb(a,b){ return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }

  // Level geometry (platforms as simple rects)
  const platforms = [
    {x:0, y:FLOOR_Y, w: LEVEL_LENGTH, h: 80},
    {x:600, y:FLOOR_Y-80, w: 180, h: 20},
    {x:1100, y:FLOOR_Y-120, w: 140, h: 20},
    {x:1500, y:FLOOR_Y-70, w: 160, h: 20},
    {x:2100, y:FLOOR_Y-100, w: 200, h: 20},
    {x:2700, y:FLOOR_Y-60, w: 180, h: 20},
  ];

  // Parallax layers (procedural shapes)
  function drawParallax() {
    const farSpeed = 0.2, midSpeed = 0.5, nearSpeed = 0.8;
    const cx = camera.x;

    // Far mountains
    ctx.fillStyle = '#0a1122';
    ctx.fillRect(0,0,WIDTH,HEIGHT);

    ctx.fillStyle = '#09162d';
    drawHills(-((cx*farSpeed)%800), HEIGHT-240, 800, 200, 3);
    drawHills(-((cx*farSpeed)%800)+800, HEIGHT-240, 800, 200, 3);

    // Mid jungle silhouettes
    ctx.fillStyle = '#0e233d';
    drawHills(-((cx*midSpeed)%600), HEIGHT-180, 600, 160, 4);
    drawHills(-((cx*midSpeed)%600)+600, HEIGHT-180, 600, 160, 4);

    // Near trees/bushes
    ctx.fillStyle = '#15395e';
    drawHills(-((cx*nearSpeed)%500), HEIGHT-120, 500, 120, 5);
    drawHills(-((cx*nearSpeed)%500)+500, HEIGHT-120, 500, 120, 5);
  }
  function drawHills(offsetX, baseY, width, height, bumps){
    ctx.beginPath();
    ctx.moveTo(offsetX, baseY);
    for(let i=0;i<=bumps;i++){
      const x = offsetX + (i/bumps)*width;
      const y = baseY - Math.sin(i*Math.PI/bumps) * height;
      ctx.lineTo(x,y);
    }
    ctx.lineTo(offsetX+width, HEIGHT);
    ctx.lineTo(offsetX, HEIGHT);
    ctx.closePath();
    ctx.fill();
  }

  // Rendering helpers
  function drawPlayer(){
    const cfg = PLAYERS[selectedCharKey];
    // body
    ctx.fillStyle = player.invulnMs>0 ? (Math.floor(Date.now()/80)%2? '#fff':'#ffcc00') : '#ffcc00';
    ctx.fillRect(Math.floor(player.x - camera.x), Math.floor(player.y - camera.y), player.w, player.h);
    // helmet stripe to differentiate characters
    ctx.fillStyle = selectedCharKey==='nova'?'#6cf':selectedCharKey==='rex'?'#c66':'#6c6';
    ctx.fillRect(Math.floor(player.x - camera.x), Math.floor(player.y - camera.y + 6), player.w, 4);
  }
  function drawEnemy(e){
    const x = Math.floor(e.x - camera.x), y = Math.floor(e.y - camera.y);
    if(e.type==='raptor'){
      ctx.fillStyle = '#5bc06e';
      ctx.fillRect(x,y,e.w,e.h);
      ctx.fillStyle = '#2a6';
      ctx.fillRect(x+2,y+2,e.w-4,6);
    } else if(e.type==='turret'){
      ctx.fillStyle = '#8888aa';
      ctx.fillRect(x,y,e.w,e.h);
      ctx.fillStyle = '#667';
      ctx.fillRect(x+4,y+4,e.w-8,e.h-8);
    } else if(e.type==='rexBoss'){
      ctx.fillStyle = '#9b5b34';
      ctx.fillRect(x,y,e.w,e.h);
      ctx.fillStyle = '#c96';
      ctx.fillRect(x,y,e.w,20);
    }
  }
  function drawBullet(b){
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(Math.floor(b.x - camera.x), Math.floor(b.y - camera.y), b.w, b.h);
  }
  function drawEnemyBullet(b){ ctx.fillStyle = '#66c1ff'; ctx.fillRect(Math.floor(b.x - camera.x), Math.floor(b.y - camera.y), b.w, b.h); }

  function drawPickup(p){ ctx.fillStyle = p.type==='hp'? '#ff6' : '#6f6'; ctx.fillRect(Math.floor(p.x - camera.x), Math.floor(p.y - camera.y), 14, 14); }

  function drawParticles(){
    particles.forEach(p=>{ ctx.fillStyle = p.color; ctx.fillRect(Math.floor(p.x - camera.x), Math.floor(p.y - camera.y), 3,3); });
  }

  function drawPlatforms(){
    ctx.fillStyle = '#2b3a55';
    platforms.forEach(pl => { ctx.fillRect(Math.floor(pl.x - camera.x), Math.floor(pl.y - camera.y), pl.w, pl.h); });
    // ground grass line
    ctx.fillStyle = '#3d6b3d';
    ctx.fillRect(Math.floor(0 - camera.x), Math.floor(FLOOR_Y-6 - camera.y), WIDTH+200, 6);
  }

  // Physics and update
  function update(dt){
    if(gameState!==State.PLAYING) return;

    const cfg = PLAYERS[selectedCharKey];

    // Input
    let moving = 0;
    if(keys.has('arrowleft') || keys.has('a')) moving -= 1;
    if(keys.has('arrowright') || keys.has('d')) moving += 1;
    player.vx = moving * cfg.speed;
    if(moving!==0) player.dir = Math.sign(moving);

    const jumpPressed = onceKeys.has('arrowup') || onceKeys.has(' ');
    if(jumpPressed && player.onGround){ player.vy = -cfg.jump; player.onGround=false; }

    const shootPressed = keys.has('z');
    if(shootPressed && performance.now() >= player.canShootAtMs){
      spawnBullet(player.x + (player.dir>0?player.w:0), player.y + 16, player.dir, cfg.bulletSpeed);
      player.canShootAtMs = performance.now() + cfg.fireRateMs;
    }
    const specialPressed = onceKeys.has('x');
    if(specialPressed){
      // Different specials by character: Nova rapid volley, Rex piercing shot, Talon dash
      if(selectedCharKey==='nova'){
        for(let i=0;i<4;i++){ spawnBullet(player.x + player.w/2, player.y + 10, player.dir, cfg.bulletSpeed + i*60); }
      } else if(selectedCharKey==='rex'){
        bullets.push({ x: player.x + (player.dir>0?player.w:0), y: player.y+14, vx: player.dir*(cfg.bulletSpeed*0.9), vy: 0, w: 12, h: 4, life: 1.6, pierce: 3});
      } else if(selectedCharKey==='talon'){
        player.vx += player.dir*420; player.invulnMs = 300; // quick dash
      }
    }

    // Pause toggle
    if(onceKeys.has('escape') || onceKeys.has('p')){ togglePause(); }

    // Gravity
    player.vy += GRAVITY * dt;

    // Apply movement with simple platform collisions
    player.x += player.vx * dt;
    platforms.forEach(pl => {
      if(aabb(player,{x:pl.x-1,y:pl.y-1,w:pl.w+2,h:pl.h+2})){
        if(player.vx>0 && player.x+player.w>pl.x && player.x+player.w<pl.x+20 && player.y+player.h>pl.y+2) player.x = pl.x-player.w;
        if(player.vx<0 && player.x<pl.x+pl.w && player.x>pl.x+pl.w-20 && player.y+player.h>pl.y+2) player.x = pl.x+pl.w;
      }
    });

    player.y += player.vy * dt;
    player.onGround=false;
    platforms.forEach(pl => {
      if(aabb(player, pl)){
        if(player.vy>0 && player.y+player.h > pl.y && player.y+player.h < pl.y+20){ player.y = pl.y - player.h; player.vy = 0; player.onGround = true; }
        if(player.vy<0 && player.y < pl.y+pl.h && player.y > pl.y+pl.h-20){ player.y = pl.y+pl.h; player.vy = 50; }
      }
    });

    // Boundaries
    player.x = Math.max(0, Math.min(LEVEL_LENGTH-40, player.x));

    // Camera follows
    camera.x = Math.max(0, Math.min(LEVEL_LENGTH - WIDTH, player.x - WIDTH/2 + player.w/2));
    camera.y = 0;

    // Bullets
    for(let i=bullets.length-1;i>=0;i--){ const b=bullets[i]; b.x += b.vx*dt; b.y += b.vy*dt; b.life -= dt; if(b.life<=0) bullets.splice(i,1); }
    for(let i=enemyBullets.length-1;i>=0;i--){ const b=enemyBullets[i]; b.x += b.vx*dt; b.y += b.vy*dt; b.life -= dt; if(b.life<=0) enemyBullets.splice(i,1); }

    // Enemies AI
    for(let i=enemies.length-1;i>=0;i--){
      const e=enemies[i];
      if(e.type==='raptor'){
        // run left-right, jump sometimes, pounce near player
        e.aiTimer -= dt;
        if(e.aiTimer<=0){ e.vx = (Math.random()<0.6? -1:1) * (60+Math.random()*60); e.aiTimer = 1+Math.random()*2; if(Math.random()<0.2 && e.onGround) e.vy = -600; }
        // chase player
        if(Math.abs(player.x - e.x) < 200) e.vx = Math.sign(player.x - e.x)*120;
        // gravity
        e.vy += GRAVITY*dt;
        e.x += e.vx*dt; e.y += e.vy*dt; e.onGround=false;
        platforms.forEach(pl=>{ if(aabb(e,pl)){ if(e.vy>0) { e.y = pl.y - e.h; e.vy = 0; e.onGround=true; } }});
      } else if(e.type==='turret'){
        e.fireTimer -= dt;
        if(e.fireTimer<=0 && Math.abs(e.x - player.x) < 500){
          const dir = player.x > e.x ? 1 : -1;
          spawnEnemyBullet(e.x + e.w/2, e.y+10, dir, 300);
          e.fireTimer = 1.2;
        }
      } else if(e.type==='rexBoss'){
        e.vy += GRAVITY*dt; e.x += e.vx*dt; e.y += e.vy*dt; e.onGround=false;
        platforms.forEach(pl=>{ if(aabb(e,pl)){ if(e.vy>0){ e.y = pl.y - e.h; e.vy = 0; e.onGround=true; } }});
        // simple boss logic: pace and occasionally charge
        e.stompCd -= dt; e.roarCd -= dt;
        if(e.roarCd<=0){ e.vx = (player.x>e.x?1:-1)*100; e.roarCd = 3.5; }
        if(Math.random()<0.005 && e.onGround){ e.vy = -700; e.stompCd = 0.6; }
        if(e.stompCd>0 && Math.abs(e.x - player.x)<120 && Math.abs(e.y - player.y)<80){ damagePlayer(25); }
      }

      // enemy hit by bullets
      for(let j=bullets.length-1;j>=0;j--){ const b=bullets[j]; if(aabb({x:b.x,y:b.y,w:b.w,h:b.h}, e)){
        const dmg = b.w>8? 18 : 12;
        e.hp -= dmg; spawnParticle(b.x,b.y,'#ffc'); if(!b.pierce){ bullets.splice(j,1); } else { b.pierce--; if(b.pierce<=0) bullets.splice(j,1); }
        if(e.hp<=0){
          // death
          spawnParticle(e.x+e.w/2, e.y+e.h/2, '#f66');
          enemies.splice(i,1); player.score += 100; updateHud();
          break;
        }
      }}
    }

    // Enemy bullets hit player
    for(let i=enemyBullets.length-1;i>=0;i--){ const b=enemyBullets[i]; if(aabb({x:b.x,y:b.y,w:b.w,h:b.h}, player)) { enemyBullets.splice(i,1); damagePlayer(12); }}

    // Enemies touch player
    enemies.forEach(e=>{ if(aabb(e,player)) damagePlayer(e.type==='raptor'?15:12); });

    // Pickups
    for(let i=pickups.length-1;i>=0;i--){ const p=pickups[i]; if(aabb({x:p.x,y:p.y,w:14,h:14}, player)){ if(p.type==='hp'){ player.hp = Math.min(PLAYERS[selectedCharKey].maxHp, player.hp+30); } pickups.splice(i,1); updateHud(); }}

    // Invulnerability timer
    if(player.invulnMs>0) player.invulnMs -= dt*1000;

    // Level scripting (spawns)
    missionScripting();

    // Clear once keys
    onceKeys.clear();
  }

  function damagePlayer(amount){
    if(player.invulnMs>0) return; player.hp -= amount; player.invulnMs = 600; updateHud();
    if(player.hp<=0){
      player.lives--; updateHud();
      if(player.lives<0){ onGameOver(false); } else { resetPlayerForCharacter(); }
    }
  }

  // Mission 1 scripting
  let spawnFlags = { seg1:false, seg2:false, seg3:false, boss:false, clear:false };
  function resetMission(){
    bullets.length=0; enemyBullets.length=0; enemies.length=0; particles.length=0; pickups.length=0;
    spawnFlags = { seg1:false, seg2:false, seg3:false, boss:false, clear:false };
    player.score = 0; player.lives = 3; updateHud();
  }
  function missionScripting(){
    const x = player.x;
    if(!spawnFlags.seg1 && x>300){ for(let i=0;i<4;i++) spawnRaptor(600+i*80, FLOOR_Y-28); spawnTurret(900, FLOOR_Y-26); spawnFlags.seg1=true; }
    if(!spawnFlags.seg2 && x>1200){ for(let i=0;i<5;i++) spawnRaptor(1300+i*70, FLOOR_Y-28); spawnTurret(1600, FLOOR_Y-26); spawnFlags.seg2=true; }
    if(!spawnFlags.seg3 && x>2100){ for(let i=0;i<6;i++) spawnRaptor(2200+i*70, FLOOR_Y-28); spawnTurret(2500, FLOOR_Y-26); spawnFlags.seg3=true; }
    if(!spawnFlags.boss && x>3200){ spawnBoss(3600, FLOOR_Y-90); spawnFlags.boss=true; }

    // Victory: no enemies and reached end
    if(spawnFlags.boss && enemies.length===0 && !spawnFlags.clear && x>3600){ spawnFlags.clear=true; onGameOver(true); }
  }

  function startMission(){
    switchMenu(State.PLAYING);
    showHud(true);
    resetMission();
    resetPlayerForCharacter();
  }

  function togglePause(){
    if(gameState!==State.PLAYING && gameState!==State.PAUSED) return;
    if(gameState===State.PLAYING){ gameState=State.PAUSED; el.pause.classList.remove('hidden'); }
    else { resumeGame(); }
  }
  function resumeGame(){ gameState=State.PLAYING; el.pause.classList.add('hidden'); }

  function backToMenu(){
    gameState = State.MENU; showHud(false); switchMenu(State.MENU);
  }

  function onGameOver(victory){
    gameState = State.GAMEOVER; showHud(false);
    el.gameOver.classList.remove('hidden');
    const lang = document.documentElement.lang || 'en';
    const dict = I18N.strings[lang] || I18N.strings.en;
    el.gameOverTitle.textContent = victory? dict.missionClear : 'Game Over';
    el.gameOverDesc.textContent = victory? dict.mission1 : dict.youDied;
  }

  // Main loop
  let last = performance.now();
  function loop(now){
    const dt = Math.min(0.033, (now-last)/1000); last = now;

    if(gameState===State.PLAYING) update(dt); else onceKeys.clear();

    // Render
    ctx.save();
    drawParallax();
    drawPlatforms();

    bullets.forEach(drawBullet);
    enemyBullets.forEach(drawEnemyBullet);
    enemies.forEach(drawEnemy);
    drawPlayer();
    drawParticles();

    ctx.restore();

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
