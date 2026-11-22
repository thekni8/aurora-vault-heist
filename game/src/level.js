// Aurora Vault Heist — the Halcyon Museum floor plan.
// One floor, three zones, left to right: Entrance Hall, Gallery, Vault
// Antechamber. Everything here is data; the other files read it.

HV.LEVEL = (function () {
  const T = 12; // wall thickness

  // Solid walls. The two interior walls leave a door gap at y 300..384.
  const walls = [
    { x: 40, y: 56, w: 1200, h: T },            // north
    { x: 40, y: 652, w: 130, h: T },           // south, west of the van exit
    { x: 290, y: 652, w: 950, h: T },          // south, east of the van exit
    { x: 40, y: 56, w: T, h: 608 },            // west
    { x: 1228, y: 56, w: T, h: 608 },          // east
    { x: 414, y: 56, w: T, h: 244 },           // hall/gallery divider, north part
    { x: 414, y: 384, w: T, h: 280 },          // hall/gallery divider, south part
    { x: 834, y: 56, w: T, h: 244 },           // gallery/vault divider, north part
    { x: 834, y: 384, w: T, h: 280 },          // gallery/vault divider, south part
  ];

  // The vault door fills the gap in the gallery/vault divider. It starts
  // shut and locked; the thief opens it with E (fast and silent with the
  // lockpick, slow and noisy without).
  const vaultDoor = { x: 834, y: 300, w: T, h: 84, state: 'locked', progress: 0 };

  // Cover: statues, planters and display cases. Solid — they block movement
  // and they block a watcher's line of sight, so the thief hides behind them.
  const cover = [
    { x: 150, y: 190, w: 44, h: 44, kind: 'statue' },
    { x: 300, y: 480, w: 46, h: 30, kind: 'planter' },
    { x: 180, y: 520, w: 92, h: 34, kind: 'case' },
    { x: 500, y: 180, w: 112, h: 36, kind: 'case' },
    { x: 640, y: 500, w: 112, h: 36, kind: 'case' },
    { x: 756, y: 180, w: 44, h: 44, kind: 'statue' },
    { x: 470, y: 330, w: 42, h: 30, kind: 'planter' },
    { x: 960, y: 500, w: 112, h: 36, kind: 'case' },
    { x: 1140, y: 480, w: 44, h: 44, kind: 'statue' },
    { x: 900, y: 120, w: 42, h: 30, kind: 'planter' },
  ];

  // The vent: a crawl duct along the top of the Gallery. Slow inside, but
  // no guard or camera can spot the thief while they are in it.
  const vent = { x: 432, y: 68, w: 396, h: 46 };

  // Side loot. Paintings hang on walls, gem cases sit on the display cases.
  const loot = [
    { id: 'paint1', kind: 'painting', x: 556, y: 630, taken: false },
    { id: 'paint2', kind: 'painting', x: 700, y: 630, taken: false },
    { id: 'paint3', kind: 'painting', x: 448, y: 210, taken: false },
    { id: 'gem1', kind: 'gem', x: 556, y: 198, taken: false },
    { id: 'gem2', kind: 'gem', x: 696, y: 518, taken: false },
    { id: 'gem3', kind: 'gem', x: 1016, y: 518, taken: false },
  ];

  // The Aurora Diamond, on its pedestal in the Vault Antechamber.
  const diamond = { x: 1120, y: 210, taken: false };

  // The getaway van, parked outside the south exit of the Entrance Hall.
  const van = { x: 150, y: 664, w: 160, h: 52 };

  // Guard patrols: waypoint loops, one per guard.
  const guardPatrols = [
    // Entrance Hall, upper loop.
    [{ x: 120, y: 140 }, { x: 340, y: 140 }, { x: 340, y: 560 }, { x: 120, y: 560 }],
    // Entrance Hall, watching the door into the Gallery.
    [{ x: 360, y: 300 }, { x: 360, y: 480 }, { x: 220, y: 480 }],
    // Gallery, wide loop around the display cases.
    [{ x: 500, y: 250 }, { x: 780, y: 250 }, { x: 780, y: 450 }, { x: 500, y: 450 }],
    // Gallery, vertical sweep down the middle.
    [{ x: 610, y: 150 }, { x: 610, y: 580 }],
    // Vault Antechamber, circling the pedestal.
    [{ x: 920, y: 300 }, { x: 1180, y: 300 }, { x: 1180, y: 560 }, { x: 920, y: 560 }],
  ];

  // Wall cameras: a fixed mount, a facing that sweeps back and forth.
  const cameras = [
    { x: 400, y: 74, base: Math.PI / 2, arc: 0.9, phase: 0.0 },   // Entrance Hall
    { x: 560, y: 74, base: Math.PI / 2, arc: 0.8, phase: 1.3 },   // Gallery, west
    { x: 830, y: 650, base: -Math.PI / 2, arc: 0.8, phase: 2.6 }, // Gallery, south
    { x: 1180, y: 74, base: Math.PI / 2, arc: 0.7, phase: 0.7 },  // Vault, over the diamond
  ];

  // Warm light pools on the floor, purely visual.
  const lamps = [
    { x: 200, y: 200, r: 130 }, { x: 330, y: 500, r: 120 },
    { x: 560, y: 300, r: 150 }, { x: 730, y: 180, r: 120 },
    { x: 640, y: 520, r: 130 }, { x: 1000, y: 300, r: 150 },
    { x: 1120, y: 210, r: 140 }, { x: 1120, y: 520, r: 120 },
  ];

  return {
    bounds: { x: 40, y: 56, w: 1200, h: 608 },
    walls, vaultDoor, cover, vent, loot, diamond, van,
    guardPatrols, cameras, lamps,
    playerStart: { x: 92, y: 610 },
  };
})();

