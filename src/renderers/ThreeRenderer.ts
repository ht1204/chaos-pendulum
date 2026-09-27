/**
 * Three.js 3D renderer.
 *
 * Loaded exclusively through dynamic import() so Three.js stays out of the
 * initial bundle. Physics coordinates (y-down canvas space) are mapped to
 * Three.js space with y flipped so the pendulum hangs downward on screen.
 *
 * dispose() implements the full WebGL teardown checklist: geometries,
 * materials, controls.dispose(), renderer.dispose() and
 * renderer.forceContextLoss().
 */
import { STRIDE } from "@/physics/types";
import type { IRenderer, RendererOptions } from "./IRenderer";
import { TrailBuffer } from "./TrailBuffer";

type THREE = typeof import("three");
type ThreeMesh = import("three").Mesh;
type ThreeLine = import("three").Line;
type ThreeGeometry = import("three").BufferGeometry;
type ThreeMaterial = import("three").Material;
type OrbitControlsCtor = new (
  camera: import("three").Camera,
  domElement: HTMLElement
) => import("three/examples/jsm/controls/OrbitControls.js").OrbitControls;

const BG: Record<string, number> = { dark: 0x0a0a0f, light: 0xf0f0f8 };
const ROD: Record<string, number> = { dark: 0xc8c8dc, light: 0x3c3c50 };

interface Ghost3D {
  trail: TrailBuffer;
  line: ThreeLine;
  geometry: ThreeGeometry;
  bob: ThreeMesh;
}

interface Main3D {
  trail: TrailBuffer;
  line: ThreeLine;
  geometry: ThreeGeometry;
  rod1: ThreeMesh;
  rod2: ThreeMesh;
  bob1: ThreeMesh;
  bob2: ThreeMesh;
  rodMaterial: import("three").MeshStandardMaterial;
  bobMaterial: import("three").MeshStandardMaterial;
}

export class ThreeRenderer implements IRenderer {
  private readonly THREE: THREE;
  private readonly OrbitControls: OrbitControlsCtor;
  private readonly renderer: import("three").WebGLRenderer;
  private readonly scene: import("three").Scene;
  private readonly camera: import("three").PerspectiveCamera;
  private readonly controls: import("three/examples/jsm/controls/OrbitControls.js").OrbitControls;
  private readonly lights: import("three").Light[] = [];

  private readonly tmpColor: import("three").Color;
  private readonly tmpDir: import("three").Vector3;
  private readonly tmpUp: import("three").Vector3;

  private size = 0;
  private pendulumCount = 0;
  private main: Main3D | null = null;
  private ghosts: Ghost3D[] = [];
  private ghostBobMaterial: import("three").MeshStandardMaterial | null = null;
  private options: RendererOptions;
  private disposed = false;

  private constructor(
    three: THREE,
    OrbitControls: OrbitControlsCtor,
    canvas: HTMLCanvasElement,
    options: RendererOptions
  ) {
    this.THREE = three;
    this.OrbitControls = OrbitControls;
    this.options = options;

    this.tmpColor = new three.Color();
    this.tmpDir = new three.Vector3();
    this.tmpUp = new three.Vector3(0, 1, 0);

    this.renderer = new three.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setClearColor(BG[options.theme]);

    this.scene = new three.Scene();
    this.camera = new three.PerspectiveCamera(50, 1, 1, 10000);

    const ambient = new three.AmbientLight(0xffffff, 0.9);
    const directional = new three.DirectionalLight(0xffffff, 0.8);
    directional.position.set(300, -400, 500);
    this.lights.push(ambient, directional);
    this.scene.add(ambient, directional);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
  }

  static async create(
    canvas: HTMLCanvasElement,
    options: RendererOptions
  ): Promise<ThreeRenderer> {
    const three = await import("three");
    const { OrbitControls } = await import(
      "three/examples/jsm/controls/OrbitControls.js"
    );
    return new ThreeRenderer(three, OrbitControls, canvas, options);
  }

  resize(width: number, height: number): void {
    const size = Math.min(width, height);
    this.size = size;
    this.camera.aspect = 1;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(
      Math.min(
        typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
        2
      )
    );
    this.renderer.setSize(size, size, false);
    // setSize(..., false) skips style updates — set CSS size explicitly.
    this.renderer.domElement.style.width = `${size}px`;
    this.renderer.domElement.style.height = `${size}px`;
    this.camera.position.set(0, 0, size * 1.35);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.draw();
  }

