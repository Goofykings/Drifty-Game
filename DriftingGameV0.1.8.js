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
  const LEVEL_6_MAP_ORIGINAL = [
    "###################",
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
  ];
  const START_LEVEL = 8; // 0-based campaign level index for testing.
  const SAVE_STORAGE_KEY = "drifty-save-v1";

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
       "########################",
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
       "########################",
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
      map: LEVEL_6_MAP_ORIGINAL, // Swap to LEVEL_6_MAP_HARDER to use the tougher layout again.
    },
   {
     name: "Level 10",
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
      this.startAngle = definition.startAngle;
      this.rows = definition.map.map((row) => row.split(""));
      this.height = this.rows.length;
      this.width = this.rows[0].length;
      this.pixelWidth = this.width * TILE_SIZE;
      this.pixelHeight = this.height * TILE_SIZE;
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
      document.body.appendChild(this.canvas);
      this.colorInput = document.createElement("input");
      this.colorInput.type = "color";
      this.colorInput.setAttribute("aria-label", "Car color");
      this.colorInput.style.position = "absolute";
      this.colorInput.style.zIndex = "5";
      this.colorInput.style.width = "120px";
      this.colorInput.style.height = "56px";
      this.colorInput.style.padding = "0";
      this.colorInput.style.border = "2px solid rgba(180, 235, 255, 0.5)";
      this.colorInput.style.borderRadius = "14px";
      this.colorInput.style.background = "rgba(8, 20, 30, 0.92)";
      this.colorInput.style.boxShadow = "0 0 24px rgba(98, 198, 255, 0.18)";
      this.colorInput.style.display = "none";
      document.body.appendChild(this.colorInput);

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
      this.mouse = { x: 0, y: 0, inside: false };
      this.hoveredTitleButton = null;
      this.hoveredTwoPlayerButton = null;
      this.hoveredGameButton = null;
      this.hoveredCompletionButton = null;
      this.hoveredHomeConfirmButton = null;
      this.gameExitHover = 0;
      this.completionHomeHover = 0;
      this.completionReplayHover = 0;
      this.completionNextHover = 0;
      this.homeConfirmCancelHover = 0;
      this.homeConfirmLeaveHover = 0;
      this.hoveredLevelCard = null;
      this.hoveredLevelSelectButton = null;
      this.levelCardHovers = LEVELS.map(() => 0);
      this.levelSelectBackHover = 0;
      this.levelSelectSpeedrunHover = 0;
      this.hoveredCustomizationButton = null;
      this.customizationDoneHover = 0;
      this.customizationBackHover = 0;
      this.customizationPrevHover = 0;
      this.customizationNextHover = 0;
      this.highestVisitedLevel = this.levelIndex;
      this.levelBestTimes = LEVELS.map(() => null);
      this.levelCleanFinishes = LEVELS.map(() => false);
      this.levelCompletionSummary = null;
      this.completionSceneTimer = 0;
      this.levelTimerStarted = false;
      this.levelTouchedWallThisRun = false;
      this.goalTriggered = false;
      this.speedrunTimerStarted = false;
      this.death_counter = 0;
      this.speedrunTouchedWall = false;
      this.homeConfirmOpen = false;
      this.playerCarColor = "#909090";
      this.playerCarVariant = CAR_VARIANTS[0].id;
      this.loadPersistentProgress();
      this.customizationDraftColor = this.playerCarColor;
      this.customizationDraftVariant = this.playerCarVariant;
      this.gameMode = "campaign";
      this.twoPlayerNotice = "";
      this.twoPlayerNoticeTimer = 0;
      this.twoPlayerButtons = [
        { id: "tag_mode", label: "Tag", hover: 0 },
        { id: "battle_mode", label: "Battle", hover: 0 },
        { id: "back", label: "Back", hover: 0 },
      ];
      this.tagCars = this.createTagPlayers();
      this.tagMapIndex = 0;
      this.tagElapsed = 0;
      this.tagTransferCooldown = 0;
      this.tagMatchFinished = false;
      this.tagWinnerText = "";
      this.titleButtons = [
        { id: "play", label: "play", hover: 0 },
        { id: "two_player", label: "2 player", hover: 0 },
        { id: "customization", label: "customization", hover: 0 },
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
      this.canvas.addEventListener("mouseleave", () => this.onCanvasPointerLeave());
      this.canvas.addEventListener("click", (event) => this.handleCanvasClick(event));
      this.colorInput.addEventListener("input", (event) => {
        this.customizationDraftColor = event.target.value;
      });
      this.resize();
      this.loadLevel(this.levelIndex);

      requestAnimationFrame((time) => this.frame(time));
    }

    installShell() {
      document.title = "Drifty";
      document.body.style.margin = "0";
      document.body.style.overflow = "hidden";
      document.body.style.background = "#020409";
      document.body.style.fontFamily = "Consolas, Menlo, monospace";
      document.body.innerHTML = "";
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
      }
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
      baseCtx.drawImage(this.carSpriteSheet, x, y, w, h, 0, 0, w, h);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      const target = this.resolveColorRgb(color);

      const hasMask = this.carPaintMaskSheet && this.carPaintMaskSheet.complete && this.carPaintMaskSheet.naturalWidth;
      if (hasMask) {
        const maskCanvas = document.createElement("canvas");
        maskCanvas.width = w;
        maskCanvas.height = h;
        const maskCtx = maskCanvas.getContext("2d");
        maskCtx.imageSmoothingEnabled = true;
        maskCtx.drawImage(this.carPaintMaskSheet, x, y, w, h, 0, 0, w, h);
        const paintCanvas = document.createElement("canvas");
        paintCanvas.width = w;
        paintCanvas.height = h;
        const paintCtx = paintCanvas.getContext("2d");
        paintCtx.imageSmoothingEnabled = true;

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

      this.tintedCarSpriteCache.set(cacheKey, canvas);
      return canvas;
    }

    drawSpriteCar(ctx, palette = {}, variantId = "coupe") {
      const variant = this.getCarVariantDefinition(variantId);
      const spriteCanvas = this.getTintedCarSprite(variant.id, palette.bodyColor || "#909090");
      if (!spriteCanvas || !variant.sprite) {
        return false;
      }

      ctx.save();
      ctx.rotate(-Math.PI * 0.5);
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

    createTagPlayers() {
      return [
        {
          id: "red",
          label: "Red",
          color: "#ea4d4d",
          variant: "muscle",
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
        },
        {
          id: "blue",
          label: "Blue",
          color: "#4f89ff",
          variant: "roadster",
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
        },
      ];
    }

    getTitleButtons() {
      const width = Math.min(280, this.width * 0.28);
      const height = 64;
      const gap = 18;
      const startY = this.height * 0.42;
      const x = this.width * 0.5 - width * 0.5;
      return this.titleButtons.map((button, index) => ({
        ...button,
        x,
        y: startY + index * (height + gap),
        w: width,
        h: height,
      }));
    }

    getTwoPlayerButtons() {
      const width = Math.min(280, this.width * 0.28);
      const height = 64;
      const gap = 18;
      const startY = this.height * 0.42;
      const x = this.width * 0.5 - width * 0.5;
      return this.twoPlayerButtons.map((button, index) => ({
        ...button,
        x,
        y: startY + index * (height + gap),
        w: width,
        h: height,
      }));
    }

    getGameExitButton() {
      return {
        id: "menu",
        x: 24,
        y: 20,
        w: 118,
        h: 38,
      };
    }

    getCampaignCompleteButtons() {
      const width = 144;
      const height = 54;
      const gap = 14;
      const totalWidth = width * 3 + gap * 2;
      const startX = this.width * 0.5 - totalWidth * 0.5;
      const y = this.height * 0.5 + 82;
      return [
        { id: "home", label: "Home", x: startX, y, w: width, h: height },
        { id: "replay", label: "Play Again", x: startX + width + gap, y, w: width, h: height },
        { id: "next", label: "Next", x: startX + (width + gap) * 2, y, w: width, h: height },
      ];
    }

    getHomeConfirmButtons() {
      const width = 148;
      const height = 50;
      const gap = 18;
      const totalWidth = width * 2 + gap;
      const startX = this.width * 0.5 - totalWidth * 0.5;
      const y = this.height * 0.5 + 40;
      return [
        { id: "cancel", label: "Cancel", x: startX, y, w: width, h: height },
        { id: "leave", label: "Leave", x: startX + width + gap, y, w: width, h: height },
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
      const metrics = this.getLevelSelectLayoutMetrics();
      const width = Math.min(320, this.width * 0.34);
      const height = metrics.speedrunHeight;
      const cards = this.getLevelSelectCards();
      const bottom = cards.reduce((max, card) => Math.max(max, card.y + card.h), 0);
      return {
        id: "speedrun",
        label: "Speedrun",
        enabled: this.highestVisitedLevel >= LEVELS.length - 1,
        x: this.width * 0.5 - width * 0.5,
        y: bottom + metrics.speedrunGap,
        w: width,
        h: height,
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
      const safeTop = Math.max(this.height * 0.285, this.height * 0.255 + 20);
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
      const verticalScale = clamp(availableHeight / Math.max(1, totalBaseHeight), 0.72, 1);
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

    getCustomizationButtons() {
      return [
        {
          id: "done",
          label: "Done",
          x: this.width * 0.5 + 24,
          y: this.height * 0.78,
          w: 154,
          h: 50,
        },
        {
          id: "back",
          label: "Back",
          x: this.width * 0.5 - 178,
          y: this.height * 0.78,
          w: 154,
          h: 50,
        },
      ];
    }

    getCustomizationArrowButtons() {
      const y = this.height * 0.49 - 30;
      return [
        {
          id: "prev_model",
          x: this.width * 0.5 - 290,
          y,
          w: 68,
          h: 68,
        },
        {
          id: "next_model",
          x: this.width * 0.5 + 222,
          y,
          w: 68,
          h: 68,
        },
      ];
    }

    onCanvasPointerMove(event) {
      const bounds = this.canvas.getBoundingClientRect();
      this.mouse.x = event.clientX - bounds.left;
      this.mouse.y = event.clientY - bounds.top;
      this.mouse.inside = true;
      if (this.currentScreen === "title") {
        this.refreshTitleHover();
      } else if (this.currentScreen === "two_player_menu") {
        this.refreshTwoPlayerHover();
      } else if (this.currentScreen === "level_select") {
        this.refreshLevelSelectHover();
      } else if (this.currentScreen === "customization") {
        this.refreshCustomizationHover();
      } else if (this.currentScreen === "game") {
        this.refreshGameHover();
      }
    }

    onCanvasPointerLeave() {
      this.mouse.inside = false;
      this.hoveredTitleButton = null;
      this.hoveredTwoPlayerButton = null;
      this.hoveredGameButton = null;
      this.hoveredLevelCard = null;
      this.hoveredLevelSelectButton = null;
      this.hoveredCustomizationButton = null;
      this.canvas.style.cursor = "default";
    }

    refreshTitleHover() {
      if (this.currentScreen !== "title" || !this.mouse.inside) {
        this.hoveredTitleButton = null;
        this.canvas.style.cursor = "default";
        return;
      }

      const hovered = this.getTitleButtons().find(
        (button) =>
          button.enabled !== false &&
          this.mouse.x >= button.x &&
          this.mouse.x <= button.x + button.w &&
          this.mouse.y >= button.y &&
          this.mouse.y <= button.y + button.h
      );
      this.hoveredTitleButton = hovered ? hovered.id : null;
      this.canvas.style.cursor = hovered ? "pointer" : "default";
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
      const hoveredSpeedrun = speedrunButton.enabled &&
        this.mouse.x >= speedrunButton.x &&
        this.mouse.x <= speedrunButton.x + speedrunButton.w &&
        this.mouse.y >= speedrunButton.y &&
        this.mouse.y <= speedrunButton.y + speedrunButton.h;

      this.hoveredLevelSelectButton = hoveredBack ? backButton.id : hoveredSpeedrun ? speedrunButton.id : null;
      this.hoveredLevelCard = hoveredCard ? hoveredCard.index : null;
      this.canvas.style.cursor = hoveredBack || hoveredCard || hoveredSpeedrun ? "pointer" : "default";
    }

    refreshGameHover() {
      if (this.currentScreen !== "game" || !this.mouse.inside) {
        this.hoveredGameButton = null;
        this.hoveredCompletionButton = null;
        this.hoveredHomeConfirmButton = null;
        this.canvas.style.cursor = "default";
        return;
      }

      if (this.gameMode !== "tag" && this.homeConfirmOpen) {
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
        this.canvas.style.cursor = hoveredCompletion ? "pointer" : "default";
        return;
      }

      const button = this.getGameExitButton();
      const hovered =
        this.mouse.x >= button.x &&
        this.mouse.x <= button.x + button.w &&
        this.mouse.y >= button.y &&
        this.mouse.y <= button.y + button.h;
      this.hoveredGameButton = hovered ? button.id : null;
      this.canvas.style.cursor = hovered ? "pointer" : "default";
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
      this.hoveredCustomizationButton = hoveredButton ? hoveredButton.id : null;
      this.canvas.style.cursor = hoveredButton ? "pointer" : "default";
    }

    handleCanvasClick(event) {
      if (this.screenWipePhase !== "idle") {
        return;
      }
      this.onCanvasPointerMove(event);
      if (this.currentScreen === "title") {
        if (this.hoveredTitleButton === "play") {
          this.openLevelSelect();
        } else if (this.hoveredTitleButton === "two_player" || this.hoveredTitleButton === "tag") {
          this.openTwoPlayerMenu();
        } else if (this.hoveredTitleButton === "customization") {
          this.openCustomization();
        }
        return;
      }
      if (this.currentScreen === "two_player_menu") {
        if (this.hoveredTwoPlayerButton === "tag_mode") {
          this.startTagGame();
        } else if (this.hoveredTwoPlayerButton === "battle_mode") {
          this.showTwoPlayerNotice("Battle mode coming soon");
        } else if (this.hoveredTwoPlayerButton === "back") {
          this.returnToTitle();
        }
        return;
      }
      if (this.currentScreen === "level_select") {
        if (this.hoveredLevelSelectButton === "back") {
          this.returnToTitle();
          return;
        }
        if (this.hoveredLevelSelectButton === "speedrun") {
          this.startSpeedrun();
          return;
        }
        if (this.hoveredLevelCard !== null) {
          this.startGame(this.hoveredLevelCard);
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
        if (this.gameMode !== "tag" && this.homeConfirmOpen) {
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
            this.returnToTitle();
          } else if (this.hoveredCompletionButton === "replay") {
            this.resetLevel();
          } else if (this.hoveredCompletionButton === "next") {
            this.nextLevel();
          }
          return;
        }
        if (this.hoveredGameButton === "menu") {
          this.openHomeConfirm();
        }
      }
    }

    openLevelSelect() {
      this.beginScreenWipe(() => {
        this.currentScreen = "level_select";
        this.hoveredTitleButton = null;
        this.hoveredLevelCard = null;
        this.hoveredLevelSelectButton = null;
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
        this.refreshTwoPlayerHover();
      });
    }

    startGame(levelIndex = this.levelIndex) {
      this.beginScreenWipe(() => {
        this.currentScreen = "game";
        this.gameMode = "campaign";
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
        this.levelSelectBackHover = 0;
        this.canvas.style.cursor = "default";
        this.totalTimer = 0;
        this.totalDamage = 0;
        this.speedrunTimerStarted = false;
        this.homeConfirmOpen = false;
        this.loadLevel(levelIndex);
      });
    }

    startSpeedrun() {
      this.beginScreenWipe(() => {
        this.currentScreen = "game";
        this.gameMode = "speedrun";
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
        this.levelSelectBackHover = 0;
        this.canvas.style.cursor = "default";
        this.totalTimer = 0;
        this.totalDamage = 0;
        this.resetSpeedrunStats();
        this.speedrunTimerStarted = false;
        this.homeConfirmOpen = false;
        this.loadLevel(0);
      });
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
        this.levelSelectBackHover = 0;
        this.canvas.style.cursor = "default";
        this.totalTimer = 0;
        this.totalDamage = 0;
        this.twoPlayerNotice = "";
        this.twoPlayerNoticeTimer = 0;
        this.loadTagLevel(Math.floor(Math.random() * TAG_LEVELS.length));
      });
    }

    returnToTitle() {
      this.beginScreenWipe(() => {
        this.currentScreen = "title";
        this.gameMode = "campaign";
        this.hoveredTwoPlayerButton = null;
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
        this.levelSelectBackHover = 0;
        this.customizationDoneHover = 0;
        this.customizationBackHover = 0;
        this.customizationPrevHover = 0;
        this.customizationNextHover = 0;
        this.completed = false;
        this.levelCompletionSummary = null;
        this.speedrunTimerStarted = false;
        this.homeConfirmOpen = false;
        this.tagMatchFinished = false;
        this.tagWinnerText = "";
        this.tagTransferCooldown = 0;
        this.twoPlayerNotice = "";
        this.twoPlayerNoticeTimer = 0;
        this.titleTrail.length = 0;
        this.titleTrailTimer = 0;
        this.titleBackdropPhase = Math.random() * Math.PI * 2;
        this.titleDrifter = this.createTitleDrifter();
        this.updateCustomizationPickerVisibility();
        this.refreshTitleHover();
      });
    }

    openHomeConfirm() {
      this.homeConfirmOpen = true;
      this.hoveredGameButton = null;
      this.hoveredCompletionButton = null;
      this.hoveredHomeConfirmButton = null;
      this.refreshGameHover();
    }

    closeHomeConfirm() {
      this.homeConfirmOpen = false;
      this.hoveredHomeConfirmButton = null;
      this.homeConfirmCancelHover = 0;
      this.homeConfirmLeaveHover = 0;
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
      this.levelTimerStarted = false;
      this.levelTouchedWallThisRun = false;
      this.goalTriggered = false;
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
      this.resetWorldState();
      this.car.reset(this.level.start.x, this.level.start.y, this.level.startAngle);
      this.camera.snap(this.level.start.x, this.level.start.y);
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
      } else {
        this.totalDamage = 0;
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

        if (isValidHexColor(parsed.playerCarColor)) {
          this.playerCarColor = parsed.playerCarColor;
        }

        if (typeof parsed.playerCarVariant === "string" && CAR_VARIANTS.some((variant) => variant.id === parsed.playerCarVariant)) {
          this.playerCarVariant = parsed.playerCarVariant;
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
            playerCarColor: this.playerCarColor,
            playerCarVariant: this.playerCarVariant,
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

    getGoalExplosionProgress() {
      if (!this.goalTriggered || GOAL_ADVANCE_DELAY <= 0) {
        return 0;
      }
      return clamp(1 - this.goalTimer / GOAL_ADVANCE_DELAY, 0, 1);
    }

    getWorldRenderScale() {
      if (this.gameMode === "tag") {
        return 1;
      }
      return lerp(1, GOAL_EXPLOSION_ZOOM, easeInOutCubic(this.getGoalExplosionProgress()));
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

    spawnGoalExplosionBurst(originX, originY) {
      for (let index = 0; index < 44; index += 1) {
        const angle = (index / 44) * Math.PI * 2 + Math.random() * 0.28;
        const speed = 180 + Math.random() * 360;
        const life = 0.28 + Math.random() * 0.36;
        this.explosionParticles.push({
          x: originX + Math.cos(angle) * (8 + Math.random() * 14),
          y: originY + Math.sin(angle) * (8 + Math.random() * 14),
          vx: Math.cos(angle) * speed + this.car.vx * 0.08,
          vy: Math.sin(angle) * speed + this.car.vy * 0.08,
          size: 10 + Math.random() * 16,
          growth: 18 + Math.random() * 26,
          life,
          maxLife: life,
          maxAlpha: 0.55 + Math.random() * 0.3,
          alpha: 0,
          palette: index % 3,
        });
      }
    }

    spawnFinishDebris(originX, originY) {
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
            vx: directionX * (260 + burstStrength * 320 + Math.random() * 130) - directionY * tangentSpeed + this.car.vx * 0.04,
            vy: directionY * (260 + burstStrength * 320 + Math.random() * 130) + directionX * tangentSpeed + this.car.vy * 0.04,
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

    advanceAfterGoalHit() {
      if (this.gameMode === "speedrun" && this.levelIndex < LEVELS.length - 1) {
        const perfectRun = !this.levelTouchedWallThisRun;
        this.recordLevelBestTime(this.levelIndex, this.levelTimer, perfectRun);
        this.nextLevel();
      } else {
        this.finishCurrentLevel();
      }
    }

    finishCurrentLevel() {
      const perfectRun = !this.levelTouchedWallThisRun;
      const previousBest = this.levelBestTimes[this.levelIndex];
      const newRecord = previousBest == null || this.levelTimer < previousBest;
      this.recordLevelBestTime(this.levelIndex, this.levelTimer, perfectRun);
      const speedrunPerfect = this.gameMode === "speedrun" ? !this.speedrunTouchedWall : false;
      this.levelCompletionSummary = {
        title: this.gameMode === "speedrun" ? "Speedrun Complete!" : "Level Complete!",
        levelTime: this.gameMode === "speedrun" ? this.totalTimer : this.levelTimer,
        perfectRun: this.gameMode === "speedrun" ? speedrunPerfect : perfectRun,
        newRecord: this.gameMode === "speedrun" ? false : newRecord,
        recordToBeat: this.gameMode === "speedrun" ? null : previousBest,
        finalLevel: this.levelIndex >= LEVELS.length - 1,
        speedrun: this.gameMode === "speedrun",
        deaths: this.gameMode === "speedrun" ? this.getSpeedrunDeathCount() : 0,
      };
      this.completionSceneTimer = 0;
      this.completed = true;
      this.goalTimer = 0;
      this.refreshGameHover();
    }

    nextLevel() {
      this.beginScreenWipe(() => {
        if (this.levelIndex < LEVELS.length - 1) {
          this.loadLevel(this.levelIndex + 1);
        } else {
          this.speedrunTimerStarted = false;
          this.totalTimer = 0;
          this.totalDamage = 0;
          if (this.gameMode === "speedrun") {
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

      this.updateCampaignGame(dt);
    }

    updateCampaignGame(dt) {
      this.refreshGameHover();
      this.gameExitHover = approachExp(this.gameExitHover, this.hoveredGameButton === "menu" ? 1 : 0, 16, dt);
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
          this.nextLevel();
        } else if (this.input.wasPressed("Escape")) {
          this.returnToTitle();
        }
        return;
      }

      const speed = Math.hypot(this.car.vx, this.car.vy);
      if (this.gameMode === "speedrun") {
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
      const telemetry = this.car.updateControls(this.input, dt, !throttleLocked, surface);
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

      const canManualRestart = !this.tagMatchFinished && this.tagCars.every((player) => player.fireSequenceTimer <= 0 && !player.exploding);
      if (canManualRestart && this.input.wasPressed("KeyR")) {
        this.resetLevel();
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
        const throttleLocked = player.fireSequenceTimer > 0 || player.exploding;
        const surface = this.getSurfacePhysics(player.car.x, player.car.y);
        const telemetry = player.car.updateControlState(controlState, dt, !throttleLocked, surface);
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

    updateTitleScreen(dt) {
      this.updateMenuBackdrop(dt);
      this.refreshTitleHover();
      const buttons = this.getTitleButtons();
      for (let index = 0; index < this.titleButtons.length; index += 1) {
        const button = this.titleButtons[index];
        const derived = buttons[index];
        const targetHover = derived && derived.enabled !== false && button.id === this.hoveredTitleButton ? 1 : 0;
        button.hover = approachExp(button.hover, targetHover, 15, dt);
      }
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

    updateLevelSelectScreen(dt) {
      this.updateMenuBackdrop(dt);
      this.refreshLevelSelectHover();
      this.levelSelectBackHover = approachExp(this.levelSelectBackHover, this.hoveredLevelSelectButton === "back" ? 1 : 0, 15, dt);
      this.levelSelectSpeedrunHover = approachExp(this.levelSelectSpeedrunHover, this.hoveredLevelSelectButton === "speedrun" ? 1 : 0, 15, dt);
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

    updateMenuBackdrop(dt) {
      const drifter = this.titleDrifter;
      drifter.decisionTimer -= dt;
      const centerX = this.width * 0.5;
      const centerY = this.height * 0.58;
      const angleToCenter = Math.atan2(centerY - drifter.y, centerX - drifter.x);
      const centerDelta = Math.atan2(Math.sin(angleToCenter - drifter.angle), Math.cos(angleToCenter - drifter.angle));
      const edgeFactor = clamp(
        Math.max(
          Math.abs(drifter.x - centerX) / Math.max(1, this.width * 0.34),
          Math.abs(drifter.y - centerY) / Math.max(1, this.height * 0.3)
        ),
        0,
        1
      );

      if (drifter.decisionTimer <= 0) {
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
      if (this.currentScreen !== "customization") {
        this.colorInput.style.display = "none";
        return;
      }

      const pickerX = this.width * 0.5 - 60;
      const pickerY = this.height * 0.66;
      this.colorInput.style.display = "block";
      this.colorInput.style.left = `${pickerX}px`;
      this.colorInput.style.top = `${pickerY}px`;
      this.colorInput.value = this.customizationDraftColor;
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

        if (!owner) {
          const goalPenetration = this.getGoalPenetration(car);
          if (goalPenetration) {
            this.triggerGoalHit(goalPenetration);
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
      if (freshImpact && touchState === this && this.gameMode === "speedrun") {
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

    getDamageStatus(owner = null) {
      const state = owner || this;
      if (state.exploding) {
        return "Exploded";
      }
      if (state.fireSequenceTimer > 0) {
        return "Critical";
      }
      if (state.totalDamage >= FIRE_DAMAGE_START) {
        return "On Fire";
      }
      if (state.totalDamage >= SMOKE_DAMAGE_START) {
        return "Smoking";
      }
      return "Stable";
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
        this.levelTimerStarted = this.gameMode === "speedrun" && this.speedrunTimerStarted;
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
      this.levelTimerStarted = this.gameMode === "speedrun" && this.speedrunTimerStarted;
      this.shakeStrength = 0;
      this.shakeTime = 0;
      if (this.gameMode === "speedrun") {
        this.death_counter = this.getSpeedrunDeathCount() + 1;
      }
      this.car.reset(this.level.start.x, this.level.start.y, this.level.startAngle);
      this.camera.snap(this.level.start.x, this.level.start.y);
    }

    respawnTagPlayer(player) {
      this.resetTagPlayerState(player);
      player.car.reset(player.spawnX, player.spawnY, player.spawnAngle);
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
      if (this.gameMode === "tag") {
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

    isRevealed(worldX, worldY, carState) {
      return true;
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

    getHeadlightWallGlowMap(carState, isTagMode) {
      const glowMap = new Map();
      const spread = 0.36;
      const range = 520;
      const rayCount = 20;
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
      const rayCount = 20;
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
      } else if (this.currentScreen === "level_select") {
        this.renderLevelSelectScreen(this.ctx, now);
      } else if (this.currentScreen === "customization") {
        this.renderCustomizationScreen(this.ctx, now);
      } else {
        const renderCamera = this.camera.interpolated(alpha);
        const carState = this.gameMode === "tag"
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

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#edf7ff";
      ctx.font = "700 72px Consolas, monospace";
      ctx.fillText("Drifty", this.width * 0.5, this.height * 0.2);
      ctx.fillStyle = "rgba(178, 213, 240, 0.88)";
      ctx.font = "18px Consolas, monospace";
      ctx.fillText("Slide into the dark and try not to cook the engine", this.width * 0.5, this.height * 0.25);
      ctx.restore();

      this.renderTitleButtons(ctx);
    }

    renderTwoPlayerMenuScreen(ctx, now) {
      this.renderMenuBackdrop(ctx, now);

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#edf7ff";
      ctx.font = "700 60px Consolas, monospace";
      ctx.fillText("2 Player", this.width * 0.5, this.height * 0.2);
      ctx.fillStyle = "rgba(178, 213, 240, 0.88)";
      ctx.font = "18px Consolas, monospace";
      ctx.fillText("Pick a versus mode. Tag is ready now.", this.width * 0.5, this.height * 0.25);
      if (this.twoPlayerNotice) {
        ctx.fillStyle = "#ffd166";
        ctx.font = "700 18px Consolas, monospace";
        ctx.fillText(this.twoPlayerNotice, this.width * 0.5, this.height * 0.325);
      }
      ctx.restore();

      this.renderTwoPlayerButtons(ctx);
    }

    renderLevelSelectScreen(ctx, now) {
      this.renderMenuBackdrop(ctx, now);

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#edf7ff";
      ctx.font = "700 56px Consolas, monospace";
      ctx.fillText("Level Select", this.width * 0.5, this.height * 0.2);
      ctx.fillStyle = "rgba(178, 213, 240, 0.88)";
      ctx.font = "18px Consolas, monospace";
      ctx.fillText("Unlocked tracks glow. Locked tracks stay in the dark.", this.width * 0.5, this.height * 0.255);
      ctx.restore();

      this.renderLevelSelectBackButton(ctx);
      this.renderLevelSelectCards(ctx);
      this.renderLevelSelectSpeedrunButton(ctx);
    }

    renderCustomizationScreen(ctx, now) {
      this.renderMenuBackdrop(ctx, now);

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#edf7ff";
      ctx.font = "700 54px Consolas, monospace";
      ctx.fillText("Customization", this.width * 0.5, this.height * 0.18);
      ctx.fillStyle = "rgba(178, 213, 240, 0.88)";
      ctx.font = "18px Consolas, monospace";
      ctx.fillText("Pick a car body and paint color for your ride.", this.width * 0.5, this.height * 0.235);
      ctx.fillText("Use Done to save it, or Back to cancel.", this.width * 0.5, this.height * 0.265);
      ctx.restore();

      ctx.save();
      ctx.translate(this.width * 0.5, this.height * 0.49);
      ctx.scale(6.0, 6.0);
      ctx.shadowColor = mixHexColors(this.customizationDraftColor, "#aee9ff", 0.4);
      ctx.shadowBlur = 36;
      this.drawCarShape(ctx, this.getPlayerCarPalette(this.customizationDraftColor), this.customizationDraftVariant);
      ctx.restore();

      this.renderCustomizationArrows(ctx);

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#cfe9f6";
      ctx.font = "700 20px Consolas, monospace";
      ctx.fillText(this.getCurrentCustomizationVariant().name, this.width * 0.5, this.height * 0.62);
      ctx.font = "16px Consolas, monospace";
      ctx.fillText("Use the arrows to swap cars", this.width * 0.5, this.height * 0.648);
      ctx.fillText("Color Picker", this.width * 0.5, this.height * 0.69);
      ctx.restore();

      this.renderCustomizationButtons(ctx);
    }

    renderMenuBackdrop(ctx, now) {
      const background = ctx.createLinearGradient(0, 0, this.width, this.height);
      background.addColorStop(0, "#05111f");
      background.addColorStop(0.52, "#091726");
      background.addColorStop(1, "#02060d");
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = "rgba(129, 182, 223, 0.22)";
      ctx.lineWidth = 1;
      const gridOffset = (now * 34) % 70;
      for (let x = -70; x < this.width + 70; x += 70) {
        ctx.beginPath();
        ctx.moveTo(x + gridOffset, 0);
        ctx.lineTo(x - 140 + gridOffset, this.height);
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.fillStyle = "rgba(9, 18, 28, 0.72)";
      ctx.fillRect(0, this.height * 0.7, this.width, this.height * 0.3);
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
      vignette.addColorStop(1, "rgba(0, 0, 0, 0.58)");
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

        for (let y = 0; y < this.level.height; y += 1) {
          for (let x = 0; x < this.level.width; x += 1) {
            const screen = this.worldToScreen(x * TILE_SIZE, y * TILE_SIZE, camera);
            if (screen.x > this.width || screen.y > this.height || screen.x + TILE_SIZE < 0 || screen.y + TILE_SIZE < 0) {
              continue;
            }

            const tile = this.level.getTile(x, y);
            const isIce = tile === "I";
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
          }
        }

        if (isTagMode) {
          for (const entry of carState) {
            this.renderSkidMarks(ctx, camera, entry.player.skidMarks);
          }
        } else {
          this.renderGoalAndStart(ctx, camera, carState, goalPulse);
          this.renderSkidMarks(ctx, camera);
        }

        if (!this.goalTriggered) {
          if (isTagMode) {
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

        const headlightWallGlow = this.goalTriggered ? new Map() : this.getHeadlightWallGlowMap(carState, isTagMode);

        for (const tile of this.level.wallTiles) {
          const worldX = tile.x * TILE_SIZE;
          const worldY = tile.y * TILE_SIZE;
          const screen = this.worldToScreen(worldX, worldY, camera);
          const flashIntensity = this.getWallFlashIntensity(tile.x, tile.y);
          const headlightGlow = headlightWallGlow.get(`${tile.x},${tile.y}`);
          const isBumperWall = tile.type === "bumper";
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
        }

        for (const tile of this.level.hazardTiles) {
          const worldX = tile.x * TILE_SIZE;
          const worldY = tile.y * TILE_SIZE;
          const screen = this.worldToScreen(worldX, worldY, camera);
          const headlightGlow = headlightWallGlow.get(`${tile.x},${tile.y}`);
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
        }

        ctx.restore();
      }

      if (this.finishDebris.length > 0) {
        this.renderFinishDebris(ctx, camera);
      }

      if (isTagMode) {
        for (const entry of carState) {
          this.renderTagCarEffects(ctx, camera, entry);
        }
        return;
      }

      if (!this.exploding) {
        this.renderCar(ctx, camera, carState);
        this.renderDamageSmoke(ctx, camera);
        this.renderCarSmokeOverlay(ctx, camera, carState);
        this.renderDamageFire(ctx, camera);
      }
      this.renderExplosion(ctx, camera);
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

    renderGoalAndStart(ctx, camera, carState, goalPulse) {
      const start = this.level.start;
      const goal = this.level.goal;
      const startScreen = this.worldToScreen(start.x - TILE_SIZE * 0.35, start.y - TILE_SIZE * 0.35, camera);
      const goalScreen = this.worldToScreen(goal.x, goal.y, camera);
      const goalCenterX = goalScreen.x + goal.w * 0.5;
      const goalCenterY = goalScreen.y + goal.h * 0.5;
      const blastProgress = this.getGoalExplosionProgress();
      const carDistanceToGoal = Math.hypot(carState.x - (goal.x + goal.w * 0.5), carState.y - (goal.y + goal.h * 0.5));
      const proximityGlow = clamp(
        1 - (carDistanceToGoal - GOAL_GLOW_FULL_DISTANCE) / Math.max(1, GOAL_GLOW_START_DISTANCE - GOAL_GLOW_FULL_DISTANCE),
        0,
        1
      );
      const goalGlow = Math.max(blastProgress, proximityGlow * (0.32 + goalPulse * 0.34));

      ctx.fillStyle = "#2fab88";
      ctx.fillRect(startScreen.x, startScreen.y, TILE_SIZE * 0.7, TILE_SIZE * 0.7);
      ctx.strokeStyle = "rgba(220,255,235,0.76)";
      ctx.lineWidth = 2;
      ctx.strokeRect(startScreen.x + 4, startScreen.y + 4, TILE_SIZE * 0.7 - 8, TILE_SIZE * 0.7 - 8);

      if (goalGlow > 0.001) {
        const glowRadius = lerp(goal.w * 0.6, goal.w * 3.1, goalGlow);
        const glowGradient = ctx.createRadialGradient(
          goalCenterX,
          goalCenterY,
          goal.w * 0.15,
          goalCenterX,
          goalCenterY,
          glowRadius
        );
        glowGradient.addColorStop(0, `rgba(255, 248, 225, ${0.18 + goalGlow * 0.62})`);
        glowGradient.addColorStop(0.45, `rgba(255, 228, 150, ${0.12 + goalGlow * 0.38})`);
        glowGradient.addColorStop(1, "rgba(255, 215, 120, 0)");
        ctx.save();
        ctx.fillStyle = glowGradient;
        ctx.fillRect(goalCenterX - glowRadius, goalCenterY - glowRadius, glowRadius * 2, glowRadius * 2);
        ctx.restore();
      }

      if (blastProgress > 0.001) {
        const flareRadius = lerp(goal.w * 0.7, goal.w * 3.8, easeInOutCubic(blastProgress));
        const flare = ctx.createRadialGradient(goalCenterX, goalCenterY, goal.w * 0.18, goalCenterX, goalCenterY, flareRadius);
        flare.addColorStop(0, `rgba(255, 249, 229, ${0.72 - blastProgress * 0.25})`);
        flare.addColorStop(0.4, `rgba(255, 213, 124, ${0.34 - blastProgress * 0.14})`);
        flare.addColorStop(1, "rgba(255, 176, 82, 0)");
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = flare;
        ctx.fillRect(goalCenterX - flareRadius, goalCenterY - flareRadius, flareRadius * 2, flareRadius * 2);
        ctx.restore();
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
    }

    renderSkidMarks(ctx, camera, skidMarks = this.skidMarks) {
      ctx.save();
      ctx.lineCap = "round";
      for (const mark of skidMarks) {
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
        ctx.fillStyle = colors[particle.palette];
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

    renderTwoPlayerButtons(ctx) {
      this.renderMenuButtons(ctx, this.getTwoPlayerButtons());
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
        ctx.roundRect(-button.w * 0.5, -button.h * 0.5, button.w, button.h, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = `rgba(180, 235, 255, ${glowAlpha})`;
        ctx.beginPath();
        ctx.roundRect(-button.w * 0.5 + 6, -button.h * 0.5 + 6, button.w - 12, button.h * 0.34, 10);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = enabled ? (button.hover > 0.01 ? "#f4fdff" : "#d6eaf3") : "#7e8a94";
        ctx.font = "700 24px Consolas, monospace";
        ctx.fillText(button.label, 0, 8);
        ctx.restore();
      }
      ctx.restore();
    }

    renderLevelSelectBackButton(ctx) {
      const button = this.getLevelSelectBackButton();
      ctx.save();
      ctx.translate(button.x + button.w * 0.5, button.y + button.h * 0.5);
      ctx.scale(1 + this.levelSelectBackHover * 0.06, 1 + this.levelSelectBackHover * 0.06);
      ctx.shadowColor = `rgba(128, 214, 255, ${0.18 + this.levelSelectBackHover * 0.32})`;
      ctx.shadowBlur = 8 + this.levelSelectBackHover * 18;
      const fill = ctx.createLinearGradient(-button.w * 0.5, -button.h * 0.5, button.w * 0.5, button.h * 0.5);
      fill.addColorStop(0, "rgba(10, 33, 49, 0.92)");
      fill.addColorStop(1, "rgba(16, 57, 78, 0.9)");
      ctx.fillStyle = fill;
      ctx.strokeStyle = `rgba(152, 223, 255, ${0.28 + this.levelSelectBackHover * 0.48})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-button.w * 0.5, -button.h * 0.5, button.w, button.h, 12);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = this.levelSelectBackHover > 0.01 ? "#f4fdff" : "#d6eaf3";
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
        ctx.strokeStyle = hexToRgba(group.themeColor, 0.26);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-groupLineOuter, groupLineY);
        ctx.lineTo(-groupLineInner, groupLineY);
        ctx.moveTo(groupLineInner, groupLineY);
        ctx.lineTo(groupLineOuter, groupLineY);
        ctx.stroke();
        ctx.fillStyle = mixHexColors(group.themeColor, "#f7fbff", 0.58);
        ctx.font = `700 ${groupTitleFontSize}px Consolas, monospace`;
        ctx.fillText(group.title, 0, groupTitleY);
        ctx.fillStyle = mixHexColors(group.themeColor, "#d6edf8", 0.5);
        ctx.font = `${groupSubtitleFontSize}px Consolas, monospace`;
        ctx.fillText(fitTextToWidth(ctx, `${group.rangeLabel} - ${group.subtitle}`, this.width * 0.72), 0, groupSubtitleY);
        ctx.restore();
      }

      for (const card of groups.flatMap((group) => group.cards)) {
        const hover = this.levelCardHovers[card.index] || 0;
        const scale = 1 + hover * 0.05 + (card.isCurrent ? 0.04 : 0);
        const centerX = card.x + card.w * 0.5;
        const centerY = card.y + card.h * 0.5;
        const fillTop = card.unlocked ? (card.isCurrent ? "rgba(25, 76, 104, 0.95)" : "rgba(16, 48, 67, 0.92)") : "rgba(10, 13, 18, 0.95)";
        const fillBottom = card.unlocked ? (card.isCurrent ? "rgba(10, 36, 52, 0.97)" : "rgba(10, 25, 37, 0.95)") : "rgba(5, 8, 11, 0.96)";
        const border = card.unlocked
          ? card.isCurrent
            ? hexToRgba(card.themeColor, 0.74 + hover * 0.18)
            : hexToRgba(card.themeColor, 0.34 + hover * 0.22)
          : "rgba(52, 60, 68, 0.65)";
        const titleColor = card.unlocked
          ? card.isCurrent
            ? mixHexColors(card.themeColor, "#ffffff", 0.72)
            : mixHexColors(card.themeColor, "#dcecf6", 0.7)
          : "#55606b";
        const subColor = card.unlocked ? (card.isCurrent ? "#c5ebff" : "#96c6de") : "#48525c";

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.shadowColor = card.unlocked
          ? card.isCurrent
            ? hexToRgba(card.themeColor, 0.36)
            : hexToRgba(card.themeColor, 0.16 + hover * 0.16)
          : "rgba(0, 0, 0, 0.2)";
        ctx.shadowBlur = card.unlocked ? (card.isCurrent ? 28 : 12 + hover * 12) : 0;

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
          ? hexToRgba(card.themeColor, card.isCurrent ? 0.18 : 0.1 + hover * 0.08)
          : "rgba(32, 38, 43, 0.45)";
        ctx.beginPath();
        ctx.roundRect(-card.w * 0.5 + 8, -card.h * 0.5 + 8, card.w - 16, cardAccentHeight, 12);
        ctx.fill();

        ctx.fillStyle = titleColor;
        ctx.font = `700 ${cardNumberFontSize}px Consolas, monospace`;
        ctx.fillText(`LEVEL ${card.index + 1}`, 0, Math.round(scale));

        const bestTimeColor = !card.unlocked
          ? "#404851"
          : card.cleanFinish
            ? (card.isCurrent ? "#ffe7a4" : "#ffd76a")
            : (card.isCurrent ? "#fff0b8" : "#bdd8e7");
        ctx.fillStyle = bestTimeColor;
        ctx.shadowColor = card.cleanFinish
          ? card.isCurrent
            ? "rgba(255, 214, 106, 0.78)"
            : `rgba(255, 215, 106, ${0.42 + hover * 0.2})`
          : "transparent";
        ctx.shadowBlur = card.cleanFinish ? (card.isCurrent ? 20 : 10 + hover * 10) : 0;
        ctx.font = `${cardBestFontSize}px Consolas, monospace`;
        ctx.fillText(`Best ${formatBestTime(card.bestTime)}`, 0, cardBestY);
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
        ctx.font = "700 22px Consolas, monospace";
        ctx.fillText(button.label, 0, 8);
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
        ctx.beginPath();
        ctx.moveTo(direction < 0 ? 10 : -10, -16);
        ctx.lineTo(direction < 0 ? -12 : 12, 0);
        ctx.lineTo(direction < 0 ? 10 : -10, 16);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    renderTagUI(ctx) {
      const panelX = 24;
      const panelY = 70;
      const panelW = Math.min(520, this.width - 48);
      const panelH = 226;
      const redPlayer = this.getTagPlayer("red");
      const bluePlayer = this.getTagPlayer("blue");
      const itPlayer = this.tagCars.find((player) => player.isIt);
      const remaining = Math.max(0, TAG_MATCH_DURATION - this.tagElapsed);
      const rightColX = panelX + Math.min(260, panelW * 0.5);

      ctx.fillStyle = "rgba(3, 8, 14, 0.74)";
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.strokeStyle = "rgba(126, 162, 186, 0.38)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(panelX, panelY, panelW, panelH);

      ctx.textAlign = "left";
      ctx.fillStyle = "#dceaf3";
      ctx.font = "600 24px Consolas, monospace";
      ctx.fillText("2P Tag", panelX + 20, panelY + 32);

      ctx.fillStyle = "#84b6d3";
      ctx.font = "16px Consolas, monospace";
      ctx.fillText(this.level.name, panelX + 20, panelY + 56);

      ctx.fillStyle = "#f0f7fb";
      ctx.font = "18px Consolas, monospace";
      ctx.fillText(`Time Left    ${formatTime(remaining)}`, panelX + 20, panelY + 88);
      ctx.fillStyle = redPlayer.isIt ? "#ffe3e3" : "#ffd0d0";
      ctx.fillText(`Red Tagged   ${formatTime(redPlayer.taggedTime)}`, panelX + 20, panelY + 116);
      ctx.fillStyle = bluePlayer.isIt ? "#dde9ff" : "#cfe0ff";
      ctx.fillText(`Blue Tagged  ${formatTime(bluePlayer.taggedTime)}`, panelX + 20, panelY + 144);

      ctx.fillStyle = "#f0f7fb";
      ctx.fillText(`It Right Now ${itPlayer ? itPlayer.label : "-"}`, panelX + 20, panelY + 172);
      if (this.tagTransferCooldown > 0) {
        ctx.fillStyle = "#ffd166";
        ctx.fillText(`Swap Cooldown ${this.tagTransferCooldown.toFixed(1)}s`, panelX + 20, panelY + 200);
      }

      ctx.fillStyle = "#ffd0d0";
      ctx.fillText(`Red Damage   ${Math.round(redPlayer.totalDamage)}`, rightColX, panelY + 88);
      ctx.fillStyle = redPlayer.totalDamage >= FIRE_DAMAGE_START ? "#ff9f8b" : redPlayer.totalDamage >= SMOKE_DAMAGE_START ? "#ffd6d6" : "#ffbcbc";
      ctx.fillText(`Red Status   ${this.getDamageStatus(redPlayer)}`, rightColX, panelY + 116);
      ctx.fillStyle = "#cfe0ff";
      ctx.fillText(`Blue Damage  ${Math.round(bluePlayer.totalDamage)}`, rightColX, panelY + 144);
      ctx.fillStyle = bluePlayer.totalDamage >= FIRE_DAMAGE_START ? "#ffb58a" : bluePlayer.totalDamage >= SMOKE_DAMAGE_START ? "#dde8ff" : "#b8d0ff";
      ctx.fillText(`Blue Status  ${this.getDamageStatus(bluePlayer)}`, rightColX, panelY + 172);

      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(235, 245, 250, 0.9)";
      ctx.fillText("Red: WASD   Blue: Arrows   R restart   Space rematch", this.width - 30, this.height - 30);
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
      ctx.fillText(`Red tagged ${formatTime(redPlayer.taggedTime)}`, 0, 14);
      ctx.fillText(`Blue tagged ${formatTime(bluePlayer.taggedTime)}`, 0, 44);
      ctx.fillText("Lower tagged time wins", 0, 72);
      ctx.fillText("Press Space for another random map", 0, 100);
      ctx.restore();
    }

    renderCampaignCompletionOverlay(ctx) {
      if (!this.levelCompletionSummary) {
        return;
      }

      const summary = this.levelCompletionSummary;
      let statusText = "";
      let encouragementText = "";
      if (summary.speedrun) {
        statusText = summary.perfectRun ? "perfect speedrun!" : "";
      } else {
        statusText = summary.perfectRun && summary.newRecord
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
      ctx.translate(this.width * 0.5, this.height * 0.5);
      ctx.fillStyle = "rgba(4, 8, 14, 0.78)";
      ctx.beginPath();
      ctx.roundRect(-260, -150, 520, 300, 24);
      ctx.fill();
      ctx.strokeStyle = "rgba(146, 208, 236, 0.48)";
      ctx.lineWidth = 2;
      ctx.stroke();

      const topGlow = ctx.createLinearGradient(0, -150, 0, -54);
      topGlow.addColorStop(0, "rgba(101, 194, 230, 0.2)");
      topGlow.addColorStop(1, "rgba(101, 194, 230, 0)");
      ctx.fillStyle = topGlow;
      ctx.beginPath();
      ctx.roundRect(-248, -138, 496, 82, 18);
      ctx.fill();

      ctx.textAlign = "center";
      ctx.fillStyle = "#f2fbff";
      ctx.font = "700 34px Consolas, monospace";
      ctx.fillText(summary.title || "Level Complete!", 0, -92);

      ctx.fillStyle = "#90c9de";
      ctx.font = "18px Consolas, monospace";
      ctx.fillText(summary.speedrun ? "Full run summary" : this.level.name, 0, -58);

      ctx.fillStyle = summary.perfectRun ? "#ffd76a" : "#f3f8fc";
      ctx.shadowColor = summary.perfectRun ? "rgba(255, 210, 92, 0.7)" : "transparent";
      ctx.shadowBlur = summary.perfectRun ? 20 : 0;
      ctx.font = "700 42px Consolas, monospace";
      ctx.fillText(formatTime(summary.levelTime), 0, -2);
      ctx.shadowBlur = 0;

      if (statusText) {
        ctx.fillStyle = summary.perfectRun ? "#ffeab2" : "#96d7f2";
        ctx.font = "18px Consolas, monospace";
        ctx.fillText(statusText, 0, 34);
      } else if (encouragementText) {
        ctx.fillStyle = "#96d7f2";
        ctx.font = "16px Consolas, monospace";
        ctx.fillText(encouragementText, 0, 34);
      }

      if (summary.speedrun) {
        ctx.fillStyle = "#96d7f2";
        ctx.font = "16px Consolas, monospace";
        ctx.fillText(`Deaths: ${summary.deaths}`, 0, statusText ? 64 : 44);
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
        ctx.font = button.id === "replay" ? "700 19px Consolas, monospace" : "700 22px Consolas, monospace";
        ctx.fillText(button.label, 0, 8);
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
      ctx.translate(this.width * 0.5, this.height * 0.5);
      ctx.fillStyle = "rgba(5, 10, 16, 0.9)";
      ctx.beginPath();
      ctx.roundRect(-230, -102, 460, 204, 22);
      ctx.fill();
      ctx.strokeStyle = "rgba(146, 208, 236, 0.42)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillStyle = "#f2fbff";
      ctx.font = "700 28px Consolas, monospace";
      const titleLines = wrapTextToLines(ctx, "Are you sure you want to go home?", 396, 2);
      const titleStartY = titleLines.length > 1 ? -44 : -28;
      for (let index = 0; index < titleLines.length; index += 1) {
        ctx.fillText(titleLines[index], 0, titleStartY + index * 32);
      }
      ctx.fillStyle = "#96c6de";
      ctx.font = "18px Consolas, monospace";
      ctx.fillText("Your current run progress will be lost.", 0, titleLines.length > 1 ? 18 : 8);

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
        ctx.font = "700 22px Consolas, monospace";
        ctx.fillText(button.label, 0, 8);
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
        ctx.font = "700 18px Consolas, monospace";
        ctx.textAlign = "center";
        ctx.fillText("Home", 0, 6);
        ctx.restore();
      }

      if (this.gameMode === "tag") {
        this.renderTagUI(ctx);
        ctx.restore();
        return;
      }

      const panelX = 24;
      const panelY = 70;
      const panelW = 388;
      const worldInfo = this.getCampaignWorldInfo();
      const statLines = this.gameMode === "speedrun"
        ? [
            `Level Time  ${formatTime(this.levelTimer)}`,
            `Total Time  ${formatTime(this.totalTimer)}`,
            `Damage      ${Math.round(this.totalDamage)}`,
            `Status      ${this.getDamageStatus()}`,
          ]
        : [
            `Level Time  ${formatTime(this.levelTimer)}`,
            `Damage      ${Math.round(this.totalDamage)}`,
            `Status      ${this.getDamageStatus()}`,
          ];
      const panelH = 132 + statLines.length * 26 + 34;
      const maxTextWidth = panelW - 40;

      ctx.fillStyle = "rgba(3, 8, 14, 0.74)";
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.strokeStyle = "rgba(126, 162, 186, 0.38)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(panelX, panelY, panelW, panelH);

      ctx.textAlign = "left";
      ctx.fillStyle = "#dceaf3";
      ctx.font = "600 24px Consolas, monospace";
      ctx.fillText(`LEVEL ${this.levelIndex + 1}`, panelX + 20, panelY + 32);

      ctx.fillStyle = "#84b6d3";
      ctx.font = "16px Consolas, monospace";
      ctx.fillText(fitTextToWidth(ctx, worldInfo.title, maxTextWidth), panelX + 20, panelY + 56);

      ctx.fillStyle = "#f0f7fb";
      ctx.font = "17px Consolas, monospace";
      let statY = panelY + 88;
      for (const line of statLines) {
        ctx.fillText(fitTextToWidth(ctx, line, maxTextWidth), panelX + 20, statY);
        statY += 26;
      }

      ctx.font = "15px Consolas, monospace";
      if (!this.completed) {
        ctx.fillStyle = this.totalDamage >= FIRE_DAMAGE_START ? "#ff8f66" : this.totalDamage >= SMOKE_DAMAGE_START ? "#c7cfd6" : "#89d0a8";
        ctx.fillText(fitTextToWidth(ctx, "Drive into the glowing finish cube", maxTextWidth), panelX + 20, panelY + panelH - 20);
      } else {
        ctx.fillStyle = this.levelCompletionSummary && this.levelCompletionSummary.perfectRun ? "#ffd76a" : "#96d7f2";
        ctx.fillText(fitTextToWidth(ctx, "Level result locked in", maxTextWidth), panelX + 20, panelY + panelH - 20);
      }

      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(235, 245, 250, 0.9)";
      ctx.fillText(
        this.completed ? "Enter / Space next   Esc home" : "WASD / Arrows drive   R restart",
        this.width - 30,
        this.height - 30
      );
      ctx.textAlign = "left";

      if (this.completed) {
        this.renderCampaignCompletionOverlay(ctx);
      }
      this.renderHomeConfirmOverlay(ctx);
      ctx.restore();
    }
  }

  window.addEventListener("load", () => {
    new DriftGame();
  });
})();
