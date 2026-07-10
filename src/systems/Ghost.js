import * as THREE from 'three';
import mattBillboardURL from '../assets/matt-billboard.png?url';
import { CachedRoute, canCapture, moveCircleAgainstAabbs } from './Navigation.js';

const CHASE_SPEED = 3.3;
const STALK_SPEED = 1.25;
const CATCH_DIST = 0.75;
const BURN_TIME_STALK = 1.6;   // seconds of beam to banish a stalker
const BURN_TIME_CHASE = 2.4;   // he is stronger once fully awake
const BANISH_DOWNTIME = 8;     // chase: seconds before he reforms
const GHOST_RADIUS = 0.32;
const COLLISION_EPSILON = 0.01;
const MAX_MOTION_SUBSTEP = 0.1;

export class Ghost {
  constructor(scene, navigationGrid = null) {
    this.scene = scene;
    this.mode = 'hidden';   // hidden | apparition | stalk | chase | banished
    this.apparitionTimer = 0;
    this.stalkTimer = 0;
    this.banishTimer = 0;
    this.flickerClock = 0;
    this.bobClock = Math.random() * 10;
    this.burnMeter = 0;
    this.burning = false;
    this.banishCount = 0;
    this.route = navigationGrid ? new CachedRoute(navigationGrid) : null;

    this._build();
    this.group.visible = false;
    scene.add(this.group);
  }

  _build() {
    this.group = new THREE.Group();
    const texture = new THREE.TextureLoader().load(mattBillboardURL);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.spriteMat = new THREE.SpriteMaterial({
      map: texture,
      color: 0xffffff,
      transparent: true,
      alphaTest: 0.04,
      depthTest: true,
      depthWrite: false,
      fog: true,
    });
    this.sprite = new THREE.Sprite(this.spriteMat);
    this.sprite.center.set(0.5, 0);
    // Deliberately stretched: the cheap cardboard-cutout motion is the joke.
    this.sprite.scale.set(2.35, 2.75, 1);
    this.group.add(this.sprite);
  }

  /* ---------------- states ---------------- */

  appearAt(pos, duration = 1.2) {
    this.group.position.set(pos.x, 0, pos.z);
    this.mode = 'apparition';
    this.apparitionTimer = duration;
    this.group.visible = true;
    this.route?.reset();
  }

  vanish() {
    this.mode = 'hidden';
    this.group.visible = false;
    this.burnMeter = 0;
    this.route?.reset();
  }

  /** Pre-finale hunting phase: he manifests and drifts toward the player. */
  startStalk(spawnPos, lifespan = 20) {
    this.group.position.set(spawnPos.x, 0, spawnPos.z);
    this.mode = 'stalk';
    this.stalkTimer = lifespan;
    this.burnMeter = 0;
    this.group.visible = true;
    this.route?.reset();
  }

  startChase(spawnPos) {
    this.group.position.set(spawnPos.x, 0, spawnPos.z);
    this.mode = 'chase';
    this.burnMeter = 0;
    this.group.visible = true;
    this.route?.reset();
  }

  get engaged() { return this.mode === 'stalk' || this.mode === 'chase'; }

  /** Beam is on him. Returns 'banished' the moment the meter fills. */
  applyBurn(dt) {
    if (!this.engaged) return null;
    this.burning = true;
    const burnTime = this.mode === 'chase' ? BURN_TIME_CHASE : BURN_TIME_STALK;
    this.burnMeter += dt / burnTime;
    if (this.burnMeter >= 1) {
      this._banish();
      return 'banished';
    }
    return 'burning';
  }

  stopBurn() { this.burning = false; }

  _banish() {
    this.banishCount++;
    this.burnMeter = 0;
    this.burning = false;
    if (this.mode === 'chase') {
      this.mode = 'banished';
      this.banishTimer = BANISH_DOWNTIME;
      this.group.visible = false;
    } else {
      this.vanish();
    }
  }

  /* ---------------- update ---------------- */

