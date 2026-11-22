// Aurora Vault Heist — staged scenes for the screenshots. Reading
// ?shot=1..4 in the URL sets up one fixed moment of the game (positions,
// alarm level, loot state) and freezes it, so each screenshot is a real
// render of the game's own code, reproducible every time.

HV.Shots = (function () {
  function placeGuard(state, i, x, y, angle, mode) {
    const g = state.guards[i];
    g.x = x; g.y = y; g.angle = angle;
    g.mode = mode || 'patrol';
    g.sees = false;
    g.spotTimer = 0;
    g.chaseTimer = 0;
    g.loseTimer = 0;
  }

  function apply(state, n) {
    state.frozen = true;
    state.mode = 'playing';
    // A clean slate, then each shot arranges its own moment.
    for (let i = 0; i < HV.LEVEL.loot.length; i++) HV.LEVEL.loot[i].taken = false;
    HV.LEVEL.diamond.taken = false;
    state.hasDiamond = false;
    state.lootTaken = 0;
    state.smokeClouds = [];
    state.empTimer = 0;
    state.spottedTimer = 0;
    state.score = 0;

    if (n === 1) {
      // COVER: mid-heist in the Gallery — thief crossing the room, a guard
      // cone sweeping near, a camera cone, loot glinting, alarm visible.
      state.time = 12.5;
      state.alarm = 35;
      state.player.x = 640; state.player.y = 380;
      state.player.facing = Math.PI / 2;
      state.player.sneaking = true;
      placeGuard(state, 2, 560, 262, 0.3);   // gallery loop guard, cone sweeping just past the thief
      placeGuard(state, 3, 610, 520, -1.35);  // vertical sweep guard, facing away
      placeGuard(state, 0, 200, 140, 0.4);
      placeGuard(state, 1, 330, 420, -0.6);
      placeGuard(state, 4, 1000, 320, 2.6);
      state.cameras[1].angle = 1.25;          // gallery west camera cone down the room
      state.cameras[2].angle = -1.1;
      state.cameras[0].angle = 1.4;
      state.cameras[3].angle = 1.0;
      HV.LEVEL.loot[0].taken = true;          // one painting already lifted
      state.lootTaken = 1;
      state.score = 150;
    } else if (n === 2) {
      // Vault approach: thief at the vault door, the diamond glowing on its
      // pedestal, the vault camera sweeping across it.
      state.time = 8.0;
      state.alarm = 12;
      state.player.x = 884; state.player.y = 342;
      state.player.facing = 0;
      placeGuard(state, 4, 1050, 520, 0.3);   // vault guard, back turned
      placeGuard(state, 2, 700, 250, -1.2);
      placeGuard(state, 3, 610, 580, -1.57);
      placeGuard(state, 0, 160, 200, 1.0);
      placeGuard(state, 1, 300, 480, 2.4);
      state.cameras[3].angle = 1.9;           // vault camera sweeping the pedestal
      state.cameras[1].angle = 0.9;
      state.cameras[2].angle = -1.4;
      state.cameras[0].angle = 1.2;
    } else if (n === 3) {
      // Alarm moment: a guard cone turned red on the thief, alarm high,
      // smoke bomb cloud deployed.
      state.time = 20.0;
      state.alarm = 82;
      state.player.x = 600; state.player.y = 400;
      state.player.facing = -Math.PI / 2;
      state.player.sneaking = false;
      placeGuard(state, 3, 610, 298, Math.PI / 2, 'chase'); // right on the thief
      state.guards[3].sees = true;
      state.guards[3].chaseTimer = 3.8;
      placeGuard(state, 2, 760, 250, 2.2);
      placeGuard(state, 0, 220, 300, 0.9);
      placeGuard(state, 1, 340, 500, -2.0);
      placeGuard(state, 4, 980, 420, 1.4);
      state.cameras[1].angle = 1.5;
      state.cameras[2].angle = -1.2;
      state.cameras[0].angle = 0.8;
      state.cameras[3].angle = 1.3;
      state.smokeClouds.push({ x: 600, y: 400, r: 95, t: 4.0 });
      state.spottedTimer = 0.9;
      HV.LEVEL.loot[3].taken = true;
      state.lootTaken = 1;
      state.score = 100;
    } else if (n === 4) {
      // Getaway: the thief at the van with the diamond, win screen up.
      state.time = 274;
      state.alarm = 18;
      state.hasDiamond = true;
      HV.LEVEL.diamond.taken = true;
      state.lootTaken = 3;
      HV.LEVEL.loot[0].taken = true;
      HV.LEVEL.loot[1].taken = true;
      HV.LEVEL.loot[4].taken = true;
      state.score = 1840;
      state.player.x = 230; state.player.y = 690;
      state.player.facing = Math.PI / 2;
      placeGuard(state, 0, 200, 200, 0.6);
      placeGuard(state, 1, 330, 460, -1.0);
      placeGuard(state, 2, 620, 300, 1.8);
      placeGuard(state, 3, 610, 560, -1.57);
      placeGuard(state, 4, 1100, 400, 2.8);
      state.cameras[0].angle = 1.1;
      state.cameras[1].angle = 1.4;
      state.cameras[2].angle = -1.3;
      state.cameras[3].angle = 1.2;
      state.mode = 'win';
      state.winStats = {
        time: 274, score: 1840, lootTaken: 3,
        hasDiamond: true, toolsLeft: 2,
      };
    }
  }

  return { apply: apply };
})();
