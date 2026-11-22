// Aurora Vault Heist — loot, the vault door, the diamond and the getaway.

HV.Loot = (function () {
  const CFG = HV.CFG;

  function grab(state, item) {
    if (item.kind === 'diamond') {
      HV.LEVEL.diamond.taken = true;
      state.hasDiamond = true;
      state.score += CFG.SCORE_DIAMOND;
      HV.Audio.loot();
      HV.toast('The Aurora Diamond is yours — get to the van!');
      HV.setObjective('Diamond secured — reach the van at the south exit');
    } else {
      item.taken = true;
      state.lootTaken++;
      state.score += item.kind === 'painting' ? CFG.SCORE_PAINTING : CFG.SCORE_GEM;
      HV.Audio.loot();
      HV.toast(item.kind === 'painting' ? 'Painting pocketed (+150)' : 'Gem case emptied (+100)');
    }
  }

  // Called when the thief finishes working the vault door.
  function openVault(state, usedPick) {
    const door = HV.LEVEL.vaultDoor;
    door.state = 'open';
    state.vaultDoorClosed = false;
    if (usedPick) {
      state.player.lockpick--;
      state.score -= CFG.LOCKPICK_COST;
      HV.toast('Lockpick — the vault door opens silently');
    } else {
      state.alarm = Math.min(CFG.ALARM_MAX, state.alarm + CFG.ALARM_NOISY_VAULT);
      HV.toast('Forced it — the noise raised the alarm');
    }
    HV.Audio.vaultOpen();
  }

  // Reaching the van ends the run: a win with the diamond, a nudge without.
  function checkVan(state) {
    const p = state.player;
    if (!p.nearVan) return;
    if (state.hasDiamond) {
      HV.winRun(state);
    } else if (!state.vanNagged || state.time - state.vanNagged > 3) {
      state.vanNagged = state.time;
      HV.toast('The van is here — but the diamond is still inside');
    }
  }

  return { grab: grab, openVault: openVault, checkVan: checkVan };
})();
