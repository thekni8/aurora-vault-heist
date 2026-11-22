// Aurora Vault Heist — keyboard and mouse. The game reads HV.Input each
// frame; this file only records what the player is pressing.

HV.Input = (function () {
  const keys = {};
  const pressed = {}; // keys that went down since the last frame was read
  let interactHeld = false;
  let interactPressed = false;
  let toolPressed = false;
  let selectTool = 0; // 0 = none requested this frame

  function keyOf(e) {
    return e.key.length === 1 ? e.key.toLowerCase() : e.key;
  }

  function onDown(e) {
    const k = keyOf(e);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    if (!keys[k]) pressed[k] = true;
    keys[k] = true;
    if (k === 'e') {
      if (!interactHeld) interactPressed = true;
      interactHeld = true;
    }
    if (k === 'q') toolPressed = true;
    if (k === '1') selectTool = 1;
    if (k === '2') selectTool = 2;
    if (k === '3') selectTool = 3;
    if (k === 'm') HV.Audio.toggleMute();
    HV.Audio.unlock();
    if (HV.onKeyDown) HV.onKeyDown(k);
  }

  function onUp(e) {
    const k = keyOf(e);
    keys[k] = false;
    if (k === 'e') interactHeld = false;
  }

  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  window.addEventListener('blur', function () {
    for (const k in keys) keys[k] = false;
    interactHeld = false;
  });

  return {
    // Movement vector from WASD / arrows, normalised.
    move: function () {
      let x = 0, y = 0;
      if (keys['a'] || keys['ArrowLeft']) x -= 1;
      if (keys['d'] || keys['ArrowRight']) x += 1;
      if (keys['w'] || keys['ArrowUp']) y -= 1;
      if (keys['s'] || keys['ArrowDown']) y += 1;
      if (x !== 0 && y !== 0) { x *= 0.7071; y *= 0.7071; }
      return { x: x, y: y };
    },
    sneaking: function () { return !!(keys['Shift']); },
    interactHeld: function () { return interactHeld; },

    // Edge-triggered reads: true once, then cleared.
    consumeInteractPressed: function () {
      const v = interactPressed;
      interactPressed = false;
      return v;
    },
    consumeToolPressed: function () {
      const v = toolPressed;
      toolPressed = false;
      return v;
    },
    consumeSelectTool: function () {
      const v = selectTool;
      selectTool = 0;
      return v;
    },
    wasPressed: function (k) {
      const v = !!pressed[k];
      pressed[k] = false;
      return v;
    },
    anyKey: function () {
      for (const k in pressed) {
        if (pressed[k]) { pressed[k] = false; return true; }
      }
      return false;
    },
  };
})();

// HUD tool buttons: click to select a tool, then Q (or click again) to use it.
window.addEventListener('DOMContentLoaded', function () {
  const bind = function (id, n) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', function () {
      HV.Audio.unlock();
      if (HV.selectToolByIndex) HV.selectToolByIndex(n);
    });
  };
  bind('btnSmoke', 1);
  bind('btnEmp', 2);
  bind('btnPick', 3);
  const mute = document.getElementById('muteBtn');
  if (mute) {
    mute.addEventListener('click', function () {
      const m = HV.Audio.toggleMute();
      mute.textContent = m ? 'Sound: off (M)' : 'Sound: on (M)';
    });
  }
});