// --- geometry helpers shared by movement, sight and rendering ---

// True when point (px, py) lies inside rect r (with a small margin).
HV.pointInRect = function (px, py, r, margin) {
  const m = margin || 0;
  return px >= r.x - m && px <= r.x + r.w + m && py >= r.y - m && py <= r.y + r.h + m;
};

// True when the segment a->b crosses rect r. Slab test.
HV.segmentHitsRect = function (ax, ay, bx, by, r) {
  const dx = bx - ax, dy = by - ay;
  let t0 = 0, t1 = 1;
  const axes = [
    [dx, ax - r.x, ax - (r.x + r.w)],
    [dy, ay - r.y, ay - (r.y + r.h)],
  ];
  for (let i = 0; i < 2; i++) {
    const d = axes[i][0];
    if (Math.abs(d) < 1e-9) {
      if (axes[i][1] < 0 || axes[i][2] > 0) return false;
    } else {
      let ta = -axes[i][1] / d;
      let tb = -axes[i][2] / d;
      if (ta > tb) { const tmp = ta; ta = tb; tb = tmp; }
      if (ta > t0) t0 = ta;
      if (tb < t1) t1 = tb;
      if (t0 > t1) return false;
    }
  }
  return true;
};

// Every solid rect that blocks movement and sight: walls, cover, and the
// vault door while it is shut.
HV.solids = function (state) {
  const list = HV.LEVEL.walls.concat(HV.LEVEL.cover);
  if (state && state.vaultDoorClosed) list.push(HV.LEVEL.vaultDoor);
  return list;
};

// True when nothing solid stands between (ax, ay) and (bx, by).
HV.hasLineOfSight = function (ax, ay, bx, by, state) {
  const solids = HV.solids(state);
  for (let i = 0; i < solids.length; i++) {
    if (HV.segmentHitsRect(ax, ay, bx, by, solids[i])) return false;
  }
  return true;
};

// Push a circle (x, y, r) out of every solid rect it overlaps. Returns the
// corrected position. Axis-separated so the thief slides along walls.
HV.resolveCircle = function (x, y, r, state) {
  const solids = HV.solids(state);
  for (let i = 0; i < solids.length; i++) {
    const s = solids[i];
    const cx = Math.max(s.x, Math.min(x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(y, s.y + s.h));
    const dx = x - cx, dy = y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      if (d2 > 1e-6) {
        const d = Math.sqrt(d2);
        x = cx + (dx / d) * r;
        y = cy + (dy / d) * r;
      } else {
        // Centre inside the rect: shove out along the shallowest side.
        const left = x - s.x, right = s.x + s.w - x;
        const top = y - s.y, bottom = s.y + s.h - y;
        const m = Math.min(left, right, top, bottom);
        if (m === left) x = s.x - r;
        else if (m === right) x = s.x + s.w + r;
        else if (m === top) y = s.y - r;
        else y = s.y + s.h + r;
      }
    }
  }
  // Keep inside the museum — except through the south exit, where the
  // getaway van waits on the apron below the wall.
  const b = HV.LEVEL.bounds;
  const v = HV.LEVEL.van;
  const inExitLane = x > v.x && x < v.x + v.w;
  x = Math.max(b.x + r, Math.min(b.x + b.w - r, x));
  y = Math.max(b.y + r, y);
  if (inExitLane && y > b.y + b.h - r) {
    // In the exit lane the thief may step out to the van.
    y = Math.min(v.y + v.h - r, y);
    x = Math.max(v.x + r, Math.min(v.x + v.w - r, x));
  } else {
    y = Math.min(b.y + b.h - r, y);
  }
  return { x: x, y: y };
};
