// Aurora Vault Heist — wall cameras. Each sweeps its cone back and forth
// on a fixed arc; an EMP shuts them all down for a few seconds.

HV.Cameras = (function () {
  const CFG = HV.CFG;

  function fresh() {
    return HV.LEVEL.cameras.map(function (c) {
      return {
        x: c.x, y: c.y,
        base: c.base, arc: c.arc, phase: c.phase,
        angle: c.base,
        disabled: false,
        sees: false,
      };
    });
  }

  // Current sweep angle at time t (seconds since the run started).
  function sweepAngle(c, t) {
    return c.base + Math.sin(t * CFG.CAMERA_SWEEP_SPEED + c.phase) * c.arc;
  }

  function canSee(cam, p, state) {
    if (cam.disabled) return false;
    if (p.inVent) return false;
    if (HV.inSmoke(state, p.x, p.y)) return false;
    const dx = p.x - cam.x, dy = p.y - cam.y;
    const dist = Math.hypot(dx, dy);
    const range = CFG.CAMERA_RANGE * (p.sneaking ? CFG.SNEAK_CAMERA_FACTOR : 1);
    if (dist > range) return false;
    const ang = Math.atan2(dy, dx);
    let diff = Math.abs(ang - cam.angle);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    if (diff > CFG.CAMERA_CONE_HALF) return false;
    return HV.hasLineOfSight(cam.x, cam.y, p.x, p.y, state);
  }

  function update(cameras, p, state, dt) {
    state.time += dt;
    for (let i = 0; i < cameras.length; i++) {
      const cam = cameras[i];
      cam.disabled = state.empTimer > 0;
      cam.angle = sweepAngle(cam, state.time);
      cam.sees = canSee(cam, p, state);
    }
  }

  return { fresh: fresh, update: update, canSee: canSee };
})();
