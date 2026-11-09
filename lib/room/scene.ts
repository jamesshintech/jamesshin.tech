// The Yonmoku room, rebuilt for the web from the game's own spec
// (Yonmoku's GAME_PLAN 4.1 and 4.9) and its code-generated textures: an
// eight-mat room at real mat proportions, a shoji wall open onto an engawa, a
// stone deck with a sunken bath, a bamboo spout and eight slow steam
// billboards, a stone lantern, a tokonoma with the enso scroll, the andon, and
// the board on a low table. Everything is generated here; the only files are
// the textures in public/room/tex. Units are metres. The room spans x and z
// from -1.82 to 1.82; the garden lies toward -z.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// Yonmoku's palette (GAME_PLAN 4.1), plus the room's own wood and cloth.
const PALETTE = {
  washi: 0xece5d5,
  sumi: 0x2a2725,
  kinari: 0xf2e6cc,
  shu: 0xb4472f,
  post: 0x5b4331,
  indigo: 0x2b3550,
};

const H = 1.82; // half the room
const MAT_W = 0.91;
const MAT_L = 1.82;
const CEIL = 2.4;
const SHOJI_H = 1.8;

/** The objects a visitor can open, each a row in the page's column. */
export type RoomKey = "essay" | "proposal" | "board" | "phone" | "weeks" | "map";

type Preset = {
  sky: [number, number];
  fog: [number, number, number];
  sun: { color: number; intensity: number; pos: [number, number, number] };
  hemi: [number, number, number];
  andon: number;
  lantern: number;
  washiGlow: number;
  env: number;
  water: number;
  waterEnv: number;
  steam: number;
  steamOp: number;
  kage: number;
  shade: number;
};
export type TimeName = "day" | "dusk" | "night";

// Time of day: the light, the sky and how much the paper glows.
const TIMES: Record<TimeName, Preset> = {
  day: {
    sky: [0xe9edf0, 0xb7c9d8], fog: [0xe6e6e0, 9, 30],
    sun: { color: 0xfff1dc, intensity: 2.6, pos: [3.5, 4.2, -6.5] },
    hemi: [0xdfe7ef, 0xb9a98c, 0.9], andon: 0.6, lantern: 0, washiGlow: 0.42, env: 0.35,
    water: 0x2c5554, waterEnv: 0.55, steam: 0xffffff, steamOp: 0.22, kage: 0.5, shade: 0.2,
  },
  dusk: {
    sky: [0xd9a37e, 0x3f4b66], fog: [0x8a7f78, 8, 26],
    sun: { color: 0xffb37a, intensity: 1.1, pos: [5.5, 1.6, -6.0] },
    hemi: [0x8da0c0, 0x5a4a3c, 0.45], andon: 5.5, lantern: 2.2, washiGlow: 0.24, env: 0.22,
    water: 0x2a4545, waterEnv: 1.0, steam: 0xffffff, steamOp: 0.3, kage: 0.42, shade: 1.4,
  },
  night: {
    sky: [0x1c2433, 0x0c1018], fog: [0x1c1c1a, 14, 40],
    sun: { color: 0xaabbd8, intensity: 0.75, pos: [-3.5, 6.5, -4.5] },
    hemi: [0x55617a, 0x221c18, 0.32], andon: 4.2, lantern: 3.6, washiGlow: 0.12, env: 0.14,
    water: 0x223a3f, waterEnv: 1.4, steam: 0xc8d2e6, steamOp: 0.3, kage: 0.12, shade: 1.4,
  },
};

type Light = {
  name: TimeName;
  sky: [THREE.Color, THREE.Color];
  fog: [THREE.Color, number, number];
  sun: { color: THREE.Color; intensity: number; pos: [number, number, number] };
  hemi: [THREE.Color, THREE.Color, number];
  andon: number;
  lantern: number;
  washiGlow: number;
  env: number;
  water: THREE.Color;
  waterEnv: number;
  steam: THREE.Color;
  steamOp: number;
  kage: number;
  shade: number;
};

// The room follows the evening (Yonmoku's own line): a phase from 0 (day)
// through 1 (dusk) to 2 (night) and back to 3 (day), blended continuously.
export function blendTime(phase: number): Light {
  const seq: TimeName[] = ["day", "dusk", "night", "day"];
  const p = ((phase % 3) + 3) % 3;
  const i = Math.min(2, Math.floor(p));
  const k = p - i;
  const a = TIMES[seq[i]];
  const b = TIMES[seq[i + 1]];
  const L = (x: number, y: number) => x + (y - x) * k;
  const C = (x: number, y: number) => new THREE.Color(x).lerp(new THREE.Color(y), k);
  return {
    name: k < 0.5 ? seq[i] : seq[i + 1],
    sky: [C(a.sky[0], b.sky[0]), C(a.sky[1], b.sky[1])],
    fog: [C(a.fog[0], b.fog[0]), L(a.fog[1], b.fog[1]), L(a.fog[2], b.fog[2])],
    sun: {
      color: C(a.sun.color, b.sun.color),
      intensity: L(a.sun.intensity, b.sun.intensity),
      pos: [L(a.sun.pos[0], b.sun.pos[0]), L(a.sun.pos[1], b.sun.pos[1]), L(a.sun.pos[2], b.sun.pos[2])],
    },
    hemi: [C(a.hemi[0], b.hemi[0]), C(a.hemi[1], b.hemi[1]), L(a.hemi[2], b.hemi[2])],
    andon: L(a.andon, b.andon),
    lantern: L(a.lantern, b.lantern),
    washiGlow: L(a.washiGlow, b.washiGlow),
    env: L(a.env, b.env),
    water: C(a.water, b.water),
    waterEnv: L(a.waterEnv, b.waterEnv),
    steam: C(a.steam, b.steam),
    steamOp: L(a.steamOp, b.steamOp),
    kage: L(a.kage, b.kage),
    shade: L(a.shade, b.shade),
  };
}

// Local clock to phase: day until 16:30, dusk by 18:30, night by 20:30,
// dawn from 05:00 to 07:00.
export function phaseAt(date: Date = new Date()): number {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= 7 && h < 16.5) return 0;
  if (h >= 16.5 && h < 18.5) return (h - 16.5) / 2;
  if (h >= 18.5 && h < 20.5) return 1 + (h - 18.5) / 2;
  if (h >= 20.5 || h < 5) return 2;
  return 2 + (h - 5) / 2;
}

// Kage-e: bamboo shadows on the shoji paper, drawn in its shader. The shapes
// move on the CPU (4 stems, 16 leaves, a few uniforms a frame), so each pixel
// does distance arithmetic only. Every smoothstep keeps its edges in order:
// a reversed one is undefined in GLSL and returns 0 on Apple's Metal path.
const KAGE_GLSL = `
uniform vec4 uStems[4];
uniform vec4 uLeaves[16];
float kageMask(vec3 wp) {
  vec2 p = wp.xy;
  float m = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 s = uStems[i];
    float cx = s.x + s.y * p.y + s.w * p.y * p.y;
    m = max(m, 1.0 - smoothstep(s.z * 0.15, s.z, abs(p.x - cx)));
  }
  for (int i = 0; i < 16; i++) {
    vec4 l = uLeaves[i];
    vec2 d = p - l.xy;
    d = vec2(l.z * d.x - l.w * d.y, l.w * d.x + l.z * d.y);
    m = max(m, (1.0 - smoothstep(0.3, 1.0, length(d / vec2(0.16, 0.034)))) * 0.85);
  }
  return m;
}`;

function kageField() {
  const hash = (n: number) => {
    const x = Math.sin(n) * 43758.5453;
    return x - Math.floor(x);
  };
  const stemsBase: [number, number, number][] = [[-1.55, 0.05, 0.032], [-1.1, -0.04, 0.026], [1.2, 0.06, 0.03], [1.63, -0.03, 0.024]];
  const leavesBase = Array.from({ length: 16 }, (_, i) => {
    const side = i < 8 ? -1 : 1;
    return { x: side * (1.05 + hash(i * 12.9898) * 0.7), y: 0.85 + hash(i * 78.233) * 0.9, a: -0.7 + hash(i * 3.7) * 1.4 };
  });
  const stems = stemsBase.map(() => new THREE.Vector4());
  const leaves = leavesBase.map(() => new THREE.Vector4());
  const update = (t: number) => {
    stemsBase.forEach(([x0, lean, w], i) => stems[i].set(x0, lean, w, Math.sin(t * 0.45 + x0 * 3.1) * 0.025));
    leavesBase.forEach((l, i) => leaves[i].set(l.x + Math.sin(t * 0.5 + l.y * 4 + l.x * 2) * 0.035 * l.y, l.y, Math.cos(l.a), Math.sin(l.a)));
  };
  update(0);
  return { uStems: { value: stems }, uLeaves: { value: leaves }, update };
}

type Uniform<T> = { value: T };

