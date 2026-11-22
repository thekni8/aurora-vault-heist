// Aurora Vault Heist — tuning constants. One place for every number the
// rest of the game reads, so balance changes never touch game logic.
const HV = window.HV = window.HV || {};

HV.CFG = {
  // Canvas.
  W: 1280,
  H: 720,

  // The thief.
  PLAYER_R: 13,
  WALK_SPEED: 155,
  SNEAK_SPEED: 72,
  VENT_SPEED: 46,

  // Guards.
  GUARD_R: 14,
  GUARD_PATROL_SPEED: 62,
  GUARD_CHASE_SPEED: 138,
  GUARD_CONE_RANGE: 185,
  GUARD_CONE_HALF: 0.58,          // radians, ~33 degrees each side
  GUARD_SPOT_TIME: 0.55,          // seconds of being seen before a chase starts
  GUARD_CHASE_TIME: 4.5,
  GUARD_LOSE_TIME: 2.0,           // seconds unseen before a chase gives up

  // Cameras.
  CAMERA_RANGE: 215,
  CAMERA_CONE_HALF: 0.5,
  CAMERA_SWEEP_SPEED: 0.55,       // radians per second

  // Sneak shrinks how far away a watcher can pick the thief up.
  SNEAK_GUARD_FACTOR: 0.55,
  SNEAK_CAMERA_FACTOR: 0.6,

  // Alarm meter.
  ALARM_GUARD_RATE: 55,           // per second while inside a guard cone
  ALARM_CAMERA_RATE: 26,          // per second while inside a camera cone
  ALARM_MAX_RATE: 90,             // cap when several watchers see the thief
  ALARM_DECAY: 9,                 // per second while hidden
  ALARM_SPOTTED_AT: 55,           // crossing this shows the SPOTTED flash
  ALARM_NOISY_VAULT: 12,          // alarm added by forcing the vault door
  ALARM_MAX: 100,

  // Tools.
  SMOKE_COUNT: 2,
  SMOKE_COST: 50,
  SMOKE_RADIUS: 95,
  SMOKE_TIME: 5,
  EMP_COUNT: 1,
  EMP_COST: 75,
  EMP_TIME: 6,
  LOCKPICK_COUNT: 1,
  LOCKPICK_COST: 25,
  VAULT_PICK_TIME: 1.2,           // seconds holding E with the lockpick
  VAULT_FORCE_TIME: 4.0,          // seconds holding E without it

  // Score.
  SCORE_DIAMOND: 1000,
  SCORE_PAINTING: 150,
  SCORE_GEM: 100,
  TIME_BONUS_PER_SEC: 2,          // on a win, per second under the par time
  TIME_BONUS_PAR: 480,

  // Colours.
  COL: {
    floor: '#0d1526',
    floorTile: '#111c31',
    wall: '#232c3d',
    wallEdge: '#3d4a66',
    cover: '#1a2233',
    coverEdge: '#4d5d80',
    gold: '#ffd97a',
    goldDim: '#d6b25e',
    guardCone: 'rgba(255, 224, 130, 0.20)',
    guardConeEdge: 'rgba(255, 224, 130, 0.45)',
    cameraCone: 'rgba(255, 84, 64, 0.16)',
    cameraConeEdge: 'rgba(255, 84, 64, 0.5)',
    alertCone: 'rgba(255, 45, 30, 0.30)',
    alertConeEdge: 'rgba(255, 45, 30, 0.7)',
    player: '#101318',
    playerTrim: '#ffd97a',
    guard: '#2b3a55',
    guardTrim: '#8fa3c8',
    vent: '#131c2e',
    ventSlat: '#2c3a55',
    van: '#7a2e2e',
    vanTrim: '#e8e4d8',
  },
};
