"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Frame as FrameData } from "@/data/projects";

// The real Yonmoku board: geometry and textures exported from the game's
// Unity project to public/models/yonmoku.glb. Nothing 3D loads until the
// visitor asks for it; the poster is the App Store frame. On click, three.js
// and the model are fetched, then: drag to orbit, wheel or pinch to zoom.

const MODEL_URL = "/models/yonmoku.glb";

type State = "idle" | "loading" | "ready" | "failed";

export function BoardViewer({ poster }: { poster: FrameData }) {
  const [state, setState] = useState<State>("idle");
  const mountRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<() => void>(() => {});

  useEffect(() => () => cleanupRef.current(), []);

  async function start() {
    const mount = mountRef.current;
    if (!mount || state !== "idle") return;
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
      // The game's home pose: 32° pitch, looking at the board centre.
      camera.position.set(7.5, 6.2, 7.5);

      const sky = new THREE.HemisphereLight(0xf6efe0, 0x2a1f18, 1.1);
      scene.add(sky);
      const sun = new THREE.DirectionalLight(0xfff1dc, 2.2);
      sun.position.set(6, 10, 4);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      scene.add(sun);
      scene.add(new THREE.AmbientLight(0xd9a441, 0.15));

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
      // Orbit around the board (the mesh named after its material), not the
      // table underneath it, and frame the pegs from the game's home pitch.
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
      controls.autoRotate = !reduced;
      controls.autoRotateSpeed = 0.6;
      controls.addEventListener("start", () => {
        controls.autoRotate = false;
      });

      let raf = 0;
      let visible = true;
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
      });
      io.observe(mount);
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!visible) return;
        controls.update();
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

  return (
    <div className="viewer" data-state={state}>
      <div ref={mountRef} className="viewer-mount" aria-label="The Yonmoku board. Drag to orbit, scroll or pinch to zoom." role="img" />
      {state !== "ready" && (
        <Image src={poster.src} width={poster.width} height={poster.height} alt={poster.alt} unoptimized className="frame viewer-poster" sizes="(max-width: 860px) 100vw, 620px" />
      )}
      {state !== "ready" && (
        <button type="button" className="btn solid viewer-btn" onClick={start} disabled={state === "loading"}>
          {state === "idle" && "Spin the real board ↻"}
          {state === "loading" && "Loading the model…"}
          {state === "failed" && "3D is unavailable here"}
        </button>
      )}
    </div>
  );
}