  /** @returns true the moment the player is caught */
  update(dt, playerPos, t, {
    getColliders = () => [],
    requestDoor = () => null,
    selectSpawn = () => null,
  } = {}) {
    if (this.mode === 'banished') {
      this.banishTimer -= dt;
      if (this.banishTimer <= 0) {
        const spawn = selectSpawn(playerPos, 8);
        if (spawn) this.startChase(spawn);
        else this.banishTimer = 0.5;
      }
      return false;
    }
    if (this.mode === 'hidden') return false;

    let motionX = 0;
    let motionZ = 0;

    // Eight-frame-per-second cardboard wobble: intentionally cheap, still uncanny.
    this.bobClock += dt;
    const cardboardFrame = Math.floor(t * 8);
    this.group.position.y = cardboardFrame % 2 ? 0.075 : 0;
    this.sprite.position.x = cardboardFrame % 2 ? 0.035 : -0.035;
    this.spriteMat.rotation = cardboardFrame % 2 ? -0.022 : 0.022;
    const breathe = 1 + (cardboardFrame % 3 === 0 ? 0.025 : 0);
    this.group.scale.set(breathe, breathe, breathe);

    if (this.burning) {
      this.spriteMat.color.setHex(Math.random() > 0.35 ? 0xffffff : 0xff6b35);
      this.spriteMat.opacity = 0.55 + Math.random() * 0.45;
    } else {
      this.spriteMat.color.setHex(0xffffff);
      this.spriteMat.opacity = Math.min(1, this.spriteMat.opacity + dt * 5);
      this.burnMeter = Math.max(0, this.burnMeter - dt * 0.45);
    }

    if (this.mode === 'apparition') {
      this.apparitionTimer -= dt;
      this.group.visible = Math.random() > 0.25;
      if (this.apparitionTimer <= 0) this.vanish();
      return false;
    }

    // ----- movement: cached legal route, blocker-safe, never smooth -----
    const routeTarget = this.route?.next(this.group.position, playerPos, dt) ?? null;
    if (routeTarget) requestDoor(this.group.position, routeTarget);
    const colliders = getColliders();
    const dx = routeTarget ? routeTarget.x - this.group.position.x : 0;
    const dz = routeTarget ? routeTarget.z - this.group.position.z : 0;
    const dist = Math.hypot(dx, dz);
    const slow = this.burning ? 0.3 : 1;
    const base = this.mode === 'chase' ? CHASE_SPEED : STALK_SPEED;
    const lurch = 1 + Math.sin(this.bobClock * 8.5) * 0.55;   // surging gait
    if (dist > 0.001) {
      const step = Math.min(base * slow * lurch * dt, dist);
      motionX += (dx / dist) * step;
      motionZ += (dz / dist) * step;
      // lateral drift so he weaves at you
      if (this.mode === 'chase') {
        const px = -dz / dist, pz = dx / dist;
        const sway = Math.sin(this.bobClock * 2.7) * 0.5 * dt;
        motionX += px * sway;
        motionZ += pz * sway;
      }
      if (this.burning) {
        motionX += (Math.random() - 0.5) * 0.05;
        motionZ += (Math.random() - 0.5) * 0.05;
      }
    }

    const next = moveCircleAgainstAabbs(
      this.group.position,
      { x: motionX, z: motionZ },
      colliders,
      { radius: GHOST_RADIUS, epsilon: COLLISION_EPSILON, maxSubstep: MAX_MOTION_SUBSTEP },
    );
    this.group.position.x = next.x;
    this.group.position.z = next.z;

    if (this.mode === 'stalk') {
      this.stalkTimer -= dt;
      if (this.stalkTimer <= 0) { this.vanish(); return false; }
      // stalker is patient — solid, slow, staring
      this.group.visible = true;
    } else {
      // chase: corrupted-frame strobing
      this.flickerClock -= dt;
      if (this.flickerClock <= 0) {
        this.group.visible = !this.group.visible;
        this.flickerClock = this.group.visible ? 0.12 + Math.random() * 0.3 : 0.04 + Math.random() * 0.1;
      }
    }

    return this.route?.path.length > 0
      && canCapture(this.group.position, playerPos, colliders, { catchDistance: CATCH_DIST });
  }

  distanceTo(playerPos) {
    return Math.hypot(playerPos.x - this.group.position.x, playerPos.z - this.group.position.z);
  }
}
