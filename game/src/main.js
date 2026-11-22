// Aurora Vault Heist — game loop, states and wiring. Title, playing, win
// and busted; the loop updates the world, then the renderer draws it.

HV.inSmoke = function (state, x, y) {
  for (let i = 0; i < state.smokeClouds.length; i++) {
    const s = state.smokeClouds[i];
    if (s.t > 0 && Math.hypot(s.x - x, s.y - y) < s.r) return true;
  }
  return false;
};

HV.toast = function (msg) { HV.Render.toast(msg); };
HV.setObjective = function (msg) { HV.Render.setObjective(msg); };

HV.freshState = function () {
  // The level's mutable bits reset with every run.
  for (let i = 0; i < HV.LEVEL.loot.length; i++) HV.LEVEL.loot[i].taken = false;
  HV.LEVEL.diamond.taken = false;
  HV.LEVEL.vaultDoor.state = 'locked';
  HV.LEVEL.vaultDoor.progress = 0;

  const state = {
    mode: 'title',
    time: 0,
    alarm: 0,
    score: 0,
    lootTaken: 0,
    hasDiamond: false,
    seen: false,
    seenByGuard: false,
    spottedTimer: 0,
    empTimer: 0,
    smokeClouds: [],
    vaultDoorClosed: true,
    vanNagged: 0,
    frozen: false,
    winStats: null,
    player: null,
    guards: null,
    cameras: null,
  };
  state.player = HV.Player.fresh();
  state.guards = HV.Guards.fresh();
  state.cameras = HV.Cameras.fresh();
  return state;
};

HV.winRun = function (state) {
  if (state.mode !== 'playing') return;
  const p = state.player;
  const timeBonus = Math.max(0, HV.CFG.TIME_BONUS_PAR - Math.floor(state.time)) * HV.CFG.TIME_BONUS_PER_SEC;
  state.score += timeBonus;
  state.winStats = {
    time: state.time,
    score: state.score,
    lootTaken: state.lootTaken,
    hasDiamond: true,
    toolsLeft: p.smoke + p.emp + p.lockpick,
  };
  state.mode = 'win';
  HV.Audio.win();
};

HV.bustRun = function (state) {
  if (state.mode !== 'playing') return;
  const p = state.player;
  state.winStats = {
    time: state.time,
    score: state.score,
    lootTaken: state.lootTaken,
    hasDiamond: false,
    toolsLeft: p.smoke + p.emp + p.lockpick,
  };
  state.mode = 'busted';
  HV.Audio.bust();
};

(function () {
  const state = HV.freshState();
  HV.state = state;

  HV.Render.init();

  // A staged screenshot scene (?shot=1..4) instead of the title screen.
  const shotParam = new URLSearchParams(window.location.search).get('shot');
  const shotN = shotParam ? parseInt(shotParam, 10) : 0;
  if (shotN >= 1 && shotN <= 4) {
    HV.Shots.apply(state, shotN);
  }

  function startRun() {
    const fresh = HV.freshState();
    fresh.mode = 'playing';
    // Keep the same object identity the loop closes over, so HV.state and
    // the loop always read the same run.
    for (const k in state) delete state[k];
    Object.assign(state, fresh);
    HV.state = state;
    HV.Audio.unlock();
    HV.setObjective('Steal the Aurora Diamond — then reach the van');
  }

  HV.onKeyDown = function (k) {
    if (k === 'Enter' || k === ' ') {
      if (state.mode === 'title' || state.mode === 'win' || state.mode === 'busted') {
        startRun();
      }
    }
  };

  document.getElementById('game').addEventListener('click', function () {
    if (state.mode === 'title' || state.mode === 'win' || state.mode === 'busted') {
      startRun();
    }
  });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;

    if (state.mode === 'playing' && !state.frozen) {
      HV.Player.update(state.player, state, dt);
      HV.Guards.update(state.guards, state.player, state, dt);
      HV.Cameras.update(state.cameras, state.player, state, dt);
      HV.Alarm.update(state, dt);

      if (state.empTimer > 0) state.empTimer -= dt;
      for (let i = state.smokeClouds.length - 1; i >= 0; i--) {
        state.smokeClouds[i].t -= dt;
        if (state.smokeClouds[i].t <= 0) state.smokeClouds.splice(i, 1);
      }

      HV.Loot.checkVan(state);
      HV.Audio.alarmPulse(dt, state.alarm);
    }

    HV.Render.draw(state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
