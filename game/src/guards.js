// Aurora Vault Heist — guard patrol AI: walk the route, watch the cone,
// chase when the thief is spotted, then give up and walk back to patrol.

HV.Guards = (function () {
  const CFG = HV.CFG;

  function fresh() {
    return HV.LEVEL.guardPatrols.map(function (route, i) {
      return {
        route: route,
        wp: 0,
        x: route[0].x,
        y: route[0].y,
        angle: 0,
        mode: 'patrol', // patrol | chase | return
        chaseTimer: 0,
        loseTimer: 0,
        spotTimer: 0,
        sees: false,
        speed: CFG.GUARD_PATROL_SPEED,
      };
    });
  }

  // Can this guard see the thief right now?
  function canSee(g, p, state) {
    if (p.inVent) return false;
    if (HV.inSmoke(state, p.x, p.y)) return false;
    const dx = p.x - g.x, dy = p.y - g.y;
    const dist = Math.hypot(dx, dy);
    const range = CFG.GUARD_CONE_RANGE * (p.sneaking ? CFG.SNEAK_GUARD_FACTOR : 1);
    if (dist > range) return false;
    if (dist < 26) return HV.hasLineOfSight(g.x, g.y, p.x, p.y, state); // bumped into
    const ang = Math.atan2(dy, dx);
    let diff = Math.abs(ang - g.angle);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    if (diff > CFG.GUARD_CONE_HALF) return false;
    return HV.hasLineOfSight(g.x, g.y, p.x, p.y, state);
  }

  function moveToward(g, tx, ty, speed, dt) {
    const dx = tx - g.x, dy = ty - g.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) return;
    const step = Math.min(d, speed * dt);
    g.x += (dx / d) * step;
    g.y += (dy / d) * step;
    g.angle = Math.atan2(dy, dx);
  }

  function update(guards, p, state, dt) {
    for (let i = 0; i < guards.length; i++) {
      const g = guards[i];
      g.sees = canSee(g, p, state);

      if (g.mode === 'patrol') {
        const target = g.route[g.wp];
        const before = { x: g.x, y: g.y };
        moveToward(g, target.x, target.y, CFG.GUARD_PATROL_SPEED, dt);
        if (Math.hypot(target.x - g.x, target.y - g.y) < 6) {
          g.wp = (g.wp + 1) % g.route.length;
        }
        // Face along the walk; stand still and keep facing at a waypoint turn.
        if (Math.hypot(g.x - before.x, g.y - before.y) < 0.01) {
          const next = g.route[g.wp];
          g.angle = Math.atan2(next.y - g.y, next.x - g.x);
        }
        if (g.sees) {
          g.spotTimer += dt;
          if (g.spotTimer >= CFG.GUARD_SPOT_TIME) {
            g.mode = 'chase';
            g.chaseTimer = CFG.GUARD_CHASE_TIME;
            g.loseTimer = 0;
            HV.Alarm.onSpotted(state);
          }
        } else {
          g.spotTimer = 0;
        }
      } else if (g.mode === 'chase') {
        g.chaseTimer -= dt;
        moveToward(g, p.x, p.y, CFG.GUARD_CHASE_SPEED, dt);
        // Resolve against solids so a chasing guard does not walk through walls.
        const settled = HV.resolveCircle(g.x, g.y, CFG.GUARD_R, state);
        g.x = settled.x;
        g.y = settled.y;
        if (g.sees) {
          g.loseTimer = 0;
        } else {
          g.loseTimer += dt;
        }
        if (g.chaseTimer <= 0 || g.loseTimer >= CFG.GUARD_LOSE_TIME) {
          g.mode = 'return';
          g.spotTimer = 0;
        }
      } else { // return
        // Walk back to the nearest waypoint, then resume the patrol.
        let best = 0, bestD = Infinity;
        for (let w = 0; w < g.route.length; w++) {
          const d = Math.hypot(g.route[w].x - g.x, g.route[w].y - g.y);
          if (d < bestD) { bestD = d; best = w; }
        }
        g.wp = best;
        const target = g.route[g.wp];
        moveToward(g, target.x, target.y, CFG.GUARD_PATROL_SPEED, dt);
        const settled = HV.resolveCircle(g.x, g.y, CFG.GUARD_R, state);
        g.x = settled.x;
        g.y = settled.y;
        if (Math.hypot(target.x - g.x, target.y - g.y) < 8) g.mode = 'patrol';
        if (g.sees) {
          g.spotTimer += dt;
          if (g.spotTimer >= CFG.GUARD_SPOT_TIME) {
            g.mode = 'chase';
            g.chaseTimer = CFG.GUARD_CHASE_TIME;
            g.loseTimer = 0;
            HV.Alarm.onSpotted(state);
          }
        } else {
          g.spotTimer = 0;
        }
      }
    }
  }

  return { fresh: fresh, update: update, canSee: canSee };
})();
