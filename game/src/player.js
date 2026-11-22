// Aurora Vault Heist — the thief, Mara Voss: movement, sneak, the vent,
// interacting with loot and the vault door, and using tools.

HV.Player = (function () {
  const CFG = HV.CFG;

  function fresh() {
    return {
      x: HV.LEVEL.playerStart.x,
      y: HV.LEVEL.playerStart.y,
      facing: -Math.PI / 2,
      sneaking: false,
      inVent: false,
      moving: false,
      stepTimer: 0,
      // Tools carried.
      smoke: CFG.SMOKE_COUNT,
      emp: CFG.EMP_COUNT,
      lockpick: CFG.LOCKPICK_COUNT,
      selectedTool: 1,
      // What the thief is doing right now.
      vaultProgress: 0,
      vaultBusy: false,
      nearLoot: null,
      nearVault: false,
      nearVan: false,
    };
  }

  // Is the thief inside the vent duct?
  function insideVent(p) {
    return HV.pointInRect(p.x, p.y, HV.LEVEL.vent, -4);
  }

  function update(p, state, dt) {
    const mv = HV.Input.move();
    p.sneaking = HV.Input.sneaking();
    p.inVent = insideVent(p);

    let speed = p.sneaking ? CFG.SNEAK_SPEED : CFG.WALK_SPEED;
    if (p.inVent) speed = CFG.VENT_SPEED;
    p.moving = mv.x !== 0 || mv.y !== 0;

    if (p.moving) {
      p.facing = Math.atan2(mv.y, mv.x);
      const nx = p.x + mv.x * speed * dt;
      const ny = p.y + mv.y * speed * dt;
      // Move one axis at a time so the thief slides along walls.
      const sx = HV.resolveCircle(nx, p.y, CFG.PLAYER_R, state).x;
      const sy = HV.resolveCircle(p.x, ny, CFG.PLAYER_R, state).y;
      const settled = HV.resolveCircle(sx, sy, CFG.PLAYER_R, state);
      p.x = settled.x;
      p.y = settled.y;
      p.stepTimer -= dt;
      if (p.stepTimer <= 0) {
        p.stepTimer = p.sneaking ? 0.55 : 0.34;
        HV.Audio.footstep(p.sneaking);
      }
    }

    // Nearest grabbable loot, if any.
    p.nearLoot = null;
    for (let i = 0; i < HV.LEVEL.loot.length; i++) {
      const l = HV.LEVEL.loot[i];
      if (l.taken) continue;
      const d = Math.hypot(l.x - p.x, l.y - p.y);
      if (d < 42) { p.nearLoot = l; break; }
    }
    // The diamond itself.
    if (!HV.LEVEL.diamond.taken) {
      const d = Math.hypot(HV.LEVEL.diamond.x - p.x, HV.LEVEL.diamond.y - p.y);
      if (d < 50) p.nearLoot = { id: 'diamond', kind: 'diamond', x: HV.LEVEL.diamond.x, y: HV.LEVEL.diamond.y };
    }

    // Near the vault door?
    const door = HV.LEVEL.vaultDoor;
    const dcx = door.x + door.w / 2, dcy = door.y + door.h / 2;
    p.nearVault = door.state !== 'open' && Math.hypot(dcx - p.x, dcy - p.y) < 78;

    // Near (or in) the van zone?
    p.nearVan = HV.pointInRect(p.x, p.y, HV.LEVEL.van, 6);

    // Grab loot with E.
    if (HV.Input.consumeInteractPressed() && p.nearLoot) {
      HV.Loot.grab(state, p.nearLoot);
    }

    // The vault door: hold E near it. Progress drains if the thief walks off.
    if (p.nearVault && HV.Input.interactHeld()) {
      p.vaultBusy = true;
      const hasPick = p.lockpick > 0;
      const need = hasPick ? CFG.VAULT_PICK_TIME : CFG.VAULT_FORCE_TIME;
      p.vaultProgress += dt / need;
      if (p.vaultProgress >= 1) {
        HV.Loot.openVault(state, hasPick);
        p.vaultProgress = 0;
        p.vaultBusy = false;
      }
    } else {
      p.vaultBusy = false;
      p.vaultProgress = Math.max(0, p.vaultProgress - dt * 0.5);
    }

    // Tool selection (1/2/3 keys or the HUD buttons).
    const sel = HV.Input.consumeSelectTool();
    if (sel >= 1 && sel <= 3) p.selectedTool = sel;

    // Q uses the selected tool.
    if (HV.Input.consumeToolPressed()) {
      useTool(p, state);
    }
  }

  function useTool(p, state) {
    if (p.selectedTool === 1) {
      if (p.smoke <= 0) { HV.toast('No smoke bombs left'); return; }
      p.smoke--;
      state.score -= CFG.SMOKE_COST;
      state.smokeClouds.push({ x: p.x, y: p.y, r: CFG.SMOKE_RADIUS, t: CFG.SMOKE_TIME });
      HV.Audio.smoke();
      HV.toast('Smoke bomb — line of sight broken');
    } else if (p.selectedTool === 2) {
      if (p.emp <= 0) { HV.toast('No EMP left'); return; }
      p.emp--;
      state.score -= CFG.EMP_COST;
      state.empTimer = CFG.EMP_TIME;
      HV.Audio.emp();
      HV.toast('EMP — cameras down');
    } else if (p.selectedTool === 3) {
      HV.toast(p.lockpick > 0
        ? 'Lockpick ready — hold E at the vault door'
        : 'Lockpick used — the vault will be slow and noisy');
    }
  }

  return { fresh: fresh, update: update, insideVent: insideVent };
})();

// HUD tool buttons call this to pick a tool by number.
HV.selectToolByIndex = function (n) {
  if (HV.state && HV.state.player) HV.state.player.selectedTool = n;
};