  setOptions(options: RendererOptions): void {
    const trailChanged = options.trailLength !== this.options.trailLength;
    const themeChanged = options.theme !== this.options.theme;
    this.options = options;
    if (themeChanged) {
      this.renderer.setClearColor(BG[options.theme]);
      if (this.main) this.main.rodMaterial.color.setHex(ROD[options.theme]);
    }
    if (this.main) {
      this.main.bobMaterial.color.set(options.color);
      this.main.bobMaterial.emissive.copy(
        this.tmpColor.set(options.color).multiplyScalar(0.15)
      );
    }
    if (this.ghostBobMaterial) {
      this.ghostBobMaterial.color.set(options.color);
    }
    if (trailChanged) this.rebuildTrails();
    this.draw();
  }

  render(frames: Float32Array, pendulumCount: number, steps: number): void {
    if (this.pendulumCount !== pendulumCount) {
      this.pendulumCount = pendulumCount;
      this.rebuildTrails();
    }

    for (let s = 0; s < steps; s++) {
      for (let p = 0; p < pendulumCount; p++) {
        const base = (s * pendulumCount + p) * STRIDE;
        if (p === 0 && this.main) {
          this.main.trail.push(frames[base + 6], frames[base + 7]);
          this.applyMainPose(
            frames[base + 4],
            frames[base + 5],
            frames[base + 6],
            frames[base + 7]
          );
        } else if (p > 0) {
          const ghost = this.ghosts[p - 1];
          if (ghost) {
            ghost.trail.push(frames[base + 6], frames[base + 7]);
            this.applyGhostPose(ghost, frames[base + 6], frames[base + 7]);
          }
        }
      }
    }

    if (this.main) this.updateTrailLine(this.main, pendulumCount, 0);
    this.ghosts.forEach((ghost, i) =>
      this.updateTrailLine(ghost, pendulumCount, i + 1)
    );

    this.draw();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.controls.dispose();

    if (this.main) {
      const m = this.main;
      this.scene.remove(m.line, m.rod1, m.rod2, m.bob1, m.bob2);
      m.geometry.dispose();
      (m.line.material as ThreeMaterial).dispose();
      m.rod1.geometry.dispose();
      m.rod2.geometry.dispose();
      m.bob1.geometry.dispose();
      m.bob2.geometry.dispose();
      m.rodMaterial.dispose();
      m.bobMaterial.dispose();
      this.main = null;
    }

    for (const ghost of this.ghosts) {
      this.scene.remove(ghost.line, ghost.bob);
      ghost.geometry.dispose();
      (ghost.line.material as ThreeMaterial).dispose();
      (ghost.bob.material as ThreeMaterial).dispose();
      ghost.bob.geometry.dispose();
    }
    this.ghosts = [];
    this.ghostBobMaterial?.dispose();

    for (const light of this.lights) light.dispose();

    this.renderer.dispose();
    // Release the WebGL context itself so repeated
    // 2D↔3D swaps never leak contexts.
    this.renderer.forceContextLoss();
  }

  /** Map canvas-space (y-down) to Three.js space (y-up, centered). */
  private map(x: number, y: number): [number, number, number] {
    return [x - this.size / 2, -(y - this.size / 2), 0];
  }

  private disposeGhosts(): void {
    for (const ghost of this.ghosts) {
      this.scene.remove(ghost.line, ghost.bob);
      ghost.geometry.dispose();
      (ghost.line.material as ThreeMaterial).dispose();
      (ghost.bob.material as ThreeMaterial).dispose();
      ghost.bob.geometry.dispose();
    }
    this.ghosts = [];
  }

