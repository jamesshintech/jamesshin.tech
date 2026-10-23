"use client";

import { useEffect, useRef, useState } from "react";
import type { Loop } from "@/data/projects";
import { VideoLoop } from "./VideoLoop";

// The real Yonmoku board (public/models/yonmoku.glb, exported from the
// game's Unity project). The gameplay loop fills the frame until the model
// is wanted: on click, or, when `auto` is set, once the frame is visible
// and the browser is idle after first paint. three.js is imported only
// then, so it never sits in the initial bundle. With `scrollPose`, the
// camera's azimuth follows the page scroll (the one authored moment); drag
// still orbits, and the first drag takes over from the scroll.

const MODEL_URL = "/models/yonmoku.glb";

type State = "idle" | "loading" | "ready" | "failed";

export function BoardViewer({ loop, auto = false, scrollPose = false }: { loop: Loop; auto?: boolean; scrollPose?: boolean }) {
  const [state, setState] = useState<State>("idle");
  const mountRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<() => void>(() => {});
  const startRef = useRef<() => void>(() => {});

  useEffect(() => () => cleanupRef.current(), []);

  async function start() {
    const mount = mountRef.current;
    if (!mount || state !== "idle") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches && auto && !userAsked.current) return;
    setState("loading");
    try {
      const [THREE, { GLTFLoader }, { OrbitControls }] = await Promise.all([
        import("three"),
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("three/examples/jsm/controls/OrbitControls.js"),
      ]);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.shadowMap.enabled = true;
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, mount.clientWidth / mount.clientHeight, 0.1, 100);
      scene.add(new THREE.HemisphereLight(0xf6efe0, 0x2a1f18, 1.1));
      const sun = new THREE.DirectionalLight(0xfff1dc, 2.2);
      sun.position.set(6, 10, 4);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      scene.add(sun);

      const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
      const model = gltf.scene;
      model.traverse((o) => {
        const mesh = o as import("three").Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      scene.add(model);
      const boardMesh = model.getObjectByName("Board") ?? model;
      const box = new THREE.Box3().setFromObject(boardMesh);
      const centre = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3()).length();
      const target = centre.clone().add(new THREE.Vector3(0, 1.1, 0));
      camera.position.copy(target).add(new THREE.Vector3(0.95, 0.72, 0.95).multiplyScalar(size * 1.05));

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = size * 0.6;
      controls.maxDistance = size * 2.4;
      controls.minPolarAngle = Math.PI * 0.12;
      controls.maxPolarAngle = Math.PI * 0.46;
      controls.target.copy(target);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let scrollDriven = scrollPose && !reduced;
      controls.autoRotate = !reduced && !scrollDriven;
      controls.autoRotateSpeed = 0.6;
      controls.addEventListener("start", () => {
        controls.autoRotate = false;
        scrollDriven = false;
      });

      // Scroll pose: the azimuth follows how far the hero has scrolled.
      const baseAzimuth = controls.getAzimuthalAngle();
      const onScroll = () => {
        if (!scrollDriven) return;
        const hero = mount.closest(".hero") as HTMLElement | null;
        if (!hero) return;
        const rect = hero.getBoundingClientRect();
        const span = Math.max(1, rect.height - window.innerHeight);
        const p = Math.min(1, Math.max(0, -rect.top / span));
        const angle = baseAzimuth + p * Math.PI * 1.5;
        const r = camera.position.distanceTo(controls.target);
        const polar = controls.getPolarAngle();
        camera.position.set(
          controls.target.x + r * Math.sin(polar) * Math.sin(angle),
          controls.target.y + r * Math.cos(polar),
          controls.target.z + r * Math.sin(polar) * Math.cos(angle)
        );
        camera.lookAt(controls.target);
      };
      window.addEventListener("scroll", onScroll, { passive: true });

      let raf = 0;
      let visible = true;
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
      });
      io.observe(mount);
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!visible) return;
        if (!scrollDriven) controls.update();
        renderer.render(scene, camera);
      };
      tick();

      const onResize = () => {
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
      };
      window.addEventListener("resize", onResize);

      cleanupRef.current = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", onScroll);
        controls.dispose();
        renderer.dispose();
        scene.traverse((o) => {
          const mesh = o as import("three").Mesh;
          if (mesh.isMesh) {
            mesh.geometry.dispose();
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const m of mats) m.dispose();
          }
        });
        renderer.domElement.remove();
      };
      setState("ready");
    } catch (err) {
      console.error("board viewer", err);
      setState("failed");
    }
  }
  startRef.current = start;
  const userAsked = useRef(false);

  // Auto mode: load once visible and the browser is idle.
  useEffect(() => {
    if (!auto) return;
    const mount = mountRef.current;
    if (!mount) return;
    let idle = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
      const kick = () => startRef.current();
      idle = w.requestIdleCallback ? w.requestIdleCallback(kick, { timeout: 4000 }) : window.setTimeout(kick, 1500);
    });
    io.observe(mount);
    return () => {
      io.disconnect();
      if (idle) {
        const w = window as Window & { cancelIdleCallback?: (id: number) => void };
        if (w.cancelIdleCallback) w.cancelIdleCallback(idle);
        else clearTimeout(idle);
      }
    };
  }, [auto]);

  return (
    <div className="key viewer" data-state={state} style={{ aspectRatio: "4 / 3" }}>
      <div ref={mountRef} className="viewer-mount" role="img" aria-label="The Yonmoku board. Drag to orbit, scroll or pinch to zoom." />
      {state !== "ready" && (
        <div className="viewer-poster">
          <VideoLoop loop={loop} className="fill" priority />
        </div>
      )}
      <div className="tag">
        <span>Key art · the real board, from the game&apos;s Unity project</span>
        {state === "idle" && (
          <button
            type="button"
            onClick={() => {
              userAsked.current = true;
              start();
            }}
          >
            Spin it ↻
          </button>
        )}
        {state === "loading" && <span>Loading the model…</span>}
        {state === "ready" && <span>Drag to orbit</span>}
        {state === "failed" && <span>3D unavailable here</span>}
      </div>
    </div>
  );
}