// A soft rim, only on the object being read about: fresnel in the shader,
// strength from one uniform per object. No outline pass, no glow.
function addRim<M extends THREE.MeshStandardMaterial>(material: M, rim: Uniform<number>): M {
  material.onBeforeCompile = (sh) => {
    sh.uniforms.uRim = rim;
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uRim;")
      .replace(
        "#include <opaque_fragment>",
        "outgoingLight += vec3(1.0, 0.78, 0.42) * uRim * 0.6 * pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.0);\n#include <opaque_fragment>",
      );
  };
  material.customProgramCacheKey = () => "rim";
  return material;
}

type Ripples = {
  tex: Uniform<THREE.Texture>;
  texel: THREE.Vector2;
  drop(u: number, v: number, strength?: number, radius?: number): void;
  step(dt: number): void;
  dispose(): void;
};

// Ripples: the height-field wave equation on a small half-float target,
// stepped on the GPU at 60 Hz (the method of Evan Wallace's WebGL Water).
// Returns null where float render targets are missing; the water then keeps
// only its drifting normal map.
function createRipples(renderer: THREE.WebGLRenderer, aspect: number, size: number): Ripples | null {
  const ok = renderer.extensions.has("EXT_color_buffer_float") || renderer.extensions.has("EXT_color_buffer_half_float");
  if (!ok) return null;
  const opts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
  let read = new THREE.WebGLRenderTarget(size, size, opts);
  let write = new THREE.WebGLRenderTarget(size, size, opts);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const sim = new THREE.ShaderMaterial({
    uniforms: {
      uPrev: { value: null },
      uTexel: { value: new THREE.Vector2(1 / size, 1 / size) },
      uDrop: { value: new THREE.Vector4(0, 0, 0, 0.03) },
    },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: `uniform sampler2D uPrev; uniform vec2 uTexel; uniform vec4 uDrop; varying vec2 vUv;
      void main(){
        vec4 s = texture2D(uPrev, vUv);
        float avg = (texture2D(uPrev, vUv + vec2(uTexel.x, 0.0)).r + texture2D(uPrev, vUv - vec2(uTexel.x, 0.0)).r
                   + texture2D(uPrev, vUv + vec2(0.0, uTexel.y)).r + texture2D(uPrev, vUv - vec2(0.0, uTexel.y)).r) * 0.25;
        float v = (s.g + (avg - s.r) * 2.0) * 0.992;
        float h = s.r + v;
        float d = length((vUv - uDrop.xy) * vec2(${aspect.toFixed(3)}, 1.0));
        h += uDrop.z * (1.0 - smoothstep(0.0, uDrop.w, d));
        float edge = smoothstep(0.0, 0.02, vUv.x) * (1.0 - smoothstep(0.98, 1.0, vUv.x)) * smoothstep(0.0, 0.02, vUv.y) * (1.0 - smoothstep(0.98, 1.0, vUv.y));
        gl_FragColor = vec4(h * edge, v * edge, 0.0, 1.0);
      }`,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), sim);
  quad.frustumCulled = false; // it sits on the camera's near plane
  const simScene = new THREE.Scene();
  simScene.add(quad);
  const tex: Uniform<THREE.Texture> = { value: read.texture };
  let acc = 0;
  let drop: [number, number, number, number] | null = null;
  return {
    tex,
    texel: new THREE.Vector2(1 / size, 1 / size),
    drop(u, v, strength = 0.03, radius = 0.03) {
      drop = [u, v, strength, radius];
    },
    step(dt) {
      acc = Math.min(acc + dt, 0.1);
      const prev = renderer.getRenderTarget();
      while (acc >= 1 / 60) {
        acc -= 1 / 60;
        sim.uniforms.uPrev.value = read.texture;
        sim.uniforms.uDrop.value.set(...(drop ?? [0, 0, 0, 0.03]));
        drop = null;
        renderer.setRenderTarget(write);
        renderer.render(simScene, cam);
        [read, write] = [write, read];
      }
      renderer.setRenderTarget(prev);
      tex.value = read.texture;
    },
    dispose() {
      read.dispose();
      write.dispose();
      sim.dispose();
      quad.geometry.dispose();
    },
  };
}

const TEXTURES = [
  "tatami-albedo", "tatami-normal", "washi-albedo", "washi-normal", "wood-albedo", "wood-normal",
  "grain-albedo", "grain-normal", "plaster-albedo", "plaster-normal", "stone-albedo", "stone-normal",
  "moss-albedo", "moss-normal", "scroll-enso", "steam",
] as const;
type Textures = Record<(typeof TEXTURES)[number], THREE.Texture>;

async function loadTextures(base: string, renderer: THREE.WebGLRenderer): Promise<Textures> {
  const loader = new THREE.TextureLoader();
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const entries = await Promise.all(
    TEXTURES.map(async (n) => {
      const t = await loader.loadAsync(`${base}${n}.webp`);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = aniso;
      if (!n.endsWith("normal")) t.colorSpace = THREE.SRGBColorSpace;
      return [n, t] as const;
    }),
  );
  return Object.fromEntries(entries) as Textures;
}

// A box whose UVs are in metres / scale, so texture density is the same on a
// thin post and a long beam, which lets many boxes share one merged mesh.
function boxGeo(w: number, h: number, d: number, scale = 1, x = 0, y = 0, z = 0): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, (uv.getX(i) * dims[f][0]) / scale, (uv.getY(i) * dims[f][1]) / scale);
    }
  }
  g.translate(x, y, z);
  return g;
}

type MatOpts = THREE.MeshStandardMaterialParameters & { rough?: number; normal?: number; repeat?: number };
function texMat(tex: Textures, name: "tatami" | "washi" | "wood" | "grain" | "plaster" | "stone" | "moss", { rough = 0.8, normal = 0.6, repeat = 1, ...rest }: MatOpts = {}) {
  const map = tex[`${name}-albedo`].clone();
  const nmap = tex[`${name}-normal`].clone();
  map.repeat.set(repeat, repeat);
  nmap.repeat.set(repeat, repeat);
  return new THREE.MeshStandardMaterial({ map, normalMap: nmap, normalScale: new THREE.Vector2(normal, normal), roughness: rough, ...rest });
}

function instanced(geo: THREE.BufferGeometry, material: THREE.Material, matrices: THREE.Matrix4[], { cast = true, receive = true } = {}) {
  const m = new THREE.InstancedMesh(geo, material, matrices.length);
  matrices.forEach((mx, i) => m.setMatrixAt(i, mx));
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

const M4 = (x: number, y: number, z: number, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));

const V3 = (p: readonly number[]) => new THREE.Vector3(p[0], p[1], p[2]);

function canvas2d(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  return { c, ctx };
}

