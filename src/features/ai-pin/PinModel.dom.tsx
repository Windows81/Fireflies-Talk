"use dom";

import { useEffect, useRef } from "react";
import type { DOMProps } from "expo/dom";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

function createPinBodyGeometry() {
  const points: THREE.Vector2[] = [];
  const capSegments = 32;
  const radius = 1;
  const straightHalf = 1.24;
  for (let index = 0; index < capSegments; index += 1) {
    const angle = (Math.PI * index) / (capSegments - 1);
    points.push(
      new THREE.Vector2(
        Math.cos(angle) * radius,
        straightHalf + Math.sin(angle) * radius,
      ),
    );
  }
  for (let index = 0; index < capSegments; index += 1) {
    const angle = Math.PI + (Math.PI * index) / (capSegments - 1);
    points.push(
      new THREE.Vector2(
        Math.cos(angle) * radius,
        -straightHalf + Math.sin(angle) * radius,
      ),
    );
  }

  const rings = [
    { scale: 0.94, z: -0.43 },
    { scale: 1, z: -0.31 },
    { scale: 1, z: 0.04 },
    { scale: 0.98, z: 0.16 },
    { scale: 0.92, z: 0.26 },
    { scale: 0.86, z: 0.32 },
    { scale: 0.84, z: 0.35 },
  ];
  const positions: number[] = [];
  const indices: number[] = [];
  rings.forEach((ring) => {
    points.forEach((point) => {
      positions.push(point.x * ring.scale, point.y * ring.scale, ring.z);
    });
  });

  const pointCount = points.length;
  for (let ring = 0; ring < rings.length - 1; ring += 1) {
    const lower = ring * pointCount;
    const upper = (ring + 1) * pointCount;
    for (let index = 0; index < pointCount; index += 1) {
      const next = (index + 1) % pointCount;
      indices.push(
        lower + index,
        lower + next,
        upper + index,
        lower + next,
        upper + next,
        upper + index,
      );
    }
  }

  const backCenter = positions.length / 3;
  positions.push(0, 0, rings[0].z);
  const frontCenter = positions.length / 3;
  positions.push(0, 0, 0.35);
  const frontOffset = (rings.length - 1) * pointCount;
  for (let index = 0; index < pointCount; index += 1) {
    const next = (index + 1) % pointCount;
    indices.push(next, index, backCenter);
    indices.push(frontOffset + index, frontOffset + next, frontCenter);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createCapsuleFaceGeometry(straightHalf = 1.24) {
  const shape = new THREE.Shape();
  shape.absarc(0, straightHalf, 1, 0, Math.PI, false);
  shape.lineTo(-1, -straightHalf);
  shape.absarc(0, -straightHalf, 1, Math.PI, Math.PI * 2, false);
  shape.lineTo(1, straightHalf);
  return new THREE.ShapeGeometry(shape, 32);
}

export default function PinModel({
  active = false,
}: {
  active?: boolean;
  dom?: DOMProps;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0.15, 10.4);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const pin = new THREE.Group();
    const shell = new THREE.Mesh(
      createPinBodyGeometry(),
      new THREE.MeshPhysicalMaterial({
        color: 0x3f403e,
        metalness: 0.42,
        roughness: 0.38,
        clearcoat: 0.48,
        clearcoatRoughness: 0.3,
      }),
    );
    pin.add(shell);

    const backPlateMaterial = new THREE.MeshStandardMaterial({
      color: 0x111211,
      metalness: 0.08,
      roughness: 0.58,
      side: THREE.DoubleSide,
    });
    const backPlate = new THREE.Mesh(
      createCapsuleFaceGeometry(),
      backPlateMaterial,
    );
    backPlate.scale.setScalar(0.84);
    backPlate.position.z = -0.438;
    pin.add(backPlate);

    const contactMaterial = new THREE.MeshStandardMaterial({
      color: 0xb8a57a,
      metalness: 0.7,
      roughness: 0.28,
      side: THREE.DoubleSide,
    });
    [-0.36, -0.12, 0.12, 0.36].forEach((x) => {
      const contact = new THREE.Mesh(
        new THREE.CircleGeometry(0.075, 24),
        contactMaterial,
      );
      contact.position.set(x, 1.22, -0.442);
      pin.add(contact);
    });

    const apertureMaterial = new THREE.MeshStandardMaterial({
      color: active ? 0x9f1d18 : 0x030403,
      emissive: active ? 0x6f0905 : 0x000000,
      emissiveIntensity: active ? 1.1 : 0,
      roughness: 0.7,
    });
    const micMaterial = new THREE.MeshStandardMaterial({
      color: 0x030403,
      roughness: 0.75,
    });
    const upperMic = new THREE.Mesh(
      new THREE.CircleGeometry(0.022, 20),
      micMaterial,
    );
    upperMic.position.set(-0.12, 1.36, 0.354);
    pin.add(upperMic);
    const indicatorRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.105, 0.012, 10, 36),
      micMaterial,
    );
    indicatorRing.position.set(0.18, -1.35, 0.353);
    pin.add(indicatorRing);
    const lowerIndicator = new THREE.Mesh(
      new THREE.CircleGeometry(0.026, 20),
      apertureMaterial,
    );
    lowerIndicator.position.set(0.18, -1.35, 0.354);
    pin.add(lowerIndicator);

    const buttonMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x111210,
      metalness: 0.22,
      roughness: 0.44,
      clearcoat: 0.35,
    });
    const recordButton = new THREE.Mesh(
      new RoundedBoxGeometry(0.15, 0.62, 0.32, 6, 0.07),
      buttonMaterial,
    );
    recordButton.position.set(1.06, 0.4, -0.04);
    pin.add(recordButton);
    const recordDotMaterial = new THREE.MeshStandardMaterial({
      color: 0xe05a2b,
      emissive: 0x5b1205,
      emissiveIntensity: 0.45,
      roughness: 0.42,
      side: THREE.DoubleSide,
    });
    const recordDot = new THREE.Mesh(
      new THREE.CircleGeometry(0.055, 24),
      recordDotMaterial,
    );
    recordDot.rotation.y = Math.PI / 2;
    recordDot.position.set(1.145, 0.4, -0.04);
    pin.add(recordDot);
    const powerSwitch = new THREE.Mesh(
      new RoundedBoxGeometry(0.16, 0.44, 0.3, 6, 0.07),
      buttonMaterial,
    );
    powerSwitch.position.set(1.06, -0.5, -0.04);
    pin.add(powerSwitch);

    scene.add(pin);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x151614, 2.4));
    const key = new THREE.DirectionalLight(0xffffff, 3.8);
    key.position.set(-3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xb7adff, 2.4);
    rim.position.set(4, -1, 2);
    scene.add(rim);

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let frame = 0;
    const startedAt = performance.now();
    const animate = (now: number) => {
      const elapsed = (now - startedAt) / 1000;
      pin.rotation.y = -0.48 + elapsed * 0.32;
      pin.rotation.x = Math.sin(elapsed * 0.45) * 0.06 - 0.12;
      pin.rotation.z = -0.16;
      pin.position.y = Math.sin(elapsed * 0.8) * 0.06;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.dispose();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => material.dispose());
      });
    };
  }, [active]);

  return (
    <main>
      <canvas ref={canvasRef} aria-label="Fireflies AI Pin" />
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root, main { width: 100%; height: 100%; margin: 0; overflow: hidden; background: transparent; }
        canvas { display: block; width: 100%; height: 100%; touch-action: none; }
      `}</style>
    </main>
  );
}
