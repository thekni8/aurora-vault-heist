// Aurora Vault Heist — all sound is synthesized with WebAudio. No files.

HV.Audio = (function () {
  let ctx = null;
  let muted = false;
  let alarmTimer = 0;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // One short tone: frequency, length, wave shape, loudness.
  function tone(freq, dur, type, gain, when) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + (when || 0);
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.08, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // A soft filtered tick, used for footsteps.
  function tick() {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, t0);
    osc.frequency.exponentialRampToValueAtTime(120, t0 + 0.05);
    g.gain.setValueAtTime(0.035, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + 0.08);
  }

  return {
    unlock: function () { ensure(); },
    isMuted: function () { return muted; },
    toggleMute: function () {
      muted = !muted;
      return muted;
    },

    footstep: function (sneaking) {
      if (sneaking) return; // sneaking is silent
      tick();
    },

    // Two-note chime when loot is grabbed.
    loot: function () {
      tone(880, 0.14, 'sine', 0.09);
      tone(1318, 0.22, 'sine', 0.08, 0.09);
    },

    // Rising pulse while the alarm is high; call once per frame.
    alarmPulse: function (dt, level) {
      if (muted || level < HV.CFG.ALARM_SPOTTED_AT) return;
      alarmTimer -= dt;
      if (alarmTimer <= 0) {
        alarmTimer = 0.55 - (level / 100) * 0.3; // faster as the alarm climbs
        tone(520 + level * 2.2, 0.12, 'square', 0.035);
      }
    },

    // Short warning blip the moment the thief is spotted.
    spotted: function () {
      tone(660, 0.1, 'square', 0.06);
      tone(660, 0.1, 'square', 0.06, 0.13);
    },

    // Metallic click of the vault door opening.
    vaultOpen: function () {
      tone(240, 0.1, 'triangle', 0.1);
      tone(180, 0.16, 'triangle', 0.1, 0.1);
      tone(320, 0.2, 'sine', 0.07, 0.22);
    },

    // Soft whoosh for the smoke bomb.
    smoke: function () {
      if (muted) return;
      const ac = ensure();
      if (!ac) return;
      const t0 = ac.currentTime;
      const buf = ac.createBuffer(1, ac.sampleRate * 0.35, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.25;
      }
      const src = ac.createBufferSource();
      src.buffer = buf;
      const filt = ac.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(900, t0);
      filt.frequency.exponentialRampToValueAtTime(200, t0 + 0.35);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.12, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
      src.connect(filt);
      filt.connect(g);
      g.connect(ac.destination);
      src.start(t0);
    },

    // Low zap for the EMP.
    emp: function () {
      tone(1200, 0.25, 'sawtooth', 0.05);
      tone(300, 0.3, 'sawtooth', 0.05, 0.08);
    },

    // Ascending sting on the win.
    win: function () {
      const notes = [523, 659, 784, 1046];
      for (let i = 0; i < notes.length; i++) tone(notes[i], 0.3, 'triangle', 0.09, i * 0.13);
    },

    // Harsh buzz on the bust.
    bust: function () {
      tone(140, 0.5, 'sawtooth', 0.12);
      tone(110, 0.7, 'sawtooth', 0.12, 0.15);
    },
  };
})();