// A tileable water normal map from a sum of integer-frequency sines.
function waterNormal(size = 256) {
  const { c, ctx } = canvas2d(size, size);
  const img = ctx.createImageData(size, size);
  const waves = [[3, 1, 0.9, 0.3], [1, 4, 0.7, 1.7], [5, -2, 0.4, 2.2], [-2, 6, 0.3, 0.8], [7, 3, 0.2, 4.1]];
  const h = (x: number, y: number) => waves.reduce((s, [kx, ky, a, p]) => s + a * Math.sin((2 * Math.PI * (kx * x + ky * y)) / size + p), 0);
  const n = new THREE.Vector3();
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      n.set(-(h(x + 1, y) - h(x - 1, y)) * 0.6, -(h(x, y + 1) - h(x, y - 1)) * 0.6, 1).normalize();
      const i = (y * size + x) * 4;
      img.data[i] = (n.x * 0.5 + 0.5) * 255;
      img.data[i + 1] = (n.y * 0.5 + 0.5) * 255;
      img.data[i + 2] = (n.z * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Flat prints, the essay's cover and the phone's screen, drawn once.
function canvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, srgb = true) {
  const { c, ctx } = canvas2d(w, h);
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Hand the main thread back between stages of the build, so a click or a
// scroll during it is answered (scheduler.yield where the browser has it).
type Scheduler = { yield?: () => Promise<void> };
const breathe = () =>
  (globalThis as { scheduler?: Scheduler }).scheduler?.yield?.() ?? new Promise<void>((done) => setTimeout(done, 0));

export type Room = {
  scene: THREE.Scene;
  anchors: Record<RoomKey, THREE.Vector3>;
  water: THREE.Mesh;
  readonly timeName: TimeName;
  setPhase(phase: number): void;
  highlight(key: RoomKey | null): void;
  dropBead(now: number): void;
  rippleAt(uv: THREE.Vector2, strength?: number): void;
  update(t: number, camera: THREE.Camera, dt?: number): void;
  dispose(): void;
};

type Frame = (t: number, camera: THREE.Camera, dt: number) => void;

export async function buildRoom(renderer: THREE.WebGLRenderer, { phase, low = false, texBase = "/room/tex/" }: { phase: number; low?: boolean; texBase?: string }): Promise<Room> {
  let T = blendTime(phase);
  const clock: Uniform<number> = { value: 0 };
  // The shadow map is drawn only when something that casts a shadow moves:
  // the sun (a change of light) or a falling bead. Everything else that
  // moves (steam, water, the bamboo's sway, the paper's shadows) casts none,
  // so redrawing it every frame would double the draw calls for nothing.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const reshadow = () => (renderer.shadowMap.needsUpdate = true);
  const tex = await loadTextures(texBase, renderer);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const studioEnv = pmrem.fromScene(roomEnv, 0.04);
  scene.environment = studioEnv.texture;
  scene.environmentIntensity = T.env;
  pmrem.dispose();
  roomEnv.dispose();
  const fog = new THREE.Fog(T.fog[0], T.fog[1], T.fog[2]);
  scene.fog = fog;

  const anchors = {} as Record<RoomKey, THREE.Vector3>;
  const animated: Frame[] = [];
  const extras: { dispose(): void }[] = [studioEnv];

  // Materials. Wood colours follow Yonmoku's store frames: dark stained
  // posts and table, pale hinoki for the board and the engawa.
  const M = {
    tatami: texMat(tex, "tatami", { rough: 0.92, normal: 0.8 }),
    plaster: texMat(tex, "plaster", { color: 0xf1ebe0, rough: 0.95, normal: 0.5 }),
    post: texMat(tex, "wood", { color: PALETTE.post, rough: 0.62, normal: 0.5 }),
    darkWood: texMat(tex, "wood", { color: 0x8a6b55, rough: 0.5, normal: 0.6 }),
    hinoki: texMat(tex, "wood", { color: 0xffffff, rough: 0.42, normal: 0.4, repeat: 2 }),
    planks: texMat(tex, "grain", { color: 0xd9c4a3, rough: 0.7, normal: 0.6 }),
    ceiling: texMat(tex, "grain", { color: 0xcdb390, rough: 0.8, normal: 0.4 }),
    washi: texMat(tex, "washi", { color: PALETTE.washi, rough: 0.95, normal: 0.3, emissive: new THREE.Color(0xfff2dc), emissiveIntensity: T.washiGlow, side: THREE.DoubleSide }),
    kumiko: texMat(tex, "grain", { color: 0xe7d4b4, rough: 0.6, normal: 0.3 }),
    stone: texMat(tex, "stone", { color: 0x9a968e, rough: 0.9, normal: 1.0 }),
    stoneDark: texMat(tex, "stone", { color: 0x5d5a55, rough: 0.85, normal: 1.0 }),
    moss: texMat(tex, "moss", { color: 0x8fa278, rough: 1, normal: 0.8, repeat: 3 }),
    cloth: new THREE.MeshStandardMaterial({ color: PALETTE.indigo, roughness: 0.95 }),
    lacquer: new THREE.MeshPhysicalMaterial({ color: 0x2a1512, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 }),
    beadDark: new THREE.MeshPhysicalMaterial({ color: PALETTE.sumi, roughness: 0.36, clearcoat: 0.6 }),
    beadLight: new THREE.MeshPhysicalMaterial({ color: PALETTE.kinari, roughness: 0.4, clearcoat: 0.4 }),
    bamboo: new THREE.MeshStandardMaterial({ color: 0x7d8a52, roughness: 0.55 }),
    bambooDry: new THREE.MeshStandardMaterial({ color: 0xa48d5f, roughness: 0.7 }),
    pine: new THREE.MeshStandardMaterial({ color: 0x2f3d2c, roughness: 0.9, flatShading: true }),
    glaze: new THREE.MeshPhysicalMaterial({ color: 0x6f7d73, roughness: 0.2, clearcoat: 1 }),
  };

  await breathe();

  // Tatami: eight mats at real proportions, one instanced mesh. The pattern
  // never runs four corners together.
  const mats = (
    [
      [-MAT_W, -H + MAT_W / 2, Math.PI / 2], [MAT_W, -H + MAT_W / 2, Math.PI / 2],
      [-H + MAT_W / 2, 0, 0], [0, -MAT_W / 2, Math.PI / 2], [0, MAT_W / 2, Math.PI / 2], [H - MAT_W / 2, 0, 0],
      [-MAT_W, H - MAT_W / 2, Math.PI / 2], [MAT_W, H - MAT_W / 2, Math.PI / 2],
    ] as const
  ).map(([x, z, r]) => M4(x, -0.0275, z, r));
  scene.add(instanced(new RoundedBoxGeometry(MAT_W - 0.004, 0.055, MAT_L - 0.004, 2, 0.01), M.tatami, mats, { cast: false }));
  // A dark subfloor under the mats, the alcove and the engawa: without it the
  // hairline gaps between mats, planks and walls show the sky dome beneath.
  const subfloor = new THREE.Mesh(new THREE.PlaneGeometry(2 * H + 1.4, 4.75), new THREE.MeshBasicMaterial({ color: 0x15120f }));
  subfloor.rotation.x = -Math.PI / 2;
  subfloor.position.set(0, -0.06, -0.45);
  scene.add(subfloor);

  // Walls: plaster, merged; the back wall is the shoji.
  const walls = new THREE.Mesh(
    mergeGeometries([
      boxGeo(0.06, CEIL - SHOJI_H - 0.06, 2 * H, 1, -H - 0.03, SHOJI_H + 0.06 + (CEIL - SHOJI_H - 0.06) / 2, 0),
      boxGeo(0.06, SHOJI_H + 0.06, H + 0.7, 1, -H - 0.03, (SHOJI_H + 0.06) / 2, (H - 0.7) / 2),
      boxGeo(2 * H, CEIL - SHOJI_H - 0.06, 0.06, 1, 0, SHOJI_H + 0.06 + (CEIL - SHOJI_H - 0.06) / 2, -H - 0.03),
      boxGeo(0.06, CEIL, 2 * H, 1, H + 0.03, CEIL / 2, 0),
      boxGeo(2 * H, CEIL, 0.06, 1, 0, CEIL / 2, H + 0.03),
    ]),
    M.plaster,
  );
  walls.receiveShadow = walls.castShadow = true;
  scene.add(walls);

  // Posts and the nageshi rail, dark wood, merged.
  const P = 0.105;
  const timber = [[-H, -H], [H, -H], [-H, H], [H, H], [-H, -0.7]].map(([x, z]) => boxGeo(P, CEIL, P, 1, x, CEIL / 2, z));
  timber.push(
    boxGeo(2 * H + P, 0.07, 0.07, 1, 0, SHOJI_H + 0.035, -H + 0.01),
    boxGeo(2 * H + P, 0.03, 0.09, 1, 0, 0.015, -H),
    boxGeo(0.07, 0.07, 2 * H, 1, -H + 0.01, SHOJI_H + 0.035, 0),
    boxGeo(0.07, 0.07, 2 * H, 1, H - 0.01, SHOJI_H + 0.035, 0),
    boxGeo(2 * H, 0.07, 0.07, 1, 0, SHOJI_H + 0.035, H - 0.01),
    boxGeo(0.06, 0.05, 2 * H, 1, -H, CEIL - 0.025, 0),
    boxGeo(0.06, 0.05, 2 * H, 1, H, CEIL - 0.025, 0),
  );
  const posts = new THREE.Mesh(mergeGeometries(timber), M.post);
  posts.castShadow = posts.receiveShadow = true;
  scene.add(posts);

  // Ceiling: boards with battens (saobuchi).
  const ceil = new THREE.Mesh(boxGeo(2 * H, 0.02, 2 * H, 0.9, 0, CEIL + 0.01, 0), M.ceiling);
  ceil.receiveShadow = true;
  scene.add(ceil);
  const battens: THREE.BufferGeometry[] = [];
  for (let x = -H + 0.45; x < H; x += 0.45) battens.push(boxGeo(0.03, 0.03, 2 * H, 1, x, CEIL - 0.015, 0));
  scene.add(new THREE.Mesh(mergeGeometries(battens), M.post));

  // Shoji: four panels; the middle two slide behind the outer two, so the
  // garden opens 1.8 m wide. The paper casts no shadow, so the lattice draws
  // its shadow on the tatami.
  const kumiko: THREE.Matrix4[] = [];
  const paper: THREE.BufferGeometry[] = [];
  const panel = (cx: number, z: number) => {
    const w = MAT_W;
    const x0 = cx - w / 2;
    const bar = (x: number, y: number, sx: number, sy: number) => kumiko.push(M4(x, y, z, 0, sx, sy, 0.03));
    bar(x0 + 0.02, SHOJI_H / 2, 0.035, SHOJI_H);
    bar(x0 + w - 0.02, SHOJI_H / 2, 0.035, SHOJI_H);
    bar(cx, SHOJI_H - 0.025, w, 0.045);
    bar(cx, 0.09, w, 0.16);
    for (let i = 1; i < 4; i++) bar(x0 + (w * i) / 4, SHOJI_H / 2 + 0.07, 0.012, SHOJI_H - 0.18);
    for (let j = 1; j < 8; j++) bar(cx, 0.17 + ((SHOJI_H - 0.2) * j) / 8, w - 0.05, 0.012);
    const p = new THREE.PlaneGeometry(w - 0.04, SHOJI_H - 0.2);
    p.translate(cx, 0.17 + (SHOJI_H - 0.2) / 2, z - 0.006);
    paper.push(p);
  };
  panel(-H + MAT_W / 2, -H + 0.02);
  panel(-H + MAT_W / 2 + 0.05, -H - 0.03);
  panel(H - MAT_W / 2, -H + 0.02);
  panel(H - MAT_W / 2 - 0.05, -H - 0.03);
  scene.add(instanced(new THREE.BoxGeometry(1, 1, 1), M.kumiko, kumiko));
  const kage: Uniform<number> = { value: T.kage };
  const field = kageField();
  animated.push((t) => field.update(t));
  const shojiMat = M.washi.clone();
  shojiMat.onBeforeCompile = (sh) => {
    sh.uniforms.uKage = kage;
    sh.uniforms.uStems = field.uStems;
    sh.uniforms.uLeaves = field.uLeaves;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vKP;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvKP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vKP;\nuniform float uKage;\n" + KAGE_GLSL)
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\nfloat kMask = kageMask(vKP);\ntotalEmissiveRadiance *= 1.0 - uKage * kMask;\ndiffuseColor.rgb *= 1.0 - 0.4 * uKage * kMask;",
      );
  };
  const washi = new THREE.Mesh(mergeGeometries(paper), shojiMat);
  washi.receiveShadow = true;
  scene.add(washi);

  // Round window (marumado) on the right wall, paper behind a wooden ring.
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 12, 64), M.post);
  ring.position.set(H - 0.005, 1.35, 0.75);
  ring.rotation.y = Math.PI / 2;
  scene.add(ring);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.42, 48), M.washi);
  disc.position.set(H - 0.002, 1.35, 0.75);
  disc.rotation.y = -Math.PI / 2;
  scene.add(disc);
  const bars: THREE.BufferGeometry[] = [];
  for (let i = -2; i <= 2; i++) bars.push(boxGeo(0.01, 2 * Math.sqrt(0.42 ** 2 - (i * 0.14) ** 2), 0.01, 1, H - 0.01, 1.35, 0.75 + i * 0.14));
  scene.add(new THREE.Mesh(mergeGeometries(bars), M.kumiko));

  // Tokonoma: an alcove in the left wall, a raised floor, the enso scroll and
  // an ikebana.
  const tk = { x0: -H - 0.62, x1: -H, z0: -H + 0.04, z1: -0.7 };
  const tokoFloor = new THREE.Mesh(boxGeo(0.62, 0.12, tk.z1 - tk.z0, 1, (tk.x0 + tk.x1) / 2, 0.06, (tk.z0 + tk.z1) / 2), M.darkWood);
  tokoFloor.castShadow = tokoFloor.receiveShadow = true;
  scene.add(tokoFloor);
  const alcove = new THREE.Mesh(
    mergeGeometries([
      boxGeo(0.04, CEIL, tk.z1 - tk.z0, 1, tk.x0 - 0.02, CEIL / 2, (tk.z0 + tk.z1) / 2),
      boxGeo(0.62, CEIL, 0.04, 1, (tk.x0 + tk.x1) / 2, CEIL / 2, tk.z0 - 0.02),
      boxGeo(0.62, CEIL, 0.04, 1, (tk.x0 + tk.x1) / 2, CEIL / 2, tk.z1 + 0.02),
      boxGeo(0.62, 0.02, tk.z1 - tk.z0, 1, (tk.x0 + tk.x1) / 2, CEIL, (tk.z0 + tk.z1) / 2),
    ]),
    M.plaster,
  );
  alcove.receiveShadow = true;
  scene.add(alcove);
  scene.add(new THREE.Mesh(boxGeo(0.06, 0.07, tk.z1 - tk.z0, 1, tk.x1 + 0.01, SHOJI_H + 0.025, (tk.z0 + tk.z1) / 2), M.post));
  const tokobashira = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, CEIL, 10), M.hinoki);
  tokobashira.position.set(tk.x1, CEIL / 2, tk.z1 + 0.02);
  scene.add(tokobashira);
  const scroll = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 1.08), new THREE.MeshStandardMaterial({ map: tex["scroll-enso"], roughness: 0.9 }));
  scroll.position.set(tk.x0 + 0.005, 1.12, (tk.z0 + tk.z1) / 2);
  scroll.rotation.y = Math.PI / 2;
  scene.add(scroll);
  for (const y of [0.57, 1.67]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.42, 8), M.lacquer);
    rod.rotation.x = Math.PI / 2;
    rod.position.set(tk.x0 + 0.015, y, (tk.z0 + tk.z1) / 2);
    scene.add(rod);
  }
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.07, 24), M.lacquer);
  vase.position.set(tk.x0 + 0.33, 0.155, tk.z1 - 0.28);
  scene.add(vase);
  const branch = (pts: number[][]) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(V3)), 20, 0.006, 5);
  const bx = tk.x0 + 0.33;
  const bz = tk.z1 - 0.28;
  scene.add(
    new THREE.Mesh(
      mergeGeometries([
        branch([[bx, 0.18, bz], [bx + 0.04, 0.45, bz + 0.05], [bx + 0.02, 0.72, bz + 0.13]]),
        branch([[bx, 0.18, bz], [bx - 0.06, 0.36, bz - 0.04], [bx - 0.14, 0.46, bz - 0.12]]),
        branch([[bx, 0.18, bz], [bx + 0.08, 0.3, bz - 0.06], [bx + 0.15, 0.35, bz - 0.04]]),
      ]),
      M.post,
    ),
  );
  const camellia = new THREE.Mesh(new THREE.IcosahedronGeometry(0.03, 1), new THREE.MeshStandardMaterial({ color: PALETTE.shu, roughness: 0.6 }));
  camellia.position.set(bx + 0.02, 0.72, bz + 0.13);
  scene.add(camellia);

  await breathe();

  // Chabudai.
  const table = new THREE.Group();
  table.position.set(0, 0, 0.15);
  const top = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.035, 0.9, 3, 0.01), M.darkWood);
  top.position.y = 0.315;
  top.castShadow = top.receiveShadow = true;
  table.add(top);
  const legGeo = new THREE.BoxGeometry(0.05, 0.3, 0.05);
  for (const [x, z] of [[-0.38, -0.38], [0.38, -0.38], [-0.38, 0.38], [0.38, 0.38]]) {
    const leg = new THREE.Mesh(legGeo, M.darkWood);
    leg.position.set(x, 0.15, z);
    leg.castShadow = true;
    table.add(leg);
  }
  scene.add(table);

  // Every openable object gets its own rim-lit materials.
  const objects = {} as Record<RoomKey, { rim: Uniform<number>; want: number }>;
  const rimFor = <Ms extends THREE.MeshStandardMaterial[]>(key: RoomKey, ...materials: Ms): Ms => {
    objects[key] ??= { rim: { value: 0 }, want: 0 };
    return materials.map((m) => addRim(m, objects[key].rim)) as Ms;
  };

  // The board: GAME_PLAN 4.1 proportions, 1 unit = 6.8 cm.
  const U = 0.068;
  const boardY = 0.333;
  const board = new THREE.Group();
  board.position.set(0, boardY, 0.15);
  board.rotation.y = 0.12;
  const [boardWood, boardDark, boardLight] = rimFor("board", M.hinoki.clone(), M.beadDark.clone(), M.beadLight.clone());
  const slab = new THREE.Mesh(new RoundedBoxGeometry(4.4 * U, 0.35 * U, 4.4 * U, 3, 0.08 * U), boardWood);
  slab.position.y = 0.175 * U;
  slab.castShadow = slab.receiveShadow = true;
  board.add(slab);
  const pegMats: THREE.Matrix4[] = [];
  const slots: [number, number][] = [];
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const x = (i - 1.5) * U;
      const z = (j - 1.5) * U;
      slots.push([x, z]);
      pegMats.push(M4(x, 0.35 * U + (2.73 * U) / 2, z));
    }
  board.add(instanced(new THREE.CylinderGeometry(0.09 * U, 0.09 * U, 2.73 * U, 10), boardWood, pegMats));
  const beadGeo = new THREE.LatheGeometry(
    [[0.11, -0.31], [0.24, -0.3], [0.35, -0.24], [0.4, -0.1], [0.4, 0.1], [0.35, 0.24], [0.24, 0.3], [0.11, 0.31]].map(([r, y]) => new THREE.Vector2(r * U, y * U)),
    28,
  );
  // A game in progress: dark has seven beads, light six, no line yet.
  const stacks: Record<number, string> = { 0: "DL", 1: "L", 6: "DDL", 5: "LD", 15: "D", 2: "L", 10: "DL", 7: "D" };
  const dark: THREE.Matrix4[] = [];
  const light: THREE.Matrix4[] = [];
  for (const [slot, s] of Object.entries(stacks)) {
    const [x, z] = slots[Number(slot)];
    [...s].forEach((c, k) => (c === "D" ? dark : light).push(M4(x, 0.35 * U + 0.31 * U + k * 0.62 * U, z)));
  }
  board.add(instanced(beadGeo, boardDark, dark));
  board.add(instanced(beadGeo, boardLight, light));
  // Yonmoku's falling bead: a tap on the board drops one onto a free peg,
  // with gravity and two small damped bounces, like the game's.
  const counts = slots.map((_, i) => (stacks[i] ?? "").length);
  const order = [3, 9, 12, 4, 11, 14, 8, 13, 0, 5];
  const dropped: { mesh: THREE.Mesh; slot: number; rest: number; t0: number }[] = [];
  let turn = 0;
  const dropBead = (now: number) => {
    if (dropped.length >= 6) {
      for (const d of dropped.splice(0)) {
        board.remove(d.mesh);
        counts[d.slot]--;
      }
      reshadow();
    }
    const slot = order.find((i) => counts[i] < 4);
    if (slot === undefined) return;
    const mesh = new THREE.Mesh(beadGeo, turn++ % 2 ? boardLight : boardDark);
    mesh.castShadow = true;
    const [x, z] = slots[slot];
    const rest = 0.35 * U + 0.31 * U + counts[slot] * 0.62 * U;
    counts[slot]++;
    mesh.position.set(x, rest + 3.2 * U, z);
    board.add(mesh);
    dropped.push({ mesh, slot, rest, t0: now });
  };
  animated.push((t) => {
    const H0 = 3.2 * U;
    const g = 9.8 * 0.35;
    const tFall = Math.sqrt((2 * H0) / g);
    const b1 = g * tFall * 0.18;
    const t1 = (2 * b1) / g;
    const b2 = b1 * 0.25;
    const t2 = (2 * b2) / g;
    for (const d of dropped) {
      const e = t - d.t0;
      // Falling or bouncing, plus one frame at rest: its shadow moves with it.
      if (e < tFall + t1 + t2 + 0.1) reshadow();
      let y = 0;
      if (e < tFall) y = H0 - 0.5 * g * e * e;
      else if (e - tFall < t1) y = b1 * (e - tFall) - 0.5 * g * (e - tFall) ** 2;
      else if (e - tFall - t1 < t2) y = b2 * (e - tFall - t1) - 0.5 * g * (e - tFall - t1) ** 2;
      d.mesh.position.y = d.rest + Math.max(0, y);
    }
  });
  scene.add(board);
  anchors.board = new THREE.Vector3(0, boardY + 0.2, 0.15);

  scene.add(instanced(new RoundedBoxGeometry(0.55, 0.07, 0.6, 3, 0.03), M.cloth, [M4(0, 0.035, 0.98, 0.02), M4(0.02, 0.035, -0.7, -0.03)]));

  // Tray with yunomi and kyusu.
  const tray = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.015, 0.16, 2, 0.006), M.lacquer);
  tray.position.set(0.3, boardY + 0.008, 0.36);
  tray.rotation.y = -0.2;
  scene.add(tray);
  const cup = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.028, 0], [0.032, 0.03], [0.034, 0.075], [0.03, 0.075]].map(([r, y]) => new THREE.Vector2(r, y)), 20), M.glaze);
  cup.position.set(0.25, boardY + 0.016, 0.37);
  cup.castShadow = true;
  scene.add(cup);
  const pot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 14), M.glaze);
  pot.scale.y = 0.8;
  pot.position.set(0.36, boardY + 0.05, 0.34);
  pot.castShadow = true;
  scene.add(pot);

  // The essay on the table, the proposal in a lacquer box by the alcove.
  const essayTex = canvasTex(512, 720, (c, w) => {
    c.fillStyle = "#f3eee3";
    c.fillRect(0, 0, w, 720);
    c.fillStyle = "#3b3632";
    c.font = "600 54px Georgia, serif";
    c.fillText("Billing Controls", 48, 140);
    c.font = "400 30px Georgia, serif";
    c.fillText("From Checklists to Harnesses", 48, 196);
    c.fillStyle = "rgba(59,54,50,.25)";
    for (let y = 270; y < 660; y += 26) c.fillRect(48, y, w - 96 - ((y * 7) % 90), 6);
  });
  const [essaySide, essayTop] = rimFor("essay", M.washi.clone(), new THREE.MeshStandardMaterial({ map: essayTex, roughness: 0.9 }));
  const essay = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.004, 0.21), [essaySide, essaySide, essayTop, essaySide, essaySide, essaySide]);
  essay.position.set(-0.27, boardY + 0.003, 0.34);
  essay.rotation.y = 0.18;
  essay.castShadow = true;
  scene.add(essay);
  anchors.essay = essay.position.clone().add(new THREE.Vector3(0, 0.012, 0.03));

  const bunko = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.07, 0.22, 2, 0.008), rimFor("proposal", M.lacquer.clone())[0]);
  bunko.position.set(tk.x1 + 0.35, 0.035, -1.35);
  bunko.rotation.y = 0.35;
  bunko.castShadow = true;
  scene.add(bunko);
  anchors.proposal = bunko.position.clone().add(new THREE.Vector3(0, 0.12, 0));

  // Two framed prints on the right wall: a life in weeks and a tile map.
  const weeksTex = canvasTex(360, 480, (c, w, h) => {
    c.fillStyle = "#f4efe4";
    c.fillRect(0, 0, w, h);
    const lived = 38 * 52 + 19;
    for (let i = 0; i < 52 * 80; i++) {
      c.fillStyle = i < lived ? "#2f8f84" : "#d9d3c4";
      c.fillRect(20 + (i % 52) * 6.2, 24 + Math.floor(i / 52) * 5.4, 4.6, 3.8);
    }
  });
  const mapTex = canvasTex(360, 480, (c, w, h) => {
    c.fillStyle = "#f4efe4";
    c.fillRect(0, 0, w, h);
    const ramp = ["#16365c", "#2f5d8a", "#6f94b8", "#b9cde0"];
    for (let r = 0; r < 8; r++)
      for (let q = 0; q < 11; q++) {
        if ((r + q * 3) % 7 === 0 || (r > 6 && q < 2)) continue;
        c.fillStyle = ramp[(r * 5 + q * 3) % 4];
        c.fillRect(28 + q * 28, 110 + r * 30, 25, 27);
      }
  });
  const print = (map: THREE.Texture, z: number, key: RoomKey) => {
    const g = new THREE.Group();
    const [frM, faceM] = rimFor(key, M.post.clone(), new THREE.MeshStandardMaterial({ map, roughness: 0.85 }));
    const fr = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.38), frM);
    fr.castShadow = true;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.33, 0.44), faceM);
    face.rotation.y = -Math.PI / 2;
    face.position.x = -0.016;
    g.add(fr, face);
    g.position.set(H - 0.02, 1.35, z);
    scene.add(g);
    return g.position.clone().add(new THREE.Vector3(-0.05, 0, 0));
  };
  anchors.weeks = print(weeksTex, -0.35, "weeks");
  anchors.map = print(mapTex, -1.05, "map");

  // A phone face up on the table: Squeeze.
  const phoneTex = canvasTex(180, 380, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#c58bd6");
    g.addColorStop(1, "#7d5cc0");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#f4eadc";
    c.fillRect(18, 40, w - 36, 54);
    c.fillStyle = "#e7c35a";
    c.fillRect(96, 300, 66, 34);
    c.fillStyle = "#43b5d8";
    c.fillRect(18, 300, 66, 34);
  });
  const [phoneBody, phoneScreen] = rimFor(
    "phone",
    M.lacquer.clone(),
    new THREE.MeshStandardMaterial({ map: phoneTex, roughness: 0.3, emissive: 0xffffff, emissiveMap: phoneTex, emissiveIntensity: 0.25 }),
  );
  const phone = new THREE.Mesh(new RoundedBoxGeometry(0.072, 0.008, 0.15, 2, 0.006), [phoneBody, phoneBody, phoneScreen, phoneBody, phoneBody, phoneBody]);
  phone.position.set(0.29, boardY + 0.004, -0.12);
  phone.rotation.y = -0.4;
  phone.castShadow = true;
  scene.add(phone);
  anchors.phone = phone.position.clone().add(new THREE.Vector3(0, 0.05, 0));

  // Andon: a paper lantern on a frame, the warm key at dusk and night.
  const andon = new THREE.Group();
  andon.position.set(1.25, 0, 1.05);
  const frame = [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]].map(([x, z]) => boxGeo(0.02, 0.6, 0.02, 1, x, 0.3, z));
  frame.push(boxGeo(0.26, 0.02, 0.26, 1, 0, 0.6, 0), boxGeo(0.26, 0.02, 0.26, 1, 0, 0.15, 0));
  andon.add(new THREE.Mesh(mergeGeometries(frame), M.post));
  const shadeMat = new THREE.MeshStandardMaterial({ map: tex["washi-albedo"], color: 0xfff1d8, emissive: 0xffc98a, emissiveIntensity: T.shade, roughness: 0.9 });
  const shade = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.22), shadeMat);
  shade.position.y = 0.38;
  andon.add(shade);
  const andonLight = new THREE.PointLight(0xffb36b, T.andon, 5, 2);
  andonLight.position.set(0, 0.42, 0);
  andon.add(andonLight);
  scene.add(andon);

  // Bonsai in the far right corner.
  const bonsai = new THREE.Group();
  bonsai.position.set(1.45, 0, -1.45);
  const bpot = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.07, 0.18, 2, 0.01), M.glaze);
  bpot.position.y = 0.035;
  bonsai.add(bpot);
  bonsai.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, 0.06, 0], [0.04, 0.14, 0.02], [-0.03, 0.24, 0], [0.05, 0.32, -0.02]].map(V3)), 16, 0.018, 6), M.post));
  for (const [x, y, z, s] of [[0.06, 0.33, -0.02, 0.09], [-0.06, 0.27, 0.03, 0.07], [0.1, 0.26, 0.04, 0.06]]) {
    const pad = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), M.pine);
    pad.scale.y = 0.45;
    pad.position.set(x, y, z);
    pad.castShadow = true;
    bonsai.add(pad);
  }
  scene.add(bonsai);

  await breathe();

  // ---------- outside ----------
  // Engawa: planks level with the tatami, then the eave above.
  const E0 = -H - 0.05;
  const E1 = -H - 0.95;
  const plankM: THREE.Matrix4[] = [];
  for (let x = -H - 0.3; x < H + 0.3; x += 0.15) plankM.push(M4(x + 0.075, -0.02, (E0 + E1) / 2, 0, 0.145, 0.04, E0 - E1));
  scene.add(instanced(new THREE.BoxGeometry(1, 1, 1), M.planks, plankM, { cast: false }));
  scene.add(new THREE.Mesh(boxGeo(2 * H + 0.6, 0.16, 0.1, 1, 0, -0.08, E1), M.darkWood));
  const eave = new THREE.Group();
  eave.add(new THREE.Mesh(boxGeo(2 * H + 1.2, 0.04, 1.4, 1, 0, 0, 0), M.ceiling));
  const rafters: THREE.BufferGeometry[] = [];
  for (let x = -H - 0.5; x <= H + 0.5; x += 0.3) rafters.push(boxGeo(0.05, 0.06, 1.4, 1, x, -0.05, 0));
  eave.add(new THREE.Mesh(mergeGeometries(rafters), M.post));
  eave.position.set(0, CEIL + 0.05, -H - 0.7);
  eave.rotation.x = -0.18;
  eave.traverse((o) => (o.castShadow = true));
  scene.add(eave);
  for (const x of [-H - 0.25, H + 0.25]) {
    const p = new THREE.Mesh(boxGeo(0.1, CEIL, 0.1, 1, 0, 0, 0), M.post);
    p.position.set(x, CEIL / 2 - 0.05, E1 + 0.06);
    scene.add(p);
  }

  // The garden, modern ryokan: a stone deck a step below the engawa, a sunken
  // bath with crisp coping, a planted bed with a maple, a stone lantern and two
  // boulders, a silvered cedar wall, and a bamboo grove that moves slowly.
  const D = -0.12; // deck top
  const gz0 = E1 - 0.05;
  const wallZ = -5.6;
  const gx = [-4.6, 4.6];
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const bath = { x: 0.3, z: -3.85, w: 1.9, d: 1.1, c: 0.14 };
  // One deck with the bath cut out of it, and joint lines that stop at the
  // coping, so it reads as laid stone without a mesh per slab.
  const hole = { x0: bath.x - bath.w / 2 - bath.c, x1: bath.x + bath.w / 2 + bath.c, z0: bath.z - bath.d / 2 - bath.c, z1: bath.z + bath.d / 2 + bath.c };
  const deckShape = new THREE.Shape();
  deckShape.moveTo(gx[0], -gz0);
  deckShape.lineTo(gx[1], -gz0);
  deckShape.lineTo(gx[1], -(wallZ + 0.9));
  deckShape.lineTo(gx[0], -(wallZ + 0.9));
  deckShape.closePath();
  const pool = { x0: bath.x - bath.w / 2, x1: bath.x + bath.w / 2, z0: bath.z - bath.d / 2, z1: bath.z + bath.d / 2 };
  const hp = new THREE.Path();
  hp.moveTo(pool.x0, -pool.z1);
  hp.lineTo(pool.x0, -pool.z0);
  hp.lineTo(pool.x1, -pool.z0);
  hp.lineTo(pool.x1, -pool.z1);
  hp.closePath();
  deckShape.holes.push(hp);
  const deckGeo = new THREE.ExtrudeGeometry(deckShape, { depth: 0.1, bevelEnabled: false });
  deckGeo.rotateX(-Math.PI / 2);
  deckGeo.translate(0, D - 0.1, 0);
  const uvD = deckGeo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uvD.count; i++) uvD.setXY(i, uvD.getX(i) / 1.2, uvD.getY(i) / 1.2);
  const deck = new THREE.Mesh(deckGeo, texMat(tex, "stone", { color: 0x7b766e, rough: 0.8, normal: 0.7 }));
  deck.receiveShadow = true;
  scene.add(deck);
  const joints: THREE.Matrix4[] = [];
  const seg = (ax: number, az: number, bx2: number, bz2: number) => {
    const len = Math.hypot(bx2 - ax, bz2 - az);
    if (len > 0.02) joints.push(M4((ax + bx2) / 2, D + 0.0005, (az + bz2) / 2, ax === bx2 ? Math.PI / 2 : 0, len, 0.002, 0.008));
  };
  for (let z = gz0 - 0.61; z > wallZ + 0.9; z -= 0.61) {
    if (z > hole.z0 && z < hole.z1) {
      seg(gx[0], z, hole.x0, z);
      seg(hole.x1, z, gx[1], z);
    } else seg(gx[0], z, gx[1], z);
  }
  let row = 0;
  for (let z = gz0; z > wallZ + 0.9 + 0.01; z -= 0.61, row++) {
    const z2 = Math.max(z - 0.61, wallZ + 0.9);
    for (let x = gx[0] + (row % 2 ? 0.45 : 0.9); x < gx[1]; x += 0.91) {
      const inX = x > hole.x0 && x < hole.x1;
      if (inX && z2 < hole.z1 && z > hole.z0) {
        if (z > hole.z1) seg(x, z, x, hole.z1);
        if (z2 < hole.z0) seg(x, hole.z0, x, z2);
      } else seg(x, z, x, z2);
    }
  }
  scene.add(instanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x2e2b27 }), joints, { cast: false, receive: false }));
  scene.add(new THREE.Mesh(boxGeo(gx[1] - gx[0], 0.5, gz0 - wallZ, 1, (gx[0] + gx[1]) / 2, D - 0.36, (gz0 + wallZ) / 2), M.stoneDark));

  const coping = new THREE.Mesh(
    mergeGeometries([
      boxGeo(bath.w + 2 * bath.c, 0.06, bath.c, 0.6, bath.x, D + 0.03, bath.z - bath.d / 2 - bath.c / 2),
      boxGeo(bath.w + 2 * bath.c, 0.06, bath.c, 0.6, bath.x, D + 0.03, bath.z + bath.d / 2 + bath.c / 2),
      boxGeo(bath.c, 0.06, bath.d, 0.6, bath.x - bath.w / 2 - bath.c / 2, D + 0.03, bath.z),
      boxGeo(bath.c, 0.06, bath.d, 0.6, bath.x + bath.w / 2 + bath.c / 2, D + 0.03, bath.z),
    ]),
    texMat(tex, "stone", { color: 0xb3ada2, rough: 0.6, normal: 0.6 }),
  );
  coping.castShadow = coping.receiveShadow = true;
  scene.add(coping);
  const basin = new THREE.Mesh(new THREE.BoxGeometry(bath.w, 0.55, bath.d), M.stoneDark);
  basin.position.set(bath.x, D - 0.335, bath.z);
  scene.add(basin);
  const waterY = D - 0.035;

  await breathe();

  // The water reflects this garden's own sky, not a studio; the reflection is
  // rebuilt only when the light has moved enough to see.
  const skyScene = new THREE.Scene();
  const skyEnvMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { top: { value: new THREE.Color(T.sky[1]) }, horizon: { value: new THREE.Color(T.sky[0]) } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
    fragmentShader: "uniform vec3 top; uniform vec3 horizon; varying vec3 vP; void main(){ float k = smoothstep(-0.1, 0.7, vP.y); gl_FragColor = vec4(mix(horizon, top, k) * 1.15, 1.); }",
  });
  skyScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), skyEnvMat));
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 8), new THREE.MeshBasicMaterial());
  skyScene.add(glint);
  let skyEnv: THREE.WebGLRenderTarget | null = null;
  const rebuildSkyEnv = () => {
    skyEnvMat.uniforms.top.value.copy(T.sky[1]);
    skyEnvMat.uniforms.horizon.value.copy(T.sky[0]);
    glint.material.color.copy(T.sun.color).multiplyScalar(T.name === "night" ? 2.5 : 4);
    glint.position.set(...T.sun.pos).normalize().multiplyScalar(9);
    const pm = new THREE.PMREMGenerator(renderer);
    const next = pm.fromScene(skyScene, 0);
    pm.dispose();
    skyEnv?.dispose();
    skyEnv = next;
    return next.texture;
  };

  const wn = waterNormal(128);
  wn.repeat.set(2.4, 1.4);
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: T.water, roughness: 0.04, metalness: 0, normalMap: wn, normalScale: new THREE.Vector2(0.22, 0.22),
    envMap: rebuildSkyEnv(), envMapIntensity: T.waterEnv,
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(bath.w, bath.d), waterMat);
  const ripples = createRipples(renderer, bath.w / bath.d, low ? 96 : 128);
  if (ripples) {
    extras.push(ripples);
    waterMat.onBeforeCompile = (sh) => {
      sh.uniforms.uRip = ripples.tex;
      sh.uniforms.uRipTexel = { value: ripples.texel };
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vRipUv;")
        .replace("#include <uv_vertex>", "#include <uv_vertex>\nvRipUv = uv;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vRipUv;\nuniform sampler2D uRip;\nuniform vec2 uRipTexel;")
        .replace(
          "#include <normal_fragment_maps>",
          `#include <normal_fragment_maps>
          float rx = texture2D(uRip, vRipUv + vec2(uRipTexel.x, 0.0)).r - texture2D(uRip, vRipUv - vec2(uRipTexel.x, 0.0)).r;
          float ry = texture2D(uRip, vRipUv + vec2(0.0, uRipTexel.y)).r - texture2D(uRip, vRipUv - vec2(0.0, uRipTexel.y)).r;
          normal = normalize(normal + (viewMatrix * vec4(-rx * 6.0, 0.0, ry * 6.0, 0.0)).xyz);`,
        );
    };
  }
  water.rotation.x = -Math.PI / 2;
  water.position.set(bath.x, waterY, bath.z);
  water.receiveShadow = true;
  scene.add(water);
  animated.push((t) => wn.offset.set(t * 0.01, t * 0.006));

  // Spout: a bamboo pipe from the far coping, and its thin stream; its drips
  // feed the ripples every second or so.
  const spoutX = bath.x + bath.w / 2 - 0.25;
  let nextDrip = 0;
  animated.push((t, _cam, dt) => {
    if (!ripples || !dt) return;
    if (t > nextDrip) {
      ripples.drop((spoutX - (bath.x - bath.w / 2)) / bath.w, (bath.d - 0.2) / bath.d, 0.018, 0.018);
      nextDrip = t + 0.7 + Math.random() * 0.9;
    }
    ripples.step(dt);
  });
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.5, 14), M.bamboo);
  pipe.rotation.x = Math.PI / 2 - 0.2;
  pipe.position.set(spoutX, D + 0.42, bath.z - bath.d / 2 - 0.05);
  pipe.castShadow = true;
  scene.add(pipe);
  const pipePost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.55, 14), M.bambooDry);
  pipePost.position.set(spoutX, D + 0.27, bath.z - bath.d / 2 - 0.3);
  pipePost.castShadow = true;
  scene.add(pipePost);
  // A continuous ribbon whose brightness varies slowly along its length; a
  // dashed texture read as a UI line in a still frame.
  const streamTex = canvasTex(8, 128, (c, w, h) => {
    for (let y = 0; y < h; y++) {
      const a = 0.6 + 0.22 * Math.sin((y / h) * Math.PI * 6) + 0.12 * Math.sin((y / h) * Math.PI * 22);
      const g = c.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.5, `rgba(255,255,255,${a.toFixed(3)})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g;
      c.fillRect(0, y, w, 1);
    }
  });
  streamTex.wrapT = THREE.RepeatWrapping;
  streamTex.repeat.set(1, 2);
  const stream = new THREE.Mesh(new THREE.PlaneGeometry(0.022, 0.4), new THREE.MeshBasicMaterial({ map: streamTex, transparent: true, opacity: 0.5, depthWrite: false, color: 0xe8f2f2 }));
  stream.position.set(spoutX, D + 0.2, bath.z - bath.d / 2 + 0.2);
  scene.add(stream);
  animated.push((t, cam) => {
    streamTex.offset.y = -t * 1.4;
    stream.quaternion.copy(cam.quaternion);
  });

  // Steam: eight slow billboards, the game's one exception to "no particles".
  const steam: THREE.Sprite[] = [];
  const steamAt: { phase: number; x: number; z: number }[] = [];
  for (let i = 0; i < 8; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex.steam, transparent: true, depthWrite: false, opacity: 0, color: T.steam }));
    steamAt.push({ phase: i / 8, x: bath.x + (rnd() - 0.5) * bath.w * 0.75, z: bath.z + (rnd() - 0.5) * bath.d * 0.6 });
    scene.add(s);
    steam.push(s);
  }
  animated.push((t) => {
    steam.forEach((s, i) => {
      const a = steamAt[i];
      const p = (t / 13 + a.phase) % 1;
      const k = Math.sin(Math.PI * p);
      s.position.set(a.x + Math.sin(t * 0.25 + a.phase * 9) * 0.1, waterY + 0.05 + p * 1.0, a.z);
      const sc = 0.4 + p * 0.9;
      s.scale.set(sc, sc, 1);
      s.material.opacity = T.steamOp * k * k;
    });
  });

  await breathe();

  // The planted bed along the wall: moss, lantern, boulders, maple.
  const bed = new THREE.Mesh(boxGeo(gx[1] - gx[0], 0.16, 0.95, 1.2, (gx[0] + gx[1]) / 2, D, wallZ + 0.47), M.moss);
  bed.receiveShadow = true;
  scene.add(bed);
  scene.add(new THREE.Mesh(boxGeo(gx[1] - gx[0], 0.2, 0.06, 0.6, (gx[0] + gx[1]) / 2, D, wallZ + 0.95), M.stoneDark));
  const BY = D + 0.08;
  const rockGeo = new THREE.IcosahedronGeometry(1, 4);
  const rp = rockGeo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < rp.count; i++) {
    v.fromBufferAttribute(rp, i);
    v.multiplyScalar(1 + 0.1 * Math.sin(v.x * 3.1 + v.y * 2.2) * Math.cos(v.z * 2.7) + 0.035 * Math.sin(v.y * 11.0 + v.x * 5.0));
    if (v.y < -0.15) v.y = -0.15 - (v.y + 0.15) * 0.2;
    rp.setXYZ(i, v.x, v.y, v.z);
  }
  rockGeo.computeVertexNormals();
  scene.add(instanced(rockGeo, M.stoneDark, [M4(-0.2, BY + 0.1, wallZ + 0.45, 0.6, 0.44, 0.3, 0.32), M4(0.25, BY + 0.05, wallZ + 0.62, 2.1, 0.2, 0.14, 0.18), M4(2.3, BY + 0.06, wallZ + 0.55, 1.2, 0.26, 0.19, 0.22)]));

  const lantern = new THREE.Group();
  lantern.position.set(-0.85, BY, wallZ + 0.5);
  const L = (geo: THREE.BufferGeometry, y: number, m: THREE.Material = M.stone) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.y = y;
    mesh.castShadow = mesh.receiveShadow = true;
    lantern.add(mesh);
  };
  L(new THREE.CylinderGeometry(0.17, 0.2, 0.1, 6), 0.05);
  L(new THREE.CylinderGeometry(0.06, 0.07, 0.55, 12), 0.37);
  L(new THREE.CylinderGeometry(0.16, 0.12, 0.08, 6), 0.68);
  const lanternGlow = new THREE.MeshStandardMaterial({ color: 0x8a867f, emissive: 0xffb36b, emissiveIntensity: Math.min(1.1, T.lantern / 2), roughness: 0.9 });
  L(new THREE.BoxGeometry(0.2, 0.18, 0.2), 0.81, lanternGlow);
  L(new THREE.ConeGeometry(0.27, 0.2, 6), 1.0);
  L(new THREE.SphereGeometry(0.04, 10, 8), 1.13);
  // The light always exists: a changing light count recompiles every shader.
  const lanternLight = new THREE.PointLight(0xffa860, T.lantern, 3.5, 2);
  lanternLight.position.y = 0.81;
  lantern.add(lanternLight);
  scene.add(lantern);

  const maple = new THREE.Group();
  maple.position.set(1.75, BY, wallZ + 0.5);
  maple.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, 0, 0], [0.12, 0.7, 0.05], [-0.05, 1.45, 0.02], [0.12, 2.05, -0.05]].map(V3)), 24, 0.045, 7), M.post));
  const leafGeo = new THREE.IcosahedronGeometry(1, 0);
  for (const [color, count] of [[0x7c2c1e, 190], [0x9a3d26, 120], [0x5b2519, 90]]) {
    const ms: THREE.Matrix4[] = [];
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * 0.9;
      const s = 0.03 + rnd() * 0.03;
      ms.push(M4(Math.cos(a) * r + 0.06, 1.5 + rnd() * 0.75 - r * r * 0.55, Math.sin(a) * r * 0.7, rnd() * 6, s, s * 0.5, s, rnd() * 3, rnd() * 3));
    }
    maple.add(instanced(leafGeo, new THREE.MeshStandardMaterial({ color, roughness: 0.75 }), ms));
  }
  scene.add(maple);

  // Silvered cedar wall: vertical boards weathered to a warm grey-taupe, one
  // instanced mesh. (Charred cedar read as a black hole in every light.)
  const boards: THREE.Matrix4[] = [];
  const wallH = 2.3;
  for (let x = gx[0]; x < gx[1] - 0.01; x += 0.16) boards.push(M4(x + 0.075, D + wallH / 2, wallZ - 0.03 + (rnd() - 0.5) * 0.01, 0, 0.15, wallH, 0.04));
  scene.add(instanced(new THREE.BoxGeometry(1, 1, 1), texMat(tex, "wood", { color: 0x8e867b, rough: 0.9, normal: 0.9 }), boards, { receive: true }));
  scene.add(new THREE.Mesh(boxGeo(gx[1] - gx[0], wallH, 0.02, 1, (gx[0] + gx[1]) / 2, D + wallH / 2, wallZ - 0.06), new THREE.MeshStandardMaterial({ color: 0x5f5951, roughness: 1 })));
  scene.add(new THREE.Mesh(boxGeo(gx[1] - gx[0], 0.05, 0.12, 1, (gx[0] + gx[1]) / 2, D + wallH + 0.025, wallZ - 0.03), M.post));

  await breathe();

  // Bamboo grove behind the wall. Stems and leaves sway a few centimetres in
  // the vertex shader, so the motion costs no extra draw calls.
  const swayMat = (m: THREE.MeshStandardMaterial, amp: number) => {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = clock;
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float uTime;").replace(
        "#include <project_vertex>",
        `vec4 mvPosition = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
mvPosition = instanceMatrix * mvPosition;
#endif
float hgt = clamp((mvPosition.y - ${(D + 1.0).toFixed(2)}) / 4.0, 0.0, 1.0);
float ph = mvPosition.x * 1.3 + mvPosition.z * 0.7;
mvPosition.x += sin(uTime * 0.45 + ph) * ${amp.toFixed(3)} * hgt * hgt;
mvPosition.z += cos(uTime * 0.37 + ph) * ${(amp * 0.5).toFixed(3)} * hgt * hgt;
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,
      );
    };
    return m;
  };
  animated.push((t) => (clock.value = t));
  const stems: THREE.Matrix4[] = [];
  const leaves: THREE.Matrix4[] = [];
  for (let i = 0; i < (low ? 34 : 52); i++) {
    const x = gx[0] - 0.2 + rnd() * (gx[1] - gx[0] + 0.4);
    const z = wallZ - 0.35 - rnd() * 1.1;
    const h = 3.4 + rnd() * 2.2;
    const r = 0.022 + rnd() * 0.016;
    stems.push(M4(x, D + h / 2, z, 0, r, h, r));
    for (let k = 0; k < 9; k++) {
      const y = D + h * (0.62 + rnd() * 0.4);
      const a = rnd() * Math.PI * 2;
      leaves.push(M4(x + Math.cos(a) * 0.22, y, z + Math.sin(a) * 0.22, a, 0.17, 0.02, 0.045, rnd() * 0.6 - 0.3, -0.4 - rnd() * 0.4));
    }
  }
  scene.add(instanced(new THREE.CylinderGeometry(1, 1, 1, 7), swayMat(new THREE.MeshStandardMaterial({ color: 0x6f7c45, roughness: 0.55 }), 0.08), stems, { receive: false }));
  scene.add(instanced(new THREE.OctahedronGeometry(1, 0), swayMat(new THREE.MeshStandardMaterial({ color: 0x46552f, roughness: 0.8, flatShading: true }), 0.08), leaves, { receive: false }));

  // Soft contact shadows under the furniture: the cheap kind of ambient
  // occlusion, a radial gradient on a plane.
  const blob = canvasTex(
    128,
    128,
    (c) => {
      const g = c.createRadialGradient(64, 64, 4, 64, 64, 64);
      g.addColorStop(0, "rgba(0,0,0,0.55)");
      g.addColorStop(0.55, "rgba(0,0,0,0.22)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, 128, 128);
    },
    false,
  );
  const blobMat = new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const blobs = (
    [
      // x, z, width, depth, height, turn
      [0, 0.15, 1.35, 1.35, 0.002, 0], // table
      [0, 0.98, 0.8, 0.85, 0.002, 0], // zabuton
      [0.02, -0.7, 0.8, 0.85, 0.002, 0],
      [1.25, 1.05, 0.55, 0.55, 0.002, 0], // andon
      [1.45, -1.45, 0.45, 0.4, 0.002, 0], // bonsai
      [tk.x1 + 0.35, -1.35, 0.46, 0.36, 0.002, 0.35], // lacquer box
      [0, 0.15, 0.42, 0.42, boardY + 0.0015, 0.12], // board
      [0.3, 0.36, 0.36, 0.26, boardY + 0.0015, -0.2], // tray
      [-0.27, 0.34, 0.22, 0.29, boardY + 0.0015, 0.18], // essay
      [0.29, -0.12, 0.12, 0.2, boardY + 0.0015, -0.4], // phone
      [-0.85, wallZ + 0.5, 0.7, 0.7, BY + 0.085, 0], // stone lantern
    ] as const
  ).map(([x, z, sx, sz, y, ry]) => {
    const g = new THREE.PlaneGeometry(sx, sz);
    g.rotateX(-Math.PI / 2);
    g.rotateY(ry);
    g.translate(x, y, z);
    return g;
  });
  const shadows = new THREE.Mesh(mergeGeometries(blobs), blobMat);
  shadows.renderOrder = 1;
  scene.add(shadows);

  // Sky: a gradient dome.
  const domeMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(T.sky[1]) }, horizon: { value: new THREE.Color(T.sky[0]) } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
    fragmentShader: "uniform vec3 top; uniform vec3 horizon; varying vec3 vP; void main(){ float k = smoothstep(-0.05, 0.6, vP.y); gl_FragColor = vec4(mix(horizon, top, k), 1.); }",
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(60, 24, 12), domeMat));

  // Light.
  const hemi = new THREE.HemisphereLight(T.hemi[0], T.hemi[1], T.hemi[2]);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(T.sun.color, T.sun.intensity);
  sun.position.set(...T.sun.pos);
  sun.target.position.set(0, 0, -1);
  scene.add(sun, sun.target);
  sun.castShadow = true;
  sun.shadow.mapSize.set(low ? 1024 : 2048, low ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -4.5, right: 4.5, top: 4.5, bottom: -4.5, near: 0.5, far: 18 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 3;

  let envPhase: number | null = null;
  const setPhase = (next: number) => {
    T = blendTime(next);
    fog.color.copy(T.fog[0]);
    fog.near = T.fog[1];
    fog.far = T.fog[2];
    scene.environmentIntensity = T.env;
    hemi.color.copy(T.hemi[0]);
    hemi.groundColor.copy(T.hemi[1]);
    hemi.intensity = T.hemi[2];
    sun.color.copy(T.sun.color);
    sun.intensity = T.sun.intensity;
    sun.position.set(...T.sun.pos);
    M.washi.emissiveIntensity = T.washiGlow;
    shojiMat.emissiveIntensity = T.washiGlow;
    kage.value = T.kage;
    shadeMat.emissiveIntensity = T.shade;
    lanternGlow.emissiveIntensity = Math.min(1.1, T.lantern / 2);
    lanternLight.intensity = T.lantern;
    waterMat.color.copy(T.water);
    waterMat.envMapIntensity = T.waterEnv;
    for (const st of steam) st.material.color.copy(T.steam);
    domeMat.uniforms.top.value.copy(T.sky[1]);
    domeMat.uniforms.horizon.value.copy(T.sky[0]);
    reshadow();
    if (envPhase === null || Math.abs(next - envPhase) > 0.08) {
      waterMat.envMap = rebuildSkyEnv();
      envPhase = next;
    }
  };

  // Rim strength eases toward its target; the andon breathes very slightly.
  animated.push((t, _cam, dt) => {
    const k = dt ? 1 - Math.exp(-dt * 8) : 1;
    for (const o of Object.values(objects)) o.rim.value += (o.want - o.rim.value) * k;
    andonLight.intensity = T.andon * (1 + 0.025 * Math.sin(t * 7.1) * Math.sin(t * 3.3 + 1.0));
  });

  return {
    scene,
    anchors,
    water,
    get timeName() {
      return T.name;
    },
    setPhase,
    highlight(key) {
      for (const [k, o] of Object.entries(objects)) o.want = k === key ? 1 : 0;
    },
    dropBead,
    rippleAt(uv, strength = 0.05) {
      ripples?.drop(uv.x, uv.y, strength, 0.035);
    },
    update(t, camera, dt = 0) {
      for (const f of animated) f(t, camera, dt);
    },
    // Everything the room made on the GPU: geometries, materials, textures,
    // render targets and environment maps.
    dispose() {
      const seen = new Set<{ dispose(): void }>();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) seen.add(mesh.geometry);
        const mats = mesh.material ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : [];
        for (const m of mats) {
          seen.add(m);
          for (const value of Object.values(m)) if (value instanceof THREE.Texture) seen.add(value);
        }
      });
      for (const t of Object.values(tex)) seen.add(t);
      for (const d of seen) d.dispose();
      skyEnv?.dispose();
      skyEnvMat.dispose();
      for (const e of extras) e.dispose();
      sun.shadow.map?.dispose();
    },
  };
}
