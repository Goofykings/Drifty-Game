(() => {
  "use strict";

  const TILE_SIZE = 64;
  const FIXED_DT = 1 / 60;
  const MAX_FRAME_TIME = 0.2;
  const MAX_STEPS = 6;

  const CAR_LENGTH = 38;
  const CAR_WIDTH = 20;
  const CAR_RADIUS = 18;
  const CAR_HITBOX_LENGTH = CAR_LENGTH * 1;
  const CAR_HITBOX_WIDTH = CAR_WIDTH * 1;
  const CAR_TILE_COLLISION_RADIUS = Math.hypot(CAR_HITBOX_LENGTH * 0.5, CAR_HITBOX_WIDTH * 0.5);
  const MAX_SPEED = 2000;
  const ACCELERATION = 600;
  const LINEAR_DRAG = 1.8;
  const TURN_RATE = 12;
  const TURN_SLIP = 0.94;
  const TOUCH_JOYSTICK_TARGET_DISTANCE = CAR_LENGTH * 2;
  const TOUCH_JOYSTICK_REVERSE_ENTER_ANGLE = Math.PI / 9;
  const TOUCH_JOYSTICK_REVERSE_HOLD_ANGLE = Math.PI / 2;
  const TOUCH_JOYSTICK_FULL_STEER_ANGLE = Math.PI / 2;
  const LEVEL_TIMER_START_SPEED = 5;
  const HEADLIGHT_WALL_GLOW_RANGE = 360;
  const HEADLIGHT_WALL_GLOW_MAX = 0.24;
  const WALL_TANGENT_RETAIN = 0.5;
  const WALL_BOUNCE_VELOCITY_RATIO = 1;
  const WALL_DAMAGE_MIN_VELOCITY = 120;
  const WALL_SPEED_RETAIN = 1;
  const WALL_FLASH_DURATION = 0.22;
  const WALL_FLASH_SPEED = 900;
  const WALL_IMPACT_SEPARATION = 0;
  const WALL_IMPACT_TURN = 0.2;
  const ICE_DRAG_MULTIPLIER = 0.2;
  const ICE_GRIP_MULTIPLIER = 0.1;
  const ICE_TURN_MULTIPLIER = 0.72;
  const ICE_ACCELERATION_MULTIPLIER = 0.5;
  const ICE_TURN_RESPONSE_MULTIPLIER = 0.46;
  const ICE_ANGULAR_DRAG_MULTIPLIER = 0.2;
  const ICE_MAX_SPEED_MULTIPLIER = 1.18;
  const BUMPER_BOUNCE = 0.42;
  const BUMPER_SPEED_RETAIN = 1.5;
  const BUMPER_PUSH = 70;
  const GOAL_ADVANCE_DELAY = 1.05;
  const GOAL_BOUNCE_VELOCITY_RATIO = 0.72;
  const GOAL_BOUNCE_MIN_SPEED = 120;
  const GOAL_TANGENT_RETAIN = 0.88;
  const GOAL_SPEED_RETAIN = 0.96;
  const GOAL_GLOW_START_DISTANCE = TILE_SIZE * 3;
  const GOAL_GLOW_FULL_DISTANCE = TILE_SIZE * 0.75;
  const GOAL_EXPLOSION_ZOOM = 0.58;
  const COMPLETION_BLACKOUT_TIME = 1.0;
  const GOAL_FINISH_DEBRIS_LIFE = GOAL_ADVANCE_DELAY + 0.2;
  const GOAL_FINISH_DEBRIS_DRAG = 1.7;
  const GOAL_FINISH_DEBRIS_GRAVITY = 1100;
  const GOAL_FINISH_SHAKE = 22;
  const GOAL_FINISH_SHAKE_TIME = 0.45;
  const RACE_START_COUNTDOWN_SECONDS = 3;
  const RACE_START_GO_TIME = 0.75;
  const SCREEN_WIPE_IN_TIME = 0.0;
  const SCREEN_WIPE_HOLD_TIME = 0.0;
  const SCREEN_WIPE_OUT_TIME = 0.0;
  const SMOKE_DAMAGE_START = 1500;
  const FIRE_DAMAGE_START = 3000;
  const SMOKE_DAMAGE_SPAN = 3000;
  const FIRE_DAMAGE_SPAN = 1500;
  const FIRE_FAILURE_DELAY = 1.0;
  const EXPLOSION_DURATION = 0.75;
  const TAG_MATCH_DURATION = 120;
  const TAG_TRANSFER_COOLDOWN = 2;
  const TAG_PUSH_VELOCITY = 500;
  const TAG_COLLISION_DAMPING = 0.92;
  const CAR_SPRITE_BASE_PATH = "car-sprites-v4-base.png";
  const CAR_SPRITE_MASK_PATH = "car-sprites-v4-mask.png";
  const CAR_VARIANTS = [
    { id: "coupe", name: "Coupe", sprite: { x: 80, y: 228, w: 318, h: 496, renderWidth: 37.6, renderHeight: 68 } },
    { id: "wedge", name: "Formula", sprite: { x: 425, y: 184, w: 334, h: 523, renderWidth: 32.8, renderHeight: 76.8 } },
    { id: "muscle", name: "GT", sprite: { x: 796, y: 248, w: 297, h: 474, renderWidth: 39.2, renderHeight: 68 } },
    { id: "roadster", name: "Roadster", sprite: { x: 1146, y: 246, w: 301, h: 476, renderWidth: 37.6, renderHeight: 68 } },
  ];
  const START_LEVEL = 8; // 0-based campaign level index for testing.
  const SAVE_STORAGE_KEY = "drifty-save-v1";
  const SAVE_ACTIONS_STORAGE_KEY = "drifty-save-v1-actions";
  const DEV_MODE_PASSCODE_HASH = "c384d15ab28fdd04d3e18fbd0da91b2320f95d3c9f428e0542060aca58e478ad";
  const RESET_LEVEL_6_RECORD_ACTION = "reset-level-6-record-2026-04-17";
  const RESET_NORMAL_RECORDS_ACTION = "reset-normal-records-2026-04-21";
  const RESET_LEVEL_7_RECORDS_ACTION = "reset-level-7-records-v1";
  const LEVEL_LEADERBOARD_SCOPE_RESETS = {
    6: "level7_reset_v1",
  };
  const USERNAME_MAX_LENGTH = 10;
  const COMMUNITY_LEVEL_NAME_MAX_LENGTH = 40;
  // Set window.DRIFTY_ONLINE_LEADERBOARD_CONFIG before this file loads to enable shared WR syncing.
  const ONLINE_LEADERBOARD_CONFIG = (() => {
    const defaults = {
      supabaseUrl: "",
      supabaseAnonKey: "",
      tableName: "drifty_leaderboard_records",
      submitRpcName: "submit_drifty_leaderboard_record",
      signUpRpcName: "sign_up_drifty_account",
      logInRpcName: "log_in_drifty_account",
      communityLevelsTableName: "drifty_community_levels",
      communitySubmissionsTableName: "drifty_community_level_submissions",
      submitCommunityLevelRpcName: "submit_drifty_community_level_submission",
      submitCommunityRunRpcName: "submit_drifty_community_level_run",
      pollIntervalMs: 15000,
    };
    if (typeof window === "undefined" || !window.DRIFTY_ONLINE_LEADERBOARD_CONFIG || typeof window.DRIFTY_ONLINE_LEADERBOARD_CONFIG !== "object") {
      return defaults;
    }
    return {
      ...defaults,
      ...window.DRIFTY_ONLINE_LEADERBOARD_CONFIG,
    };
  })();

  const LEVELS = [
   {
     name: "Level 1",
     startAngle: 0,
     map: [
       "##################",
       "#S...............#",
       "#................#",
       "#................#",
       "##########.......#",
       "#................#",
       "#................#",
       "#....#############",
       "#................#",
       "#..............G.#",
       "#................#",
       "##################",
     ],
   },
   {
     name: "Level 2",
     startAngle: 0,
     map: [
       "###########################",
       "##......................###",
       "#........................##",
       "#....################.....#",
       "#..........#######........#",
       "##..........#####........##",
       "#########....###.....######",
       "#.............##........###",
       "#.S..........####........##",
       "#...........#########.....#",
       "#####..###########........#",
       "##.....###....###.........#",
       "#.....###......##...###...#",
       "#...####............#.....#",
       "#..........##.......#.....#",
       "##........####.....##..G..#",
       "###########################",
     ],
   },
   {
     name: "Level 3",
     startAngle: 0,
     map: [
       "##################",
       "#S...######.....##",
       "##....####.......#",
       "###....###.......#",
       "####...##...##...#",
       "####...##...###..#",
       "####...##...##...#",
       "###...##....#....#",
       "##.........##...##",
       "##........###....#",
       "###......#####..G#",
       "##################",
     ],
   },
   {
     name: "Level 4",
     startAngle: 0,
     map: [
       "######################",
       "#S....#..............#",
       "#.....#..............#",
       "#..........#######...#",
       "#..........#.........#",
       "############.........#",
       "#..........###...#####",
       "#..........#.........#",
       "#...###....#.........#",
       "#...###....#######...#",
       "#.....#....#.....#...#",
       "#..G..#..............#",
       "#.....#....#..#......#",
       "######################",
     ],
   },
   {
     name: "Level 5",
     startAngle: 0,
     map: [
      "##########################",
      "#S.....###.....###.......#",
      "#.......#.......#........#",
      "#####.......#.......###..#",
      "######.....###.....##....#",
      "####################....##",
      "###............##......###",
      "##.......##..........#####",
      "#....#############......##",
      "#....#.....#....###......#",
      "#....#...........#####...#",
      "#..........#.........#...#",
      "#....#.....#.......G.#...#",
      "#...##################...#",
      "#........................#",
      "#........................#",
      "##########################",
     ],
   },
     {
       name: "Level 6",
       startAngle: 3.14,
       map: [
         "##################",
         "X................#",
         "X..............S.#",
         "X................#",
         "X...##############",
         "#................X",
         "#................X",
         "#XXXXXXXXXXXX....X",
         "#...........X....#",
         "#...........X....#",
         "#..G...X.........#",
         "#......X.........#",
         "##################",
       ],
     },
    {
       name: "Level 7",
       startAngle: 3.14/2,
       map: [
         "####XXXXXXX#######",
         "###.........##.S.#",
         "##...........#...#",
         "#.....###....#...#",
         "#....X####...#...#",
         "#....XX###.......#",
         "#X....XX###.....X#",
         "#XX....X#####XXXX#",
         "#XXX...###....XXX#",
         "#XX....##.......X#",
         "#X....##.........#",
         "#....XXX...XX....#",
         "#..........XX....#",
         "##........XXXX..G#",
         "##################",
       ],
     },
   {
     name: "Level 8",
     startAngle: -1.57,
     map: [
       "############################",
       "#......X..........###......#",
       "#..................G.......#",
       "#...X.....X.......###......#",
       "#...#############XXXXXXX...#",
       "##........#................#",
       "###............#....#XXXXXX#",
       "#XXXXXX####XXXXXX#..#......#",
       "#.......###......#.........#",
       "#........##......#......#..#",
       "#...###...#......########..#",
       "#...####.....X.............#",
       "#.S.#####....X.............#",
       "############################",
     ],
   },
  ];

  const TAG_LEVELS = [
    {
      name: "Split Circuit",
      startAngle: 0,
      map: [
        "########################",
        "#R.........##.........B#",
        "#..........##..........#",
        "#..####........####....#",
        "#......................#",
        "#.....###......###.....#",
        "#......................#",
        "#.....###......###.....#",
        "#......................#",
        "#..####........####....#",
        "#..........##..........#",
        "#..........##..........#",
        "########################",
      ],
    },
    {
      name: "Crossfire Yard",
      startAngle: 0,
      map: [
        "##########################",
        "#R......#........#......B#",
        "#.......#........#.......#",
        "#.......#..####..#.......#",
        "#........................#",
        "#####.................####",
        "#........................#",
        "#.......##......##.......#",
        "#.......##......##.......#",
        "#........................#",
        "####.................#####",
        "#........................#",
        "##########################",
      ],
    },
    {
      name: "Twin Drift Dome",
      startAngle: 0,
      map: [
        "##########################",
        "#R......................B#",
        "#....######....######....#",
        "#........................#",
        "#..####............####..#",
        "#........................#",
        "#........##....##........#",
        "#........##....##........#",
        "#........................#",
        "#..####............####..#",
        "#........................#",
        "#....######....######....#",
        "##########################",
      ],
    },
  ];

  const CONTROL_SCHEMES = {
    red: {
      up: "KeyW",
      down: "KeyS",
      left: "KeyA",
      right: "KeyD",
    },
    blue: {
      up: "ArrowUp",
      down: "ArrowDown",
      left: "ArrowLeft",
      right: "ArrowRight",
    },
  };

  const COMMUNITY_LEVELS = [];
  const LEADERBOARD_PERIODS = [
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "all_time", label: "All-Time" },
  ];

  const EMPTY_LEVEL_FRAME = [
    "############",
    "#S.........#",
    "#..........#",
    "#..........#",
    "#.........G#",
    "############",
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, alpha) {
    return a + (b - a) * alpha;
  }

  function easeInOutCubic(value) {
    return value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function normalize(x, y) {
    const mag = Math.hypot(x, y);
    if (mag < 1e-6) {
      return { x: 0, y: 0 };
    }
    return { x: x / mag, y: y / mag };
  }

  function dot(ax, ay, bx, by) {
    return ax * bx + ay * by;
  }

  function normalizeUsername(value) {
    const cleaned = String(value ?? "").replace(/[\r\n\t]/g, " ").replace(/\s+/g, " ").trim();
    return cleaned.slice(0, USERNAME_MAX_LENGTH);
  }

  function normalizeCommunityLevelName(value) {
    const cleaned = String(value ?? "").replace(/[\r\n\t]/g, " ").replace(/\s+/g, " ").trim();
    return cleaned.slice(0, COMMUNITY_LEVEL_NAME_MAX_LENGTH);
  }

  function normalizeCommunityLeaderboard(records, creator = "Player", creatorTime = null) {
    const normalized = Array.isArray(records)
      ? records
          .map((record) => ({
            playerName: normalizeUsername(record?.playerName) || normalizeUsername(record?.player_name) || normalizeUsername(record?.name) || "Player",
            time: Number.isFinite(record?.time) ? record.time : (Number.isFinite(record?.time_ms) ? record.time_ms : null),
          }))
          .filter((record) => Number.isFinite(record.time))
      : [];
    if (Number.isFinite(creatorTime) && !normalized.some((record) => record.time === creatorTime && record.playerName === creator)) {
      normalized.push({ playerName: creator, time: creatorTime });
    }
    return normalized
      .sort((a, b) => a.time - b.time)
      .slice(0, 5);
  }

  function getAnonymousPlayerNumber(value) {
    const normalized = normalizeUsername(value);
    const match = /^Player (\d+)$/.exec(normalized);
    if (!match) {
      return normalized === "Player" ? 1 : null;
    }
    const valueNumber = Number.parseInt(match[1], 10);
    return Number.isFinite(valueNumber) && valueNumber >= 1 ? valueNumber : null;
  }

  function isAnonymousPlayerName(value) {
    return getAnonymousPlayerNumber(value) != null;
  }

  function hasRealLeaderboardName(value) {
    const normalized = normalizeUsername(value);
    return Boolean(normalized) && !isAnonymousPlayerName(normalized);
  }

  function getLeaderboardRecordTitle(period) {
    if (period === "daily") {
      return "Daily Record";
    }
    if (period === "weekly") {
      return "Weekly Record";
    }
    return "Record";
  }

  function getCommunityLevelDisplayCreator(level) {
    const creator = normalizeUsername(level?.creator) || "Player";
    const submissionStatus = normalizeCommunitySubmissionStatus(level?.submissionStatus || "");
    if (level?.local && !level?.remoteId && submissionStatus === "published") {
      return "Drifty Admin";
    }
    return creator;
  }

  function parseTimestampMs(value) {
    if (Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Date.parse(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  function normalizeCommunitySubmissionStatus(value) {
    const normalized = String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    if (normalized === "published" || normalized === "approved" || normalized === "live") {
      return "published";
    }
    if (normalized === "declined" || normalized === "denied" || normalized === "rejected") {
      return "declined";
    }
    if (normalized === "private" || normalized === "draft") {
      return "private";
    }
    return "pending";
  }

  function getCommunitySubmissionStatusLabel(status) {
    if (status === "published") {
      return "Published";
    }
    if (status === "declined") {
      return "Declined";
    }
    if (status === "private") {
      return "Private";
    }
    return "Pending";
  }

  function timesMatchForOwnership(a, b) {
    return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 0.0005;
  }

  function shortestAngleDelta(fromAngle, toAngle) {
    return Math.atan2(Math.sin(toAngle - fromAngle), Math.cos(toAngle - fromAngle));
  }

  function createTouchJoystickState(theme = {}) {
    return {
      active: false,
      touchId: null,
      baseX: 0,
      baseY: 0,
      knobX: 0,
      knobY: 0,
      inputX: 0,
      inputY: 0,
      steer: 0,
      throttle: 0,
      reverseLatched: false,
      ringColor: theme.ringColor || "194, 228, 255",
      glowColor: theme.glowColor || "185, 223, 255",
      knobFillColor: theme.knobFillColor || "207, 235, 255",
      knobStrokeColor: theme.knobStrokeColor || "232, 246, 255",
      stemColor: theme.stemColor || "232, 246, 255",
    };
  }

  function approachExp(current, target, sharpness, dt) {
    return lerp(current, target, 1 - Math.exp(-sharpness * dt));
  }

  function hexToRgb(hex) {
    const normalized = hex.replace("#", "");
    const expanded = normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
    const value = Number.parseInt(expanded, 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255,
    };
  }

  function mixHexColors(colorA, colorB, alpha) {
    const a = hexToRgb(colorA);
    const b = hexToRgb(colorB);
    const r = Math.round(lerp(a.r, b.r, alpha));
    const g = Math.round(lerp(a.g, b.g, alpha));
    const bChannel = Math.round(lerp(a.b, b.b, alpha));
    return `rgb(${r}, ${g}, ${bChannel})`;
  }

  function hexToRgba(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function fitTextToWidth(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) {
      return text;
    }

    const ellipsis = "...";
    let trimmed = text;
    while (trimmed.length > 0 && ctx.measureText(trimmed + ellipsis).width > maxWidth) {
      trimmed = trimmed.slice(0, -1);
    }
    return trimmed ? trimmed + ellipsis : ellipsis;
  }

  function isValidHexColor(value) {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
  }

  function wrapTextToLines(ctx, text, maxWidth, maxLines = 2) {
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = "";

    for (let index = 0; index < words.length; index += 1) {
      const word = words[index];
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (!currentLine || ctx.measureText(candidate).width <= maxWidth) {
        currentLine = candidate;
        continue;
      }

      lines.push(currentLine);
      if (lines.length >= maxLines - 1) {
        const remainder = [word, ...words.slice(index + 1)].join(" ");
        lines.push(fitTextToWidth(ctx, remainder, maxWidth));
        return lines;
      }

      currentLine = word;
    }

    if (currentLine) {
      if (lines.length >= maxLines) {
        lines[maxLines - 1] = fitTextToWidth(ctx, currentLine, maxWidth);
      } else {
        lines.push(currentLine);
      }
    }

    return lines.slice(0, maxLines);
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${secs.toFixed(2).padStart(5, "0")}`;
  }

  function formatBestTime(seconds) {
    return seconds == null ? "--:--.--" : formatTime(seconds);
  }

  class InputManager {
    constructor() {
      this.down = new Set();
      this.pressed = new Set();

      window.addEventListener("keydown", (event) => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code) || /^Key[WRASD]$/.test(event.code)) {
          event.preventDefault();
        }
        if (!this.down.has(event.code)) {
          this.pressed.add(event.code);
        }
        this.down.add(event.code);
      });

      window.addEventListener("keyup", (event) => {
        this.down.delete(event.code);
      });

      window.addEventListener("blur", () => {
        this.down.clear();
        this.pressed.clear();
      });
    }

    isDown(code) {
      return this.down.has(code);
    }

    wasPressed(code) {
      return this.pressed.has(code);
    }

    consumeFrame() {
      this.pressed.clear();
    }

    getThrottle() {
      let throttle = 0;
      if (this.isDown("ArrowUp") || this.isDown("KeyW")) {
        throttle += 1;
      }
      if (this.isDown("ArrowDown") || this.isDown("KeyS")) {
        throttle -= 1;
      }
      return throttle;
    }

    getThrottleForBindings(bindings) {
      let throttle = 0;
      if (this.isDown(bindings.up)) {
        throttle += 1;
      }
      if (this.isDown(bindings.down)) {
        throttle -= 1;
      }
      return throttle;
    }

    getSteer() {
      let steer = 0;
      if (this.isDown("ArrowRight") || this.isDown("KeyD")) {
        steer += 1;
      }
      if (this.isDown("ArrowLeft") || this.isDown("KeyA")) {
        steer -= 1;
      }
      return steer;
    }

    getSteerForBindings(bindings) {
      let steer = 0;
      if (this.isDown(bindings.right)) {
        steer += 1;
      }
      if (this.isDown(bindings.left)) {
        steer -= 1;
      }
      return steer;
    }
  }

  class Camera {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.prevX = 0;
      this.prevY = 0;
    }

    snap(x, y) {
      this.x = x;
      this.y = y;
      this.prevX = x;
      this.prevY = y;
    }

    savePrevious() {
      this.prevX = this.x;
      this.prevY = this.y;
    }

    update(targetX, targetY, dt) {
      this.x = approachExp(this.x, targetX, 5.0, dt);
      this.y = approachExp(this.y, targetY, 5.0, dt);
    }

    interpolated(alpha) {
      return {
        x: lerp(this.prevX, this.x, alpha),
        y: lerp(this.prevY, this.y, alpha),
      };
    }
  }

  class LevelMap {
    constructor(definition) {
      this.name = definition.name;
      this.startAngle = Number.isFinite(definition?.startAngle) ? definition.startAngle : 0;
      this.rows = definition.map.map((row) => row.split(""));
      this.height = this.rows.length;
      this.width = this.rows[0].length;
      this.pixelWidth = this.width * TILE_SIZE;
      this.pixelHeight = this.height * TILE_SIZE;
      this.floorCanvas = null;
      this.wallTiles = [];
      this.hazardTiles = [];
      this.iceTiles = [];
      this.start = { x: TILE_SIZE * 1.5, y: TILE_SIZE * 1.5 };
      this.goal = { x: TILE_SIZE * 2.5, y: TILE_SIZE * 1.5, w: TILE_SIZE, h: TILE_SIZE };
      this.redStart = null;
      this.blueStart = null;

      for (let y = 0; y < this.height; y += 1) {
        for (let x = 0; x < this.width; x += 1) {
          const tile = this.rows[y][x];
          if (tile === "#") {
            this.wallTiles.push({ x, y, type: "wall" });
          } else if (tile === "P") {
            this.wallTiles.push({ x, y, type: "bumper" });
          } else if (tile === "X") {
            this.hazardTiles.push({ x, y });
          } else if (tile === "I") {
            this.iceTiles.push({ x, y });
          } else if (tile === "S") {
            this.start = {
              x: x * TILE_SIZE + TILE_SIZE * 0.5,
              y: y * TILE_SIZE + TILE_SIZE * 0.5,
            };
            this.rows[y][x] = ".";
          } else if (tile === "G") {
            this.goal = {
              x: x * TILE_SIZE,
              y: y * TILE_SIZE,
              w: TILE_SIZE,
              h: TILE_SIZE,
            };
            this.rows[y][x] = ".";
          } else if (tile === "R") {
            this.redStart = {
              x: x * TILE_SIZE + TILE_SIZE * 0.5,
              y: y * TILE_SIZE + TILE_SIZE * 0.5,
            };
            this.rows[y][x] = ".";
          } else if (tile === "B") {
            this.blueStart = {
              x: x * TILE_SIZE + TILE_SIZE * 0.5,
              y: y * TILE_SIZE + TILE_SIZE * 0.5,
            };
            this.rows[y][x] = ".";
          }
        }
      }

      if (!this.redStart) {
        this.redStart = { ...this.start };
      }
      if (!this.blueStart) {
        this.blueStart = {
          x: Math.min(this.pixelWidth - TILE_SIZE * 1.5, this.start.x + TILE_SIZE * 3),
          y: this.start.y,
        };
      }
    }

    getTile(gridX, gridY) {
      if (gridX < 0 || gridY < 0 || gridX >= this.width || gridY >= this.height) {
        return "#";
      }
      return this.rows[gridY][gridX];
    }

    isWall(gridX, gridY) {
      const tile = this.getTile(gridX, gridY);
      return tile === "#" || tile === "P";
    }

    isLightBlocker(gridX, gridY) {
      const tile = this.getTile(gridX, gridY);
      return tile === "#" || tile === "P" || tile === "X";
    }

    getWallType(gridX, gridY) {
      const tile = this.getTile(gridX, gridY);
      if (tile === "P") {
        return "bumper";
      }
      if (tile === "#") {
        return "wall";
      }
      return null;
    }

    getFloorTileAt(x, y) {
      return this.getTile(Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE));
    }

    getWallTilesNear(x, y, radius) {
      const minX = Math.floor((x - radius) / TILE_SIZE) - 1;
      const maxX = Math.floor((x + radius) / TILE_SIZE) + 1;
      const minY = Math.floor((y - radius) / TILE_SIZE) - 1;
      const maxY = Math.floor((y + radius) / TILE_SIZE) + 1;
      const tiles = [];

      for (let gridY = minY; gridY <= maxY; gridY += 1) {
        for (let gridX = minX; gridX <= maxX; gridX += 1) {
          const wallType = this.getWallType(gridX, gridY);
          if (wallType) {
            tiles.push({ x: gridX, y: gridY, type: wallType });
          }
        }
      }
      return tiles;
    }

    getHazardTilesNear(x, y, radius) {
      const minX = Math.floor((x - radius) / TILE_SIZE) - 1;
      const maxX = Math.floor((x + radius) / TILE_SIZE) + 1;
      const minY = Math.floor((y - radius) / TILE_SIZE) - 1;
      const maxY = Math.floor((y + radius) / TILE_SIZE) + 1;
      const tiles = [];

      for (let gridY = minY; gridY <= maxY; gridY += 1) {
        for (let gridX = minX; gridX <= maxX; gridX += 1) {
          if (gridX < 0 || gridY < 0 || gridX >= this.width || gridY >= this.height) {
            continue;
          }
          if (this.rows[gridY][gridX] === "X") {
            tiles.push({ x: gridX, y: gridY });
          }
        }
      }
      return tiles;
    }
  }

  class Car {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.prevX = 0;
      this.prevY = 0;
      this.vx = 0;
      this.vy = 0;
      this.angle = 0;
      this.prevAngle = 0;
      this.angularVelocity = 0;
      this.visualSteer = 0;
    }

    reset(x, y, angle) {
      this.x = x;
      this.y = y;
      this.prevX = x;
      this.prevY = y;
      this.vx = 0;
      this.vy = 0;
      this.angle = angle;
      this.prevAngle = angle;
      this.angularVelocity = 0;
      this.visualSteer = 0;
    }

    savePrevious() {
      this.prevX = this.x;
      this.prevY = this.y;
      this.prevAngle = this.angle;
    }

    getInterpolated(alpha) {
      return {
        x: lerp(this.prevX, this.x, alpha),
        y: lerp(this.prevY, this.y, alpha),
        angle: lerp(this.prevAngle, this.angle, alpha),
      };
    }

    updateControlState(controlState, dt, allowThrottle = true, surface = null) {
      const throttle = allowThrottle ? controlState.throttle : 0;
      const steer = controlState.steer;
      const accelerationMultiplier = surface?.accelerationMultiplier ?? 1;
      const dragMultiplier = surface?.dragMultiplier ?? 1;
      const gripMultiplier = surface?.gripMultiplier ?? 1;
      const turnMultiplier = surface?.turnMultiplier ?? 1;
      const turnResponseMultiplier = surface?.turnResponseMultiplier ?? 1;
      const angularDragMultiplier = surface?.angularDragMultiplier ?? 1;
      const maxSpeedMultiplier = surface?.maxSpeedMultiplier ?? 1;
      const surfaceMaxSpeed = MAX_SPEED * maxSpeedMultiplier;
      const facingX = Math.cos(this.angle);
      const facingY = Math.sin(this.angle);
      if (throttle !== 0) {
        this.vx += facingX * throttle * ACCELERATION * accelerationMultiplier * dt;
        this.vy += facingY * throttle * ACCELERATION * accelerationMultiplier * dt;
      }

      const drag = Math.exp(-LINEAR_DRAG * dragMultiplier * dt);
      this.vx *= drag;
      this.vy *= drag;

      let speed = Math.hypot(this.vx, this.vy);
      const movingForward = dot(this.vx, this.vy, facingX, facingY) >= 0 ? 1 : -1;
      const turnStrength = clamp(speed / surfaceMaxSpeed, 0, 1);
      const accelerationRatio = clamp((ACCELERATION * accelerationMultiplier) / surfaceMaxSpeed, 0, 1);
      const driftStartRatio = clamp(0.58 - accelerationRatio * 0.55, 0.16, 0.58);
      const driftStartSpeed = surfaceMaxSpeed * driftStartRatio;
      const driftReadiness = clamp(speed / Math.max(1, driftStartSpeed), 0, 1);

      if (speed > 16 && steer !== 0) {
        const speedTurnAuthority = 0.04 + Math.pow(turnStrength, 1.65) * 7.0;
        const turnResponse = (3.5 + turnStrength * 11.5) * turnResponseMultiplier;
        const targetTurn = steer * movingForward * TURN_RATE * speedTurnAuthority * turnMultiplier;
        this.angularVelocity = approachExp(this.angularVelocity, targetTurn, turnResponse, dt);
      } else {
        const angularDrag = (4.8 - driftReadiness * 3.2) * angularDragMultiplier;
        this.angularVelocity *= Math.exp(-angularDrag * dt);
      }

      this.angle += this.angularVelocity * dt;
      this.visualSteer = approachExp(this.visualSteer, steer, 14, dt);

      const updatedFacingX = Math.cos(this.angle);
      const updatedFacingY = Math.sin(this.angle);

      if (speed > 1) {
        const targetVx = updatedFacingX * speed;
        const targetVy = updatedFacingY * speed;
        const steerAmount = Math.abs(steer) * turnStrength * driftReadiness;
        const gripRate = (1 - TURN_SLIP) * (steerAmount > 0 ? 2.0 : 5.0) * gripMultiplier;
        const alignAlpha = 1 - Math.exp(-gripRate * dt);
        this.vx = lerp(this.vx, targetVx, alignAlpha);
        this.vy = lerp(this.vy, targetVy, alignAlpha);
        speed = Math.hypot(this.vx, this.vy);
      }

      if (speed > surfaceMaxSpeed) {
        const scale = surfaceMaxSpeed / speed;
        this.vx *= scale;
        this.vy *= scale;
        speed = surfaceMaxSpeed;
      }

      const rightX = -Math.sin(this.angle);
      const rightY = Math.cos(this.angle);
      const forwardSpeed = dot(this.vx, this.vy, updatedFacingX, updatedFacingY);
      const lateralSpeed = dot(this.vx, this.vy, rightX, rightY);

      return {
        speed,
        forwardSpeed,
        lateralSpeed,
        driftAmount: Math.abs(lateralSpeed),
        driftRatio: Math.abs(lateralSpeed) / Math.max(140, Math.abs(forwardSpeed)),
      };
    }

    updateControls(input, dt, allowThrottle = true, surface = null) {
      return this.updateControlState(
        {
          throttle: input.getThrottle(),
          steer: input.getSteer(),
        },
        dt,
        allowThrottle,
        surface
      );
    }
  }

  class DriftGame {
    constructor() {
      this.installShell();
      this.canvas = document.createElement("canvas");
      this.canvas.className = "drift-canvas";
      this.canvas.style.touchAction = "none";
      document.body.appendChild(this.canvas);
      this.colorInput = document.createElement("input");
      this.colorInput.type = "color";
      this.colorInput.className = "drift-color-input";
      this.colorInput.setAttribute("aria-label", "Car color");
      this.colorInput.style.position = "absolute";
      this.colorInput.style.zIndex = "5";
      this.colorInput.style.width = "220px";
      this.colorInput.style.height = "76px";
      this.colorInput.style.padding = "0";
      this.colorInput.style.border = "0";
      this.colorInput.style.borderRadius = "18px";
      this.colorInput.style.background = "transparent";
      this.colorInput.style.boxShadow = "none";
      this.colorInput.style.opacity = "0.001";
      this.colorInput.style.cursor = "pointer";
      this.colorInput.style.display = "none";
      document.body.appendChild(this.colorInput);
      this.twoPlayerColorInputs = {
        red: this.colorInput.cloneNode(),
        blue: this.colorInput.cloneNode(),
      };
      this.twoPlayerColorInputs.red.setAttribute("aria-label", "Player 1 car color");
      this.twoPlayerColorInputs.blue.setAttribute("aria-label", "Player 2 car color");
      for (const input of Object.values(this.twoPlayerColorInputs)) {
        input.style.display = "none";
        document.body.appendChild(input);
      }
      this.usernameInput = document.createElement("input");
      this.usernameInput.type = "text";
      this.usernameInput.className = "drift-username-input";
      this.usernameInput.setAttribute("aria-label", "Username");
      this.usernameInput.maxLength = USERNAME_MAX_LENGTH;
      this.usernameInput.spellcheck = false;
      this.usernameInput.autocomplete = "off";
      this.usernameInput.style.position = "absolute";
      this.usernameInput.style.zIndex = "6";
      this.usernameInput.style.display = "none";
      document.body.appendChild(this.usernameInput);
      this.customLevelInput = document.createElement("textarea");
      this.customLevelInput.className = "drift-custom-level-input";
      this.customLevelInput.setAttribute("aria-label", "Paste custom level");
      this.customLevelInput.spellcheck = false;
      this.customLevelInput.autocomplete = "off";
      this.customLevelInput.style.position = "absolute";
      this.customLevelInput.style.zIndex = "6";
      this.customLevelInput.style.display = "none";
      document.body.appendChild(this.customLevelInput);
      this.publishLevelNameInput = document.createElement("input");
      this.publishLevelNameInput.type = "text";
      this.publishLevelNameInput.className = "drift-username-input";
      this.publishLevelNameInput.setAttribute("aria-label", "Level name");
      this.publishLevelNameInput.placeholder = "Level Name";
      this.publishLevelNameInput.maxLength = COMMUNITY_LEVEL_NAME_MAX_LENGTH;
      this.publishLevelNameInput.spellcheck = false;
      this.publishLevelNameInput.autocomplete = "off";
      this.publishLevelNameInput.style.position = "absolute";
      this.publishLevelNameInput.style.zIndex = "6";
      this.publishLevelNameInput.style.display = "none";
      document.body.appendChild(this.publishLevelNameInput);
      this.communitySearchInput = document.createElement("input");
      this.communitySearchInput.type = "text";
      this.communitySearchInput.className = "drift-username-input";
      this.communitySearchInput.setAttribute("aria-label", "Search community levels");
      this.communitySearchInput.placeholder = "Search community levels";
      this.communitySearchInput.maxLength = COMMUNITY_LEVEL_NAME_MAX_LENGTH;
      this.communitySearchInput.spellcheck = false;
      this.communitySearchInput.autocomplete = "off";
      this.communitySearchInput.style.position = "absolute";
      this.communitySearchInput.style.zIndex = "6";
      this.communitySearchInput.style.display = "none";
      document.body.appendChild(this.communitySearchInput);
      this.publishLevelInput = document.createElement("textarea");
      this.publishLevelInput.className = "drift-custom-level-input";
      this.publishLevelInput.setAttribute("aria-label", "Paste level to publish");
      this.publishLevelInput.placeholder = "Paste Level";
      this.publishLevelInput.spellcheck = false;
      this.publishLevelInput.autocomplete = "off";
      this.publishLevelInput.style.position = "absolute";
      this.publishLevelInput.style.zIndex = "6";
      this.publishLevelInput.style.display = "none";
      document.body.appendChild(this.publishLevelInput);
      this.authDialog = document.createElement("div");
      this.authDialog.className = "drift-auth-dialog";
      this.authDialog.style.display = "none";
      this.authDialog.innerHTML = `
        <form class="drift-auth-panel">
          <h2 class="drift-auth-title">Log In</h2>
          <p class="drift-auth-copy">Use your account on any device.</p>
          <input class="drift-auth-username" type="text" maxlength="${USERNAME_MAX_LENGTH}" autocomplete="username" placeholder="Username" aria-label="Account username">
          <input class="drift-auth-password" type="password" autocomplete="current-password" placeholder="Password" aria-label="Account password">
          <div class="drift-auth-status" aria-live="polite"></div>
          <div class="drift-auth-actions">
            <button type="button" class="drift-auth-cancel">Cancel</button>
            <button type="submit" class="drift-auth-submit">Log In</button>
          </div>
        </form>
      `;
      document.body.appendChild(this.authDialog);
      this.authForm = this.authDialog.querySelector(".drift-auth-panel");
      this.authTitleEl = this.authDialog.querySelector(".drift-auth-title");
      this.authCopyEl = this.authDialog.querySelector(".drift-auth-copy");
      this.authUsernameInput = this.authDialog.querySelector(".drift-auth-username");
      this.authPasswordInput = this.authDialog.querySelector(".drift-auth-password");
      this.authStatusEl = this.authDialog.querySelector(".drift-auth-status");
      this.authCancelButton = this.authDialog.querySelector(".drift-auth-cancel");
      this.authSubmitButton = this.authDialog.querySelector(".drift-auth-submit");

      this.ctx = this.canvas.getContext("2d");

      this.input = new InputManager();
      this.camera = new Camera();
      this.car = new Car();

      this.levelIndex = clamp(START_LEVEL, 0, LEVELS.length - 1);
      this.level = null;
      this.levelTimer = 0;
      this.totalTimer = 0;
      this.totalDamage = 0;
      this.goalTimer = 0;
      this.completed = false;
      this.screenWipePhase = "idle";
      this.screenWipeTimer = 0;
      this.screenWipeAction = null;

      this.skidMarks = [];
      this.skidEmitTimer = 0;
      this.lastSkidLeft = null;
      this.lastSkidRight = null;
      this.damageSmoke = [];
      this.damageFire = [];
      this.explosionParticles = [];
      this.smokeEmitTimer = 0;
      this.fireEmitTimer = 0;
      this.fireSequenceTimer = 0;
      this.explosionTimer = 0;
      this.exploding = false;
      this.finishDebris = [];
      this.wallFlashes = new Map();
      this.wallTouching = false;
      this.wallTouchingThisFrame = false;

      this.shakeTime = 0;
      this.shakeStrength = 0;
      this.lastFrameTime = performance.now();
      this.accumulator = 0;
      this.width = 1280;
      this.height = 720;
      this.dpr = 1;
      this.currentScreen = "title";
      this.mouse = { x: 0, y: 0, inside: false, down: false };
      this.touchJoystick = createTouchJoystickState();
      this.hoveredTitleButton = null;
      this.hoveredTitleOnlineButton = false;
      this.hoveredTitleUsernameButton = null;
      this.hoveredTwoPlayerButton = null;
      this.hoveredLeaderboardButton = null;
      this.hoveredOnlineButton = null;
      this.hoveredCommunityLevel = null;
      this.hoveredGameButton = null;
      this.hoveredCompletionButton = null;
      this.hoveredHomeConfirmButton = null;
      this.gameExitHover = 0;
      this.gameRestartHover = 0;
      this.hudToggleHover = 0;
      this.completionHomeHover = 0;
      this.completionReplayHover = 0;
      this.completionNextHover = 0;
      this.homeConfirmCancelHover = 0;
      this.homeConfirmLeaveHover = 0;
      this.publishConfirmCancelHover = 0;
      this.publishConfirmPublishHover = 0;
      this.createPublishPromptBackHover = 0;
      this.createPublishPromptContinueHover = 0;
      this.hoveredLevelCard = null;
      this.hoveredLevelSelectButton = null;
      this.levelCardHovers = LEVELS.map(() => 0);
      this.levelSelectBackHover = 0;
      this.levelSelectSpeedrunHover = 0;
      this.levelSelectBlackoutHover = 0;
      this.hoveredCustomizationButton = null;
      this.customizationDoneHover = 0;
      this.customizationBackHover = 0;
      this.customizationPrevHover = 0;
      this.customizationNextHover = 0;
      this.leaderboardBackHover = 0;
      this.titleOnlineHover = 0;
      this.titleLeaderboardNameUpdateHover = 0;
      this.onlineBackHover = 0;
      this.onlineCommunityHover = 0;
      this.onlineCreateHover = 0;
      this.onlineLeaderboardHover = 0;
      this.myLevelsCreateHover = 0;
      this.myLevelMessageCloseHover = 0;
      this.communityDetailPlayHover = 0;
      this.communityLevelHovers = [];
      this.communityLevelsScrollY = 0;
      this.myLevelsScrollY = 0;
      this.onlineLevelListTouch = { id: null, startY: 0, lastY: 0, moved: false };
      this.customLevelRunHover = 0;
      this.customLevelCopyHover = 0;
      this.customLevelPublishHover = 0;
      this.customLevelTestText = EMPTY_LEVEL_FRAME.join("\n");
      this.publishLevelName = "";
      this.publishLevelText = "";
      this.customLevelStatusText = "";
      this.customLevelStatusTone = "neutral";
      this.customTestLevelDefinition = null;
      this.pendingCommunityLevel = null;
      this.pendingPublishValidationDefinition = null;
      this.publishConfirmOpen = false;
      this.hoveredPublishConfirmButton = null;
      this.createPublishPromptOpen = false;
      this.hoveredCreatePublishPromptButton = null;
      this.selectedCommunityLevelIndex = null;
      this.activeCommunityLevel = null;
      this.communityLevelReturnScreen = "community_levels";
      this.createLevelReturnScreen = "online";
      this.myLevelMessageDialog = null;
      this.onlineCommunityLevels = COMMUNITY_LEVELS.map((level) => ({ ...level, map: null, local: false, remoteId: null }));
      this.onlineMyLevels = [];
      this.localCommunityLevels = [];
      this.myCreatedLevels = [];
      this.communityLevels = [...this.onlineCommunityLevels];
      this.communityLevelSearchText = "";
      this.communityLevelHovers = this.communityLevels.map(() => 0);
      this.ownedUnnamedLeaderboardRecordKeys = [];
      this.leaderboardNameUpdateInFlight = false;
      this.leaderboardNameUpdateStatusText = "";
      this.leaderboardNameUpdateStatusTone = "neutral";
      this.authMode = "login";
      this.authRequestInFlight = false;
      this.authStatusText = "";
      this.authStatusTone = "neutral";
      this.signedInUsername = null;
      this.signOutConfirmOpen = false;
      this.titleLoginHover = 0;
      this.titleSignUpHover = 0;
      this.titleLogoutHover = 0;
      this.hoveredSignOutConfirmButton = null;
      this.signOutConfirmCancelHover = 0;
      this.signOutConfirmLeaveHover = 0;
      this.anonymousPlayerNumber = null;
      this.nextAnonymousPlayerNumber = 1;
      this.customLevelInput.value = this.customLevelTestText;
      this.publishLevelNameInput.value = this.publishLevelName;
      this.communitySearchInput.value = this.communityLevelSearchText;
      this.publishLevelInput.value = this.publishLevelText;
      this.highestVisitedLevel = this.levelIndex;
      this.levelBestTimes = LEVELS.map(() => null);
      this.levelCleanFinishes = LEVELS.map(() => false);
      this.worldRecords = LEVELS.map(() => ({ time: null, carVariant: null, carColor: null }));
      this.perfectWorldRecords = LEVELS.map(() => ({ time: null, carVariant: null, carColor: null }));
      this.blackoutWorldRecords = LEVELS.map(() => ({ time: null, carVariant: null, carColor: null }));
      this.speedrunWorldRecord = { time: null, carVariant: null, carColor: null };
      this.perfectSpeedrunWorldRecord = { time: null, carVariant: null, carColor: null };
      this.blackoutSpeedrunWorldRecord = { time: null, carVariant: null, carColor: null };
      this.selectedLeaderboardPeriod = "all_time";
      this.hoveredLeaderboardPeriodTab = null;
      this.leaderboardPeriodTabHovers = Object.fromEntries(LEADERBOARD_PERIODS.map((period) => [period.id, 0]));
      this.onlineLeaderboardSyncInFlight = false;
      this.onlineLeaderboardSeededLocalRecords = false;
      this.onlineLeaderboardLastSyncAt = 0;
      this.onlineLeaderboardRowsByKey = new Map();
      this.onlineLeaderboardStatusText = this.isOnlineLeaderboardConfigured()
        ? "Online WR syncing..."
        : "Local-only WRs (configure Supabase to share)";
      this.onlineLeaderboardStatusTone = this.isOnlineLeaderboardConfigured() ? "neutral" : "offline";
      this.onlineLeaderboardSubmissionQueue = Promise.resolve();
      this.onlineLeaderboardPollTimer = null;
      this.onlineLeaderboardVisibilityHandler = null;
      this.onlineCommunitySyncInFlight = false;
      this.onlineCommunityLastSyncAt = 0;
      this.onlineCommunityPollTimer = null;
      this.communityPublishRequestInFlight = false;
      this.levelCompletionSummary = null;
      this.completionSceneTimer = 0;
      this.levelTimerStarted = false;
      this.levelTouchedWallThisRun = false;
      this.goalTriggered = false;
      this.raceCountdownTimer = 0;
      this.raceGoTimer = 0;
      this.speedrunTimerStarted = false;
      this.death_counter = 0;
      this.speedrunTouchedWall = false;
      this.homeConfirmOpen = false;
      this.hudCollapsed = false;
      this.hudCollapseAnim = 0;
      this.playerUsername = "Player 1";
      this.playerCarColor = "#909090";
      this.playerCarVariant = CAR_VARIANTS[0].id;
      this.twoPlayerCarSettings = {
        red: { color: "#ea4d4d", variant: "muscle" },
        blue: { color: "#4f89ff", variant: "roadster" },
      };
      this.loadPersistentProgress();
      const cleanedBogusDriftyAdminLevels = this.purgeBogusDriftyAdminLevels({ save: false });
      if (this.ensureAnonymousPlayerProfile() || cleanedBogusDriftyAdminLevels) {
        this.savePersistentProgress();
      }
      this.usernameInput.value = this.playerUsername;
      this.customizationDraftColor = this.playerCarColor;
      this.customizationDraftVariant = this.playerCarVariant;
      this.twoPlayerCustomizationDrafts = {
        red: { ...this.twoPlayerCarSettings.red },
        blue: { ...this.twoPlayerCarSettings.blue },
      };
      this.gameMode = "campaign";
      this.levelSelectContext = "single";
      this.raceWinner = null;
      this.twoPlayerNotice = "";
      this.twoPlayerNoticeTimer = 0;
      this.twoPlayerButtons = [
        { id: "tag_mode", label: "Tag", hover: 0 },
        { id: "race_mode", label: "Race", hover: 0 },
        { id: "customize", label: "Customize", hover: 0 },
        { id: "back", label: "Back", hover: 0 },
      ];
      this.leaderboardButtons = [
        { id: "back", label: "Back", hover: 0 },
      ];
      this.tagCars = this.createTagPlayers();
      this.tagMapIndex = 0;
      this.tagElapsed = 0;
      this.tagTransferCooldown = 0;
      this.tagMatchFinished = false;
      this.tagWinnerText = "";
      this.titleButtons = [
        { id: "play", label: "Play", hover: 0 },
        { id: "two_player", label: "2 Player", hover: 0 },
        { id: "customization", label: "Customization", hover: 0 },
        { id: "online", label: "Online", hover: 0 },
      ];
      this.titleTrail = [];
      this.titleTrailTimer = 0;
      this.titleBackdropPhase = Math.random() * Math.PI * 2;
      this.carSpriteSheet = null;
      this.carPaintMaskSheet = null;
      this.tintedCarSpriteCache = new Map();
      this.colorParserCtx = null;
      this.titleDrifter = this.createTitleDrifter();
      this.loadCarSpriteSheet();

      window.addEventListener("resize", () => this.resize());
      this.canvas.addEventListener("mousemove", (event) => this.onCanvasPointerMove(event));
      this.canvas.addEventListener("mousedown", (event) => this.onCanvasPointerDown(event));
      this.canvas.addEventListener("touchstart", (event) => this.onCanvasTouchStart(event), { passive: false });
      this.canvas.addEventListener("touchmove", (event) => this.onCanvasTouchMove(event), { passive: false });
      this.canvas.addEventListener("touchend", (event) => this.onCanvasTouchEnd(event), { passive: false });
      this.canvas.addEventListener("touchcancel", (event) => this.onCanvasTouchCancel(event), { passive: false });
      this.canvas.addEventListener("wheel", (event) => this.onCanvasWheel(event), { passive: false });
      this.canvas.addEventListener("mouseleave", () => this.onCanvasPointerLeave());
      this.canvas.addEventListener("click", (event) => this.handleCanvasClick(event));
      window.addEventListener("mouseup", () => this.onCanvasPointerUp());
      this.colorInput.addEventListener("input", (event) => {
        this.customizationDraftColor = event.target.value;
      });
      this.usernameInput.addEventListener("input", (event) => {
        event.target.value = this.playerUsername;
      });
      this.usernameInput.addEventListener("blur", () => {
        this.usernameInput.value = this.playerUsername;
      });
      for (const eventName of ["keydown", "keyup", "keypress"]) {
        this.usernameInput.addEventListener(eventName, (event) => event.stopPropagation());
      }
      this.authForm.addEventListener("submit", (event) => {
        event.preventDefault();
        this.submitAuthDialog();
      });
      this.authCancelButton.addEventListener("click", () => this.closeAuthDialog());
      this.authDialog.addEventListener("mousedown", (event) => {
        if (event.target === this.authDialog) {
          this.closeAuthDialog();
        }
      });
      for (const element of [this.authDialog, this.authUsernameInput, this.authPasswordInput]) {
        for (const eventName of ["keydown", "keyup", "keypress"]) {
          element.addEventListener(eventName, (event) => event.stopPropagation());
        }
      }
      this.authUsernameInput.addEventListener("input", (event) => {
        const normalized = normalizeUsername(event.target.value);
        if (event.target.value !== normalized) {
          event.target.value = normalized;
        }
      });
      this.customLevelInput.addEventListener("input", (event) => {
        this.customLevelTestText = event.target.value;
        this.customLevelStatusText = "";
      });
      for (const eventName of ["keydown", "keyup", "keypress"]) {
        this.customLevelInput.addEventListener(eventName, (event) => event.stopPropagation());
      }
      this.publishLevelNameInput.addEventListener("input", (event) => {
        const cleaned = String(event.target.value ?? "").replace(/[\r\n\t]/g, " ").replace(/\s+/g, " ").slice(0, COMMUNITY_LEVEL_NAME_MAX_LENGTH);
        if (event.target.value !== cleaned) {
          event.target.value = cleaned;
        }
        this.publishLevelName = cleaned;
        this.customLevelStatusText = "";
      });
      this.publishLevelNameInput.addEventListener("blur", () => {
        this.publishLevelName = normalizeCommunityLevelName(this.publishLevelName);
        this.publishLevelNameInput.value = this.publishLevelName;
      });
      this.publishLevelInput.addEventListener("input", (event) => {
        this.publishLevelText = event.target.value;
        this.customLevelStatusText = "";
      });
      this.communitySearchInput.addEventListener("input", (event) => {
        const cleaned = String(event.target.value ?? "").replace(/[\r\n\t]/g, " ").replace(/\s+/g, " ").trimStart().slice(0, COMMUNITY_LEVEL_NAME_MAX_LENGTH);
        if (event.target.value !== cleaned) {
          event.target.value = cleaned;
        }
        this.communityLevelSearchText = cleaned;
        this.setOnlineLevelListScrollY(0, "community_levels");
        this.refreshOnlineHover();
      });
      for (const eventName of ["keydown", "keyup", "keypress"]) {
        this.publishLevelNameInput.addEventListener(eventName, (event) => event.stopPropagation());
        this.publishLevelInput.addEventListener(eventName, (event) => event.stopPropagation());
        this.communitySearchInput.addEventListener(eventName, (event) => event.stopPropagation());
      }
      for (const [playerId, input] of Object.entries(this.twoPlayerColorInputs)) {
        input.addEventListener("input", (event) => {
          if (this.twoPlayerCustomizationDrafts[playerId]) {
            this.twoPlayerCustomizationDrafts[playerId].color = event.target.value;
          }
        });
      };
      this.resize();
      this.loadLevel(this.levelIndex);
      this.startOnlineLeaderboardSync();
      this.startOnlineCommunitySync();

      requestAnimationFrame((time) => this.frame(time));
    }

    installShell() {
      document.title = "Drifty";
      document.body.style.margin = "0";
      document.body.style.overflow = "hidden";
      document.body.style.background = "#020409";
      document.body.style.fontFamily = "Consolas, Menlo, monospace";
      document.body.innerHTML = "";
      let colorInputStyle = document.getElementById("drift-color-input-style");
      if (!colorInputStyle) {
        colorInputStyle = document.createElement("style");
        colorInputStyle.id = "drift-color-input-style";
        colorInputStyle.textContent = `
          .drift-color-input {
            appearance: none;
            -webkit-appearance: none;
            overflow: hidden;
            cursor: pointer;
          }
          .drift-color-input::-webkit-color-swatch-wrapper {
            padding: 0;
          }
          .drift-color-input::-webkit-color-swatch {
            border: none;
            border-radius: 12px;
          }
          .drift-color-input::-moz-color-swatch {
            border: none;
            border-radius: 12px;
          }
          .drift-username-input {
            box-sizing: border-box;
            margin: 0;
            border: 1px solid rgba(174, 222, 255, 0.46);
            border-radius: 10px;
            background: rgba(7, 13, 21, 0.92);
            color: #edf7ff;
            font-family: Consolas, Menlo, monospace;
            font-weight: 700;
            text-align: center;
            outline: none;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
          }
          .drift-username-input:focus {
            border-color: rgba(154, 255, 210, 0.88);
            box-shadow: 0 0 0 2px rgba(154, 255, 210, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          }
          .drift-custom-level-input {
            box-sizing: border-box;
            margin: 0;
            border: 1px solid rgba(128, 214, 255, 0.36);
            border-radius: 10px;
            background: rgba(3, 8, 14, 0.94);
            color: #edf7ff;
            font-family: Consolas, Menlo, monospace;
            font-weight: 700;
            line-height: 1.25;
            outline: none;
            padding: 10px 12px;
            resize: none;
            white-space: pre;
            overflow: auto;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
          }
          .drift-custom-level-input:focus {
            border-color: rgba(154, 255, 210, 0.88);
            box-shadow: 0 0 0 2px rgba(154, 255, 210, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          }
          .drift-username-input::placeholder,
          .drift-custom-level-input::placeholder {
            color: rgba(190, 225, 242, 0.52);
            opacity: 1;
          }
          .drift-auth-dialog {
            position: fixed;
            inset: 0;
            z-index: 20;
            display: none;
            align-items: center;
            justify-content: center;
            background: rgba(2, 5, 10, 0.66);
            backdrop-filter: blur(8px);
          }
          .drift-auth-panel {
            box-sizing: border-box;
            width: min(360px, calc(100vw - 28px));
            padding: 20px;
            border: 1px solid rgba(154, 255, 210, 0.34);
            border-radius: 16px;
            background: linear-gradient(180deg, rgba(8, 18, 29, 0.98), rgba(4, 9, 16, 0.98));
            box-shadow: 0 22px 58px rgba(0, 0, 0, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.08);
            color: #edf7ff;
            font-family: Consolas, Menlo, monospace;
          }
          .drift-auth-panel h2,
          .drift-auth-panel p {
            margin: 0;
            text-align: center;
          }
          .drift-auth-panel h2 {
            font-size: 26px;
            color: #e8fff4;
          }
          .drift-auth-panel p {
            margin-top: 6px;
            color: rgba(190, 225, 242, 0.72);
            font-size: 13px;
          }
          .drift-auth-panel input {
            box-sizing: border-box;
            width: 100%;
            margin-top: 12px;
            padding: 12px 13px;
            border: 1px solid rgba(174, 222, 255, 0.36);
            border-radius: 10px;
            background: rgba(3, 8, 14, 0.94);
            color: #edf7ff;
            font-family: Consolas, Menlo, monospace;
            font-weight: 700;
            outline: none;
          }
          .drift-auth-panel input:focus {
            border-color: rgba(154, 255, 210, 0.82);
            box-shadow: 0 0 0 2px rgba(154, 255, 210, 0.14);
          }
          .drift-auth-status {
            min-height: 18px;
            margin-top: 10px;
            text-align: center;
            font-size: 12px;
            color: rgba(190, 225, 242, 0.72);
          }
          .drift-auth-status.error {
            color: #ff9d9d;
          }
          .drift-auth-status.ok {
            color: #9affd2;
          }
          .drift-auth-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 14px;
          }
          .drift-auth-panel button {
            border: 1px solid rgba(152, 223, 255, 0.24);
            border-radius: 10px;
            padding: 11px 12px;
            background: linear-gradient(180deg, rgba(10, 33, 49, 0.96), rgba(13, 53, 74, 0.94));
            color: #eff9ff;
            cursor: pointer;
            font-family: Consolas, Menlo, monospace;
            font-weight: 700;
          }
          .drift-auth-submit {
            border-color: rgba(154, 255, 210, 0.34) !important;
            background: linear-gradient(180deg, rgba(14, 61, 43, 0.96), rgba(26, 112, 72, 0.94)) !important;
            color: #e6fff0 !important;
          }
          .drift-auth-panel button:disabled {
            cursor: wait;
            opacity: 0.64;
          }
        `;
        document.head.appendChild(colorInputStyle);
      }
    }

    resize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));

      const pixelWidth = Math.floor(this.width * this.dpr);
      const pixelHeight = Math.floor(this.height * this.dpr);

      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;

      for (const ctx of [this.ctx]) {
        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
      }
      this.updateUsernameInputVisibility();
      this.updateCustomLevelInputVisibility();
      this.updateCommunitySearchInputVisibility();
      this.updateCustomizationPickerVisibility();
    }

    createTitleDrifter() {
      const hue = Math.floor(Math.random() * 360);
      return {
        x: this.width * (0.2 + Math.random() * 0.6),
        y: this.height * (0.38 + Math.random() * 0.32),
        angle: Math.random() * Math.PI * 2,
        speed: 230 + Math.random() * 90,
        targetSpeed: 260 + Math.random() * 140,
        vx: 0,
        vy: 0,
        angularVelocity: 0,
        targetTurn: 0,
        decisionTimer: 0.4,
        variant: CAR_VARIANTS[Math.floor(Math.random() * CAR_VARIANTS.length)].id,
        bodyColor: `hsl(${hue} 70% 62%)`,
        glowColor: `hsla(${hue} 100% 72% / 0.45)`,
      };
    }

    loadCarSpriteSheet() {
      const loadImage = (path, targetKey, label) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => {
          this[targetKey] = image;
          this.tintedCarSpriteCache.clear();
        };
        image.onerror = () => {
          console.warn(`Failed to load ${label}: ${path}`);
        };
        image.src = encodeURI(path);
        this[targetKey] = image;
      };

      loadImage(CAR_SPRITE_BASE_PATH, "carSpriteSheet", "car sprite base");
      loadImage(CAR_SPRITE_MASK_PATH, "carPaintMaskSheet", "car paint mask");
    }

    getCarVariantDefinition(variantId) {
      return CAR_VARIANTS.find((variant) => variant.id === variantId) || CAR_VARIANTS[0];
    }

    normalizeWorldRecordEntry(entry) {
      const time = Number.isFinite(entry?.time) && entry.time >= 0 ? entry.time : null;
      const hasVariant = typeof entry?.carVariant === "string" && CAR_VARIANTS.some((variant) => variant.id === entry.carVariant);
      const carColor = isValidHexColor(entry?.carColor) ? entry.carColor : "#909090";
      const deaths = Number.isFinite(entry?.deaths) && entry.deaths >= 0 ? Math.floor(entry.deaths) : null;
      const playerName = normalizeUsername(entry?.playerName);
      return {
        time,
        carVariant: time == null ? null : (hasVariant ? entry.carVariant : CAR_VARIANTS[0].id),
        carColor: time == null ? null : carColor,
        deaths: time == null ? null : deaths,
        playerName: time == null ? null : (playerName || null),
      };
    }

    isOnlineLeaderboardConfigured() {
      return typeof ONLINE_LEADERBOARD_CONFIG.supabaseUrl === "string" &&
        ONLINE_LEADERBOARD_CONFIG.supabaseUrl.trim().length > 0 &&
        typeof ONLINE_LEADERBOARD_CONFIG.supabaseAnonKey === "string" &&
        ONLINE_LEADERBOARD_CONFIG.supabaseAnonKey.trim().length > 0;
    }

    setOnlineLeaderboardStatus(text, tone = "neutral") {
      this.onlineLeaderboardStatusText = text;
      this.onlineLeaderboardStatusTone = tone;
    }

    getOnlineLeaderboardPollIntervalMs() {
      const configured = Number(ONLINE_LEADERBOARD_CONFIG.pollIntervalMs);
      return clamp(Number.isFinite(configured) ? Math.round(configured) : 15000, 5000, 120000);
    }

    getOnlineLeaderboardBaseUrl() {
      return ONLINE_LEADERBOARD_CONFIG.supabaseUrl.replace(/\/+$/, "");
    }

    getOnlineLeaderboardHeaders(includeJson = false) {
      const headers = {
        apikey: ONLINE_LEADERBOARD_CONFIG.supabaseAnonKey,
        Authorization: `Bearer ${ONLINE_LEADERBOARD_CONFIG.supabaseAnonKey}`,
      };
      if (includeJson) {
        headers["Content-Type"] = "application/json";
      }
      return headers;
    }

    getLevelLeaderboardBaseScopeFromRecordArray(records) {
      if (records === this.worldRecords) {
        return "level_normal";
      }
      if (records === this.perfectWorldRecords) {
        return "level_perfect";
      }
      if (records === this.blackoutWorldRecords) {
        return "level_blackout";
      }
      return null;
    }

    getVersionedLevelScope(baseScope, levelIndex) {
      const resetVersion = LEVEL_LEADERBOARD_SCOPE_RESETS[levelIndex];
      return resetVersion ? `${baseScope}_${resetVersion}` : baseScope;
    }

    getOnlineLeaderboardScopeFromLevelRecordArray(records, levelIndex = null) {
      const baseScope = this.getLevelLeaderboardBaseScopeFromRecordArray(records);
      return baseScope ? this.getVersionedLevelScope(baseScope, levelIndex) : null;
    }

    getSpeedrunLeaderboardVersion() {
      return `levels_${LEVELS.length}`;
    }

    getVersionedSpeedrunScope(baseScope) {
      return `${baseScope}_${this.getSpeedrunLeaderboardVersion()}`;
    }

    getOnlineLeaderboardScopeFromSpeedrunKey(targetKey) {
      if (targetKey === "speedrunWorldRecord") {
        return this.getVersionedSpeedrunScope("speedrun_normal");
      }
      if (targetKey === "perfectSpeedrunWorldRecord") {
        return this.getVersionedSpeedrunScope("speedrun_perfect");
      }
      if (targetKey === "blackoutSpeedrunWorldRecord") {
        return this.getVersionedSpeedrunScope("speedrun_blackout");
      }
      return null;
    }

    getOnlineLeaderboardBaseRecordKey(scope, levelIndex = null) {
      return `${scope}:${levelIndex == null ? "global" : levelIndex}`;
    }

    getLeaderboardPeriodDateKey(date = new Date()) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    getLeaderboardPeriodKey(period = "all_time", date = new Date()) {
      if (period === "daily") {
        return this.getLeaderboardPeriodDateKey(date);
      }
      if (period === "weekly") {
        const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return this.getLeaderboardPeriodDateKey(weekStart);
      }
      return "all_time";
    }

    getOnlineLeaderboardRecordKey(scope, levelIndex = null, period = "all_time", periodKey = this.getLeaderboardPeriodKey(period)) {
      const baseKey = this.getOnlineLeaderboardBaseRecordKey(scope, levelIndex);
      return period === "all_time" ? baseKey : `${period}:${periodKey}:${baseKey}`;
    }

    getLeaderboardPeriodFromRow(row) {
      const explicitPeriod = typeof row?.leaderboard_period === "string" ? row.leaderboard_period.trim() : "";
      if (LEADERBOARD_PERIODS.some((period) => period.id === explicitPeriod)) {
        return explicitPeriod;
      }
      const recordKey = typeof row?.record_key === "string" ? row.record_key : "";
      const [period] = recordKey.split(":");
      return LEADERBOARD_PERIODS.some((entry) => entry.id === period) ? period : "all_time";
    }

    getLeaderboardPeriodKeyFromRow(row, period = this.getLeaderboardPeriodFromRow(row)) {
      const explicitKey = typeof row?.period_key === "string" ? row.period_key.trim() : "";
      if (explicitKey) {
        return explicitKey;
      }
      if (period === "all_time") {
        return "all_time";
      }
      const parts = typeof row?.record_key === "string" ? row.record_key.split(":") : [];
      return parts.length >= 4 ? parts[1] : this.getLeaderboardPeriodKey(period);
    }

    getTrackedOnlineLeaderboardRecords() {
      const tracked = [];
      const levelScopes = [
        { scope: "level_normal", records: this.worldRecords },
        { scope: "level_perfect", records: this.perfectWorldRecords },
        { scope: "level_blackout", records: this.blackoutWorldRecords },
      ];
      for (const group of levelScopes) {
        for (let index = 0; index < LEVELS.length; index += 1) {
          const entry = this.normalizeWorldRecordEntry(group.records[index]);
          if (entry.time != null) {
            tracked.push({ scope: this.getVersionedLevelScope(group.scope, index), levelIndex: index, entry });
          }
        }
      }
      const globalScopes = [
        { scope: this.getVersionedSpeedrunScope("speedrun_normal"), entry: this.speedrunWorldRecord },
        { scope: this.getVersionedSpeedrunScope("speedrun_perfect"), entry: this.perfectSpeedrunWorldRecord },
        { scope: this.getVersionedSpeedrunScope("speedrun_blackout"), entry: this.blackoutSpeedrunWorldRecord },
      ];
      for (const group of globalScopes) {
        const entry = this.normalizeWorldRecordEntry(group.entry);
        if (entry.time != null) {
          tracked.push({ scope: group.scope, levelIndex: null, entry });
        }
      }
      return tracked;
    }

    getOnlineLeaderboardFetchUrl(includePlayerName = true) {
      const params = new URLSearchParams({
        select: includePlayerName
          ? "record_key,leaderboard_period,period_key,scope,level_index,time_ms,car_variant,car_color,player_name,deaths,updated_at"
          : "record_key,leaderboard_period,period_key,scope,level_index,time_ms,car_variant,car_color,deaths,updated_at",
        order: "leaderboard_period.asc,period_key.desc,scope.asc,level_index.asc.nullslast",
      });
      return `${this.getOnlineLeaderboardBaseUrl()}/rest/v1/${ONLINE_LEADERBOARD_CONFIG.tableName}?${params.toString()}`;
    }

    getLegacyOnlineLeaderboardFetchUrl(includePlayerName = true) {
      const params = new URLSearchParams({
        select: includePlayerName
          ? "record_key,scope,level_index,time_ms,car_variant,car_color,player_name,deaths,updated_at"
          : "record_key,scope,level_index,time_ms,car_variant,car_color,deaths,updated_at",
        order: "scope.asc,level_index.asc.nullslast",
      });
      return `${this.getOnlineLeaderboardBaseUrl()}/rest/v1/${ONLINE_LEADERBOARD_CONFIG.tableName}?${params.toString()}`;
    }

    getOnlineLeaderboardSubmitUrl() {
      return `${this.getOnlineLeaderboardBaseUrl()}/rest/v1/rpc/${ONLINE_LEADERBOARD_CONFIG.submitRpcName}`;
    }

    getOnlineAccountRpcUrl(rpcName) {
      return `${this.getOnlineLeaderboardBaseUrl()}/rest/v1/rpc/${rpcName}`;
    }

    isOnlineAccountConfigured() {
      return this.isOnlineLeaderboardConfigured() &&
        typeof ONLINE_LEADERBOARD_CONFIG.signUpRpcName === "string" &&
        ONLINE_LEADERBOARD_CONFIG.signUpRpcName.trim().length > 0 &&
        typeof ONLINE_LEADERBOARD_CONFIG.logInRpcName === "string" &&
        ONLINE_LEADERBOARD_CONFIG.logInRpcName.trim().length > 0;
    }

    async callOnlineAccountRpc(rpcName, username, password) {
      const response = await fetch(this.getOnlineAccountRpcUrl(rpcName), {
        method: "POST",
        headers: this.getOnlineLeaderboardHeaders(true),
        body: JSON.stringify({
          p_username: username,
          p_password: password,
        }),
      });
      if (!response.ok) {
        throw new Error(`Account request failed with ${response.status}`);
      }
      const payload = await response.json();
      return Array.isArray(payload) ? payload[0] : payload;
    }

    normalizeOnlineLeaderboardRow(row) {
      const levelIndex = Number.isFinite(row?.level_index) ? Math.floor(row.level_index) : null;
      const leaderboardPeriod = this.getLeaderboardPeriodFromRow(row);
      const periodKey = this.getLeaderboardPeriodKeyFromRow(row, leaderboardPeriod);
      return {
        recordKey: typeof row?.record_key === "string" ? row.record_key : "",
        leaderboardPeriod,
        periodKey,
        scope: typeof row?.scope === "string" ? row.scope : "",
        levelIndex,
        entry: this.normalizeWorldRecordEntry({
          time: Number.isFinite(row?.time_ms) ? row.time_ms : null,
          carVariant: row?.car_variant,
          carColor: row?.car_color,
          playerName: row?.player_name,
          deaths: row?.deaths,
        }),
      };
    }

    cacheOnlineLeaderboardRows(rows, replace = false) {
      if (replace) {
        this.onlineLeaderboardRowsByKey = new Map();
      }
      for (const row of rows) {
        const normalized = this.normalizeOnlineLeaderboardRow(row);
        if (normalized.recordKey) {
          this.onlineLeaderboardRowsByKey.set(normalized.recordKey, normalized);
        }
      }
    }

    shouldAdoptOnlineRecord(current, incoming) {
      if (incoming.time == null) {
        return false;
      }
      if (current.time == null) {
        return true;
      }
      return incoming.time < current.time ||
        (
          incoming.time === current.time &&
          (
            incoming.carVariant !== current.carVariant ||
            incoming.carColor !== current.carColor ||
            (incoming.playerName != null && incoming.playerName !== current.playerName) ||
            incoming.deaths !== current.deaths
          )
        );
    }

    applyOnlineLeaderboardEntry(scope, levelIndex, entry) {
      const normalized = this.normalizeWorldRecordEntry(entry);
      if (normalized.time == null) {
        return false;
      }

      if (
        Number.isInteger(levelIndex) &&
        levelIndex >= 0 &&
        levelIndex < this.worldRecords.length &&
        scope === this.getVersionedLevelScope("level_normal", levelIndex)
      ) {
        const current = this.normalizeWorldRecordEntry(this.worldRecords[levelIndex]);
        if (!this.shouldAdoptOnlineRecord(current, normalized)) {
          return false;
        }
        this.worldRecords[levelIndex] = normalized;
        return true;
      }
      if (
        Number.isInteger(levelIndex) &&
        levelIndex >= 0 &&
        levelIndex < this.perfectWorldRecords.length &&
        scope === this.getVersionedLevelScope("level_perfect", levelIndex)
      ) {
        const current = this.normalizeWorldRecordEntry(this.perfectWorldRecords[levelIndex]);
        if (!this.shouldAdoptOnlineRecord(current, normalized)) {
          return false;
        }
        this.perfectWorldRecords[levelIndex] = normalized;
        return true;
      }
      if (
        Number.isInteger(levelIndex) &&
        levelIndex >= 0 &&
        levelIndex < this.blackoutWorldRecords.length &&
        scope === this.getVersionedLevelScope("level_blackout", levelIndex)
      ) {
        const current = this.normalizeWorldRecordEntry(this.blackoutWorldRecords[levelIndex]);
        if (!this.shouldAdoptOnlineRecord(current, normalized)) {
          return false;
        }
        this.blackoutWorldRecords[levelIndex] = normalized;
        return true;
      }
      if (scope === this.getVersionedSpeedrunScope("speedrun_normal")) {
        const current = this.normalizeWorldRecordEntry(this.speedrunWorldRecord);
        if (!this.shouldAdoptOnlineRecord(current, normalized)) {
          return false;
        }
        this.speedrunWorldRecord = normalized;
        return true;
      }
      if (scope === this.getVersionedSpeedrunScope("speedrun_perfect")) {
        const current = this.normalizeWorldRecordEntry(this.perfectSpeedrunWorldRecord);
        if (!this.shouldAdoptOnlineRecord(current, normalized)) {
          return false;
        }
        this.perfectSpeedrunWorldRecord = normalized;
        return true;
      }
      if (scope === this.getVersionedSpeedrunScope("speedrun_blackout")) {
        const current = this.normalizeWorldRecordEntry(this.blackoutSpeedrunWorldRecord);
        if (!this.shouldAdoptOnlineRecord(current, normalized)) {
          return false;
        }
        this.blackoutSpeedrunWorldRecord = normalized;
        return true;
      }
      return false;
    }

    applyOnlineLeaderboardRows(rows) {
      let changed = false;
      for (const row of rows) {
        const normalized = this.normalizeOnlineLeaderboardRow(row);
        if (normalized.leaderboardPeriod !== "all_time") {
          continue;
        }
        if (this.applyOnlineLeaderboardEntry(normalized.scope, normalized.levelIndex, normalized.entry)) {
          changed = true;
        }
      }
      if (changed) {
        this.savePersistentProgress();
      }
      return changed;
    }

    async fetchOnlineLeaderboardRows() {
      let response = await fetch(this.getOnlineLeaderboardFetchUrl(true), {
        method: "GET",
        headers: this.getOnlineLeaderboardHeaders(false),
      });
      if (!response.ok && response.status === 400) {
        response = await fetch(this.getOnlineLeaderboardFetchUrl(false), {
          method: "GET",
          headers: this.getOnlineLeaderboardHeaders(false),
        });
      }
      if (!response.ok && response.status === 400) {
        response = await fetch(this.getLegacyOnlineLeaderboardFetchUrl(true), {
          method: "GET",
          headers: this.getOnlineLeaderboardHeaders(false),
        });
      }
      if (!response.ok && response.status === 400) {
        response = await fetch(this.getLegacyOnlineLeaderboardFetchUrl(false), {
          method: "GET",
          headers: this.getOnlineLeaderboardHeaders(false),
        });
      }
      if (!response.ok) {
        throw new Error(`Leaderboard fetch failed with ${response.status}`);
      }
      const rows = await response.json();
      return Array.isArray(rows) ? rows : [];
    }

    async submitOnlineLeaderboardRecord(scope, levelIndex, entry, period = "all_time", periodKey = this.getLeaderboardPeriodKey(period)) {
      const normalized = this.normalizeWorldRecordEntry(entry);
      if (!this.isOnlineLeaderboardConfigured() || normalized.time == null) {
        return null;
      }

      const payload = {
        p_record_key: this.getOnlineLeaderboardRecordKey(scope, levelIndex, period, periodKey),
        p_scope: scope,
        p_level_index: Number.isInteger(levelIndex) ? levelIndex : null,
        p_time_ms: normalized.time,
        p_car_variant: normalized.carVariant,
        p_car_color: normalized.carColor,
        p_player_name: normalized.playerName,
        p_deaths: normalized.deaths,
        p_leaderboard_period: period,
        p_period_key: periodKey,
      };
      let response = await fetch(this.getOnlineLeaderboardSubmitUrl(), {
        method: "POST",
        headers: this.getOnlineLeaderboardHeaders(true),
        body: JSON.stringify(payload),
      });
      if (!response.ok && (response.status === 400 || response.status === 404) && period === "all_time") {
        const fallbackPayload = { ...payload };
        delete fallbackPayload.p_leaderboard_period;
        delete fallbackPayload.p_period_key;
        response = await fetch(this.getOnlineLeaderboardSubmitUrl(), {
          method: "POST",
          headers: this.getOnlineLeaderboardHeaders(true),
          body: JSON.stringify(fallbackPayload),
        });
      }
      if (!response.ok && (response.status === 400 || response.status === 404) && period === "all_time") {
        const fallbackPayload = { ...payload };
        delete fallbackPayload.p_player_name;
        delete fallbackPayload.p_leaderboard_period;
        delete fallbackPayload.p_period_key;
        response = await fetch(this.getOnlineLeaderboardSubmitUrl(), {
          method: "POST",
          headers: this.getOnlineLeaderboardHeaders(true),
          body: JSON.stringify(fallbackPayload),
        });
      }
      if (!response.ok) {
        throw new Error(`Leaderboard submit failed with ${response.status}`);
      }
      const responsePayload = await response.json();
      const row = Array.isArray(responsePayload) ? responsePayload[0] : responsePayload;
      if (row && typeof row === "object") {
        this.cacheOnlineLeaderboardRows([row]);
        this.applyOnlineLeaderboardRows([row]);
      }
      this.onlineLeaderboardLastSyncAt = Date.now();
      this.setOnlineLeaderboardStatus("Online WR live", "online");
      return row;
    }

    queueOnlineLeaderboardRecordSubmission(scope, levelIndex, entry, period = "all_time", periodKey = this.getLeaderboardPeriodKey(period)) {
      if (!this.isOnlineLeaderboardConfigured()) {
        return;
      }
      this.onlineLeaderboardSubmissionQueue = this.onlineLeaderboardSubmissionQueue
        .catch(() => undefined)
        .then(() => this.submitOnlineLeaderboardRecord(scope, levelIndex, entry, period, periodKey))
        .catch(() => {
          this.setOnlineLeaderboardStatus("Online WR sync failed, using local copy", "offline");
        });
    }

    queueCurrentPeriodLeaderboardRecordSubmissions(scope, levelIndex, entry) {
      this.queueOnlineLeaderboardRecordSubmission(scope, levelIndex, entry, "daily");
      this.queueOnlineLeaderboardRecordSubmission(scope, levelIndex, entry, "weekly");
    }

    async seedOnlineLeaderboardFromLocalRecords() {
      const tracked = this.getTrackedOnlineLeaderboardRecords();
      for (const record of tracked) {
        await this.submitOnlineLeaderboardRecord(record.scope, record.levelIndex, record.entry);
      }
    }

    setAuthStatus(text, tone = "neutral") {
      this.authStatusText = text;
      this.authStatusTone = tone;
      if (this.authStatusEl) {
        this.authStatusEl.textContent = text;
        this.authStatusEl.className = `drift-auth-status${tone === "error" ? " error" : tone === "ok" ? " ok" : ""}`;
      }
    }

    openAuthDialog(mode = "login") {
      this.authMode = mode === "signup" ? "signup" : "login";
      this.setAuthStatus("", "neutral");
      if (!this.authDialog) {
        return;
      }
      const title = this.authMode === "signup" ? "Sign Up" : "Log In";
      this.authTitleEl.textContent = title;
      this.authCopyEl.textContent = this.authMode === "signup"
        ? "Create an account to use this username on any device."
        : "Log in to use your saved username on this device.";
      this.authSubmitButton.textContent = title;
      this.authUsernameInput.value = isAnonymousPlayerName(this.playerUsername) ? "" : this.playerUsername;
      this.authPasswordInput.value = "";
      this.authDialog.style.display = "flex";
      window.setTimeout(() => {
        this.authUsernameInput.focus();
        this.authUsernameInput.select();
      }, 0);
    }

    closeAuthDialog() {
      if (!this.authDialog || this.authRequestInFlight) {
        return;
      }
      this.authDialog.style.display = "none";
      this.authPasswordInput.value = "";
    }

    formatAnonymousPlayerName(number) {
      const safeNumber = clamp(Math.floor(Number.isFinite(number) ? number : 1), 1, 999);
      return `Player ${safeNumber}`;
    }

    ensureAnonymousPlayerProfile(forceNew = false) {
      if (this.signedInUsername) {
        return false;
      }

      const previousUsername = this.playerUsername;
      const previousNumber = this.anonymousPlayerNumber;
      const currentNext = Number.isFinite(this.nextAnonymousPlayerNumber) ? Math.floor(this.nextAnonymousPlayerNumber) : 1;
      this.nextAnonymousPlayerNumber = Math.max(1, currentNext);

      if (!forceNew) {
        const parsedNumber = getAnonymousPlayerNumber(this.playerUsername);
        if (!Number.isFinite(this.anonymousPlayerNumber) && parsedNumber != null) {
          this.anonymousPlayerNumber = parsedNumber;
        }
      }

      if (forceNew || !Number.isFinite(this.anonymousPlayerNumber) || this.anonymousPlayerNumber < 1) {
        this.anonymousPlayerNumber = this.nextAnonymousPlayerNumber;
        this.nextAnonymousPlayerNumber = this.anonymousPlayerNumber + 1;
      } else {
        this.nextAnonymousPlayerNumber = Math.max(this.nextAnonymousPlayerNumber, this.anonymousPlayerNumber + 1);
      }

      this.playerUsername = this.formatAnonymousPlayerName(this.anonymousPlayerNumber);
      if (this.usernameInput && document.activeElement !== this.usernameInput) {
        this.usernameInput.value = this.playerUsername;
      }

      return this.playerUsername !== previousUsername || this.anonymousPlayerNumber !== previousNumber;
    }

    applySignedInUsername(username) {
      const normalized = normalizeUsername(username);
      if (!normalized) {
        return;
      }
      this.playerUsername = normalized;
      this.signedInUsername = normalized;
      this.signOutConfirmOpen = false;
      this.usernameInput.value = normalized;
      this.authStatusText = `Signed in as ${normalized}`;
      this.authStatusTone = "ok";
      this.leaderboardNameUpdateStatusText = "";
      this.leaderboardNameUpdateStatusTone = "neutral";
      this.usernameInput.blur();
      this.updateUsernameInputVisibility();
      this.savePersistentProgress();
    }

    logOutAccount() {
      if (!this.signedInUsername) {
        return;
      }
      this.signedInUsername = null;
      this.ensureAnonymousPlayerProfile(true);
      this.authStatusText = "Logged out.";
      this.authStatusTone = "neutral";
      this.titleLoginHover = 0;
      this.titleSignUpHover = 0;
      this.titleLogoutHover = 0;
      this.closeSignOutConfirm();
      this.updateUsernameInputVisibility();
      this.refreshTitleHover();
      this.savePersistentProgress();
    }

    openSignOutConfirm() {
      if (!this.signedInUsername) {
        return;
      }
      this.signOutConfirmOpen = true;
      this.hoveredSignOutConfirmButton = null;
      this.signOutConfirmCancelHover = 0;
      this.signOutConfirmLeaveHover = 0;
      this.refreshTitleHover();
    }

    closeSignOutConfirm() {
      this.signOutConfirmOpen = false;
      this.hoveredSignOutConfirmButton = null;
      this.signOutConfirmCancelHover = 0;
      this.signOutConfirmLeaveHover = 0;
      this.refreshTitleHover();
    }

    getAuthDialogCredentials() {
      return {
        username: normalizeUsername(this.authUsernameInput?.value),
        password: String(this.authPasswordInput?.value || ""),
      };
    }

    async submitAuthDialog() {
      if (this.authRequestInFlight) {
        return;
      }
      if (!this.isOnlineAccountConfigured()) {
        this.setAuthStatus("Accounts are offline right now.", "error");
        return;
      }
      const { username, password } = this.getAuthDialogCredentials();
      if (!username || isAnonymousPlayerName(username)) {
        this.setAuthStatus("Enter a username.", "error");
        return;
      }
      if (!password) {
        this.setAuthStatus("Enter a password.", "error");
        return;
      }

      this.authRequestInFlight = true;
      this.authSubmitButton.disabled = true;
      this.authCancelButton.disabled = true;
      this.setAuthStatus(this.authMode === "signup" ? "Creating account..." : "Logging in...", "neutral");
      try {
        const rpcName = this.authMode === "signup"
          ? ONLINE_LEADERBOARD_CONFIG.signUpRpcName
          : ONLINE_LEADERBOARD_CONFIG.logInRpcName;
        const result = await this.callOnlineAccountRpc(rpcName, username, password);
        const status = String(result?.status || "");
        if (status === "ok") {
          const accountUsername = normalizeUsername(result?.username) || username;
          this.applySignedInUsername(accountUsername);
          this.setAuthStatus(this.authMode === "signup" ? "Account created." : "Logged in.", "ok");
          this.authDialog.style.display = "none";
          this.authPasswordInput.value = "";
          return;
        }
        if (status === "incorrect_username") {
          this.setAuthStatus("Incorrect username", "error");
        } else if (status === "incorrect_password") {
          this.setAuthStatus("Incorrect password", "error");
        } else if (status === "username_taken") {
          this.setAuthStatus("Username already exists.", "error");
        } else if (status === "invalid_username") {
          this.setAuthStatus("Enter a username.", "error");
        } else if (status === "invalid_password") {
          this.setAuthStatus("Enter a password.", "error");
        } else {
          this.setAuthStatus("Account request failed.", "error");
        }
      } catch {
        this.setAuthStatus("Account request failed. Apply the SQL update first.", "error");
      } finally {
        this.authRequestInFlight = false;
        this.authSubmitButton.disabled = false;
        this.authCancelButton.disabled = false;
      }
    }

    async updateUnnamedLeaderboardNames() {
      if (this.leaderboardNameUpdateInFlight || !this.isOnlineLeaderboardConfigured()) {
        return;
      }
      if (!hasRealLeaderboardName(this.playerUsername)) {
        this.leaderboardNameUpdateStatusText = "Enter a username first.";
        this.leaderboardNameUpdateStatusTone = "error";
        return;
      }

      const recordsToUpdate = this.getOwnedUnnamedLeaderboardRecords();
      if (recordsToUpdate.length === 0) {
        if (this.pruneOwnedUnnamedLeaderboardRecordKeys()) {
          this.savePersistentProgress();
        }
        this.leaderboardNameUpdateStatusText = "No unnamed records found for this save.";
        this.leaderboardNameUpdateStatusTone = "neutral";
        return;
      }

      this.leaderboardNameUpdateInFlight = true;
      this.leaderboardNameUpdateStatusText = "Updating leaderboard names...";
      this.leaderboardNameUpdateStatusTone = "neutral";
      const updatedKeys = [];

      try {
        for (const record of recordsToUpdate) {
          const responseRow = await this.submitOnlineLeaderboardRecord(record.scope, record.levelIndex, {
            ...record.entry,
            playerName: this.playerUsername,
          });
          const updatedName = normalizeUsername(responseRow?.player_name);
          if (!hasRealLeaderboardName(updatedName) || updatedName !== this.playerUsername) {
            throw new Error("Leaderboard name update not applied");
          }
          updatedKeys.push(this.getOnlineLeaderboardRecordKey(record.scope, record.levelIndex));
        }
        this.ownedUnnamedLeaderboardRecordKeys = this.ownedUnnamedLeaderboardRecordKeys.filter((key) => !updatedKeys.includes(key));
        this.pruneOwnedUnnamedLeaderboardRecordKeys();
        this.savePersistentProgress();
        this.leaderboardNameUpdateStatusText = updatedKeys.length === 1
          ? "Updated 1 old leaderboard record."
          : `Updated ${updatedKeys.length} old leaderboard records.`;
        this.leaderboardNameUpdateStatusTone = "ok";
      } catch {
        this.leaderboardNameUpdateStatusText = "Leaderboard update failed. Apply the SQL update first.";
        this.leaderboardNameUpdateStatusTone = "error";
      } finally {
        this.leaderboardNameUpdateInFlight = false;
      }
    }

    async syncOnlineLeaderboard({ includeLocalSeed = false } = {}) {
      if (!this.isOnlineLeaderboardConfigured()) {
        this.setOnlineLeaderboardStatus("Local-only WRs (configure Supabase to share)", "offline");
        return;
      }
      if (this.onlineLeaderboardSyncInFlight) {
        return;
      }

      this.onlineLeaderboardSyncInFlight = true;
      this.setOnlineLeaderboardStatus("Online WR syncing...", "neutral");
      try {
        const rows = await this.fetchOnlineLeaderboardRows();
        this.cacheOnlineLeaderboardRows(rows, true);
        this.applyOnlineLeaderboardRows(rows);
        if (includeLocalSeed && !this.onlineLeaderboardSeededLocalRecords) {
          await this.seedOnlineLeaderboardFromLocalRecords();
          this.onlineLeaderboardSeededLocalRecords = true;
          const refreshedRows = await this.fetchOnlineLeaderboardRows();
          this.cacheOnlineLeaderboardRows(refreshedRows, true);
          this.applyOnlineLeaderboardRows(refreshedRows);
        }
        this.onlineLeaderboardLastSyncAt = Date.now();
        if (this.pruneOwnedUnnamedLeaderboardRecordKeys()) {
          this.savePersistentProgress();
        }
        this.setOnlineLeaderboardStatus("Online WR live", "online");
      } catch {
        this.setOnlineLeaderboardStatus("Online WR unavailable, using local copy", "offline");
      } finally {
        this.onlineLeaderboardSyncInFlight = false;
      }
    }

    startOnlineLeaderboardSync() {
      if (!this.isOnlineLeaderboardConfigured()) {
        this.setOnlineLeaderboardStatus("Local-only WRs (configure Supabase to share)", "offline");
        return;
      }
      this.syncOnlineLeaderboard({ includeLocalSeed: true });
      this.onlineLeaderboardPollTimer = window.setInterval(
        () => this.syncOnlineLeaderboard(),
        this.getOnlineLeaderboardPollIntervalMs()
      );
      this.onlineLeaderboardVisibilityHandler = () => {
        if (!document.hidden) {
          this.syncOnlineLeaderboard();
        }
      };
      document.addEventListener("visibilitychange", this.onlineLeaderboardVisibilityHandler);
    }

    isOnlineCommunityConfigured() {
      return this.isOnlineLeaderboardConfigured() &&
        typeof ONLINE_LEADERBOARD_CONFIG.communityLevelsTableName === "string" &&
        ONLINE_LEADERBOARD_CONFIG.communityLevelsTableName.trim().length > 0 &&
        typeof ONLINE_LEADERBOARD_CONFIG.submitCommunityLevelRpcName === "string" &&
        ONLINE_LEADERBOARD_CONFIG.submitCommunityLevelRpcName.trim().length > 0 &&
        typeof ONLINE_LEADERBOARD_CONFIG.submitCommunityRunRpcName === "string" &&
        ONLINE_LEADERBOARD_CONFIG.submitCommunityRunRpcName.trim().length > 0;
    }

    getOnlineCommunityLevelsFetchUrl() {
      const params = new URLSearchParams({
        select: "level_id,level_name,creator_name,creator_time_ms,level_text,start_angle,leaderboard_json,approved_at",
        order: "approved_at.desc",
      });
      return `${this.getOnlineLeaderboardBaseUrl()}/rest/v1/${ONLINE_LEADERBOARD_CONFIG.communityLevelsTableName}?${params.toString()}`;
    }

    canSyncOnlineMyLevels() {
      return this.isOnlineCommunityConfigured() &&
        typeof ONLINE_LEADERBOARD_CONFIG.communitySubmissionsTableName === "string" &&
        ONLINE_LEADERBOARD_CONFIG.communitySubmissionsTableName.trim().length > 0 &&
        Boolean(normalizeUsername(this.playerUsername));
    }

    getOnlineMyLevelsFetchUrl() {
      const params = new URLSearchParams({
        select: "*",
      });
      const creatorName = normalizeUsername(this.playerUsername);
      if (creatorName) {
        params.set("creator_name", `eq.${creatorName}`);
      }
      return `${this.getOnlineLeaderboardBaseUrl()}/rest/v1/${ONLINE_LEADERBOARD_CONFIG.communitySubmissionsTableName}?${params.toString()}`;
    }

    getOnlineCommunitySubmitUrl() {
      return `${this.getOnlineLeaderboardBaseUrl()}/rest/v1/rpc/${ONLINE_LEADERBOARD_CONFIG.submitCommunityLevelRpcName}`;
    }

    getOnlineCommunityRunSubmitUrl() {
      return `${this.getOnlineLeaderboardBaseUrl()}/rest/v1/rpc/${ONLINE_LEADERBOARD_CONFIG.submitCommunityRunRpcName}`;
    }

    normalizeOnlineCommunityLevelRow(row) {
      const levelText = typeof row?.level_text === "string"
        ? row.level_text
        : Array.isArray(row?.level_text) ? row.level_text.join("\n") : "";
      const parsed = this.parseCustomLevelText(levelText);
      if (parsed.error) {
        return null;
      }
      const name = normalizeCommunityLevelName(row?.level_name);
      if (!name) {
        return null;
      }
      const creator = normalizeUsername(row?.creator_name) || "Player";
      const creatorTime = Number.isFinite(row?.creator_time_ms) ? row.creator_time_ms : null;
      return {
        remoteId: typeof row?.level_id === "string" ? row.level_id : "",
        submissionId: "",
        name,
        creator,
        creatorTime,
        myBestTime: creatorTime,
        startAngle: Number.isFinite(row?.start_angle) ? row.start_angle : parsed.definition.startAngle,
        leaderboard: normalizeCommunityLeaderboard(row?.leaderboard_json, creator, creatorTime),
        map: parsed.definition.map,
        local: false,
        submissionStatus: "published",
        reviewMessage: "",
        createdAt: parseTimestampMs(row?.approved_at),
        updatedAt: parseTimestampMs(row?.approved_at),
      };
    }

    normalizeMyCreatedLevelEntry(entry, fallbackStatus = "private") {
      const levelText = typeof entry?.level_text === "string"
        ? entry.level_text
        : typeof entry?.levelText === "string"
          ? entry.levelText
          : Array.isArray(entry?.map) ? entry.map.join("\n") : "";
      const parsed = this.parseCustomLevelText(levelText);
      if (parsed.error) {
        return null;
      }
      const name = normalizeCommunityLevelName(entry?.level_name ?? entry?.name);
      if (!name) {
        return null;
      }
      const creator = normalizeUsername(entry?.creator_name ?? entry?.creator) || "Player";
      const creatorTime = Number.isFinite(entry?.creator_time_ms)
        ? entry.creator_time_ms
        : Number.isFinite(entry?.creatorTime) ? entry.creatorTime : null;
      const visibility = typeof entry?.visibility === "string" ? entry.visibility.trim().toLowerCase() : "";
      const rawStatus = entry?.submissionStatus ?? entry?.submission_status ?? entry?.review_status ?? entry?.reviewStatus ?? entry?.status;
      let submissionStatus = rawStatus ? normalizeCommunitySubmissionStatus(rawStatus) : normalizeCommunitySubmissionStatus(fallbackStatus);
      if (entry?.approved_at != null || entry?.approvedAt != null || entry?.published_at != null || entry?.publishedAt != null) {
        submissionStatus = "published";
      } else if (entry?.declined_at != null || entry?.declinedAt != null || entry?.denied_at != null || entry?.deniedAt != null) {
        submissionStatus = "declined";
      } else if (visibility === "private" || entry?.isPrivate === true) {
        submissionStatus = "private";
      }
      const remoteIdCandidate = entry?.published_level_id ?? entry?.publishedLevelId ?? entry?.remoteId ?? (submissionStatus === "published" ? entry?.level_id ?? entry?.levelId : "");
      const submissionIdCandidate = entry?.submission_id ?? entry?.submissionId ?? (submissionStatus !== "published" ? entry?.level_id ?? entry?.levelId : "");
      const reviewMessage = String(
        entry?.review_message ??
        entry?.reviewMessage ??
        entry?.admin_message ??
        entry?.adminMessage ??
        entry?.decline_reason ??
        entry?.declineReason ??
        entry?.review_notes ??
        entry?.reviewNotes ??
        ""
      ).trim();
      const myBestTime = Number.isFinite(entry?.my_best_time_ms)
        ? entry.my_best_time_ms
        : Number.isFinite(entry?.myBestTime) ? entry.myBestTime : creatorTime;
      const createdAt = parseTimestampMs(entry?.created_at ?? entry?.createdAt ?? entry?.submitted_at ?? entry?.submittedAt);
      const updatedAt = Math.max(
        createdAt,
        parseTimestampMs(
          entry?.updated_at ??
          entry?.updatedAt ??
          entry?.reviewed_at ??
          entry?.reviewedAt ??
          entry?.approved_at ??
          entry?.approvedAt ??
          entry?.declined_at ??
          entry?.declinedAt
        )
      );
      return {
        remoteId: typeof remoteIdCandidate === "string" ? remoteIdCandidate : "",
        submissionId: typeof submissionIdCandidate === "string" ? submissionIdCandidate : "",
        name,
        creator,
        creatorTime,
        myBestTime,
        startAngle: Number.isFinite(entry?.start_angle) ? entry.start_angle : Number.isFinite(entry?.startAngle) ? entry.startAngle : parsed.definition.startAngle,
        leaderboard: normalizeCommunityLeaderboard(entry?.leaderboard_json ?? entry?.leaderboard, creator, creatorTime),
        map: parsed.definition.map,
        local: Boolean(entry?.local),
        submissionStatus,
        reviewMessage,
        createdAt,
        updatedAt,
      };
    }

    getCommunityLevelSignature(level) {
      const name = normalizeCommunityLevelName(level?.name);
      const creator = normalizeUsername(level?.creator);
      const mapText = Array.isArray(level?.map) ? level.map.join("\n") : "";
      return name && creator && mapText ? `${creator}\n${name}\n${mapText}` : "";
    }

    mergeMyCreatedLevelEntries(current, incoming) {
      const bestCandidates = [current.myBestTime, incoming.myBestTime, current.creatorTime, incoming.creatorTime]
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => a - b);
      const myBestTime = bestCandidates.length > 0 ? bestCandidates[0] : null;
      const creatorTimeCandidates = [current.creatorTime, incoming.creatorTime, myBestTime]
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => a - b);
      const creatorTime = creatorTimeCandidates.length > 0 ? creatorTimeCandidates[0] : null;
      const createdAtCandidates = [current.createdAt, incoming.createdAt].filter((value) => Number.isFinite(value) && value > 0);
      const createdAt = createdAtCandidates.length > 0 ? Math.min(...createdAtCandidates) : 0;
      let submissionStatus = incoming.submissionStatus || current.submissionStatus || "pending";
      if (current.submissionStatus === "published" || incoming.submissionStatus === "published") {
        submissionStatus = "published";
      } else if (incoming.submissionStatus === "declined" || current.submissionStatus === "declined") {
        submissionStatus = "declined";
      } else if (incoming.submissionStatus === "private" || current.submissionStatus === "private") {
        submissionStatus = "private";
      }
      const creator = incoming.creator || current.creator || "Player";
      return {
        ...current,
        ...incoming,
        remoteId: incoming.remoteId || current.remoteId || "",
        submissionId: incoming.submissionId || current.submissionId || "",
        creator,
        creatorTime,
        myBestTime,
        leaderboard: normalizeCommunityLeaderboard(
          [
            ...(Array.isArray(current.leaderboard) ? current.leaderboard : []),
            ...(Array.isArray(incoming.leaderboard) ? incoming.leaderboard : []),
          ],
          creator,
          creatorTime
        ),
        map: Array.isArray(incoming.map) && incoming.map.length > 0 ? incoming.map : current.map,
        startAngle: Number.isFinite(incoming.startAngle) ? incoming.startAngle : current.startAngle,
        local: Boolean(incoming.local || current.local),
        submissionStatus,
        reviewMessage: incoming.reviewMessage || current.reviewMessage || "",
        createdAt,
        updatedAt: Math.max(current.updatedAt || 0, incoming.updatedAt || 0, createdAt),
      };
    }

    upsertMyCreatedLevel(entry, { save = true, fallbackStatus = "private" } = {}) {
      const normalized = this.normalizeMyCreatedLevelEntry(entry, fallbackStatus);
      if (!normalized) {
        return null;
      }
      const signature = this.getCommunityLevelSignature(normalized);
      const nextLevels = [...this.myCreatedLevels];
      const existingIndex = nextLevels.findIndex((candidate) => {
        const normalizedCandidate = this.normalizeMyCreatedLevelEntry(candidate, candidate?.submissionStatus || "private");
        if (!normalizedCandidate) {
          return false;
        }
        return (
          (normalized.submissionId && normalizedCandidate.submissionId === normalized.submissionId) ||
          (normalized.remoteId && normalizedCandidate.remoteId === normalized.remoteId) ||
          (signature && this.getCommunityLevelSignature(normalizedCandidate) === signature)
        );
      });
      if (existingIndex >= 0) {
        nextLevels[existingIndex] = this.mergeMyCreatedLevelEntries(
          this.normalizeMyCreatedLevelEntry(nextLevels[existingIndex], nextLevels[existingIndex]?.submissionStatus || "private") || nextLevels[existingIndex],
          normalized
        );
      } else {
        nextLevels.unshift(normalized);
      }
      this.myCreatedLevels = nextLevels;
      if (save) {
        this.savePersistentProgress();
      }
      return existingIndex >= 0 ? nextLevels[existingIndex] : normalized;
    }

    getMyCreatedLevels() {
      const creatorName = normalizeUsername(this.playerUsername);
      if (!creatorName) {
        return [];
      }
      const mergedLevels = [];
      const byIdentity = new Map();
      const bySignature = new Map();
      const registerLevel = (entry, fallbackStatus) => {
        const normalized = this.normalizeMyCreatedLevelEntry(entry, fallbackStatus);
        if (!normalized || normalized.creator !== creatorName) {
          return;
        }
        const signature = this.getCommunityLevelSignature(normalized);
        let target = null;
        if (normalized.remoteId && byIdentity.has(`remote:${normalized.remoteId}`)) {
          target = byIdentity.get(`remote:${normalized.remoteId}`);
        } else if (normalized.submissionId && byIdentity.has(`submission:${normalized.submissionId}`)) {
          target = byIdentity.get(`submission:${normalized.submissionId}`);
        } else if (signature && bySignature.has(signature)) {
          target = bySignature.get(signature);
        }
        if (target) {
          Object.assign(target, this.mergeMyCreatedLevelEntries(target, normalized));
        } else {
          target = { ...normalized };
          mergedLevels.push(target);
        }
        if (target.remoteId) {
          byIdentity.set(`remote:${target.remoteId}`, target);
        }
        if (target.submissionId) {
          byIdentity.set(`submission:${target.submissionId}`, target);
        }
        if (signature) {
          bySignature.set(signature, target);
        }
      };
      for (const level of this.onlineCommunityLevels) {
        registerLevel(level, "published");
      }
      for (const level of this.localCommunityLevels) {
        registerLevel(level, "private");
      }
      for (const level of this.onlineMyLevels) {
        registerLevel(level, level?.submissionStatus || "pending");
      }
      for (const level of this.myCreatedLevels) {
        registerLevel(level, level?.submissionStatus || "private");
      }
      return mergedLevels.sort((a, b) => (
        (b.updatedAt || 0) - (a.updatedAt || 0) ||
        (b.createdAt || 0) - (a.createdAt || 0) ||
        a.name.localeCompare(b.name)
      ));
    }

    normalizeOnlineMyCreatedLevelRow(row) {
      return this.normalizeMyCreatedLevelEntry(row, "pending");
    }

    applyOnlineMyLevels(rows) {
      this.onlineMyLevels = Array.isArray(rows)
        ? rows
            .map((row) => this.normalizeOnlineMyCreatedLevelRow(row))
            .filter(Boolean)
        : [];
    }

    async fetchOnlineMyLevelRows() {
      const response = await fetch(this.getOnlineMyLevelsFetchUrl(), {
        method: "GET",
        headers: this.getOnlineLeaderboardHeaders(false),
      });
      if (!response.ok) {
        throw new Error(`My levels fetch failed with ${response.status}`);
      }
      const rows = await response.json();
      return Array.isArray(rows) ? rows : [];
    }

    async syncOnlineMyLevels() {
      if (!this.canSyncOnlineMyLevels()) {
        return;
      }
      try {
        const rows = await this.fetchOnlineMyLevelRows();
        this.applyOnlineMyLevels(rows);
      } catch {
        // Keep using cached created levels when the submission feed is unavailable.
      }
    }

    rebuildCommunityLevels() {
      const selectedLevel = this.selectedCommunityLevelIndex != null
        ? this.communityLevels[this.selectedCommunityLevelIndex]
        : null;
      const publishedLocalCommunityLevels = this.localCommunityLevels.filter((level) => (
        normalizeCommunitySubmissionStatus(level?.submissionStatus || "published") === "published"
      ));
      this.communityLevels = [
        ...this.onlineCommunityLevels,
        ...publishedLocalCommunityLevels,
      ];
      this.communityLevelHovers = this.communityLevels.map(() => 0);
      if (selectedLevel) {
        const nextIndex = this.communityLevels.findIndex((level) => (
          (selectedLevel.remoteId && level.remoteId === selectedLevel.remoteId) ||
          (!selectedLevel.remoteId &&
            !level.remoteId &&
            level.local === selectedLevel.local &&
            level.name === selectedLevel.name &&
            level.creator === selectedLevel.creator)
        ));
        this.selectedCommunityLevelIndex = nextIndex >= 0 ? nextIndex : null;
      } else if (this.selectedCommunityLevelIndex != null && !this.communityLevels[this.selectedCommunityLevelIndex]) {
        this.selectedCommunityLevelIndex = null;
      }
    }

    purgeBogusDriftyAdminLevels({ save = true } = {}) {
      const bogusSignatures = new Set(
        this.localCommunityLevels
          .filter((level) => (
            Boolean(level?.local) &&
            !level?.remoteId &&
            normalizeCommunitySubmissionStatus(level?.submissionStatus || "") === "published"
          ))
          .map((level) => this.getCommunityLevelSignature(level))
          .filter(Boolean)
      );
      let changed = false;

      if (bogusSignatures.size > 0) {
        this.localCommunityLevels = this.localCommunityLevels.filter((level) => {
          const signature = this.getCommunityLevelSignature(level);
          const remove = Boolean(signature) && bogusSignatures.has(signature);
          changed = changed || remove;
          return !remove;
        });
      }

      this.myCreatedLevels = this.myCreatedLevels.map((level) => {
        const signature = this.getCommunityLevelSignature(level);
        const shouldDemote = Boolean(signature) &&
          bogusSignatures.has(signature) &&
          Boolean(level?.local) &&
          !level?.remoteId &&
          normalizeCommunitySubmissionStatus(level?.submissionStatus || "") === "published";
        if (!shouldDemote) {
          return level;
        }
        changed = true;
        return {
          ...level,
          submissionStatus: "private",
          updatedAt: Date.now(),
        };
      });

      if (changed) {
        this.rebuildCommunityLevels();
        if (save) {
          this.savePersistentProgress();
        }
      }
      return changed;
    }

    applyOnlineCommunityLevels(rows) {
      const remoteLevels = Array.isArray(rows)
        ? rows
            .map((row) => this.normalizeOnlineCommunityLevelRow(row))
            .filter(Boolean)
        : [];
      this.onlineCommunityLevels = remoteLevels;
      this.rebuildCommunityLevels();
    }

    applyOnlineCommunityLevelRow(row) {
      const normalized = this.normalizeOnlineCommunityLevelRow(row);
      if (!normalized || !normalized.remoteId) {
        return;
      }
      const nextRemoteLevels = [...this.onlineCommunityLevels];
      const existingIndex = nextRemoteLevels.findIndex((level) => level.remoteId === normalized.remoteId);
      if (existingIndex >= 0) {
        nextRemoteLevels[existingIndex] = normalized;
      } else {
        nextRemoteLevels.unshift(normalized);
      }
      this.onlineCommunityLevels = nextRemoteLevels;
      this.rebuildCommunityLevels();
    }

    async fetchOnlineCommunityLevelRows() {
      const response = await fetch(this.getOnlineCommunityLevelsFetchUrl(), {
        method: "GET",
        headers: this.getOnlineLeaderboardHeaders(false),
      });
      if (!response.ok) {
        throw new Error(`Community fetch failed with ${response.status}`);
      }
      const rows = await response.json();
      return Array.isArray(rows) ? rows : [];
    }

    async syncOnlineCommunityLevels() {
      if (!this.isOnlineCommunityConfigured() || this.onlineCommunitySyncInFlight) {
        return;
      }
      this.onlineCommunitySyncInFlight = true;
      try {
        const rows = await this.fetchOnlineCommunityLevelRows();
        this.applyOnlineCommunityLevels(rows);
        this.onlineCommunityLastSyncAt = Date.now();
      } catch {
        // Keep using cached/local community levels when the online feed is unavailable.
      } finally {
        this.onlineCommunitySyncInFlight = false;
      }
    }

    startOnlineCommunitySync() {
      if (!this.isOnlineCommunityConfigured()) {
        return;
      }
      this.syncOnlineCommunityLevels();
      this.onlineCommunityPollTimer = window.setInterval(
        () => this.syncOnlineCommunityLevels(),
        Math.max(this.getOnlineLeaderboardPollIntervalMs(), 20000)
      );
    }

    async submitCommunityLevelForReview(level) {
      if (!this.isOnlineCommunityConfigured()) {
        return null;
      }
      const response = await fetch(this.getOnlineCommunitySubmitUrl(), {
        method: "POST",
        headers: this.getOnlineLeaderboardHeaders(true),
        body: JSON.stringify({
          p_level_name: level.name,
          p_creator_name: level.creator,
          p_creator_time_ms: level.bestTime,
          p_level_text: Array.isArray(level.map) ? level.map.join("\n") : "",
          p_start_angle: Number.isFinite(level.startAngle) ? level.startAngle : 0,
        }),
      });
      if (!response.ok) {
        throw new Error(`Community submit failed with ${response.status}`);
      }
      const payload = await response.json();
      return Array.isArray(payload) ? payload[0] : payload;
    }

    async submitOnlineCommunityLevelRun(levelId, playerName, time) {
      if (!this.isOnlineCommunityConfigured() || !levelId || !Number.isFinite(time)) {
        return null;
      }
      const response = await fetch(this.getOnlineCommunityRunSubmitUrl(), {
        method: "POST",
        headers: this.getOnlineLeaderboardHeaders(true),
        body: JSON.stringify({
          p_level_id: levelId,
          p_player_name: playerName,
          p_time_ms: time,
        }),
      });
      if (!response.ok) {
        throw new Error(`Community run submit failed with ${response.status}`);
      }
      const payload = await response.json();
      const row = Array.isArray(payload) ? payload[0] : payload;
      if (row && typeof row === "object") {
        this.applyOnlineCommunityLevelRow(row);
      }
      return row;
    }

    resolveColorRgb(color) {
      if (!color) {
        return { r: 144, g: 144, b: 144 };
      }
      if (typeof color === "string" && color.startsWith("#")) {
        return hexToRgb(color);
      }
      if (!this.colorParserCtx) {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        this.colorParserCtx = canvas.getContext("2d");
      }
      this.colorParserCtx.fillStyle = "#000000";
      this.colorParserCtx.fillStyle = color;
      const normalized = this.colorParserCtx.fillStyle;
      if (normalized.startsWith("#")) {
        return hexToRgb(normalized);
      }
      const match = normalized.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        return {
          r: Number.parseInt(match[1], 10),
          g: Number.parseInt(match[2], 10),
          b: Number.parseInt(match[3], 10),
        };
      }
      return { r: 144, g: 144, b: 144 };
    }

    getTintedCarSprite(variantId, color) {
      const variant = this.getCarVariantDefinition(variantId);
      if (!variant.sprite || !this.carSpriteSheet || !this.carSpriteSheet.complete || !this.carSpriteSheet.naturalWidth) {
        return null;
      }

      const cacheKey = `${variant.id}|${String(color).toLowerCase()}`;
      const cached = this.tintedCarSpriteCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const { x, y, w, h } = variant.sprite;
      const baseCanvas = document.createElement("canvas");
      baseCanvas.width = w;
      baseCanvas.height = h;
      const baseCtx = baseCanvas.getContext("2d");
      baseCtx.imageSmoothingEnabled = true;
      baseCtx.imageSmoothingQuality = "high";
      baseCtx.drawImage(this.carSpriteSheet, x, y, w, h, 0, 0, w, h);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      const target = this.resolveColorRgb(color);

      const hasMask = this.carPaintMaskSheet && this.carPaintMaskSheet.complete && this.carPaintMaskSheet.naturalWidth;
      if (hasMask) {
        const maskCanvas = document.createElement("canvas");
        maskCanvas.width = w;
        maskCanvas.height = h;
        const maskCtx = maskCanvas.getContext("2d");
        maskCtx.imageSmoothingEnabled = true;
        maskCtx.imageSmoothingQuality = "high";
        maskCtx.drawImage(this.carPaintMaskSheet, x, y, w, h, 0, 0, w, h);
        const paintCanvas = document.createElement("canvas");
        paintCanvas.width = w;
        paintCanvas.height = h;
        const paintCtx = paintCanvas.getContext("2d");
        paintCtx.imageSmoothingEnabled = true;
        paintCtx.imageSmoothingQuality = "high";

        // First lock the layer to the mask's own alpha so the color never fills the whole sprite box.
        paintCtx.drawImage(maskCanvas, 0, 0);
        paintCtx.globalCompositeOperation = "source-in";
        paintCtx.fillStyle = `rgb(${target.r}, ${target.g}, ${target.b})`;
        paintCtx.fillRect(0, 0, w, h);

        // Reapply the mask artwork for gentle white-panel shading/highlights.
        paintCtx.globalCompositeOperation = "multiply";
        paintCtx.globalAlpha = 1;
        paintCtx.drawImage(maskCanvas, 0, 0);
        paintCtx.globalCompositeOperation = "screen";
        paintCtx.globalAlpha = 0.18;
        paintCtx.drawImage(maskCanvas, 0, 0);

        // Clamp back to the sprite's actual paint alpha one more time.
        paintCtx.globalCompositeOperation = "destination-in";
        paintCtx.globalAlpha = 1;
        paintCtx.drawImage(maskCanvas, 0, 0);

        ctx.drawImage(paintCanvas, 0, 0);
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.drawImage(baseCanvas, 0, 0);
      this.cleanCarSpritePixels(canvas);

      this.tintedCarSpriteCache.set(cacheKey, canvas);
      return canvas;
    }

    cleanCarSpritePixels(canvas) {
      const ctx = canvas.getContext("2d");
      let imageData;
      try {
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch (error) {
        return;
      }

      const { data, width, height } = imageData;
      const alpha = new Uint8Array(width * height);
      for (let index = 0; index < alpha.length; index += 1) {
        alpha[index] = data[index * 4 + 3];
      }

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const index = y * width + x;
          const currentAlpha = alpha[index];
          if (currentAlpha <= 10) {
            data[index * 4] = 0;
            data[index * 4 + 1] = 0;
            data[index * 4 + 2] = 0;
            data[index * 4 + 3] = 0;
            continue;
          }

          let visibleNeighbors = 0;
          let solidNeighbors = 0;
          for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
            for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
              if (offsetX === 0 && offsetY === 0) {
                continue;
              }
              const neighborX = x + offsetX;
              const neighborY = y + offsetY;
              if (neighborX < 0 || neighborY < 0 || neighborX >= width || neighborY >= height) {
                continue;
              }
              const neighborAlpha = alpha[neighborY * width + neighborX];
              if (neighborAlpha > 12) {
                visibleNeighbors += 1;
              }
              if (neighborAlpha > 48) {
                solidNeighbors += 1;
              }
            }
          }

          if (visibleNeighbors <= 1 || (currentAlpha < 72 && solidNeighbors <= 1)) {
            data[index * 4] = 0;
            data[index * 4 + 1] = 0;
            data[index * 4 + 2] = 0;
            data[index * 4 + 3] = 0;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }

    drawSpriteCar(ctx, palette = {}, variantId = "coupe") {
      const variant = this.getCarVariantDefinition(variantId);
      const spriteCanvas = this.getTintedCarSprite(variant.id, palette.bodyColor || "#909090");
      if (!spriteCanvas || !variant.sprite) {
        return false;
      }

      ctx.save();
      ctx.rotate(-Math.PI * 0.5);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        spriteCanvas,
        -variant.sprite.renderWidth * 0.5,
        -variant.sprite.renderHeight * 0.5,
        variant.sprite.renderWidth,
        variant.sprite.renderHeight
      );
      ctx.restore();
      return true;
    }

    getTwoPlayerCarSetting(playerId) {
      const fallback = playerId === "blue"
        ? { color: "#4f89ff", variant: "roadster" }
        : { color: "#ea4d4d", variant: "muscle" };
      const setting = this.twoPlayerCarSettings?.[playerId] || fallback;
      return {
        color: isValidHexColor(setting.color) ? setting.color : fallback.color,
        variant: CAR_VARIANTS.some((variant) => variant.id === setting.variant) ? setting.variant : fallback.variant,
      };
    }

    createTagPlayers() {
      const redCar = this.getTwoPlayerCarSetting("red");
      const blueCar = this.getTwoPlayerCarSetting("blue");
      return [
        {
          id: "red",
          label: "Player 1",
          color: redCar.color,
          variant: redCar.variant,
          controls: CONTROL_SCHEMES.red,
          accent: "#ffb1b1",
          car: new Car(),
          taggedTime: 0,
          isIt: false,
          spawnX: 0,
          spawnY: 0,
          spawnAngle: 0,
          totalDamage: 0,
          skidMarks: [],
          skidEmitTimer: 0,
          lastSkidLeft: null,
          lastSkidRight: null,
          damageSmoke: [],
          damageFire: [],
          explosionParticles: [],
            smokeEmitTimer: 0,
            fireEmitTimer: 0,
            fireSequenceTimer: 0,
            explosionTimer: 0,
            exploding: false,
            wallTouching: false,
            wallTouchingThisFrame: false,
            touchJoystick: createTouchJoystickState({
              ringColor: "255, 186, 186",
              glowColor: "255, 132, 132",
              knobFillColor: "255, 215, 215",
              knobStrokeColor: "255, 242, 242",
              stemColor: "255, 238, 238",
            }),
          },
          {
            id: "blue",
          label: "Player 2",
          color: blueCar.color,
          variant: blueCar.variant,
          controls: CONTROL_SCHEMES.blue,
          accent: "#b6d2ff",
          car: new Car(),
          taggedTime: 0,
          isIt: false,
          spawnX: 0,
          spawnY: 0,
          spawnAngle: 0,
          totalDamage: 0,
          skidMarks: [],
          skidEmitTimer: 0,
          lastSkidLeft: null,
          lastSkidRight: null,
          damageSmoke: [],
          damageFire: [],
          explosionParticles: [],
            smokeEmitTimer: 0,
            fireEmitTimer: 0,
            fireSequenceTimer: 0,
            explosionTimer: 0,
            exploding: false,
            wallTouching: false,
            wallTouchingThisFrame: false,
            touchJoystick: createTouchJoystickState({
              ringColor: "180, 208, 255",
              glowColor: "110, 160, 255",
              knobFillColor: "217, 231, 255",
              knobStrokeColor: "244, 249, 255",
              stemColor: "234, 244, 255",
            }),
          },
        ];
      }

    getScreenFitScale(baseWidth, baseHeight, minimum = 0.48) {
      return clamp(Math.min(this.width / baseWidth, this.height / baseHeight), minimum, 1);
    }

    getMenuScale(buttonCount) {
      const verticalBase = buttonCount > 3 ? 560 : 500;
      return this.getScreenFitScale(430, verticalBase, 0.54);
    }

    getMenuHeaderMetrics(buttonCount, titleBaseSize) {
      const scale = this.getMenuScale(buttonCount);
      const titleY = Math.max(48, Math.round(this.height * 0.18));
      const titleSize = Math.max(30, Math.round(titleBaseSize * scale));
      const subtitleSize = Math.max(12, Math.round(18 * scale));
      const subtitleY = titleY + Math.round(42 * scale);
      return {
        scale,
        titleY,
        titleSize,
        subtitleSize,
        subtitleY,
        bottomY: subtitleY + Math.round(24 * scale),
      };
    }

    getStackedMenuButtons(sourceButtons, titleBaseSize = 72) {
      const header = this.getMenuHeaderMetrics(sourceButtons.length, titleBaseSize);
      const { scale } = header;
      const margin = Math.max(12, Math.round(24 * scale));
      const width = Math.min(Math.round(280 * scale), this.width - margin * 2);
      const height = Math.max(42, Math.round(64 * scale));
      const gap = Math.max(8, Math.round(18 * scale));
      const stackHeight = sourceButtons.length * height + Math.max(0, sourceButtons.length - 1) * gap;
      const latestStartY = Math.max(margin, this.height - margin - stackHeight);
      const desiredStartY = Math.max(header.bottomY + Math.round(22 * scale), this.height * 0.4);
      const startY = Math.round(Math.min(desiredStartY, latestStartY));
      const x = Math.round(this.width * 0.5 - width * 0.5);
      return sourceButtons.map((button, index) => ({
        ...button,
        x,
        y: startY + index * (height + gap),
        w: width,
        h: height,
        fontSize: Math.max(14, Math.round(24 * scale)),
        radius: Math.max(10, Math.round(14 * scale)),
      }));
    }

    getTitleButtons() {
      return this.getStackedMenuButtons(this.titleButtons, 72);
    }

    getTitleOnlineButton() {
      const buttons = this.getTitleButtons();
      const firstButton = buttons[0];
      if (!firstButton) {
        return { id: "online", label: "Online", x: 0, y: 0, w: 0, h: 0, fontSize: 14, radius: 12 };
      }

      const scale = this.getMenuScale(this.titleButtons.length);
      const margin = Math.max(12, Math.round(24 * scale));
      const gap = Math.max(12, Math.round(22 * scale));
      const leftSpace = firstButton.x - margin - gap;
      const canFitLeft = leftSpace >= Math.round(138 * scale);
      const width = canFitLeft ? Math.min(Math.round(176 * scale), leftSpace) : Math.min(firstButton.w, this.width - margin * 2);
      const height = Math.max(42, Math.round(58 * scale));
      return {
        id: "online",
        label: "Online",
        x: canFitLeft ? firstButton.x - gap - width : Math.round(this.width * 0.5 - width * 0.5),
        y: canFitLeft ? firstButton.y : Math.max(margin, firstButton.y - gap - height),
        w: width,
        h: height,
        fontSize: Math.max(14, Math.round(22 * scale)),
        radius: Math.max(10, Math.round(14 * scale)),
        hover: this.titleOnlineHover,
      };
    }

    hasUnnamedOwnedLeaderboardRecords() {
      const ownedKeys = new Set(this.ownedUnnamedLeaderboardRecordKeys);
      if (ownedKeys.size === 0) {
        return false;
      }
      if (this.onlineLeaderboardLastSyncAt <= 0) {
        return false;
      }
      return this.getTrackedOnlineLeaderboardRecords().some((record) => this.isOwnedUnnamedLeaderboardRecord(record, ownedKeys));
    }

    canShowLeaderboardNameUpdateButton() {
      return false;
    }

    getOwnedUnnamedLeaderboardRecords() {
      const ownedKeys = new Set(this.ownedUnnamedLeaderboardRecordKeys);
      if (ownedKeys.size === 0) {
        return [];
      }
      return this.getTrackedOnlineLeaderboardRecords().filter((record) => this.isOwnedUnnamedLeaderboardRecord(record, ownedKeys));
    }

    pruneOwnedUnnamedLeaderboardRecordKeys() {
      const ownedKeys = new Set(this.ownedUnnamedLeaderboardRecordKeys);
      if (ownedKeys.size === 0) {
        return false;
      }

      const validKeys = new Set(
        this.getTrackedOnlineLeaderboardRecords()
          .filter((record) => this.isOwnedUnnamedLeaderboardRecord(record, ownedKeys))
          .map((record) => this.getOnlineLeaderboardRecordKey(record.scope, record.levelIndex))
      );
      const nextKeys = this.ownedUnnamedLeaderboardRecordKeys.filter((key) => validKeys.has(key));
      const changed = nextKeys.length !== this.ownedUnnamedLeaderboardRecordKeys.length ||
        nextKeys.some((key, index) => key !== this.ownedUnnamedLeaderboardRecordKeys[index]);
      this.ownedUnnamedLeaderboardRecordKeys = nextKeys;
      return changed;
    }

    doLeaderboardEntriesMatchForOwnership(localEntry, onlineEntry) {
      const normalizedLocal = this.normalizeWorldRecordEntry(localEntry);
      const normalizedOnline = this.normalizeWorldRecordEntry(onlineEntry);
      return normalizedLocal.time != null &&
        normalizedOnline.time != null &&
        timesMatchForOwnership(normalizedLocal.time, normalizedOnline.time) &&
        normalizedLocal.carVariant === normalizedOnline.carVariant &&
        normalizedLocal.carColor === normalizedOnline.carColor &&
        normalizedLocal.deaths === normalizedOnline.deaths;
    }

    isOwnedUnnamedLeaderboardRecord(record, ownedKeys = new Set(this.ownedUnnamedLeaderboardRecordKeys)) {
      const recordKey = this.getOnlineLeaderboardRecordKey(record.scope, record.levelIndex);
      const onlineRow = this.onlineLeaderboardRowsByKey.get(recordKey);
      if (
        !ownedKeys.has(recordKey) ||
        !onlineRow ||
        hasRealLeaderboardName(record.entry.playerName) ||
        hasRealLeaderboardName(onlineRow.entry.playerName)
      ) {
        return false;
      }
      return this.doLeaderboardEntriesMatchForOwnership(record.entry, onlineRow.entry);
    }

    getDisplayedLeaderboardEntry(scope, levelIndex = null, fallbackEntry = null) {
      if (this.selectedLeaderboardPeriod === "all_time") {
        return this.normalizeWorldRecordEntry(fallbackEntry);
      }
      const periodKey = this.getLeaderboardPeriodKey(this.selectedLeaderboardPeriod);
      const recordKey = this.getOnlineLeaderboardRecordKey(scope, levelIndex, this.selectedLeaderboardPeriod, periodKey);
      const row = this.onlineLeaderboardRowsByKey.get(recordKey);
      return this.normalizeWorldRecordEntry(row?.entry);
    }

    getLeaderboardEntryForPeriod(scope, levelIndex = null, period = "all_time") {
      const periodKey = this.getLeaderboardPeriodKey(period);
      const recordKey = this.getOnlineLeaderboardRecordKey(scope, levelIndex, period, periodKey);
      const row = this.onlineLeaderboardRowsByKey.get(recordKey);
      return this.normalizeWorldRecordEntry(row?.entry);
    }

    getCompletionRecordPeriod(scope, levelIndex, time) {
      if (
        !this.isOnlineLeaderboardConfigured() ||
        this.onlineLeaderboardLastSyncAt <= 0 ||
        !scope ||
        !Number.isFinite(time)
      ) {
        return null;
      }
      const dailyRecord = this.getLeaderboardEntryForPeriod(scope, levelIndex, "daily");
      if (dailyRecord.time == null || time < dailyRecord.time) {
        return "daily";
      }
      const weeklyRecord = this.getLeaderboardEntryForPeriod(scope, levelIndex, "weekly");
      if (weeklyRecord.time == null || time < weeklyRecord.time) {
        return "weekly";
      }
      return null;
    }

    getDisplayedLevelLeaderboardRecords(baseScope, fallbackRecords) {
      return LEVELS.map((_, index) => {
        const scope = this.getVersionedLevelScope(baseScope, index);
        return this.getDisplayedLeaderboardEntry(scope, index, fallbackRecords[index]);
      });
    }

    getDisplayedSpeedrunLeaderboardRecord(baseScope, fallbackEntry) {
      return this.getDisplayedLeaderboardEntry(this.getVersionedSpeedrunScope(baseScope), null, fallbackEntry);
    }

    getTitleUsernameLayout() {
      const buttons = this.getTitleButtons();
      const firstButton = buttons[0];
      const lastButton = buttons[buttons.length - 1];
      if (!firstButton || !lastButton) {
        return { visible: false, x: 0, y: 0, w: 0, h: 0, input: { x: 0, y: 0, w: 0, h: 0 }, fontSize: 12 };
      }

      const scale = this.getMenuScale(this.titleButtons.length);
      const margin = Math.max(12, Math.round(24 * scale));
      const gap = Math.max(12, Math.round(22 * scale));
      const rightSpace = this.width - (firstButton.x + firstButton.w) - margin - gap;
      const canFitRight = rightSpace >= Math.round(150 * scale);
      const showUpdateButton = this.canShowLeaderboardNameUpdateButton();
      const showAuthButtons = !this.signedInUsername;
      const showLogoutButton = !!this.signedInUsername;
      const panelHeightUnits = showUpdateButton
        ? (showAuthButtons ? 192 : showLogoutButton ? 196 : 156)
        : (showAuthButtons ? 154 : showLogoutButton ? 158 : 122);
      const panelW = canFitRight
        ? Math.min(Math.round(220 * scale), rightSpace)
        : Math.min(firstButton.w, this.width - margin * 2);
      const panelH = Math.max(108, Math.round(panelHeightUnits * scale));
      const panelX = canFitRight
        ? firstButton.x + firstButton.w + gap
        : Math.round(this.width * 0.5 - panelW * 0.5);
      const panelY = canFitRight
        ? firstButton.y
        : Math.min(this.height - margin - panelH, lastButton.y + lastButton.h + gap);
      const inputPad = Math.max(12, Math.round(16 * scale));
      const inputH = Math.max(32, Math.round(42 * scale));
      const buttonH = Math.max(30, Math.round(36 * scale));
      const buttonGap = Math.max(8, Math.round(10 * scale));
      const authButtonH = Math.max(26, Math.round(32 * scale));
      const statusH = Math.max(14, Math.round(18 * scale));
      const inputY = Math.round(panelY + Math.round(42 * scale));
      const buttonY = Math.round(inputY + inputH + buttonGap);
      const authY = Math.round(panelY + panelH - inputPad - authButtonH - statusH - Math.round(4 * scale));
      const authGap = Math.max(6, Math.round(8 * scale));
      const authW = Math.round((panelW - inputPad * 2 - authGap) * 0.5);
      const statusY = showAuthButtons
        ? Math.round(authY + authButtonH + Math.round(10 * scale))
        : Math.round(inputY + inputH + Math.round(10 * scale));
      const logoutY = Math.round(statusY + statusH + Math.round(10 * scale));

      return {
        visible: panelY >= margin,
        x: Math.round(panelX),
        y: Math.round(panelY),
        w: Math.round(panelW),
        h: Math.round(panelH),
        radius: Math.max(10, Math.round(14 * scale)),
        fontSize: Math.max(13, Math.round(17 * scale)),
        input: {
          x: Math.round(panelX + inputPad),
          y: inputY,
          w: Math.round(panelW - inputPad * 2),
          h: Math.round(inputH),
        },
        updateButton: {
          visible: showUpdateButton,
          x: Math.round(panelX + inputPad),
          y: buttonY,
          w: Math.round(panelW - inputPad * 2),
          h: Math.round(buttonH),
          fontSize: Math.max(11, Math.round(15 * scale)),
        },
        authButtons: [
          ...(showAuthButtons
            ? [
                {
                  id: "login",
                  label: "Log In",
                  visible: true,
                  x: Math.round(panelX + inputPad),
                  y: authY,
                  w: authW,
                  h: authButtonH,
                  fontSize: Math.max(10, Math.round(13 * scale)),
                },
                {
                  id: "signup",
                  label: "Sign Up",
                  visible: true,
                  x: Math.round(panelX + inputPad + authW + authGap),
                  y: authY,
                  w: authW,
                  h: authButtonH,
                  fontSize: Math.max(10, Math.round(13 * scale)),
                },
              ]
            : []),
          ...(showLogoutButton
            ? [
                {
                  id: "logout",
                  label: "Log Out",
                  visible: true,
                  x: Math.round(panelX + inputPad),
                  y: logoutY,
                  w: Math.round(panelW - inputPad * 2),
                  h: authButtonH,
                  fontSize: Math.max(10, Math.round(13 * scale)),
                },
              ]
            : []),
        ],
        authStatus: {
          x: Math.round(panelX + inputPad),
          y: statusY,
          w: Math.round(panelW - inputPad * 2),
          h: statusH,
          fontSize: Math.max(9, Math.round(11 * scale)),
        },
      };
    }

    getTwoPlayerButtons() {
      return this.getStackedMenuButtons(this.twoPlayerButtons, 60);
    }

    getLeaderboardButtons() {
      return this.leaderboardButtons.map((button) => ({
        ...button,
        x: 24,
        y: 20,
        w: 104,
        h: 38,
        fontSize: 18,
        radius: 12,
      }));
    }

    getLeaderboardPeriodTabs() {
      const scale = this.getScreenFitScale(980, 720, 0.62);
      const gap = Math.max(8, Math.round(12 * scale));
      const height = Math.max(34, Math.round(42 * scale));
      const width = Math.max(84, Math.round(132 * scale));
      const totalWidth = width * LEADERBOARD_PERIODS.length + gap * (LEADERBOARD_PERIODS.length - 1);
      const startX = Math.round(this.width * 0.5 - totalWidth * 0.5);
      const y = Math.round(this.height * 0.22);
      return LEADERBOARD_PERIODS.map((period, index) => ({
        id: period.id,
        label: period.label,
        x: startX + index * (width + gap),
        y,
        w: width,
        h: height,
        fontSize: Math.max(13, Math.round(16 * scale)),
        radius: Math.max(10, Math.round(12 * scale)),
        hover: this.leaderboardPeriodTabHovers[period.id] || 0,
        active: this.selectedLeaderboardPeriod === period.id,
      }));
    }

    getOnlineBackButton() {
      return {
        id: "back",
        label: "Back",
        x: 24,
        y: 20,
        w: 104,
        h: 38,
        fontSize: 18,
        radius: 12,
        hover: this.onlineBackHover,
      };
    }

    getOnlineMenuButtons() {
      const scale = this.getScreenFitScale(760, 540, 0.54);
      const gap = Math.max(12, Math.round(22 * scale));
      const width = Math.min(Math.round(320 * scale), this.width - 48);
      const height = Math.max(50, Math.round(72 * scale));
      const startY = Math.round(this.height * 0.42);
      const x = Math.round(this.width * 0.5 - width * 0.5);
      return [
        {
          id: "community",
          label: "Community Levels",
          x,
          y: startY,
          w: width,
          h: height,
          fontSize: Math.max(16, Math.round(24 * scale)),
          radius: Math.max(10, Math.round(14 * scale)),
          hover: this.onlineCommunityHover,
        },
        {
          id: "create",
          label: "My Levels",
          x,
          y: startY + height + gap,
          w: width,
          h: height,
          fontSize: Math.max(16, Math.round(24 * scale)),
          radius: Math.max(10, Math.round(14 * scale)),
          hover: this.onlineCreateHover,
        },
        {
          id: "leaderboard",
          label: "Leaderboard",
          x,
          y: startY + (height + gap) * 2,
          w: width,
          h: height,
          fontSize: Math.max(16, Math.round(24 * scale)),
          radius: Math.max(10, Math.round(14 * scale)),
          hover: this.onlineLeaderboardHover,
        },
      ];
    }

    isScrollableOnlineListScreen(screen = this.currentScreen) {
      return screen === "community_levels" || screen === "my_levels";
    }

    getOnlineLevelListMetrics(screen = this.currentScreen) {
      if (screen === "community_levels") {
        const scale = this.getScreenFitScale(860, 700, 0.6);
        const margin = Math.max(8, Math.round(12 * scale));
        const searchH = Math.max(34, Math.round(42 * scale));
        const searchGap = Math.max(12, Math.round(16 * scale));
        const searchTop = Math.max(148, Math.round(this.height * 0.215));
        const cardW = Math.min(Math.round(880 * scale), this.width - margin * 2);
        const cardH = Math.max(58, Math.round(78 * scale));
        const gap = Math.max(8, Math.round(12 * scale));
        const startY = searchTop + searchH + searchGap;
        const x = Math.round(this.width * 0.5 - cardW * 0.5);
        const viewportTop = startY - Math.max(16, Math.round(18 * scale));
        const viewportBottom = this.height - Math.max(8, Math.round(12 * scale));
        const hoverOverflowPadX = Math.max(26, Math.round(30 * scale));
        const hoverOverflowPadY = Math.max(16, Math.round(18 * scale));
        const bottomContentPad = Math.max(hoverOverflowPadY, Math.round(cardH * 0.28));
        return {
          screen,
          scale,
          margin,
          cardW,
          cardH,
          gap,
          searchTop,
          searchH,
          searchGap,
          startY,
          x,
          viewportTop,
          viewportBottom,
          hoverOverflowPadX,
          hoverOverflowPadY,
          bottomContentPad,
        };
      }
      if (screen === "my_levels") {
        const scale = this.getScreenFitScale(820, 680, 0.56);
        const margin = Math.max(16, Math.round(28 * scale));
        const cardW = Math.min(Math.round(820 * scale), this.width - margin * 2);
        const cardH = Math.max(72, Math.round(92 * scale));
        const gap = Math.max(8, Math.round(12 * scale));
        const startY = Math.max(134, Math.round(this.height * 0.23));
        const x = Math.round(this.width * 0.5 - cardW * 0.5);
        const viewportTop = startY - Math.max(10, Math.round(10 * scale));
        const viewportBottom = this.height - Math.max(18, Math.round(26 * scale));
        return {
          screen,
          scale,
          margin,
          cardW,
          cardH,
          gap,
          startY,
          x,
          viewportTop,
          viewportBottom,
        };
      }
      return null;
    }

    getCommunitySearchLayout() {
      const metrics = this.getOnlineLevelListMetrics("community_levels");
      if (!metrics) {
        return null;
      }
      return {
        x: metrics.x,
        y: metrics.searchTop,
        w: metrics.cardW,
        h: metrics.searchH,
        fontSize: Math.max(13, Math.round(metrics.searchH * 0.42)),
      };
    }

    getOnlineLevelListScrollY(screen = this.currentScreen) {
      return screen === "my_levels" ? this.myLevelsScrollY : this.communityLevelsScrollY;
    }

    getOnlineLevelListCount(screen = this.currentScreen) {
      if (screen === "community_levels") {
        return this.getRankedCommunityLevels().length;
      }
      if (screen === "my_levels") {
        return this.getMyCreatedLevels().length;
      }
      return 0;
    }

    getOnlineLevelListMaxScroll(screen = this.currentScreen) {
      const metrics = this.getOnlineLevelListMetrics(screen);
      if (!metrics) {
        return 0;
      }
      const count = this.getOnlineLevelListCount(screen);
      const contentHeight = count > 0
        ? count * metrics.cardH + Math.max(0, count - 1) * metrics.gap + (metrics.bottomContentPad || 0)
        : 0;
      const viewportHeight = Math.max(0, metrics.viewportBottom - metrics.viewportTop);
      return Math.max(0, contentHeight - viewportHeight);
    }

    setOnlineLevelListScrollY(value, screen = this.currentScreen) {
      const clamped = clamp(value, 0, this.getOnlineLevelListMaxScroll(screen));
      if (screen === "my_levels") {
        this.myLevelsScrollY = clamped;
      } else if (screen === "community_levels") {
        this.communityLevelsScrollY = clamped;
      }
      return clamped;
    }

    scrollOnlineLevelListBy(deltaY, screen = this.currentScreen) {
      const previous = this.getOnlineLevelListScrollY(screen);
      const next = this.setOnlineLevelListScrollY(previous + deltaY, screen);
      if (Math.abs(next - previous) > 0.001) {
        this.refreshOnlineHover();
        return true;
      }
      return false;
    }

    clampOnlineLevelListScroll(screen = this.currentScreen) {
      const current = this.getOnlineLevelListScrollY(screen);
      return this.setOnlineLevelListScrollY(current, screen);
    }

    isPointInsideOnlineLevelListViewport(x, y, screen = this.currentScreen) {
      const metrics = this.getOnlineLevelListMetrics(screen);
      if (!metrics) {
        return false;
      }
      return x >= metrics.x &&
        x <= metrics.x + metrics.cardW &&
        y >= metrics.viewportTop &&
        y <= metrics.viewportBottom;
    }

    getCommunityLevelCards() {
      const metrics = this.getOnlineLevelListMetrics("community_levels");
      const { scale, cardW, cardH, gap, startY, x } = metrics;
      const scrollY = this.getOnlineLevelListScrollY("community_levels");
      return this.getRankedCommunityLevels().map((entry, index) => ({
        ...entry.level,
        index: entry.index,
        matchScore: entry.score,
        displayCreator: getCommunityLevelDisplayCreator(entry.level),
        x,
        y: startY + index * (cardH + gap) - scrollY,
        w: cardW,
        h: cardH,
        fontSize: Math.max(14, Math.round(20 * scale)),
        smallFontSize: Math.max(11, Math.round(14 * scale)),
        radius: Math.max(10, Math.round(14 * scale)),
      }));
    }

    getRankedCommunityLevels() {
      const query = String(this.communityLevelSearchText ?? "").trim().toLowerCase();
      const levels = this.communityLevels.map((level, index) => ({
        level,
        index,
        score: query ? this.getCommunityLevelSearchScore(level.name, query) : 0,
      }));
      if (!query) {
        return levels;
      }
      return levels.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.index - b.index;
      });
    }

    getCommunityLevelSearchScore(name, query) {
      const normalizedName = String(name ?? "").toLowerCase().replace(/\s+/g, " ").trim();
      const normalizedQuery = String(query ?? "").toLowerCase().replace(/\s+/g, " ").trim();
      if (!normalizedName || !normalizedQuery) {
        return 0;
      }

      const compactName = normalizedName.replace(/\s+/g, "");
      const compactQuery = normalizedQuery.replace(/\s+/g, "");
      const words = normalizedName.split(" ").filter(Boolean);
      const queryWords = normalizedQuery.split(" ").filter(Boolean);
      let score = 0;

      if (normalizedName === normalizedQuery) {
        score += 100000;
      }
      if (normalizedName.startsWith(normalizedQuery)) {
        score += 60000;
      }

      const firstWordIndex = words.findIndex((word) => word.startsWith(normalizedQuery));
      if (firstWordIndex >= 0) {
        score += 42000 - firstWordIndex * 2000;
      }

      const includesIndex = normalizedName.indexOf(normalizedQuery);
      if (includesIndex >= 0) {
        score += 30000 - includesIndex * 120;
      } else if (compactQuery && compactName.includes(compactQuery)) {
        score += 22000 - compactName.indexOf(compactQuery) * 90;
      }

      let matchedQueryWords = 0;
      for (const word of queryWords) {
        if (!word) {
          continue;
        }
        if (words.some((nameWord) => nameWord === word)) {
          score += 9000;
          matchedQueryWords += 1;
        } else if (words.some((nameWord) => nameWord.startsWith(word))) {
          score += 6000;
          matchedQueryWords += 1;
        } else if (normalizedName.includes(word)) {
          score += 3200;
        }
      }
      score += matchedQueryWords * 1800;

      let prefixLength = 0;
      while (
        prefixLength < normalizedName.length &&
        prefixLength < normalizedQuery.length &&
        normalizedName[prefixLength] === normalizedQuery[prefixLength]
      ) {
        prefixLength += 1;
      }
      score += prefixLength * 220;

      let subsequenceMatches = 0;
      let nameIndex = 0;
      for (const char of normalizedQuery) {
        if (char === " ") {
          continue;
        }
        const foundIndex = normalizedName.indexOf(char, nameIndex);
        if (foundIndex < 0) {
          break;
        }
        subsequenceMatches += 1;
        nameIndex = foundIndex + 1;
      }
      score += subsequenceMatches * 70;

      score -= Math.max(0, normalizedName.length - normalizedQuery.length) * 3;
      return score;
    }

    getMyLevelsCreateButton() {
      const scale = this.getScreenFitScale(760, 640, 0.56);
      const width = Math.min(Math.round(188 * scale), this.width - 48);
      const height = Math.max(34, Math.round(42 * scale));
      return {
        id: "create_from_my_levels",
        label: "Create a Level",
        x: this.width - 24 - width,
        y: 20,
        w: width,
        h: height,
        fontSize: Math.max(13, Math.round(17 * scale)),
        radius: Math.max(10, Math.round(12 * scale)),
        hover: this.myLevelsCreateHover,
      };
    }

    getMyLevelCards() {
      const levels = this.getMyCreatedLevels();
      const metrics = this.getOnlineLevelListMetrics("my_levels");
      const { scale, cardW, cardH, gap, startY, x } = metrics;
      const scrollY = this.getOnlineLevelListScrollY("my_levels");
      return levels.map((level, index) => {
        const smallFontSize = Math.max(11, Math.round(14 * scale));
        const statusLabel = getCommunitySubmissionStatusLabel(level.submissionStatus);
        const statusPadX = Math.max(12, Math.round(16 * scale));
        const estimatedStatusTextW = Math.round(statusLabel.length * smallFontSize * 0.68);
        const statusW = Math.max(Math.round(70 * scale), estimatedStatusTextW + statusPadX * 2);
        const statusH = Math.max(24, Math.round(30 * scale));
        const cardY = startY + index * (cardH + gap) - scrollY;
        return {
          ...level,
          index,
          x,
          y: cardY,
          w: cardW,
          h: cardH,
          fontSize: Math.max(14, Math.round(20 * scale)),
          smallFontSize,
          radius: Math.max(10, Math.round(14 * scale)),
          statusLabel,
          statusRect: {
            x: x + cardW - Math.round(18 * scale) - statusW,
            y: cardY + Math.round(14 * scale),
            w: statusW,
            h: statusH,
          },
        };
      });
    }

    getMyLevelMessageDialogLayout() {
      const scale = this.getScreenFitScale(680, 520, 0.54);
      const panelW = Math.min(Math.round(560 * scale), this.width - 36);
      const panelH = Math.min(Math.round(280 * scale), this.height - 36);
      const x = Math.round(this.width * 0.5 - panelW * 0.5);
      const y = Math.round(this.height * 0.5 - panelH * 0.5);
      const buttonW = Math.max(96, Math.round(128 * scale));
      const buttonH = Math.max(34, Math.round(40 * scale));
      return {
        x,
        y,
        w: panelW,
        h: panelH,
        radius: Math.max(12, Math.round(16 * scale)),
        scale,
        closeButton: {
          id: "close_my_level_message",
          label: "Close",
          x: Math.round(x + panelW * 0.5 - buttonW * 0.5),
          y: Math.round(y + panelH - Math.round(28 * scale) - buttonH),
          w: buttonW,
          h: buttonH,
          fontSize: Math.max(12, Math.round(16 * scale)),
          radius: Math.max(9, Math.round(11 * scale)),
          hover: this.myLevelMessageCloseHover,
        },
      };
    }

    getCommunityDetailPlayButton() {
      const scale = this.getScreenFitScale(700, 560, 0.58);
      const width = Math.min(Math.round(240 * scale), this.width - 48);
      const height = Math.max(46, Math.round(64 * scale));
      return {
        id: "play_community_level",
        label: "Play",
        x: Math.round(this.width * 0.5 - width * 0.5),
        y: Math.round(this.height * 0.34),
        w: width,
        h: height,
        fontSize: Math.max(17, Math.round(26 * scale)),
        radius: Math.max(10, Math.round(14 * scale)),
        hover: this.communityDetailPlayHover,
      };
    }

    getCreateLevelLayout() {
      const scale = this.getScreenFitScale(900, 720, 0.54);
      const margin = Math.max(16, Math.round(28 * scale));
      const panelW = Math.min(Math.round(880 * scale), this.width - margin * 2);
      const panelX = this.width * 0.5 - panelW * 0.5;
      const topY = Math.max(108, Math.round(this.height * 0.17));
      const rowGap = Math.max(16, Math.round(22 * scale));
      const listFont = Math.max(11, Math.round(14 * scale));
      const listLine = Math.max(15, Math.round(18 * scale));
      const instructionRows = 12;
      const listH = instructionRows * listLine + Math.round(26 * scale);
      const frameY = topY + listH + rowGap;
      const frameW = Math.min(panelW * 0.48, Math.round(380 * scale));
      const boxH = Math.max(142, Math.round(170 * scale));
      const publishW = panelW - frameW - rowGap;
      const testY = frameY + boxH + rowGap;
      const testH = Math.max(112, Math.round(136 * scale));
      const runW = Math.max(92, Math.round(126 * scale));
      const runH = Math.max(34, Math.round(44 * scale));
      const inputPad = Math.max(12, Math.round(15 * scale));
      const headerH = Math.max(34, Math.round(40 * scale));
      const copyW = Math.max(74, Math.round(92 * scale));
      const copyH = Math.max(28, Math.round(34 * scale));
      const publishButtonW = Math.max(88, Math.round(112 * scale));
      const publishButtonH = Math.max(30, Math.round(38 * scale));
      const publishPad = Math.max(12, Math.round(14 * scale));
      const publishNameH = Math.max(28, Math.round(34 * scale));
      const publishTextY = frameY + Math.round(42 * scale);

      return {
        scale,
        margin,
        panelX,
        panelW,
        topY,
        rowGap,
        listFont,
        listLine,
        listH,
        frame: {
          x: panelX,
          y: frameY,
          w: frameW,
          h: boxH,
        },
        publish: {
          x: panelX + frameW + rowGap,
          y: frameY,
          w: publishW,
          h: boxH,
        },
        copyButton: {
          id: "copy_level_frame",
          label: "Copy",
          x: panelX + frameW - inputPad - copyW,
          y: frameY + inputPad,
          w: copyW,
          h: copyH,
          fontSize: Math.max(12, Math.round(16 * scale)),
          radius: Math.max(8, Math.round(10 * scale)),
          hover: this.customLevelCopyHover,
        },
        publishText: {
          x: panelX + frameW + rowGap + publishPad,
          y: publishTextY,
          w: publishW - publishPad * 2,
        },
        publishNameInput: {
          x: panelX + frameW + rowGap + publishPad,
          y: publishTextY + Math.round(34 * scale),
          w: publishW - publishPad * 2,
          h: publishNameH,
        },
        publishInput: {
          x: panelX + frameW + rowGap + publishPad,
          y: publishTextY + Math.round(34 * scale) + publishNameH + Math.round(8 * scale),
          w: publishW - publishPad * 2 - publishButtonW - Math.round(10 * scale),
          h: Math.max(42, boxH - (publishTextY - frameY) - publishNameH - Math.round(52 * scale)),
        },
        publishButton: {
          id: "publish_custom_level",
          label: "Publish",
          x: panelX + frameW + rowGap + publishW - publishPad - publishButtonW,
          y: frameY + boxH - publishPad - publishButtonH,
          w: publishButtonW,
          h: publishButtonH,
          fontSize: Math.max(12, Math.round(16 * scale)),
          radius: Math.max(8, Math.round(10 * scale)),
          hover: this.customLevelPublishHover,
        },
        test: {
          x: panelX,
          y: testY,
          w: panelW,
          h: testH,
        },
        testInput: {
          x: panelX + inputPad,
          y: testY + headerH,
          w: panelW - inputPad * 2 - runW - Math.round(14 * scale),
          h: testH - headerH - inputPad,
        },
        runButton: {
          id: "run_custom_level",
          label: "Run",
          x: panelX + panelW - inputPad - runW,
          y: testY + testH - inputPad - runH,
          w: runW,
          h: runH,
          fontSize: Math.max(14, Math.round(20 * scale)),
          radius: Math.max(10, Math.round(12 * scale)),
          hover: this.customLevelRunHover,
        },
      };
    }

    getCreateLevelTestLayout() {
      const layout = this.getCreateLevelLayout();
      return {
        ...layout.test,
        scale: layout.scale,
        input: layout.testInput,
        runButton: layout.runButton,
      };
    }

    getGameExitButton() {
      const scale = this.getHUDScale();
      const x = Math.max(10, Math.round(24 * scale));
      const y = Math.max(10, Math.round(20 * scale));
      return {
        id: "menu",
        x,
        y,
        w: Math.max(82, Math.round(118 * scale)),
        h: Math.max(32, Math.round(38 * scale)),
        fontSize: Math.max(13, Math.round(18 * scale)),
      };
    }

    getGameRestartButton() {
      const exitButton = this.getGameExitButton();
      const scale = this.getHUDScale();
      return {
        id: "restart",
        x: exitButton.x + exitButton.w + Math.max(8, Math.round(12 * scale)),
        y: exitButton.y,
        w: Math.max(82, Math.round(118 * scale)),
        h: exitButton.h,
        fontSize: exitButton.fontSize,
      };
    }

    getHUDScale() {
      return this.getScreenFitScale(1280, 720, 0.66);
    }

    getCampaignHUDLayout() {
      const scale = this.getHUDScale();
      const exitButton = this.getGameExitButton();
      const panelX = Math.max(8, Math.round(18 * scale));
      const panelY = exitButton.y + exitButton.h + Math.max(8, Math.round(8 * scale));
      const panelW = Math.max(160, Math.min(Math.round(320 * scale), this.width - panelX * 2));
      const worldInfo = this.getCampaignWorldInfo();
      const statLines = this.isRaceMode()
        ? [
            `Race Time   ${formatTime(this.levelTimer)}`,
            `Player 1 Damage ${Math.round(this.getTagPlayer("red").totalDamage)}`,
            `Player 2 Damage ${Math.round(this.getTagPlayer("blue").totalDamage)}`,
          ]
        : this.isSpeedrunMode()
        ? [
            `Level Time  ${formatTime(this.levelTimer)}`,
            `Total Time  ${formatTime(this.totalTimer)}`,
            `Damage      ${Math.round(this.totalDamage)}`,
          ]
        : [
            `Level Time  ${formatTime(this.levelTimer)}`,
            `Damage      ${Math.round(this.totalDamage)}`,
          ];
      const lineGap = Math.max(16, Math.round(22 * scale));
      const panelH = Math.round(94 * scale) + statLines.length * lineGap + Math.round(24 * scale);
      return {
        panelX,
        panelY,
        panelW,
        panelH,
        worldInfo,
        statLines,
        maxTextWidth: panelW - Math.round(28 * scale),
        scale,
        lineGap,
      };
    }

    getCampaignCompleteButtons() {
      const scale = this.getScreenFitScale(520, 520, 0.55);
      const gap = Math.max(8, Math.round(14 * scale));
      if (this.isCustomLevelMode()) {
        if (this.gameMode === "publish_test") {
          const width = Math.max(70, Math.min(Math.round(144 * scale), (this.width - Math.max(24, Math.round(48 * scale)) - gap * 2) / 3));
          const height = Math.max(36, Math.round(54 * scale));
          const totalWidth = width * 3 + gap * 2;
          const startX = this.width * 0.5 - totalWidth * 0.5;
          const y = Math.min(this.height - height - Math.max(12, Math.round(24 * scale)), this.height * 0.5 + Math.round(82 * scale));
          const exitLabel = this.isGameBackButtonMode() ? "Back" : "Home";
          return [
            { id: "home", label: exitLabel, x: startX, y, w: width, h: height, fontSize: Math.max(13, Math.round(22 * scale)) },
            { id: "replay", label: "Retry", x: startX + width + gap, y, w: width, h: height, fontSize: Math.max(13, Math.round(22 * scale)) },
            { id: "publish_complete", label: "Publish", x: startX + (width + gap) * 2, y, w: width, h: height, fontSize: Math.max(12, Math.round(19 * scale)) },
          ];
        }
        const width = Math.max(76, Math.min(Math.round(154 * scale), (this.width - Math.max(24, Math.round(48 * scale)) - gap) * 0.5));
        const height = Math.max(36, Math.round(54 * scale));
        const totalWidth = width * 2 + gap;
        const startX = this.width * 0.5 - totalWidth * 0.5;
        const y = Math.min(this.height - height - Math.max(12, Math.round(24 * scale)), this.height * 0.5 + Math.round(82 * scale));
        const exitLabel = this.isGameBackButtonMode() ? "Back" : "Home";
        return [
          { id: "home", label: exitLabel, x: startX, y, w: width, h: height, fontSize: Math.max(13, Math.round(22 * scale)) },
          { id: "replay", label: "Restart", x: startX + width + gap, y, w: width, h: height, fontSize: Math.max(13, Math.round(22 * scale)) },
        ];
      }
      const width = Math.max(60, Math.min(Math.round(144 * scale), (this.width - Math.max(24, Math.round(48 * scale)) - gap * 2) / 3));
      const height = Math.max(36, Math.round(54 * scale));
      const totalWidth = width * 3 + gap * 2;
      const startX = this.width * 0.5 - totalWidth * 0.5;
      const y = Math.min(this.height - height - Math.max(12, Math.round(24 * scale)), this.height * 0.5 + Math.round(82 * scale));
      return [
        { id: "home", label: "Home", x: startX, y, w: width, h: height, fontSize: Math.max(13, Math.round(22 * scale)) },
        { id: "replay", label: "Play Again", x: startX + width + gap, y, w: width, h: height, fontSize: Math.max(12, Math.round(19 * scale)) },
        { id: "next", label: "Next", x: startX + (width + gap) * 2, y, w: width, h: height, fontSize: Math.max(13, Math.round(22 * scale)) },
      ];
    }

    getHomeConfirmButtons() {
      const scale = this.getScreenFitScale(520, 420, 0.58);
      const gap = Math.max(10, Math.round(18 * scale));
      const width = Math.max(70, Math.min(Math.round(148 * scale), (this.width - Math.max(24, Math.round(48 * scale)) - gap) * 0.5));
      const height = Math.max(36, Math.round(50 * scale));
      const totalWidth = width * 2 + gap;
      const startX = this.width * 0.5 - totalWidth * 0.5;
      const y = Math.min(this.height - height - Math.max(12, Math.round(24 * scale)), this.height * 0.5 + Math.round(40 * scale));
      return [
        { id: "cancel", label: "Cancel", x: startX, y, w: width, h: height, fontSize: Math.max(13, Math.round(22 * scale)) },
        { id: "leave", label: "Leave", x: startX + width + gap, y, w: width, h: height, fontSize: Math.max(13, Math.round(22 * scale)) },
      ];
    }

    getSignOutConfirmButtons() {
      const scale = this.getScreenFitScale(520, 420, 0.58);
      const gap = Math.max(10, Math.round(18 * scale));
      const width = Math.max(70, Math.min(Math.round(148 * scale), (this.width - Math.max(24, Math.round(48 * scale)) - gap) * 0.5));
      const height = Math.max(36, Math.round(50 * scale));
      const totalWidth = width * 2 + gap;
      const startX = this.width * 0.5 - totalWidth * 0.5;
      const y = Math.min(this.height - height - Math.max(12, Math.round(24 * scale)), this.height * 0.5 + Math.round(40 * scale));
      return [
        { id: "cancel", label: "Cancel", x: startX, y, w: width, h: height, fontSize: Math.max(13, Math.round(22 * scale)) },
        { id: "signout", label: "Sign Out", x: startX + width + gap, y, w: width, h: height, fontSize: Math.max(13, Math.round(22 * scale)) },
      ];
    }

    getPublishConfirmButtons() {
      const scale = this.getScreenFitScale(520, 420, 0.58);
      const gap = Math.max(10, Math.round(18 * scale));
      const width = Math.max(70, Math.min(Math.round(148 * scale), (this.width - Math.max(24, Math.round(48 * scale)) - gap) * 0.5));
      const height = Math.max(36, Math.round(50 * scale));
      const totalWidth = width * 2 + gap;
      const startX = this.width * 0.5 - totalWidth * 0.5;
      const y = Math.min(this.height - height - Math.max(12, Math.round(24 * scale)), this.height * 0.5 + Math.round(40 * scale));
      return [
        { id: "cancel", label: "Cancel", x: startX, y, w: width, h: height, fontSize: Math.max(13, Math.round(22 * scale)) },
        { id: "publish", label: "Publish", x: startX + width + gap, y, w: width, h: height, fontSize: Math.max(13, Math.round(22 * scale)) },
      ];
    }

    getCreatePublishPromptButtons() {
      const scale = this.getScreenFitScale(520, 420, 0.58);
      const gap = Math.max(10, Math.round(18 * scale));
      const width = Math.max(70, Math.min(Math.round(148 * scale), (this.width - Math.max(24, Math.round(48 * scale)) - gap) * 0.5));
      const height = Math.max(36, Math.round(50 * scale));
      const totalWidth = width * 2 + gap;
      const startX = this.width * 0.5 - totalWidth * 0.5;
      const y = Math.min(this.height - height - Math.max(12, Math.round(24 * scale)), this.height * 0.5 + Math.round(40 * scale));
      return [
        { id: "back", label: "Back", x: startX, y, w: width, h: height, fontSize: Math.max(13, Math.round(22 * scale)) },
        { id: "continue", label: "Continue", x: startX + width + gap, y, w: width, h: height, fontSize: Math.max(13, Math.round(22 * scale)) },
      ];
    }

    getLevelSelectBackButton() {
      return {
        id: "back",
        x: 24,
        y: 20,
        w: 104,
        h: 38,
      };
    }

    getLevelSelectSpeedrunButton() {
      const layout = this.getLevelSelectModeButtonLayout();
      return {
        id: "speedrun",
        label: "Speedrun",
        visible: this.levelSelectContext !== "race",
        enabled: this.levelSelectContext !== "race" && this.highestVisitedLevel >= LEVELS.length - 1,
        x: layout.startX,
        y: layout.y,
        w: layout.width,
        h: layout.height,
      };
    }

    getLevelSelectBlackoutButton() {
      const layout = this.getLevelSelectModeButtonLayout();
      return {
        id: "blackout",
        label: "Blackout",
        enabled: this.highestVisitedLevel >= LEVELS.length - 1,
        x: this.levelSelectContext === "race" ? layout.startX : layout.startX + layout.width + layout.gap,
        y: layout.y,
        w: layout.width,
        h: layout.height,
      };
    }

    getLevelSelectModeButtonLayout() {
      const metrics = this.getLevelSelectLayoutMetrics();
      const cards = this.getLevelSelectCards();
      const bottom = cards.reduce((max, card) => Math.max(max, card.y + card.h), 0);
      const gap = 18;
      const buttonCount = this.levelSelectContext === "race" ? 1 : 2;
      const width = buttonCount === 1
        ? Math.min(248, this.width - 120)
        : Math.min(248, (this.width - 120 - gap) * 0.5);
      return {
        width,
        height: metrics.speedrunHeight,
        gap,
        startX: this.width * 0.5 - (width * buttonCount + gap * (buttonCount - 1)) * 0.5,
        y: bottom + metrics.speedrunGap,
      };
    }

    getCampaignWorldDefinitions() {
      return [
        {
          start: 0,
          end: 4,
          title: "Foundations",
          subtitle: "Base walls, clean routes, and core drift lines",
          themeColor: "#7ecff2",
        },
        {
          start: 5,
          end: 8,
          title: "Hazard Training",
          subtitle: "Red kill walls and the first special track pieces",
          themeColor: "#f28b82",
        },
        {
          start: 9,
          end: 11,
          title: "Advanced Blocks",
          subtitle: "Denser layouts built around ice and bumpers",
          themeColor: "#b59cff",
        },
      ];
    }

    getCampaignWorldInfo(levelIndex = this.levelIndex) {
      return this.getCampaignWorldDefinitions().find(
        (group) => levelIndex >= group.start && levelIndex <= Math.min(group.end, LEVELS.length - 1)
      ) || {
        start: 0,
        end: LEVELS.length - 1,
        title: "Campaign",
        subtitle: "",
        themeColor: "#96c6de",
      };
    }

    getLevelSelectLayoutMetrics() {
      const groupDefinitions = this.getCampaignWorldDefinitions().filter(
        (group) => group.start <= Math.min(group.end, LEVELS.length - 1)
      );
      const maxColumns = 5;
      const safeTop = Math.max(166, this.height * 0.265);
      const bottomMargin = 24;
      const baseGapX = 18;
      const baseGapY = 14;
      const baseGroupGap = 26;
      const baseHeaderHeight = 40;
      const baseCardHeight = 88;
      const baseSpeedrunGap = 22;
      const baseSpeedrunHeight = 58;
      const totalBaseHeight = groupDefinitions.reduce((total, group) => {
        const count = Math.min(group.end, LEVELS.length - 1) - group.start + 1;
        const columns = Math.min(maxColumns, count);
        const rows = Math.ceil(count / columns);
        return total + baseHeaderHeight + rows * baseCardHeight + (rows - 1) * baseGapY;
      }, 0) + Math.max(0, groupDefinitions.length - 1) * baseGroupGap + baseSpeedrunGap + baseSpeedrunHeight;
      const availableHeight = Math.max(280, this.height - safeTop - bottomMargin);
      const verticalScale = clamp(availableHeight / Math.max(1, totalBaseHeight), 0.62, 1);
      const gapX = baseGapX;
      const cardWidth = Math.min(206, (this.width - 132 - gapX * (maxColumns - 1)) / maxColumns);

      return {
        maxColumns,
        gapX,
        gapY: Math.round(baseGapY * verticalScale),
        groupGap: Math.round(baseGroupGap * verticalScale),
        headerHeight: Math.round(baseHeaderHeight * verticalScale),
        cardWidth,
        cardHeight: Math.round(baseCardHeight * verticalScale),
        speedrunGap: Math.round(baseSpeedrunGap * verticalScale),
        speedrunHeight: Math.round(baseSpeedrunHeight * verticalScale),
        startY: safeTop,
        verticalScale,
      };
    }

    getLevelSelectGroups() {
      const groupDefinitions = this.getCampaignWorldDefinitions();
      const metrics = this.getLevelSelectLayoutMetrics();
      let currentY = metrics.startY;

      return groupDefinitions.flatMap((group) => {
        const groupEnd = Math.min(group.end, LEVELS.length - 1);
        if (group.start > groupEnd) {
          return [];
        }

        const count = groupEnd - group.start + 1;
        const columns = Math.min(metrics.maxColumns, count);
        const rows = Math.ceil(count / columns);
        const totalWidth = columns * metrics.cardWidth + (columns - 1) * metrics.gapX;
        const startX = this.width * 0.5 - totalWidth * 0.5;
        const cardsTop = currentY + metrics.headerHeight;
        const cards = [];

        for (let offset = 0; offset < count; offset += 1) {
          const index = group.start + offset;
          cards.push({
            index,
            worldTitle: group.title,
            themeColor: group.themeColor,
            unlocked: index <= this.highestVisitedLevel,
            isCurrent: index === this.levelIndex,
            bestTime: this.levelBestTimes[index],
            cleanFinish: this.levelCleanFinishes[index],
            x: startX + (offset % columns) * (metrics.cardWidth + metrics.gapX),
            y: cardsTop + Math.floor(offset / columns) * (metrics.cardHeight + metrics.gapY),
            w: metrics.cardWidth,
            h: metrics.cardHeight,
          });
        }

        const rangeEnd = groupEnd + 1;
        const result = {
          title: group.title,
          subtitle: group.subtitle,
          themeColor: group.themeColor,
          rangeLabel: `Levels ${group.start + 1}-${rangeEnd}`,
          x: this.width * 0.5,
          y: currentY,
          cards,
        };
        currentY = cardsTop + rows * metrics.cardHeight + (rows - 1) * metrics.gapY + metrics.groupGap;
        return [result];
      });
    }

    getLevelSelectCards() {
      return this.getLevelSelectGroups().flatMap((group) => group.cards);
    }

    getFittedFontSize(ctx, text, maxWidth, preferredSize, minimumSize = 9, fontPrefix = "") {
      let fontSize = Math.max(minimumSize, Math.round(preferredSize));
      const prefix = fontPrefix ? `${fontPrefix} ` : "";
      while (fontSize > minimumSize) {
        ctx.font = `${prefix}${fontSize}px Consolas, monospace`;
        if (ctx.measureText(text).width <= maxWidth) {
          return fontSize;
        }
        fontSize -= 1;
      }
      return minimumSize;
    }

    getCustomizationButtons() {
      const layout = this.getCustomizationLayout();
      const { buttonWidth, buttonHeight, buttonGap, buttonY, scale } = layout;
      const totalWidth = buttonWidth * 2 + buttonGap;
      const startX = this.width * 0.5 - totalWidth * 0.5;
      return [
        {
          id: "done",
          label: "Done",
          x: startX + buttonWidth + buttonGap,
          y: buttonY,
          w: buttonWidth,
          h: buttonHeight,
          fontSize: Math.max(13, Math.round(22 * scale)),
        },
        {
          id: "back",
          label: "Back",
          x: startX,
          y: buttonY,
          w: buttonWidth,
          h: buttonHeight,
          fontSize: Math.max(13, Math.round(22 * scale)),
        },
      ];
    }

    getCustomizationArrowButtons() {
      const layout = this.getCustomizationLayout();
      const size = layout.arrowSize;
      const y = layout.carCenterY - size * 0.5;
      return [
        {
          id: "prev_model",
          x: this.width * 0.5 - layout.arrowOffset - size * 0.5,
          y,
          w: size,
          h: size,
        },
        {
          id: "next_model",
          x: this.width * 0.5 + layout.arrowOffset - size * 0.5,
          y,
          w: size,
          h: size,
        },
      ];
    }

    getCustomizationColorPickerRect() {
      const layout = this.getCustomizationLayout();
      const width = layout.pickerWidth;
      const height = layout.pickerHeight;
      return {
        x: this.width * 0.5 - width * 0.5,
        y: layout.pickerY,
        w: width,
        h: height,
      };
    }

    getCustomizationLayout() {
      const scale = this.getScreenFitScale(640, 740, 0.42);
      const margin = Math.max(10, Math.round(22 * scale));
      const titleY = margin + Math.round(46 * scale);
      const titleSize = Math.max(24, Math.round(54 * scale));
      const subtitleSize = Math.max(11, Math.round(18 * scale));
      const showSubcopy = this.height >= 430;
      const subtitle1Y = titleY + Math.round(44 * scale);
      const subtitle2Y = subtitle1Y + Math.round(24 * scale);
      const headerBottom = showSubcopy ? subtitle2Y : titleY + Math.round(18 * scale);
      const carScale = 6 * scale;
      const carCenterY = headerBottom + Math.round(135 * scale);
      const previewVariant = this.getCarVariantDefinition(this.customizationDraftVariant);
      const carVisibleHalfHeight = ((previewVariant.sprite?.renderWidth || CAR_WIDTH) * carScale) * 0.5;
      const variantY = carCenterY + carVisibleHalfHeight + Math.round(8 * scale);
      const swapHintY = variantY + Math.round(24 * scale);
      const paintLabelY = swapHintY + Math.round(30 * scale);
      const buttonWidth = Math.max(66, Math.min(Math.round(154 * scale), (this.width - margin * 2 - Math.round(24 * scale)) * 0.5));
      const buttonHeight = Math.max(34, Math.round(50 * scale));
      const buttonGap = Math.max(10, Math.round(24 * scale));
      const pickerWidth = Math.min(Math.round(240 * scale), this.width - margin * 2);
      const pickerHeight = Math.max(42, Math.round(76 * scale));
      const idealPickerY = paintLabelY + Math.round(12 * scale);
      const latestButtonY = this.height - margin - buttonHeight;
      const buttonY = Math.max(margin, Math.min(latestButtonY, idealPickerY + pickerHeight + Math.round(24 * scale)));
      const pickerY = Math.max(
        headerBottom + Math.round(64 * scale),
        Math.min(idealPickerY, buttonY - pickerHeight - Math.round(12 * scale))
      );
      const arrowSize = Math.max(38, Math.round(68 * scale));
      const arrowOffset = Math.min(Math.round(290 * scale), Math.max(arrowSize + 18, this.width * 0.5 - arrowSize * 0.7 - margin));

      return {
        scale,
        margin,
        titleY,
        titleSize,
        subtitleSize,
        showSubcopy,
        subtitle1Y,
        subtitle2Y,
        carCenterY,
        carScale,
        variantY,
        swapHintY,
        paintLabelY,
        pickerY,
        pickerWidth,
        pickerHeight,
        buttonY,
        buttonWidth,
        buttonHeight,
        buttonGap,
        arrowSize,
        arrowOffset,
      };
    }

    getTwoPlayerCustomizationCards() {
      const scale = this.getTwoPlayerCustomizationScale();
      const margin = Math.max(10, Math.round(24 * scale));
      const titleY = margin + Math.round(44 * scale);
      const subtitleY = titleY + Math.round(38 * scale);
      const cardW = Math.min(Math.round(760 * scale), this.width - margin * 2);
      const cardH = Math.max(80, Math.round(170 * scale));
      const gap = Math.max(8, Math.round(18 * scale));
      const startY = subtitleY + Math.round(30 * scale);
      const cardX = this.width * 0.5 - cardW * 0.5;
      const pickerW = Math.min(Math.round(230 * scale), cardW * 0.34);
      const pickerH = Math.max(42, Math.round(64 * scale));
      return ["red", "blue"].map((id, index) => {
        const y = startY + index * (cardH + gap);
        const carCenterX = cardX + cardW * 0.36;
        const carCenterY = y + cardH * 0.48;
        return {
          id,
          label: id === "red" ? "Player 1" : "Player 2",
          x: cardX,
          y,
          w: cardW,
          h: cardH,
          carCenterX,
          carCenterY,
          arrowY: carCenterY - Math.max(18, Math.round(29 * scale)),
          scale,
          picker: {
            x: cardX + cardW - pickerW - Math.round(26 * scale),
            y: y + cardH * 0.5 - pickerH * 0.5,
            w: pickerW,
            h: pickerH,
          },
        };
      });
    }

    getTwoPlayerCustomizationScale() {
      return this.getScreenFitScale(780, 620, 0.46);
    }

    getTwoPlayerCustomizationArrowButtons() {
      return this.getTwoPlayerCustomizationCards().flatMap((card) => {
        const size = Math.max(36, Math.round(58 * card.scale));
        const offset = Math.min(Math.round(154 * card.scale), card.w * 0.28);
        return [
          {
            id: `${card.id}_prev`,
            x: card.carCenterX - offset - size * 0.5,
            y: card.arrowY,
            w: size,
            h: size,
          },
          {
            id: `${card.id}_next`,
            x: card.carCenterX + offset - size * 0.5,
            y: card.arrowY,
            w: size,
            h: size,
          },
        ];
      });
    }

    getTwoPlayerCustomizationButtons() {
      const scale = this.getTwoPlayerCustomizationScale();
      const margin = Math.max(10, Math.round(24 * scale));
      const width = Math.max(70, Math.round(154 * scale));
      const height = Math.max(34, Math.round(50 * scale));
      const gap = Math.max(10, Math.round(24 * scale));
      const totalWidth = width * 2 + gap;
      const startX = this.width * 0.5 - totalWidth * 0.5;
      const cards = this.getTwoPlayerCustomizationCards();
      const lastCard = cards[cards.length - 1];
      const y = Math.min(this.height - height - margin, lastCard.y + lastCard.h + Math.round(18 * scale));
      return [
        { id: "back", label: "Back", x: startX, y, w: width, h: height, fontSize: Math.max(13, Math.round(22 * scale)) },
        { id: "done", label: "Done", x: startX + width + gap, y, w: width, h: height, fontSize: Math.max(13, Math.round(22 * scale)) },
      ];
    }

    getCanvasPointFromClient(clientX, clientY) {
      const bounds = this.canvas.getBoundingClientRect();
      return {
        x: clientX - bounds.left,
        y: clientY - bounds.top,
      };
    }

    setPointerPosition(x, y, inside = true) {
      this.mouse.x = x;
      this.mouse.y = y;
      this.mouse.inside = inside;
      if (!inside) {
        return;
      }
      if (this.currentScreen === "title") {
        this.refreshTitleHover();
      } else if (this.currentScreen === "two_player_menu") {
        this.refreshTwoPlayerHover();
      } else if (this.currentScreen === "two_player_customization") {
        this.refreshTwoPlayerCustomizationHover();
      } else if (this.currentScreen === "leaderboard") {
        this.refreshLeaderboardHover();
      } else if (this.currentScreen === "online" || this.currentScreen === "community_levels" || this.currentScreen === "community_detail" || this.currentScreen === "create_level" || this.currentScreen === "my_levels") {
        this.refreshOnlineHover();
      } else if (this.currentScreen === "level_select") {
        this.refreshLevelSelectHover();
      } else if (this.currentScreen === "customization") {
        this.refreshCustomizationHover();
      } else if (this.currentScreen === "game") {
        this.refreshGameHover();
      }
    }

    onCanvasPointerMove(event) {
      const point = this.getCanvasPointFromClient(event.clientX, event.clientY);
      this.setPointerPosition(point.x, point.y, true);
    }

    onCanvasPointerDown(event) {
      this.onCanvasPointerMove(event);
      this.mouse.down = true;
    }

    onCanvasPointerUp() {
      this.mouse.down = false;
    }

    onCanvasPointerLeave() {
      this.mouse.inside = false;
      this.mouse.down = false;
      this.hoveredTitleButton = null;
      this.hoveredTitleOnlineButton = false;
      this.hoveredTitleUsernameButton = null;
      this.hoveredTwoPlayerButton = null;
      this.hoveredLeaderboardButton = null;
      this.hoveredOnlineButton = null;
      this.hoveredCommunityLevel = null;
      this.hoveredGameButton = null;
      this.hoveredLevelCard = null;
      this.hoveredLevelSelectButton = null;
      this.hoveredCustomizationButton = null;
      this.canvas.style.cursor = "default";
    }

    onCanvasWheel(event) {
      if (!this.isScrollableOnlineListScreen()) {
        return;
      }
      const point = this.getCanvasPointFromClient(event.clientX, event.clientY);
      if (!this.isPointInsideOnlineLevelListViewport(point.x, point.y)) {
        return;
      }
      const changed = this.scrollOnlineLevelListBy(event.deltaY);
      if ((changed || this.getOnlineLevelListMaxScroll() > 0) && event.cancelable) {
        event.preventDefault();
      }
    }

    handleCanvasTapAt(x, y) {
      if (this.screenWipePhase !== "idle") {
        return;
      }
      this.setPointerPosition(x, y, true);
      if (this.currentScreen === "title") {
        if (this.signOutConfirmOpen) {
          if (this.hoveredSignOutConfirmButton === "cancel") {
            this.closeSignOutConfirm();
          } else if (this.hoveredSignOutConfirmButton === "signout") {
            this.logOutAccount();
          }
        } else if (this.hoveredTitleUsernameButton === "update_leaderboard_name") {
          this.updateUnnamedLeaderboardNames();
        } else if (this.hoveredTitleUsernameButton === "login") {
          this.openAuthDialog("login");
        } else if (this.hoveredTitleUsernameButton === "signup") {
          this.openAuthDialog("signup");
        } else if (this.hoveredTitleUsernameButton === "logout") {
          this.openSignOutConfirm();
        } else if (this.hoveredTitleButton === "play") {
          this.openLevelSelect();
        } else if (this.hoveredTitleButton === "two_player" || this.hoveredTitleButton === "tag") {
          this.openTwoPlayerMenu();
        } else if (this.hoveredTitleButton === "customization") {
          this.openCustomization();
        } else if (this.hoveredTitleButton === "online") {
          this.openOnlineMenu();
        }
        return;
      }
      if (this.currentScreen === "online") {
        if (this.hoveredOnlineButton === "back") {
          this.returnToTitle();
        } else if (this.hoveredOnlineButton === "community") {
          this.openCommunityLevels();
        } else if (this.hoveredOnlineButton === "create") {
          this.openMyLevels();
        } else if (this.hoveredOnlineButton === "leaderboard") {
          this.openLeaderboard();
        }
        return;
      }
      if (this.currentScreen === "community_levels" || this.currentScreen === "community_detail" || this.currentScreen === "create_level" || this.currentScreen === "my_levels") {
        if (this.currentScreen === "my_levels" && this.myLevelMessageDialog) {
          if (this.hoveredOnlineButton === "close_my_level_message") {
            this.closeMyLevelMessageDialog();
          }
          return;
        }
        if (this.currentScreen === "create_level" && this.createPublishPromptOpen) {
          if (this.hoveredCreatePublishPromptButton === "back") {
            this.closeCreatePublishPrompt();
          } else if (this.hoveredCreatePublishPromptButton === "continue") {
            this.beginPublishValidationRun();
          }
          return;
        }
        if (this.hoveredOnlineButton === "back") {
          if (this.currentScreen === "community_detail") {
            this.openCommunityLevels();
          } else if (this.currentScreen === "create_level") {
            if (this.createLevelReturnScreen === "my_levels") {
              this.openMyLevels();
            } else {
              this.openOnlineMenu();
            }
          } else if (this.currentScreen === "my_levels") {
            this.openOnlineMenu();
          } else {
            this.openOnlineMenu();
          }
        } else if (this.hoveredOnlineButton === "create_from_my_levels") {
          this.openCreateLevel("my_levels");
        } else if (this.hoveredOnlineButton === "copy_level_frame") {
          this.copyEmptyLevelFrame();
        } else if (this.hoveredOnlineButton === "publish_custom_level") {
          this.publishCustomLevel();
        } else if (this.hoveredOnlineButton === "run_custom_level") {
          this.runPastedCustomLevel();
        } else if (this.hoveredOnlineButton === "play_community_level") {
          this.playSelectedCommunityLevel();
        } else if (this.currentScreen === "my_levels" && typeof this.hoveredOnlineButton === "string" && this.hoveredOnlineButton.startsWith("my_level_status_")) {
          const index = Number.parseInt(this.hoveredOnlineButton.slice("my_level_status_".length), 10);
          if (Number.isInteger(index)) {
            this.openMyLevelMessageDialog(index);
          }
        } else if (this.currentScreen === "community_levels" && this.hoveredCommunityLevel != null) {
          this.openCommunityLevelDetail(this.hoveredCommunityLevel);
        } else if (this.currentScreen === "my_levels" && this.hoveredCommunityLevel != null) {
          this.playMyLevel(this.hoveredCommunityLevel);
        }
        return;
      }
      if (this.currentScreen === "two_player_menu") {
        if (this.hoveredTwoPlayerButton === "tag_mode") {
          this.startTagGame();
        } else if (this.hoveredTwoPlayerButton === "race_mode") {
          this.openLevelSelect("race");
        } else if (this.hoveredTwoPlayerButton === "customize") {
          this.openTwoPlayerCustomization();
        } else if (this.hoveredTwoPlayerButton === "back") {
          this.returnToTitle();
        }
        return;
      }
      if (this.currentScreen === "two_player_customization") {
        if (this.hoveredCustomizationButton === "done") {
          this.saveTwoPlayerCustomization();
        } else if (this.hoveredCustomizationButton === "back") {
          this.cancelTwoPlayerCustomization();
        } else if (this.hoveredCustomizationButton) {
          const [playerId, action] = this.hoveredCustomizationButton.split("_");
          if ((playerId === "red" || playerId === "blue") && (action === "prev" || action === "next")) {
            this.cycleTwoPlayerCustomizationVariant(playerId, action === "next" ? 1 : -1);
          }
        }
        return;
      }
      if (this.currentScreen === "leaderboard") {
        if (this.hoveredLeaderboardButton === "back") {
          this.openOnlineMenu();
        } else if (this.hoveredLeaderboardPeriodTab) {
          this.selectedLeaderboardPeriod = this.hoveredLeaderboardPeriodTab;
          this.refreshLeaderboardHover();
        }
        return;
      }
      if (this.currentScreen === "level_select") {
        if (this.hoveredLevelSelectButton === "back") {
          if (this.levelSelectContext === "race") {
            this.openTwoPlayerMenu();
          } else {
            this.returnToTitle();
          }
          return;
        }
        if (this.hoveredLevelSelectButton === "speedrun") {
          if (this.levelSelectContext !== "race") {
            this.startSpeedrun();
          }
          return;
        }
        if (this.hoveredLevelSelectButton === "blackout") {
          this.toggleBlackoutMode();
          return;
        }
        if (this.hoveredLevelCard !== null) {
          if (this.levelSelectContext === "race") {
            this.startRaceGame(this.hoveredLevelCard, this.gameMode === "blackout");
          } else {
            this.startGame(this.hoveredLevelCard, this.gameMode === "blackout" ? "blackout" : "campaign");
          }
        }
        return;
      }
      if (this.currentScreen === "customization") {
        if (this.hoveredCustomizationButton === "done") {
          this.saveCustomization();
        } else if (this.hoveredCustomizationButton === "back") {
          this.cancelCustomization();
        } else if (this.hoveredCustomizationButton === "prev_model") {
          this.cycleCustomizationVariant(-1);
        } else if (this.hoveredCustomizationButton === "next_model") {
          this.cycleCustomizationVariant(1);
        }
        return;
      }
      if (this.currentScreen === "game") {
        if (this.publishConfirmOpen) {
          if (this.hoveredPublishConfirmButton === "cancel") {
            this.closePublishConfirm();
          } else if (this.hoveredPublishConfirmButton === "publish") {
            this.closePublishConfirm();
            this.finishCommunityLevelPublish();
          }
          return;
        }
        if (this.homeConfirmOpen) {
          if (this.hoveredHomeConfirmButton === "cancel") {
            this.closeHomeConfirm();
          } else if (this.hoveredHomeConfirmButton === "leave") {
            this.closeHomeConfirm();
            this.returnToTitle();
          }
          return;
        }
        if (this.gameMode !== "tag" && this.completed && this.hoveredCompletionButton) {
          if (this.hoveredCompletionButton === "home") {
            this.returnFromGameHomeButton();
          } else if (this.hoveredCompletionButton === "replay") {
            this.resetLevel();
          } else if (this.hoveredCompletionButton === "publish_complete") {
            this.openPublishConfirm();
          } else if (this.hoveredCompletionButton === "next") {
            this.nextLevel();
          }
          return;
        }
        if (this.hoveredGameButton === "hud_toggle") {
          this.toggleHUDCollapsed();
          return;
        }
        if (!this.isTwoPlayerDrivingMode() && this.hoveredGameButton === "restart") {
          const canManualRestart = !this.completed && !this.goalTriggered && this.fireSequenceTimer <= 0 && !this.exploding;
          if (canManualRestart) {
            this.resetLevel();
          }
          return;
        }
        if (this.hoveredGameButton === "menu") {
          this.handleGameExit();
        }
      }
    }

    refreshTitleHover() {
      if (this.currentScreen !== "title" || !this.mouse.inside) {
        this.hoveredTitleButton = null;
        this.hoveredTitleOnlineButton = false;
        this.hoveredTitleUsernameButton = null;
        this.hoveredSignOutConfirmButton = null;
        this.canvas.style.cursor = "default";
        return;
      }

      if (this.signOutConfirmOpen) {
        const hoveredConfirm = this.getSignOutConfirmButtons().find(
          (button) =>
            this.mouse.x >= button.x &&
            this.mouse.x <= button.x + button.w &&
            this.mouse.y >= button.y &&
            this.mouse.y <= button.y + button.h
        );
        this.hoveredTitleButton = null;
        this.hoveredTitleOnlineButton = false;
        this.hoveredTitleUsernameButton = null;
        this.hoveredSignOutConfirmButton = hoveredConfirm ? hoveredConfirm.id : null;
        this.canvas.style.cursor = hoveredConfirm ? "pointer" : "default";
        return;
      }

      const usernameLayout = this.getTitleUsernameLayout();
      const hoveredUsernameButton = usernameLayout.updateButton.visible &&
        this.mouse.x >= usernameLayout.updateButton.x &&
        this.mouse.x <= usernameLayout.updateButton.x + usernameLayout.updateButton.w &&
        this.mouse.y >= usernameLayout.updateButton.y &&
        this.mouse.y <= usernameLayout.updateButton.y + usernameLayout.updateButton.h;
      const hoveredAuthButton = usernameLayout.authButtons.find((button) =>
        button.visible &&
        this.mouse.x >= button.x &&
        this.mouse.x <= button.x + button.w &&
        this.mouse.y >= button.y &&
        this.mouse.y <= button.y + button.h
      );
      const hovered = this.getTitleButtons().find(
        (button) =>
          button.enabled !== false &&
          this.mouse.x >= button.x &&
          this.mouse.x <= button.x + button.w &&
          this.mouse.y >= button.y &&
          this.mouse.y <= button.y + button.h
      );
      this.hoveredTitleOnlineButton = false;
      this.hoveredTitleUsernameButton = hoveredUsernameButton ? "update_leaderboard_name" : (hoveredAuthButton ? hoveredAuthButton.id : null);
      this.hoveredTitleButton = this.hoveredTitleUsernameButton ? null : (hovered ? hovered.id : null);
      this.hoveredSignOutConfirmButton = null;
      this.canvas.style.cursor = hovered || this.hoveredTitleUsernameButton ? "pointer" : "default";
    }

    refreshOnlineHover() {
      if (!["online", "community_levels", "community_detail", "create_level", "my_levels"].includes(this.currentScreen) || !this.mouse.inside) {
        this.hoveredOnlineButton = null;
        this.hoveredCommunityLevel = null;
        this.hoveredCreatePublishPromptButton = null;
        this.canvas.style.cursor = "default";
        return;
      }

      if (this.currentScreen === "my_levels" && this.myLevelMessageDialog) {
        const closeButton = this.getMyLevelMessageDialogLayout().closeButton;
        const hoveredDialogButton = this.mouse.x >= closeButton.x &&
          this.mouse.x <= closeButton.x + closeButton.w &&
          this.mouse.y >= closeButton.y &&
          this.mouse.y <= closeButton.y + closeButton.h;
        this.hoveredOnlineButton = hoveredDialogButton ? closeButton.id : null;
        this.hoveredCommunityLevel = null;
        this.hoveredCreatePublishPromptButton = null;
        this.canvas.style.cursor = hoveredDialogButton ? "pointer" : "default";
        return;
      }

      if (this.currentScreen === "create_level" && this.createPublishPromptOpen) {
        const hoveredPromptButton = this.getCreatePublishPromptButtons().find(
          (button) =>
            this.mouse.x >= button.x &&
            this.mouse.x <= button.x + button.w &&
            this.mouse.y >= button.y &&
            this.mouse.y <= button.y + button.h
        );
        this.hoveredOnlineButton = null;
        this.hoveredCommunityLevel = null;
        this.hoveredCreatePublishPromptButton = hoveredPromptButton ? hoveredPromptButton.id : null;
        this.canvas.style.cursor = hoveredPromptButton ? "pointer" : "default";
        return;
      }

      const buttons = this.currentScreen === "online"
        ? [this.getOnlineBackButton(), ...this.getOnlineMenuButtons()]
        : this.currentScreen === "my_levels"
          ? [
              this.getOnlineBackButton(),
              this.getMyLevelsCreateButton(),
              ...this.getMyLevelCards()
                .filter((card) => card.submissionStatus === "declined")
                .map((card) => ({
                  id: `my_level_status_${card.index}`,
                  x: card.statusRect.x,
                  y: card.statusRect.y,
                  w: card.statusRect.w,
                  h: card.statusRect.h,
                })),
            ]
        : this.currentScreen === "create_level"
          ? [
              this.getOnlineBackButton(),
              this.getCreateLevelLayout().copyButton,
              this.getCreateLevelLayout().publishButton,
              this.getCreateLevelLayout().runButton,
            ]
          : this.currentScreen === "community_detail"
            ? [this.getOnlineBackButton(), this.getCommunityDetailPlayButton()]
            : [this.getOnlineBackButton()];
      const hoveredButton = buttons.find(
        (button) =>
          this.mouse.x >= button.x &&
          this.mouse.x <= button.x + button.w &&
          this.mouse.y >= button.y &&
          this.mouse.y <= button.y + button.h
      );
      const hoveredCard = (this.currentScreen === "community_levels"
        ? this.getCommunityLevelCards()
        : this.currentScreen === "my_levels"
          ? this.getMyLevelCards()
          : []).find(
            (card) =>
              this.mouse.x >= card.x &&
              this.mouse.x <= card.x + card.w &&
              this.mouse.y >= card.y &&
              this.mouse.y <= card.y + card.h
          );
      this.hoveredOnlineButton = hoveredButton ? hoveredButton.id : null;
      this.hoveredCommunityLevel = hoveredCard ? hoveredCard.index : null;
      this.hoveredCreatePublishPromptButton = null;
      this.canvas.style.cursor = hoveredButton || hoveredCard ? "pointer" : "default";
    }

    refreshTwoPlayerHover() {
      if (this.currentScreen !== "two_player_menu" || !this.mouse.inside) {
        this.hoveredTwoPlayerButton = null;
        this.canvas.style.cursor = "default";
        return;
      }

      const hovered = this.getTwoPlayerButtons().find(
        (button) =>
          this.mouse.x >= button.x &&
          this.mouse.x <= button.x + button.w &&
          this.mouse.y >= button.y &&
          this.mouse.y <= button.y + button.h
      );
      this.hoveredTwoPlayerButton = hovered ? hovered.id : null;
      this.canvas.style.cursor = hovered ? "pointer" : "default";
    }

    refreshLeaderboardHover() {
      if (this.currentScreen !== "leaderboard" || !this.mouse.inside) {
        this.hoveredLeaderboardButton = null;
        this.hoveredLeaderboardPeriodTab = null;
        this.canvas.style.cursor = "default";
        return;
      }

      const hoveredTab = this.getLeaderboardPeriodTabs().find(
        (tab) =>
          this.mouse.x >= tab.x &&
          this.mouse.x <= tab.x + tab.w &&
          this.mouse.y >= tab.y &&
          this.mouse.y <= tab.y + tab.h
      );
      const hovered = this.getLeaderboardButtons().find(
        (button) =>
          this.mouse.x >= button.x &&
          this.mouse.x <= button.x + button.w &&
          this.mouse.y >= button.y &&
          this.mouse.y <= button.y + button.h
      );
      this.hoveredLeaderboardButton = hovered ? hovered.id : null;
      this.hoveredLeaderboardPeriodTab = hoveredTab ? hoveredTab.id : null;
      this.canvas.style.cursor = hovered || hoveredTab ? "pointer" : "default";
    }

    refreshLevelSelectHover() {
      if (this.currentScreen !== "level_select" || !this.mouse.inside) {
        this.hoveredLevelCard = null;
        this.hoveredLevelSelectButton = null;
        this.canvas.style.cursor = "default";
        return;
      }

      const backButton = this.getLevelSelectBackButton();
      const hoveredBack =
        this.mouse.x >= backButton.x &&
        this.mouse.x <= backButton.x + backButton.w &&
        this.mouse.y >= backButton.y &&
        this.mouse.y <= backButton.y + backButton.h;

      const hoveredCard = this.getLevelSelectCards().find(
        (card) =>
          card.unlocked &&
          this.mouse.x >= card.x &&
          this.mouse.x <= card.x + card.w &&
          this.mouse.y >= card.y &&
          this.mouse.y <= card.y + card.h
      );
      const speedrunButton = this.getLevelSelectSpeedrunButton();
      const blackoutButton = this.getLevelSelectBlackoutButton();
      const hoveredSpeedrun = speedrunButton.visible !== false &&
        speedrunButton.enabled &&
        this.mouse.x >= speedrunButton.x &&
        this.mouse.x <= speedrunButton.x + speedrunButton.w &&
        this.mouse.y >= speedrunButton.y &&
        this.mouse.y <= speedrunButton.y + speedrunButton.h;
      const hoveredBlackout = blackoutButton.enabled &&
        this.mouse.x >= blackoutButton.x &&
        this.mouse.x <= blackoutButton.x + blackoutButton.w &&
        this.mouse.y >= blackoutButton.y &&
        this.mouse.y <= blackoutButton.y + blackoutButton.h;

      this.hoveredLevelSelectButton = hoveredBack ? backButton.id : hoveredSpeedrun ? speedrunButton.id : hoveredBlackout ? blackoutButton.id : null;
      this.hoveredLevelCard = hoveredCard ? hoveredCard.index : null;
      this.canvas.style.cursor = hoveredBack || hoveredCard || hoveredSpeedrun || hoveredBlackout ? "pointer" : "default";
    }

    refreshGameHover() {
      if (this.currentScreen !== "game" || !this.mouse.inside) {
        this.hoveredGameButton = null;
        this.hoveredCompletionButton = null;
        this.hoveredHomeConfirmButton = null;
        this.hoveredPublishConfirmButton = null;
        this.canvas.style.cursor = "default";
        return;
      }

      if (this.publishConfirmOpen) {
        const hoveredConfirm = this.getPublishConfirmButtons().find(
          (button) =>
            this.mouse.x >= button.x &&
            this.mouse.x <= button.x + button.w &&
            this.mouse.y >= button.y &&
            this.mouse.y <= button.y + button.h
        );
        this.hoveredGameButton = null;
        this.hoveredCompletionButton = null;
        this.hoveredHomeConfirmButton = null;
        this.hoveredPublishConfirmButton = hoveredConfirm ? hoveredConfirm.id : null;
        this.canvas.style.cursor = hoveredConfirm ? "pointer" : "default";
        return;
      }

      if (this.homeConfirmOpen) {
        const hoveredConfirm = this.getHomeConfirmButtons().find(
          (button) =>
            this.mouse.x >= button.x &&
            this.mouse.x <= button.x + button.w &&
            this.mouse.y >= button.y &&
            this.mouse.y <= button.y + button.h
        );
        this.hoveredGameButton = null;
        this.hoveredCompletionButton = null;
        this.hoveredHomeConfirmButton = hoveredConfirm ? hoveredConfirm.id : null;
        this.hoveredPublishConfirmButton = null;
        this.canvas.style.cursor = hoveredConfirm ? "pointer" : "default";
        return;
      }

      if (this.gameMode !== "tag" && this.completed && this.levelCompletionSummary) {
        const hoveredCompletion = this.getCampaignCompleteButtons().find(
          (button) =>
            this.mouse.x >= button.x &&
            this.mouse.x <= button.x + button.w &&
            this.mouse.y >= button.y &&
            this.mouse.y <= button.y + button.h
        );
        this.hoveredGameButton = null;
        this.hoveredCompletionButton = hoveredCompletion ? hoveredCompletion.id : null;
        this.hoveredPublishConfirmButton = null;
        this.canvas.style.cursor = hoveredCompletion ? "pointer" : "default";
        return;
      }

      const hudToggleButton = this.getHUDToggleButton();
      const hoveredHudToggle = hudToggleButton &&
        this.mouse.x >= hudToggleButton.x &&
        this.mouse.x <= hudToggleButton.x + hudToggleButton.w &&
        this.mouse.y >= hudToggleButton.y &&
        this.mouse.y <= hudToggleButton.y + hudToggleButton.h;
      const button = this.getGameExitButton();
      const hoveredMenu =
        this.mouse.x >= button.x &&
        this.mouse.x <= button.x + button.w &&
        this.mouse.y >= button.y &&
        this.mouse.y <= button.y + button.h;
      const restartButton = this.isTwoPlayerDrivingMode() ? null : this.getGameRestartButton();
      const hoveredRestart = restartButton &&
        this.mouse.x >= restartButton.x &&
        this.mouse.x <= restartButton.x + restartButton.w &&
        this.mouse.y >= restartButton.y &&
        this.mouse.y <= restartButton.y + restartButton.h;
      this.hoveredGameButton = hoveredHudToggle
        ? hudToggleButton.id
        : hoveredRestart
          ? restartButton.id
          : hoveredMenu
            ? button.id
            : null;
      this.canvas.style.cursor = hoveredHudToggle || hoveredRestart || hoveredMenu ? "pointer" : "default";
    }

    refreshCustomizationHover() {
      if (this.currentScreen !== "customization" || !this.mouse.inside) {
        this.hoveredCustomizationButton = null;
        this.canvas.style.cursor = "default";
        return;
      }

      const hoveredButton = [...this.getCustomizationButtons(), ...this.getCustomizationArrowButtons()].find(
        (button) =>
          this.mouse.x >= button.x &&
          this.mouse.x <= button.x + button.w &&
          this.mouse.y >= button.y &&
          this.mouse.y <= button.y + button.h
      );
      const picker = this.getCustomizationColorPickerRect();
      const hoveredPicker =
        this.mouse.x >= picker.x &&
        this.mouse.x <= picker.x + picker.w &&
        this.mouse.y >= picker.y &&
        this.mouse.y <= picker.y + picker.h;
      this.hoveredCustomizationButton = hoveredButton ? hoveredButton.id : null;
      this.canvas.style.cursor = hoveredButton || hoveredPicker ? "pointer" : "default";
    }

    refreshTwoPlayerCustomizationHover() {
      if (this.currentScreen !== "two_player_customization" || !this.mouse.inside) {
        this.hoveredCustomizationButton = null;
        this.canvas.style.cursor = "default";
        return;
      }

      const buttons = [
        ...this.getTwoPlayerCustomizationButtons(),
        ...this.getTwoPlayerCustomizationArrowButtons(),
      ];
      const hoveredButton = buttons.find((button) => this.isPointInsideRect(this.mouse.x, this.mouse.y, button));
      const hoveredPicker = this.getTwoPlayerCustomizationCards().find((card) =>
        this.isPointInsideRect(this.mouse.x, this.mouse.y, card.picker)
      );
      this.hoveredCustomizationButton = hoveredButton ? hoveredButton.id : null;
      this.canvas.style.cursor = hoveredButton || hoveredPicker ? "pointer" : "default";
    }

    handleCanvasClick(event) {
      const point = this.getCanvasPointFromClient(event.clientX, event.clientY);
      this.handleCanvasTapAt(point.x, point.y);
    }

    canUseTouchJoystick() {
      return this.currentScreen === "game" &&
        !this.isTwoPlayerDrivingMode() &&
        !this.completed &&
        !this.homeConfirmOpen &&
        !this.publishConfirmOpen &&
        !this.goalTriggered &&
        this.fireSequenceTimer <= 0 &&
        !this.exploding;
    }

    canUseTagTouchJoystick(player) {
      return this.currentScreen === "game" &&
        this.isTwoPlayerDrivingMode() &&
        !this.homeConfirmOpen &&
        !this.publishConfirmOpen &&
        !this.completed &&
        !this.goalTriggered &&
        !this.tagMatchFinished &&
        player &&
        player.fireSequenceTimer <= 0 &&
        !player.exploding;
    }

    resetTouchJoystick(joystick = this.touchJoystick) {
      joystick.active = false;
      joystick.touchId = null;
      joystick.baseX = 0;
      joystick.baseY = 0;
      joystick.knobX = 0;
      joystick.knobY = 0;
      joystick.inputX = 0;
      joystick.inputY = 0;
      joystick.steer = 0;
      joystick.throttle = 0;
      joystick.reverseLatched = false;
    }

    resetAllTouchJoysticks() {
      this.resetTouchJoystick(this.touchJoystick);
      for (const player of this.tagCars) {
        this.resetTouchJoystick(player.touchJoystick);
      }
    }

    startTouchJoystick(joystick, touchId, x, y) {
      joystick.active = true;
      joystick.touchId = touchId;
      joystick.baseX = x;
      joystick.baseY = y;
      joystick.knobX = x;
      joystick.knobY = y;
      joystick.inputX = 0;
      joystick.inputY = 0;
      joystick.steer = 0;
      joystick.throttle = 0;
      joystick.reverseLatched = false;
    }

    updateTouchJoystick(joystick, x, y) {
      if (!joystick.active) {
        return;
      }
      const radius = 64;
      const deadZone = 0.14;
      const deltaX = x - joystick.baseX;
      const deltaY = y - joystick.baseY;
      const distance = Math.hypot(deltaX, deltaY);
      const limitedDistance = Math.min(distance, radius);
      const scale = distance > 0.001 ? limitedDistance / distance : 0;
      const offsetX = deltaX * scale;
      const offsetY = deltaY * scale;
      const magnitude = clamp(limitedDistance / radius, 0, 1);
      const remappedMagnitude = magnitude <= deadZone
        ? 0
        : (magnitude - deadZone) / (1 - deadZone);
      const directionX = distance > 0.001 ? deltaX / distance : 0;
      const directionY = distance > 0.001 ? deltaY / distance : 0;
      joystick.knobX = joystick.baseX + offsetX;
      joystick.knobY = joystick.baseY + offsetY;
      joystick.inputX = directionX * remappedMagnitude;
      joystick.inputY = directionY * remappedMagnitude;
    }

    getTouchJoystickDriveBasis(car, joystick) {
      const facingX = Math.cos(car.angle);
      const facingY = Math.sin(car.angle);
      const reverseEnterThreshold = -Math.cos(TOUCH_JOYSTICK_REVERSE_ENTER_ANGLE);
      const reverseHoldThreshold = -Math.cos(TOUCH_JOYSTICK_REVERSE_HOLD_ANGLE);
      return {
        forwardX: facingX,
        forwardY: facingY,
        rightX: -facingY,
        rightY: facingX,
        reverseEnterThreshold,
        reverseHoldThreshold,
        reverseThreshold: joystick.reverseLatched ? reverseHoldThreshold : reverseEnterThreshold,
      };
    }

    getTouchJoystickTargetMarker(car, joystick, enabled = true) {
      if (!enabled || !joystick.active) {
        return null;
      }
      const inputX = joystick.inputX;
      const inputY = joystick.inputY;
      const pullAmount = clamp(Math.hypot(inputX, inputY), 0, 1);
      if (pullAmount <= 0.001) {
        return null;
      }
      const direction = normalize(inputX, inputY);
      return {
        x: car.x + direction.x * TOUCH_JOYSTICK_TARGET_DISTANCE,
        y: car.y + direction.y * TOUCH_JOYSTICK_TARGET_DISTANCE,
        directionX: direction.x,
        directionY: direction.y,
        pullAmount,
      };
    }

    getTouchJoystickControlState(car, joystick, fallbackControlState = null, enabled = true) {
      const targetMarker = this.getTouchJoystickTargetMarker(car, joystick, enabled);
      if (targetMarker) {
        const basis = this.getTouchJoystickDriveBasis(car, joystick);
        const toMarkerX = targetMarker.x - car.x;
        const toMarkerY = targetMarker.y - car.y;
        const targetAngle = Math.atan2(toMarkerY, toMarkerX);
        const reverseAlignment = dot(targetMarker.directionX, targetMarker.directionY, basis.forwardX, basis.forwardY);
        const reversing = reverseAlignment <= basis.reverseThreshold;
        joystick.reverseLatched = reversing;
        const controlAngle = reversing ? car.angle + Math.PI : car.angle;
        const angleDelta = shortestAngleDelta(controlAngle, targetAngle);
        const touchSteer = clamp((reversing ? -angleDelta : angleDelta) / TOUCH_JOYSTICK_FULL_STEER_ANGLE, -1, 1);
        const throttleMagnitude = targetMarker.pullAmount >= 0.95 ? 1 : targetMarker.pullAmount;
        return {
          throttle: reversing ? -throttleMagnitude : throttleMagnitude,
          steer: touchSteer,
        };
      }
      joystick.reverseLatched = false;
      return fallbackControlState;
    }

    getSinglePlayerControlState() {
      return this.getTouchJoystickControlState(
        this.car,
        this.touchJoystick,
        {
          throttle: this.input.getThrottle(),
          steer: this.input.getSteer(),
        },
        this.canUseTouchJoystick()
      );
    }

    getTagTouchPlayerForPoint(x) {
      if (x < this.width * 0.5) {
        return this.getTagPlayer("red");
      }
      return this.getTagPlayer("blue");
    }

    getTagTouchPlayerByTouchId(touchId) {
      return this.tagCars.find((player) => player.touchJoystick.active && player.touchJoystick.touchId === touchId) || null;
    }

    isPointInsideRect(x, y, rect) {
      return rect &&
        x >= rect.x &&
        x <= rect.x + rect.w &&
        y >= rect.y &&
        y <= rect.y + rect.h;
    }

    isTouchPointOnGameUI(x, y) {
      if (this.currentScreen !== "game") {
        return false;
      }
      if (this.homeConfirmOpen) {
        return this.getHomeConfirmButtons().some((button) => this.isPointInsideRect(x, y, button));
      }
      if (this.publishConfirmOpen) {
        return this.getPublishConfirmButtons().some((button) => this.isPointInsideRect(x, y, button));
      }
      if (this.gameMode !== "tag" && this.completed && this.levelCompletionSummary) {
        return this.getCampaignCompleteButtons().some((button) => this.isPointInsideRect(x, y, button));
      }
      const exitButton = this.getGameExitButton();
      if (this.isPointInsideRect(x, y, exitButton)) {
        return true;
      }
      const restartButton = this.isTwoPlayerDrivingMode() ? null : this.getGameRestartButton();
      if (restartButton && this.isPointInsideRect(x, y, restartButton)) {
        return true;
      }
      const hudToggleButton = this.getHUDToggleButton();
      return this.isPointInsideRect(x, y, hudToggleButton);
    }

    onCanvasTouchStart(event) {
      if (event.changedTouches.length === 0) {
        return;
      }
      const firstTouch = event.changedTouches[0];
      const firstPoint = this.getCanvasPointFromClient(firstTouch.clientX, firstTouch.clientY);
      this.setPointerPosition(firstPoint.x, firstPoint.y, true);
      this.mouse.down = true;

      if (this.isScrollableOnlineListScreen() && this.isPointInsideOnlineLevelListViewport(firstPoint.x, firstPoint.y)) {
        this.onlineLevelListTouch = {
          id: firstTouch.identifier,
          startY: firstPoint.y,
          lastY: firstPoint.y,
          moved: false,
        };
      }

      for (const touch of event.changedTouches) {
        const point = this.getCanvasPointFromClient(touch.clientX, touch.clientY);
        if (this.isTouchPointOnGameUI(point.x, point.y)) {
          continue;
        }
        if (this.isTwoPlayerDrivingMode()) {
          const player = this.getTagTouchPlayerForPoint(point.x);
          if (player && !player.touchJoystick.active && this.canUseTagTouchJoystick(player)) {
            this.startTouchJoystick(player.touchJoystick, touch.identifier, point.x, point.y);
          }
        } else if (!this.touchJoystick.active && this.canUseTouchJoystick()) {
          this.startTouchJoystick(this.touchJoystick, touch.identifier, point.x, point.y);
        }
      }

      if (event.cancelable) {
        event.preventDefault();
      }
    }

    onCanvasTouchMove(event) {
      if (event.touches.length === 0) {
        return;
      }
      const primaryTouch = event.touches[0];
      const primaryPoint = this.getCanvasPointFromClient(primaryTouch.clientX, primaryTouch.clientY);
      this.setPointerPosition(primaryPoint.x, primaryPoint.y, true);

      if (this.isScrollableOnlineListScreen() && this.onlineLevelListTouch.id != null) {
        const scrollTouch = Array.from(event.touches).find((touch) => touch.identifier === this.onlineLevelListTouch.id);
        if (scrollTouch) {
          const point = this.getCanvasPointFromClient(scrollTouch.clientX, scrollTouch.clientY);
          const deltaY = point.y - this.onlineLevelListTouch.lastY;
          if (Math.abs(deltaY) > 0.001) {
            this.scrollOnlineLevelListBy(-deltaY);
            this.onlineLevelListTouch.moved = this.onlineLevelListTouch.moved || Math.abs(point.y - this.onlineLevelListTouch.startY) > 6;
            this.onlineLevelListTouch.lastY = point.y;
          }
        }
      }

      for (const touch of event.touches) {
        const point = this.getCanvasPointFromClient(touch.clientX, touch.clientY);
        if (this.isTwoPlayerDrivingMode()) {
          const player = this.getTagTouchPlayerByTouchId(touch.identifier);
          if (player) {
            this.updateTouchJoystick(player.touchJoystick, point.x, point.y);
          }
        } else if (this.touchJoystick.active && touch.identifier === this.touchJoystick.touchId) {
          this.updateTouchJoystick(this.touchJoystick, point.x, point.y);
        }
      }

      if (event.cancelable) {
        event.preventDefault();
      }
    }

    onCanvasTouchEnd(event) {
      let handledJoystick = false;
      for (const touch of event.changedTouches) {
        const point = this.getCanvasPointFromClient(touch.clientX, touch.clientY);
        if (this.onlineLevelListTouch.id === touch.identifier) {
          const moved = this.onlineLevelListTouch.moved;
          this.onlineLevelListTouch = { id: null, startY: 0, lastY: 0, moved: false };
          if (moved) {
            continue;
          }
        }
        if (this.isTwoPlayerDrivingMode()) {
          const player = this.getTagTouchPlayerByTouchId(touch.identifier);
          if (player) {
            handledJoystick = true;
            this.resetTouchJoystick(player.touchJoystick);
            continue;
          }
        } else if (this.touchJoystick.active && touch.identifier === this.touchJoystick.touchId) {
          handledJoystick = true;
          this.resetTouchJoystick(this.touchJoystick);
          continue;
        }
        this.handleCanvasTapAt(point.x, point.y);
      }

      if (event.touches.length > 0) {
        const point = this.getCanvasPointFromClient(event.touches[0].clientX, event.touches[0].clientY);
        this.setPointerPosition(point.x, point.y, true);
      } else {
        this.mouse.down = false;
      }

      if (handledJoystick && event.touches.length === 0) {
        this.refreshGameHover();
      }

      if (event.cancelable) {
        event.preventDefault();
      }
    }

    onCanvasTouchCancel(event) {
      this.onlineLevelListTouch = { id: null, startY: 0, lastY: 0, moved: false };
      this.resetAllTouchJoysticks();
      this.mouse.down = false;
      if (event.cancelable) {
        event.preventDefault();
      }
    }

    openLevelSelect(context = "single") {
      this.beginScreenWipe(() => {
        this.currentScreen = "level_select";
        this.levelSelectContext = context;
        this.raceWinner = null;
        this.gameMode = "campaign";
        this.hoveredTitleButton = null;
        this.hoveredLevelCard = null;
        this.hoveredLevelSelectButton = null;
        this.levelSelectBackHover = 0;
        this.levelSelectSpeedrunHover = 0;
        this.levelSelectBlackoutHover = 0;
        this.canvas.style.cursor = "default";
        this.refreshLevelSelectHover();
      });
    }

    openTwoPlayerMenu() {
      this.beginScreenWipe(() => {
        this.currentScreen = "two_player_menu";
        this.hoveredTitleButton = null;
        this.hoveredTwoPlayerButton = null;
        this.twoPlayerNotice = "";
        this.twoPlayerNoticeTimer = 0;
        this.canvas.style.cursor = "default";
        this.updateCustomizationPickerVisibility();
        this.refreshTwoPlayerHover();
      });
    }

    openLeaderboard() {
      this.beginScreenWipe(() => {
        this.currentScreen = "leaderboard";
        this.hoveredTitleButton = null;
        this.hoveredLeaderboardButton = null;
        this.hoveredLeaderboardPeriodTab = null;
        this.leaderboardBackHover = 0;
        this.canvas.style.cursor = "default";
        this.refreshLeaderboardHover();
        this.syncOnlineLeaderboard();
      });
    }

    openOnlineMenu() {
      this.beginScreenWipe(() => {
        this.currentScreen = "online";
        this.hoveredTitleButton = null;
        this.hoveredTitleOnlineButton = false;
        this.hoveredOnlineButton = null;
        this.hoveredCommunityLevel = null;
        this.onlineBackHover = 0;
        this.onlineCommunityHover = 0;
        this.onlineCreateHover = 0;
        this.onlineLeaderboardHover = 0;
        this.myLevelsCreateHover = 0;
        this.myLevelMessageCloseHover = 0;
        this.myLevelMessageDialog = null;
        this.activeCommunityLevel = null;
        this.communityLevelReturnScreen = "community_levels";
        this.canvas.style.cursor = "default";
        this.refreshOnlineHover();
      });
    }

    openCommunityLevels() {
      this.beginScreenWipe(() => {
        this.currentScreen = "community_levels";
        this.hoveredOnlineButton = null;
        this.hoveredCommunityLevel = null;
        this.activeCommunityLevel = null;
        this.onlineBackHover = 0;
        this.communityLevelHovers = this.communityLevels.map(() => 0);
        this.myLevelMessageDialog = null;
        this.canvas.style.cursor = "default";
        this.refreshOnlineHover();
        this.syncOnlineCommunityLevels();
      });
    }

    openMyLevels() {
      this.beginScreenWipe(() => {
        this.currentScreen = "my_levels";
        this.hoveredOnlineButton = null;
        this.hoveredCommunityLevel = null;
        this.activeCommunityLevel = null;
        this.onlineBackHover = 0;
        this.myLevelsCreateHover = 0;
        this.myLevelMessageCloseHover = 0;
        this.myLevelMessageDialog = null;
        this.communityLevelHovers = this.getMyCreatedLevels().map(() => 0);
        this.canvas.style.cursor = "default";
        this.refreshOnlineHover();
        this.syncOnlineCommunityLevels();
        this.syncOnlineMyLevels();
      });
    }

    openCommunityLevelDetail(index) {
      if (!this.communityLevels[index]) {
        return;
      }
      this.beginScreenWipe(() => {
        this.currentScreen = "community_detail";
        this.selectedCommunityLevelIndex = index;
        this.hoveredOnlineButton = null;
        this.hoveredCommunityLevel = null;
        this.onlineBackHover = 0;
        this.communityDetailPlayHover = 0;
        this.canvas.style.cursor = "default";
        this.refreshOnlineHover();
      });
    }

    openCreateLevel(returnScreen = "online") {
      this.beginScreenWipe(() => {
        this.currentScreen = "create_level";
        this.createLevelReturnScreen = returnScreen === "my_levels" ? "my_levels" : "online";
        this.hoveredOnlineButton = null;
        this.hoveredCommunityLevel = null;
        this.onlineBackHover = 0;
        this.customLevelRunHover = 0;
        this.customLevelCopyHover = 0;
        this.customLevelPublishHover = 0;
        this.createPublishPromptOpen = false;
        this.hoveredCreatePublishPromptButton = null;
        this.createPublishPromptBackHover = 0;
        this.createPublishPromptContinueHover = 0;
        this.pendingPublishValidationDefinition = null;
        this.canvas.style.cursor = "default";
        this.customLevelInput.value = this.customLevelTestText;
        this.publishLevelNameInput.value = this.publishLevelName;
        this.publishLevelInput.value = this.publishLevelText;
        this.refreshOnlineHover();
      });
    }

    playCommunityLevelEntry(level, selectedIndex = null, returnScreen = "community_levels") {
      if (!level || !Array.isArray(level.map)) {
        return;
      }
      this.beginScreenWipe(() => {
        this.currentScreen = "game";
        this.gameMode = "community";
        this.selectedCommunityLevelIndex = Number.isInteger(selectedIndex) ? selectedIndex : null;
        this.activeCommunityLevel = { ...level };
        this.communityLevelReturnScreen = returnScreen;
        this.hoveredOnlineButton = null;
        this.hoveredCommunityLevel = null;
        this.hoveredGameButton = null;
        this.hoveredCompletionButton = null;
        this.hoveredHomeConfirmButton = null;
        this.hoveredPublishConfirmButton = null;
        this.publishConfirmOpen = false;
        this.canvas.style.cursor = "default";
        this.loadCustomLevel({
          name: level.name,
          startAngle: Number.isFinite(level.startAngle) ? level.startAngle : 0,
          map: level.map,
        });
      });
    }

    playSelectedCommunityLevel() {
      const level = this.communityLevels[this.selectedCommunityLevelIndex];
      const returnScreen = this.currentScreen === "community_detail" ? "community_detail" : "community_levels";
      this.playCommunityLevelEntry(level, this.selectedCommunityLevelIndex, returnScreen);
    }

    playMyLevel(index) {
      const level = this.getMyCreatedLevels()[index];
      this.playCommunityLevelEntry(level, null, "my_levels");
    }

    openMyLevelMessageDialog(index) {
      const level = this.getMyCreatedLevels()[index];
      if (!level || level.submissionStatus !== "declined") {
        return;
      }
      this.myLevelMessageDialog = {
        title: "Declined",
        levelName: level.name,
        message: level.reviewMessage || "No admin note was provided for this decline.",
      };
      this.hoveredOnlineButton = null;
      this.refreshOnlineHover();
    }

    closeMyLevelMessageDialog() {
      this.myLevelMessageDialog = null;
      this.hoveredOnlineButton = null;
      this.myLevelMessageCloseHover = 0;
      this.refreshOnlineHover();
    }

    openCreatePublishPrompt(definition) {
      this.pendingPublishValidationDefinition = definition;
      this.createPublishPromptOpen = true;
      this.hoveredCreatePublishPromptButton = null;
      this.createPublishPromptBackHover = 0;
      this.createPublishPromptContinueHover = 0;
      if (document.activeElement === this.customLevelInput || document.activeElement === this.publishLevelNameInput || document.activeElement === this.publishLevelInput) {
        document.activeElement.blur();
      }
      this.canvas.style.cursor = "default";
      this.refreshOnlineHover();
    }

    closeCreatePublishPrompt() {
      this.createPublishPromptOpen = false;
      this.pendingPublishValidationDefinition = null;
      this.pendingCommunityLevel = null;
      this.hoveredCreatePublishPromptButton = null;
      this.createPublishPromptBackHover = 0;
      this.createPublishPromptContinueHover = 0;
      this.refreshOnlineHover();
    }

    beginPublishValidationRun() {
      if (!this.pendingPublishValidationDefinition) {
        return;
      }
      const pendingDefinition = this.pendingPublishValidationDefinition;
      this.createPublishPromptOpen = false;
      this.hoveredCreatePublishPromptButton = null;
      this.createPublishPromptBackHover = 0;
      this.createPublishPromptContinueHover = 0;
      this.pendingPublishValidationDefinition = null;
      this.customLevelStatusText = "Complete the level to unlock publishing.";
      this.customLevelStatusTone = "ok";
      this.beginScreenWipe(() => {
        this.currentScreen = "game";
        this.gameMode = "publish_test";
        this.hoveredOnlineButton = null;
        this.hoveredCommunityLevel = null;
        this.hoveredGameButton = null;
        this.hoveredCompletionButton = null;
        this.hoveredHomeConfirmButton = null;
        this.customLevelPublishHover = 0;
        this.canvas.style.cursor = "default";
        this.loadCustomLevel(pendingDefinition);
      });
    }

    startGame(levelIndex = this.levelIndex, mode = "campaign") {
      this.beginScreenWipe(() => {
        this.currentScreen = "game";
        this.gameMode = mode === "blackout" ? "blackout" : "campaign";
        this.hoveredTitleButton = null;
        this.hoveredTwoPlayerButton = null;
        this.hoveredGameButton = null;
        this.hoveredCompletionButton = null;
        this.hoveredHomeConfirmButton = null;
        this.hoveredLevelCard = null;
        this.hoveredLevelSelectButton = null;
        this.gameExitHover = 0;
        this.completionHomeHover = 0;
        this.completionReplayHover = 0;
        this.completionNextHover = 0;
        this.homeConfirmCancelHover = 0;
        this.homeConfirmLeaveHover = 0;
        this.hudToggleHover = 0;
        this.levelSelectBackHover = 0;
        this.levelSelectBlackoutHover = 0;
        this.canvas.style.cursor = "default";
        this.totalTimer = 0;
        this.totalDamage = 0;
        this.speedrunTimerStarted = false;
        this.homeConfirmOpen = false;
        this.hudCollapsed = false;
        this.hudCollapseAnim = 0;
        this.loadLevel(levelIndex);
      });
    }

    startSpeedrun() {
      const useBlackout = this.isBlackoutLevelSelectActive();
      this.beginScreenWipe(() => {
        this.currentScreen = "game";
        this.gameMode = useBlackout ? "blackout_speedrun" : "speedrun";
        this.hoveredTitleButton = null;
        this.hoveredTwoPlayerButton = null;
        this.hoveredGameButton = null;
        this.hoveredCompletionButton = null;
        this.hoveredHomeConfirmButton = null;
        this.hoveredLevelCard = null;
        this.hoveredLevelSelectButton = null;
        this.gameExitHover = 0;
        this.completionHomeHover = 0;
        this.completionReplayHover = 0;
        this.completionNextHover = 0;
        this.homeConfirmCancelHover = 0;
        this.homeConfirmLeaveHover = 0;
        this.hudToggleHover = 0;
        this.levelSelectBackHover = 0;
        this.levelSelectBlackoutHover = 0;
        this.canvas.style.cursor = "default";
        this.totalTimer = 0;
        this.totalDamage = 0;
        this.resetSpeedrunStats();
        this.speedrunTimerStarted = false;
        this.homeConfirmOpen = false;
        this.hudCollapsed = false;
        this.hudCollapseAnim = 0;
        this.loadLevel(0);
      });
    }

    toggleBlackoutMode() {
      if (this.currentScreen !== "level_select") {
        return;
      }
      this.gameMode = this.gameMode === "blackout" ? "campaign" : "blackout";
      this.refreshLevelSelectHover();
    }

    isSpeedrunMode(mode = this.gameMode) {
      return mode === "speedrun" || mode === "blackout_speedrun";
    }

    isRaceMode(mode = this.gameMode) {
      return mode === "race" || mode === "race_blackout";
    }

    isTwoPlayerDrivingMode(mode = this.gameMode) {
      return mode === "tag" || this.isRaceMode(mode);
    }

    isCustomLevelMode(mode = this.gameMode) {
      return mode === "custom" || mode === "publish_test" || mode === "community";
    }

    isCreateLevelPlaytestMode(mode = this.gameMode) {
      return mode === "custom" || mode === "publish_test";
    }

    isGameBackButtonMode(mode = this.gameMode) {
      return this.isCreateLevelPlaytestMode(mode) || mode === "community";
    }

    isBlackoutGameplayMode(mode = this.gameMode) {
      return mode === "blackout" || mode === "blackout_speedrun" || mode === "race_blackout";
    }

    isBlackoutLevelSelectActive() {
      return this.currentScreen === "level_select" && this.gameMode === "blackout";
    }

    renderBlackoutCursorGlow(ctx) {
      if (!this.isBlackoutLevelSelectActive() || !this.mouse.inside) {
        return;
      }

      const centerX = this.mouse.x;
      const centerY = this.mouse.y;
      const innerRadius = 18;
      const glowRadius = 150;

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const glow = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, glowRadius);
      glow.addColorStop(0, "rgba(255, 249, 225, 0.28)");
      glow.addColorStop(0.32, "rgba(214, 227, 245, 0.18)");
      glow.addColorStop(0.7, "rgba(120, 142, 170, 0.08)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(190, 206, 226, 0.14)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 58, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    startTagGame() {
      this.beginScreenWipe(() => {
        this.currentScreen = "game";
        this.gameMode = "tag";
        this.hoveredTitleButton = null;
        this.hoveredTwoPlayerButton = null;
        this.hoveredGameButton = null;
        this.hoveredCompletionButton = null;
        this.hoveredHomeConfirmButton = null;
        this.hoveredLevelCard = null;
        this.hoveredLevelSelectButton = null;
        this.gameExitHover = 0;
        this.completionHomeHover = 0;
        this.completionReplayHover = 0;
        this.completionNextHover = 0;
        this.homeConfirmCancelHover = 0;
        this.homeConfirmLeaveHover = 0;
        this.hudToggleHover = 0;
        this.levelSelectBackHover = 0;
        this.levelSelectBlackoutHover = 0;
        this.canvas.style.cursor = "default";
        this.totalTimer = 0;
        this.totalDamage = 0;
        this.twoPlayerNotice = "";
        this.twoPlayerNoticeTimer = 0;
        this.hudCollapsed = false;
        this.hudCollapseAnim = 0;
        this.loadTagLevel(Math.floor(Math.random() * TAG_LEVELS.length));
      });
    }

    startRaceGame(levelIndex = this.levelIndex, blackout = false) {
      this.beginScreenWipe(() => {
        this.currentScreen = "game";
        this.gameMode = blackout ? "race_blackout" : "race";
        this.hoveredTitleButton = null;
        this.hoveredTwoPlayerButton = null;
        this.hoveredGameButton = null;
        this.hoveredCompletionButton = null;
        this.hoveredHomeConfirmButton = null;
        this.hoveredLevelCard = null;
        this.hoveredLevelSelectButton = null;
        this.gameExitHover = 0;
        this.completionHomeHover = 0;
        this.completionReplayHover = 0;
        this.completionNextHover = 0;
        this.homeConfirmCancelHover = 0;
        this.homeConfirmLeaveHover = 0;
        this.hudToggleHover = 0;
        this.levelSelectBackHover = 0;
        this.levelSelectSpeedrunHover = 0;
        this.levelSelectBlackoutHover = 0;
        this.canvas.style.cursor = "default";
        this.totalTimer = 0;
        this.totalDamage = 0;
        this.raceWinner = null;
        this.twoPlayerNotice = "";
        this.twoPlayerNoticeTimer = 0;
        this.homeConfirmOpen = false;
        this.hudCollapsed = false;
        this.hudCollapseAnim = 0;
        this.loadRaceLevel(levelIndex);
      });
    }

    returnToTitle() {
      this.beginScreenWipe(() => {
        this.currentScreen = "title";
        this.gameMode = "campaign";
        this.levelSelectContext = "single";
        this.raceWinner = null;
        this.hoveredTitleButton = null;
        this.hoveredTitleOnlineButton = false;
        this.hoveredTitleUsernameButton = null;
        this.hoveredTwoPlayerButton = null;
        this.hoveredLeaderboardButton = null;
        this.hoveredOnlineButton = null;
        this.hoveredCommunityLevel = null;
        this.hoveredGameButton = null;
        this.hoveredCompletionButton = null;
        this.hoveredHomeConfirmButton = null;
        this.hoveredLevelCard = null;
        this.hoveredLevelSelectButton = null;
        this.hoveredCustomizationButton = null;
        this.gameExitHover = 0;
        this.completionHomeHover = 0;
        this.completionReplayHover = 0;
        this.completionNextHover = 0;
        this.homeConfirmCancelHover = 0;
        this.homeConfirmLeaveHover = 0;
        this.hudToggleHover = 0;
        this.levelSelectBackHover = 0;
        this.levelSelectBlackoutHover = 0;
        this.leaderboardBackHover = 0;
        this.titleOnlineHover = 0;
        this.titleLoginHover = 0;
        this.titleSignUpHover = 0;
        this.titleLogoutHover = 0;
        this.signOutConfirmOpen = false;
        this.hoveredSignOutConfirmButton = null;
        this.signOutConfirmCancelHover = 0;
        this.signOutConfirmLeaveHover = 0;
        this.onlineBackHover = 0;
        this.onlineCommunityHover = 0;
        this.onlineCreateHover = 0;
        this.myLevelsCreateHover = 0;
        this.myLevelMessageCloseHover = 0;
        this.communityDetailPlayHover = 0;
        this.customLevelRunHover = 0;
        this.customLevelCopyHover = 0;
        this.customLevelPublishHover = 0;
        this.myLevelMessageDialog = null;
        this.activeCommunityLevel = null;
        this.communityLevelReturnScreen = "community_levels";
        this.customizationDoneHover = 0;
        this.customizationBackHover = 0;
        this.customizationPrevHover = 0;
        this.customizationNextHover = 0;
        this.completed = false;
        this.levelCompletionSummary = null;
        this.speedrunTimerStarted = false;
        this.homeConfirmOpen = false;
        this.publishConfirmCancelHover = 0;
        this.publishConfirmPublishHover = 0;
        this.publishConfirmOpen = false;
        this.hoveredPublishConfirmButton = null;
        this.tagMatchFinished = false;
        this.tagWinnerText = "";
        this.tagTransferCooldown = 0;
        this.twoPlayerNotice = "";
        this.twoPlayerNoticeTimer = 0;
        this.hudCollapsed = false;
        this.hudCollapseAnim = 0;
        this.titleTrail.length = 0;
        this.titleTrailTimer = 0;
        this.titleBackdropPhase = Math.random() * Math.PI * 2;
        this.titleDrifter = this.createTitleDrifter();
        this.updateCustomizationPickerVisibility();
        this.refreshTitleHover();
      });
    }

    returnToCreateLevel() {
      this.resetAllTouchJoysticks();
      this.beginScreenWipe(() => {
        this.currentScreen = "create_level";
        this.gameMode = "campaign";
        this.hoveredOnlineButton = null;
        this.hoveredCommunityLevel = null;
        this.hoveredGameButton = null;
        this.hoveredCompletionButton = null;
        this.hoveredHomeConfirmButton = null;
        this.hoveredPublishConfirmButton = null;
        this.homeConfirmOpen = false;
        this.publishConfirmOpen = false;
        this.gameExitHover = 0;
        this.gameRestartHover = 0;
        this.completionHomeHover = 0;
        this.completionReplayHover = 0;
        this.completionNextHover = 0;
        this.homeConfirmCancelHover = 0;
        this.homeConfirmLeaveHover = 0;
        this.publishConfirmCancelHover = 0;
        this.publishConfirmPublishHover = 0;
        this.hudToggleHover = 0;
        this.customLevelRunHover = 0;
        this.customLevelCopyHover = 0;
        this.customLevelPublishHover = 0;
        this.createPublishPromptOpen = false;
        this.hoveredCreatePublishPromptButton = null;
        this.createPublishPromptBackHover = 0;
        this.createPublishPromptContinueHover = 0;
        this.pendingPublishValidationDefinition = null;
        this.myLevelMessageDialog = null;
        this.completed = false;
        this.levelCompletionSummary = null;
        this.hudCollapsed = false;
        this.hudCollapseAnim = 0;
        this.canvas.style.cursor = "default";
        this.customLevelInput.value = this.customLevelTestText;
        this.publishLevelNameInput.value = this.publishLevelName;
        this.publishLevelInput.value = this.publishLevelText;
        this.refreshOnlineHover();
      });
    }

    returnToCommunityLevelBrowser() {
      this.resetAllTouchJoysticks();
      this.beginScreenWipe(() => {
        const hasSelectedLevel = Number.isInteger(this.selectedCommunityLevelIndex) &&
          this.selectedCommunityLevelIndex >= 0 &&
          this.selectedCommunityLevelIndex < this.communityLevels.length;
        this.currentScreen = this.communityLevelReturnScreen === "my_levels"
          ? "my_levels"
          : this.communityLevelReturnScreen === "community_detail" && hasSelectedLevel
            ? "community_detail"
            : "community_levels";
        this.gameMode = "campaign";
        this.activeCommunityLevel = null;
        this.hoveredOnlineButton = null;
        this.hoveredCommunityLevel = null;
        this.hoveredGameButton = null;
        this.hoveredCompletionButton = null;
        this.hoveredHomeConfirmButton = null;
        this.hoveredPublishConfirmButton = null;
        this.homeConfirmOpen = false;
        this.publishConfirmOpen = false;
        this.gameExitHover = 0;
        this.gameRestartHover = 0;
        this.completionHomeHover = 0;
        this.completionReplayHover = 0;
        this.completionNextHover = 0;
        this.homeConfirmCancelHover = 0;
        this.homeConfirmLeaveHover = 0;
        this.publishConfirmCancelHover = 0;
        this.publishConfirmPublishHover = 0;
        this.hudToggleHover = 0;
        this.onlineBackHover = 0;
        this.communityDetailPlayHover = 0;
        this.completed = false;
        this.levelCompletionSummary = null;
        this.hudCollapsed = false;
        this.hudCollapseAnim = 0;
        this.canvas.style.cursor = "default";
        this.myLevelMessageDialog = null;
        if (this.currentScreen === "my_levels") {
          this.communityLevelHovers = this.getMyCreatedLevels().map(() => 0);
        }
        this.refreshOnlineHover();
      });
    }

    returnFromGameHomeButton() {
      if (this.isCreateLevelPlaytestMode()) {
        this.returnToCreateLevel();
        return;
      }
      if (this.gameMode === "community") {
        this.returnToCommunityLevelBrowser();
        return;
      }
      this.returnToTitle();
    }

    handleGameExit() {
      if (this.isGameBackButtonMode()) {
        this.returnFromGameHomeButton();
        return;
      }
      this.openHomeConfirm();
    }

    openHomeConfirm() {
      if (this.isGameBackButtonMode()) {
        this.returnFromGameHomeButton();
        return;
      }
      this.resetAllTouchJoysticks();
      this.homeConfirmOpen = true;
      this.publishConfirmOpen = false;
      this.hoveredGameButton = null;
      this.hoveredCompletionButton = null;
      this.hoveredHomeConfirmButton = null;
      this.hoveredPublishConfirmButton = null;
      this.refreshGameHover();
    }

    closeHomeConfirm() {
      this.homeConfirmOpen = false;
      this.hoveredHomeConfirmButton = null;
      this.homeConfirmCancelHover = 0;
      this.homeConfirmLeaveHover = 0;
      this.refreshGameHover();
    }

    openPublishConfirm() {
      if (!this.pendingCommunityLevel || !Number.isFinite(this.pendingCommunityLevel.bestTime)) {
        return;
      }
      this.resetAllTouchJoysticks();
      this.publishConfirmOpen = true;
      this.homeConfirmOpen = false;
      this.hoveredGameButton = null;
      this.hoveredCompletionButton = null;
      this.hoveredHomeConfirmButton = null;
      this.hoveredPublishConfirmButton = null;
      this.refreshGameHover();
    }

    closePublishConfirm() {
      this.publishConfirmOpen = false;
      this.hoveredPublishConfirmButton = null;
      this.publishConfirmCancelHover = 0;
      this.publishConfirmPublishHover = 0;
      this.refreshGameHover();
    }

    openCustomization() {
      this.beginScreenWipe(() => {
        this.currentScreen = "customization";
        this.hoveredTitleButton = null;
        this.hoveredCustomizationButton = null;
        this.customizationDoneHover = 0;
        this.customizationBackHover = 0;
        this.customizationPrevHover = 0;
        this.customizationNextHover = 0;
        this.customizationDraftColor = this.playerCarColor;
        this.customizationDraftVariant = this.playerCarVariant;
        this.colorInput.value = this.customizationDraftColor;
        this.updateCustomizationPickerVisibility();
        this.refreshCustomizationHover();
      });
    }

    openTwoPlayerCustomization() {
      this.beginScreenWipe(() => {
        this.currentScreen = "two_player_customization";
        this.hoveredTwoPlayerButton = null;
        this.hoveredCustomizationButton = null;
        this.customizationDoneHover = 0;
        this.customizationBackHover = 0;
        this.customizationPrevHover = 0;
        this.customizationNextHover = 0;
        this.twoPlayerCustomizationDrafts = {
          red: { ...this.getTwoPlayerCarSetting("red") },
          blue: { ...this.getTwoPlayerCarSetting("blue") },
        };
        this.updateCustomizationPickerVisibility();
        this.refreshTwoPlayerCustomizationHover();
      });
    }

    saveCustomization() {
      this.playerCarColor = this.customizationDraftColor;
      this.playerCarVariant = this.customizationDraftVariant;
      this.savePersistentProgress();
      this.returnToTitle();
    }

    cancelCustomization() {
      this.customizationDraftColor = this.playerCarColor;
      this.customizationDraftVariant = this.playerCarVariant;
      this.colorInput.value = this.playerCarColor;
      this.returnToTitle();
    }

    cycleCustomizationVariant(direction) {
      const currentIndex = CAR_VARIANTS.findIndex((variant) => variant.id === this.customizationDraftVariant);
      const nextIndex = (currentIndex + direction + CAR_VARIANTS.length) % CAR_VARIANTS.length;
      this.customizationDraftVariant = CAR_VARIANTS[nextIndex].id;
    }

    saveTwoPlayerCustomization() {
      for (const playerId of ["red", "blue"]) {
        const draft = this.twoPlayerCustomizationDrafts[playerId];
        const setting = this.getTwoPlayerCarSetting(playerId);
        this.twoPlayerCarSettings[playerId] = {
          color: isValidHexColor(draft?.color) ? draft.color : setting.color,
          variant: CAR_VARIANTS.some((variant) => variant.id === draft?.variant) ? draft.variant : setting.variant,
        };
        const player = this.getTagPlayer(playerId);
        if (player) {
          player.color = this.twoPlayerCarSettings[playerId].color;
          player.variant = this.twoPlayerCarSettings[playerId].variant;
        }
      }
      this.savePersistentProgress();
      this.openTwoPlayerMenu();
    }

    cancelTwoPlayerCustomization() {
      this.twoPlayerCustomizationDrafts = {
        red: { ...this.getTwoPlayerCarSetting("red") },
        blue: { ...this.getTwoPlayerCarSetting("blue") },
      };
      this.openTwoPlayerMenu();
    }

    cycleTwoPlayerCustomizationVariant(playerId, direction) {
      const draft = this.twoPlayerCustomizationDrafts[playerId];
      if (!draft) {
        return;
      }
      const currentIndex = CAR_VARIANTS.findIndex((variant) => variant.id === draft.variant);
      const safeIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex = (safeIndex + direction + CAR_VARIANTS.length) % CAR_VARIANTS.length;
      draft.variant = CAR_VARIANTS[nextIndex].id;
    }

    showTwoPlayerNotice(message) {
      this.twoPlayerNotice = message;
      this.twoPlayerNoticeTimer = 2.4;
    }

    beginScreenWipe(onCovered = null) {
      if (this.screenWipePhase !== "idle") {
        return false;
      }
      this.screenWipePhase = "cover";
      this.screenWipeTimer = 0;
      this.screenWipeAction = onCovered;
      this.canvas.style.cursor = "default";
      return true;
    }

    updateScreenWipe(dt) {
      if (this.screenWipePhase === "idle") {
        return false;
      }

      this.screenWipeTimer += dt;
      if (this.screenWipePhase === "cover" && this.screenWipeTimer >= SCREEN_WIPE_IN_TIME) {
        this.screenWipeTimer -= SCREEN_WIPE_IN_TIME;
        this.screenWipePhase = "hold";
        const action = this.screenWipeAction;
        this.screenWipeAction = null;
        if (action) {
          action();
        }
      }

      if (this.screenWipePhase === "hold" && this.screenWipeTimer >= SCREEN_WIPE_HOLD_TIME) {
        this.screenWipeTimer -= SCREEN_WIPE_HOLD_TIME;
        this.screenWipePhase = "reveal";
      }

      if (this.screenWipePhase === "reveal" && this.screenWipeTimer >= SCREEN_WIPE_OUT_TIME) {
        this.screenWipePhase = "idle";
        this.screenWipeTimer = 0;
        this.screenWipeAction = null;
      }

      return true;
    }

    resetWorldState() {
      this.resetAllTouchJoysticks();
      this.goalTimer = 0;
      this.skidMarks.length = 0;
      this.skidEmitTimer = 0;
      this.lastSkidLeft = null;
      this.lastSkidRight = null;
      this.damageSmoke.length = 0;
      this.damageFire.length = 0;
      this.explosionParticles.length = 0;
      this.smokeEmitTimer = 0;
      this.fireEmitTimer = 0;
      this.fireSequenceTimer = 0;
      this.explosionTimer = 0;
      this.exploding = false;
      this.finishDebris.length = 0;
      this.wallFlashes.clear();
      this.wallTouching = false;
      this.wallTouchingThisFrame = false;
      this.levelCompletionSummary = null;
      this.completionSceneTimer = 0;
      this.hoveredCompletionButton = null;
      this.hoveredHomeConfirmButton = null;
      this.completionHomeHover = 0;
      this.completionReplayHover = 0;
      this.completionNextHover = 0;
      this.homeConfirmCancelHover = 0;
      this.homeConfirmLeaveHover = 0;
      this.homeConfirmOpen = false;
      this.publishConfirmCancelHover = 0;
      this.publishConfirmPublishHover = 0;
      this.publishConfirmOpen = false;
      this.hoveredPublishConfirmButton = null;
      this.levelTimerStarted = false;
      this.levelTouchedWallThisRun = false;
      this.goalTriggered = false;
      this.raceCountdownTimer = 0;
      this.raceGoTimer = 0;
      this.shakeTime = 0;
      this.shakeStrength = 0;
      this.completed = false;
    }

    loadLevel(index) {
      this.levelIndex = index;
      const previousHighestVisitedLevel = this.highestVisitedLevel;
      this.highestVisitedLevel = Math.max(this.highestVisitedLevel, index);
      if (this.highestVisitedLevel !== previousHighestVisitedLevel) {
        this.savePersistentProgress();
      }
      this.level = new LevelMap(LEVELS[index]);
      this.levelTimer = 0;
      if (!this.isSpeedrunMode()) {
        this.totalDamage = 0;
      }
      this.resetWorldState();
      this.car.reset(this.level.start.x, this.level.start.y, this.level.startAngle);
      this.camera.snap(this.level.start.x, this.level.start.y);
    }

    loadCustomLevel(definition) {
      this.customTestLevelDefinition = definition;
      this.levelIndex = 0;
      this.level = new LevelMap(definition);
      this.levelTimer = 0;
      this.totalDamage = 0;
      this.resetWorldState();
      this.car.reset(this.level.start.x, this.level.start.y, this.level.startAngle);
      this.camera.snap(this.level.start.x, this.level.start.y);
    }

    parseCustomLevelText(text) {
      const rows = String(text || "")
        .split(/\r?\n/)
        .map((row) => row.trim())
        .filter((row) => row.length > 0);
      if (rows.length < 3) {
        return { error: "Add at least 3 rows." };
      }

      const width = rows[0].length;
      if (width < 3) {
        return { error: "Make the level at least 3 columns wide." };
      }
      if (!rows.every((row) => row.length === width)) {
        return { error: "Every row must be the same length." };
      }
      if (rows.length > 64 || width > 64) {
        return { error: "Keep test levels 64 by 64 tiles or smaller." };
      }

      let startCount = 0;
      let goalCount = 0;
      for (const row of rows) {
        for (const tile of row) {
          if (!"#.ISGXP".includes(tile)) {
            return { error: `Invalid tile "${tile}". Use # . I S G X or P.` };
          }
          if (tile === "S") {
            startCount += 1;
          } else if (tile === "G") {
            goalCount += 1;
          }
        }
      }
      if (startCount !== 1) {
        return { error: "Use exactly one S start tile." };
      }
      if (goalCount !== 1) {
        return { error: "Use exactly one G goal tile." };
      }

      return {
        definition: {
          name: "Custom Test Level",
          startAngle: 0,
          map: rows,
        },
      };
    }

    runPastedCustomLevel() {
      this.customLevelTestText = this.customLevelInput?.value ?? this.customLevelTestText;
      const parsed = this.parseCustomLevelText(this.customLevelTestText);
      if (parsed.error) {
        this.customLevelStatusText = parsed.error;
        this.customLevelStatusTone = "error";
        return;
      }

      this.customLevelStatusText = "Running test level...";
      this.customLevelStatusTone = "ok";
      this.beginScreenWipe(() => {
        this.currentScreen = "game";
        this.gameMode = "custom";
        this.hoveredOnlineButton = null;
        this.hoveredCommunityLevel = null;
        this.hoveredGameButton = null;
        this.hoveredCompletionButton = null;
        this.hoveredHomeConfirmButton = null;
        this.customLevelRunHover = 0;
        this.canvas.style.cursor = "default";
        this.loadCustomLevel(parsed.definition);
      });
    }

    publishCustomLevel() {
      this.publishLevelName = normalizeCommunityLevelName(this.publishLevelNameInput?.value ?? this.publishLevelName);
      this.publishLevelText = this.publishLevelInput?.value ?? this.publishLevelText;
      this.publishLevelNameInput.value = this.publishLevelName;

      if (!this.publishLevelName) {
        this.customLevelStatusText = "Give the level a name first.";
        this.customLevelStatusTone = "error";
        return;
      }

      const parsed = this.parseCustomLevelText(this.publishLevelText);
      if (parsed.error) {
        this.customLevelStatusText = parsed.error;
        this.customLevelStatusTone = "error";
        return;
      }

      this.pendingCommunityLevel = {
        name: this.publishLevelName,
        creator: this.playerUsername,
        startAngle: parsed.definition.startAngle,
        map: parsed.definition.map,
        bestTime: null,
      };
      this.openCreatePublishPrompt({
        ...parsed.definition,
        name: this.publishLevelName,
      });
    }

    async finishCommunityLevelPublish() {
      if (!this.pendingCommunityLevel || !Number.isFinite(this.pendingCommunityLevel.bestTime)) {
        return;
      }

      if (this.communityPublishRequestInFlight) {
        return;
      }

      if (this.isOnlineCommunityConfigured()) {
        this.communityPublishRequestInFlight = true;
        this.publishConfirmOpen = false;
        this.publishConfirmCancelHover = 0;
        this.publishConfirmPublishHover = 0;
        this.customLevelStatusText = "Sending level for review...";
        this.customLevelStatusTone = "neutral";
        try {
          const submittedRow = await this.submitCommunityLevelForReview(this.pendingCommunityLevel);
          this.upsertMyCreatedLevel(
            submittedRow || {
              name: this.pendingCommunityLevel.name,
              creator: this.pendingCommunityLevel.creator,
              creatorTime: this.pendingCommunityLevel.bestTime,
              myBestTime: this.pendingCommunityLevel.bestTime,
              startAngle: this.pendingCommunityLevel.startAngle,
              map: this.pendingCommunityLevel.map,
              leaderboard: normalizeCommunityLeaderboard(
                [{ playerName: this.pendingCommunityLevel.creator, time: this.pendingCommunityLevel.bestTime }],
                this.pendingCommunityLevel.creator,
                this.pendingCommunityLevel.bestTime
              ),
              submissionStatus: "pending",
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            { fallbackStatus: "pending" }
          );
          this.publishLevelName = "";
          this.publishLevelText = "";
          this.publishLevelNameInput.value = "";
          this.publishLevelInput.value = "";
          this.customLevelStatusText = "Level sent for review.";
          this.customLevelStatusTone = "ok";
          this.pendingCommunityLevel = null;
          this.syncOnlineMyLevels();
        } catch {
          this.customLevelStatusText = "Publish request failed. Check the Supabase community SQL setup.";
          this.customLevelStatusTone = "error";
        } finally {
          this.communityPublishRequestInFlight = false;
        }
        return;
      }

      this.upsertMyCreatedLevel(
        {
          name: this.pendingCommunityLevel.name,
          creator: this.pendingCommunityLevel.creator,
          creatorTime: this.pendingCommunityLevel.bestTime,
          myBestTime: this.pendingCommunityLevel.bestTime,
          startAngle: this.pendingCommunityLevel.startAngle,
          leaderboard: normalizeCommunityLeaderboard(
            [{ playerName: this.pendingCommunityLevel.creator, time: this.pendingCommunityLevel.bestTime }],
            this.pendingCommunityLevel.creator,
            this.pendingCommunityLevel.bestTime
          ),
          map: this.pendingCommunityLevel.map,
          local: true,
          submissionStatus: "private",
          reviewMessage: "",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        { save: false, fallbackStatus: "private" }
      );
      this.publishLevelName = "";
      this.publishLevelText = "";
      this.publishLevelNameInput.value = "";
      this.publishLevelInput.value = "";
      this.customLevelStatusText = "Level saved to My Levels as Private.";
      this.customLevelStatusTone = "ok";
      this.pendingCommunityLevel = null;
      this.savePersistentProgress();
      this.openMyLevels();
    }

    replaceCommunityLevelInList(list, originalLevel, updatedLevel) {
      let changed = false;
      const originalSignature = this.getCommunityLevelSignature(originalLevel);
      const nextList = list.map((entry) => {
        const matches = (
          (originalLevel?.remoteId && entry?.remoteId && entry.remoteId === originalLevel.remoteId) ||
          (!originalLevel?.remoteId && originalSignature && this.getCommunityLevelSignature(entry) === originalSignature)
        );
        if (!matches) {
          return entry;
        }
        changed = true;
        return {
          ...entry,
          ...updatedLevel,
          remoteId: entry.remoteId || updatedLevel.remoteId || "",
          local: Boolean(entry.local || updatedLevel.local),
        };
      });
      return { changed, nextList };
    }

    recordCommunityLevelTimeForLevel(level, time) {
      if (!level || !Number.isFinite(time)) {
        return { newRecord: false, previousBest: null };
      }
      const previousBest = normalizeCommunityLeaderboard(level.leaderboard, level.creator, level.creatorTime)[0]?.time ?? null;
      const playerName = this.playerUsername || "Player";
      const nextCreatorTime = playerName === level.creator && (!Number.isFinite(level.creatorTime) || time < level.creatorTime)
        ? time
        : level.creatorTime;
      const updatedLeaderboard = normalizeCommunityLeaderboard(
        [
          ...(Array.isArray(level.leaderboard) ? level.leaderboard : []),
          { playerName, time },
        ],
        level.creator,
        nextCreatorTime
      );
      const updatedLevel = {
        ...level,
        creatorTime: nextCreatorTime,
        leaderboard: updatedLeaderboard,
      };
      const onlineUpdate = this.replaceCommunityLevelInList(this.onlineCommunityLevels, level, updatedLevel);
      const localUpdate = this.replaceCommunityLevelInList(this.localCommunityLevels, level, updatedLevel);
      if (onlineUpdate.changed) {
        this.onlineCommunityLevels = onlineUpdate.nextList;
      }
      if (localUpdate.changed) {
        this.localCommunityLevels = localUpdate.nextList;
      }
      if (onlineUpdate.changed || localUpdate.changed) {
        this.rebuildCommunityLevels();
      }
      this.activeCommunityLevel = { ...updatedLevel };
      if (level.remoteId) {
        this.submitOnlineCommunityLevelRun(level.remoteId, playerName, time).catch(() => undefined);
      }
      if (playerName === level.creator) {
        this.upsertMyCreatedLevel(
          {
            ...updatedLevel,
            myBestTime: Number.isFinite(level.myBestTime) ? Math.min(level.myBestTime, time) : time,
            submissionStatus: level.submissionStatus || (level.remoteId ? "published" : level.local ? "private" : "pending"),
            updatedAt: Date.now(),
          },
          { save: false, fallbackStatus: level.remoteId ? "published" : level.local ? "private" : "pending" }
        );
      }
      this.savePersistentProgress();
      return {
        newRecord: previousBest == null || time < previousBest,
        previousBest,
      };
    }

    recordCommunityLevelTime(index, time) {
      return this.recordCommunityLevelTimeForLevel(this.communityLevels[index], time);
    }

    copyEmptyLevelFrame() {
      const frameText = EMPTY_LEVEL_FRAME.join("\n");
      const markCopied = () => {
        this.customLevelStatusText = "Copied level frame.";
        this.customLevelStatusTone = "ok";
      };
      const markFailed = () => {
        this.customLevelStatusText = "Copy failed. Select the frame text manually.";
        this.customLevelStatusTone = "error";
      };

      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(frameText).then(markCopied).catch(markFailed);
        return;
      }

      try {
        const temp = document.createElement("textarea");
        temp.value = frameText;
        temp.style.position = "fixed";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.focus();
        temp.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(temp);
        if (copied) {
          markCopied();
        } else {
          markFailed();
        }
      } catch {
        markFailed();
      }
    }

    unlockNextLevel(index = this.levelIndex) {
      if (index >= LEVELS.length - 1) {
        return;
      }

      const previousHighestVisitedLevel = this.highestVisitedLevel;
      this.highestVisitedLevel = Math.max(this.highestVisitedLevel, index + 1);
      if (this.highestVisitedLevel !== previousHighestVisitedLevel) {
        this.savePersistentProgress();
      }
    }

    loadTagLevel(index) {
      this.tagMapIndex = index;
      this.levelIndex = index;
      this.level = new LevelMap(TAG_LEVELS[index]);
      this.levelTimer = 0;
      this.tagElapsed = 0;
      this.tagTransferCooldown = 0;
      this.tagMatchFinished = false;
      this.tagWinnerText = "";
      this.resetWorldState();

      const redPlayer = this.getTagPlayer("red");
      const bluePlayer = this.getTagPlayer("blue");
      redPlayer.taggedTime = 0;
      bluePlayer.taggedTime = 0;
      redPlayer.isIt = false;
      bluePlayer.isIt = false;
      redPlayer.spawnX = this.level.redStart.x;
      redPlayer.spawnY = this.level.redStart.y;
      redPlayer.spawnAngle = this.level.startAngle;
      bluePlayer.spawnX = this.level.blueStart.x;
      bluePlayer.spawnY = this.level.blueStart.y;
      bluePlayer.spawnAngle = Math.PI + this.level.startAngle;
      this.resetTagPlayerState(redPlayer);
      this.resetTagPlayerState(bluePlayer);
      redPlayer.car.reset(this.level.redStart.x, this.level.redStart.y, this.level.startAngle);
      bluePlayer.car.reset(this.level.blueStart.x, this.level.blueStart.y, Math.PI + this.level.startAngle);
      this.pickRandomTagger();

      const centerX = (redPlayer.car.x + bluePlayer.car.x) * 0.5;
      const centerY = (redPlayer.car.y + bluePlayer.car.y) * 0.5;
      this.camera.snap(centerX, centerY);
    }

    loadRaceLevel(index) {
      this.levelIndex = index;
      const previousHighestVisitedLevel = this.highestVisitedLevel;
      this.highestVisitedLevel = Math.max(this.highestVisitedLevel, index);
      if (this.highestVisitedLevel !== previousHighestVisitedLevel) {
        this.savePersistentProgress();
      }
      this.level = new LevelMap(LEVELS[index]);
      this.levelTimer = 0;
      this.totalDamage = 0;
      this.raceWinner = null;
      this.tagMatchFinished = false;
      this.tagWinnerText = "";
      this.resetWorldState();

      const redPlayer = this.getTagPlayer("red");
      const bluePlayer = this.getTagPlayer("blue");
      redPlayer.taggedTime = 0;
      bluePlayer.taggedTime = 0;
      redPlayer.isIt = false;
      bluePlayer.isIt = false;
      redPlayer.spawnX = this.level.start.x;
      redPlayer.spawnY = this.level.start.y;
      redPlayer.spawnAngle = this.level.startAngle;
      bluePlayer.spawnX = this.level.start.x;
      bluePlayer.spawnY = this.level.start.y;
      bluePlayer.spawnAngle = this.level.startAngle;
      this.resetTagPlayerState(redPlayer);
      this.resetTagPlayerState(bluePlayer);
      redPlayer.car.reset(this.level.start.x, this.level.start.y, this.level.startAngle);
      bluePlayer.car.reset(this.level.start.x, this.level.start.y, this.level.startAngle);
      this.camera.snap(this.level.start.x, this.level.start.y);
      this.startRaceCountdown();
    }

    startRaceCountdown() {
      this.raceCountdownTimer = RACE_START_COUNTDOWN_SECONDS;
      this.raceGoTimer = 0;
    }

    updateRaceCountdown(dt) {
      if (this.raceCountdownTimer > 0) {
        this.raceCountdownTimer = Math.max(0, this.raceCountdownTimer - dt);
        if (this.raceCountdownTimer <= 0) {
          this.raceGoTimer = RACE_START_GO_TIME;
        }
        return;
      }
      if (this.raceGoTimer > 0) {
        this.raceGoTimer = Math.max(0, this.raceGoTimer - dt);
      }
    }

    isRaceCountdownActive() {
      return this.raceCountdownTimer > 0;
    }

    getRaceCountdownText() {
      if (this.raceCountdownTimer > 0) {
        return String(Math.ceil(this.raceCountdownTimer));
      }
      if (this.raceGoTimer > 0) {
        return "GO!";
      }
      return "";
    }

    pickRandomTagger() {
      for (const player of this.tagCars) {
        player.isIt = false;
      }
      const chosen = this.tagCars[Math.floor(Math.random() * this.tagCars.length)];
      chosen.isIt = true;
    }

    getTagPlayer(id) {
      return this.tagCars.find((player) => player.id === id) || this.tagCars[0];
    }

    resetTagPlayerState(player) {
      player.totalDamage = 0;
      player.skidMarks.length = 0;
      player.skidEmitTimer = 0;
      player.lastSkidLeft = null;
      player.lastSkidRight = null;
      player.damageSmoke.length = 0;
      player.damageFire.length = 0;
      player.explosionParticles.length = 0;
      player.smokeEmitTimer = 0;
      player.fireEmitTimer = 0;
      player.fireSequenceTimer = 0;
      player.explosionTimer = 0;
      player.exploding = false;
      player.wallTouching = false;
      player.wallTouchingThisFrame = false;
    }

    resetLevel() {
      if (this.gameMode === "tag") {
        this.loadTagLevel(this.tagMapIndex);
      } else if (this.isRaceMode()) {
        this.loadRaceLevel(this.levelIndex);
      } else if (this.isCustomLevelMode() && this.customTestLevelDefinition) {
        this.loadCustomLevel(this.customTestLevelDefinition);
      } else {
        this.loadLevel(this.levelIndex);
      }
    }

    getPersistentStorage() {
      try {
        return window.localStorage;
      } catch {
        return null;
      }
    }

    getAppliedSaveActions(storage) {
      try {
        const raw = storage.getItem(SAVE_ACTIONS_STORAGE_KEY);
        if (!raw) {
          return {};
        }
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    }

    setAppliedSaveActions(storage, actions) {
      try {
        storage.setItem(SAVE_ACTIONS_STORAGE_KEY, JSON.stringify(actions));
      } catch {
        // Ignore storage write failures from quota/privacy restrictions.
      }
    }

    applyPendingSaveActions(storage) {
      const actions = this.getAppliedSaveActions(storage);
      if (!actions[RESET_LEVEL_6_RECORD_ACTION]) {
        if (this.levelBestTimes.length > 5) {
          this.levelBestTimes[5] = null;
          this.savePersistentProgress();
        }
        actions[RESET_LEVEL_6_RECORD_ACTION] = true;
        this.setAppliedSaveActions(storage, actions);
      }
      if (!actions[RESET_NORMAL_RECORDS_ACTION]) {
        this.worldRecords = LEVELS.map(() => ({ time: null, carVariant: null, carColor: null }));
        this.speedrunWorldRecord = { time: null, carVariant: null, carColor: null };
        this.savePersistentProgress();
        actions[RESET_NORMAL_RECORDS_ACTION] = true;
        this.setAppliedSaveActions(storage, actions);
      }
      if (!actions[RESET_LEVEL_7_RECORDS_ACTION]) {
        const resetIndex = 6;
        if (resetIndex < LEVELS.length) {
          this.worldRecords[resetIndex] = { time: null, carVariant: null, carColor: null };
          this.perfectWorldRecords[resetIndex] = { time: null, carVariant: null, carColor: null };
          this.blackoutWorldRecords[resetIndex] = { time: null, carVariant: null, carColor: null };
          this.savePersistentProgress();
        }
        actions[RESET_LEVEL_7_RECORDS_ACTION] = true;
        this.setAppliedSaveActions(storage, actions);
      }
    }

    captureOwnedUnnamedLeaderboardRecordKeysFromLoadedProgress() {
      const keys = new Set(this.ownedUnnamedLeaderboardRecordKeys);
      for (const record of this.getTrackedOnlineLeaderboardRecords()) {
        if (hasRealLeaderboardName(record.entry.playerName)) {
          continue;
        }
        if (record.entry.time != null) {
          keys.add(this.getOnlineLeaderboardRecordKey(record.scope, record.levelIndex));
        }
      }
      const nextKeys = Array.from(keys);
      const changed = nextKeys.length !== this.ownedUnnamedLeaderboardRecordKeys.length ||
        nextKeys.some((key, index) => key !== this.ownedUnnamedLeaderboardRecordKeys[index]);
      this.ownedUnnamedLeaderboardRecordKeys = nextKeys;
      return changed;
    }

    loadPersistentProgress() {
      const storage = this.getPersistentStorage();
      if (!storage) {
        return;
      }

      try {
        const raw = storage.getItem(SAVE_STORAGE_KEY);
        if (!raw) {
          return;
        }

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") {
          return;
        }

        if (Number.isFinite(parsed.highestVisitedLevel)) {
          this.highestVisitedLevel = clamp(Math.floor(parsed.highestVisitedLevel), 0, LEVELS.length - 1);
        }

        if (Array.isArray(parsed.levelBestTimes)) {
          this.levelBestTimes = LEVELS.map((_, index) => {
            const value = parsed.levelBestTimes[index];
            return Number.isFinite(value) && value >= 0 ? value : null;
          });
        }

        if (Array.isArray(parsed.levelCleanFinishes)) {
          this.levelCleanFinishes = LEVELS.map((_, index) => Boolean(parsed.levelCleanFinishes[index]));
        }

        if (Array.isArray(parsed.worldRecords)) {
          this.worldRecords = LEVELS.map((_, index) => this.normalizeWorldRecordEntry(parsed.worldRecords[index]));
        }

        if (Array.isArray(parsed.perfectWorldRecords)) {
          this.perfectWorldRecords = LEVELS.map((_, index) => this.normalizeWorldRecordEntry(parsed.perfectWorldRecords[index]));
        }

        if (Array.isArray(parsed.blackoutWorldRecords)) {
          this.blackoutWorldRecords = LEVELS.map((_, index) => this.normalizeWorldRecordEntry(parsed.blackoutWorldRecords[index]));
        }

        if (Array.isArray(parsed.communityLevels)) {
          const localLevels = parsed.communityLevels
            .map((level) => {
              const name = normalizeCommunityLevelName(level?.name);
              const creator = normalizeUsername(level?.creator) || "Player";
              const map = Array.isArray(level?.map) ? level.map.map((row) => String(row)) : null;
              if (!name || !map) {
                return null;
              }
              const parsedLevel = this.parseCustomLevelText(map.join("\n"));
              if (parsedLevel.error) {
                return null;
              }
                return {
                  name,
                  creator,
                  creatorTime: Number.isFinite(level?.creatorTime) ? level.creatorTime : null,
                  myBestTime: Number.isFinite(level?.myBestTime) ? level.myBestTime : (Number.isFinite(level?.creatorTime) ? level.creatorTime : null),
                  startAngle: parsedLevel.definition.startAngle,
                  leaderboard: normalizeCommunityLeaderboard(level?.leaderboard, creator, Number.isFinite(level?.creatorTime) ? level.creatorTime : null),
                  map: parsedLevel.definition.map,
                  local: true,
                  remoteId: null,
                  submissionStatus: normalizeCommunitySubmissionStatus(level?.submissionStatus || "published"),
                  reviewMessage: String(level?.reviewMessage || "").trim(),
                  submissionId: typeof level?.submissionId === "string" ? level.submissionId : "",
                  createdAt: parseTimestampMs(level?.createdAt),
                  updatedAt: parseTimestampMs(level?.updatedAt),
                };
              })
              .filter(Boolean);
          this.localCommunityLevels = localLevels;
          this.rebuildCommunityLevels();
        }

        if (Array.isArray(parsed.myCreatedLevels)) {
          this.myCreatedLevels = parsed.myCreatedLevels
            .map((level) => this.normalizeMyCreatedLevelEntry(level, level?.submissionStatus || "private"))
            .filter(Boolean);
        }

        if (parsed.speedrunWorldRecord && typeof parsed.speedrunWorldRecord === "object") {
          this.speedrunWorldRecord = this.normalizeWorldRecordEntry(parsed.speedrunWorldRecord);
        }

        if (parsed.perfectSpeedrunWorldRecord && typeof parsed.perfectSpeedrunWorldRecord === "object") {
          this.perfectSpeedrunWorldRecord = this.normalizeWorldRecordEntry(parsed.perfectSpeedrunWorldRecord);
        }

        if (parsed.blackoutSpeedrunWorldRecord && typeof parsed.blackoutSpeedrunWorldRecord === "object") {
          this.blackoutSpeedrunWorldRecord = this.normalizeWorldRecordEntry(parsed.blackoutSpeedrunWorldRecord);
        }

        if (Array.isArray(parsed.ownedUnnamedLeaderboardRecordKeys)) {
          this.ownedUnnamedLeaderboardRecordKeys = parsed.ownedUnnamedLeaderboardRecordKeys
            .map((value) => String(value || "").trim())
            .filter((value) => value.length > 0);
        }

        if (parsed.speedrunLeaderboardVersion !== this.getSpeedrunLeaderboardVersion()) {
          this.speedrunWorldRecord = { time: null, carVariant: null, carColor: null };
          this.perfectSpeedrunWorldRecord = { time: null, carVariant: null, carColor: null };
          this.blackoutSpeedrunWorldRecord = { time: null, carVariant: null, carColor: null };
          this.savePersistentProgress();
        }

        if (isValidHexColor(parsed.playerCarColor)) {
          this.playerCarColor = parsed.playerCarColor;
        }

        if (typeof parsed.playerCarVariant === "string" && CAR_VARIANTS.some((variant) => variant.id === parsed.playerCarVariant)) {
          this.playerCarVariant = parsed.playerCarVariant;
        }

        if (Number.isFinite(parsed.anonymousPlayerNumber) && parsed.anonymousPlayerNumber >= 1) {
          this.anonymousPlayerNumber = Math.floor(parsed.anonymousPlayerNumber);
        }
        if (Number.isFinite(parsed.nextAnonymousPlayerNumber) && parsed.nextAnonymousPlayerNumber >= 1) {
          this.nextAnonymousPlayerNumber = Math.floor(parsed.nextAnonymousPlayerNumber);
        }

        const savedUsername = normalizeUsername(parsed.playerUsername);
        if (savedUsername) {
          this.playerUsername = savedUsername;
        }
        const savedSignedInUsername = normalizeUsername(parsed.signedInUsername);
        if (savedSignedInUsername && savedSignedInUsername === this.playerUsername) {
          this.signedInUsername = savedSignedInUsername;
          this.authStatusText = `Signed in as ${savedSignedInUsername}`;
          this.authStatusTone = "ok";
        } else {
          this.signedInUsername = null;
        }

        if (parsed.twoPlayerCarSettings && typeof parsed.twoPlayerCarSettings === "object") {
          for (const playerId of ["red", "blue"]) {
            const saved = parsed.twoPlayerCarSettings[playerId];
            if (!saved || typeof saved !== "object") {
              continue;
            }
            if (isValidHexColor(saved.color)) {
              this.twoPlayerCarSettings[playerId].color = saved.color;
            }
            if (typeof saved.variant === "string" && CAR_VARIANTS.some((variant) => variant.id === saved.variant)) {
              this.twoPlayerCarSettings[playerId].variant = saved.variant;
            }
          }
        }

        this.applyPendingSaveActions(storage);
        if (!Array.isArray(parsed.ownedUnnamedLeaderboardRecordKeys) && this.captureOwnedUnnamedLeaderboardRecordKeysFromLoadedProgress()) {
          this.savePersistentProgress();
        }
      } catch {
        // Ignore invalid save data and keep the current in-memory defaults.
      }
    }

    savePersistentProgress() {
      const storage = this.getPersistentStorage();
      if (!storage) {
        return;
      }

      try {
        storage.setItem(
          SAVE_STORAGE_KEY,
          JSON.stringify({
            highestVisitedLevel: this.highestVisitedLevel,
            levelBestTimes: this.levelBestTimes,
            levelCleanFinishes: this.levelCleanFinishes,
            worldRecords: this.worldRecords,
            perfectWorldRecords: this.perfectWorldRecords,
            blackoutWorldRecords: this.blackoutWorldRecords,
            ownedUnnamedLeaderboardRecordKeys: this.ownedUnnamedLeaderboardRecordKeys,
            communityLevels: this.localCommunityLevels
              .filter((level) => normalizeCommunitySubmissionStatus(level?.submissionStatus || "published") === "published")
              .map((level) => ({
                name: level.name,
                creator: level.creator,
                creatorTime: Number.isFinite(level.creatorTime) ? level.creatorTime : null,
                myBestTime: Number.isFinite(level.myBestTime) ? level.myBestTime : null,
                startAngle: Number.isFinite(level.startAngle) ? level.startAngle : 0,
                leaderboard: normalizeCommunityLeaderboard(level.leaderboard, level.creator, level.creatorTime),
                map: level.map,
                submissionStatus: normalizeCommunitySubmissionStatus(level.submissionStatus || "published"),
                reviewMessage: level.reviewMessage || "",
                submissionId: level.submissionId || "",
                createdAt: Number.isFinite(level.createdAt) ? level.createdAt : 0,
                updatedAt: Number.isFinite(level.updatedAt) ? level.updatedAt : 0,
              })),
            myCreatedLevels: this.myCreatedLevels
              .map((level) => ({
                name: level.name,
                creator: level.creator,
                creatorTime: Number.isFinite(level.creatorTime) ? level.creatorTime : null,
                myBestTime: Number.isFinite(level.myBestTime) ? level.myBestTime : null,
                startAngle: Number.isFinite(level.startAngle) ? level.startAngle : 0,
                leaderboard: normalizeCommunityLeaderboard(level.leaderboard, level.creator, level.creatorTime),
                map: level.map,
                local: Boolean(level.local),
                remoteId: level.remoteId || "",
                submissionId: level.submissionId || "",
                submissionStatus: level.submissionStatus || "private",
                reviewMessage: level.reviewMessage || "",
                createdAt: Number.isFinite(level.createdAt) ? level.createdAt : 0,
                updatedAt: Number.isFinite(level.updatedAt) ? level.updatedAt : 0,
              })),
            speedrunWorldRecord: this.speedrunWorldRecord,
            perfectSpeedrunWorldRecord: this.perfectSpeedrunWorldRecord,
            blackoutSpeedrunWorldRecord: this.blackoutSpeedrunWorldRecord,
            speedrunLeaderboardVersion: this.getSpeedrunLeaderboardVersion(),
            playerUsername: this.playerUsername,
            signedInUsername: this.signedInUsername,
            anonymousPlayerNumber: this.anonymousPlayerNumber,
            nextAnonymousPlayerNumber: this.nextAnonymousPlayerNumber,
            playerCarColor: this.playerCarColor,
            playerCarVariant: this.playerCarVariant,
            twoPlayerCarSettings: this.twoPlayerCarSettings,
          })
        );
      } catch {
        // Ignore storage write failures from quota/privacy restrictions.
      }
    }

    resetSpeedrunStats() {
      this.death_counter = 0;
      this.speedrunTouchedWall = false;
    }

    getSpeedrunDeathCount() {
      return this.death_counter || 0;
    }

    recordLevelBestTime(index, time, cleanFinish = false) {
      let changed = false;
      const previousBest = this.levelBestTimes[index];
      if (previousBest == null || time < previousBest) {
        this.levelBestTimes[index] = time;
        changed = true;
      }
      if (cleanFinish && !this.levelCleanFinishes[index]) {
        this.levelCleanFinishes[index] = true;
        changed = true;
      }
      if (changed) {
        this.savePersistentProgress();
      }
    }

    recordWorldRecord(index, time, carVariant = this.playerCarVariant, carColor = this.playerCarColor, records = this.worldRecords) {
      const previous = this.normalizeWorldRecordEntry(records[index]);
      if (previous.time != null && time >= previous.time) {
        return false;
      }

      records[index] = {
        time,
        carVariant: this.getCarVariantDefinition(carVariant).id,
        carColor: isValidHexColor(carColor) ? carColor : "#909090",
        playerName: this.playerUsername,
      };
      this.savePersistentProgress();
      const scope = this.getOnlineLeaderboardScopeFromLevelRecordArray(records, index);
      if (scope) {
        this.queueOnlineLeaderboardRecordSubmission(scope, index, records[index]);
      }
      return true;
    }

    recordSpeedrunWorldRecord(
      time,
      carVariant = this.playerCarVariant,
      carColor = this.playerCarColor,
      targetKey = "speedrunWorldRecord",
      deaths = this.getSpeedrunDeathCount()
    ) {
      const previous = this.normalizeWorldRecordEntry(this[targetKey]);
      if (previous.time != null && time >= previous.time) {
        return false;
      }

      this[targetKey] = {
        time,
        carVariant: this.getCarVariantDefinition(carVariant).id,
        carColor: isValidHexColor(carColor) ? carColor : "#909090",
        playerName: this.playerUsername,
        deaths: Number.isFinite(deaths) && deaths >= 0 ? Math.floor(deaths) : 0,
      };
      this.savePersistentProgress();
      const scope = this.getOnlineLeaderboardScopeFromSpeedrunKey(targetKey);
      if (scope) {
        this.queueOnlineLeaderboardRecordSubmission(scope, null, this[targetKey]);
      }
      return true;
    }

    submitCurrentPeriodLevelRun(scope, levelIndex, time) {
      this.queueCurrentPeriodLeaderboardRecordSubmissions(scope, levelIndex, {
        time,
        carVariant: this.playerCarVariant,
        carColor: this.playerCarColor,
        playerName: this.playerUsername,
      });
    }

    submitCurrentPeriodSpeedrunRun(scope, time, deaths = this.getSpeedrunDeathCount()) {
      this.queueCurrentPeriodLeaderboardRecordSubmissions(scope, null, {
        time,
        carVariant: this.playerCarVariant,
        carColor: this.playerCarColor,
        playerName: this.playerUsername,
        deaths,
      });
    }

    getGoalExplosionProgress() {
      if (!this.goalTriggered || GOAL_ADVANCE_DELAY <= 0) {
        return 0;
      }
      return clamp(1 - this.goalTimer / GOAL_ADVANCE_DELAY, 0, 1);
    }

    getWorldRenderScale() {
      if (this.isTwoPlayerDrivingMode()) {
        return this.getTagWorldRenderScale();
      }
      const responsiveScale = this.getResponsiveWorldRenderScale();
      const goalScale = lerp(1, GOAL_EXPLOSION_ZOOM, easeInOutCubic(this.getGoalExplosionProgress()));
      return Math.min(responsiveScale, goalScale);
    }

    getResponsiveWorldRenderScale() {
      const viewportFit = Math.min(this.width / 1280, this.height / 720);
      const fitProgress = clamp((viewportFit - 0.32) / 0.68, 0, 1);
      return lerp(0.42, 1, fitProgress);
    }

    getTagWorldRenderScale() {
      const viewportScale = this.getResponsiveWorldRenderScale();
      const redPlayer = this.getTagPlayer("red");
      const bluePlayer = this.getTagPlayer("blue");
      const carBuffer = CAR_LENGTH * 2.8;
      const horizontalMargin = clamp(this.width * 0.12, 96, 180);
      const verticalMargin = clamp(this.height * 0.15, 84, 150);
      const availableWidth = Math.max(240, this.width - horizontalMargin * 2);
      const availableHeight = Math.max(180, this.height - verticalMargin * 2);
      const carSpanX = Math.abs(redPlayer.car.x - bluePlayer.car.x) + carBuffer;
      const carSpanY = Math.abs(redPlayer.car.y - bluePlayer.car.y) + carBuffer;
      const fitScale = Math.min(1, availableWidth / carSpanX, availableHeight / carSpanY);
      return Math.min(viewportScale, fitScale);
    }

    getTagUILayoutMetrics() {
      const scale = clamp(Math.min(this.width / 1280, this.height / 720), 0.72, 1);
      const panelX = Math.round(Math.max(8, 18 * scale));
      const panelY = Math.round(Math.max(8, 62 * scale));
      const panelW = Math.round(Math.min(430 * scale, this.width - panelX * 2));
      const padding = Math.round(14 * scale);
      const columnGap = Math.round(12 * scale);
      const singleColumn = panelW < 330;
      const titleFontSize = Math.max(16, Math.round(20 * scale));
      const subtitleFontSize = Math.max(11, Math.round(13 * scale));
      const lineFontSize = Math.max(11, Math.round(15 * scale));
      const controlsFontSize = Math.max(12, Math.round(16 * scale));
      const headerHeight = Math.round(64 * scale);
      const lineGap = Math.round(22 * scale);
      return {
        scale,
        panelX,
        panelY,
        panelW,
        padding,
        columnGap,
        singleColumn,
        titleFontSize,
        subtitleFontSize,
        lineFontSize,
        controlsFontSize,
        headerHeight,
        lineGap,
      };
    }

    getTagHUDLayout() {
      const metrics = this.getTagUILayoutMetrics();
      const redPlayer = this.getTagPlayer("red");
      const bluePlayer = this.getTagPlayer("blue");
      const itPlayer = this.tagCars.find((player) => player.isIt);
      const remaining = Math.max(0, TAG_MATCH_DURATION - this.tagElapsed);
      const leftLines = [
        { text: `Time Left    ${formatTime(remaining)}`, color: "#f0f7fb" },
        { text: `Player 1 Tagged ${formatTime(redPlayer.taggedTime)}`, color: redPlayer.isIt ? "#ffe3e3" : "#ffd0d0" },
        { text: `Player 2 Tagged ${formatTime(bluePlayer.taggedTime)}`, color: bluePlayer.isIt ? "#dde9ff" : "#cfe0ff" },
        { text: `${itPlayer ? itPlayer.label : "-"} is it`, color: "#f0f7fb" },
      ];
      if (this.tagTransferCooldown > 0) {
        leftLines.push({ text: `Swap Cooldown ${this.tagTransferCooldown.toFixed(1)}s`, color: "#ffd166" });
      }
      const rightLines = [
        { text: `Player 1 Damage ${Math.round(redPlayer.totalDamage)}`, color: "#ffd0d0" },
        { text: `Player 2 Damage ${Math.round(bluePlayer.totalDamage)}`, color: "#cfe0ff" },
      ];
      const bodyLineCount = metrics.singleColumn ? leftLines.length + rightLines.length : Math.max(leftLines.length, rightLines.length);
      const panelH = metrics.headerHeight + bodyLineCount * metrics.lineGap + Math.round(24 * metrics.scale);
      return {
        metrics,
        redPlayer,
        bluePlayer,
        leftLines,
        rightLines,
        panelH,
        bodyStartY: metrics.panelY + metrics.headerHeight,
        contentWidth: metrics.panelW - metrics.padding * 2,
      };
    }

    getHUDToggleButtonForPanel(panelX, panelY, panelW, panelH) {
      const tabW = 24;
      const tabH = clamp(Math.round(panelH * 0.28), 44, 62);
      const slideOffset = -Math.round((panelW - tabW) * this.hudCollapseAnim);
      return {
        id: "hud_toggle",
        x: panelX + panelW - tabW + slideOffset,
        y: panelY + Math.round((panelH - tabH) * 0.5),
        w: tabW,
        h: tabH,
        slideOffset,
      };
    }

    getHUDToggleButton() {
      if (this.currentScreen !== "game") {
        return null;
      }
      if (this.gameMode === "tag") {
        const layout = this.getTagHUDLayout();
        return this.getHUDToggleButtonForPanel(layout.metrics.panelX, layout.metrics.panelY, layout.metrics.panelW, layout.panelH);
      }
      const layout = this.getCampaignHUDLayout();
      return this.getHUDToggleButtonForPanel(layout.panelX, layout.panelY, layout.panelW, layout.panelH);
    }

    toggleHUDCollapsed() {
      this.hudCollapsed = !this.hudCollapsed;
      this.refreshGameHover();
    }

    getFinishTileColors(tileX, tileY) {
      const tile = this.level.getTile(tileX, tileY);
      const startTileX = Math.floor(this.level.start.x / TILE_SIZE);
      const startTileY = Math.floor(this.level.start.y / TILE_SIZE);
      const goalTileX = Math.floor(this.level.goal.x / TILE_SIZE);
      const goalTileY = Math.floor(this.level.goal.y / TILE_SIZE);

      if (tileX === goalTileX && tileY === goalTileY) {
        return {
          front: mixHexColors("#4f3716", "#f5ce69", 0.42),
          top: "#f7d985",
          side: "#8b6120",
        };
      }

      if (tileX === startTileX && tileY === startTileY) {
        return {
          front: "#2fab88",
          top: "#72e3c1",
          side: "#1d6b53",
        };
      }

      if (tile === "#") {
        return { front: "#334854", top: "#506875", side: "#1e2d36" };
      }
      if (tile === "P") {
        return { front: "#60308c", top: "#8f5dc7", side: "#3d1f5d" };
      }
      if (tile === "X") {
        return { front: "#8e2020", top: "#d94a4a", side: "#5c1212" };
      }
      if (tile === "I") {
        const base = (tileX + tileY) % 2 === 0 ? "#17374d" : "#1f4b67";
        return {
          front: base,
          top: mixHexColors(base, "#d7f1ff", 0.3),
          side: mixHexColors(base, "#08131a", 0.35),
        };
      }

      const base = (tileX + tileY) % 2 === 0 ? "#111c25" : "#17242d";
      return {
        front: base,
        top: mixHexColors(base, "#cde8f7", 0.15),
        side: mixHexColors(base, "#04080c", 0.4),
      };
    }

    spawnGoalExplosionBurst(originX, originY, sourceCar = this.car, accentColor = null) {
      for (let index = 0; index < 44; index += 1) {
        const angle = (index / 44) * Math.PI * 2 + Math.random() * 0.28;
        const speed = 180 + Math.random() * 360;
        const life = 0.28 + Math.random() * 0.36;
        this.explosionParticles.push({
          x: originX + Math.cos(angle) * (8 + Math.random() * 14),
          y: originY + Math.sin(angle) * (8 + Math.random() * 14),
          vx: Math.cos(angle) * speed + sourceCar.vx * 0.08,
          vy: Math.sin(angle) * speed + sourceCar.vy * 0.08,
          size: 10 + Math.random() * 16,
          growth: 18 + Math.random() * 26,
          life,
          maxLife: life,
          maxAlpha: 0.55 + Math.random() * 0.3,
          alpha: 0,
          palette: index % 3,
          color: accentColor,
        });
      }
    }

    spawnFinishDebris(originX, originY, sourceCar = this.car) {
      this.finishDebris.length = 0;
      const maxDimension = Math.max(this.level.pixelWidth, this.level.pixelHeight);

      for (let tileY = 0; tileY < this.level.height; tileY += 1) {
        for (let tileX = 0; tileX < this.level.width; tileX += 1) {
          const centerX = tileX * TILE_SIZE + TILE_SIZE * 0.5;
          const centerY = tileY * TILE_SIZE + TILE_SIZE * 0.5;
          let deltaX = centerX - originX;
          let deltaY = centerY - originY;
          let distance = Math.hypot(deltaX, deltaY);
          if (distance <= 0.001) {
            const fallbackAngle = Math.random() * Math.PI * 2;
            deltaX = Math.cos(fallbackAngle);
            deltaY = Math.sin(fallbackAngle);
            distance = 1;
          }

          const directionX = deltaX / distance;
          const directionY = deltaY / distance;
          const distanceFactor = clamp(distance / Math.max(1, maxDimension * 0.72), 0, 1);
          const burstStrength = 1 - distanceFactor * 0.55;
          const tangentSpeed = (Math.random() - 0.5) * 180;
          const colors = this.getFinishTileColors(tileX, tileY);

          this.finishDebris.push({
            x: centerX,
            y: centerY,
            vx: directionX * (260 + burstStrength * 320 + Math.random() * 130) - directionY * tangentSpeed + sourceCar.vx * 0.04,
            vy: directionY * (260 + burstStrength * 320 + Math.random() * 130) + directionX * tangentSpeed + sourceCar.vy * 0.04,
            vz: 260 + burstStrength * 420 + Math.random() * 220,
            lift: 0,
            rotation: (Math.random() - 0.5) * 0.2,
            spin: (Math.random() - 0.5) * (3.2 + burstStrength * 2.8),
            size: TILE_SIZE * (0.82 + Math.random() * 0.16),
            life: GOAL_FINISH_DEBRIS_LIFE,
            maxLife: GOAL_FINISH_DEBRIS_LIFE,
            alpha: 1,
            frontColor: colors.front,
            topColor: colors.top,
            sideColor: colors.side,
          });
        }
      }
    }

    updateFinishDebris(dt) {
      for (const piece of this.finishDebris) {
        piece.life -= dt;
        piece.x += piece.vx * dt;
        piece.y += piece.vy * dt;
        piece.lift += piece.vz * dt;
        piece.vz -= GOAL_FINISH_DEBRIS_GRAVITY * dt;
        piece.vx *= Math.exp(-dt * GOAL_FINISH_DEBRIS_DRAG);
        piece.vy *= Math.exp(-dt * GOAL_FINISH_DEBRIS_DRAG);
        piece.rotation += piece.spin * dt;
        piece.alpha = clamp(piece.life / piece.maxLife, 0, 1);
      }
      this.finishDebris = this.finishDebris.filter((piece) => piece.life > 0);
    }

    triggerGoalHit(penetration) {
      if (this.goalTriggered || this.completed) {
        return;
      }

      this.goalTriggered = true;
      this.goalTimer = GOAL_ADVANCE_DELAY;
      this.car.x += penetration.normalX * (penetration.penetration + 0.05);
      this.car.y += penetration.normalY * (penetration.penetration + 0.05);

      const normalSpeed = dot(this.car.vx, this.car.vy, penetration.normalX, penetration.normalY);
      const tangentX = -penetration.normalY;
      const tangentY = penetration.normalX;
      const tangentSpeed = dot(this.car.vx, this.car.vy, tangentX, tangentY);
      const bouncedNormal = normalSpeed < 0
        ? Math.max(GOAL_BOUNCE_MIN_SPEED, -normalSpeed * GOAL_BOUNCE_VELOCITY_RATIO)
        : GOAL_BOUNCE_MIN_SPEED;

      this.car.vx = tangentX * tangentSpeed * GOAL_TANGENT_RETAIN + penetration.normalX * bouncedNormal;
      this.car.vy = tangentY * tangentSpeed * GOAL_TANGENT_RETAIN + penetration.normalY * bouncedNormal;
      this.car.vx *= GOAL_SPEED_RETAIN;
      this.car.vy *= GOAL_SPEED_RETAIN;
      this.car.angularVelocity *= 0.35;

      const goalCenterX = this.level.goal.x + this.level.goal.w * 0.5;
      const goalCenterY = this.level.goal.y + this.level.goal.h * 0.5;
      this.spawnGoalExplosionBurst(goalCenterX, goalCenterY);
      this.spawnFinishDebris(goalCenterX, goalCenterY);
      this.shakeStrength = Math.max(this.shakeStrength, GOAL_FINISH_SHAKE);
      this.shakeTime = Math.max(this.shakeTime, GOAL_FINISH_SHAKE_TIME);
    }

    triggerRaceGoalHit(player, penetration) {
      if (this.goalTriggered || this.completed || !player) {
        return;
      }

      this.goalTriggered = true;
      this.goalTimer = GOAL_ADVANCE_DELAY;
      this.raceWinner = player;
      const car = player.car;
      car.x += penetration.normalX * (penetration.penetration + 0.05);
      car.y += penetration.normalY * (penetration.penetration + 0.05);

      const normalSpeed = dot(car.vx, car.vy, penetration.normalX, penetration.normalY);
      const tangentX = -penetration.normalY;
      const tangentY = penetration.normalX;
      const tangentSpeed = dot(car.vx, car.vy, tangentX, tangentY);
      const bouncedNormal = normalSpeed < 0
        ? Math.max(GOAL_BOUNCE_MIN_SPEED, -normalSpeed * GOAL_BOUNCE_VELOCITY_RATIO)
        : GOAL_BOUNCE_MIN_SPEED;

      car.vx = tangentX * tangentSpeed * GOAL_TANGENT_RETAIN + penetration.normalX * bouncedNormal;
      car.vy = tangentY * tangentSpeed * GOAL_TANGENT_RETAIN + penetration.normalY * bouncedNormal;
      car.vx *= GOAL_SPEED_RETAIN;
      car.vy *= GOAL_SPEED_RETAIN;
      car.angularVelocity *= 0.35;

      const goalCenterX = this.level.goal.x + this.level.goal.w * 0.5;
      const goalCenterY = this.level.goal.y + this.level.goal.h * 0.5;
      this.spawnGoalExplosionBurst(goalCenterX, goalCenterY, car, player.color);
      this.spawnFinishDebris(goalCenterX, goalCenterY, car);
      this.shakeStrength = Math.max(this.shakeStrength, GOAL_FINISH_SHAKE);
      this.shakeTime = Math.max(this.shakeTime, GOAL_FINISH_SHAKE_TIME);
    }

    advanceAfterGoalHit() {
      if (this.isCustomLevelMode()) {
        this.finishCurrentLevel();
        return;
      }
      this.unlockNextLevel();
      if (this.isSpeedrunMode() && this.levelIndex < LEVELS.length - 1) {
        const perfectRun = !this.levelTouchedWallThisRun;
        this.recordLevelBestTime(this.levelIndex, this.levelTimer, perfectRun);
        this.nextLevel();
      } else {
        this.finishCurrentLevel();
      }
    }

    finishCurrentLevel() {
      const perfectRun = !this.levelTouchedWallThisRun;
      if (this.isCustomLevelMode()) {
        let title = "Test Level Complete!";
        let newRecord = false;
        let recordToBeat = null;
        if (this.gameMode === "publish_test" && this.pendingCommunityLevel) {
          const previousBest = this.pendingCommunityLevel.bestTime;
          recordToBeat = previousBest;
          newRecord = previousBest == null || this.levelTimer < previousBest;
          if (newRecord) {
            this.pendingCommunityLevel.bestTime = this.levelTimer;
          }
          title = newRecord ? "New Creator Time!" : "Level Validated!";
        } else if (this.gameMode === "community") {
          const result = this.recordCommunityLevelTimeForLevel(
            this.activeCommunityLevel || this.communityLevels[this.selectedCommunityLevelIndex],
            this.levelTimer
          );
          newRecord = result.newRecord;
          recordToBeat = result.previousBest;
          title = newRecord ? "New Community Record!" : "Community Time Saved!";
        }
        this.levelCompletionSummary = {
          title,
          levelTime: this.levelTimer,
          perfectRun,
          newRecord,
          recordToBeat,
          newWorldRecord: false,
          finalLevel: true,
          speedrun: false,
          blackoutSpeedrun: false,
          deaths: 0,
        };
        this.completionSceneTimer = 0;
        this.completed = true;
        this.goalTimer = 0;
        this.refreshGameHover();
        return;
      }
      const previousBest = this.levelBestTimes[this.levelIndex];
      const previousNormalWorldRecord = this.normalizeWorldRecordEntry(this.worldRecords[this.levelIndex]).time;
      const previousPerfectWorldRecord = this.normalizeWorldRecordEntry(this.perfectWorldRecords[this.levelIndex]).time;
      const previousBlackoutWorldRecord = this.normalizeWorldRecordEntry(this.blackoutWorldRecords[this.levelIndex]).time;
      const previousSpeedrunWorldRecord = this.normalizeWorldRecordEntry(this.speedrunWorldRecord).time;
      const previousPerfectSpeedrunWorldRecord = this.normalizeWorldRecordEntry(this.perfectSpeedrunWorldRecord).time;
      const previousBlackoutSpeedrunWorldRecord = this.normalizeWorldRecordEntry(this.blackoutSpeedrunWorldRecord).time;
      const newRecord = previousBest == null || this.levelTimer < previousBest;
      this.unlockNextLevel();
      this.recordLevelBestTime(this.levelIndex, this.levelTimer, perfectRun);
      const speedrunPerfect = this.isSpeedrunMode() ? !this.speedrunTouchedWall : false;
      const speedrunDeaths = this.isSpeedrunMode() ? this.getSpeedrunDeathCount() : 0;
      let newWorldRecord = false;
      let recordPeriod = null;

      if (this.isSpeedrunMode()) {
        const isBlackoutSpeedrun = this.gameMode === "blackout_speedrun";
        if (isBlackoutSpeedrun) {
          recordPeriod = this.getCompletionRecordPeriod(this.getVersionedSpeedrunScope("speedrun_blackout"), null, this.totalTimer);
          this.submitCurrentPeriodSpeedrunRun(this.getVersionedSpeedrunScope("speedrun_blackout"), this.totalTimer, speedrunDeaths);
          newWorldRecord = previousBlackoutSpeedrunWorldRecord == null || this.totalTimer < previousBlackoutSpeedrunWorldRecord;
          this.recordSpeedrunWorldRecord(this.totalTimer, this.playerCarVariant, this.playerCarColor, "blackoutSpeedrunWorldRecord", speedrunDeaths);
        } else {
          const newNormalSpeedrunRecord = !speedrunPerfect && (previousSpeedrunWorldRecord == null || this.totalTimer < previousSpeedrunWorldRecord);
          const newPerfectSpeedrunRecord = speedrunPerfect && (previousPerfectSpeedrunWorldRecord == null || this.totalTimer < previousPerfectSpeedrunWorldRecord);
          newWorldRecord = newNormalSpeedrunRecord || newPerfectSpeedrunRecord;
          if (speedrunPerfect) {
            recordPeriod = this.getCompletionRecordPeriod(this.getVersionedSpeedrunScope("speedrun_perfect"), null, this.totalTimer);
            this.submitCurrentPeriodSpeedrunRun(this.getVersionedSpeedrunScope("speedrun_perfect"), this.totalTimer, speedrunDeaths);
            this.recordSpeedrunWorldRecord(this.totalTimer, this.playerCarVariant, this.playerCarColor, "perfectSpeedrunWorldRecord", speedrunDeaths);
          } else {
            recordPeriod = this.getCompletionRecordPeriod(this.getVersionedSpeedrunScope("speedrun_normal"), null, this.totalTimer);
            this.submitCurrentPeriodSpeedrunRun(this.getVersionedSpeedrunScope("speedrun_normal"), this.totalTimer, speedrunDeaths);
            this.recordSpeedrunWorldRecord(this.totalTimer, this.playerCarVariant, this.playerCarColor, "speedrunWorldRecord", speedrunDeaths);
          }
        }
      } else if (this.gameMode === "blackout") {
        recordPeriod = this.getCompletionRecordPeriod(this.getVersionedLevelScope("level_blackout", this.levelIndex), this.levelIndex, this.levelTimer);
        this.submitCurrentPeriodLevelRun(this.getVersionedLevelScope("level_blackout", this.levelIndex), this.levelIndex, this.levelTimer);
        newWorldRecord = previousBlackoutWorldRecord == null || this.levelTimer < previousBlackoutWorldRecord;
        this.recordWorldRecord(this.levelIndex, this.levelTimer, this.playerCarVariant, this.playerCarColor, this.blackoutWorldRecords);
      } else {
        const newNormalWorldRecord = !perfectRun && (previousNormalWorldRecord == null || this.levelTimer < previousNormalWorldRecord);
        const newPerfectWorldRecord = perfectRun && (previousPerfectWorldRecord == null || this.levelTimer < previousPerfectWorldRecord);
        newWorldRecord = newNormalWorldRecord || newPerfectWorldRecord;
        if (perfectRun) {
          recordPeriod = this.getCompletionRecordPeriod(this.getVersionedLevelScope("level_perfect", this.levelIndex), this.levelIndex, this.levelTimer);
          this.submitCurrentPeriodLevelRun(this.getVersionedLevelScope("level_perfect", this.levelIndex), this.levelIndex, this.levelTimer);
          this.recordWorldRecord(this.levelIndex, this.levelTimer, this.playerCarVariant, this.playerCarColor, this.perfectWorldRecords);
        } else {
          recordPeriod = this.getCompletionRecordPeriod(this.getVersionedLevelScope("level_normal", this.levelIndex), this.levelIndex, this.levelTimer);
          this.submitCurrentPeriodLevelRun(this.getVersionedLevelScope("level_normal", this.levelIndex), this.levelIndex, this.levelTimer);
          this.recordWorldRecord(this.levelIndex, this.levelTimer, this.playerCarVariant, this.playerCarColor, this.worldRecords);
        }
      }

      this.levelCompletionSummary = {
        title: this.gameMode === "blackout_speedrun" ? "Blackout Speedrun Complete!" : this.isSpeedrunMode() ? "Speedrun Complete!" : "Level Complete!",
        levelTime: this.isSpeedrunMode() ? this.totalTimer : this.levelTimer,
        perfectRun: this.isSpeedrunMode() ? speedrunPerfect : perfectRun,
        newRecord: this.isSpeedrunMode() ? false : newRecord,
        recordToBeat: this.isSpeedrunMode() ? null : previousBest,
        newWorldRecord,
        recordPeriod: newWorldRecord ? null : recordPeriod,
        finalLevel: this.levelIndex >= LEVELS.length - 1,
        speedrun: this.isSpeedrunMode(),
        blackoutSpeedrun: this.gameMode === "blackout_speedrun",
        deaths: this.isSpeedrunMode() ? this.getSpeedrunDeathCount() : 0,
      };
      this.completionSceneTimer = 0;
      this.completed = true;
      this.goalTimer = 0;
      this.refreshGameHover();
    }

    finishRaceLevel() {
      const winner = this.raceWinner || this.getTagPlayer("red");
      this.unlockNextLevel();
      this.levelCompletionSummary = {
        title: `${winner.label} Wins!`,
        subtitle: "Two-player race result",
        levelTime: this.levelTimer,
        perfectRun: false,
        newRecord: false,
        recordToBeat: null,
        newWorldRecord: false,
        finalLevel: this.levelIndex >= LEVELS.length - 1,
        speedrun: false,
        blackoutSpeedrun: false,
        race: true,
        winnerId: winner.id,
        deaths: 0,
      };
      this.completionSceneTimer = 0;
      this.completed = true;
      this.goalTimer = 0;
      this.refreshGameHover();
    }

    nextLevel() {
      this.beginScreenWipe(() => {
        if (this.levelIndex < LEVELS.length - 1) {
          if (this.isRaceMode()) {
            this.loadRaceLevel(this.levelIndex + 1);
          } else {
            this.loadLevel(this.levelIndex + 1);
          }
        } else {
          this.speedrunTimerStarted = false;
          this.totalTimer = 0;
          this.totalDamage = 0;
          if (this.isRaceMode()) {
            this.loadRaceLevel(0);
          } else if (this.isSpeedrunMode()) {
            this.loadLevel(0);
          } else {
            this.loadLevel(0);
          }
        }
      });
    }

    frame(now) {
      const frameTime = Math.min((now - this.lastFrameTime) / 1000, MAX_FRAME_TIME);
      this.lastFrameTime = now;
      this.accumulator += frameTime;

      let steps = 0;
      while (this.accumulator >= FIXED_DT && steps < MAX_STEPS) {
        this.fixedUpdate(FIXED_DT);
        this.accumulator -= FIXED_DT;
        steps += 1;
      }

      if (steps === MAX_STEPS) {
        this.accumulator = 0;
      }

      this.render(this.accumulator / FIXED_DT, now / 1000);
      this.input.consumeFrame();
      requestAnimationFrame((time) => this.frame(time));
    }

    fixedUpdate(dt) {
      this.updateUsernameInputVisibility();
      this.updateCustomLevelInputVisibility();
      this.updateCommunitySearchInputVisibility();
      if (this.updateScreenWipe(dt)) {
        return;
      }
      if (this.currentScreen === "title") {
        this.updateTitleScreen(dt);
        return;
      }
      if (this.currentScreen === "two_player_menu") {
        this.updateTwoPlayerMenuScreen(dt);
        return;
      }
      if (this.currentScreen === "two_player_customization") {
        this.updateTwoPlayerCustomizationScreen(dt);
        return;
      }
      if (this.currentScreen === "leaderboard") {
        this.updateLeaderboardScreen(dt);
        return;
      }
      if (this.currentScreen === "online" || this.currentScreen === "community_levels" || this.currentScreen === "community_detail" || this.currentScreen === "create_level" || this.currentScreen === "my_levels") {
        this.updateOnlineScreen(dt);
        return;
      }
      if (this.currentScreen === "level_select") {
        this.updateLevelSelectScreen(dt);
        return;
      }
      if (this.currentScreen === "customization") {
        this.updateCustomizationScreen(dt);
        return;
      }

      if (this.gameMode === "tag") {
        this.updateTagGame(dt);
        return;
      }

      if (this.isRaceMode()) {
        this.updateRaceGame(dt);
        return;
      }

      this.updateCampaignGame(dt);
    }

    updateCampaignGame(dt) {
      this.refreshGameHover();
      this.gameExitHover = approachExp(this.gameExitHover, this.hoveredGameButton === "menu" ? 1 : 0, 16, dt);
      this.gameRestartHover = approachExp(this.gameRestartHover, this.hoveredGameButton === "restart" ? 1 : 0, 16, dt);
      this.hudToggleHover = approachExp(this.hudToggleHover, this.hoveredGameButton === "hud_toggle" ? 1 : 0, 16, dt);
      this.hudCollapseAnim = approachExp(this.hudCollapseAnim, this.hudCollapsed ? 1 : 0, 16, dt);
      this.completionHomeHover = approachExp(this.completionHomeHover, this.hoveredCompletionButton === "home" ? 1 : 0, 16, dt);
      this.completionReplayHover = approachExp(this.completionReplayHover, this.hoveredCompletionButton === "replay" ? 1 : 0, 16, dt);
      this.completionNextHover = approachExp(this.completionNextHover, (this.hoveredCompletionButton === "next" || this.hoveredCompletionButton === "publish_complete") ? 1 : 0, 16, dt);
      this.homeConfirmCancelHover = approachExp(this.homeConfirmCancelHover, this.hoveredHomeConfirmButton === "cancel" ? 1 : 0, 16, dt);
      this.homeConfirmLeaveHover = approachExp(this.homeConfirmLeaveHover, this.hoveredHomeConfirmButton === "leave" ? 1 : 0, 16, dt);
      this.publishConfirmCancelHover = approachExp(this.publishConfirmCancelHover, this.hoveredPublishConfirmButton === "cancel" ? 1 : 0, 16, dt);
      this.publishConfirmPublishHover = approachExp(this.publishConfirmPublishHover, this.hoveredPublishConfirmButton === "publish" ? 1 : 0, 16, dt);

      if (this.publishConfirmOpen) {
        if (this.input.wasPressed("Escape")) {
          this.closePublishConfirm();
        } else if (this.input.wasPressed("Enter") || this.input.wasPressed("Space")) {
          this.closePublishConfirm();
          this.finishCommunityLevelPublish();
        }
        return;
      }

      if (this.homeConfirmOpen) {
        if (this.input.wasPressed("Escape")) {
          this.closeHomeConfirm();
        } else if (this.input.wasPressed("Enter") || this.input.wasPressed("Space")) {
          this.closeHomeConfirm();
          this.returnToTitle();
        }
        return;
      }

      const canManualRestart = !this.completed && !this.goalTriggered && this.fireSequenceTimer <= 0 && !this.exploding;
      if (canManualRestart && this.input.wasPressed("KeyR")) {
        this.resetLevel();
        return;
      }

      if (this.completed) {
        this.camera.savePrevious();
        this.car.savePrevious();
        this.completionSceneTimer += dt;
        this.updateDamageEffects(dt);
        this.updateFinishDebris(dt);
        this.updateWallFlashes(dt);
        this.updateCamera(dt);
        this.updateShake(dt);
        if (this.input.wasPressed("Space") || this.input.wasPressed("Enter")) {
          if (this.gameMode === "publish_test") {
            this.openPublishConfirm();
          } else if (this.isCustomLevelMode()) {
            this.resetLevel();
          } else {
            this.nextLevel();
          }
        } else if (this.input.wasPressed("KeyR")) {
          this.resetLevel();
        } else if (this.input.wasPressed("Escape")) {
          this.returnFromGameHomeButton();
        }
        return;
      }

      const speed = Math.hypot(this.car.vx, this.car.vy);
      if (this.isSpeedrunMode()) {
        if (!this.speedrunTimerStarted) {
          if (this.levelIndex === 0 && speed >= LEVEL_TIMER_START_SPEED) {
            this.speedrunTimerStarted = true;
            this.levelTimerStarted = true;
          }
        } else if (!this.goalTriggered && !this.levelTimerStarted && speed >= LEVEL_TIMER_START_SPEED) {
          this.levelTimerStarted = true;
        }
        if (this.speedrunTimerStarted && !this.goalTriggered && this.fireSequenceTimer <= 0 && !this.exploding) {
          this.totalTimer += dt;
        }
        if (this.levelTimerStarted && !this.goalTriggered && this.fireSequenceTimer <= 0 && !this.exploding) {
          this.levelTimer += dt;
        }
      } else {
        if (!this.goalTriggered && !this.levelTimerStarted && speed >= LEVEL_TIMER_START_SPEED) {
          this.levelTimerStarted = true;
        }
        if (this.levelTimerStarted && !this.goalTriggered && this.fireSequenceTimer <= 0 && !this.exploding) {
          this.levelTimer += dt;
        }
      }
      this.camera.savePrevious();
      this.car.savePrevious();
      this.wallTouchingThisFrame = false;

      const throttleLocked = this.fireSequenceTimer > 0 || this.exploding || this.goalTriggered;
      const surface = this.getSurfacePhysics(this.car.x, this.car.y);
      const telemetry = this.car.updateControlState(this.getSinglePlayerControlState(), dt, !throttleLocked, surface);
      if (!this.exploding) {
        this.moveCar(this.car, dt);
      }
      if (this.totalDamage >= FIRE_DAMAGE_START && this.fireSequenceTimer <= 0 && !this.exploding) {
        this.startFireSequence();
      }
      this.updateFailureState(dt);
      this.wallTouching = this.wallTouchingThisFrame;
      if (!this.fireSequenceTimer && !this.exploding) {
        this.updateGoal(dt);
      }
      this.updateSkidMarks(dt, telemetry);
      this.updateDamageEffects(dt);
      this.updateFinishDebris(dt);
      this.updateWallFlashes(dt);
      if (this.exploding && this.explosionTimer <= 0) {
        this.respawnAtLevelStart();
        return;
      }
      if (this.goalTriggered) {
        this.goalTimer = Math.max(0, this.goalTimer - dt);
        if (this.goalTimer <= 0) {
          this.advanceAfterGoalHit();
          return;
        }
      }
      this.updateCamera(dt);
      this.updateShake(dt);
    }

    updateTagGame(dt) {
      this.refreshGameHover();
      this.gameExitHover = approachExp(this.gameExitHover, this.hoveredGameButton === "menu" ? 1 : 0, 16, dt);
      this.gameRestartHover = approachExp(this.gameRestartHover, 0, 16, dt);
      this.hudToggleHover = approachExp(this.hudToggleHover, this.hoveredGameButton === "hud_toggle" ? 1 : 0, 16, dt);
      this.hudCollapseAnim = approachExp(this.hudCollapseAnim, this.hudCollapsed ? 1 : 0, 16, dt);

      this.homeConfirmCancelHover = approachExp(this.homeConfirmCancelHover, this.hoveredHomeConfirmButton === "cancel" ? 1 : 0, 16, dt);
      this.homeConfirmLeaveHover = approachExp(this.homeConfirmLeaveHover, this.hoveredHomeConfirmButton === "leave" ? 1 : 0, 16, dt);

      if (this.homeConfirmOpen) {
        if (this.input.wasPressed("Escape")) {
          this.closeHomeConfirm();
        } else if (this.input.wasPressed("Enter") || this.input.wasPressed("Space")) {
          this.closeHomeConfirm();
          this.returnToTitle();
        }
        return;
      }

      if (this.tagMatchFinished) {
        if (this.input.wasPressed("Space")) {
          this.startTagGame();
        }
        return;
      }

      this.camera.savePrevious();
      for (const player of this.tagCars) {
        player.car.savePrevious();
        player.wallTouchingThisFrame = false;
      }

      const elapsedStep = Math.min(dt, TAG_MATCH_DURATION - this.tagElapsed);
      const itPlayer = this.tagCars.find((player) => player.isIt);
      if (itPlayer) {
        itPlayer.taggedTime += elapsedStep;
      }
      this.tagElapsed += elapsedStep;
      this.tagTransferCooldown = Math.max(0, this.tagTransferCooldown - dt);

      for (const player of this.tagCars) {
        const controlState = {
          throttle: this.input.getThrottleForBindings(player.controls),
          steer: this.input.getSteerForBindings(player.controls),
        };
        const resolvedControlState = this.getTouchJoystickControlState(
          player.car,
          player.touchJoystick,
          controlState,
          this.canUseTagTouchJoystick(player)
        );
        const throttleLocked = player.fireSequenceTimer > 0 || player.exploding;
        const surface = this.getSurfacePhysics(player.car.x, player.car.y);
        const telemetry = player.car.updateControlState(resolvedControlState, dt, !throttleLocked, surface);
        if (!player.exploding) {
          this.moveCar(player.car, dt, player);
        }
        if (player.totalDamage >= FIRE_DAMAGE_START && player.fireSequenceTimer <= 0 && !player.exploding) {
          this.startFireSequence(player);
        }
        this.updateFailureState(dt, player);
        player.wallTouching = player.wallTouchingThisFrame;
        this.updateSkidMarks(dt, telemetry, player);
        this.updateDamageEffects(dt, player);
        if (player.exploding && player.explosionTimer <= 0) {
          this.respawnTagPlayer(player);
        }
      }

      this.resolveTagCarCollision();
      this.updateWallFlashes(dt);
      this.updateCamera(dt);
      this.updateShake(dt);

      if (this.tagElapsed >= TAG_MATCH_DURATION - 1e-6) {
        this.finishTagMatch();
      }
    }

    updateRaceGame(dt) {
      this.refreshGameHover();
      this.gameExitHover = approachExp(this.gameExitHover, this.hoveredGameButton === "menu" ? 1 : 0, 16, dt);
      this.gameRestartHover = approachExp(this.gameRestartHover, 0, 16, dt);
      this.hudToggleHover = approachExp(this.hudToggleHover, this.hoveredGameButton === "hud_toggle" ? 1 : 0, 16, dt);
      this.hudCollapseAnim = approachExp(this.hudCollapseAnim, this.hudCollapsed ? 1 : 0, 16, dt);
      this.completionHomeHover = approachExp(this.completionHomeHover, this.hoveredCompletionButton === "home" ? 1 : 0, 16, dt);
      this.completionReplayHover = approachExp(this.completionReplayHover, this.hoveredCompletionButton === "replay" ? 1 : 0, 16, dt);
      this.completionNextHover = approachExp(this.completionNextHover, this.hoveredCompletionButton === "next" ? 1 : 0, 16, dt);
      this.homeConfirmCancelHover = approachExp(this.homeConfirmCancelHover, this.hoveredHomeConfirmButton === "cancel" ? 1 : 0, 16, dt);
      this.homeConfirmLeaveHover = approachExp(this.homeConfirmLeaveHover, this.hoveredHomeConfirmButton === "leave" ? 1 : 0, 16, dt);

      if (this.homeConfirmOpen) {
        if (this.input.wasPressed("Escape")) {
          this.closeHomeConfirm();
        } else if (this.input.wasPressed("Enter") || this.input.wasPressed("Space")) {
          this.closeHomeConfirm();
          this.returnToTitle();
        }
        return;
      }

      if (this.completed) {
        this.camera.savePrevious();
        for (const player of this.tagCars) {
          player.car.savePrevious();
        }
        this.completionSceneTimer += dt;
        for (const player of this.tagCars) {
          this.updateDamageEffects(dt, player);
        }
        this.updateDamageEffects(dt);
        this.updateFinishDebris(dt);
        this.updateWallFlashes(dt);
        this.updateCamera(dt);
        this.updateShake(dt);
        if (this.input.wasPressed("Space") || this.input.wasPressed("Enter")) {
          this.nextLevel();
        } else if (this.input.wasPressed("Escape")) {
          this.returnFromGameHomeButton();
        }
        return;
      }

      this.updateRaceCountdown(dt);
      const activeSpeeds = this.tagCars.map((player) => Math.hypot(player.car.vx, player.car.vy));
      if (!this.goalTriggered && !this.levelTimerStarted && activeSpeeds.some((speed) => speed >= LEVEL_TIMER_START_SPEED)) {
        this.levelTimerStarted = true;
      }
      if (this.levelTimerStarted && !this.goalTriggered) {
        this.levelTimer += dt;
      }

      this.camera.savePrevious();
      for (const player of this.tagCars) {
        player.car.savePrevious();
        player.wallTouchingThisFrame = false;
      }

      for (const player of this.tagCars) {
        const controlsLocked = this.isRaceCountdownActive();
        const controlState = {
          throttle: this.input.getThrottleForBindings(player.controls),
          steer: this.input.getSteerForBindings(player.controls),
        };
        const resolvedControlState = controlsLocked
          ? { throttle: 0, steer: 0 }
          : this.getTouchJoystickControlState(
            player.car,
            player.touchJoystick,
            controlState,
            this.canUseTagTouchJoystick(player)
          );
        const throttleLocked = player.fireSequenceTimer > 0 || player.exploding || this.goalTriggered;
        const surface = this.getSurfacePhysics(player.car.x, player.car.y);
        const telemetry = player.car.updateControlState(resolvedControlState, dt, !throttleLocked, surface);
        if (!player.exploding) {
          this.moveCar(player.car, dt, player);
        }
        if (!this.goalTriggered && !player.exploding && player.fireSequenceTimer <= 0) {
          const penetration = this.getGoalPenetration(player.car);
          if (penetration) {
            this.triggerRaceGoalHit(player, penetration);
          }
        }
        if (player.totalDamage >= FIRE_DAMAGE_START && player.fireSequenceTimer <= 0 && !player.exploding) {
          this.startFireSequence(player);
        }
        this.updateFailureState(dt, player);
        player.wallTouching = player.wallTouchingThisFrame;
        this.updateSkidMarks(dt, telemetry, player);
        this.updateDamageEffects(dt, player);
        if (player.exploding && player.explosionTimer <= 0) {
          this.respawnTagPlayer(player);
        }
      }

      this.updateDamageEffects(dt);
      this.updateFinishDebris(dt);
      this.updateWallFlashes(dt);
      if (this.goalTriggered) {
        this.goalTimer = Math.max(0, this.goalTimer - dt);
        if (this.goalTimer <= 0) {
          this.finishRaceLevel();
          return;
        }
      }
      this.updateCamera(dt);
      this.updateShake(dt);
    }

    updateTitleScreen(dt) {
      this.updateMenuBackdrop(dt);
      this.refreshTitleHover();
      if (this.signOutConfirmOpen) {
        if (this.input.wasPressed("Escape")) {
          this.closeSignOutConfirm();
        } else if (this.input.wasPressed("Enter") || this.input.wasPressed("Space")) {
          this.logOutAccount();
        }
      }
      const buttons = this.getTitleButtons();
      for (let index = 0; index < this.titleButtons.length; index += 1) {
        const button = this.titleButtons[index];
        const derived = buttons[index];
        const targetHover = derived && derived.enabled !== false && button.id === this.hoveredTitleButton ? 1 : 0;
        button.hover = approachExp(button.hover, targetHover, 15, dt);
      }
      this.titleOnlineHover = 0;
      this.titleLeaderboardNameUpdateHover = approachExp(this.titleLeaderboardNameUpdateHover, this.hoveredTitleUsernameButton === "update_leaderboard_name" ? 1 : 0, 15, dt);
      this.titleLoginHover = approachExp(this.titleLoginHover, this.hoveredTitleUsernameButton === "login" ? 1 : 0, 15, dt);
      this.titleSignUpHover = approachExp(this.titleSignUpHover, this.hoveredTitleUsernameButton === "signup" ? 1 : 0, 15, dt);
      this.titleLogoutHover = approachExp(this.titleLogoutHover, this.hoveredTitleUsernameButton === "logout" ? 1 : 0, 15, dt);
      this.signOutConfirmCancelHover = approachExp(this.signOutConfirmCancelHover, this.hoveredSignOutConfirmButton === "cancel" ? 1 : 0, 15, dt);
      this.signOutConfirmLeaveHover = approachExp(this.signOutConfirmLeaveHover, this.hoveredSignOutConfirmButton === "signout" ? 1 : 0, 15, dt);
    }

    updateTwoPlayerMenuScreen(dt) {
      this.updateMenuBackdrop(dt);
      this.refreshTwoPlayerHover();
      this.twoPlayerNoticeTimer = Math.max(0, this.twoPlayerNoticeTimer - dt);
      if (this.twoPlayerNoticeTimer <= 0) {
        this.twoPlayerNotice = "";
      }
      for (const button of this.twoPlayerButtons) {
        const targetHover = button.id === this.hoveredTwoPlayerButton ? 1 : 0;
        button.hover = approachExp(button.hover, targetHover, 15, dt);
      }
    }

    updateLeaderboardScreen(dt) {
      this.updateMenuBackdrop(dt);
      this.refreshLeaderboardHover();
      for (const button of this.leaderboardButtons) {
        const targetHover = button.id === this.hoveredLeaderboardButton ? 1 : 0;
        button.hover = approachExp(button.hover, targetHover, 15, dt);
      }
      for (const period of LEADERBOARD_PERIODS) {
        const targetHover = (period.id === this.hoveredLeaderboardPeriodTab || period.id === this.selectedLeaderboardPeriod) ? 1 : 0;
        this.leaderboardPeriodTabHovers[period.id] = approachExp(this.leaderboardPeriodTabHovers[period.id] || 0, targetHover, 15, dt);
      }
      this.leaderboardBackHover = approachExp(this.leaderboardBackHover, this.hoveredLeaderboardButton === "back" ? 1 : 0, 15, dt);
    }

    updateOnlineScreen(dt) {
      this.updateMenuBackdrop(dt);
      if (this.isScrollableOnlineListScreen()) {
        this.clampOnlineLevelListScroll();
      }
      this.refreshOnlineHover();
      const expectedCardCount = this.currentScreen === "community_levels"
        ? this.getCommunityLevelCards().length
        : this.currentScreen === "my_levels"
          ? this.getMyLevelCards().length
          : 0;
      if (expectedCardCount !== this.communityLevelHovers.length) {
        this.communityLevelHovers = Array.from({ length: expectedCardCount }, (_, index) => (this.hoveredCommunityLevel === index ? 1 : 0));
      }
      this.onlineBackHover = approachExp(this.onlineBackHover, this.hoveredOnlineButton === "back" ? 1 : 0, 15, dt);
      this.onlineCommunityHover = approachExp(this.onlineCommunityHover, this.hoveredOnlineButton === "community" ? 1 : 0, 15, dt);
      this.onlineCreateHover = approachExp(this.onlineCreateHover, this.hoveredOnlineButton === "create" ? 1 : 0, 15, dt);
      this.onlineLeaderboardHover = approachExp(this.onlineLeaderboardHover, this.hoveredOnlineButton === "leaderboard" ? 1 : 0, 15, dt);
      this.myLevelsCreateHover = approachExp(this.myLevelsCreateHover, this.hoveredOnlineButton === "create_from_my_levels" ? 1 : 0, 15, dt);
      this.myLevelMessageCloseHover = approachExp(this.myLevelMessageCloseHover, this.hoveredOnlineButton === "close_my_level_message" ? 1 : 0, 15, dt);
      this.communityDetailPlayHover = approachExp(this.communityDetailPlayHover, this.hoveredOnlineButton === "play_community_level" ? 1 : 0, 15, dt);
      this.customLevelRunHover = approachExp(this.customLevelRunHover, this.hoveredOnlineButton === "run_custom_level" ? 1 : 0, 15, dt);
      this.customLevelCopyHover = approachExp(this.customLevelCopyHover, this.hoveredOnlineButton === "copy_level_frame" ? 1 : 0, 15, dt);
      this.customLevelPublishHover = approachExp(this.customLevelPublishHover, this.hoveredOnlineButton === "publish_custom_level" ? 1 : 0, 15, dt);
      this.createPublishPromptBackHover = approachExp(this.createPublishPromptBackHover, this.hoveredCreatePublishPromptButton === "back" ? 1 : 0, 15, dt);
      this.createPublishPromptContinueHover = approachExp(this.createPublishPromptContinueHover, this.hoveredCreatePublishPromptButton === "continue" ? 1 : 0, 15, dt);
      if (this.currentScreen === "create_level" && this.createPublishPromptOpen) {
        if (this.input.wasPressed("Escape")) {
          this.closeCreatePublishPrompt();
        } else if (this.input.wasPressed("Enter") || this.input.wasPressed("Space")) {
          this.beginPublishValidationRun();
        }
        return;
      }
      if (this.currentScreen === "my_levels" && this.myLevelMessageDialog) {
        if (this.input.wasPressed("Escape") || this.input.wasPressed("Enter") || this.input.wasPressed("Space")) {
          this.closeMyLevelMessageDialog();
        }
        return;
      }
      for (let index = 0; index < this.communityLevelHovers.length; index += 1) {
        this.communityLevelHovers[index] = approachExp(this.communityLevelHovers[index], this.hoveredCommunityLevel === index ? 1 : 0, 15, dt);
      }
    }

    updateLevelSelectScreen(dt) {
      this.updateMenuBackdrop(dt);
      this.refreshLevelSelectHover();
      this.levelSelectBackHover = approachExp(this.levelSelectBackHover, this.hoveredLevelSelectButton === "back" ? 1 : 0, 15, dt);
      this.levelSelectSpeedrunHover = approachExp(this.levelSelectSpeedrunHover, this.hoveredLevelSelectButton === "speedrun" ? 1 : 0, 15, dt);
      this.levelSelectBlackoutHover = approachExp(this.levelSelectBlackoutHover, this.hoveredLevelSelectButton === "blackout" ? 1 : 0, 15, dt);
      for (let index = 0; index < this.levelCardHovers.length; index += 1) {
        const targetHover = this.hoveredLevelCard === index ? 1 : 0;
        this.levelCardHovers[index] = approachExp(this.levelCardHovers[index], targetHover, 15, dt);
      }
    }

    updateCustomizationScreen(dt) {
      this.updateMenuBackdrop(dt);
      this.refreshCustomizationHover();
      this.customizationDoneHover = approachExp(this.customizationDoneHover, this.hoveredCustomizationButton === "done" ? 1 : 0, 15, dt);
      this.customizationBackHover = approachExp(this.customizationBackHover, this.hoveredCustomizationButton === "back" ? 1 : 0, 15, dt);
      this.customizationPrevHover = approachExp(this.customizationPrevHover, this.hoveredCustomizationButton === "prev_model" ? 1 : 0, 15, dt);
      this.customizationNextHover = approachExp(this.customizationNextHover, this.hoveredCustomizationButton === "next_model" ? 1 : 0, 15, dt);
      this.updateCustomizationPickerVisibility();
    }

    updateTwoPlayerCustomizationScreen(dt) {
      this.updateMenuBackdrop(dt);
      this.refreshTwoPlayerCustomizationHover();
      this.customizationDoneHover = approachExp(this.customizationDoneHover, this.hoveredCustomizationButton === "done" ? 1 : 0, 15, dt);
      this.customizationBackHover = approachExp(this.customizationBackHover, this.hoveredCustomizationButton === "back" ? 1 : 0, 15, dt);
      this.customizationPrevHover = approachExp(this.customizationPrevHover, this.hoveredCustomizationButton?.endsWith("_prev") ? 1 : 0, 15, dt);
      this.customizationNextHover = approachExp(this.customizationNextHover, this.hoveredCustomizationButton?.endsWith("_next") ? 1 : 0, 15, dt);
      this.updateCustomizationPickerVisibility();
    }

    updateMenuBackdrop(dt) {
      const drifter = this.titleDrifter;
      drifter.decisionTimer -= dt;
      const centerX = this.width * 0.5;
      const centerY = this.height * 0.58;
      const angleToCenter = Math.atan2(centerY - drifter.y, centerX - drifter.x);
      const centerDelta = Math.atan2(Math.sin(angleToCenter - drifter.angle), Math.cos(angleToCenter - drifter.angle));
      const followsMouse = this.currentScreen === "title" && this.mouse.down && this.mouse.inside;
      const edgeFactor = clamp(
        Math.max(
          Math.abs(drifter.x - centerX) / Math.max(1, this.width * 0.34),
          Math.abs(drifter.y - centerY) / Math.max(1, this.height * 0.3)
        ),
        0,
        1
      );

      if (followsMouse) {
        const mouseAngle = Math.atan2(this.mouse.y - drifter.y, this.mouse.x - drifter.x);
        const mouseDelta = Math.atan2(Math.sin(mouseAngle - drifter.angle), Math.cos(mouseAngle - drifter.angle));
        const mouseDistance = Math.hypot(this.mouse.x - drifter.x, this.mouse.y - drifter.y);
        drifter.targetTurn = clamp(mouseDelta * 4.6, -3.8, 3.8);
        drifter.targetSpeed = 220 + clamp(mouseDistance * 0.45, 0, 260);
        drifter.decisionTimer = 0.08;
      } else if (drifter.decisionTimer <= 0) {
        drifter.targetTurn = clamp((Math.random() * 2 - 1) * 2.4 + centerDelta * edgeFactor * 1.7, -3.4, 3.4);
        drifter.targetSpeed = 210 + Math.random() * 180 + edgeFactor * 70;
        drifter.decisionTimer = 0.5 + Math.random() * 1.2;
      }

      drifter.angularVelocity = approachExp(drifter.angularVelocity, drifter.targetTurn, 1.9, dt);
      drifter.angle += drifter.angularVelocity * dt;
      drifter.speed = approachExp(drifter.speed, drifter.targetSpeed, 1.2, dt);

      const facingX = Math.cos(drifter.angle);
      const facingY = Math.sin(drifter.angle);
      const sway = Math.sin(performance.now() * 0.0013 + this.titleBackdropPhase) * 26;
      const targetVx = facingX * drifter.speed - facingY * sway;
      const targetVy = facingY * drifter.speed + facingX * sway;
      const slipAlpha = 1 - Math.exp(-dt * 1.25);
      drifter.vx = lerp(drifter.vx, targetVx, slipAlpha);
      drifter.vy = lerp(drifter.vy, targetVy, slipAlpha);
      drifter.x += drifter.vx * dt;
      drifter.y += drifter.vy * dt;

      let wrapped = false;
      const margin = 180;
      if (drifter.x < -margin) {
        drifter.x = this.width + margin;
        wrapped = true;
      } else if (drifter.x > this.width + margin) {
        drifter.x = -margin;
        wrapped = true;
      }
      if (drifter.y < -margin) {
        drifter.y = this.height + margin;
        wrapped = true;
      } else if (drifter.y > this.height + margin) {
        drifter.y = -margin;
        wrapped = true;
      }
      if (wrapped) {
        this.titleTrail.length = 0;
      }

      this.titleTrailTimer -= dt;
      while (this.titleTrailTimer <= 0) {
        this.titleTrail.push({
          x: drifter.x,
          y: drifter.y,
          life: 1.4,
          maxLife: 1.4,
          size: 10 + Math.abs(drifter.angularVelocity) * 5,
        });
        this.titleTrailTimer += 0.035;
      }

      for (const puff of this.titleTrail) {
        puff.life -= dt;
      }
      this.titleTrail = this.titleTrail.filter((puff) => puff.life > 0);
    }

    updateCustomizationPickerVisibility() {
      if (this.currentScreen !== "customization" && this.currentScreen !== "two_player_customization") {
        this.colorInput.style.display = "none";
        for (const input of Object.values(this.twoPlayerColorInputs)) {
          input.style.display = "none";
        }
        return;
      }

      if (this.currentScreen === "two_player_customization") {
        this.colorInput.style.display = "none";
        for (const card of this.getTwoPlayerCustomizationCards()) {
          const input = this.twoPlayerColorInputs[card.id];
          const value = this.twoPlayerCustomizationDrafts[card.id]?.color;
          input.style.display = "block";
          input.style.left = `${card.picker.x}px`;
          input.style.top = `${card.picker.y}px`;
          input.style.width = `${card.picker.w}px`;
          input.style.height = `${card.picker.h}px`;
          input.value = isValidHexColor(value) ? value : this.getTwoPlayerCarSetting(card.id).color;
        }
        return;
      }

      for (const input of Object.values(this.twoPlayerColorInputs)) {
        input.style.display = "none";
      }
      const picker = this.getCustomizationColorPickerRect();
      const value = this.customizationDraftColor;
      this.colorInput.style.display = "block";
      this.colorInput.style.left = `${picker.x}px`;
      this.colorInput.style.top = `${picker.y}px`;
      this.colorInput.style.width = `${picker.w}px`;
      this.colorInput.style.height = `${picker.h}px`;
      this.colorInput.value = isValidHexColor(value) ? value : "#909090";
    }

    updateUsernameInputVisibility() {
      if (!this.usernameInput || this.currentScreen !== "title" || this.signOutConfirmOpen) {
        if (this.usernameInput) {
          this.usernameInput.style.display = "none";
        }
        return;
      }

      const layout = this.getTitleUsernameLayout();
      if (!layout.visible) {
        this.usernameInput.style.display = "none";
        return;
      }

      this.usernameInput.style.display = "block";
      this.usernameInput.style.left = `${layout.input.x}px`;
      this.usernameInput.style.top = `${layout.input.y}px`;
      this.usernameInput.style.width = `${layout.input.w}px`;
      this.usernameInput.style.height = `${layout.input.h}px`;
      this.usernameInput.style.fontSize = `${Math.max(13, Math.round(layout.input.h * 0.42))}px`;
      this.usernameInput.readOnly = true;
      this.usernameInput.style.pointerEvents = "none";
      this.usernameInput.style.cursor = "default";
      this.usernameInput.style.borderColor = this.signedInUsername ? "rgba(154, 255, 210, 0.36)" : "rgba(174, 222, 255, 0.46)";
      this.usernameInput.style.color = this.signedInUsername ? "#d8fff0" : "#edf7ff";
      if (document.activeElement !== this.usernameInput) {
        this.usernameInput.value = this.playerUsername;
      }
    }

    updateCustomLevelInputVisibility() {
      if (!this.customLevelInput || this.currentScreen !== "create_level") {
        if (this.customLevelInput) {
          this.customLevelInput.style.display = "none";
        }
        if (this.publishLevelNameInput) {
          this.publishLevelNameInput.style.display = "none";
        }
        if (this.publishLevelInput) {
          this.publishLevelInput.style.display = "none";
        }
        return;
      }

      if (this.createPublishPromptOpen) {
        this.customLevelInput.style.display = "none";
        this.publishLevelNameInput.style.display = "none";
        this.publishLevelInput.style.display = "none";
        return;
      }

      const layout = this.getCreateLevelTestLayout();
      this.customLevelInput.style.display = "block";
      this.customLevelInput.style.left = `${layout.input.x}px`;
      this.customLevelInput.style.top = `${layout.input.y}px`;
      this.customLevelInput.style.width = `${layout.input.w}px`;
      this.customLevelInput.style.height = `${layout.input.h}px`;
      this.customLevelInput.style.fontSize = `${Math.max(11, Math.round(layout.scale * 13))}px`;
      if (document.activeElement !== this.customLevelInput && this.customLevelInput.value !== this.customLevelTestText) {
        this.customLevelInput.value = this.customLevelTestText;
      }

      const createLayout = this.getCreateLevelLayout();
      this.publishLevelNameInput.style.display = "block";
      this.publishLevelNameInput.style.left = `${createLayout.publishNameInput.x}px`;
      this.publishLevelNameInput.style.top = `${createLayout.publishNameInput.y}px`;
      this.publishLevelNameInput.style.width = `${createLayout.publishNameInput.w}px`;
      this.publishLevelNameInput.style.height = `${createLayout.publishNameInput.h}px`;
      this.publishLevelNameInput.style.fontSize = `${Math.max(11, Math.round(createLayout.scale * 13))}px`;
      if (document.activeElement !== this.publishLevelNameInput && this.publishLevelNameInput.value !== this.publishLevelName) {
        this.publishLevelNameInput.value = this.publishLevelName;
      }

      this.publishLevelInput.style.display = "block";
      this.publishLevelInput.style.left = `${createLayout.publishInput.x}px`;
      this.publishLevelInput.style.top = `${createLayout.publishInput.y}px`;
      this.publishLevelInput.style.width = `${createLayout.publishInput.w}px`;
      this.publishLevelInput.style.height = `${createLayout.publishInput.h}px`;
      this.publishLevelInput.style.fontSize = `${Math.max(10, Math.round(createLayout.scale * 12))}px`;
      if (document.activeElement !== this.publishLevelInput && this.publishLevelInput.value !== this.publishLevelText) {
        this.publishLevelInput.value = this.publishLevelText;
      }
    }

    updateCommunitySearchInputVisibility() {
      if (!this.communitySearchInput || this.currentScreen !== "community_levels") {
        if (this.communitySearchInput) {
          if (document.activeElement === this.communitySearchInput) {
            this.communitySearchInput.blur();
          }
          this.communitySearchInput.style.display = "none";
        }
        return;
      }

      const layout = this.getCommunitySearchLayout();
      if (!layout) {
        this.communitySearchInput.style.display = "none";
        return;
      }

      this.communitySearchInput.style.display = "block";
      this.communitySearchInput.style.left = `${layout.x}px`;
      this.communitySearchInput.style.top = `${layout.y}px`;
      this.communitySearchInput.style.width = `${layout.w}px`;
      this.communitySearchInput.style.height = `${layout.h}px`;
      this.communitySearchInput.style.fontSize = `${layout.fontSize}px`;
      this.communitySearchInput.style.pointerEvents = "auto";
      this.communitySearchInput.style.cursor = "text";
      this.communitySearchInput.style.borderColor = "rgba(174, 222, 255, 0.46)";
      this.communitySearchInput.style.color = "#edf7ff";
      if (document.activeElement !== this.communitySearchInput && this.communitySearchInput.value !== this.communityLevelSearchText) {
        this.communitySearchInput.value = this.communityLevelSearchText;
      }
    }

    getSurfacePhysics(x, y) {
      const tile = this.level.getFloorTileAt(x, y);
      if (tile === "I") {
        return {
          type: "ice",
          accelerationMultiplier: ICE_ACCELERATION_MULTIPLIER,
          dragMultiplier: ICE_DRAG_MULTIPLIER,
          gripMultiplier: ICE_GRIP_MULTIPLIER,
          turnMultiplier: ICE_TURN_MULTIPLIER,
          turnResponseMultiplier: ICE_TURN_RESPONSE_MULTIPLIER,
          angularDragMultiplier: ICE_ANGULAR_DRAG_MULTIPLIER,
          maxSpeedMultiplier: ICE_MAX_SPEED_MULTIPLIER,
        };
      }
      return {
        type: "road",
        accelerationMultiplier: 1,
        dragMultiplier: 1,
        gripMultiplier: 1,
        turnMultiplier: 1,
        turnResponseMultiplier: 1,
        angularDragMultiplier: 1,
        maxSpeedMultiplier: 1,
      };
    }

    moveCar(car, dt, owner = null) {
      const distance = Math.hypot(car.vx, car.vy) * dt;
      const steps = clamp(Math.ceil(distance / (TILE_SIZE * 0.2)), 1, 8);
      const subDt = dt / steps;

      for (let index = 0; index < steps; index += 1) {
        // Micro-steps keep the car body collider from clipping through narrow wall gaps.
        car.x += car.vx * subDt;
        car.y += car.vy * subDt;

        if (!owner || this.isRaceMode()) {
          const goalPenetration = this.getGoalPenetration(car);
          if (goalPenetration) {
            if (owner && this.isRaceMode()) {
              this.triggerRaceGoalHit(owner, goalPenetration);
            } else {
              this.triggerGoalHit(goalPenetration);
            }
            return;
          }
          if (this.goalTriggered) {
            continue;
          }
        }

        if (this.resolveHazardCollision(car)) {
          if (!(owner || this).exploding) {
            this.triggerExplosion(owner);
          }
          return;
        }

        const collision = this.resolveWallPenetration(car);
        if (collision.hit) {
          this.applyWallResponse(
            car,
            collision.normalX,
            collision.normalY,
            collision.impactSpeed,
            collision.tileX,
            collision.tileY,
            owner,
            collision.wallType
          );
        }
      }
    }

    getCarHitbox(car) {
      const forwardX = Math.cos(car.angle);
      const forwardY = Math.sin(car.angle);
      const rightX = -forwardY;
      const rightY = forwardX;
      const halfLength = CAR_HITBOX_LENGTH * 0.5;
      const halfWidth = CAR_HITBOX_WIDTH * 0.5;
      return {
        centerX: car.x,
        centerY: car.y,
        forwardX,
        forwardY,
        rightX,
        rightY,
        halfLength,
        halfWidth,
        corners: [
          {
            x: car.x + forwardX * halfLength + rightX * halfWidth,
            y: car.y + forwardY * halfLength + rightY * halfWidth,
          },
          {
            x: car.x + forwardX * halfLength - rightX * halfWidth,
            y: car.y + forwardY * halfLength - rightY * halfWidth,
          },
          {
            x: car.x - forwardX * halfLength - rightX * halfWidth,
            y: car.y - forwardY * halfLength - rightY * halfWidth,
          },
          {
            x: car.x - forwardX * halfLength + rightX * halfWidth,
            y: car.y - forwardY * halfLength + rightY * halfWidth,
          },
        ],
      };
    }

    projectPointsOntoAxis(points, axisX, axisY) {
      let min = Infinity;
      let max = -Infinity;
      for (const point of points) {
        const projection = point.x * axisX + point.y * axisY;
        min = Math.min(min, projection);
        max = Math.max(max, projection);
      }
      return { min, max };
    }

    projectTileOntoAxis(left, top, right, bottom, axisX, axisY) {
      return this.projectPointsOntoAxis(
        [
          { x: left, y: top },
          { x: right, y: top },
          { x: right, y: bottom },
          { x: left, y: bottom },
        ],
        axisX,
        axisY
      );
    }

    getCarTilePenetration(car, tileX, tileY) {
      const left = tileX * TILE_SIZE;
      const top = tileY * TILE_SIZE;
      const right = left + TILE_SIZE;
      const bottom = top + TILE_SIZE;
      const hitbox = this.getCarHitbox(car);
      const tileCenterX = left + TILE_SIZE * 0.5;
      const tileCenterY = top + TILE_SIZE * 0.5;
      const axes = [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: hitbox.forwardX, y: hitbox.forwardY },
        { x: hitbox.rightX, y: hitbox.rightY },
      ];
      let bestNormal = null;
      let minOverlap = Infinity;

      for (const axis of axes) {
        const carProjection = this.projectPointsOntoAxis(hitbox.corners, axis.x, axis.y);
        const tileProjection = this.projectTileOntoAxis(left, top, right, bottom, axis.x, axis.y);
        const overlap = Math.min(carProjection.max, tileProjection.max) - Math.max(carProjection.min, tileProjection.min);
        if (overlap <= 0) {
          return null;
        }

        const axisDirection = dot(hitbox.centerX - tileCenterX, hitbox.centerY - tileCenterY, axis.x, axis.y) >= 0 ? 1 : -1;
        const normalX = axis.x * axisDirection;
        const normalY = axis.y * axisDirection;
        if (overlap < minOverlap) {
          minOverlap = overlap;
          bestNormal = { x: normalX, y: normalY };
        }
      }

      return bestNormal
        ? {
            normalX: bestNormal.x,
            normalY: bestNormal.y,
            penetration: minOverlap,
          }
        : null;
    }

    resolveWallPenetration(car) {
      let hit = false;
      let sumNormalX = 0;
      let sumNormalY = 0;
      let strongestImpact = 0;
      let flashTileX = 0;
      let flashTileY = 0;
      let wallType = "wall";

      for (let pass = 0; pass < 4; pass += 1) {
        let passHit = false;
        const nearbyWalls = this.level.getWallTilesNear(car.x, car.y, CAR_TILE_COLLISION_RADIUS);

        for (const tile of nearbyWalls) {
          const penetration = this.getCarTilePenetration(car, tile.x, tile.y);
          if (!penetration) {
            continue;
          }

          car.x += penetration.normalX * (penetration.penetration + 0.05);
          car.y += penetration.normalY * (penetration.penetration + 0.05);
          passHit = true;
          hit = true;
          sumNormalX += penetration.normalX;
          sumNormalY += penetration.normalY;
          const impactSpeed = Math.max(0, -dot(car.vx, car.vy, penetration.normalX, penetration.normalY));
          if (impactSpeed > strongestImpact) {
            strongestImpact = impactSpeed;
            flashTileX = tile.x;
            flashTileY = tile.y;
            wallType = tile.type || "wall";
          }
        }

        if (!passHit) {
          break;
        }
      }

      if (!hit) {
        return { hit: false, normalX: 0, normalY: 0, impactSpeed: 0 };
      }

      const normal = normalize(sumNormalX, sumNormalY);
      return {
        hit: true,
        normalX: normal.x,
        normalY: normal.y,
        impactSpeed: strongestImpact,
        tileX: flashTileX,
        tileY: flashTileY,
        wallType,
      };
    }

    resolveHazardCollision(car) {
      const nearbyHazards = this.level.getHazardTilesNear(car.x, car.y, CAR_TILE_COLLISION_RADIUS);
      for (const tile of nearbyHazards) {
        if (this.getCarTilePenetration(car, tile.x, tile.y)) {
          return true;
        }
      }
      return false;
    }

    applyWallResponse(car, normalX, normalY, impactSpeed, tileX, tileY, owner = null, wallType = "wall") {
      const normalSpeed = dot(car.vx, car.vy, normalX, normalY);
      if (normalSpeed >= 0) {
        return;
      }

      const touchState = owner || this;
      const isBumperWall = wallType === "bumper";
      const freshImpact = !touchState.wallTouching && !touchState.wallTouchingThisFrame;
      touchState.wallTouchingThisFrame = true;
      touchState.levelTouchedWallThisRun = true;
      if (freshImpact && touchState === this && this.isSpeedrunMode()) {
        this.speedrunTouchedWall = true;
      }
      const impactVelocity = Math.hypot(car.vx, car.vy);
      const flashStrength = clamp(impactSpeed / WALL_FLASH_SPEED, 0, 1);
      const tangentX = -normalY;
      const tangentY = normalX;
      const tangentSpeed = dot(car.vx, car.vy, tangentX, tangentY);
      const bounceScale = isBumperWall
        ? freshImpact ? (BUMPER_BOUNCE + flashStrength * 0.55) : BUMPER_BOUNCE * 0.65
        : 0;
      const wallBounceAmount = impactSpeed * (freshImpact ? WALL_BOUNCE_VELOCITY_RATIO : WALL_BOUNCE_VELOCITY_RATIO * 0.2);
      const tangentRetain = isBumperWall
        ? freshImpact ? lerp(0.78, 0.88, flashStrength) : 0.92
        : owner
          ? freshImpact ? lerp(WALL_TANGENT_RETAIN, 0.64, flashStrength) : 0.82
          : freshImpact ? lerp(WALL_TANGENT_RETAIN, 0.6, flashStrength) : 0.82;
      const speedRetain = isBumperWall
        ? freshImpact ? lerp(BUMPER_SPEED_RETAIN, 1.08, flashStrength) : 1.02
        : owner
          ? freshImpact ? lerp(WALL_SPEED_RETAIN, 0.6, flashStrength) : 0.88
          : freshImpact ? lerp(WALL_SPEED_RETAIN, 0.54, flashStrength) : 0.88;
      const bouncedNormal = isBumperWall
        ? -normalSpeed * bounceScale + (freshImpact ? BUMPER_PUSH + impactSpeed * 0.14 : 26)
        : wallBounceAmount;

      car.vx = tangentX * tangentSpeed * tangentRetain + normalX * bouncedNormal;
      car.vy = tangentY * tangentSpeed * tangentRetain + normalY * bouncedNormal;
      car.vx *= speedRetain;
      car.vy *= speedRetain;

      if (freshImpact && impactSpeed > 0) {
        const separation = WALL_IMPACT_SEPARATION + impactSpeed * 0.014;
        car.x += normalX * separation;
        car.y += normalY * separation;

        const postImpactSpeed = Math.hypot(car.vx, car.vy);
        const glancingImpact = clamp(Math.abs(tangentSpeed) / Math.max(1, impactVelocity), 0, 1);
        const facingX = Math.cos(car.angle);
        const facingY = Math.sin(car.angle);
        const forwardSpeed = dot(car.vx, car.vy, facingX, facingY);
        const reverseImpact = forwardSpeed < -18;
        if (postImpactSpeed > 20 && glancingImpact > 0.12 && !reverseImpact) {
          const desiredAngle = Math.atan2(car.vy, car.vx);
          const angleDelta = Math.atan2(Math.sin(desiredAngle - car.angle), Math.cos(desiredAngle - car.angle));
          const turnAmount = (WALL_IMPACT_TURN * 0.35 + glancingImpact * 0.12) * glancingImpact;
          car.angle += angleDelta * turnAmount;
          car.angularVelocity += angleDelta * (0.8 + glancingImpact * 1.4) * glancingImpact;
        } else if (reverseImpact) {
          car.angularVelocity *= 0.18;
        }

        // Only count the first frame of a wall contact so scrapes do not stack damage.
        if (!isBumperWall && impactVelocity >= WALL_DAMAGE_MIN_VELOCITY) {
          touchState.totalDamage += impactVelocity;
        }
        this.triggerWallFlash(tileX, tileY, flashStrength);
      }

      if (freshImpact && impactSpeed > 60) {
        const shakeCap = owner ? 10 : 16;
        const shakeScale = owner ? 0.01 : 0.015;
        const shakeTime = owner ? 0.05 : 0.08;
        const shakeLimit = owner ? 0.14 : 0.2;
        this.shakeStrength = Math.min(shakeCap, this.shakeStrength + impactSpeed * shakeScale);
        this.shakeTime = Math.min(shakeLimit, this.shakeTime + shakeTime);
      }
    }

    triggerWallFlash(tileX, tileY, strength) {
      const key = `${tileX},${tileY}`;
      const existing = this.wallFlashes.get(key);
      const nextStrength = existing ? Math.max(existing.strength, strength) : strength;
      this.wallFlashes.set(key, {
        strength: nextStrength,
        life: WALL_FLASH_DURATION,
        maxLife: WALL_FLASH_DURATION,
      });
    }

    updateWallFlashes(dt) {
      for (const [key, flash] of this.wallFlashes.entries()) {
        flash.life -= dt;
        if (flash.life <= 0) {
          this.wallFlashes.delete(key);
        }
      }
    }

    getGoalPenetration(car = this.car) {
      if (this.goalTriggered || this.completed || this.gameMode === "tag") {
        return null;
      }
      const goal = this.level.goal;
      const goalTileX = Math.floor(goal.x / TILE_SIZE);
      const goalTileY = Math.floor(goal.y / TILE_SIZE);
      return this.getCarTilePenetration(car, goalTileX, goalTileY);
    }

    updateGoal(dt) {
      if (this.goalTriggered) {
        return;
      }
      const penetration = this.getGoalPenetration(this.car);
      if (penetration) {
        this.triggerGoalHit(penetration);
      } else {
        this.goalTimer = 0;
      }
    }

    updateSkidMarks(dt, telemetry, owner = null) {
      const car = owner ? owner.car : this.car;
      const skidMarks = owner ? owner.skidMarks : this.skidMarks;
      const facingX = Math.cos(car.angle);
      const facingY = Math.sin(car.angle);
      const rightX = -Math.sin(car.angle);
      const rightY = Math.cos(car.angle);

      const rearOffset = -CAR_LENGTH * 0.3;
      const wheelOffset = CAR_WIDTH * 0.35;
      const leftWheel = {
        x: car.x + facingX * rearOffset - rightX * wheelOffset,
        y: car.y + facingY * rearOffset - rightY * wheelOffset,
      };
      const rightWheel = {
        x: car.x + facingX * rearOffset + rightX * wheelOffset,
        y: car.y + facingY * rearOffset + rightY * wheelOffset,
      };

      const skidding = telemetry.driftAmount > 75 && telemetry.speed > 140 && telemetry.driftRatio > 0.3;
      if (owner) {
        owner.skidEmitTimer -= dt;
      } else {
        this.skidEmitTimer -= dt;
      }

      const emitTimer = owner ? owner.skidEmitTimer : this.skidEmitTimer;
      if (skidding && emitTimer <= 0) {
        this.appendSkidSegment("left", leftWheel, telemetry.driftAmount, skidMarks, owner);
        this.appendSkidSegment("right", rightWheel, telemetry.driftAmount, skidMarks, owner);
        if (owner) {
          owner.skidEmitTimer = 0.035;
        } else {
          this.skidEmitTimer = 0.035;
        }
      } else if (!skidding) {
        if (owner) {
          owner.lastSkidLeft = null;
          owner.lastSkidRight = null;
        } else {
          this.lastSkidLeft = null;
          this.lastSkidRight = null;
        }
      }

      for (const mark of skidMarks) {
        mark.life -= dt;
      }
      const filtered = skidMarks.filter((mark) => mark.life > 0);
      if (owner) {
        owner.skidMarks = filtered;
      } else {
        this.skidMarks = filtered;
      }
    }

    startFireSequence(owner = null) {
      if (owner) {
        owner.fireSequenceTimer = FIRE_FAILURE_DELAY;
        return;
      }
      this.fireSequenceTimer = FIRE_FAILURE_DELAY;
    }

    updateFailureState(dt, owner = null) {
      if (owner) {
        if (owner.fireSequenceTimer > 0) {
          owner.fireSequenceTimer = Math.max(0, owner.fireSequenceTimer - dt);
          if (owner.fireSequenceTimer <= 0) {
            this.triggerExplosion(owner);
          }
        }

        if (owner.exploding) {
          owner.explosionTimer = Math.max(0, owner.explosionTimer - dt);
        }
        return;
      }

      if (this.fireSequenceTimer > 0) {
        this.fireSequenceTimer = Math.max(0, this.fireSequenceTimer - dt);
        if (this.fireSequenceTimer <= 0) {
          this.triggerExplosion();
        }
      }

      if (this.exploding) {
        this.explosionTimer = Math.max(0, this.explosionTimer - dt);
      }
    }

    getSmokeDamageLevel(owner = null) {
      const totalDamage = owner ? owner.totalDamage : this.totalDamage;
      return clamp((totalDamage - SMOKE_DAMAGE_START) / SMOKE_DAMAGE_SPAN, 0, 1);
    }

    getFireDamageLevel(owner = null) {
      const totalDamage = owner ? owner.totalDamage : this.totalDamage;
      return clamp((totalDamage - FIRE_DAMAGE_START) / FIRE_DAMAGE_SPAN, 0, 1);
    }

    updateDamageEffects(dt, owner = null) {
      const state = owner || this;
      const car = owner ? owner.car : this.car;
      const smokeLevel = this.getSmokeDamageLevel(state);
      const fireLevel = this.getFireDamageLevel(state);

      state.smokeEmitTimer -= dt;
      if (!state.exploding && smokeLevel > 0) {
        const smokeInterval = lerp(0.16, 0.034, smokeLevel);
        while (state.smokeEmitTimer <= 0) {
          this.spawnDamageSmoke(smokeLevel, state, car);
          if (smokeLevel > 0.55 && Math.random() < smokeLevel * 0.65) {
            this.spawnDamageSmoke(smokeLevel, state, car);
          }
          state.smokeEmitTimer += smokeInterval;
        }
      } else {
        state.smokeEmitTimer = 0;
      }

      state.fireEmitTimer -= dt;
      if (!state.exploding && fireLevel > 0) {
        const fireInterval = lerp(0.11, 0.025, fireLevel);
        while (state.fireEmitTimer <= 0) {
          this.spawnDamageFire(fireLevel, state, car);
          if (Math.random() < 0.45 + fireLevel * 0.45) {
            this.spawnDamageFire(fireLevel, state, car);
          }
          state.fireEmitTimer += fireInterval;
        }
      } else {
        state.fireEmitTimer = 0;
      }

      for (const particle of state.damageSmoke) {
        particle.life -= dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vx *= Math.exp(-dt * 1.7);
        particle.vy *= Math.exp(-dt * 1.7);
        particle.size += particle.growth * dt;
        particle.alpha = clamp(particle.life / particle.maxLife, 0, 1) * particle.maxAlpha;
      }
      state.damageSmoke = state.damageSmoke.filter((particle) => particle.life > 0);

      for (const particle of state.damageFire) {
        particle.life -= dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vx *= Math.exp(-dt * 4.4);
        particle.vy *= Math.exp(-dt * 4.4);
        particle.size += particle.growth * dt;
        particle.alpha = clamp(particle.life / particle.maxLife, 0, 1) * particle.maxAlpha;
      }
      state.damageFire = state.damageFire.filter((particle) => particle.life > 0);

      for (const particle of state.explosionParticles) {
        particle.life -= dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vx *= Math.exp(-dt * 3.4);
        particle.vy *= Math.exp(-dt * 3.4);
        particle.size += particle.growth * dt;
        particle.alpha = clamp(particle.life / particle.maxLife, 0, 1) * particle.maxAlpha;
      }
      state.explosionParticles = state.explosionParticles.filter((particle) => particle.life > 0);
    }

    triggerExplosion(owner = null) {
      const state = owner || this;
      const car = owner ? owner.car : this.car;
      state.fireSequenceTimer = 0;
      state.exploding = true;
      state.explosionTimer = EXPLOSION_DURATION;
      if (!owner) {
        this.levelTimer = 0;
        this.levelTimerStarted = this.isSpeedrunMode() && this.speedrunTimerStarted;
      }
      this.shakeStrength = Math.max(this.shakeStrength, owner ? 12 : 18);
      this.shakeTime = Math.max(this.shakeTime, owner ? 0.18 : 0.28);
      state.damageSmoke.length = 0;
      state.damageFire.length = 0;
      state.smokeEmitTimer = 0;
      state.fireEmitTimer = 0;

      for (let index = 0; index < 28; index += 1) {
        const angle = (index / 28) * Math.PI * 2 + Math.random() * 0.22;
        const speed = 90 + Math.random() * 230;
        const life = 0.22 + Math.random() * 0.26;
        state.explosionParticles.push({
          x: car.x + Math.cos(angle) * (6 + Math.random() * 10),
          y: car.y + Math.sin(angle) * (6 + Math.random() * 10),
          vx: Math.cos(angle) * speed + car.vx * 0.18,
          vy: Math.sin(angle) * speed + car.vy * 0.18,
          size: 8 + Math.random() * 14,
          growth: 12 + Math.random() * 18,
          life,
          maxLife: life,
          maxAlpha: 0.5 + Math.random() * 0.35,
          alpha: 0,
          palette: index % 3,
        });
      }
    }

    respawnAtLevelStart() {
      this.totalDamage = 0;
      this.damageSmoke.length = 0;
      this.damageFire.length = 0;
      this.explosionParticles.length = 0;
      this.smokeEmitTimer = 0;
      this.fireEmitTimer = 0;
      this.fireSequenceTimer = 0;
      this.explosionTimer = 0;
      this.exploding = false;
      this.skidMarks.length = 0;
      this.lastSkidLeft = null;
      this.lastSkidRight = null;
      this.wallFlashes.clear();
      this.wallTouching = false;
      this.wallTouchingThisFrame = false;
      this.levelTouchedWallThisRun = false;
      this.levelTimer = 0;
      this.levelTimerStarted = this.isSpeedrunMode() && this.speedrunTimerStarted;
      this.shakeStrength = 0;
      this.shakeTime = 0;
      if (this.isSpeedrunMode()) {
        this.death_counter = this.getSpeedrunDeathCount() + 1;
      }
      this.car.reset(this.level.start.x, this.level.start.y, this.level.startAngle);
      this.camera.snap(this.level.start.x, this.level.start.y);
    }

    respawnTagPlayer(player) {
      this.resetTagPlayerState(player);
      player.car.reset(player.spawnX, player.spawnY, player.spawnAngle);
      if (this.isRaceMode()) {
        player.isIt = false;
        return;
      }
      for (const contender of this.tagCars) {
        contender.isIt = false;
      }
      player.isIt = true;
    }

    resolveTagCarCollision() {
      const redPlayer = this.getTagPlayer("red");
      const bluePlayer = this.getTagPlayer("blue");
      if (redPlayer.exploding || bluePlayer.exploding) {
        return;
      }
      const redCar = redPlayer.car;
      const blueCar = bluePlayer.car;
      let dx = blueCar.x - redCar.x;
      let dy = blueCar.y - redCar.y;
      let distance = Math.hypot(dx, dy);
      const minimumDistance = CAR_RADIUS * 2;

      if (distance >= minimumDistance) {
        return;
      }

      if (distance < 0.0001) {
        dx = Math.cos(redCar.angle);
        dy = Math.sin(redCar.angle);
        distance = 1;
      }

      const normalX = dx / distance;
      const normalY = dy / distance;
      const overlap = minimumDistance - distance;
      redCar.x -= normalX * overlap * 0.5;
      redCar.y -= normalY * overlap * 0.5;
      blueCar.x += normalX * overlap * 0.5;
      blueCar.y += normalY * overlap * 0.5;

      const relativeSpeed = dot(blueCar.vx - redCar.vx, blueCar.vy - redCar.vy, normalX, normalY);
      if (relativeSpeed < 0) {
        const impulse = -relativeSpeed * 0.5;
        redCar.vx -= normalX * impulse;
        redCar.vy -= normalY * impulse;
        blueCar.vx += normalX * impulse;
        blueCar.vy += normalY * impulse;
      }

      redCar.vx *= TAG_COLLISION_DAMPING;
      redCar.vy *= TAG_COLLISION_DAMPING;
      blueCar.vx *= TAG_COLLISION_DAMPING;
      blueCar.vy *= TAG_COLLISION_DAMPING;

      const redIsTagger = redPlayer.isIt;
      const blueIsTagger = bluePlayer.isIt;
      if (this.tagTransferCooldown > 0 || redIsTagger === blueIsTagger) {
        return;
      }

      const nextTagger = redIsTagger ? bluePlayer : redPlayer;
      const previousTagger = redIsTagger ? redPlayer : bluePlayer;
      previousTagger.isIt = false;
      nextTagger.isIt = true;
      this.tagTransferCooldown = TAG_TRANSFER_COOLDOWN;

      redCar.vx -= normalX * TAG_PUSH_VELOCITY;
      redCar.vy -= normalY * TAG_PUSH_VELOCITY;
      blueCar.vx += normalX * TAG_PUSH_VELOCITY;
      blueCar.vy += normalY * TAG_PUSH_VELOCITY;
      this.shakeStrength = Math.max(this.shakeStrength, 8);
      this.shakeTime = Math.max(this.shakeTime, 0.12);
    }

    spawnDamageSmoke(smokeLevel, owner = null, car = owner ? owner.car : this.car) {
      const state = owner || this;
      const facingX = Math.cos(car.angle);
      const facingY = Math.sin(car.angle);
      const rightX = -facingY;
      const rightY = facingX;
      const sourceX = car.x + facingX * (CAR_LENGTH * 0.1) + rightX * (Math.random() - 0.5) * CAR_WIDTH * 0.55;
      const sourceY = car.y + facingY * (CAR_LENGTH * 0.1) + rightY * (Math.random() - 0.5) * CAR_WIDTH * 0.55;
      const driftScale = lerp(24, 78, smokeLevel);
      const carVelocityScale = lerp(0.16, 0.38, smokeLevel);
      const life = lerp(0.7, 1.35, smokeLevel) + Math.random() * 0.18;

      state.damageSmoke.push({
        x: sourceX,
        y: sourceY,
        vx: car.vx * carVelocityScale - facingX * driftScale + rightX * (Math.random() - 0.5) * 56,
        vy: car.vy * carVelocityScale - facingY * driftScale + rightY * (Math.random() - 0.5) * 56,
        size: lerp(5, 13, smokeLevel) + Math.random() * lerp(2, 7, smokeLevel),
        growth: lerp(22, 48, smokeLevel),
        life,
        maxLife: life,
        maxAlpha: lerp(0.16, 0.42, smokeLevel),
        alpha: 0,
      });
    }

    spawnDamageFire(fireLevel, owner = null, car = owner ? owner.car : this.car) {
      const state = owner || this;
      const facingX = Math.cos(car.angle);
      const facingY = Math.sin(car.angle);
      const rightX = -facingY;
      const rightY = facingX;
      const sourceX = car.x + facingX * (CAR_LENGTH * 0.14) + rightX * (Math.random() - 0.5) * CAR_WIDTH * 0.6;
      const sourceY = car.y + facingY * (CAR_LENGTH * 0.14) + rightY * (Math.random() - 0.5) * CAR_WIDTH * 0.6;
      const life = lerp(0.22, 0.42, fireLevel) + Math.random() * 0.06;

      state.damageFire.push({
        x: sourceX,
        y: sourceY,
        vx: car.vx * 0.22 - facingX * lerp(12, 36, fireLevel) + rightX * (Math.random() - 0.5) * 68,
        vy: car.vy * 0.22 - facingY * lerp(12, 36, fireLevel) + rightY * (Math.random() - 0.5) * 68,
        size: lerp(5, 11, fireLevel) + Math.random() * lerp(2, 6, fireLevel),
        growth: lerp(18, 34, fireLevel),
        life,
        maxLife: life,
        maxAlpha: lerp(0.5, 0.85, fireLevel),
        alpha: 0,
      });
    }

    appendSkidSegment(side, point, driftAmount, skidMarks = this.skidMarks, owner = null) {
      const key = side === "left" ? "lastSkidLeft" : "lastSkidRight";
      const previous = owner ? owner[key] : this[key];
      if (owner) {
        owner[key] = point;
      } else {
        this[key] = point;
      }

      if (!previous) {
        return;
      }

      const segmentLength = Math.hypot(point.x - previous.x, point.y - previous.y);
      if (segmentLength < 2) {
        return;
      }

      skidMarks.push({
        x1: previous.x,
        y1: previous.y,
        x2: point.x,
        y2: point.y,
        width: clamp(1.8 + driftAmount * 0.01, 1.8, 3.8),
        alpha: clamp(0.22 + driftAmount / 420, 0.22, 0.55),
        life: 7.5,
        maxLife: 7.5,
      });
    }

    finishTagMatch() {
      this.tagMatchFinished = true;
      this.completed = true;
      const redPlayer = this.getTagPlayer("red");
      const bluePlayer = this.getTagPlayer("blue");
      const difference = Math.abs(redPlayer.taggedTime - bluePlayer.taggedTime);
      if (difference < 0.05) {
        this.tagWinnerText = "Draw game";
      } else {
        const winner = redPlayer.taggedTime < bluePlayer.taggedTime ? redPlayer : bluePlayer;
        this.tagWinnerText = `${winner.label} wins`;
      }
    }

    updateCamera(dt) {
      if (this.isRaceMode() && this.goalTriggered) {
        const blastProgress = easeInOutCubic(this.getGoalExplosionProgress());
        const goalCenterX = this.level.goal.x + this.level.goal.w * 0.5;
        const goalCenterY = this.level.goal.y + this.level.goal.h * 0.5;
        const mapCenterX = this.level.pixelWidth * 0.5;
        const mapCenterY = this.level.pixelHeight * 0.5;
        this.camera.update(
          lerp(goalCenterX, mapCenterX, blastProgress * 0.8),
          lerp(goalCenterY, mapCenterY, blastProgress * 0.8),
          dt
        );
        return;
      }

      if (this.isTwoPlayerDrivingMode()) {
        const redPlayer = this.getTagPlayer("red");
        const bluePlayer = this.getTagPlayer("blue");
        const targetX = (redPlayer.car.x + bluePlayer.car.x) * 0.5 + (redPlayer.car.vx + bluePlayer.car.vx) * 0.08;
        const targetY = (redPlayer.car.y + bluePlayer.car.y) * 0.5 + (redPlayer.car.vy + bluePlayer.car.vy) * 0.08;
        this.camera.update(targetX, targetY, dt);
        return;
      }

      if (this.goalTriggered) {
        const blastProgress = easeInOutCubic(this.getGoalExplosionProgress());
        const goalCenterX = this.level.goal.x + this.level.goal.w * 0.5;
        const goalCenterY = this.level.goal.y + this.level.goal.h * 0.5;
        const mapCenterX = this.level.pixelWidth * 0.5;
        const mapCenterY = this.level.pixelHeight * 0.5;
        this.camera.update(
          lerp(goalCenterX, mapCenterX, blastProgress * 0.8),
          lerp(goalCenterY, mapCenterY, blastProgress * 0.8),
          dt
        );
        return;
      }

      const speed = Math.hypot(this.car.vx, this.car.vy);
      const velocityLeadScale = clamp(speed / MAX_SPEED, 0.18, 0.55);
      const facingX = Math.cos(this.car.angle);
      const facingY = Math.sin(this.car.angle);

      const targetX = this.car.x + this.car.vx * 0.2 + facingX * 90 * velocityLeadScale;
      const targetY = this.car.y + this.car.vy * 0.2 + facingY * 90 * velocityLeadScale;

      this.camera.update(targetX, targetY, dt);
    }

    updateShake(dt) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
      this.shakeStrength = Math.max(0, this.shakeStrength - dt * 28);
    }

    worldToScreen(worldX, worldY, camera) {
      return {
        x: worldX - camera.x + this.width * 0.5,
        y: worldY - camera.y + this.height * 0.5,
      };
    }

    getWallFlashIntensity(tileX, tileY) {
      const flash = this.wallFlashes.get(`${tileX},${tileY}`);
      if (!flash) {
        return 0;
      }
      const fade = clamp(flash.life / Math.max(0.0001, flash.maxLife || WALL_FLASH_DURATION), 0, 1);
      return flash.strength * fade;
    }

    getPointRevealStrength(worldX, worldY, carState) {
      if (!carState) {
        return 1;
      }

      const revealRadius = 58;
      const targetGridX = Math.floor(worldX / TILE_SIZE);
      const targetGridY = Math.floor(worldY / TILE_SIZE);
      const targetIsBlocker = this.level.isLightBlocker(targetGridX, targetGridY);
      const bodyDistance = Math.hypot(worldX - carState.x, worldY - carState.y);
      let bestStrength = 0;
      if (bodyDistance <= revealRadius) {
        if (bodyDistance <= 0.001) {
          bestStrength = 1;
        } else {
          const bodyAngle = Math.atan2(worldY - carState.y, worldX - carState.x);
          const bodyRay = this.castHeadlightRay(carState.x, carState.y, bodyAngle, revealRadius + 20, 8);
          if (targetIsBlocker) {
            const hitGridX = Math.floor((bodyRay.x + Math.cos(bodyAngle) * 1.5) / TILE_SIZE);
            const hitGridY = Math.floor((bodyRay.y + Math.sin(bodyAngle) * 1.5) / TILE_SIZE);
            if (hitGridX === targetGridX && hitGridY === targetGridY) {
              const bodyFactor = clamp(1 - bodyDistance / Math.max(revealRadius, 1), 0, 1);
              bestStrength = Math.max(bestStrength, 0.45 + bodyFactor * 0.55);
            }
          } else if (bodyRay.distance + 10 >= bodyDistance) {
            const bodyFactor = clamp(1 - bodyDistance / Math.max(revealRadius, 1), 0, 1);
            bestStrength = Math.max(bestStrength, 0.35 + bodyFactor * 0.65);
          }
        }
      }

      const spread = 0.39;
      const range = 520;
      const angleSlack = 0.26;
      const distanceSlack = 34;

      for (const source of this.getHeadlightSources(carState)) {
        const dx = worldX - source.x;
        const dy = worldY - source.y;
        const distance = Math.hypot(dx, dy);
        if (distance > range + distanceSlack || distance <= 0.001) {
          continue;
        }

        const pointAngle = Math.atan2(dy, dx);
        const angleDelta = Math.abs(Math.atan2(Math.sin(pointAngle - carState.angle), Math.cos(pointAngle - carState.angle)));
        const maxAngle = spread + angleSlack;
        if (angleDelta > maxAngle) {
          continue;
        }

        const ray = this.castHeadlightRay(source.x, source.y, pointAngle, range);
        if (targetIsBlocker) {
          const hitGridX = Math.floor((ray.x + Math.cos(pointAngle) * 1.5) / TILE_SIZE);
          const hitGridY = Math.floor((ray.y + Math.sin(pointAngle) * 1.5) / TILE_SIZE);
          if (hitGridX === targetGridX && hitGridY === targetGridY) {
            const angleFactor = clamp(1 - angleDelta / maxAngle, 0, 1);
            const distanceFactor = clamp(1 - distance / (range + distanceSlack), 0, 1);
            const strength = clamp(angleFactor * angleFactor * (0.45 + distanceFactor * 0.55), 0, 1);
            bestStrength = Math.max(bestStrength, strength);
          }
          continue;
        }

        const overshoot = ray.distance + distanceSlack - distance;
        if (overshoot >= 0) {
          const angleFactor = clamp(1 - angleDelta / maxAngle, 0, 1);
          const distanceFactor = clamp(1 - distance / (range + distanceSlack), 0, 1);
          const occlusionFactor = clamp(overshoot / Math.max(distanceSlack, 1), 0.35, 1);
          const strength = clamp(angleFactor * angleFactor * (0.35 + distanceFactor * 0.65) * occlusionFactor, 0, 1);
          bestStrength = Math.max(bestStrength, strength);
        }
      }

      return bestStrength;
    }

    isRevealed(worldX, worldY, carState) {
      return this.getPointRevealStrength(worldX, worldY, carState) > 0.08;
    }

    buildBlackoutVisibilityMap(carState) {
      if (!carState) {
        return null;
      }

      const revealStates = Array.isArray(carState) ? carState.map((entry) => entry.state || entry) : [carState];
      const width = this.level.width;
      const height = this.level.height;
      const base = new Array(width * height).fill(0);
      const values = new Array(width * height).fill(0);
      const samples = [
        { x: 0.5, y: 0.5, weight: 1.0 },
        { x: 0.28, y: 0.28, weight: 0.86 },
        { x: 0.72, y: 0.28, weight: 0.86 },
        { x: 0.28, y: 0.72, weight: 0.86 },
        { x: 0.72, y: 0.72, weight: 0.86 },
      ];

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          let strength = 0;
          for (const sample of samples) {
            const sampleStrength = revealStates.reduce((best, state) => Math.max(
              best,
              this.getPointRevealStrength(
                (x + sample.x) * TILE_SIZE,
                (y + sample.y) * TILE_SIZE,
                state
              ) * sample.weight
            ), 0);
            strength = Math.max(strength, sampleStrength);
          }
          base[y * width + x] = clamp(strength, 0, 1);
        }
      }

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const index = y * width + x;
          let strength = base[index];
          let neighborGlow = 0;

          for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
            for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
              if (offsetX === 0 && offsetY === 0) {
                continue;
              }
              const neighborX = x + offsetX;
              const neighborY = y + offsetY;
              if (neighborX < 0 || neighborY < 0 || neighborX >= width || neighborY >= height) {
                continue;
              }
              const neighbor = base[neighborY * width + neighborX];
              const weight = offsetX === 0 || offsetY === 0 ? 0.22 : 0.14;
              neighborGlow = Math.max(neighborGlow, neighbor * weight + (neighbor > 0.55 ? 0.05 : 0));
            }
          }

          values[index] = clamp(Math.max(strength, neighborGlow), 0, 1);
        }
      }

      return { width, height, values };
    }

    getBlackoutTileVisibility(visibilityMap, gridX, gridY) {
      if (!visibilityMap || gridX < 0 || gridY < 0 || gridX >= visibilityMap.width || gridY >= visibilityMap.height) {
        return 0;
      }
      return visibilityMap.values[gridY * visibilityMap.width + gridX] || 0;
    }

    getBlackoutVisibilityAtWorld(worldX, worldY, visibilityMap) {
      return this.getBlackoutTileVisibility(visibilityMap, Math.floor(worldX / TILE_SIZE), Math.floor(worldY / TILE_SIZE));
    }

    castHeadlightRay(originX, originY, angle, maxDistance = 540, step = 14) {
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);

      for (let distance = step; distance <= maxDistance; distance += step) {
        const sampleX = originX + dirX * distance;
        const sampleY = originY + dirY * distance;
        const gridX = Math.floor(sampleX / TILE_SIZE);
        const gridY = Math.floor(sampleY / TILE_SIZE);

        if (!this.level.isLightBlocker(gridX, gridY)) {
          continue;
        }

        let low = Math.max(0, distance - step);
        let high = distance;
        for (let index = 0; index < 6; index += 1) {
          const mid = (low + high) * 0.5;
          const midX = originX + dirX * mid;
          const midY = originY + dirY * mid;
          if (this.level.isLightBlocker(Math.floor(midX / TILE_SIZE), Math.floor(midY / TILE_SIZE))) {
            high = mid;
          } else {
            low = mid;
          }
        }

        return {
          x: originX + dirX * low,
          y: originY + dirY * low,
          distance: low,
        };
      }

      return {
        x: originX + dirX * maxDistance,
        y: originY + dirY * maxDistance,
        distance: maxDistance,
      };
    }

    getHeadlightSources(state) {
      const facingX = Math.cos(state.angle);
      const facingY = Math.sin(state.angle);
      const rightX = -facingY;
      const rightY = facingX;
      const noseX = state.x + facingX * (CAR_LENGTH * 0.5);
      const noseY = state.y + facingY * (CAR_LENGTH * 0.5);
      const headlightInset = CAR_LENGTH * 0.06;
      const baseX = noseX - facingX * headlightInset;
      const baseY = noseY - facingY * headlightInset;
      const headlightOffset = CAR_WIDTH * 0.42;

      return [-1, 1].map((sign) => ({
        x: baseX + rightX * headlightOffset * sign,
        y: baseY + rightY * headlightOffset * sign,
      }));
    }

    getTileEntryEdge(tileX, tileY, outsideX, outsideY, insideX, insideY) {
      const outsideGridX = Math.floor(outsideX / TILE_SIZE);
      const outsideGridY = Math.floor(outsideY / TILE_SIZE);
      if (outsideGridX < tileX) {
        return "left";
      }
      if (outsideGridX > tileX) {
        return "right";
      }
      if (outsideGridY < tileY) {
        return "top";
      }
      if (outsideGridY > tileY) {
        return "bottom";
      }

      const localX = insideX - tileX * TILE_SIZE;
      const localY = insideY - tileY * TILE_SIZE;
      const distances = [
        { edge: "left", distance: Math.abs(localX) },
        { edge: "right", distance: Math.abs(TILE_SIZE - localX) },
        { edge: "top", distance: Math.abs(localY) },
        { edge: "bottom", distance: Math.abs(TILE_SIZE - localY) },
      ];
      distances.sort((a, b) => a.distance - b.distance);
      return distances[0].edge;
    }

    isTileEdgeExposed(tileX, tileY, edge) {
      if (edge === "left") {
        return !this.level.isLightBlocker(tileX - 1, tileY);
      }
      if (edge === "right") {
        return !this.level.isLightBlocker(tileX + 1, tileY);
      }
      if (edge === "top") {
        return !this.level.isLightBlocker(tileX, tileY - 1);
      }
      return !this.level.isLightBlocker(tileX, tileY + 1);
    }

    getHeadlightRayCount() {
      const worldScale = this.getWorldRenderScale();
      if (worldScale < 0.56) {
        return 12;
      }
      if (worldScale < 0.78) {
        return 16;
      }
      return 20;
    }

    getHeadlightWallGlowMap(carState, isTagMode) {
      const glowMap = new Map();
      const spread = 0.36;
      const range = 520;
      const rayCount = this.getHeadlightRayCount();
      const states = isTagMode
        ? carState.filter((entry) => !entry.player.exploding).map((entry) => entry.state)
        : (this.exploding ? [] : [carState]);

      for (const state of states) {
        for (const source of this.getHeadlightSources(state)) {
          for (let index = 0; index <= rayCount; index += 1) {
            const t = index / rayCount;
            const rayAngle = state.angle + lerp(-spread, spread, t);
            const ray = this.castHeadlightRay(source.x, source.y, rayAngle, range);
            if (ray.distance >= range - 0.001) {
              continue;
            }

            const gridX = Math.floor((ray.x + Math.cos(rayAngle) * 1.5) / TILE_SIZE);
            const gridY = Math.floor((ray.y + Math.sin(rayAngle) * 1.5) / TILE_SIZE);
            if (!this.level.isLightBlocker(gridX, gridY)) {
              continue;
            }

            const closeness = clamp(1 - ray.distance / HEADLIGHT_WALL_GLOW_RANGE, 0, 1);
            if (closeness <= 0) {
              continue;
            }

            const intensity = closeness * HEADLIGHT_WALL_GLOW_MAX;
            const key = `${gridX},${gridY}`;
            const previous = glowMap.get(key) || { left: 0, right: 0, top: 0, bottom: 0 };
            const hitOutsideX = ray.x;
            const hitOutsideY = ray.y;
            const hitInsideX = ray.x + Math.cos(rayAngle) * 1.5;
            const hitInsideY = ray.y + Math.sin(rayAngle) * 1.5;
            const edge = this.getTileEntryEdge(gridX, gridY, hitOutsideX, hitOutsideY, hitInsideX, hitInsideY);
            if (!this.isTileEdgeExposed(gridX, gridY, edge)) {
              continue;
            }
            previous[edge] = Math.max(previous[edge], intensity);
            glowMap.set(key, previous);
          }
        }
      }

      return glowMap;
    }

    renderHeadlightCone(ctx, camera, state, tint = "255, 244, 214") {
      const spread = 0.36;
      const range = 520;
      const rayCount = this.getHeadlightRayCount();
      const headlightSources = this.getHeadlightSources(state);

      ctx.save();
      ctx.globalCompositeOperation = "screen";

      for (const source of headlightSources) {
        const originX = source.x;
        const originY = source.y;
        const originScreen = this.worldToScreen(originX, originY, camera);
        const rays = [];

        for (let index = 0; index <= rayCount; index += 1) {
          const t = index / rayCount;
          const rayAngle = state.angle + lerp(-spread, spread, t);
          rays.push(this.castHeadlightRay(originX, originY, rayAngle, range));
        }

        const gradient = ctx.createRadialGradient(
          originScreen.x,
          originScreen.y,
          0,
          originScreen.x,
          originScreen.y,
          range
        );
        gradient.addColorStop(0, `rgba(${tint}, 0.32)`);
        gradient.addColorStop(0.22, `rgba(${tint}, 0.18)`);
        gradient.addColorStop(0.72, `rgba(${tint}, 0.06)`);
        gradient.addColorStop(1, `rgba(${tint}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(originScreen.x, originScreen.y);
        for (const ray of rays) {
          const point = this.worldToScreen(ray.x, ray.y, camera);
          ctx.lineTo(point.x, point.y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = `rgba(${tint}, 0.08)`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = `rgba(${tint}, 0.24)`;
        ctx.beginPath();
        ctx.arc(originScreen.x, originScreen.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    renderTileHeadlightGlow(ctx, screen, headlightGlow, glowColor, edgeHighlight) {
      if (!headlightGlow) {
        return;
      }

      const glowDepth = 18;
      const blurSize = 18;
      const drawEdgeGlow = (edge, intensity) => {
        if (intensity <= 0.001) {
          return;
        }

        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha *= clamp(intensity * 1.4, 0, 0.55);
        ctx.shadowColor = `rgba(${glowColor}, 0.95)`;
        ctx.shadowBlur = blurSize;

        let gradient;
        if (edge === "left") {
          gradient = ctx.createLinearGradient(screen.x, 0, screen.x + glowDepth, 0);
          gradient.addColorStop(0, `rgba(${edgeHighlight}, 0.95)`);
          gradient.addColorStop(0.45, `rgba(${glowColor}, 0.45)`);
          gradient.addColorStop(1, `rgba(${glowColor}, 0)`);
          ctx.fillStyle = gradient;
          ctx.fillRect(screen.x - 2, screen.y + 4, glowDepth + 2, TILE_SIZE - 8);
        } else if (edge === "right") {
          gradient = ctx.createLinearGradient(screen.x + TILE_SIZE - glowDepth, 0, screen.x + TILE_SIZE, 0);
          gradient.addColorStop(0, `rgba(${glowColor}, 0)`);
          gradient.addColorStop(0.55, `rgba(${glowColor}, 0.45)`);
          gradient.addColorStop(1, `rgba(${edgeHighlight}, 0.95)`);
          ctx.fillStyle = gradient;
          ctx.fillRect(screen.x + TILE_SIZE - glowDepth, screen.y + 4, glowDepth + 2, TILE_SIZE - 8);
        } else if (edge === "top") {
          gradient = ctx.createLinearGradient(0, screen.y, 0, screen.y + glowDepth);
          gradient.addColorStop(0, `rgba(${edgeHighlight}, 0.95)`);
          gradient.addColorStop(0.45, `rgba(${glowColor}, 0.45)`);
          gradient.addColorStop(1, `rgba(${glowColor}, 0)`);
          ctx.fillStyle = gradient;
          ctx.fillRect(screen.x + 4, screen.y - 2, TILE_SIZE - 8, glowDepth + 2);
        } else {
          gradient = ctx.createLinearGradient(0, screen.y + TILE_SIZE - glowDepth, 0, screen.y + TILE_SIZE);
          gradient.addColorStop(0, `rgba(${glowColor}, 0)`);
          gradient.addColorStop(0.55, `rgba(${glowColor}, 0.45)`);
          gradient.addColorStop(1, `rgba(${edgeHighlight}, 0.95)`);
          ctx.fillStyle = gradient;
          ctx.fillRect(screen.x + 4, screen.y + TILE_SIZE - glowDepth, TILE_SIZE - 8, glowDepth + 2);
        }

        ctx.restore();
      };

      drawEdgeGlow("left", headlightGlow.left);
      drawEdgeGlow("right", headlightGlow.right);
      drawEdgeGlow("top", headlightGlow.top);
      drawEdgeGlow("bottom", headlightGlow.bottom);
    }

    render(alpha, now) {
      this.ctx.clearRect(0, 0, this.width, this.height);
      if (this.currentScreen === "title") {
        this.renderTitleScreen(this.ctx, now);
      } else if (this.currentScreen === "two_player_menu") {
        this.renderTwoPlayerMenuScreen(this.ctx, now);
      } else if (this.currentScreen === "two_player_customization") {
        this.renderTwoPlayerCustomizationScreen(this.ctx, now);
      } else if (this.currentScreen === "leaderboard") {
        this.renderLeaderboardScreen(this.ctx, now);
      } else if (this.currentScreen === "online") {
        this.renderOnlineScreen(this.ctx, now);
      } else if (this.currentScreen === "community_levels") {
        this.renderCommunityLevelsScreen(this.ctx, now);
      } else if (this.currentScreen === "my_levels") {
        this.renderMyLevelsScreen(this.ctx, now);
      } else if (this.currentScreen === "community_detail") {
        this.renderCommunityLevelDetailScreen(this.ctx, now);
      } else if (this.currentScreen === "create_level") {
        this.renderCreateLevelScreen(this.ctx, now);
      } else if (this.currentScreen === "level_select") {
        this.renderLevelSelectScreen(this.ctx, now);
      } else if (this.currentScreen === "customization") {
        this.renderCustomizationScreen(this.ctx, now);
      } else {
        const renderCamera = this.camera.interpolated(alpha);
        const carState = this.isTwoPlayerDrivingMode()
          ? this.tagCars.map((player) => ({
              player,
              state: player.car.getInterpolated(alpha),
            }))
          : this.car.getInterpolated(alpha);
        const shakeOffset = this.getShakeOffset(now);

        renderCamera.x += shakeOffset.x;
        renderCamera.y += shakeOffset.y;

        this.ctx.fillStyle = "#050c12";
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.save();
        const worldScale = this.getWorldRenderScale();
        this.ctx.translate(this.width * 0.5, this.height * 0.5);
        this.ctx.scale(worldScale, worldScale);
        this.ctx.translate(-this.width * 0.5, -this.height * 0.5);
        this.renderWorld(this.ctx, renderCamera, now, carState);
        this.ctx.restore();
        this.renderUI(this.ctx, now);
      }
      this.renderScreenWipe(this.ctx);
    }

    renderScreenWipe(ctx) {
      if (this.screenWipePhase === "idle") {
        return;
      }

      ctx.save();
      ctx.fillStyle = "#000000";
      if (this.screenWipePhase === "cover") {
        const progress = easeInOutCubic(clamp(this.screenWipeTimer / SCREEN_WIPE_IN_TIME, 0, 1));
        const leftEdge = lerp(this.width, 0, progress);
        ctx.fillRect(leftEdge, 0, this.width - leftEdge, this.height);
      } else if (this.screenWipePhase === "hold") {
        ctx.fillRect(0, 0, this.width, this.height);
      } else if (this.screenWipePhase === "reveal") {
        const progress = easeInOutCubic(clamp(this.screenWipeTimer / SCREEN_WIPE_OUT_TIME, 0, 1));
        const panelX = lerp(0, -this.width, progress);
        ctx.fillRect(panelX, 0, this.width, this.height);
      }
      ctx.restore();
    }

    renderTitleScreen(ctx, now) {
      this.renderMenuBackdrop(ctx, now);
      const metrics = this.getMenuHeaderMetrics(this.titleButtons.length, 72);

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#edf7ff";
      ctx.font = `700 ${metrics.titleSize}px Consolas, monospace`;
      ctx.fillText("Drifty", this.width * 0.5, metrics.titleY);
      ctx.fillStyle = "rgba(178, 213, 240, 0.88)";
      ctx.font = `${metrics.subtitleSize}px Consolas, monospace`;
      ctx.fillText(
        fitTextToWidth(ctx, "Slide into the dark and try not to cook the engine", this.width - 28),
        this.width * 0.5,
        metrics.subtitleY
      );
      ctx.restore();

      this.renderTitleButtons(ctx);
      this.renderTitleUsernameBox(ctx);
      this.renderSignOutConfirmOverlay(ctx);
    }

    renderTwoPlayerMenuScreen(ctx, now) {
      this.renderMenuBackdrop(ctx, now);
      const metrics = this.getMenuHeaderMetrics(this.twoPlayerButtons.length, 60);

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#edf7ff";
      ctx.font = `700 ${metrics.titleSize}px Consolas, monospace`;
      ctx.fillText("2 Player", this.width * 0.5, metrics.titleY);
      ctx.fillStyle = "rgba(178, 213, 240, 0.88)";
      ctx.font = `${metrics.subtitleSize}px Consolas, monospace`;
      ctx.fillText(
        fitTextToWidth(ctx, "Play tag, race levels, or customize both cars.", this.width - 28),
        this.width * 0.5,
        metrics.subtitleY
      );
      if (this.twoPlayerNotice) {
        ctx.fillStyle = "#ffd166";
        ctx.font = `700 ${metrics.subtitleSize}px Consolas, monospace`;
        ctx.fillText(fitTextToWidth(ctx, this.twoPlayerNotice, this.width - 28), this.width * 0.5, metrics.bottomY);
      }
      ctx.restore();

      this.renderTwoPlayerButtons(ctx);
    }

    renderLeaderboardScreen(ctx, now) {
      this.renderMenuBackdrop(ctx, now);

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#edf7ff";
      ctx.font = "700 56px Consolas, monospace";
      const titleY = this.height * 0.16;
      ctx.fillText("World Records", this.width * 0.5, titleY);
      ctx.fillStyle = "rgba(178, 213, 240, 0.88)";
      ctx.font = "18px Consolas, monospace";
      const leaderboardStatusColor = this.onlineLeaderboardStatusTone === "online"
        ? "rgba(154, 255, 210, 0.92)"
        : this.onlineLeaderboardStatusTone === "offline"
          ? "rgba(255, 192, 154, 0.92)"
          : "rgba(210, 233, 255, 0.9)";
      ctx.fillStyle = leaderboardStatusColor;
      ctx.font = "14px Consolas, monospace";
      ctx.fillText(this.onlineLeaderboardStatusText, this.width * 0.5, titleY + 26);
      ctx.restore();

      const periodTabs = this.getLeaderboardPeriodTabs();
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const tab of periodTabs) {
        const hover = tab.hover || 0;
        const active = tab.active;
        ctx.save();
        ctx.translate(tab.x + tab.w * 0.5, tab.y + tab.h * 0.5);
        ctx.scale(1 + hover * 0.04, 1 + hover * 0.04);
        ctx.shadowColor = active
          ? `rgba(154, 255, 210, ${0.16 + hover * 0.28})`
          : `rgba(128, 214, 255, ${0.12 + hover * 0.22})`;
        ctx.shadowBlur = 6 + hover * 14;
        const fill = ctx.createLinearGradient(-tab.w * 0.5, -tab.h * 0.5, tab.w * 0.5, tab.h * 0.5);
        if (active) {
          fill.addColorStop(0, "rgba(17, 68, 54, 0.95)");
          fill.addColorStop(1, "rgba(26, 112, 72, 0.92)");
        } else {
          fill.addColorStop(0, "rgba(9, 28, 42, 0.86)");
          fill.addColorStop(1, "rgba(14, 47, 66, 0.82)");
        }
        ctx.fillStyle = fill;
        ctx.strokeStyle = active
          ? `rgba(178, 255, 214, ${0.34 + hover * 0.36})`
          : `rgba(149, 224, 255, ${0.22 + hover * 0.42})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(-tab.w * 0.5, -tab.h * 0.5, tab.w, tab.h, tab.radius);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = active ? "#e6fff0" : "#d7ebf4";
        ctx.font = `700 ${tab.fontSize}px Consolas, monospace`;
        ctx.fillText(tab.label, 0, 1);
        ctx.restore();
      }
      ctx.restore();

      const panelGap = 18;
      const panelW = Math.min(360, Math.max(220, (this.width - 96 - panelGap * 2) / 3));
      const totalW = panelW * 3 + panelGap * 2;
      const startX = this.width * 0.5 - totalW * 0.5;
      const panelsTop = Math.round(periodTabs[0].y + periodTabs[0].h + 16);
      const speedrunCardH = 138;
      const maxPanelH = Math.max(300, Math.min(this.height - panelsTop - speedrunCardH - 136, 404));
      const rowH = Math.max(26, Math.floor((maxPanelH - 62) / LEVELS.length));
      const panelH = 62 + rowH * LEVELS.length;
      const speedrunY = panelsTop + panelH + 20;
      const displayedWorldRecords = this.getDisplayedLevelLeaderboardRecords("level_normal", this.worldRecords);
      const displayedPerfectWorldRecords = this.getDisplayedLevelLeaderboardRecords("level_perfect", this.perfectWorldRecords);
      const displayedBlackoutWorldRecords = this.getDisplayedLevelLeaderboardRecords("level_blackout", this.blackoutWorldRecords);

      const renderPreview = (record, centerX, centerY, scale, fallbackColor) => {
        const normalized = this.normalizeWorldRecordEntry(record);
        const hasRecord = Number.isFinite(normalized.time);
        ctx.save();
        ctx.translate(centerX, centerY);
        if (hasRecord) {
          ctx.scale(scale, scale);
          ctx.shadowColor = hexToRgba(normalized.carColor, 0.28);
          ctx.shadowBlur = 12;
          this.drawCarShape(ctx, this.getPlayerCarPalette(normalized.carColor), normalized.carVariant);
        } else {
          ctx.strokeStyle = fallbackColor;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.roundRect(-22, -13, 44, 26, 10);
          ctx.stroke();
          ctx.fillStyle = fallbackColor;
          ctx.textAlign = "center";
          ctx.font = "11px Consolas, monospace";
          ctx.fillText("--", 0, 4);
        }
        ctx.restore();
      };

      const renderColumn = (panelX, title, titleColor, timeColor, borderColor, fillStyle, shimmerStyle, records) => {
        ctx.save();
        ctx.translate(panelX, panelsTop);
        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(0, 0, panelW, panelH, 18);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = shimmerStyle;
        ctx.beginPath();
        ctx.roundRect(8, 8, panelW - 16, 24, 10);
        ctx.fill();

        ctx.textAlign = "center";
        ctx.fillStyle = titleColor;
        ctx.font = "700 20px Consolas, monospace";
        ctx.fillText(title, panelW * 0.5, 25);

        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        for (let index = 0; index < LEVELS.length; index += 1) {
          const record = this.normalizeWorldRecordEntry(records[index]);
          const hasRecord = Number.isFinite(record.time);
          const rowY = 48 + index * rowH;
          const centerY = rowY + rowH * 0.5;

          if (index > 0) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(14, rowY);
            ctx.lineTo(panelW - 14, rowY);
            ctx.stroke();
          }

          ctx.fillStyle = hasRecord ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.02)";
          ctx.beginPath();
          ctx.roundRect(10, rowY + 2, panelW - 20, rowH - 4, 10);
          ctx.fill();

          ctx.fillStyle = titleColor;
          ctx.font = "700 13px Consolas, monospace";
          ctx.fillText(`L${index + 1}`, 18, centerY);

          ctx.fillStyle = hasRecord ? timeColor : "rgba(149, 159, 170, 0.75)";
          ctx.font = "700 14px Consolas, monospace";
          ctx.fillText(hasRecord ? formatTime(record.time) : "--:--.---", 54, centerY);

          if (hasRecord) {
            ctx.fillStyle = "rgba(220, 239, 250, 0.76)";
            ctx.font = "700 10px Consolas, monospace";
            ctx.textAlign = "right";
            const displayName = record.playerName || "";
            ctx.fillText(fitTextToWidth(ctx, displayName, 58), panelW - 62, centerY);
            ctx.textAlign = "left";
          }
          renderPreview(record, panelW - 34, centerY, 0.7, "rgba(120, 132, 143, 0.5)");
        }
        ctx.restore();
      };

      renderColumn(
        startX,
        "Normal",
        "#d9e2eb",
        "#c6d0db",
        "rgba(176, 190, 204, 0.36)",
        "rgba(18, 24, 30, 0.92)",
        "rgba(190, 206, 220, 0.08)",
        displayedWorldRecords
      );
      renderColumn(
        startX + panelW + panelGap,
        "Perfect",
        "#fff0b2",
        "#ffd76a",
        "rgba(255, 214, 106, 0.48)",
        "rgba(34, 24, 9, 0.9)",
        "rgba(255, 229, 152, 0.12)",
        displayedPerfectWorldRecords
      );
      renderColumn(
        startX + (panelW + panelGap) * 2,
        "Blackout",
        "#c5cfdf",
        "#9ba9bd",
        "rgba(99, 112, 132, 0.42)",
        "rgba(5, 8, 13, 0.95)",
        "rgba(96, 110, 132, 0.08)",
        displayedBlackoutWorldRecords
      );

      const speedrunRecords = [
        {
          title: "Normal",
          record: this.getDisplayedSpeedrunLeaderboardRecord("speedrun_normal", this.speedrunWorldRecord),
          timeColor: "#cfe0ee",
          borderColor: "rgba(176, 190, 204, 0.34)",
          fillStyle: "rgba(18, 24, 30, 0.7)",
        },
        {
          title: "Perfect",
          record: this.getDisplayedSpeedrunLeaderboardRecord("speedrun_perfect", this.perfectSpeedrunWorldRecord),
          timeColor: "#ffd76a",
          borderColor: "rgba(255, 214, 106, 0.34)",
          fillStyle: "rgba(34, 24, 9, 0.74)",
        },
        {
          title: "Blackout",
          record: this.getDisplayedSpeedrunLeaderboardRecord("speedrun_blackout", this.blackoutSpeedrunWorldRecord),
          timeColor: "#b3bed0",
          borderColor: "rgba(99, 112, 132, 0.42)",
          fillStyle: "rgba(5, 8, 13, 0.84)",
        },
      ];
      const speedrunCardW = Math.min(this.width - 120, totalW);
      const speedrunX = this.width * 0.5 - speedrunCardW * 0.5;
      ctx.save();
      ctx.translate(speedrunX, speedrunY);
      ctx.fillStyle = "rgba(15, 22, 30, 0.94)";
      ctx.strokeStyle = "rgba(150, 224, 255, 0.34)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(0, 0, speedrunCardW, speedrunCardH, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(180, 235, 255, 0.08)";
      ctx.beginPath();
      ctx.roundRect(8, 8, speedrunCardW - 16, 24, 10);
      ctx.fill();

      ctx.textAlign = "left";
      ctx.fillStyle = "#e8f5ff";
      ctx.font = "700 22px Consolas, monospace";
      ctx.fillText("Speedrun WR", 18, 30);

      const speedrunGap = 14;
      const speedrunSectionY = 42;
      const speedrunSectionH = speedrunCardH - speedrunSectionY - 12;
      const speedrunSectionW = (speedrunCardW - 24 - speedrunGap * 2) / 3;
      speedrunRecords.forEach((entry, index) => {
        const panelX = 12 + index * (speedrunSectionW + speedrunGap);
        const hasRecord = Number.isFinite(entry.record.time);
        ctx.save();
        ctx.translate(panelX, speedrunSectionY);
        ctx.fillStyle = entry.fillStyle;
        ctx.strokeStyle = entry.borderColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(0, 0, speedrunSectionW, speedrunSectionH, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.beginPath();
        ctx.roundRect(6, 6, speedrunSectionW - 12, 18, 8);
        ctx.fill();

        ctx.textAlign = "left";
        ctx.fillStyle = hasRecord ? entry.timeColor : "#7d8a96";
        ctx.font = "700 14px Consolas, monospace";
        ctx.fillText(entry.title, 10, 19);
        const timeText = hasRecord ? formatTime(entry.record.time) : "--:--.---";
        const deathsText = `Deaths: ${entry.record.deaths == null ? "--" : entry.record.deaths}`;
        ctx.font = "700 19px Consolas, monospace";
        ctx.fillText(timeText, 10, 48);
        const deathsX = Math.min(10 + ctx.measureText(timeText).width + 14, speedrunSectionW - 110);
        ctx.fillStyle = hasRecord ? "#c3d0dc" : "#778391";
        ctx.font = "12px Consolas, monospace";
        ctx.fillText(deathsText, deathsX, 47);
        const previewCenterX = speedrunSectionW - 34;
        if (hasRecord) {
          ctx.fillStyle = "rgba(220, 239, 250, 0.76)";
          ctx.font = "700 10px Consolas, monospace";
          ctx.textAlign = "right";
          const displayName = entry.record.playerName || "";
          const nameRightX = previewCenterX - 22;
          const nameMaxWidth = Math.max(28, nameRightX - 10);
          ctx.fillText(fitTextToWidth(ctx, displayName, nameMaxWidth), nameRightX, speedrunSectionH * 0.64);
          ctx.textAlign = "left";
        }
        renderPreview(entry.record, previewCenterX, speedrunSectionH * 0.64, 0.78, "rgba(120, 132, 143, 0.5)");
        ctx.restore();
      });
      ctx.restore();

      this.renderLeaderboardButtons(ctx);
    }

    renderOnlineBackdrop(ctx, now) {
      const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
      gradient.addColorStop(0, "#061827");
      gradient.addColorStop(0.28, "#11263a");
      gradient.addColorStop(0.62, "#191a36");
      gradient.addColorStop(1, "#26122e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);

      const colors = [
        "rgba(126, 207, 242, 0.18)",
        "rgba(154, 255, 210, 0.16)",
        "rgba(255, 214, 106, 0.14)",
        "rgba(181, 156, 255, 0.15)",
        "rgba(242, 139, 130, 0.13)",
      ];
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let index = 0; index < 18; index += 1) {
        const phase = now * (0.18 + index * 0.011) + index * 2.17;
        const x = this.width * (0.08 + ((index * 0.173 + Math.sin(phase) * 0.02) % 0.84));
        const y = this.height * (0.12 + ((index * 0.119 + Math.cos(phase * 0.9) * 0.03) % 0.76));
        const radius = 38 + (index % 5) * 18;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(0, colors[index % colors.length]);
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.fillStyle = "rgba(1, 5, 10, 0.34)";
      ctx.fillRect(0, 0, this.width, this.height);
    }

    renderOnlineBackButton(ctx) {
      this.renderMenuButtons(ctx, [this.getOnlineBackButton()]);
    }

    renderOnlineScreen(ctx, now) {
      this.renderOnlineBackdrop(ctx, now);

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#edf7ff";
      ctx.font = "700 58px Consolas, monospace";
      ctx.fillText("Online", this.width * 0.5, Math.max(72, this.height * 0.18));
      ctx.fillStyle = "rgba(213, 237, 255, 0.82)";
      ctx.font = "17px Consolas, monospace";
      ctx.fillText(fitTextToWidth(ctx, "Browse community tracks or manage your own creations.", this.width - 40), this.width * 0.5, Math.max(108, this.height * 0.18 + 34));
      ctx.restore();

      this.renderOnlineBackButton(ctx);
      this.renderMenuButtons(ctx, this.getOnlineMenuButtons());
    }

    renderCommunityLevelsScreen(ctx, now) {
      this.renderOnlineBackdrop(ctx, now);

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#edf7ff";
      ctx.font = "700 48px Consolas, monospace";
      ctx.fillText("Community Levels", this.width * 0.5, Math.max(70, this.height * 0.15));
      ctx.fillStyle = "rgba(213, 237, 255, 0.78)";
      ctx.font = "15px Consolas, monospace";
      ctx.fillText(fitTextToWidth(ctx, "Creator times are shown with each shared track.", this.width - 44), this.width * 0.5, Math.max(102, this.height * 0.15 + 30));
      ctx.restore();

      this.renderOnlineBackButton(ctx);

      const cards = this.getCommunityLevelCards();
      const metrics = this.getOnlineLevelListMetrics("community_levels");
      ctx.save();
      if (cards.length === 0) {
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(220, 238, 246, 0.72)";
        ctx.font = "18px Consolas, monospace";
        ctx.fillText(fitTextToWidth(ctx, "No community levels published yet.", this.width - 44), this.width * 0.5, this.height * 0.5);
      }
      ctx.beginPath();
      ctx.rect(
        metrics.x - metrics.hoverOverflowPadX,
        metrics.viewportTop - metrics.hoverOverflowPadY,
        metrics.cardW + metrics.hoverOverflowPadX * 2,
        metrics.viewportBottom - metrics.viewportTop + metrics.hoverOverflowPadY * 2
      );
      ctx.clip();
      for (const card of cards) {
        const hover = this.communityLevelHovers[card.index] || 0;
        const centerX = card.x + card.w * 0.5;
        const centerY = card.y + card.h * 0.5;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1 + hover * 0.035, 1 + hover * 0.035);

        const fill = ctx.createLinearGradient(-card.w * 0.5, -card.h * 0.5, card.w * 0.5, card.h * 0.5);
        fill.addColorStop(0, `rgba(12, 38, 55, ${0.92 + hover * 0.04})`);
        fill.addColorStop(1, `rgba(45, 25, 66, ${0.88 + hover * 0.06})`);
        ctx.fillStyle = fill;
        ctx.strokeStyle = `rgba(154, 255, 210, ${0.24 + hover * 0.32})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = `rgba(128, 214, 255, ${0.12 + hover * 0.22})`;
        ctx.shadowBlur = 8 + hover * 16;
        ctx.beginPath();
        ctx.roundRect(-card.w * 0.5, -card.h * 0.5, card.w, card.h, card.radius);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        ctx.fillStyle = "#eef9ff";
        ctx.font = `700 ${card.fontSize}px Consolas, monospace`;
        ctx.fillText(fitTextToWidth(ctx, card.name, card.w * 0.46), -card.w * 0.5 + 22, -card.h * 0.11);
        ctx.fillStyle = "rgba(190, 225, 242, 0.82)";
        ctx.font = `${card.smallFontSize}px Consolas, monospace`;
        ctx.fillText(
          `Creator time ${Number.isFinite(card.creatorTime) ? formatTime(card.creatorTime) : "--:--.--"}`,
          -card.w * 0.5 + 22,
          card.h * 0.22
        );

        ctx.textAlign = "right";
        ctx.fillStyle = "#9affd2";
        ctx.font = `700 ${card.smallFontSize}px Consolas, monospace`;
        ctx.fillText(fitTextToWidth(ctx, `By ${card.displayCreator || card.creator}`, card.w * 0.28), card.w * 0.5 - 22, 0);
        ctx.restore();
      }
      ctx.restore();
      this.renderOnlineLevelListScrollbar(ctx, "community_levels");
    }

    renderCommunityLevelDetailScreen(ctx, now) {
      this.renderOnlineBackdrop(ctx, now);
      this.renderOnlineBackButton(ctx);

      const level = this.communityLevels[this.selectedCommunityLevelIndex];
      if (!level) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.fillStyle = "#f2fbff";
        ctx.font = "700 32px Consolas, monospace";
        ctx.fillText("Level not found", this.width * 0.5, this.height * 0.42);
        ctx.restore();
        return;
      }

      const scale = this.getScreenFitScale(760, 640, 0.56);
      const margin = Math.max(16, Math.round(28 * scale));
      const playButton = this.getCommunityDetailPlayButton();
      const panelW = Math.min(Math.round(720 * scale), this.width - margin * 2);
      const panelH = Math.max(190, Math.min(Math.round(300 * scale), this.height - playButton.y - playButton.h - Math.max(24, Math.round(46 * scale))));
      const panelX = this.width * 0.5 - panelW * 0.5;
      const panelY = playButton.y + playButton.h + Math.max(14, Math.round(22 * scale));
      const leaderboard = normalizeCommunityLeaderboard(level.leaderboard, level.creator, level.creatorTime);

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#f5fbff";
      ctx.font = `700 ${Math.max(24, Math.round(40 * scale))}px Consolas, monospace`;
      ctx.fillText(fitTextToWidth(ctx, level.name, this.width - 44), this.width * 0.5, Math.max(70, this.height * 0.14));
      ctx.fillStyle = "#9affd2";
      ctx.font = `${Math.max(13, Math.round(18 * scale))}px Consolas, monospace`;
      ctx.fillText(
        fitTextToWidth(ctx, `Made by ${getCommunityLevelDisplayCreator(level)}`, this.width - 48),
        this.width * 0.5,
        Math.max(98, this.height * 0.14 + Math.round(30 * scale))
      );

      ctx.fillStyle = "rgba(6, 18, 29, 0.82)";
      ctx.strokeStyle = "rgba(154, 255, 210, 0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, panelW, panelH, Math.max(12, Math.round(16 * scale)));
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = "#dff8ff";
      ctx.font = `700 ${Math.max(15, Math.round(21 * scale))}px Consolas, monospace`;
      ctx.fillText("Top 5 Times", panelX + Math.round(24 * scale), panelY + Math.round(38 * scale));

      ctx.textAlign = "right";
      ctx.fillStyle = "#ffd76a";
      ctx.font = `${Math.max(12, Math.round(16 * scale))}px Consolas, monospace`;
      ctx.fillText(
        `Creator time: ${Number.isFinite(level.creatorTime) ? formatTime(level.creatorTime) : "--:--.--"}`,
        panelX + panelW - Math.round(24 * scale),
        panelY + Math.round(38 * scale)
      );

      const rowH = Math.max(28, Math.round(36 * scale));
      const firstRowY = panelY + Math.round(76 * scale);
      ctx.textBaseline = "middle";
      for (let index = 0; index < 5; index += 1) {
        const row = leaderboard[index];
        const y = firstRowY + index * rowH;
        ctx.fillStyle = index % 2 === 0 ? "rgba(255, 255, 255, 0.045)" : "rgba(255, 255, 255, 0.02)";
        ctx.beginPath();
        ctx.roundRect(panelX + Math.round(16 * scale), y - rowH * 0.42, panelW - Math.round(32 * scale), rowH * 0.84, Math.max(7, Math.round(9 * scale)));
        ctx.fill();

        ctx.textAlign = "left";
        ctx.fillStyle = row ? "#eef9ff" : "rgba(220, 238, 246, 0.46)";
        ctx.font = `${Math.max(12, Math.round(17 * scale))}px Consolas, monospace`;
        ctx.fillText(row ? `${index + 1}. ${row.playerName}` : `${index + 1}. ---`, panelX + Math.round(28 * scale), y);
        ctx.textAlign = "right";
        ctx.fillText(row ? formatTime(row.time) : "--:--.--", panelX + panelW - Math.round(28 * scale), y);
      }
      ctx.textBaseline = "alphabetic";
      ctx.restore();

      this.renderMenuButtons(ctx, [playButton]);
    }

    renderMyLevelsScreen(ctx, now) {
      this.renderOnlineBackdrop(ctx, now);

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#edf7ff";
      ctx.font = "700 48px Consolas, monospace";
      ctx.fillText("My Levels", this.width * 0.5, Math.max(70, this.height * 0.15));
      ctx.fillStyle = "rgba(213, 237, 255, 0.78)";
      ctx.font = "15px Consolas, monospace";
      ctx.fillText(fitTextToWidth(ctx, "Click any of your levels to play it. If a level is declined, click its status to read the admin note.", this.width - 44), this.width * 0.5, Math.max(102, this.height * 0.15 + 30));
      ctx.restore();

      this.renderOnlineBackButton(ctx);
      this.renderMenuButtons(ctx, [this.getMyLevelsCreateButton()]);

      const cards = this.getMyLevelCards();
      const metrics = this.getOnlineLevelListMetrics("my_levels");
      ctx.save();
      if (cards.length === 0) {
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(220, 238, 246, 0.72)";
        ctx.font = "18px Consolas, monospace";
        ctx.fillText(fitTextToWidth(ctx, "You have not created any levels yet.", this.width - 44), this.width * 0.5, this.height * 0.5);
      }
      ctx.beginPath();
      ctx.rect(metrics.x - 12, metrics.viewportTop, metrics.cardW + 24, metrics.viewportBottom - metrics.viewportTop);
      ctx.clip();
      for (const card of cards) {
        const hover = this.communityLevelHovers[card.index] || 0;
        const centerX = card.x + card.w * 0.5;
        const centerY = card.y + card.h * 0.5;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1 + hover * 0.03, 1 + hover * 0.03);

        const fill = ctx.createLinearGradient(-card.w * 0.5, -card.h * 0.5, card.w * 0.5, card.h * 0.5);
        fill.addColorStop(0, `rgba(12, 38, 55, ${0.92 + hover * 0.04})`);
        fill.addColorStop(1, `rgba(45, 25, 66, ${0.88 + hover * 0.06})`);
        ctx.fillStyle = fill;
        ctx.strokeStyle = `rgba(154, 255, 210, ${0.24 + hover * 0.32})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = `rgba(128, 214, 255, ${0.12 + hover * 0.22})`;
        ctx.shadowBlur = 8 + hover * 16;
        ctx.beginPath();
        ctx.roundRect(-card.w * 0.5, -card.h * 0.5, card.w, card.h, card.radius);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        const statusHover = this.hoveredOnlineButton === `my_level_status_${card.index}` ? 1 : 0;
        let statusFill = "rgba(202, 214, 226, 0.18)";
        let statusStroke = "rgba(222, 235, 245, 0.3)";
        let statusTextColor = "#eaf6ff";
        if (card.submissionStatus === "published") {
          statusFill = `rgba(62, 154, 105, ${0.22 + hover * 0.08})`;
          statusStroke = "rgba(120, 246, 186, 0.42)";
          statusTextColor = "#bfffe0";
        } else if (card.submissionStatus === "pending") {
          statusFill = `rgba(170, 134, 49, ${0.22 + hover * 0.08})`;
          statusStroke = "rgba(255, 218, 126, 0.44)";
          statusTextColor = "#ffe39a";
        } else if (card.submissionStatus === "declined") {
          statusFill = `rgba(148, 60, 60, ${0.24 + statusHover * 0.1})`;
          statusStroke = `rgba(255, 152, 152, ${0.4 + statusHover * 0.25})`;
          statusTextColor = "#ffd0d0";
        } else if (card.submissionStatus === "private") {
          statusFill = `rgba(90, 89, 134, ${0.22 + hover * 0.08})`;
          statusStroke = "rgba(176, 175, 242, 0.38)";
          statusTextColor = "#ddd9ff";
        }
        const statusX = card.statusRect.x - centerX;
        const statusY = card.statusRect.y - centerY;
        ctx.beginPath();
        ctx.fillStyle = statusFill;
        ctx.strokeStyle = statusStroke;
        ctx.lineWidth = 1.5;
        ctx.roundRect(statusX, statusY, card.statusRect.w, card.statusRect.h, Math.max(9, Math.round(card.radius * 0.7)));
        ctx.fill();
        ctx.stroke();

        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        ctx.fillStyle = "#eef9ff";
        ctx.font = `700 ${card.fontSize}px Consolas, monospace`;
        const leftPad = 22;
        const statusLeftX = statusX;
        const nameMaxWidth = Math.max(90, statusLeftX - (-card.w * 0.5 + leftPad) - 18);
        ctx.fillText(fitTextToWidth(ctx, card.name, nameMaxWidth), -card.w * 0.5 + leftPad, -card.h * 0.15);
        ctx.fillStyle = "rgba(190, 225, 242, 0.84)";
        ctx.font = `${card.smallFontSize}px Consolas, monospace`;
        ctx.fillText(
          `Best time ${Number.isFinite(card.myBestTime) ? formatTime(card.myBestTime) : "--:--.---"}`,
          -card.w * 0.5 + leftPad,
          card.h * 0.16
        );

        ctx.textAlign = "center";
        ctx.fillStyle = statusTextColor;
        ctx.font = `700 ${card.smallFontSize}px Consolas, monospace`;
        ctx.fillText(card.statusLabel, statusX + card.statusRect.w * 0.5, statusY + card.statusRect.h * 0.5);
        if (card.submissionStatus === "declined") {
          ctx.textAlign = "right";
          ctx.fillStyle = "rgba(255, 210, 210, 0.76)";
          ctx.font = `${Math.max(10, card.smallFontSize - 1)}px Consolas, monospace`;
          ctx.fillText("Click to view note", card.w * 0.5 - 18, card.h * 0.16);
        }
        ctx.restore();
      }
      ctx.restore();

      this.renderOnlineLevelListScrollbar(ctx, "my_levels");
      this.renderMyLevelMessageOverlay(ctx);
    }

    renderOnlineLevelListScrollbar(ctx, screen = this.currentScreen) {
      const metrics = this.getOnlineLevelListMetrics(screen);
      const maxScroll = this.getOnlineLevelListMaxScroll(screen);
      if (!metrics || maxScroll <= 0) {
        return;
      }
      const viewportHeight = metrics.viewportBottom - metrics.viewportTop;
      if (viewportHeight <= 0) {
        return;
      }
      const contentHeight = viewportHeight + maxScroll;
      const trackH = Math.max(48, viewportHeight);
      const thumbH = Math.max(36, viewportHeight * (viewportHeight / contentHeight));
      const scrollRatio = maxScroll <= 0 ? 0 : this.getOnlineLevelListScrollY(screen) / maxScroll;
      const thumbTravel = Math.max(0, trackH - thumbH);
      const trackX = metrics.x + metrics.cardW + Math.max(8, Math.round(10 * metrics.scale));
      const trackY = metrics.viewportTop;
      const thumbY = trackY + thumbTravel * scrollRatio;

      ctx.save();
      ctx.fillStyle = "rgba(10, 22, 34, 0.46)";
      ctx.beginPath();
      ctx.roundRect(trackX, trackY, 8, trackH, 999);
      ctx.fill();
      ctx.fillStyle = "rgba(172, 230, 255, 0.7)";
      ctx.beginPath();
      ctx.roundRect(trackX, thumbY, 8, thumbH, 999);
      ctx.fill();
      ctx.restore();
    }

    renderCreateLevelScreen(ctx, now) {
      this.renderOnlineBackdrop(ctx, now);
      const layout = this.getCreateLevelLayout();
      const { scale, panelX, panelW, topY, listFont, listLine, listH } = layout;

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#edf7ff";
      ctx.font = "700 48px Consolas, monospace";
      ctx.fillText("Create a Level", this.width * 0.5, Math.max(70, this.height * 0.14));
      ctx.restore();

      this.renderOnlineBackButton(ctx);

      const instructions = [
        "1. Copy and paste this level frame into a Google Doc.",
        "2. Change the size of the level to whatever you want, but keep it as a rectangle.",
        "3. Use # as walls, . as open floor, I for ice, S for start, G for the goal, X for hazards, and P for bouncy walls.",
        "4. Use Test Your Level below and paste in the file you created.",
        "5. Make any changes you want and keep testing.",
        "6. Once you are happy with your creation, paste it into Level Publish below. It will get reviewed soon and should be up within 1 business day.",
      ];

      ctx.save();
      ctx.font = `${listFont}px Consolas, monospace`;
      const wrapped = instructions.flatMap((line) => wrapTextToLines(ctx, line, panelW - Math.round(34 * scale), 2));
      ctx.fillStyle = "rgba(8, 15, 24, 0.86)";
      ctx.strokeStyle = "rgba(154, 255, 210, 0.26)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(panelX, topY, panelW, listH, 14);
      ctx.fill();
      ctx.stroke();
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(230, 244, 252, 0.9)";
      wrapped.forEach((line, index) => {
        ctx.fillText(line, panelX + Math.round(17 * scale), topY + Math.round(24 * scale) + index * listLine);
      });
      ctx.restore();

      this.renderCreateLevelBox(ctx, layout.frame.x, layout.frame.y, layout.frame.w, layout.frame.h, "Empty Level Frame", EMPTY_LEVEL_FRAME.join("\n"), scale);
      this.renderMenuButtons(ctx, [layout.copyButton]);
      this.renderCreateLevelPublishBox(ctx, layout);

      this.renderCreateLevelTestBox(ctx);
      this.renderCreatePublishPromptOverlay(ctx);
    }

    renderMyLevelMessageOverlay(ctx) {
      if (!this.myLevelMessageDialog) {
        return;
      }
      const layout = this.getMyLevelMessageDialogLayout();
      ctx.save();
      ctx.fillStyle = "rgba(2, 7, 14, 0.72)";
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = "rgba(9, 18, 29, 0.96)";
      ctx.strokeStyle = "rgba(255, 163, 163, 0.34)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(layout.x, layout.y, layout.w, layout.h, layout.radius);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = "#ffd0d0";
      ctx.font = `700 ${Math.max(20, Math.round(layout.scale * 28))}px Consolas, monospace`;
      ctx.fillText(this.myLevelMessageDialog.title || "Declined", this.width * 0.5, layout.y + Math.round(42 * layout.scale));

      ctx.fillStyle = "#f5fbff";
      ctx.font = `${Math.max(13, Math.round(layout.scale * 18))}px Consolas, monospace`;
      ctx.fillText(fitTextToWidth(ctx, this.myLevelMessageDialog.levelName || "", layout.w - Math.round(48 * layout.scale)), this.width * 0.5, layout.y + Math.round(76 * layout.scale));

      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(226, 240, 250, 0.92)";
      ctx.font = `${Math.max(12, Math.round(layout.scale * 16))}px Consolas, monospace`;
      const lines = wrapTextToLines(ctx, this.myLevelMessageDialog.message || "No admin note was provided for this decline.", layout.w - Math.round(56 * layout.scale), 8);
      lines.forEach((line, index) => {
        ctx.fillText(line, layout.x + Math.round(28 * layout.scale), layout.y + Math.round(116 * layout.scale) + index * Math.max(16, Math.round(layout.scale * 20)));
      });
      ctx.restore();

      this.renderMenuButtons(ctx, [layout.closeButton]);
    }

    renderCreatePublishPromptOverlay(ctx) {
      if (!this.createPublishPromptOpen) {
        return;
      }

      ctx.save();
      ctx.fillStyle = "rgba(2, 5, 9, 0.58)";
      ctx.fillRect(0, 0, this.width, this.height);
      const overlayScale = this.getScreenFitScale(560, 440, 0.58);
      const panelW = Math.min(Math.round(520 * overlayScale), this.width - 24);
      const panelH = Math.min(Math.round(244 * overlayScale), this.height - 24);
      ctx.translate(this.width * 0.5, this.height * 0.5);
      ctx.fillStyle = "rgba(5, 12, 18, 0.92)";
      ctx.beginPath();
      ctx.roundRect(-panelW * 0.5, -panelH * 0.5, panelW, panelH, Math.max(14, Math.round(22 * overlayScale)));
      ctx.fill();
      ctx.strokeStyle = "rgba(146, 208, 236, 0.42)";
      ctx.lineWidth = 2;
      ctx.stroke();

      const topGlow = ctx.createLinearGradient(0, -panelH * 0.5, 0, -panelH * 0.5 + Math.round(96 * overlayScale));
      topGlow.addColorStop(0, "rgba(101, 194, 230, 0.2)");
      topGlow.addColorStop(1, "rgba(101, 194, 230, 0)");
      ctx.fillStyle = topGlow;
      ctx.beginPath();
      ctx.roundRect(
        -panelW * 0.5 + Math.round(12 * overlayScale),
        -panelH * 0.5 + Math.round(12 * overlayScale),
        panelW - Math.round(24 * overlayScale),
        Math.round(82 * overlayScale),
        Math.max(12, Math.round(18 * overlayScale))
      );
      ctx.fill();

      ctx.textAlign = "center";
      ctx.fillStyle = "#f2fbff";
      ctx.font = `700 ${Math.max(20, Math.round(33 * overlayScale))}px Consolas, monospace`;
      ctx.fillText("Publish Level?", 0, -Math.round(64 * overlayScale));

      ctx.fillStyle = "#90c9de";
      ctx.font = `${Math.max(12, Math.round(18 * overlayScale))}px Consolas, monospace`;
      const lines = wrapTextToLines(ctx, "Complete the level to make it valid for publishing. Try to get your best time, then publish it!", panelW - Math.round(56 * overlayScale), 3);
      lines.forEach((line, index) => {
        ctx.fillText(line, 0, -Math.round(14 * overlayScale) + index * Math.round(24 * overlayScale));
      });

      for (const button of this.getCreatePublishPromptButtons()) {
        const hover = button.id === "continue" ? this.createPublishPromptContinueHover : this.createPublishPromptBackHover;
        const centerX = button.x - this.width * 0.5 + button.w * 0.5;
        const centerY = button.y - this.height * 0.5 + button.h * 0.5;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1 + hover * 0.06, 1 + hover * 0.06);
        ctx.shadowColor = button.id === "continue"
          ? `rgba(255, 214, 107, ${0.16 + hover * 0.42})`
          : `rgba(120, 205, 242, ${0.14 + hover * 0.34})`;
        ctx.shadowBlur = 10 + hover * 18;
        const fill = ctx.createLinearGradient(-button.w * 0.5, -button.h * 0.5, button.w * 0.5, button.h * 0.5);
        if (button.id === "continue") {
          fill.addColorStop(0, "rgba(74, 53, 16, 0.96)");
          fill.addColorStop(1, "rgba(138, 99, 24, 0.93)");
        } else {
          fill.addColorStop(0, "rgba(10, 33, 49, 0.94)");
          fill.addColorStop(1, "rgba(18, 61, 84, 0.92)");
        }
        ctx.fillStyle = fill;
        ctx.strokeStyle = button.id === "continue"
          ? `rgba(255, 225, 142, ${0.34 + hover * 0.44})`
          : `rgba(150, 224, 255, ${0.28 + hover * 0.44})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-button.w * 0.5, -button.h * 0.5, button.w, button.h, 14);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = button.id === "continue" ? "#fff1c7" : "#eff9ff";
        ctx.font = `700 ${button.fontSize || 22}px Consolas, monospace`;
        ctx.fillText(fitTextToWidth(ctx, button.label, button.w - 14), 0, Math.round((button.fontSize || 22) * 0.35));
        ctx.restore();
      }
      ctx.restore();
    }

    renderCreateLevelPublishBox(ctx, layout) {
      const { publish, publishText, publishButton, scale } = layout;
      ctx.save();
      ctx.fillStyle = "rgba(8, 15, 24, 0.84)";
      ctx.strokeStyle = "rgba(128, 214, 255, 0.28)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(publish.x, publish.y, publish.w, publish.h, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(180, 235, 255, 0.08)";
      ctx.beginPath();
      ctx.roundRect(publish.x + 7, publish.y + 7, publish.w - 14, Math.max(22, Math.round(26 * scale)), 8);
      ctx.fill();

      ctx.textAlign = "left";
      ctx.fillStyle = "#dff6ff";
      ctx.font = `700 ${Math.max(12, Math.round(15 * scale))}px Consolas, monospace`;
      ctx.fillText("Level Publish", publish.x + Math.round(15 * scale), publish.y + Math.round(25 * scale));
      ctx.fillStyle = "rgba(230, 244, 252, 0.86)";
      ctx.font = `${Math.max(9, Math.round(11 * scale))}px Consolas, monospace`;
      const publishCopy = "Once you are happy with your new creation, give it a name, paste your file, and press publish!";
      const lines = wrapTextToLines(ctx, publishCopy, publishText.w, 2);
      lines.forEach((line, index) => {
        ctx.fillText(line, publishText.x, publishText.y + index * Math.max(12, Math.round(13 * scale)));
      });
      ctx.restore();

      this.renderMenuButtons(ctx, [publishButton]);
    }

    renderCreateLevelTestBox(ctx) {
      const layout = this.getCreateLevelTestLayout();
      ctx.save();
      ctx.fillStyle = "rgba(8, 15, 24, 0.84)";
      ctx.strokeStyle = "rgba(128, 214, 255, 0.28)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(layout.x, layout.y, layout.w, layout.h, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(180, 235, 255, 0.08)";
      ctx.beginPath();
      ctx.roundRect(layout.x + 7, layout.y + 7, layout.w - 14, Math.max(22, Math.round(26 * layout.scale)), 8);
      ctx.fill();

      ctx.textAlign = "left";
      ctx.fillStyle = "#dff6ff";
      ctx.font = `700 ${Math.max(12, Math.round(15 * layout.scale))}px Consolas, monospace`;
      ctx.fillText("Test Your Level", layout.x + Math.round(15 * layout.scale), layout.y + Math.round(25 * layout.scale));
      if (this.customLevelStatusText) {
        ctx.textAlign = "right";
        ctx.fillStyle = this.customLevelStatusTone === "error" ? "#ffb8a8" : "#9affd2";
        ctx.font = `${Math.max(10, Math.round(12 * layout.scale))}px Consolas, monospace`;
        ctx.fillText(
          fitTextToWidth(ctx, this.customLevelStatusText, layout.w * 0.46),
          layout.x + layout.w - Math.round(15 * layout.scale),
          layout.y + Math.round(25 * layout.scale)
        );
      }
      ctx.restore();

      this.renderMenuButtons(ctx, [layout.runButton]);
    }

    renderCreateLevelBox(ctx, x, y, w, h, title, body, scale) {
      ctx.save();
      ctx.fillStyle = "rgba(8, 15, 24, 0.84)";
      ctx.strokeStyle = "rgba(128, 214, 255, 0.28)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(180, 235, 255, 0.08)";
      ctx.beginPath();
      ctx.roundRect(x + 7, y + 7, w - 14, Math.max(22, Math.round(26 * scale)), 8);
      ctx.fill();

      ctx.textAlign = "left";
      ctx.fillStyle = "#dff6ff";
      ctx.font = `700 ${Math.max(12, Math.round(15 * scale))}px Consolas, monospace`;
      ctx.fillText(title, x + Math.round(15 * scale), y + Math.round(25 * scale));
      ctx.fillStyle = "rgba(230, 244, 252, 0.86)";
      ctx.font = `${Math.max(10, Math.round(13 * scale))}px Consolas, monospace`;
      const lines = String(body).split("\n").flatMap((line) => wrapTextToLines(ctx, line, w - Math.round(30 * scale), 2));
      lines.slice(0, 7).forEach((line, index) => {
        ctx.fillText(line, x + Math.round(15 * scale), y + Math.round(52 * scale) + index * Math.max(14, Math.round(16 * scale)));
      });
      ctx.restore();
    }

    renderLevelSelectScreen(ctx, now) {
      this.renderMenuBackdrop(ctx, now);
      const blackoutSelected = this.isBlackoutLevelSelectActive();

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = blackoutSelected ? "#d6deea" : "#edf7ff";
      ctx.font = "700 56px Consolas, monospace";
      ctx.fillText(this.levelSelectContext === "race" ? "Race Select" : "Level Select", this.width * 0.5, this.height * 0.2);
      ctx.restore();

      this.renderLevelSelectBackButton(ctx);
      this.renderLevelSelectCards(ctx);
      if (this.levelSelectContext !== "race") {
        this.renderLevelSelectSpeedrunButton(ctx);
      }
      this.renderLevelSelectBlackoutButton(ctx);
      this.renderBlackoutCursorGlow(ctx);
    }

    renderCustomizationScreen(ctx, now) {
      this.renderMenuBackdrop(ctx, now);
      const layout = this.getCustomizationLayout();

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#edf7ff";
      ctx.font = `700 ${layout.titleSize}px Consolas, monospace`;
      ctx.fillText("Customization", this.width * 0.5, layout.titleY);
      if (layout.showSubcopy) {
        ctx.fillStyle = "rgba(178, 213, 240, 0.88)";
        ctx.font = `${layout.subtitleSize}px Consolas, monospace`;
        ctx.fillText(fitTextToWidth(ctx, "Pick a car body and paint color.", this.width - layout.margin * 2), this.width * 0.5, layout.subtitle1Y);
      }
      ctx.restore();

      ctx.save();
      ctx.translate(this.width * 0.5, layout.carCenterY);
      ctx.scale(layout.carScale, layout.carScale);
      ctx.shadowColor = mixHexColors(this.customizationDraftColor, "#aee9ff", 0.4);
      ctx.shadowBlur = 36;
      this.drawCarShape(ctx, this.getPlayerCarPalette(this.customizationDraftColor), this.customizationDraftVariant);
      ctx.restore();

      this.renderCustomizationArrows(ctx);

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#cfe9f6";
      ctx.font = `700 ${Math.max(13, Math.round(20 * layout.scale))}px Consolas, monospace`;
      ctx.fillText(this.getCurrentCustomizationVariant().name, this.width * 0.5, layout.variantY);
      ctx.font = `${Math.max(11, Math.round(16 * layout.scale))}px Consolas, monospace`;
      if (layout.showSubcopy) {
        ctx.fillText("Use the arrows to swap cars", this.width * 0.5, layout.swapHintY);
      }
      ctx.fillText("Paint Color", this.width * 0.5, layout.paintLabelY);
      ctx.restore();

      this.renderCustomizationColorPicker(ctx, now);
      this.renderCustomizationButtons(ctx);
    }

    renderTwoPlayerCustomizationScreen(ctx, now) {
      this.renderMenuBackdrop(ctx, now);
      const screenScale = this.getTwoPlayerCustomizationScale();
      const margin = Math.max(10, Math.round(24 * screenScale));
      const titleY = margin + Math.round(44 * screenScale);
      const subtitleY = titleY + Math.round(38 * screenScale);

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#edf7ff";
      ctx.font = `700 ${Math.max(22, Math.round(48 * screenScale))}px Consolas, monospace`;
      ctx.fillText(fitTextToWidth(ctx, "2 Player Customization", this.width - margin * 2), this.width * 0.5, titleY);
      ctx.fillStyle = "rgba(178, 213, 240, 0.88)";
      ctx.font = `${Math.max(11, Math.round(17 * screenScale))}px Consolas, monospace`;
      ctx.fillText(fitTextToWidth(ctx, "Tune Player 1 and Player 2 before starting tag.", this.width - margin * 2), this.width * 0.5, subtitleY);
      ctx.restore();

      for (const card of this.getTwoPlayerCustomizationCards()) {
        const draft = this.twoPlayerCustomizationDrafts[card.id] || this.getTwoPlayerCarSetting(card.id);
        const hoverPicker = this.mouse.inside && this.isPointInsideRect(this.mouse.x, this.mouse.y, card.picker);
        const accentColor = mixHexColors(draft.color, "#02060d", 0.34);
        const glowColor = mixHexColors(draft.color, "#ffffff", 0.12);

        ctx.save();
        ctx.shadowColor = hexToRgba(glowColor, 0.2 + (hoverPicker ? 0.08 : 0));
        ctx.shadowBlur = 14 + (hoverPicker ? 8 : 0);
        const fill = ctx.createLinearGradient(card.x, card.y, card.x + card.w, card.y + card.h);
        fill.addColorStop(0, card.id === "red" ? "rgba(44, 17, 20, 0.94)" : "rgba(14, 26, 52, 0.94)");
        fill.addColorStop(1, "rgba(7, 18, 28, 0.92)");
        ctx.fillStyle = fill;
        ctx.strokeStyle = hexToRgba(accentColor, 0.6 + (hoverPicker ? 0.22 : 0));
        ctx.lineWidth = hoverPicker ? 2.5 : 2;
        const cardScale = card.scale || 1;
        const cardRadius = Math.max(12, Math.round(22 * cardScale));
        ctx.beginPath();
        ctx.roundRect(card.x, card.y, card.w, card.h, cardRadius);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = hexToRgba(accentColor, 0.22);
        ctx.beginPath();
        ctx.roundRect(
          card.x + Math.round(12 * cardScale),
          card.y + Math.round(12 * cardScale),
          card.w - Math.round(24 * cardScale),
          Math.max(18, Math.round(32 * cardScale)),
          Math.max(8, Math.round(14 * cardScale))
        );
        ctx.fill();

        ctx.textAlign = "left";
        ctx.fillStyle = mixHexColors(draft.color, "#eaf7ff", 0.42);
        ctx.font = `700 ${Math.max(13, Math.round(22 * cardScale))}px Consolas, monospace`;
        ctx.fillText(card.label, card.x + Math.round(24 * cardScale), card.y + Math.round(36 * cardScale));
        ctx.fillStyle = "rgba(218, 235, 245, 0.78)";
        ctx.font = `${Math.max(10, Math.round(15 * cardScale))}px Consolas, monospace`;
        if (card.h >= 104) {
          ctx.fillText("Click paint to edit", card.x + Math.round(24 * cardScale), card.y + card.h - Math.round(22 * cardScale));
        }

        ctx.save();
        ctx.translate(card.carCenterX, card.carCenterY);
        ctx.scale(3.25 * cardScale, 3.25 * cardScale);
        ctx.shadowColor = hexToRgba(draft.color, 0.36);
        ctx.shadowBlur = 26;
        this.drawCarShape(ctx, this.getPlayerCarPalette(draft.color), draft.variant);
        ctx.restore();

        ctx.textAlign = "center";
        ctx.fillStyle = "#e5f6ff";
        ctx.font = `700 ${Math.max(11, Math.round(17 * cardScale))}px Consolas, monospace`;
        ctx.fillText(this.getCarVariantDefinition(draft.variant).name, card.carCenterX, card.y + card.h - Math.round(18 * cardScale));
        ctx.restore();

        this.renderTwoPlayerCustomizationColorPicker(ctx, now, card, draft, hoverPicker);
      }

      this.renderTwoPlayerCustomizationArrows(ctx);
      this.renderTwoPlayerCustomizationButtons(ctx);
    }

    renderTwoPlayerCustomizationColorPicker(ctx, now, card, draft, hovered) {
      const picker = card.picker;
      const pulse = 0.5 + Math.sin(now * 3.4) * 0.5;
      const accentColor = mixHexColors(draft.color, "#02060d", 0.34);
      const glowColor = mixHexColors(draft.color, "#ffffff", 0.12);

      ctx.save();
      ctx.shadowColor = hexToRgba(glowColor, 0.22 + pulse * 0.07 + (hovered ? 0.16 : 0));
      ctx.shadowBlur = 10 + pulse * 4 + (hovered ? 10 : 0);
      const fill = ctx.createLinearGradient(picker.x, picker.y, picker.x + picker.w, picker.y + picker.h);
      fill.addColorStop(0, "rgba(7, 18, 28, 0.94)");
      fill.addColorStop(1, "rgba(12, 34, 48, 0.92)");
      ctx.fillStyle = fill;
      ctx.strokeStyle = hovered ? hexToRgba(accentColor, 0.9) : hexToRgba(accentColor, 0.52);
      ctx.lineWidth = hovered ? 2.5 : 2;
      ctx.beginPath();
      ctx.roundRect(picker.x, picker.y, picker.w, picker.h, 16);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      const inset = Math.max(8, Math.round(picker.h * 0.17));
      const swatchSize = picker.h - inset * 2;
      const swatchX = picker.x + inset;
      const swatchY = picker.y + inset;
      const swatchFill = ctx.createLinearGradient(swatchX, swatchY, swatchX + swatchSize, swatchY + swatchSize);
      swatchFill.addColorStop(0, mixHexColors(draft.color, "#ffffff", 0.18));
      swatchFill.addColorStop(1, mixHexColors(draft.color, "#0d1016", 0.14));
      ctx.fillStyle = swatchFill;
      ctx.beginPath();
      ctx.roundRect(swatchX, swatchY, swatchSize, swatchSize, Math.max(9, Math.round(13 * swatchSize / 42)));
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#eaf7ff";
      ctx.textAlign = "left";
      const labelX = swatchX + swatchSize + Math.max(8, Math.round(14 * picker.h / 64));
      const labelWidth = Math.max(24, picker.x + picker.w - labelX - inset);
      const labelFont = Math.max(10, Math.round(14 * picker.h / 64));
      ctx.font = `700 ${labelFont}px Consolas, monospace`;
      ctx.fillText(fitTextToWidth(ctx, "Paint", labelWidth), labelX, picker.y + picker.h * 0.4);
      ctx.fillStyle = hovered ? "#fff0bf" : mixHexColors(draft.color, "#eaf7ff", 0.36);
      ctx.font = `${labelFont}px Consolas, monospace`;
      ctx.fillText(fitTextToWidth(ctx, draft.color.toUpperCase(), labelWidth), labelX, picker.y + picker.h * 0.7);
      ctx.restore();
    }

    renderCustomizationColorPicker(ctx, now) {
      const picker = this.getCustomizationColorPickerRect();
      const hovered =
        this.currentScreen === "customization" &&
        this.mouse.inside &&
        this.mouse.x >= picker.x &&
        this.mouse.x <= picker.x + picker.w &&
        this.mouse.y >= picker.y &&
        this.mouse.y <= picker.y + picker.h;
      const pulse = 0.5 + Math.sin(now * 3.4) * 0.5;
      const glowColor = mixHexColors(this.customizationDraftColor, "#9edfff", 0.36);
      const fill = ctx.createLinearGradient(picker.x, picker.y, picker.x + picker.w, picker.y + picker.h);

      ctx.save();
      ctx.shadowColor = hexToRgba(glowColor, 0.3 + pulse * 0.08 + (hovered ? 0.18 : 0));
      ctx.shadowBlur = 12 + pulse * 5 + (hovered ? 12 : 0);
      fill.addColorStop(0, "rgba(7, 18, 28, 0.94)");
      fill.addColorStop(1, "rgba(12, 34, 48, 0.92)");
      ctx.fillStyle = fill;
      ctx.strokeStyle = hovered ? "rgba(192, 236, 255, 0.9)" : "rgba(126, 205, 236, 0.48)";
      ctx.lineWidth = hovered ? 2.5 : 2;
      ctx.beginPath();
      ctx.roundRect(picker.x, picker.y, picker.w, picker.h, 18);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(238, 248, 255, 0.08)";
      ctx.beginPath();
      ctx.roundRect(picker.x + 8, picker.y + 8, picker.w - 16, 22, 10);
      ctx.fill();

      const inset = Math.max(8, Math.round(picker.h * 0.16));
      const swatchX = picker.x + inset;
      const swatchY = picker.y + inset;
      const swatchH = picker.h - inset * 2;
      const swatchW = Math.min(68, Math.max(34, Math.round(swatchH * 1.15)));
      const swatchFill = ctx.createLinearGradient(swatchX, swatchY, swatchX + swatchW, swatchY + swatchH);
      swatchFill.addColorStop(0, mixHexColors(this.customizationDraftColor, "#ffffff", 0.18));
      swatchFill.addColorStop(1, mixHexColors(this.customizationDraftColor, "#0d1016", 0.14));
      ctx.fillStyle = swatchFill;
      ctx.beginPath();
      ctx.roundRect(swatchX, swatchY, swatchW, swatchH, Math.max(10, Math.round(14 * swatchH / 52)));
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#eaf7ff";
      ctx.textAlign = "left";
      const labelX = swatchX + swatchW + Math.max(10, Math.round(16 * picker.h / 76));
      const labelWidth = Math.max(30, picker.x + picker.w - labelX - inset);
      const labelFont = Math.max(11, Math.round(16 * picker.h / 76));
      ctx.font = `700 ${labelFont}px Consolas, monospace`;
      ctx.fillText(fitTextToWidth(ctx, "Choose paint", labelWidth), labelX, picker.y + picker.h * 0.38);
      ctx.fillStyle = hovered ? "#fff0bf" : "#9ed7ee";
      ctx.font = `${labelFont}px Consolas, monospace`;
      ctx.fillText(fitTextToWidth(ctx, this.customizationDraftColor.toUpperCase(), labelWidth), labelX, picker.y + picker.h * 0.68);
      ctx.restore();
    }

    renderMenuBackdrop(ctx, now) {
      const blackoutSelected = this.isBlackoutLevelSelectActive();
      const background = ctx.createLinearGradient(0, 0, this.width, this.height);
      if (blackoutSelected) {
        background.addColorStop(0, "#010205");
        background.addColorStop(0.52, "#05070c");
        background.addColorStop(1, "#000000");
      } else {
        background.addColorStop(0, "#05111f");
        background.addColorStop(0.52, "#091726");
        background.addColorStop(1, "#02060d");
      }
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.save();
      ctx.fillStyle = blackoutSelected ? "rgba(3, 5, 9, 0.84)" : "rgba(9, 18, 28, 0.72)";
      ctx.fillRect(0, this.height * 0.7, this.width, this.height * 0.3);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = blackoutSelected ? 0.2 : 0.28;
      ctx.strokeStyle = blackoutSelected ? "rgba(96, 108, 128, 0.16)" : "rgba(129, 182, 223, 0.22)";
      ctx.lineWidth = 1;
      const gridOffset = (now * 34) % 70;
      for (let x = -70; x < this.width + 70; x += 70) {
        ctx.beginPath();
        ctx.moveTo(x + gridOffset, 0);
        ctx.lineTo(x - 140 + gridOffset, this.height);
        ctx.stroke();
      }
      ctx.restore();

      this.renderTitleTrail(ctx);
      this.renderTitleDrifter(ctx);

      ctx.save();
      const vignette = ctx.createRadialGradient(
        this.width * 0.5,
        this.height * 0.45,
        this.width * 0.08,
        this.width * 0.5,
        this.height * 0.5,
        this.width * 0.72
      );
      vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
      vignette.addColorStop(1, blackoutSelected ? "rgba(0, 0, 0, 0.76)" : "rgba(0, 0, 0, 0.58)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    getShakeOffset(now) {
      if (this.shakeTime <= 0 || this.shakeStrength <= 0.05) {
        return { x: 0, y: 0 };
      }

      const wobble = now * 52;
      return {
        x: Math.sin(wobble) * this.shakeStrength,
        y: Math.cos(wobble * 1.13) * this.shakeStrength * 0.8,
      };
    }

    renderWorld(ctx, camera, now, carState) {
      const isTagMode = this.gameMode === "tag";
      const isRaceMode = this.isRaceMode();
      const isMultiCarMode = isTagMode || isRaceMode;
      const isBlackoutMode = this.isBlackoutGameplayMode();
      const worldScale = this.getWorldRenderScale();
      const extraVisibleX = Math.max(0, (this.width / Math.max(worldScale, 0.001) - this.width) * 0.5);
      const extraVisibleY = Math.max(0, (this.height / Math.max(worldScale, 0.001) - this.height) * 0.5);
      const cullMinX = -extraVisibleX - TILE_SIZE;
      const cullMinY = -extraVisibleY - TILE_SIZE;
      const cullMaxX = this.width + extraVisibleX;
      const cullMaxY = this.height + extraVisibleY;
      const visibleMinWorldX = camera.x - this.width * 0.5 + cullMinX;
      const visibleMinWorldY = camera.y - this.height * 0.5 + cullMinY;
      const visibleMaxWorldX = camera.x - this.width * 0.5 + cullMaxX;
      const visibleMaxWorldY = camera.y - this.height * 0.5 + cullMaxY;
      const visibleMinTileX = clamp(Math.floor(visibleMinWorldX / TILE_SIZE), 0, this.level.width - 1);
      const visibleMinTileY = clamp(Math.floor(visibleMinWorldY / TILE_SIZE), 0, this.level.height - 1);
      const visibleMaxTileX = clamp(Math.ceil(visibleMaxWorldX / TILE_SIZE), 0, this.level.width - 1);
      const visibleMaxTileY = clamp(Math.ceil(visibleMaxWorldY / TILE_SIZE), 0, this.level.height - 1);
      const isTileVisible = (tileX, tileY) =>
        tileX >= visibleMinTileX &&
        tileX <= visibleMaxTileX &&
        tileY >= visibleMinTileY &&
        tileY <= visibleMaxTileY;
      const blackoutVisibility = isBlackoutMode ? this.buildBlackoutVisibilityMap(carState) : null;
      const floorA = "#111c25";
      const floorB = "#17242d";
      const wallFront = "#334854";
      const wallTop = "#506875";
      const wallSide = "#1e2d36";
      const iceA = "#17374d";
      const iceB = "#1f4b67";
      const bumperFront = "#60308c";
      const bumperTop = "#8f5dc7";
      const bumperSide = "#3d1f5d";
      const hazardFront = "#8e2020";
      const hazardTop = "#d94a4a";
      const hazardSide = "#5c1212";
      const goalPulse = 0.5 + Math.sin(now * 5.5) * 0.5;
      const completionBlackout = this.completed && this.levelCompletionSummary
        ? easeInOutCubic(clamp(this.completionSceneTimer / COMPLETION_BLACKOUT_TIME, 0, 1))
        : 0;
      const environmentAlpha = isTagMode
        ? (1 - completionBlackout)
        : this.goalTriggered
          ? 0
          : (1 - completionBlackout);

      ctx.fillStyle = "#050c12";
      ctx.fillRect(0, 0, this.width, this.height);

      if (environmentAlpha > 0.001) {
        ctx.save();
        ctx.globalAlpha = environmentAlpha;

        if (isBlackoutMode) {
          this.renderVisibleFloorTiles(
            ctx,
            camera,
            blackoutVisibility,
            visibleMinTileX,
            visibleMinTileY,
            visibleMaxTileX,
            visibleMaxTileY,
            cullMinX,
            cullMinY,
            cullMaxX,
            cullMaxY,
            floorA,
            floorB,
            iceA,
            iceB
          );
        } else {
          this.renderCachedFloor(
            ctx,
            camera,
            visibleMinWorldX,
            visibleMinWorldY,
            visibleMaxWorldX + TILE_SIZE,
            visibleMaxWorldY + TILE_SIZE
          );
        }

        if (isMultiCarMode) {
          for (const entry of carState) {
            this.renderSkidMarks(
              ctx,
              camera,
              entry.player.skidMarks,
              visibleMinWorldX,
              visibleMinWorldY,
              visibleMaxWorldX + TILE_SIZE,
              visibleMaxWorldY + TILE_SIZE
            );
          }
        } else {
          this.renderGoalAndStart(ctx, camera, carState, goalPulse, blackoutVisibility);
          if (!isBlackoutMode) {
            this.renderSkidMarks(
              ctx,
              camera,
              this.skidMarks,
              visibleMinWorldX,
              visibleMinWorldY,
              visibleMaxWorldX + TILE_SIZE,
              visibleMaxWorldY + TILE_SIZE
            );
          }
        }

        if (!this.goalTriggered) {
          if (isMultiCarMode) {
            for (const entry of carState) {
              if (!entry.player.exploding) {
                this.renderHeadlightCone(
                  ctx,
                  camera,
                  entry.state,
                  entry.player.id === "red" ? "255, 239, 220" : "232, 242, 255"
                );
              }
            }
          } else if (!this.exploding) {
            this.renderHeadlightCone(ctx, camera, carState);
          }
        }

        const headlightWallGlow = this.goalTriggered ? new Map() : this.getHeadlightWallGlowMap(carState, isMultiCarMode);

        for (const tile of this.level.wallTiles) {
          if (!isTileVisible(tile.x, tile.y)) {
            continue;
          }
          const worldX = tile.x * TILE_SIZE;
          const worldY = tile.y * TILE_SIZE;
          const screen = this.worldToScreen(worldX, worldY, camera);
          const flashIntensity = this.getWallFlashIntensity(tile.x, tile.y);
          const headlightGlow = headlightWallGlow.get(`${tile.x},${tile.y}`);
          const visibility = isBlackoutMode
            ? Math.max(this.getBlackoutTileVisibility(blackoutVisibility, tile.x, tile.y), headlightGlow ? 0.76 : 0)
            : 1;
          if (visibility <= 0.015) {
            continue;
          }
          const isBumperWall = tile.type === "bumper";
          if (isBlackoutMode) {
            ctx.save();
            ctx.globalAlpha *= visibility;
          }
          ctx.fillStyle = isBumperWall ? bumperFront : wallFront;
          ctx.fillRect(screen.x, screen.y, TILE_SIZE, TILE_SIZE);

          ctx.fillStyle = isBumperWall ? bumperTop : wallTop;
          ctx.fillRect(screen.x, screen.y, TILE_SIZE, 10);
          ctx.fillRect(screen.x, screen.y, 10, TILE_SIZE);

          ctx.fillStyle = isBumperWall ? bumperSide : wallSide;
          ctx.fillRect(screen.x + TILE_SIZE - 10, screen.y, 10, TILE_SIZE);
          ctx.fillRect(screen.x, screen.y + TILE_SIZE - 10, TILE_SIZE, 10);

          if (isBumperWall) {
            ctx.save();
            ctx.globalAlpha *= 0.2;
            ctx.fillStyle = "#ddb3ff";
            ctx.fillRect(screen.x + 12, screen.y + 12, TILE_SIZE - 24, TILE_SIZE - 24);
            ctx.restore();
          }

          if (flashIntensity > 0.001) {
            ctx.save();
            ctx.globalAlpha *= clamp(0.2 + flashIntensity * 0.85, 0, 0.95);
            ctx.fillStyle = isBumperWall ? "#e9c8ff" : "#d4e7f3";
            ctx.fillRect(screen.x, screen.y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = isBumperWall ? "#fff2ff" : "#ffffff";
            ctx.fillRect(screen.x, screen.y, TILE_SIZE, 10);
            ctx.fillRect(screen.x, screen.y, 10, TILE_SIZE);
            ctx.restore();
          }

          if (headlightGlow) {
            this.renderTileHeadlightGlow(
              ctx,
              screen,
              headlightGlow,
              isBumperWall ? "241, 221, 255" : "244, 235, 207",
              isBumperWall ? "255, 241, 255" : "255, 248, 222"
            );
          }
          if (isBlackoutMode) {
            ctx.restore();
          }
        }

        for (const tile of this.level.hazardTiles) {
          if (!isTileVisible(tile.x, tile.y)) {
            continue;
          }
          const worldX = tile.x * TILE_SIZE;
          const worldY = tile.y * TILE_SIZE;
          const screen = this.worldToScreen(worldX, worldY, camera);
          const headlightGlow = headlightWallGlow.get(`${tile.x},${tile.y}`);
          const visibility = isBlackoutMode
            ? Math.max(this.getBlackoutTileVisibility(blackoutVisibility, tile.x, tile.y), headlightGlow ? 0.74 : 0)
            : 1;
          if (visibility <= 0.015) {
            continue;
          }
          if (isBlackoutMode) {
            ctx.save();
            ctx.globalAlpha *= visibility;
          }
          ctx.fillStyle = hazardFront;
          ctx.fillRect(screen.x, screen.y, TILE_SIZE, TILE_SIZE);

          ctx.fillStyle = hazardTop;
          ctx.fillRect(screen.x, screen.y, TILE_SIZE, 10);
          ctx.fillRect(screen.x, screen.y, 10, TILE_SIZE);

          ctx.fillStyle = hazardSide;
          ctx.fillRect(screen.x + TILE_SIZE - 10, screen.y, 10, TILE_SIZE);
          ctx.fillRect(screen.x, screen.y + TILE_SIZE - 10, TILE_SIZE, 10);

          ctx.save();
          ctx.globalAlpha *= 0.16;
          ctx.fillStyle = "#ffb0b0";
          ctx.fillRect(screen.x + 10, screen.y + 10, TILE_SIZE - 20, TILE_SIZE - 20);
          ctx.restore();

          if (headlightGlow) {
            this.renderTileHeadlightGlow(ctx, screen, headlightGlow, "255, 148, 148", "255, 215, 215");
          }
          if (isBlackoutMode) {
            ctx.restore();
          }
        }

        ctx.restore();
      }

      if (this.finishDebris.length > 0) {
        this.renderFinishDebris(ctx, camera);
      }

      if (isMultiCarMode) {
        if (isRaceMode) {
          this.renderGoalAndStart(ctx, camera, carState, goalPulse, blackoutVisibility);
          this.renderExplosion(ctx, camera);
        }
        for (const entry of carState) {
          this.renderTagCarEffects(ctx, camera, entry);
        }
        return;
      }

      if (!this.exploding) {
        this.renderTouchJoystickMarker(ctx, camera, carState);
        this.renderCar(ctx, camera, carState);
        this.renderDamageSmoke(ctx, camera);
        this.renderCarSmokeOverlay(ctx, camera, carState);
        this.renderDamageFire(ctx, camera);
      }
      this.renderExplosion(ctx, camera);
    }

    buildLevelFloorCanvas() {
      const canvas = document.createElement("canvas");
      canvas.width = this.level.pixelWidth;
      canvas.height = this.level.pixelHeight;
      const floorCtx = canvas.getContext("2d");
      const floorA = "#111c25";
      const floorB = "#17242d";
      const iceA = "#17374d";
      const iceB = "#1f4b67";

      for (let y = 0; y < this.level.height; y += 1) {
        for (let x = 0; x < this.level.width; x += 1) {
          const tile = this.level.getTile(x, y);
          const isIce = tile === "I";
          const screenX = x * TILE_SIZE;
          const screenY = y * TILE_SIZE;
          floorCtx.fillStyle = isIce
            ? (x + y) % 2 === 0 ? iceA : iceB
            : (x + y) % 2 === 0 ? floorA : floorB;
          floorCtx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

          if (isIce) {
            floorCtx.save();
            floorCtx.globalAlpha *= 0.18;
            floorCtx.fillStyle = "#d7f1ff";
            floorCtx.fillRect(screenX + 8, screenY + 10, TILE_SIZE - 18, 7);
            floorCtx.fillRect(screenX + 16, screenY + 28, TILE_SIZE - 26, 5);
            floorCtx.fillRect(screenX + 12, screenY + 44, TILE_SIZE - 22, 6);
            floorCtx.restore();
          }
        }
      }

      this.level.floorCanvas = canvas;
    }

    renderCachedFloor(ctx, camera, minWorldX, minWorldY, maxWorldX, maxWorldY) {
      if (!this.level.floorCanvas) {
        this.buildLevelFloorCanvas();
      }
      const sourceX = clamp(Math.floor(minWorldX), 0, this.level.pixelWidth);
      const sourceY = clamp(Math.floor(minWorldY), 0, this.level.pixelHeight);
      const sourceMaxX = clamp(Math.ceil(maxWorldX), 0, this.level.pixelWidth);
      const sourceMaxY = clamp(Math.ceil(maxWorldY), 0, this.level.pixelHeight);
      const sourceWidth = sourceMaxX - sourceX;
      const sourceHeight = sourceMaxY - sourceY;
      if (sourceWidth <= 0 || sourceHeight <= 0) {
        return;
      }

      const screen = this.worldToScreen(sourceX, sourceY, camera);
      ctx.drawImage(
        this.level.floorCanvas,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        screen.x,
        screen.y,
        sourceWidth,
        sourceHeight
      );
    }

    renderVisibleFloorTiles(
      ctx,
      camera,
      blackoutVisibility,
      visibleMinTileX,
      visibleMinTileY,
      visibleMaxTileX,
      visibleMaxTileY,
      cullMinX,
      cullMinY,
      cullMaxX,
      cullMaxY,
      floorA,
      floorB,
      iceA,
      iceB
    ) {
      for (let y = visibleMinTileY; y <= visibleMaxTileY; y += 1) {
        for (let x = visibleMinTileX; x <= visibleMaxTileX; x += 1) {
          const screen = this.worldToScreen(x * TILE_SIZE, y * TILE_SIZE, camera);
          if (screen.x > cullMaxX || screen.y > cullMaxY || screen.x + TILE_SIZE < cullMinX || screen.y + TILE_SIZE < cullMinY) {
            continue;
          }
          const visibility = this.getBlackoutTileVisibility(blackoutVisibility, x, y);
          if (visibility <= 0.015) {
            continue;
          }

          const tile = this.level.getTile(x, y);
          const isIce = tile === "I";
          ctx.save();
          ctx.globalAlpha *= visibility;
          ctx.fillStyle = isIce
            ? (x + y) % 2 === 0 ? iceA : iceB
            : (x + y) % 2 === 0 ? floorA : floorB;
          ctx.fillRect(screen.x, screen.y, TILE_SIZE, TILE_SIZE);
          if (isIce) {
            ctx.save();
            ctx.globalAlpha *= 0.18;
            ctx.fillStyle = "#d7f1ff";
            ctx.fillRect(screen.x + 8, screen.y + 10, TILE_SIZE - 18, 7);
            ctx.fillRect(screen.x + 16, screen.y + 28, TILE_SIZE - 26, 5);
            ctx.fillRect(screen.x + 12, screen.y + 44, TILE_SIZE - 22, 6);
            ctx.restore();
          }
          ctx.restore();
        }
      }
    }

    renderFinishDebris(ctx, camera) {
      ctx.save();
      for (const piece of this.finishDebris) {
        const alpha = piece.alpha;
        if (alpha <= 0.001) {
          continue;
        }

        const screen = this.worldToScreen(piece.x, piece.y, camera);
        const size = piece.size;
        const lift = Math.max(0, piece.lift);
        const shadowFade = alpha * clamp(1 - lift / 260, 0.2, 1);

        ctx.save();
        ctx.translate(screen.x, screen.y + 8);
        ctx.rotate(piece.rotation);
        ctx.scale(1, clamp(1 - lift / 420, 0.35, 1) * 0.82);
        ctx.fillStyle = `rgba(0, 0, 0, ${0.05 + shadowFade * 0.18})`;
        ctx.fillRect(-size * 0.42, -size * 0.42, size * 0.84, size * 0.84);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(screen.x, screen.y - lift);
        ctx.rotate(piece.rotation);

        ctx.fillStyle = piece.frontColor;
        ctx.fillRect(-size * 0.5, -size * 0.5, size, size);
        ctx.fillStyle = piece.topColor;
        ctx.fillRect(-size * 0.5, -size * 0.5, size, size * 0.16);
        ctx.fillRect(-size * 0.5, -size * 0.5, size * 0.16, size);
        ctx.fillStyle = piece.sideColor;
        ctx.fillRect(size * 0.34, -size * 0.5, size * 0.16, size);
        ctx.fillRect(-size * 0.5, size * 0.34, size, size * 0.16);

        ctx.strokeStyle = `rgba(255, 255, 255, ${0.04 + alpha * 0.1})`;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-size * 0.5, -size * 0.5, size, size);
        ctx.restore();
      }
      ctx.restore();
    }

    renderGoalAndStart(ctx, camera, carState, goalPulse, blackoutVisibility = null) {
      const start = this.level.start;
      const goal = this.level.goal;
      const isBlackoutMode = this.isBlackoutGameplayMode();
      const carStates = Array.isArray(carState) ? carState.map((entry) => entry.state || entry) : [carState];
      const raceWinnerColor = this.isRaceMode() && this.raceWinner ? this.raceWinner.color : null;
      const startVisibility = isBlackoutMode ? this.getBlackoutVisibilityAtWorld(start.x, start.y, blackoutVisibility) : 1;
      const goalVisibility = isBlackoutMode ? this.getBlackoutVisibilityAtWorld(goal.x + goal.w * 0.5, goal.y + goal.h * 0.5, blackoutVisibility) : 1;
      const showStart = startVisibility > 0.015;
      const showGoal = goalVisibility > 0.015;
      const startScreen = this.worldToScreen(start.x - TILE_SIZE * 0.35, start.y - TILE_SIZE * 0.35, camera);
      const goalScreen = this.worldToScreen(goal.x, goal.y, camera);
      const goalCenterX = goalScreen.x + goal.w * 0.5;
      const goalCenterY = goalScreen.y + goal.h * 0.5;
      const blastProgress = this.getGoalExplosionProgress();
      const carDistanceToGoal = carStates.reduce((best, state) => Math.min(
        best,
        Math.hypot(state.x - (goal.x + goal.w * 0.5), state.y - (goal.y + goal.h * 0.5))
      ), Infinity);
      const proximityGlow = clamp(
        1 - (carDistanceToGoal - GOAL_GLOW_FULL_DISTANCE) / Math.max(1, GOAL_GLOW_START_DISTANCE - GOAL_GLOW_FULL_DISTANCE),
        0,
        1
      );
      const goalGlow = Math.max(blastProgress, proximityGlow * (0.32 + goalPulse * 0.34));

      if (showStart) {
        if (isBlackoutMode) {
          ctx.save();
          ctx.globalAlpha *= startVisibility;
        }
        ctx.fillStyle = "#2fab88";
        ctx.fillRect(startScreen.x, startScreen.y, TILE_SIZE * 0.7, TILE_SIZE * 0.7);
        ctx.strokeStyle = "rgba(220,255,235,0.76)";
        ctx.lineWidth = 2;
        ctx.strokeRect(startScreen.x + 4, startScreen.y + 4, TILE_SIZE * 0.7 - 8, TILE_SIZE * 0.7 - 8);
        if (isBlackoutMode) {
          ctx.restore();
        }
      }

      if (showGoal && goalGlow > 0.001) {
        if (isBlackoutMode) {
          ctx.save();
          ctx.globalAlpha *= goalVisibility;
        }
        const glowRadius = lerp(goal.w * 0.6, goal.w * 3.1, goalGlow);
        const glowGradient = ctx.createRadialGradient(
          goalCenterX,
          goalCenterY,
          goal.w * 0.15,
          goalCenterX,
          goalCenterY,
          glowRadius
        );
        glowGradient.addColorStop(0, raceWinnerColor ? hexToRgba(mixHexColors(raceWinnerColor, "#ffffff", 0.38), 0.18 + goalGlow * 0.62) : `rgba(255, 248, 225, ${0.18 + goalGlow * 0.62})`);
        glowGradient.addColorStop(0.45, raceWinnerColor ? hexToRgba(mixHexColors(raceWinnerColor, "#ffd76a", 0.24), 0.12 + goalGlow * 0.38) : `rgba(255, 228, 150, ${0.12 + goalGlow * 0.38})`);
        glowGradient.addColorStop(1, raceWinnerColor ? hexToRgba(raceWinnerColor, 0) : "rgba(255, 215, 120, 0)");
        ctx.save();
        ctx.fillStyle = glowGradient;
        ctx.fillRect(goalCenterX - glowRadius, goalCenterY - glowRadius, glowRadius * 2, glowRadius * 2);
        ctx.restore();
        if (isBlackoutMode) {
          ctx.restore();
        }
      }

      if (showGoal && blastProgress > 0.001) {
        if (isBlackoutMode) {
          ctx.save();
          ctx.globalAlpha *= goalVisibility;
        }
        const flareRadius = lerp(goal.w * 0.7, goal.w * 3.8, easeInOutCubic(blastProgress));
        const flare = ctx.createRadialGradient(goalCenterX, goalCenterY, goal.w * 0.18, goalCenterX, goalCenterY, flareRadius);
        flare.addColorStop(0, raceWinnerColor ? hexToRgba(mixHexColors(raceWinnerColor, "#ffffff", 0.48), 0.72 - blastProgress * 0.25) : `rgba(255, 249, 229, ${0.72 - blastProgress * 0.25})`);
        flare.addColorStop(0.4, raceWinnerColor ? hexToRgba(mixHexColors(raceWinnerColor, "#ffd76a", 0.22), 0.34 - blastProgress * 0.14) : `rgba(255, 213, 124, ${0.34 - blastProgress * 0.14})`);
        flare.addColorStop(1, raceWinnerColor ? hexToRgba(raceWinnerColor, 0) : "rgba(255, 176, 82, 0)");
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = flare;
        ctx.fillRect(goalCenterX - flareRadius, goalCenterY - flareRadius, flareRadius * 2, flareRadius * 2);
        ctx.restore();
        if (isBlackoutMode) {
          ctx.restore();
        }
      }

      if (showGoal) {
        if (isBlackoutMode) {
          ctx.save();
          ctx.globalAlpha *= goalVisibility;
        }
        ctx.fillStyle = mixHexColors("#4f3716", "#f5ce69", 0.42 + goalGlow * 0.4);
        ctx.fillRect(goalScreen.x, goalScreen.y, goal.w, goal.h);
        ctx.fillStyle = "#e0b34f";
        ctx.fillRect(goalScreen.x, goalScreen.y, goal.w, 10);
        ctx.fillRect(goalScreen.x, goalScreen.y, 10, goal.h);
        ctx.fillStyle = "#7d571d";
        ctx.fillRect(goalScreen.x + goal.w - 10, goalScreen.y, 10, goal.h);
        ctx.fillRect(goalScreen.x, goalScreen.y + goal.h - 10, goal.w, 10);
        ctx.strokeStyle = `rgba(255, 248, 214, ${0.48 + goalPulse * 0.16})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(goalScreen.x + 3, goalScreen.y + 3, goal.w - 6, goal.h - 6);

        ctx.save();
        ctx.globalAlpha = 0.12 + goalPulse * 0.1 + goalGlow * 0.34;
        ctx.fillStyle = "#fff8de";
        ctx.fillRect(goalScreen.x + 10, goalScreen.y + 10, goal.w - 20, goal.h - 20);
        ctx.globalAlpha = 0.3 + goalPulse * 0.16;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(goalScreen.x + 18, goalScreen.y + 18, goal.w - 36, goal.h - 36);
        ctx.restore();
        if (isBlackoutMode) {
          ctx.restore();
        }
      }
    }

    renderSkidMarks(
      ctx,
      camera,
      skidMarks = this.skidMarks,
      minWorldX = -Infinity,
      minWorldY = -Infinity,
      maxWorldX = Infinity,
      maxWorldY = Infinity
    ) {
      ctx.save();
      ctx.lineCap = "round";
      for (const mark of skidMarks) {
        if (
          Math.max(mark.x1, mark.x2) < minWorldX ||
          Math.min(mark.x1, mark.x2) > maxWorldX ||
          Math.max(mark.y1, mark.y2) < minWorldY ||
          Math.min(mark.y1, mark.y2) > maxWorldY
        ) {
          continue;
        }

        const fade = clamp(mark.life / mark.maxLife, 0, 1);
        const start = this.worldToScreen(mark.x1, mark.y1, camera);
        const end = this.worldToScreen(mark.x2, mark.y2, camera);
        ctx.strokeStyle = `rgba(7, 11, 15, ${mark.alpha * fade})`;
        ctx.lineWidth = mark.width;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    renderDamageSmoke(ctx, camera, particles = this.damageSmoke) {
      ctx.save();
      for (const particle of particles) {
        const screen = this.worldToScreen(particle.x, particle.y, camera);
        const coreAlpha = particle.alpha;
        if (coreAlpha <= 0.001) {
          continue;
        }
        ctx.fillStyle = `rgba(70, 74, 78, ${coreAlpha})`;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(122, 126, 130, ${coreAlpha * 0.45})`;
        ctx.beginPath();
        ctx.arc(screen.x + particle.size * 0.18, screen.y - particle.size * 0.12, particle.size * 0.58, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    renderCarSmokeOverlay(ctx, camera, state, smokeLevel = this.getSmokeDamageLevel()) {
      if (smokeLevel <= 0.02) {
        return;
      }

      const screen = this.worldToScreen(state.x, state.y, camera);
      const pulse = performance.now() * 0.003;

      ctx.save();
      ctx.translate(screen.x, screen.y);
      ctx.rotate(state.angle);
      ctx.filter = `blur(${lerp(1.5, 6, smokeLevel)}px)`;

      ctx.fillStyle = `rgba(78, 82, 88, ${lerp(0.12, 0.34, smokeLevel)})`;
      ctx.beginPath();
      ctx.ellipse(CAR_LENGTH * 0.05, -CAR_WIDTH * 0.12, CAR_LENGTH * lerp(0.22, 0.46, smokeLevel), CAR_WIDTH * lerp(0.45, 0.95, smokeLevel), 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(116, 122, 128, ${lerp(0.06, 0.18, smokeLevel)})`;
      ctx.beginPath();
      ctx.ellipse(
        CAR_LENGTH * lerp(0.04, 0.1, smokeLevel),
        Math.sin(pulse) * CAR_WIDTH * 0.06,
        CAR_LENGTH * lerp(0.16, 0.34, smokeLevel),
        CAR_WIDTH * lerp(0.28, 0.7, smokeLevel),
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      if (smokeLevel > 0.45) {
        ctx.fillStyle = `rgba(150, 154, 160, ${lerp(0.05, 0.12, smokeLevel)})`;
        ctx.beginPath();
        ctx.ellipse(
          -CAR_LENGTH * 0.04,
          -Math.cos(pulse * 0.7) * CAR_WIDTH * 0.12,
          CAR_LENGTH * lerp(0.14, 0.24, smokeLevel),
          CAR_WIDTH * lerp(0.2, 0.52, smokeLevel),
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      ctx.restore();
    }

    renderDamageFire(ctx, camera, particles = this.damageFire) {
      ctx.save();
      for (const particle of particles) {
        const screen = this.worldToScreen(particle.x, particle.y, camera);
        const alpha = particle.alpha;
        if (alpha <= 0.001) {
          continue;
        }
        ctx.fillStyle = `rgba(255, 111, 24, ${alpha})`;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 203, 92, ${alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(screen.x + particle.size * 0.08, screen.y - particle.size * 0.1, particle.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 245, 214, ${alpha * 0.45})`;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y - particle.size * 0.05, particle.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    renderExplosion(ctx, camera, particles = this.explosionParticles) {
      ctx.save();
      for (const particle of particles) {
        const screen = this.worldToScreen(particle.x, particle.y, camera);
        const alpha = particle.alpha;
        if (alpha <= 0.001) {
          continue;
        }
        const colors = [
          `rgba(255, 120, 32, ${alpha})`,
          `rgba(255, 208, 92, ${alpha * 0.9})`,
          `rgba(88, 92, 98, ${alpha * 0.7})`,
        ];
        ctx.fillStyle = particle.color
          ? hexToRgba(mixHexColors(particle.color, particle.palette === 1 ? "#fff2b8" : particle.palette === 2 ? "#202832" : "#ffffff", particle.palette === 2 ? 0.16 : 0.34), particle.palette === 1 ? alpha * 0.9 : particle.palette === 2 ? alpha * 0.7 : alpha)
          : colors[particle.palette];
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    renderTitleTrail(ctx) {
      ctx.save();
      for (const puff of this.titleTrail) {
        const fade = clamp(puff.life / puff.maxLife, 0, 1);
        ctx.fillStyle = `rgba(118, 132, 144, ${fade * 0.13})`;
        ctx.beginPath();
        ctx.ellipse(puff.x, puff.y, puff.size * 1.4, puff.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(56, 65, 74, ${fade * 0.22})`;
        ctx.beginPath();
        ctx.ellipse(puff.x, puff.y, puff.size, puff.size * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    renderTitleDrifter(ctx) {
      const drifter = this.titleDrifter;
      ctx.save();
      ctx.translate(drifter.x, drifter.y);
      ctx.rotate(drifter.angle);
      ctx.scale(2.9, 2.9);
      ctx.shadowColor = drifter.glowColor;
      ctx.shadowBlur = 34;
      this.drawCarShape(ctx, {
        bodyColor: drifter.bodyColor,
        outlineColor: "#10212b",
        cabinColor: "#111923",
        roofColor: "#1a1f28",
        trimColor: "#d8eef9",
        sideTrimColor: "#9fd2ef",
        wheelColor: "#0e1318",
        tailLightColor: "#ff6f6f",
      }, drifter.variant);
      ctx.restore();
    }

    drawCarShape(ctx, palette = {}, variant = "coupe") {
      if (this.drawSpriteCar(ctx, palette, variant)) {
        return;
      }
      this.drawProceduralCarShape(ctx, palette, variant);
    }

    drawProceduralCarShape(ctx, palette = {}, variant = "coupe") {
      const bodyColor = palette.bodyColor || "#909090";
      const outlineColor = palette.outlineColor || "#2b2b2b";
      const cabinColor = palette.cabinColor || "#2f2f2f";
      const roofColor = palette.roofColor || "#363636";
      const trimColor = palette.trimColor || "#727272";
      const sideTrimColor = palette.sideTrimColor || "#707070";
      const wheelColor = palette.wheelColor || "#2b2b2b";
      const tailLightColor = palette.tailLightColor || "#aa4949";
      const headLightColor = palette.headLightColor || "#f4f8ff";
      const styles = {
        coupe: {
          widthScale: 1.02,
          tailCut: 0.76,
          nose: 0.98,
          nosePinch: 0.42,
          canopyShift: -0.02,
          canopyScale: 1,
          rearGlassScale: 1,
          mirrorX: 0.02,
          mirrorY: 0.92,
          openTop: false,
          scoopDepth: 0.18,
          roofX: 0.16,
          hoodPad: 0.18,
        },
        wedge: {
          widthScale: 0.94,
          tailCut: 0.72,
          nose: 1.04,
          nosePinch: 0.32,
          canopyShift: 0.04,
          canopyScale: 0.9,
          rearGlassScale: 0.82,
          mirrorX: 0.08,
          mirrorY: 0.9,
          openTop: false,
          scoopDepth: 0.24,
          roofX: 0.2,
          hoodPad: 0.12,
        },
        muscle: {
          widthScale: 1.12,
          tailCut: 0.82,
          nose: 0.95,
          nosePinch: 0.48,
          canopyShift: -0.01,
          canopyScale: 0.96,
          rearGlassScale: 1.04,
          mirrorX: -0.01,
          mirrorY: 0.96,
          openTop: false,
          scoopDepth: 0.12,
          roofX: 0.13,
          hoodPad: 0.24,
        },
        roadster: {
          widthScale: 0.98,
          tailCut: 0.74,
          nose: 0.97,
          nosePinch: 0.38,
          canopyShift: 0.01,
          canopyScale: 0.88,
          rearGlassScale: 0.7,
          mirrorX: 0.06,
          mirrorY: 0.88,
          openTop: true,
          scoopDepth: 0.16,
          roofX: 0.17,
          hoodPad: 0.16,
        },
      };
      const style = styles[variant] || styles.coupe;
      const halfLength = CAR_LENGTH * 0.5;
      const halfWidth = CAR_WIDTH * 0.5 * style.widthScale;
      const mirrorColor = mixHexColors(bodyColor, "#f7fbff", 0.18);
      const hoodHighlightColor = mixHexColors(bodyColor, "#fff5b8", 0.22);
      const canopyFill = style.openTop ? mixHexColors(cabinColor, "#070a0d", 0.42) : cabinColor;

      const addRoundedRect = (x, y, w, h, radius) => {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        ctx.fill();
      };

      const wheel = (x, y, w, h) => {
        ctx.beginPath();
        ctx.roundRect(x - w * 0.5, y - h * 0.5, w, h, h * 0.48);
        ctx.fill();
      };

      const bodyPath = () => {
        ctx.beginPath();
        ctx.moveTo(-halfLength * style.tailCut, -halfWidth * 0.66);
        ctx.bezierCurveTo(
          -halfLength * 1.02,
          -halfWidth * 0.92,
          -halfLength * 0.78,
          -halfWidth * 1.08,
          -halfLength * 0.34,
          -halfWidth * 0.98
        );
        ctx.bezierCurveTo(
          halfLength * 0.02,
          -halfWidth * 0.96,
          halfLength * 0.58,
          -halfWidth * 0.98,
          halfLength * style.nose,
          -halfWidth * style.nosePinch
        );
        ctx.quadraticCurveTo(halfLength * (style.nose + 0.08), 0, halfLength * style.nose, halfWidth * style.nosePinch);
        ctx.bezierCurveTo(
          halfLength * 0.58,
          halfWidth * 0.98,
          halfLength * 0.02,
          halfWidth * 0.96,
          -halfLength * 0.34,
          halfWidth * 0.98
        );
        ctx.bezierCurveTo(
          -halfLength * 0.78,
          halfWidth * 1.08,
          -halfLength * 1.02,
          halfWidth * 0.92,
          -halfLength * style.tailCut,
          halfWidth * 0.66
        );
        ctx.quadraticCurveTo(-halfLength * (style.tailCut + 0.16), 0, -halfLength * style.tailCut, -halfWidth * 0.66);
        ctx.closePath();
      };

      const windshieldPath = () => {
        const shift = halfLength * style.canopyShift;
        const scale = style.canopyScale;
        ctx.beginPath();
        ctx.moveTo(-halfLength * 0.26 + shift, -halfWidth * 0.56 * scale);
        ctx.lineTo(halfLength * 0.02 + shift, -halfWidth * 0.38 * scale);
        ctx.quadraticCurveTo(halfLength * 0.16 + shift, 0, halfLength * 0.02 + shift, halfWidth * 0.38 * scale);
        ctx.lineTo(-halfLength * 0.26 + shift, halfWidth * 0.56 * scale);
        ctx.quadraticCurveTo(-halfLength * 0.4 + shift, 0, -halfLength * 0.26 + shift, -halfWidth * 0.56 * scale);
        ctx.closePath();
      };

      ctx.save();

      ctx.fillStyle = wheelColor;
      wheel(-halfLength * 0.38, -halfWidth * 1.03, CAR_LENGTH * 0.18, CAR_WIDTH * 0.16);
      wheel(halfLength * 0.34, -halfWidth * 1.03, CAR_LENGTH * 0.18, CAR_WIDTH * 0.16);
      wheel(-halfLength * 0.38, halfWidth * 1.03, CAR_LENGTH * 0.18, CAR_WIDTH * 0.16);
      wheel(halfLength * 0.34, halfWidth * 1.03, CAR_LENGTH * 0.18, CAR_WIDTH * 0.16);

      bodyPath();
      const bodyGradient = ctx.createLinearGradient(-halfLength, -halfWidth, halfLength, halfWidth);
      bodyGradient.addColorStop(0, mixHexColors(bodyColor, "#fff7da", 0.18));
      bodyGradient.addColorStop(0.46, bodyColor);
      bodyGradient.addColorStop(1, mixHexColors(bodyColor, "#091018", 0.16));
      ctx.fillStyle = bodyGradient;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = outlineColor;
      ctx.stroke();

      ctx.save();
      bodyPath();
      ctx.clip();

      ctx.fillStyle = `rgba(255, 255, 255, 0.12)`;
      ctx.beginPath();
      ctx.ellipse(-halfLength * 0.42, 0, halfLength * 0.45, halfWidth * 0.84, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 255, 255, 0.08)`;
      ctx.beginPath();
      ctx.ellipse(halfLength * 0.67, 0, halfLength * 0.17, halfWidth * 0.68, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = hoodHighlightColor;
      addRoundedRect(
        halfLength * (style.hoodPad - 0.02),
        -halfWidth * 0.3,
        halfLength * 0.32,
        halfWidth * 0.6,
        halfWidth * 0.18
      );

      ctx.fillStyle = canopyFill;
      windshieldPath();
      ctx.fill();

      if (style.openTop) {
        ctx.fillStyle = "#06080b";
        ctx.beginPath();
        ctx.ellipse(halfLength * 0.02, 0, halfLength * 0.22, halfWidth * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = roofColor;
        ctx.beginPath();
        ctx.ellipse(-halfLength * 0.08, -halfWidth * 0.12, halfLength * 0.08, halfWidth * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-halfLength * 0.08, halfWidth * 0.12, halfLength * 0.08, halfWidth * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = roofColor;
        addRoundedRect(
          halfLength * style.roofX,
          -halfWidth * 0.46 * style.rearGlassScale,
          halfLength * 0.33,
          halfWidth * 0.92 * style.rearGlassScale,
          halfWidth * 0.2
        );
      }

      ctx.strokeStyle = trimColor;
      ctx.lineWidth = 1.35;
      ctx.beginPath();
      ctx.moveTo(-halfLength * 0.42, -halfWidth * 0.52);
      ctx.quadraticCurveTo(-halfLength * 0.04, -halfWidth * 0.72, halfLength * 0.34, -halfWidth * 0.48);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-halfLength * 0.42, halfWidth * 0.52);
      ctx.quadraticCurveTo(-halfLength * 0.04, halfWidth * 0.72, halfLength * 0.34, halfWidth * 0.48);
      ctx.stroke();

      ctx.fillStyle = `rgba(0, 0, 0, 0.2)`;
      for (const sign of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(-halfLength * 0.02, sign * halfWidth * 0.56);
        ctx.quadraticCurveTo(halfLength * 0.18, sign * halfWidth * (0.86 + style.scoopDepth * 0.15), halfLength * 0.44, sign * halfWidth * 0.48);
        ctx.quadraticCurveTo(halfLength * 0.16, sign * halfWidth * 0.38, -halfLength * 0.02, sign * halfWidth * 0.56);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      ctx.fillStyle = mirrorColor;
      for (const sign of [-1, 1]) {
        ctx.save();
        ctx.translate(-halfLength * style.mirrorX, sign * halfWidth * style.mirrorY);
        ctx.rotate(sign * 0.42);
        ctx.beginPath();
        ctx.ellipse(0, 0, 4.4, 2.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.fillStyle = headLightColor;
      for (const sign of [-1, 1]) {
        const y = sign * halfWidth * 0.64;
        ctx.beginPath();
        ctx.moveTo(halfLength * 0.62, y - sign * 1);
        ctx.lineTo(halfLength * 0.9, y - sign * 4);
        ctx.quadraticCurveTo(halfLength * 0.98, y, halfLength * 0.76, y + sign * 6);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = mixHexColors(headLightColor, "#8aa4b8", 0.3);
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }

      ctx.fillStyle = tailLightColor;
      for (const sign of [-1, 1]) {
        ctx.save();
        ctx.translate(-halfLength * 0.84, sign * halfWidth * 0.68);
        ctx.rotate(sign * -0.24);
        ctx.beginPath();
        ctx.roundRect(-2.2, -6.5, 4.4, 13, 2.2);
        ctx.fill();
        ctx.restore();
      }

      ctx.strokeStyle = sideTrimColor;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(halfLength * 0.02, -halfWidth * 0.12);
      ctx.quadraticCurveTo(halfLength * 0.28, -halfWidth * 0.22, halfLength * 0.45, -halfWidth * 0.04);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(halfLength * 0.02, halfWidth * 0.12);
      ctx.quadraticCurveTo(halfLength * 0.28, halfWidth * 0.22, halfLength * 0.45, halfWidth * 0.04);
      ctx.stroke();

      ctx.restore();
    }

    getPlayerCarPalette(color = this.playerCarColor) {
      return {
        bodyColor: color,
        outlineColor: mixHexColors(color, "#10151b", 0.78),
        cabinColor: mixHexColors(color, "#11161c", 0.82),
        roofColor: mixHexColors(color, "#ffffff", 0.12),
        trimColor: mixHexColors(color, "#e7f5ff", 0.46),
        sideTrimColor: mixHexColors(color, "#9ed8f6", 0.34),
        wheelColor: "#2b2b2b",
        tailLightColor: "#aa4949",
      };
    }

    getTagCarPalette(color) {
      return this.getPlayerCarPalette(color);
    }

    getCurrentCustomizationVariant() {
      return CAR_VARIANTS.find((variant) => variant.id === this.customizationDraftVariant) || CAR_VARIANTS[0];
    }

    renderCar(ctx, camera, state, palette = this.getPlayerCarPalette(), variant = this.playerCarVariant, highlight = false) {
      const screen = this.worldToScreen(state.x, state.y, camera);

      ctx.save();
      ctx.translate(screen.x, screen.y);
      ctx.rotate(state.angle);
      if (highlight) {
        ctx.shadowColor = "rgba(255, 255, 255, 0.95)";
        ctx.shadowBlur = 28;
      }
      this.drawCarShape(ctx, palette, variant);
      ctx.restore();
    }

    renderTouchJoystickMarker(ctx, camera, state = null) {
      const marker = this.getTouchJoystickTargetMarker(this.car, this.touchJoystick, this.canUseTouchJoystick());
      if (!marker) {
        return;
      }

      const originX = state?.x ?? this.car.x;
      const originY = state?.y ?? this.car.y;
      const carScreen = this.worldToScreen(originX, originY, camera);
      const markerScreen = this.worldToScreen(
        originX + marker.directionX * TOUCH_JOYSTICK_TARGET_DISTANCE,
        originY + marker.directionY * TOUCH_JOYSTICK_TARGET_DISTANCE,
        camera
      );
      const basis = this.getTouchJoystickDriveBasis(this.car, this.touchJoystick);
      const reverseAlignment = dot(marker.directionX, marker.directionY, basis.forwardX, basis.forwardY);
      const reversing = reverseAlignment <= basis.reverseThreshold;

      ctx.save();
      ctx.lineCap = "round";
      ctx.strokeStyle = reversing ? "rgba(255, 150, 150, 0.72)" : "rgba(150, 244, 197, 0.72)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(carScreen.x, carScreen.y);
      ctx.lineTo(markerScreen.x, markerScreen.y);
      ctx.stroke();

      const glow = ctx.createRadialGradient(markerScreen.x, markerScreen.y, 2, markerScreen.x, markerScreen.y, 18);
      glow.addColorStop(0, reversing ? "rgba(255, 232, 232, 0.95)" : "rgba(244, 255, 249, 0.95)");
      glow.addColorStop(0.45, reversing ? "rgba(255, 128, 128, 0.78)" : "rgba(110, 255, 188, 0.78)");
      glow.addColorStop(1, reversing ? "rgba(255, 128, 128, 0)" : "rgba(110, 255, 188, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(markerScreen.x, markerScreen.y, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = reversing ? "rgba(255, 188, 188, 0.95)" : "rgba(190, 255, 220, 0.95)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(markerScreen.x, markerScreen.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    renderTagCarEffects(ctx, camera, entry) {
      const smokeLevel = this.getSmokeDamageLevel(entry.player);
      if (!entry.player.exploding) {
        this.renderCar(
          ctx,
          camera,
          entry.state,
          this.getTagCarPalette(entry.player.color),
          entry.player.variant,
          entry.player.isIt
        );
        this.renderDamageSmoke(ctx, camera, entry.player.damageSmoke);
        this.renderCarSmokeOverlay(ctx, camera, entry.state, smokeLevel);
        this.renderDamageFire(ctx, camera, entry.player.damageFire);
      }
      this.renderExplosion(ctx, camera, entry.player.explosionParticles);

      const screen = this.worldToScreen(entry.state.x, entry.state.y, camera);
      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = entry.player.accent;
      ctx.font = "700 15px Consolas, monospace";
      ctx.fillText(entry.player.label.toUpperCase(), screen.x, screen.y - 28);
      if (entry.player.isIt) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 13px Consolas, monospace";
        ctx.fillText("IT", screen.x, screen.y - 44);
      }
      ctx.restore();
    }

    renderTagCars(ctx, camera, states) {
      for (const entry of states) {
        this.renderTagCarEffects(ctx, camera, entry);
      }
    }

    renderTitleButtons(ctx) {
      this.renderMenuButtons(ctx, this.getTitleButtons());
    }

    renderTitleUsernameBox(ctx) {
      const layout = this.getTitleUsernameLayout();
      if (!layout.visible) {
        return;
      }

      ctx.save();
      ctx.fillStyle = "rgba(8, 15, 24, 0.88)";
      ctx.strokeStyle = "rgba(154, 255, 210, 0.34)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(layout.x, layout.y, layout.w, layout.h, layout.radius);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(180, 235, 255, 0.08)";
      ctx.beginPath();
      ctx.roundRect(layout.x + 7, layout.y + 7, layout.w - 14, 22, 8);
      ctx.fill();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#dff6ff";
      ctx.font = `700 ${layout.fontSize}px Consolas, monospace`;
      ctx.fillText("Username", layout.x + layout.w * 0.5, layout.y + 20);

      if (layout.updateButton.visible) {
        const button = layout.updateButton;
        const centerX = button.x + button.w * 0.5;
        const centerY = button.y + button.h * 0.5;
        const hover = this.titleLeaderboardNameUpdateHover;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1 + hover * 0.05, 1 + hover * 0.05);
        ctx.shadowColor = `rgba(255, 214, 107, ${0.16 + hover * 0.38})`;
        ctx.shadowBlur = 8 + hover * 16;
        const fill = ctx.createLinearGradient(-button.w * 0.5, -button.h * 0.5, button.w * 0.5, button.h * 0.5);
        fill.addColorStop(0, "rgba(74, 53, 16, 0.96)");
        fill.addColorStop(1, "rgba(138, 99, 24, 0.93)");
        ctx.fillStyle = fill;
        ctx.strokeStyle = `rgba(255, 225, 142, ${0.34 + hover * 0.42})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-button.w * 0.5, -button.h * 0.5, button.w, button.h, 12);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff1c7";
        ctx.font = `700 ${button.fontSize}px Consolas, monospace`;
        ctx.fillText(fitTextToWidth(ctx, this.leaderboardNameUpdateInFlight ? "Updating..." : "Update Leaderboard", button.w - 14), 0, Math.round(button.fontSize * 0.35));
        ctx.restore();
      }

      for (const button of layout.authButtons) {
        if (!button.visible) {
          continue;
        }
        const hover = button.id === "login"
          ? this.titleLoginHover
          : button.id === "signup"
            ? this.titleSignUpHover
            : this.titleLogoutHover;
        const centerX = button.x + button.w * 0.5;
        const centerY = button.y + button.h * 0.5;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1 + hover * 0.05, 1 + hover * 0.05);
        ctx.shadowColor = button.id === "signup"
          ? `rgba(154, 255, 210, ${0.12 + hover * 0.3})`
          : button.id === "logout"
            ? `rgba(255, 166, 166, ${0.12 + hover * 0.32})`
            : `rgba(128, 214, 255, ${0.12 + hover * 0.28})`;
        ctx.shadowBlur = 6 + hover * 12;
        const fill = ctx.createLinearGradient(-button.w * 0.5, -button.h * 0.5, button.w * 0.5, button.h * 0.5);
        if (button.id === "signup") {
          fill.addColorStop(0, "rgba(14, 61, 43, 0.95)");
          fill.addColorStop(1, "rgba(26, 112, 72, 0.9)");
        } else if (button.id === "logout") {
          fill.addColorStop(0, "rgba(72, 24, 24, 0.95)");
          fill.addColorStop(1, "rgba(122, 41, 41, 0.9)");
        } else {
          fill.addColorStop(0, "rgba(10, 33, 49, 0.95)");
          fill.addColorStop(1, "rgba(17, 57, 78, 0.9)");
        }
        ctx.fillStyle = fill;
        ctx.strokeStyle = button.id === "signup"
          ? `rgba(154, 255, 210, ${0.28 + hover * 0.42})`
          : button.id === "logout"
            ? `rgba(255, 182, 182, ${0.28 + hover * 0.42})`
          : `rgba(152, 223, 255, ${0.28 + hover * 0.38})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.roundRect(-button.w * 0.5, -button.h * 0.5, button.w, button.h, 10);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = hover > 0.01 ? "#f4fdff" : "#dff6ff";
        ctx.font = `700 ${button.fontSize}px Consolas, monospace`;
        ctx.fillText(fitTextToWidth(ctx, button.label, button.w - 10), 0, Math.round(button.fontSize * 0.35));
        ctx.restore();
      }

      const authText = this.signedInUsername
        ? `Signed in as ${this.signedInUsername}`
        : (this.authStatusText || "Optional account sync");
      ctx.fillStyle = this.authStatusTone === "error"
        ? "#ff9d9d"
        : this.signedInUsername || this.authStatusTone === "ok"
          ? "#9affd2"
          : "rgba(190, 225, 242, 0.68)";
      ctx.font = `${layout.authStatus.fontSize}px Consolas, monospace`;
      ctx.fillText(fitTextToWidth(ctx, authText, layout.authStatus.w), layout.authStatus.x + layout.authStatus.w * 0.5, layout.authStatus.y + layout.authStatus.h * 0.5);
      ctx.restore();
    }

    renderSignOutConfirmOverlay(ctx) {
      if (!this.signOutConfirmOpen) {
        return;
      }

      ctx.save();
      ctx.fillStyle = "rgba(2, 5, 9, 0.6)";
      ctx.fillRect(0, 0, this.width, this.height);
      const overlayScale = this.getScreenFitScale(520, 420, 0.58);
      const panelW = Math.min(Math.round(460 * overlayScale), this.width - 24);
      const panelH = Math.min(Math.round(204 * overlayScale), this.height - 24);
      ctx.translate(this.width * 0.5, this.height * 0.5);
      ctx.fillStyle = "rgba(5, 10, 16, 0.92)";
      ctx.beginPath();
      ctx.roundRect(-panelW * 0.5, -panelH * 0.5, panelW, panelH, Math.max(14, Math.round(22 * overlayScale)));
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 170, 170, 0.36)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillStyle = "#f2fbff";
      ctx.font = `700 ${Math.max(17, Math.round(28 * overlayScale))}px Consolas, monospace`;
      const titleLines = wrapTextToLines(ctx, "Are you sure you want to sign out?", panelW - Math.round(64 * overlayScale), 2);
      const titleStartY = titleLines.length > 1 ? -Math.round(44 * overlayScale) : -Math.round(28 * overlayScale);
      for (let index = 0; index < titleLines.length; index += 1) {
        ctx.fillText(titleLines[index], 0, titleStartY + index * Math.round(32 * overlayScale));
      }
      ctx.fillStyle = "#96c6de";
      ctx.font = `${Math.max(12, Math.round(18 * overlayScale))}px Consolas, monospace`;
      ctx.fillText(
        fitTextToWidth(ctx, "You will be assigned a new player name.", panelW - Math.round(48 * overlayScale)),
        0,
        titleLines.length > 1 ? Math.round(18 * overlayScale) : Math.round(8 * overlayScale)
      );

      for (const button of this.getSignOutConfirmButtons()) {
        const hover = button.id === "cancel" ? this.signOutConfirmCancelHover : this.signOutConfirmLeaveHover;
        const centerX = button.x - this.width * 0.5 + button.w * 0.5;
        const centerY = button.y - this.height * 0.5 + button.h * 0.5;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1 + hover * 0.05, 1 + hover * 0.05);
        ctx.shadowColor = button.id === "signout"
          ? `rgba(255, 154, 154, ${0.18 + hover * 0.42})`
          : `rgba(135, 218, 255, ${0.14 + hover * 0.34})`;
        ctx.shadowBlur = 8 + hover * 18;
        const fill = ctx.createLinearGradient(-button.w * 0.5, -button.h * 0.5, button.w * 0.5, button.h * 0.5);
        if (button.id === "signout") {
          fill.addColorStop(0, "rgba(84, 28, 28, 0.96)");
          fill.addColorStop(1, "rgba(132, 44, 44, 0.93)");
        } else {
          fill.addColorStop(0, "rgba(10, 33, 49, 0.94)");
          fill.addColorStop(1, "rgba(18, 61, 84, 0.92)");
        }
        ctx.fillStyle = fill;
        ctx.strokeStyle = button.id === "signout"
          ? `rgba(255, 170, 170, ${0.34 + hover * 0.44})`
          : `rgba(150, 224, 255, ${0.28 + hover * 0.44})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-button.w * 0.5, -button.h * 0.5, button.w, button.h, 14);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = button.id === "signout" ? "#ffe0d6" : "#eff9ff";
        ctx.font = `700 ${button.fontSize || 22}px Consolas, monospace`;
        ctx.fillText(fitTextToWidth(ctx, button.label, button.w - 14), 0, Math.round((button.fontSize || 22) * 0.35));
        ctx.restore();
      }
      ctx.restore();
    }

    renderTwoPlayerButtons(ctx) {
      this.renderMenuButtons(ctx, this.getTwoPlayerButtons());
    }

    renderLeaderboardButtons(ctx) {
      const buttons = this.getLeaderboardButtons().map((button) => ({
        ...button,
        hover: button.id === "back" ? this.leaderboardBackHover : 0,
      }));
      this.renderMenuButtons(ctx, buttons);
    }

    renderMenuButtons(ctx, buttons) {
      ctx.save();
      ctx.textAlign = "center";
      for (const button of buttons) {
        const enabled = button.enabled !== false;
        const scale = 1 + button.hover * 0.08;
        const centerX = button.x + button.w * 0.5;
        const centerY = button.y + button.h * 0.5;
        const glowAlpha = enabled ? 0.16 + button.hover * 0.32 : 0.06;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.shadowColor = enabled ? `rgba(128, 214, 255, ${0.22 + button.hover * 0.4})` : "rgba(0, 0, 0, 0.12)";
        ctx.shadowBlur = enabled ? 8 + button.hover * 28 : 0;

        const fill = ctx.createLinearGradient(-button.w * 0.5, -button.h * 0.5, button.w * 0.5, button.h * 0.5);
        if (enabled) {
          fill.addColorStop(0, `rgba(10, 33, 49, ${0.92 - button.hover * 0.12})`);
          fill.addColorStop(1, `rgba(16, 57, 78, ${0.9 + button.hover * 0.08})`);
        } else {
          fill.addColorStop(0, "rgba(11, 17, 23, 0.95)");
          fill.addColorStop(1, "rgba(22, 28, 34, 0.94)");
        }
        ctx.fillStyle = fill;
        ctx.strokeStyle = enabled ? `rgba(152, 223, 255, ${0.28 + button.hover * 0.55})` : "rgba(82, 97, 109, 0.42)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-button.w * 0.5, -button.h * 0.5, button.w, button.h, button.radius || 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = `rgba(180, 235, 255, ${glowAlpha})`;
        ctx.beginPath();
        ctx.roundRect(-button.w * 0.5 + 6, -button.h * 0.5 + 6, button.w - 12, button.h * 0.34, Math.max(8, (button.radius || 14) - 4));
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = enabled ? (button.hover > 0.01 ? "#f4fdff" : "#d6eaf3") : "#7e8a94";
        ctx.font = `700 ${button.fontSize || 24}px Consolas, monospace`;
        ctx.fillText(fitTextToWidth(ctx, button.label, button.w - 20), 0, Math.round((button.fontSize || 24) * 0.32));
        ctx.restore();
      }
      ctx.restore();
    }

    renderLevelSelectBackButton(ctx) {
      const button = this.getLevelSelectBackButton();
      const blackoutSelected = this.isBlackoutLevelSelectActive();
      ctx.save();
      ctx.translate(button.x + button.w * 0.5, button.y + button.h * 0.5);
      ctx.scale(1 + this.levelSelectBackHover * 0.06, 1 + this.levelSelectBackHover * 0.06);
      ctx.shadowColor = blackoutSelected
        ? `rgba(124, 136, 154, ${0.12 + this.levelSelectBackHover * 0.22})`
        : `rgba(128, 214, 255, ${0.18 + this.levelSelectBackHover * 0.32})`;
      ctx.shadowBlur = 8 + this.levelSelectBackHover * 18;
      const fill = ctx.createLinearGradient(-button.w * 0.5, -button.h * 0.5, button.w * 0.5, button.h * 0.5);
      if (blackoutSelected) {
        fill.addColorStop(0, "rgba(8, 10, 14, 0.96)");
        fill.addColorStop(1, "rgba(18, 22, 30, 0.94)");
      } else {
        fill.addColorStop(0, "rgba(10, 33, 49, 0.92)");
        fill.addColorStop(1, "rgba(16, 57, 78, 0.9)");
      }
      ctx.fillStyle = fill;
      ctx.strokeStyle = blackoutSelected
        ? `rgba(100, 112, 129, ${0.34 + this.levelSelectBackHover * 0.26})`
        : `rgba(152, 223, 255, ${0.28 + this.levelSelectBackHover * 0.48})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-button.w * 0.5, -button.h * 0.5, button.w, button.h, 12);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = blackoutSelected
        ? (this.levelSelectBackHover > 0.01 ? "#e3e9f2" : "#b9c3d0")
        : (this.levelSelectBackHover > 0.01 ? "#f4fdff" : "#d6eaf3");
      ctx.font = "700 18px Consolas, monospace";
      ctx.textAlign = "center";
      ctx.fillText("Back", 0, 6);
      ctx.restore();
    }

    renderComingSoonBadge(ctx, card, hover = 0) {
      const badgeW = Math.round(card.w * 0.62);
      const badgeH = Math.round(card.h * 0.68);
      const badgeX = card.w * 0.5 + 18;
      const badgeY = -card.h * 0.5 + 8;
      const pulse = 0.5 + Math.sin(performance.now() * 0.004) * 0.5;

      ctx.save();
      ctx.translate(badgeX, badgeY);
      ctx.rotate(0.08);
      ctx.shadowColor = `rgba(255, 209, 102, ${0.16 + hover * 0.22 + pulse * 0.1})`;
      ctx.shadowBlur = 10 + hover * 8 + pulse * 6;
      const fill = ctx.createLinearGradient(-badgeW * 0.5, -badgeH * 0.5, badgeW * 0.5, badgeH * 0.5);
      fill.addColorStop(0, "rgba(80, 54, 14, 0.96)");
      fill.addColorStop(1, "rgba(170, 115, 28, 0.94)");
      ctx.fillStyle = fill;
      ctx.strokeStyle = `rgba(255, 229, 155, ${0.62 + pulse * 0.18})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-badgeW * 0.5, -badgeH * 0.5, badgeW, badgeH, 16);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(255, 244, 205, 0.18)";
      ctx.beginPath();
      ctx.roundRect(-badgeW * 0.5 + 6, -badgeH * 0.5 + 6, badgeW - 12, Math.max(14, badgeH * 0.34), 10);
      ctx.fill();

      ctx.fillStyle = "#fff3c9";
      ctx.font = `700 ${Math.max(12, Math.round(card.h * 0.18))}px Consolas, monospace`;
      ctx.textAlign = "center";
      ctx.fillText("NEW LEVELS", 0, -4);
      ctx.fillStyle = "#ffd76a";
      ctx.font = `${Math.max(11, Math.round(card.h * 0.16))}px Consolas, monospace`;
      ctx.fillText("COMING SOON", 0, 16);
      ctx.restore();
    }

    renderLevelSelectCards(ctx) {
      ctx.save();
      ctx.textAlign = "center";
      const blackoutSelected = this.isBlackoutLevelSelectActive();
      const groups = this.getLevelSelectGroups();
      const metrics = this.getLevelSelectLayoutMetrics();
      const scale = metrics.verticalScale;
      const groupLineY = Math.round(13 * scale);
      const groupTitleY = Math.round(8 * scale);
      const groupSubtitleY = Math.round(27 * scale);
      const groupLineOuter = Math.round(208 * scale);
      const groupLineInner = Math.round(80 * scale);
      const groupTitleFontSize = Math.max(18, Math.round(22 * scale));
      const groupSubtitleFontSize = Math.max(11, Math.round(13 * scale));
      const cardAccentHeight = Math.max(20, Math.round(28 * scale));
      const cardNumberFontSize = Math.max(18, Math.round(24 * scale));
      const cardBestFontSize = Math.max(12, Math.round(16 * scale));
      const cardBestY = Math.round(30 * scale);
      const lockPillHeight = Math.max(18, Math.round(22 * scale));
      const lockPillInset = Math.max(14, Math.round(18 * scale));
      const lockPillBottom = Math.max(10, Math.round(12 * scale));

      for (const group of groups) {
        ctx.save();
        ctx.translate(group.x, group.y);
        ctx.strokeStyle = blackoutSelected ? "rgba(96, 108, 124, 0.18)" : hexToRgba(group.themeColor, 0.26);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-groupLineOuter, groupLineY);
        ctx.lineTo(-groupLineInner, groupLineY);
        ctx.moveTo(groupLineInner, groupLineY);
        ctx.lineTo(groupLineOuter, groupLineY);
        ctx.stroke();
        ctx.fillStyle = blackoutSelected
          ? mixHexColors(group.themeColor, "#8d97a6", 0.22)
          : mixHexColors(group.themeColor, "#f7fbff", 0.58);
        ctx.font = `700 ${groupTitleFontSize}px Consolas, monospace`;
        ctx.fillText(group.title, 0, groupTitleY);
        ctx.fillStyle = blackoutSelected
          ? mixHexColors(group.themeColor, "#778292", 0.18)
          : mixHexColors(group.themeColor, "#d6edf8", 0.5);
        ctx.font = `${groupSubtitleFontSize}px Consolas, monospace`;
        ctx.fillText(fitTextToWidth(ctx, `${group.rangeLabel} - ${group.subtitle}`, this.width * 0.72), 0, groupSubtitleY);
        ctx.restore();
      }

      for (const card of groups.flatMap((group) => group.cards)) {
        const hover = this.levelCardHovers[card.index] || 0;
        const scale = 1 + hover * 0.05 + (card.isCurrent ? 0.04 : 0);
        const centerX = card.x + card.w * 0.5;
        const centerY = card.y + card.h * 0.5;
        const fillTop = blackoutSelected
          ? (card.unlocked ? (card.isCurrent ? "rgba(14, 17, 24, 0.97)" : "rgba(8, 10, 15, 0.95)") : "rgba(5, 6, 8, 0.97)")
          : (card.unlocked ? (card.isCurrent ? "rgba(25, 76, 104, 0.95)" : "rgba(16, 48, 67, 0.92)") : "rgba(10, 13, 18, 0.95)");
        const fillBottom = blackoutSelected
          ? (card.unlocked ? (card.isCurrent ? "rgba(4, 6, 10, 0.99)" : "rgba(1, 2, 5, 0.98)") : "rgba(0, 0, 0, 0.98)")
          : (card.unlocked ? (card.isCurrent ? "rgba(10, 36, 52, 0.97)" : "rgba(10, 25, 37, 0.95)") : "rgba(5, 8, 11, 0.96)");
        const border = card.unlocked
          ? blackoutSelected
            ? card.isCurrent
              ? "rgba(170, 183, 205, 0.76)"
              : "rgba(80, 91, 108, 0.52)"
            : card.isCurrent
              ? hexToRgba(card.themeColor, 0.74 + hover * 0.18)
              : hexToRgba(card.themeColor, 0.34 + hover * 0.22)
          : (blackoutSelected ? "rgba(38, 42, 48, 0.78)" : "rgba(52, 60, 68, 0.65)");
        const titleColor = card.unlocked
          ? blackoutSelected
            ? (card.isCurrent ? "#d6dfeb" : "#a5b0bf")
            : card.isCurrent
              ? mixHexColors(card.themeColor, "#ffffff", 0.72)
              : mixHexColors(card.themeColor, "#dcecf6", 0.7)
          : (blackoutSelected ? "#4b525b" : "#55606b");
        const subColor = blackoutSelected
          ? (card.unlocked ? (card.isCurrent ? "#9ca8b8" : "#74808f") : "#414852")
          : (card.unlocked ? (card.isCurrent ? "#c5ebff" : "#96c6de") : "#48525c");

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.shadowColor = card.unlocked
          ? blackoutSelected
            ? (card.isCurrent ? "rgba(150, 166, 188, 0.2)" : "rgba(32, 36, 44, 0.28)")
            : card.isCurrent
              ? hexToRgba(card.themeColor, 0.36)
              : hexToRgba(card.themeColor, 0.16 + hover * 0.16)
          : "rgba(0, 0, 0, 0.2)";
        ctx.shadowBlur = card.unlocked
          ? blackoutSelected
            ? (card.isCurrent ? 18 : 6 + hover * 6)
            : (card.isCurrent ? 28 : 12 + hover * 12)
          : 0;

        const fill = ctx.createLinearGradient(-card.w * 0.5, -card.h * 0.5, card.w * 0.5, card.h * 0.5);
        fill.addColorStop(0, fillTop);
        fill.addColorStop(1, fillBottom);
        ctx.fillStyle = fill;
        ctx.strokeStyle = border;
        ctx.lineWidth = card.isCurrent ? 3 : 2;
        ctx.beginPath();
        ctx.roundRect(-card.w * 0.5, -card.h * 0.5, card.w, card.h, 18);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = card.unlocked
          ? blackoutSelected
            ? (card.isCurrent ? "rgba(152, 166, 186, 0.12)" : "rgba(84, 96, 112, 0.08)")
            : hexToRgba(card.themeColor, card.isCurrent ? 0.18 : 0.1 + hover * 0.08)
          : (blackoutSelected ? "rgba(18, 20, 24, 0.55)" : "rgba(32, 38, 43, 0.45)");
        ctx.beginPath();
        ctx.roundRect(-card.w * 0.5 + 8, -card.h * 0.5 + 8, card.w - 16, cardAccentHeight, 12);
        ctx.fill();

        const cardTextWidth = Math.max(24, card.w - 22);
        const levelText = `LEVEL ${card.index + 1}`;
        const bestText = `Best ${formatBestTime(card.bestTime)}`;
        const fittedLevelFontSize = this.getFittedFontSize(
          ctx,
          levelText,
          cardTextWidth,
          Math.min(cardNumberFontSize, card.h * 0.28),
          9,
          "700"
        );
        const fittedBestFontSize = this.getFittedFontSize(
          ctx,
          bestText,
          cardTextWidth,
          Math.min(cardBestFontSize, card.h * 0.18),
          8
        );

        ctx.fillStyle = titleColor;
        ctx.font = `700 ${fittedLevelFontSize}px Consolas, monospace`;
        ctx.fillText(levelText, 0, Math.round(scale));

        const bestTimeColor = !card.unlocked
          ? (blackoutSelected ? "#383d43" : "#404851")
          : card.cleanFinish
            ? (card.isCurrent ? "#ffe7a4" : "#ffd76a")
            : (blackoutSelected ? (card.isCurrent ? "#d6dde9" : subColor) : (card.isCurrent ? "#fff0b8" : "#bdd8e7"));
        ctx.fillStyle = bestTimeColor;
        ctx.shadowColor = card.cleanFinish
          ? card.isCurrent
            ? "rgba(255, 214, 106, 0.78)"
            : `rgba(255, 215, 106, ${0.42 + hover * 0.2})`
          : "transparent";
        ctx.shadowBlur = card.cleanFinish ? (card.isCurrent ? 20 : 10 + hover * 10) : 0;
        ctx.font = `${fittedBestFontSize}px Consolas, monospace`;
        ctx.fillText(bestText, 0, Math.max(cardBestY, Math.round(fittedLevelFontSize * 0.9)));
        ctx.shadowBlur = 0;

        if (!card.unlocked) {
          ctx.fillStyle = "rgba(8, 10, 13, 0.56)";
          ctx.beginPath();
          ctx.roundRect(-card.w * 0.5 + lockPillInset, card.h * 0.5 - lockPillBottom - lockPillHeight, card.w - lockPillInset * 2, lockPillHeight, 10);
          ctx.fill();
        }

        if (card.index === LEVELS.length - 1) {
          this.renderComingSoonBadge(ctx, card, hover);
        }

        ctx.restore();
      }
      ctx.restore();
    }

    renderLevelSelectSpeedrunButton(ctx) {
      const button = this.getLevelSelectSpeedrunButton();
      if (button.visible === false) {
        return;
      }
      const hover = button.enabled ? this.levelSelectSpeedrunHover : 0;
      const centerX = button.x + button.w * 0.5;
      const centerY = button.y + button.h * 0.5;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(1 + hover * 0.05, 1 + hover * 0.05);
      ctx.shadowColor = button.enabled
        ? `rgba(255, 208, 112, ${0.18 + hover * 0.34})`
        : "rgba(0, 0, 0, 0.12)";
      ctx.shadowBlur = button.enabled ? 10 + hover * 18 : 0;
      const fill = ctx.createLinearGradient(-button.w * 0.5, -button.h * 0.5, button.w * 0.5, button.h * 0.5);
      if (button.enabled) {
        fill.addColorStop(0, "rgba(74, 53, 16, 0.95)");
        fill.addColorStop(1, "rgba(138, 99, 24, 0.92)");
      } else {
        fill.addColorStop(0, "rgba(11, 17, 23, 0.95)");
        fill.addColorStop(1, "rgba(22, 28, 34, 0.94)");
      }
      ctx.fillStyle = fill;
      ctx.strokeStyle = button.enabled
        ? `rgba(255, 225, 142, ${0.34 + hover * 0.4})`
        : "rgba(82, 97, 109, 0.42)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-button.w * 0.5, -button.h * 0.5, button.w, button.h, 16);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = button.enabled ? "rgba(255, 239, 184, 0.16)" : "rgba(88, 96, 102, 0.12)";
      ctx.beginPath();
      ctx.roundRect(-button.w * 0.5 + 8, -button.h * 0.5 + 8, button.w - 16, 24, 10);
      ctx.fill();

      ctx.fillStyle = button.enabled ? "#fff1c7" : "#7e8a94";
      ctx.font = "700 22px Consolas, monospace";
      ctx.textAlign = "center";
      ctx.fillText(button.label, 0, 2);
      ctx.fillStyle = button.enabled ? "#ffd98a" : "#626c75";
      ctx.font = "15px Consolas, monospace";
      ctx.fillText(button.enabled ? "Run all levels in one go" : "Unlock every level to play", 0, 24);
      ctx.restore();
    }

    renderLevelSelectBlackoutButton(ctx) {
      const button = this.getLevelSelectBlackoutButton();
      const hover = button.enabled ? this.levelSelectBlackoutHover : 0;
      const active = button.enabled && this.currentScreen === "level_select" && this.gameMode === "blackout";
      const centerX = button.x + button.w * 0.5;
      const centerY = button.y + button.h * 0.5;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(1 + hover * 0.05 + (active ? 0.02 : 0), 1 + hover * 0.05 + (active ? 0.02 : 0));
      ctx.shadowColor = button.enabled
        ? (active
            ? `rgba(210, 230, 255, ${0.28 + hover * 0.28})`
            : `rgba(18, 22, 34, ${0.34 + hover * 0.34})`)
        : "rgba(0, 0, 0, 0.12)";
      ctx.shadowBlur = button.enabled ? 12 + hover * 18 + (active ? 8 : 0) : 0;
      const fill = ctx.createLinearGradient(-button.w * 0.5, -button.h * 0.5, button.w * 0.5, button.h * 0.5);
      if (button.enabled) {
        if (active) {
          fill.addColorStop(0, "rgba(22, 28, 38, 0.98)");
          fill.addColorStop(0.55, "rgba(28, 36, 48, 0.97)");
          fill.addColorStop(1, "rgba(40, 52, 68, 0.95)");
        } else {
          fill.addColorStop(0, "rgba(12, 15, 22, 0.96)");
          fill.addColorStop(0.55, "rgba(18, 22, 30, 0.95)");
          fill.addColorStop(1, "rgba(32, 38, 46, 0.94)");
        }
      } else {
        fill.addColorStop(0, "rgba(11, 17, 23, 0.95)");
        fill.addColorStop(1, "rgba(22, 28, 34, 0.94)");
      }
      ctx.fillStyle = fill;
      ctx.strokeStyle = button.enabled
        ? (active
            ? `rgba(214, 231, 255, ${0.48 + hover * 0.24})`
            : `rgba(120, 133, 149, ${0.28 + hover * 0.34})`)
        : "rgba(82, 97, 109, 0.42)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-button.w * 0.5, -button.h * 0.5, button.w, button.h, 16);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = button.enabled
        ? (active ? "rgba(232, 242, 255, 0.12)" : "rgba(255, 255, 255, 0.06)")
        : "rgba(88, 96, 102, 0.12)";
      ctx.beginPath();
      ctx.roundRect(-button.w * 0.5 + 8, -button.h * 0.5 + 8, button.w - 16, 24, 10);
      ctx.fill();

      ctx.fillStyle = button.enabled ? (active ? "#f6fbff" : "#eef3ff") : "#7e8a94";
      ctx.font = "700 22px Consolas, monospace";
      ctx.textAlign = "center";
      ctx.fillText(button.label, 0, 2);
      ctx.fillStyle = button.enabled
        ? (active
            ? "#dfeeff"
            : (hover > 0.001 ? "#cad3e2" : "#aab4c5"))
        : "#626c75";
      ctx.font = "15px Consolas, monospace";
      ctx.fillText(
        fitTextToWidth(
          ctx,
          button.enabled
            ? (active ? "Click to Toggle" : "Click to Toggle")
            : "Unlock every level to play",
          button.w - 26
        ),
        0,
        24
      );
      ctx.restore();
    }

    renderCustomizationButtons(ctx) {
      const buttons = this.getCustomizationButtons();
      ctx.save();
      ctx.textAlign = "center";
      for (const button of buttons) {
        const hover = button.id === "done" ? this.customizationDoneHover : this.customizationBackHover;
        const centerX = button.x + button.w * 0.5;
        const centerY = button.y + button.h * 0.5;
        const scale = 1 + hover * 0.06;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.shadowColor = `rgba(135, 218, 255, ${0.16 + hover * 0.34})`;
        ctx.shadowBlur = 8 + hover * 18;
        const fill = ctx.createLinearGradient(-button.w * 0.5, -button.h * 0.5, button.w * 0.5, button.h * 0.5);
        fill.addColorStop(0, button.id === "done" ? "rgba(17, 63, 52, 0.94)" : "rgba(28, 36, 49, 0.92)");
        fill.addColorStop(1, button.id === "done" ? "rgba(20, 105, 85, 0.92)" : "rgba(18, 55, 78, 0.9)");
        ctx.fillStyle = fill;
        ctx.strokeStyle = `rgba(152, 223, 255, ${0.28 + hover * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-button.w * 0.5, -button.h * 0.5, button.w, button.h, 14);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = hover > 0.01 ? "#f4fdff" : "#d6eaf3";
        ctx.font = `700 ${button.fontSize || 22}px Consolas, monospace`;
        ctx.fillText(fitTextToWidth(ctx, button.label, button.w - 18), 0, Math.round((button.fontSize || 22) * 0.35));
        ctx.restore();
      }
      ctx.restore();
    }

    renderTwoPlayerCustomizationButtons(ctx) {
      const buttons = this.getTwoPlayerCustomizationButtons();
      ctx.save();
      ctx.textAlign = "center";
      for (const button of buttons) {
        const hover = button.id === "done" ? this.customizationDoneHover : this.customizationBackHover;
        const centerX = button.x + button.w * 0.5;
        const centerY = button.y + button.h * 0.5;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1 + hover * 0.06, 1 + hover * 0.06);
        ctx.shadowColor = `rgba(135, 218, 255, ${0.16 + hover * 0.34})`;
        ctx.shadowBlur = 8 + hover * 18;
        const fill = ctx.createLinearGradient(-button.w * 0.5, -button.h * 0.5, button.w * 0.5, button.h * 0.5);
        fill.addColorStop(0, button.id === "done" ? "rgba(17, 63, 52, 0.94)" : "rgba(28, 36, 49, 0.92)");
        fill.addColorStop(1, button.id === "done" ? "rgba(20, 105, 85, 0.92)" : "rgba(18, 55, 78, 0.9)");
        ctx.fillStyle = fill;
        ctx.strokeStyle = `rgba(152, 223, 255, ${0.28 + hover * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-button.w * 0.5, -button.h * 0.5, button.w, button.h, 14);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = hover > 0.01 ? "#f4fdff" : "#d6eaf3";
        ctx.font = `700 ${button.fontSize || 22}px Consolas, monospace`;
        ctx.fillText(fitTextToWidth(ctx, button.label, button.w - 18), 0, Math.round((button.fontSize || 22) * 0.35));
        ctx.restore();
      }
      ctx.restore();
    }

    renderCustomizationArrows(ctx) {
      const arrows = this.getCustomizationArrowButtons();
      ctx.save();
      for (const arrow of arrows) {
        const hover = arrow.id === "prev_model" ? this.customizationPrevHover : this.customizationNextHover;
        const centerX = arrow.x + arrow.w * 0.5;
        const centerY = arrow.y + arrow.h * 0.5;
        const direction = arrow.id === "prev_model" ? -1 : 1;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1 + hover * 0.08, 1 + hover * 0.08);
        ctx.shadowColor = `rgba(135, 218, 255, ${0.16 + hover * 0.34})`;
        ctx.shadowBlur = 8 + hover * 18;
        const fill = ctx.createLinearGradient(-arrow.w * 0.5, -arrow.h * 0.5, arrow.w * 0.5, arrow.h * 0.5);
        fill.addColorStop(0, "rgba(10, 33, 49, 0.92)");
        fill.addColorStop(1, "rgba(16, 57, 78, 0.9)");
        ctx.fillStyle = fill;
        ctx.strokeStyle = `rgba(152, 223, 255, ${0.28 + hover * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-arrow.w * 0.5, -arrow.h * 0.5, arrow.w, arrow.h, 18);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = hover > 0.01 ? "#f4fdff" : "#d6eaf3";
        const arrowHalfHeight = arrow.h * 0.24;
        const arrowHalfWidth = arrow.w * 0.18;
        ctx.beginPath();
        ctx.moveTo(direction < 0 ? arrowHalfWidth : -arrowHalfWidth, -arrowHalfHeight);
        ctx.lineTo(direction < 0 ? -arrowHalfWidth * 1.2 : arrowHalfWidth * 1.2, 0);
        ctx.lineTo(direction < 0 ? arrowHalfWidth : -arrowHalfWidth, arrowHalfHeight);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    renderTwoPlayerCustomizationArrows(ctx) {
      const arrows = this.getTwoPlayerCustomizationArrowButtons();
      ctx.save();
      for (const arrow of arrows) {
        const playerId = arrow.id.startsWith("blue") ? "blue" : "red";
        const hover = arrow.id.endsWith("_prev") ? this.customizationPrevHover : this.customizationNextHover;
        const isHovered = this.hoveredCustomizationButton === arrow.id;
        const draft = this.twoPlayerCustomizationDrafts[playerId] || this.getTwoPlayerCarSetting(playerId);
        const accent = mixHexColors(draft.color, "#02060d", 0.34);
        const centerX = arrow.x + arrow.w * 0.5;
        const centerY = arrow.y + arrow.h * 0.5;
        const direction = arrow.id.endsWith("_prev") ? -1 : 1;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1 + (isHovered ? hover : 0) * 0.08, 1 + (isHovered ? hover : 0) * 0.08);
        ctx.shadowColor = hexToRgba(accent, 0.16 + (isHovered ? hover : 0) * 0.34);
        ctx.shadowBlur = 8 + (isHovered ? hover : 0) * 18;
        const fill = ctx.createLinearGradient(-arrow.w * 0.5, -arrow.h * 0.5, arrow.w * 0.5, arrow.h * 0.5);
        fill.addColorStop(0, "rgba(10, 33, 49, 0.92)");
        fill.addColorStop(1, "rgba(16, 57, 78, 0.9)");
        ctx.fillStyle = fill;
        ctx.strokeStyle = hexToRgba(accent, 0.32 + (isHovered ? hover : 0) * 0.5);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-arrow.w * 0.5, -arrow.h * 0.5, arrow.w, arrow.h, 16);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = isHovered ? "#f4fdff" : "#d6eaf3";
        const arrowHalfHeight = arrow.h * 0.24;
        const arrowHalfWidth = arrow.w * 0.18;
        ctx.beginPath();
        ctx.moveTo(direction < 0 ? arrowHalfWidth : -arrowHalfWidth, -arrowHalfHeight);
        ctx.lineTo(direction < 0 ? -arrowHalfWidth * 1.2 : arrowHalfWidth * 1.2, 0);
        ctx.lineTo(direction < 0 ? arrowHalfWidth : -arrowHalfWidth, arrowHalfHeight);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    renderTouchJoystick(ctx, joystick = this.touchJoystick) {
      if (!joystick.active || this.currentScreen !== "game") {
        return;
      }

      const baseX = joystick.baseX;
      const baseY = joystick.baseY;
      const knobX = joystick.knobX;
      const knobY = joystick.knobY;
      const outerRadius = 64;

      ctx.save();
      ctx.globalAlpha = 0.9;

      const outerGlow = ctx.createRadialGradient(baseX, baseY, 12, baseX, baseY, 84);
      outerGlow.addColorStop(0, `rgba(${joystick.glowColor}, 0.24)`);
      outerGlow.addColorStop(0.55, `rgba(${joystick.glowColor}, 0.12)`);
      outerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(baseX, baseY, 84, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(9, 18, 28, 0.24)";
      ctx.beginPath();
      ctx.arc(baseX, baseY, outerRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(${joystick.ringColor}, 0.32)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(baseX, baseY, outerRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(${joystick.ringColor}, 0.14)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(baseX - 48, baseY);
      ctx.lineTo(baseX + 48, baseY);
      ctx.moveTo(baseX, baseY - 48);
      ctx.lineTo(baseX, baseY + 48);
      ctx.stroke();

      ctx.strokeStyle = `rgba(${joystick.stemColor}, 0.22)`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.lineTo(knobX, knobY);
      ctx.stroke();

      ctx.fillStyle = `rgba(${joystick.knobFillColor}, 0.3)`;
      ctx.strokeStyle = `rgba(${joystick.knobStrokeColor}, 0.46)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(knobX, knobY, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    renderActiveTouchJoysticks(ctx) {
      if (this.currentScreen !== "game" || this.homeConfirmOpen) {
        return;
      }
      if (this.isTwoPlayerDrivingMode()) {
        if (this.tagMatchFinished || this.completed || this.goalTriggered) {
          return;
        }
        for (const player of this.tagCars) {
          if (!player.exploding && player.fireSequenceTimer <= 0) {
            this.renderTouchJoystick(ctx, player.touchJoystick);
          }
        }
        return;
      }
      if (this.completed || this.goalTriggered || this.fireSequenceTimer > 0 || this.exploding) {
        return;
      }
      this.renderTouchJoystick(ctx, this.touchJoystick);
    }

    renderHUDToggleButton(ctx, button) {
      const hover = this.hudToggleHover;
      ctx.save();
      ctx.translate(button.x + button.w * 0.5, button.y + button.h * 0.5);
      ctx.scale(1 + hover * 0.05, 1 + hover * 0.05);
      ctx.shadowColor = `rgba(135, 218, 255, ${0.16 + hover * 0.3})`;
      ctx.shadowBlur = 8 + hover * 14;
      const fill = ctx.createLinearGradient(-button.w * 0.5, -button.h * 0.5, button.w * 0.5, button.h * 0.5);
      fill.addColorStop(0, "rgba(10, 33, 49, 0.96)");
      fill.addColorStop(1, "rgba(17, 57, 78, 0.92)");
      ctx.fillStyle = fill;
      ctx.strokeStyle = `rgba(152, 223, 255, ${0.3 + hover * 0.44})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-button.w * 0.5, -button.h * 0.5, button.w, button.h, 12);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      const direction = this.hudCollapsed ? 1 : -1;
      ctx.fillStyle = hover > 0.01 ? "#f4fdff" : "#d6eaf3";
      ctx.beginPath();
      ctx.moveTo(direction < 0 ? 4 : -4, -10);
      ctx.lineTo(direction < 0 ? -6 : 6, 0);
      ctx.lineTo(direction < 0 ? 4 : -4, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    renderTagUI(ctx) {
      const layout = this.getTagHUDLayout();
      const { metrics, redPlayer, bluePlayer, leftLines, rightLines, panelH, bodyStartY, contentWidth } = layout;
      const {
        panelX,
        panelY,
        panelW,
        padding,
        columnGap,
        singleColumn,
        titleFontSize,
        subtitleFontSize,
        lineFontSize,
        controlsFontSize,
        headerHeight,
        lineGap,
      } = metrics;
      const leftWidth = singleColumn ? contentWidth : Math.floor((contentWidth - columnGap) * 0.5);
      const rightWidth = singleColumn ? contentWidth : contentWidth - leftWidth - columnGap;
      const rightColX = panelX + padding + leftWidth + columnGap;
      const toggleButton = this.getHUDToggleButtonForPanel(panelX, panelY, panelW, panelH);
      const contentAlpha = clamp(1 - this.hudCollapseAnim * 2.4, 0, 1);

      ctx.save();
      ctx.translate(toggleButton.slideOffset, 0);
      ctx.fillStyle = "rgba(3, 8, 14, 0.74)";
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, panelW, panelH, 12);
      ctx.fill();
      ctx.strokeStyle = "rgba(126, 162, 186, 0.38)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.globalAlpha *= contentAlpha;
      ctx.textAlign = "left";
      ctx.fillStyle = "#dceaf3";
      ctx.font = `600 ${titleFontSize}px Consolas, monospace`;
      ctx.fillText("2P Tag", panelX + padding, panelY + Math.round(25 * metrics.scale));

      ctx.fillStyle = "#84b6d3";
      ctx.font = `${subtitleFontSize}px Consolas, monospace`;
      ctx.fillText(fitTextToWidth(ctx, this.level.name, contentWidth), panelX + padding, panelY + Math.round(45 * metrics.scale));

      ctx.font = `${lineFontSize}px Consolas, monospace`;
      let lineY = bodyStartY;
      for (const line of leftLines) {
        ctx.fillStyle = line.color;
        ctx.fillText(fitTextToWidth(ctx, line.text, leftWidth), panelX + padding, lineY);
        lineY += lineGap;
      }

      lineY = singleColumn ? bodyStartY + leftLines.length * lineGap : bodyStartY;
      for (const line of rightLines) {
        ctx.fillStyle = line.color;
        ctx.fillText(
          fitTextToWidth(ctx, line.text, singleColumn ? leftWidth : rightWidth),
          singleColumn ? panelX + padding : rightColX,
          lineY
        );
        lineY += lineGap;
      }

      ctx.restore();
      this.renderHUDToggleButton(ctx, toggleButton);

      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(235, 245, 250, 0.9)";
      ctx.font = `${controlsFontSize}px Consolas, monospace`;
      ctx.fillText(
        fitTextToWidth(ctx, "Player 1: WASD   Player 2: Arrows   Space rematch", this.width - 60),
        this.width - Math.max(16, Math.round(30 * metrics.scale)),
        this.height - Math.max(16, Math.round(30 * metrics.scale))
      );
      ctx.textAlign = "left";

      if (this.tagMatchFinished) {
        this.renderTagEndOverlay(ctx, redPlayer, bluePlayer);
      }
    }

    renderTagEndOverlay(ctx, redPlayer, bluePlayer) {
      ctx.save();
      ctx.translate(this.width * 0.5, this.height * 0.5);
      ctx.fillStyle = "rgba(5, 10, 16, 0.76)";
      ctx.fillRect(-240, -110, 480, 220);
      ctx.strokeStyle = "rgba(255, 209, 102, 0.7)";
      ctx.lineWidth = 2;
      ctx.strokeRect(-240, -110, 480, 220);
      ctx.fillStyle = "#fff2cc";
      ctx.font = "700 34px Consolas, monospace";
      ctx.textAlign = "center";
      ctx.fillText(this.tagWinnerText, 0, -28);
      ctx.font = "18px Consolas, monospace";
      ctx.fillText(`Player 1 tagged ${formatTime(redPlayer.taggedTime)}`, 0, 14);
      ctx.fillText(`Player 2 tagged ${formatTime(bluePlayer.taggedTime)}`, 0, 44);
      ctx.fillText("Lower tagged time wins", 0, 72);
      ctx.fillText("Press Space for another random map", 0, 100);
      ctx.restore();
    }

    renderRaceCountdownOverlay(ctx) {
      const label = this.getRaceCountdownText();
      if (!label) {
        return;
      }

      const goVisible = this.raceGoTimer > 0;
      const emphasis = goVisible
        ? 1 - this.raceGoTimer / Math.max(RACE_START_GO_TIME, 0.001)
        : 1 - (this.raceCountdownTimer % 1);

      ctx.save();
      ctx.translate(this.width * 0.5, this.height * 0.42);
      ctx.fillStyle = "rgba(3, 8, 14, 0.34)";
      ctx.beginPath();
      ctx.roundRect(-120, -92, 240, 184, 28);
      ctx.fill();

      ctx.textAlign = "center";
      ctx.shadowColor = goVisible ? "rgba(255, 214, 92, 0.7)" : "rgba(159, 227, 255, 0.65)";
      ctx.shadowBlur = 26 + emphasis * 10;
      ctx.fillStyle = goVisible ? "#ffd65c" : "#eef8ff";
      ctx.font = `800 ${goVisible ? 84 : 96}px Consolas, monospace`;
      ctx.fillText(label, 0, 30);

      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(232, 244, 252, 0.92)";
      ctx.font = "600 18px Consolas, monospace";
      ctx.fillText(goVisible ? "Race!" : "Get ready", 0, 70);
      ctx.restore();
    }

    renderCampaignCompletionOverlay(ctx) {
      if (!this.levelCompletionSummary) {
        return;
      }

      const summary = this.levelCompletionSummary;
      let statusText = "";
      let encouragementText = "";
      const periodicRecordTitle = summary.recordPeriod ? getLeaderboardRecordTitle(summary.recordPeriod) : "";
      if (summary.speedrun) {
        statusText = summary.newWorldRecord
          ? (summary.blackoutSpeedrun
              ? "Blackout Speedrun - World Record!"
              : (summary.perfectRun ? "Perfect Speedrun - World Record!" : "Speedrun World Record!"))
          : periodicRecordTitle
            ? (summary.blackoutSpeedrun
                ? `Blackout Speedrun - ${periodicRecordTitle}!`
                : (summary.perfectRun ? `Perfect Speedrun - ${periodicRecordTitle}!` : `Speedrun ${periodicRecordTitle}!`))
          : summary.perfectRun
            ? (summary.blackoutSpeedrun ? "perfect blackout speedrun!" : "perfect speedrun!")
            : "";
      } else if (summary.race) {
        statusText = `${summary.title || "Race Complete"} in ${formatTime(summary.levelTime)}`;
      } else {
        statusText = summary.newWorldRecord
          ? (summary.perfectRun ? "Perfect Run - World Record" : "World Record!")
          : periodicRecordTitle
            ? (summary.perfectRun ? `Perfect Run - ${periodicRecordTitle}` : `${periodicRecordTitle}!`)
          : summary.perfectRun && summary.newRecord
            ? "Perfect Run - New Record"
            : summary.perfectRun
              ? "Perfect Run!"
              : summary.newRecord
                ? "New Record!"
                : "";
        if (!statusText && summary.recordToBeat != null) {
          encouragementText = `Try to beat your record of: ${formatTime(summary.recordToBeat)}!`;
        }
      }

      ctx.save();
      const overlayScale = this.getScreenFitScale(560, 520, 0.55);
      const panelW = Math.min(Math.round(520 * overlayScale), this.width - 24);
      const panelH = Math.min(Math.round(300 * overlayScale), this.height - 24);
      const panelHalfW = panelW * 0.5;
      const panelHalfH = panelH * 0.5;
      ctx.translate(this.width * 0.5, this.height * 0.5);
      ctx.fillStyle = "rgba(4, 8, 14, 0.78)";
      ctx.beginPath();
      ctx.roundRect(-panelHalfW, -panelHalfH, panelW, panelH, Math.max(16, Math.round(24 * overlayScale)));
      ctx.fill();
      ctx.strokeStyle = "rgba(146, 208, 236, 0.48)";
      ctx.lineWidth = 2;
      ctx.stroke();

      const topGlow = ctx.createLinearGradient(0, -panelHalfH, 0, -panelHalfH + Math.round(96 * overlayScale));
      topGlow.addColorStop(0, "rgba(101, 194, 230, 0.2)");
      topGlow.addColorStop(1, "rgba(101, 194, 230, 0)");
      ctx.fillStyle = topGlow;
      ctx.beginPath();
      ctx.roundRect(
        -panelHalfW + Math.round(12 * overlayScale),
        -panelHalfH + Math.round(12 * overlayScale),
        panelW - Math.round(24 * overlayScale),
        Math.round(82 * overlayScale),
        Math.max(12, Math.round(18 * overlayScale))
      );
      ctx.fill();

      ctx.textAlign = "center";
      ctx.fillStyle = "#f2fbff";
      ctx.font = `700 ${Math.max(20, Math.round(34 * overlayScale))}px Consolas, monospace`;
      ctx.fillText(fitTextToWidth(ctx, summary.title || "Level Complete!", panelW - Math.round(48 * overlayScale)), 0, -Math.round(92 * overlayScale));

      ctx.fillStyle = "#90c9de";
      ctx.font = `${Math.max(12, Math.round(18 * overlayScale))}px Consolas, monospace`;
      ctx.fillText(
        fitTextToWidth(ctx, summary.subtitle || (summary.speedrun ? (summary.blackoutSpeedrun ? "Blackout full run summary" : "Full run summary") : this.level.name), panelW - Math.round(56 * overlayScale)),
        0,
        -Math.round(58 * overlayScale)
      );

      ctx.fillStyle = summary.perfectRun ? "#ffd76a" : "#f3f8fc";
      ctx.shadowColor = summary.perfectRun ? "rgba(255, 210, 92, 0.7)" : "transparent";
      ctx.shadowBlur = summary.perfectRun ? 20 : 0;
      ctx.font = `700 ${Math.max(24, Math.round(42 * overlayScale))}px Consolas, monospace`;
      ctx.fillText(formatTime(summary.levelTime), 0, -Math.round(2 * overlayScale));
      ctx.shadowBlur = 0;

      if (statusText) {
        ctx.fillStyle = summary.perfectRun ? "#ffeab2" : "#96d7f2";
        ctx.font = `${Math.max(12, Math.round(18 * overlayScale))}px Consolas, monospace`;
        ctx.fillText(fitTextToWidth(ctx, statusText, panelW - Math.round(56 * overlayScale)), 0, Math.round(34 * overlayScale));
      } else if (encouragementText) {
        ctx.fillStyle = "#96d7f2";
        ctx.font = `${Math.max(11, Math.round(16 * overlayScale))}px Consolas, monospace`;
        ctx.fillText(fitTextToWidth(ctx, encouragementText, panelW - Math.round(56 * overlayScale)), 0, Math.round(34 * overlayScale));
      }

      if (summary.speedrun) {
        ctx.fillStyle = "#96d7f2";
        ctx.font = `${Math.max(11, Math.round(16 * overlayScale))}px Consolas, monospace`;
        ctx.fillText(`Deaths: ${summary.deaths}`, 0, Math.round((statusText ? 64 : 44) * overlayScale));
      }

      for (const button of this.getCampaignCompleteButtons()) {
        const hover = button.id === "home"
          ? this.completionHomeHover
          : button.id === "replay"
            ? this.completionReplayHover
            : this.completionNextHover;
        const centerX = button.x - this.width * 0.5 + button.w * 0.5;
        const centerY = button.y - this.height * 0.5 + button.h * 0.5;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1 + hover * 0.06, 1 + hover * 0.06);
        ctx.shadowColor = button.id === "next"
          ? `rgba(255, 214, 107, ${0.16 + hover * 0.42})`
          : button.id === "replay"
            ? `rgba(133, 255, 194, ${0.16 + hover * 0.4})`
            : `rgba(120, 205, 242, ${0.14 + hover * 0.34})`;
        ctx.shadowBlur = 10 + hover * 18;
        const fill = ctx.createLinearGradient(-button.w * 0.5, -button.h * 0.5, button.w * 0.5, button.h * 0.5);
        if (button.id === "next") {
          fill.addColorStop(0, "rgba(74, 53, 16, 0.96)");
          fill.addColorStop(1, "rgba(138, 99, 24, 0.93)");
        } else if (button.id === "replay") {
          fill.addColorStop(0, "rgba(14, 61, 43, 0.95)");
          fill.addColorStop(1, "rgba(26, 112, 72, 0.92)");
        } else {
          fill.addColorStop(0, "rgba(10, 33, 49, 0.94)");
          fill.addColorStop(1, "rgba(18, 61, 84, 0.92)");
        }
        ctx.fillStyle = fill;
        ctx.strokeStyle = button.id === "next"
          ? `rgba(255, 225, 142, ${0.34 + hover * 0.44})`
          : button.id === "replay"
            ? `rgba(182, 255, 212, ${0.32 + hover * 0.42})`
            : `rgba(150, 224, 255, ${0.28 + hover * 0.44})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-button.w * 0.5, -button.h * 0.5, button.w, button.h, 14);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = button.id === "next" ? "#fff1c7" : button.id === "replay" ? "#e6fff0" : "#eff9ff";
        ctx.font = `700 ${button.fontSize || (button.id === "replay" ? 19 : 22)}px Consolas, monospace`;
        ctx.fillText(fitTextToWidth(ctx, button.label, button.w - 14), 0, Math.round((button.fontSize || 22) * 0.35));
        ctx.restore();
      }
      ctx.restore();
    }

    renderHomeConfirmOverlay(ctx) {
      if (!this.homeConfirmOpen) {
        return;
      }

      ctx.save();
      ctx.fillStyle = "rgba(2, 5, 9, 0.56)";
      ctx.fillRect(0, 0, this.width, this.height);
      const overlayScale = this.getScreenFitScale(520, 420, 0.58);
      const panelW = Math.min(Math.round(460 * overlayScale), this.width - 24);
      const panelH = Math.min(Math.round(204 * overlayScale), this.height - 24);
      ctx.translate(this.width * 0.5, this.height * 0.5);
      ctx.fillStyle = "rgba(5, 10, 16, 0.9)";
      ctx.beginPath();
      ctx.roundRect(-panelW * 0.5, -panelH * 0.5, panelW, panelH, Math.max(14, Math.round(22 * overlayScale)));
      ctx.fill();
      ctx.strokeStyle = "rgba(146, 208, 236, 0.42)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillStyle = "#f2fbff";
      ctx.font = `700 ${Math.max(17, Math.round(28 * overlayScale))}px Consolas, monospace`;
      const titleLines = wrapTextToLines(ctx, "Are you sure you want to go home?", panelW - Math.round(64 * overlayScale), 2);
      const titleStartY = titleLines.length > 1 ? -Math.round(44 * overlayScale) : -Math.round(28 * overlayScale);
      for (let index = 0; index < titleLines.length; index += 1) {
        ctx.fillText(titleLines[index], 0, titleStartY + index * Math.round(32 * overlayScale));
      }
      ctx.fillStyle = "#96c6de";
      ctx.font = `${Math.max(12, Math.round(18 * overlayScale))}px Consolas, monospace`;
      ctx.fillText(
        fitTextToWidth(ctx, "Your current run progress will be lost.", panelW - Math.round(48 * overlayScale)),
        0,
        titleLines.length > 1 ? Math.round(18 * overlayScale) : Math.round(8 * overlayScale)
      );

      for (const button of this.getHomeConfirmButtons()) {
        const hover = button.id === "cancel" ? this.homeConfirmCancelHover : this.homeConfirmLeaveHover;
        const centerX = button.x - this.width * 0.5 + button.w * 0.5;
        const centerY = button.y - this.height * 0.5 + button.h * 0.5;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1 + hover * 0.05, 1 + hover * 0.05);
        ctx.shadowColor = button.id === "leave"
          ? `rgba(255, 141, 122, ${0.18 + hover * 0.42})`
          : `rgba(135, 218, 255, ${0.14 + hover * 0.34})`;
        ctx.shadowBlur = 8 + hover * 18;
        const fill = ctx.createLinearGradient(-button.w * 0.5, -button.h * 0.5, button.w * 0.5, button.h * 0.5);
        if (button.id === "leave") {
          fill.addColorStop(0, "rgba(84, 28, 28, 0.96)");
          fill.addColorStop(1, "rgba(132, 44, 44, 0.93)");
        } else {
          fill.addColorStop(0, "rgba(10, 33, 49, 0.94)");
          fill.addColorStop(1, "rgba(18, 61, 84, 0.92)");
        }
        ctx.fillStyle = fill;
        ctx.strokeStyle = button.id === "leave"
          ? `rgba(255, 170, 150, ${0.34 + hover * 0.44})`
          : `rgba(150, 224, 255, ${0.28 + hover * 0.44})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-button.w * 0.5, -button.h * 0.5, button.w, button.h, 14);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = button.id === "leave" ? "#ffe0d6" : "#eff9ff";
        ctx.font = `700 ${button.fontSize || 22}px Consolas, monospace`;
        ctx.fillText(fitTextToWidth(ctx, button.label, button.w - 14), 0, Math.round((button.fontSize || 22) * 0.35));
        ctx.restore();
      }
      ctx.restore();
    }

    renderPublishConfirmOverlay(ctx) {
      if (!this.publishConfirmOpen) {
        return;
      }

      ctx.save();
      ctx.fillStyle = "rgba(2, 5, 9, 0.58)";
      ctx.fillRect(0, 0, this.width, this.height);
      const overlayScale = this.getScreenFitScale(520, 420, 0.58);
      const panelW = Math.min(Math.round(460 * overlayScale), this.width - 24);
      const panelH = Math.min(Math.round(204 * overlayScale), this.height - 24);
      ctx.translate(this.width * 0.5, this.height * 0.5);
      ctx.fillStyle = "rgba(5, 12, 18, 0.92)";
      ctx.beginPath();
      ctx.roundRect(-panelW * 0.5, -panelH * 0.5, panelW, panelH, Math.max(14, Math.round(22 * overlayScale)));
      ctx.fill();
      ctx.strokeStyle = "rgba(154, 255, 210, 0.42)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = "#f2fbff";
      ctx.font = `700 ${Math.max(17, Math.round(28 * overlayScale))}px Consolas, monospace`;
      const titleLines = wrapTextToLines(ctx, "Are you sure you want to publish?", panelW - Math.round(64 * overlayScale), 2);
      const titleStartY = titleLines.length > 1 ? -Math.round(44 * overlayScale) : -Math.round(28 * overlayScale);
      for (let index = 0; index < titleLines.length; index += 1) {
        ctx.fillText(titleLines[index], 0, titleStartY + index * Math.round(32 * overlayScale));
      }

      ctx.fillStyle = "#96d7f2";
      ctx.font = `${Math.max(12, Math.round(18 * overlayScale))}px Consolas, monospace`;
      ctx.fillText(
        fitTextToWidth(ctx, "This saves the level with your creator time.", panelW - Math.round(48 * overlayScale)),
        0,
        titleLines.length > 1 ? Math.round(18 * overlayScale) : Math.round(8 * overlayScale)
      );

      for (const button of this.getPublishConfirmButtons()) {
        const hover = button.id === "publish" ? this.publishConfirmPublishHover : this.publishConfirmCancelHover;
        const centerX = button.x - this.width * 0.5 + button.w * 0.5;
        const centerY = button.y - this.height * 0.5 + button.h * 0.5;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1 + hover * 0.05, 1 + hover * 0.05);
        ctx.shadowColor = button.id === "publish"
          ? `rgba(154, 255, 210, ${0.18 + hover * 0.42})`
          : `rgba(135, 218, 255, ${0.14 + hover * 0.34})`;
        ctx.shadowBlur = 8 + hover * 18;
        const fill = ctx.createLinearGradient(-button.w * 0.5, -button.h * 0.5, button.w * 0.5, button.h * 0.5);
        if (button.id === "publish") {
          fill.addColorStop(0, "rgba(14, 61, 43, 0.95)");
          fill.addColorStop(1, "rgba(26, 112, 72, 0.92)");
        } else {
          fill.addColorStop(0, "rgba(10, 33, 49, 0.94)");
          fill.addColorStop(1, "rgba(18, 61, 84, 0.92)");
        }
        ctx.fillStyle = fill;
        ctx.strokeStyle = button.id === "publish"
          ? `rgba(182, 255, 212, ${0.32 + hover * 0.42})`
          : `rgba(150, 224, 255, ${0.28 + hover * 0.44})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-button.w * 0.5, -button.h * 0.5, button.w, button.h, 14);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = button.id === "publish" ? "#e6fff0" : "#eff9ff";
        ctx.font = `700 ${button.fontSize || 22}px Consolas, monospace`;
        ctx.fillText(fitTextToWidth(ctx, button.label, button.w - 14), 0, Math.round((button.fontSize || 22) * 0.35));
        ctx.restore();
      }
      ctx.restore();
    }

    renderUI(ctx, now) {
      ctx.save();
      if (!(this.gameMode !== "tag" && this.completed && this.levelCompletionSummary)) {
        const exitButton = this.getGameExitButton();

        ctx.save();
        ctx.translate(exitButton.x + exitButton.w * 0.5, exitButton.y + exitButton.h * 0.5);
        ctx.scale(1 + this.gameExitHover * 0.06, 1 + this.gameExitHover * 0.06);
        ctx.shadowColor = `rgba(135, 218, 255, ${0.16 + this.gameExitHover * 0.38})`;
        ctx.shadowBlur = 8 + this.gameExitHover * 20;
        const exitFill = ctx.createLinearGradient(-exitButton.w * 0.5, -exitButton.h * 0.5, exitButton.w * 0.5, exitButton.h * 0.5);
        exitFill.addColorStop(0, `rgba(8, 28, 41, ${0.9 - this.gameExitHover * 0.08})`);
        exitFill.addColorStop(1, `rgba(13, 53, 74, ${0.92})`);
        ctx.fillStyle = exitFill;
        ctx.strokeStyle = `rgba(149, 224, 255, ${0.28 + this.gameExitHover * 0.54})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-exitButton.w * 0.5, -exitButton.h * 0.5, exitButton.w, exitButton.h, 12);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = this.gameExitHover > 0.01 ? "#f5fdff" : "#d7ebf4";
        ctx.font = `700 ${exitButton.fontSize || 18}px Consolas, monospace`;
        ctx.textAlign = "center";
        ctx.fillText(this.isGameBackButtonMode() ? "Back" : "Home", 0, Math.round((exitButton.fontSize || 18) * 0.35));
        ctx.restore();

        if (!this.isTwoPlayerDrivingMode()) {
          const restartButton = this.getGameRestartButton();
          ctx.save();
          ctx.translate(restartButton.x + restartButton.w * 0.5, restartButton.y + restartButton.h * 0.5);
          ctx.scale(1 + this.gameRestartHover * 0.06, 1 + this.gameRestartHover * 0.06);
          ctx.shadowColor = `rgba(166, 255, 204, ${0.14 + this.gameRestartHover * 0.34})`;
          ctx.shadowBlur = 8 + this.gameRestartHover * 18;
          const restartFill = ctx.createLinearGradient(-restartButton.w * 0.5, -restartButton.h * 0.5, restartButton.w * 0.5, restartButton.h * 0.5);
          restartFill.addColorStop(0, `rgba(9, 37, 34, ${0.9 - this.gameRestartHover * 0.08})`);
          restartFill.addColorStop(1, "rgba(18, 76, 64, 0.92)");
          ctx.fillStyle = restartFill;
          ctx.strokeStyle = `rgba(172, 255, 212, ${0.28 + this.gameRestartHover * 0.5})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(-restartButton.w * 0.5, -restartButton.h * 0.5, restartButton.w, restartButton.h, 12);
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.fillStyle = this.gameRestartHover > 0.01 ? "#f4fff8" : "#d8f3e6";
          ctx.font = `700 ${restartButton.fontSize || 18}px Consolas, monospace`;
          ctx.textAlign = "center";
          ctx.fillText(fitTextToWidth(ctx, "Restart", restartButton.w - 14), 0, Math.round((restartButton.fontSize || 18) * 0.35));
          ctx.restore();
        }
      }

      if (this.gameMode === "tag") {
        this.renderTagUI(ctx);
        this.renderHomeConfirmOverlay(ctx);
        this.renderActiveTouchJoysticks(ctx);
        ctx.restore();
        return;
      }

      const layout = this.getCampaignHUDLayout();
      const { panelX, panelY, panelW, panelH, worldInfo, statLines, maxTextWidth, scale, lineGap } = layout;
      const toggleButton = this.getHUDToggleButtonForPanel(panelX, panelY, panelW, panelH);
      const contentAlpha = clamp(1 - this.hudCollapseAnim * 2.4, 0, 1);

      ctx.save();
      ctx.translate(toggleButton.slideOffset, 0);
      ctx.fillStyle = "rgba(3, 8, 14, 0.74)";
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, panelW, panelH, 12);
      ctx.fill();
      ctx.strokeStyle = "rgba(126, 162, 186, 0.38)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.globalAlpha *= contentAlpha;
      ctx.textAlign = "left";
      ctx.fillStyle = "#dceaf3";
      const panelPad = Math.round(14 * scale);
      ctx.font = `600 ${Math.max(14, Math.round(19 * scale))}px Consolas, monospace`;
      ctx.fillText(this.isRaceMode() ? `2P RACE L${this.levelIndex + 1}` : `LEVEL ${this.levelIndex + 1}`, panelX + panelPad, panelY + Math.round(25 * scale));

      ctx.fillStyle = "#84b6d3";
      ctx.font = `${Math.max(10, Math.round(13 * scale))}px Consolas, monospace`;
      ctx.fillText(fitTextToWidth(ctx, worldInfo.title, maxTextWidth), panelX + panelPad, panelY + Math.round(43 * scale));

      ctx.fillStyle = "#f0f7fb";
      ctx.font = `${Math.max(11, Math.round(14 * scale))}px Consolas, monospace`;
      let statY = panelY + Math.round(66 * scale);
      for (const line of statLines) {
        ctx.fillText(fitTextToWidth(ctx, line, maxTextWidth), panelX + panelPad, statY);
        statY += lineGap;
      }

      ctx.font = `${Math.max(10, Math.round(12 * scale))}px Consolas, monospace`;
      if (!this.completed) {
        const raceMaxDamage = this.isRaceMode() ? Math.max(this.getTagPlayer("red").totalDamage, this.getTagPlayer("blue").totalDamage) : this.totalDamage;
        ctx.fillStyle = raceMaxDamage >= FIRE_DAMAGE_START ? "#ff8f66" : raceMaxDamage >= SMOKE_DAMAGE_START ? "#c7cfd6" : "#89d0a8";
        ctx.fillText(fitTextToWidth(ctx, this.isRaceMode() ? "First car to the goal wins" : "Drive into the glowing finish cube", maxTextWidth), panelX + panelPad, panelY + panelH - Math.round(15 * scale));
      } else {
        ctx.fillStyle = this.levelCompletionSummary && this.levelCompletionSummary.perfectRun ? "#ffd76a" : "#96d7f2";
        ctx.fillText(fitTextToWidth(ctx, "Level result locked in", maxTextWidth), panelX + panelPad, panelY + panelH - Math.round(15 * scale));
      }
      ctx.restore();
      this.renderHUDToggleButton(ctx, toggleButton);

      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(235, 245, 250, 0.9)";
      ctx.font = `${Math.max(10, Math.round(15 * this.getHUDScale()))}px Consolas, monospace`;
      const completedHint = this.gameMode === "publish_test"
        ? "Enter / Space publish   R retry   Esc back"
        : this.isCustomLevelMode()
          ? (this.isGameBackButtonMode() ? "Enter / Space retry   Esc back" : "Enter / Space retry   Esc home")
          : this.isRaceMode()
            ? "Enter / Space next   Esc home"
            : "Enter / Space next   Esc home";
      ctx.fillText(
        fitTextToWidth(
          ctx,
          this.completed
            ? completedHint
            : this.isRaceMode()
              ? "WASD / Arrows drive"
              : "WASD / Arrows drive   R restart",
          this.width - 28
        ),
        this.width - Math.max(12, Math.round(30 * this.getHUDScale())),
        this.height - Math.max(12, Math.round(30 * this.getHUDScale()))
      );
      ctx.textAlign = "left";

      if (this.completed) {
        this.renderCampaignCompletionOverlay(ctx);
      }
      if (this.isRaceMode()) {
        this.renderRaceCountdownOverlay(ctx);
      }
      this.renderHomeConfirmOverlay(ctx);
      this.renderPublishConfirmOverlay(ctx);
      this.renderActiveTouchJoysticks(ctx);
      ctx.restore();
    }
  }

  window.addEventListener("load", () => {
    new DriftGame();
  });
})();
