// Aurora Vault Heist — the alarm meter: it climbs while the thief is seen,
// drains while hidden, and at 100 the run is busted.

HV.Alarm = (function () {
  const CFG = HV.CFG;

  function update(state, dt) {
    let rate = 0;
    let seenByGuard = false;
    let seenByCamera = false;

    for (let i = 0; i < state.guards.length; i++) {
      if (state.guards[i].sees) {
        seenByGuard = true;
        rate += CFG.ALARM_GUARD_RATE;
      }
    }
    for (let i = 0; i < state.cameras.length; i++) {
      if (state.cameras[i].sees) {
        seenByCamera = true;
        rate += CFG.ALARM_CAMERA_RATE;
      }
    }
    rate = Math.min(rate, CFG.ALARM_MAX_RATE);
    state.seen = seenByGuard || seenByCamera;
    state.seenByGuard = seenByGuard;

    if (rate > 0) {
      const before = state.alarm;
      state.alarm = Math.min(CFG.ALARM_MAX, state.alarm + rate * dt);
      if (before < CFG.ALARM_SPOTTED_AT && state.alarm >= CFG.ALARM_SPOTTED_AT) {
        onSpotted(state);
      }
    } else {
      state.alarm = Math.max(0, state.alarm - CFG.ALARM_DECAY * dt);
    }

    // The SPOTTED banner fades on its own.
    if (state.spottedTimer > 0) state.spottedTimer -= dt;

    if (state.alarm >= CFG.ALARM_MAX) {
      HV.bustRun(state);
    }
  }

  // The caught moment: red flash, SPOTTED banner, warning blip. Called when
  // a guard starts a chase, and when the alarm crosses the spotted line.
  function onSpotted(state) {
    if (state.spottedTimer <= 0) {
      state.spottedTimer = 1.1;
      HV.Audio.spotted();
    }
  }

  return { update: update, onSpotted: onSpotted };
})();