  private rebuildTrails(): void {
    const three = this.THREE;
    const { trailLength, color } = this.options;
    const count = Math.max(this.pendulumCount, 1);

    if (this.main) {
      const m = this.main;
      this.scene.remove(m.line, m.rod1, m.rod2, m.bob1, m.bob2);
      m.geometry.dispose();
      (m.line.material as ThreeMaterial).dispose();
      m.rod1.geometry.dispose();
      m.rod2.geometry.dispose();
      m.bob1.geometry.dispose();
      m.bob2.geometry.dispose();
      m.rodMaterial.dispose();
      m.bobMaterial.dispose();
      this.main = null;
    }
    this.disposeGhosts();
    this.ghostBobMaterial?.dispose();
    this.ghostBobMaterial = null;

    const rodMaterial = new three.MeshStandardMaterial({
      color: ROD[this.options.theme],
      roughness: 0.5,
      metalness: 0.1,
    });
    const bobMaterial = new three.MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.15,
      emissive: new three.Color(color).multiplyScalar(0.15),
    });
    const rodGeometry = new three.CylinderGeometry(2.4, 2.4, 1, 12);
    const bobGeometry = new three.SphereGeometry(1, 20, 14);

    const buildLine = (ghostAlpha: number): { line: ThreeLine; geometry: ThreeGeometry } => {
      const geometry = new three.BufferGeometry();
      geometry.setAttribute(
        "position",
        new three.BufferAttribute(new Float32Array(trailLength * 3), 3)
      );
      // 4-component colors give per-vertex alpha fade (t² ramp like 2D).
      geometry.setAttribute(
        "color",
        new three.BufferAttribute(new Float32Array(trailLength * 4), 4)
      );
      geometry.setDrawRange(0, 0);
      const material = new three.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
      });
      material.userData.ghostAlpha = ghostAlpha;
      const line = new three.Line(geometry, material);
      line.frustumCulled = false;
      return { line, geometry };
    };

    const mainLine = buildLine(1);
    this.main = {
      trail: new TrailBuffer(trailLength),
      line: mainLine.line,
      geometry: mainLine.geometry,
      rod1: new three.Mesh(rodGeometry, rodMaterial),
      rod2: new three.Mesh(rodGeometry, rodMaterial),
      bob1: new three.Mesh(bobGeometry, bobMaterial),
      bob2: new three.Mesh(bobGeometry, bobMaterial),
      rodMaterial,
      bobMaterial,
    };
    this.scene.add(
      mainLine.line,
      this.main.rod1,
      this.main.rod2,
      this.main.bob1,
      this.main.bob2
    );

    if (count > 1) {
      this.ghostBobMaterial = new three.MeshStandardMaterial({
        color,
        roughness: 0.5,
        transparent: true,
        opacity: 0.45,
      });
      const ghostBobGeometry = new three.SphereGeometry(5, 12, 8);
      for (let i = 1; i < count; i++) {
        const built = buildLine(0.25 + 0.6 * (i / (count - 1)));
        const bob = new three.Mesh(ghostBobGeometry, this.ghostBobMaterial);
        this.ghosts.push({
          trail: new TrailBuffer(trailLength),
          line: built.line,
          geometry: built.geometry,
          bob,
        });
        this.scene.add(built.line, bob);
      }
    }
  }

  private applyMainPose(x1: number, y1: number, x2: number, y2: number): void {
    const m = this.main;
    if (!m) return;
    const pivot = this.map(this.size / 2, this.size / 2);
    const p1 = this.map(x1, y1);
    const p2 = this.map(x2, y2);

    this.placeRod(m.rod1, pivot, p1);
    this.placeRod(m.rod2, p1, p2);

    m.bob1.position.set(p1[0], p1[1], p1[2]);
    m.bob1.scale.setScalar(4 + Math.sqrt(this.options.m1) * 0.8);
    m.bob2.position.set(p2[0], p2[1], p2[2]);
    m.bob2.scale.setScalar(4 + Math.sqrt(this.options.m2) * 0.8);
  }

  private applyGhostPose(ghost: Ghost3D, x2: number, y2: number): void {
    const p2 = this.map(x2, y2);
    ghost.bob.position.set(p2[0], p2[1], p2[2]);
  }

  private placeRod(
    rod: ThreeMesh,
    a: readonly [number, number, number],
    b: readonly [number, number, number]
  ): void {
    this.tmpDir.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const length = this.tmpDir.length();
    if (length < 1e-9) return;
    this.tmpDir.divideScalar(length);
    rod.quaternion.setFromUnitVectors(this.tmpUp, this.tmpDir);
    rod.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    rod.scale.set(1, length, 1);
  }

  private updateTrailLine(
    owner: { trail: TrailBuffer; geometry: ThreeGeometry },
    total: number,
    index: number
  ): void {
    const trail = owner.trail;
    const count = trail.count;
    if (count < 2) {
      owner.geometry.setDrawRange(0, 0);
      return;
    }
    const positions = owner.geometry.getAttribute(
      "position"
    ) as import("three").BufferAttribute;
    const colors = owner.geometry.getAttribute(
      "color"
    ) as import("three").BufferAttribute;
    const ghostAlpha =
      total > 1 && index > 0 ? 0.25 + 0.6 * (index / (total - 1)) : 1;
    const c = this.tmpColor.set(this.options.color);

    for (let i = 0; i < count; i++) {
      const [x, y] = trail.get(i);
      const [mx, my, mz] = this.map(x, y);
      positions.setXYZ(i, mx, my, mz);
      const t = (i + 1) / count;
      colors.setXYZW(i, c.r, c.g, c.b, t * t * ghostAlpha);
    }
    positions.needsUpdate = true;
    colors.needsUpdate = true;
    owner.geometry.setDrawRange(0, count);
  }

  private draw(): void {
    if (this.disposed || this.size <= 0) return;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

/** Async factory — the ONLY sanctioned way to build a ThreeRenderer. */
export function createThreeRenderer(
  canvas: HTMLCanvasElement,
  options: RendererOptions
): Promise<IRenderer> {
  return ThreeRenderer.create(canvas, options);
}
