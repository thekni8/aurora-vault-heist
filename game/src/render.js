// Aurora Vault Heist — everything the eye sees: the museum floor, light
// pools, vision cones, characters, loot, smoke, prompts and the end screens.
// The HUD bar itself lives in the DOM and is updated from here.

HV.Render = (function () {
  const CFG = HV.CFG;
  const COL = CFG.COL;
  let canvas = null, ctx = null;
  let toastTimer = null;

  function init() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
  }

  // --- helpers ------------------------------------------------------------

  function wedge(x, y, angle, half, range, fill, edge) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, range, angle - half, angle + half);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function circle(x, y, r, fill, stroke) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function rect(r, fill, stroke) {
    ctx.fillStyle = fill;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
    }
  }

  function diamondShape(x, y, r, fill) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r * 0.7, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r * 0.7, y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  // --- the world ----------------------------------------------------------

  function drawFloor(state, t) {
    ctx.fillStyle = COL.floor;
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    // Tile grid, faint.
    ctx.strokeStyle = COL.floorTile;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 40; x <= 1240; x += 40) { ctx.moveTo(x, 56); ctx.lineTo(x, 664); }
    for (let y = 56; y <= 664; y += 40) { ctx.moveTo(40, y); ctx.lineTo(1240, y); }
    ctx.stroke();
    // Warm light pools.
    for (let i = 0; i < HV.LEVEL.lamps.length; i++) {
      const l = HV.LEVEL.lamps[i];
      const g = ctx.createRadialGradient(l.x, l.y, 8, l.x, l.y, l.r);
      g.addColorStop(0, 'rgba(255, 205, 110, 0.13)');
      g.addColorStop(1, 'rgba(255, 205, 110, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    // The van apron outside the south exit.
    ctx.fillStyle = '#0a0e18';
    ctx.fillRect(150, 664, 160, 52);
    ctx.strokeStyle = '#2c3a55';
    ctx.strokeRect(150.5, 664.5, 160, 52);
  }

  function drawVent() {
    const v = HV.LEVEL.vent;
    rect(v, COL.vent, COL.ventSlat);
    ctx.strokeStyle = COL.ventSlat;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = v.x + 18; x < v.x + v.w; x += 22) {
      ctx.moveTo(x, v.y + 6);
      ctx.lineTo(x, v.y + v.h - 6);
    }
    ctx.stroke();
    ctx.fillStyle = '#8fa3c8';
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VENT — SLOW, UNSEEN', v.x + v.w / 2, v.y + v.h - 9);
  }

  function drawWallsAndCover() {
    for (let i = 0; i < HV.LEVEL.walls.length; i++) {
      rect(HV.LEVEL.walls[i], COL.wall, COL.wallEdge);
    }
    for (let i = 0; i < HV.LEVEL.cover.length; i++) {
      const c = HV.LEVEL.cover[i];
      rect(c, COL.cover, COL.coverEdge);
      if (c.kind === 'statue') {
        circle(c.x + c.w / 2, c.y + c.h / 2, 12, '#2a3550', '#5d6f94');
        circle(c.x + c.w / 2, c.y + c.h / 2, 5, '#8fa3c8');
      } else if (c.kind === 'planter') {
        circle(c.x + c.w / 2, c.y + c.h / 2, 9, '#1f4d2e', '#3f7a52');
        circle(c.x + c.w / 2 - 6, c.y + c.h / 2 - 3, 5, '#2a6a3e');
        circle(c.x + c.w / 2 + 7, c.y + c.h / 2 + 3, 5, '#2a6a3e');
      }
    }
  }

  function drawVaultDoor() {
    const d = HV.LEVEL.vaultDoor;
    if (d.state === 'open') {
      ctx.fillStyle = '#0a0f1c';
      ctx.fillRect(d.x - 2, d.y, d.w + 4, d.h);
      return;
    }
    rect(d, '#3a3f4a', '#c9a94f');
    ctx.fillStyle = '#c9a94f';
    ctx.beginPath();
    ctx.arc(d.x + d.w / 2, d.y + d.h / 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a3f4a';
    ctx.beginPath();
    ctx.arc(d.x + d.w / 2, d.y + d.h / 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c9a94f';
    ctx.font = 'bold 10px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VAULT', d.x + d.w / 2, d.y - 8);
  }

  function drawLoot(state, t) {
    const pulse = 0.75 + 0.25 * Math.sin(t * 3);
    for (let i = 0; i < HV.LEVEL.loot.length; i++) {
      const l = HV.LEVEL.loot[i];
      if (l.taken) continue;
      const glow = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, 30);
      glow.addColorStop(0, 'rgba(255, 217, 122, ' + (0.35 * pulse) + ')');
      glow.addColorStop(1, 'rgba(255, 217, 122, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(l.x - 30, l.y - 30, 60, 60);
      if (l.kind === 'painting') {
        ctx.fillStyle = '#6b4f2a';
        ctx.fillRect(l.x - 20, l.y - 13, 40, 26);
        ctx.strokeStyle = COL.gold;
        ctx.lineWidth = 2;
        ctx.strokeRect(l.x - 20, l.y - 13, 40, 26);
        ctx.fillStyle = '#8fb8a8';
        ctx.fillRect(l.x - 15, l.y - 8, 30, 16);
        ctx.fillStyle = '#e8e4d8';
        ctx.beginPath();
        ctx.arc(l.x - 4, l.y - 2, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(180, 210, 235, 0.25)';
        ctx.fillRect(l.x - 16, l.y - 10, 32, 20);
        ctx.strokeStyle = '#9fc4e0';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(l.x - 16, l.y - 10, 32, 20);
        diamondShape(l.x, l.y, 7 * pulse + 3, COL.gold);
      }
    }
    // The Aurora Diamond on its pedestal.
    const d = HV.LEVEL.diamond;
    ctx.fillStyle = '#2a3550';
    ctx.fillRect(d.x - 16, d.y + 8, 32, 14);
    ctx.strokeStyle = '#5d6f94';
    ctx.strokeRect(d.x - 16, d.y + 8, 32, 14);
    if (!d.taken) {
      const glow = ctx.createRadialGradient(d.x, d.y, 4, d.x, d.y, 64);
      glow.addColorStop(0, 'rgba(160, 220, 255, ' + (0.55 * pulse) + ')');
      glow.addColorStop(0.5, 'rgba(255, 217, 122, ' + (0.25 * pulse) + ')');
      glow.addColorStop(1, 'rgba(255, 217, 122, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(d.x - 64, d.y - 64, 128, 128);
      diamondShape(d.x, d.y, 15 + 3 * pulse, '#bfe9ff');
      diamondShape(d.x, d.y, 8, '#ffffff');
      ctx.fillStyle = '#dff4ff';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AURORA DIAMOND', d.x, d.y - 26);
    }
  }

  function drawVan() {
    const v = HV.LEVEL.van;
    ctx.fillStyle = COL.van;
    ctx.beginPath();
    ctx.roundRect(v.x + 6, v.y + 4, 148, 34, 8);
    ctx.fill();
    ctx.strokeStyle = COL.vanTrim;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#9fc4e0';
    ctx.fillRect(v.x + 118, v.y + 10, 26, 22); // cab window
    ctx.fillStyle = '#16283f';
    ctx.fillRect(v.x + 121, v.y + 13, 20, 16);
    circle(v.x + 34, v.y + 40, 8, '#0a0f1c', '#5d6f94');
    circle(v.x + 128, v.y + 40, 8, '#0a0f1c', '#5d6f94');
    ctx.fillStyle = COL.gold;
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GETAWAY VAN', v.x + v.w / 2, v.y + 24);
  }

  // --- watchers -----------------------------------------------------------

  function drawCones(state) {
    for (let i = 0; i < state.cameras.length; i++) {
      const c = state.cameras[i];
      if (c.disabled) continue;
      wedge(c.x, c.y, c.angle, CFG.CAMERA_CONE_HALF, CFG.CAMERA_RANGE,
        c.sees ? COL.alertCone : COL.cameraCone,
        c.sees ? COL.alertConeEdge : COL.cameraConeEdge);
    }
    for (let i = 0; i < state.guards.length; i++) {
      const g = state.guards[i];
      const alerted = g.sees || g.mode === 'chase';
      wedge(g.x, g.y, g.angle, CFG.GUARD_CONE_HALF, CFG.GUARD_CONE_RANGE,
        alerted ? COL.alertCone : COL.guardCone,
        alerted ? COL.alertConeEdge : COL.guardConeEdge);
    }
  }

  function drawSmoke(state) {
    for (let i = 0; i < state.smokeClouds.length; i++) {
      const s = state.smokeClouds[i];
      const a = Math.min(0.55, 0.25 + (s.t / CFG.SMOKE_TIME) * 0.3);
      const g = ctx.createRadialGradient(s.x, s.y, 4, s.x, s.y, s.r);
      g.addColorStop(0, 'rgba(200, 200, 210, ' + a + ')');
      g.addColorStop(1, 'rgba(200, 200, 210, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawGuards(state) {
    for (let i = 0; i < state.guards.length; i++) {
      const g = state.guards[i];
      circle(g.x, g.y, CFG.GUARD_R, COL.guard, COL.guardTrim);
      // Cap brim shows facing.
      ctx.beginPath();
      ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x + Math.cos(g.angle - 0.5) * (CFG.GUARD_R + 5), g.y + Math.sin(g.angle - 0.5) * (CFG.GUARD_R + 5));
      ctx.lineTo(g.x + Math.cos(g.angle + 0.5) * (CFG.GUARD_R + 5), g.y + Math.sin(g.angle + 0.5) * (CFG.GUARD_R + 5));
      ctx.closePath();
      ctx.fillStyle = g.mode === 'chase' ? '#ff2d1e' : COL.guardTrim;
      ctx.fill();
      if (g.mode === 'chase') {
        ctx.fillStyle = '#ff6b5e';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', g.x, g.y - CFG.GUARD_R - 6);
      }
    }
  }

  function drawCameras(state) {
    for (let i = 0; i < state.cameras.length; i++) {
      const c = state.cameras[i];
      circle(c.x, c.y, 7, c.disabled ? '#3a3f4a' : '#5a2020', c.disabled ? '#666' : '#ff5a4a');
      circle(c.x, c.y, 3, c.disabled ? '#222' : '#ff2d1e');
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + Math.cos(c.angle) * 13, c.y + Math.sin(c.angle) * 13);
      ctx.strokeStyle = c.disabled ? '#666' : '#ff5a4a';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawPlayer(state, t) {
    const p = state.player;
    const r = p.sneaking ? CFG.PLAYER_R - 2 : CFG.PLAYER_R;
    if (p.inVent) {
      // In the duct the thief is a faint outline under the grate.
      ctx.globalAlpha = 0.55;
    }
    circle(p.x, p.y, r, COL.player, COL.playerTrim);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(p.facing) * (r + 7), p.y + Math.sin(p.facing) * (r + 7));
    ctx.strokeStyle = COL.playerTrim;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (p.sneaking) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 217, 122, 0.5)';
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // --- prompts and overlays -------------------------------------------------

  function drawPrompt(state) {
    const p = state.player;
    let text = null;
    if (p.nearLoot) {
      text = p.nearLoot.kind === 'diamond' ? 'Press E — take the Aurora Diamond'
        : p.nearLoot.kind === 'painting' ? 'Press E — lift the painting'
        : 'Press E — empty the gem case';
    } else if (p.nearVault) {
      text = p.lockpick > 0
        ? 'Hold E — lockpick the vault (silent, fast)'
        : 'Hold E — force the vault (slow, noisy)';
    } else if (p.nearVan && !state.hasDiamond) {
      text = 'The van is waiting — the diamond is still inside';
    }
    if (text) {
      ctx.font = '14px "Segoe UI", sans-serif';
      const w = ctx.measureText(text).width + 22;
      ctx.fillStyle = 'rgba(5, 9, 18, 0.85)';
      ctx.beginPath();
      ctx.roundRect(p.x - w / 2, p.y - 52, w, 26, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(214, 178, 94, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#ffd97a';
      ctx.textAlign = 'center';
      ctx.fillText(text, p.x, p.y - 34);
    }
    if (p.vaultBusy) {
      const bw = 90;
      ctx.fillStyle = '#1c2536';
      ctx.fillRect(p.x - bw / 2, p.y - 72, bw, 8);
      ctx.fillStyle = COL.gold;
      ctx.fillRect(p.x - bw / 2, p.y - 72, bw * Math.min(1, p.vaultProgress), 8);
      ctx.strokeStyle = '#55648a';
      ctx.strokeRect(p.x - bw / 2, p.y - 72, bw, 8);
    }
  }

  function panel(title, lines, accent) {
    ctx.fillStyle = 'rgba(5, 9, 18, 0.88)';
    ctx.beginPath();
    ctx.roundRect(340, 170, 600, 360, 12);
    ctx.fill();
    ctx.strokeStyle = accent || COL.goldDim;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = accent || COL.gold;
    ctx.font = 'bold 34px "Segoe UI", sans-serif';
    ctx.fillText(title, 640, 240);
    ctx.fillStyle = '#e8e4d8';
    ctx.font = '17px "Segoe UI", sans-serif';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 640, 290 + i * 32);
    }
  }

  function drawTitle() {
    ctx.fillStyle = 'rgba(5, 9, 18, 0.72)';
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    panel('AURORA VAULT HEIST', [
      'The Halcyon Museum, after dark. Mara Voss is inside.',
      'Steal the Aurora Diamond — then reach the getaway van.',
      '',
      'Move: WASD / arrows    Sneak: hold Shift    Interact: E    Tool: Q',
      'Tools: 1 Smoke · 2 EMP · 3 Lockpick — each one costs score.',
      'Stay out of the yellow cones. Red cones are watching you.',
      '',
      'Press Enter or click to begin',
    ]);
  }

  function drawEnd(state) {
    const s = state.winStats;
    const mins = Math.floor(s.time / 60);
    const secs = Math.floor(s.time % 60).toString().padStart(2, '0');
    if (state.mode === 'win') {
      panel('CLEAN GETAWAY', [
        'The Aurora Diamond is gone before anyone knew it was there.',
        '',
        'Loot: ' + (s.lootTaken + (s.hasDiamond ? 1 : 0)) + ' of 7    Time: ' + mins + ':' + secs,
        'Tools left: ' + s.toolsLeft + '    Score: ' + s.score,
        '',
        'Press Enter to run it again',
      ], '#7fd67f');
    } else {
      panel('BUSTED', [
        'The alarm hit 100. The museum locks down around you.',
        '',
        'Loot kept: ' + s.lootTaken + ' of 7    Time: ' + mins + ':' + secs,
        'Score: ' + s.score,
        '',
        'Press Enter to try again',
      ], '#ff5a4a');
    }
  }

  // --- frame ----------------------------------------------------------------

  function draw(state) {
    const t = state.time;
    drawFloor(state, t);
    drawVent();
    drawVan();
    drawWallsAndCover();
    drawVaultDoor();
    drawLoot(state, t);
    drawCones(state);
    drawSmoke(state);
    drawGuards(state);
    drawCameras(state);
    drawPlayer(state, t);
    if (state.mode === 'playing') drawPrompt(state);
    if (state.mode === 'title') drawTitle();
    if (state.mode === 'win' || state.mode === 'busted') drawEnd(state);
    // The SPOTTED flash: red frame + banner while the timer runs.
    if (state.spottedTimer > 0) {
      const a = Math.min(1, state.spottedTimer);
      ctx.strokeStyle = 'rgba(255, 45, 30, ' + (0.85 * a) + ')';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, CFG.W - 14, CFG.H - 14);
      ctx.fillStyle = 'rgba(255, 45, 30, ' + (0.9 * a) + ')';
      ctx.font = 'bold 44px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SPOTTED', CFG.W / 2, 150);
    }
    updateHud(state);
  }

  // --- the DOM HUD -----------------------------------------------------------

  function fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return m + ':' + s;
  }

  function updateHud(state) {
    const $ = function (id) { return document.getElementById(id); };
    const fill = $('alarmFill');
    if (!fill) return;
    fill.style.width = state.alarm + '%';
    fill.className = state.alarm >= CFG.ALARM_SPOTTED_AT ? 'hot' : '';
    $('alarmPct').textContent = Math.round(state.alarm) + '%';
    $('stateLine').textContent =
      state.mode !== 'playing' ? (state.mode === 'title' ? 'Ready' : state.mode === 'win' ? 'Clean getaway' : 'Busted')
      : state.seenByGuard ? 'Seen by a guard!'
      : state.seen ? 'On camera!'
      : state.alarm > 0 ? 'Cooling down…' : 'Undetected';
    $('lootCount').textContent = (state.lootTaken + (state.hasDiamond ? 1 : 0)) + ' / 7';
    $('scoreLine').textContent = 'Score ' + state.score;
    $('timer').textContent = fmtTime(state.time);
    $('smokeCount').textContent = state.player.smoke;
    $('empCount').textContent = state.player.emp;
    $('pickCount').textContent = state.player.lockpick;
    const sel = state.player.selectedTool;
    $('btnSmoke').classList.toggle('sel', sel === 1);
    $('btnEmp').classList.toggle('sel', sel === 2);
    $('btnPick').classList.toggle('sel', sel === 3);
    $('btnSmoke').disabled = state.player.smoke <= 0;
    $('btnEmp').disabled = state.player.emp <= 0;
    $('btnPick').disabled = state.player.lockpick <= 0;
    const muteBtn = $('muteBtn');
    if (muteBtn) muteBtn.textContent = HV.Audio.isMuted() ? 'Sound: off (M)' : 'Sound: on (M)';
  }

  return {
    init: init,
    draw: draw,
    toast: function (msg) {
      const el = document.getElementById('toast');
      if (!el) return;
      el.textContent = msg;
      el.style.opacity = '1';
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { el.style.opacity = '0'; }, 2600);
    },
    setObjective: function (msg) {
      const el = document.getElementById('objectiveBar');
      if (el) el.textContent = msg;
    },
  };
})();
