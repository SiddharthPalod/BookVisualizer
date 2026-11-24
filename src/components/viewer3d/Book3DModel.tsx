'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BookWithDetails } from '@/types';
import { generateSpineCanvas } from '@/lib/utils/spine-generator';
import { useBookshelfStore } from '@/lib/store/bookshelf-store';

interface Book3DModelProps {
  book: BookWithDetails;
}

// Smooth easeInOutCubic for organic, gradual acceleration and soft landing
function easeInOutCubic(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

function easeOutCubic(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - c, 3);
}

export function Book3DModel({ book }: Book3DModelProps) {
  const { clickOrigin } = useBookshelfStore();
  const { camera, size } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const animTimeRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Compute 100% mathematically exact 3D start coordinates using camera.unproject
  const { startX, startY } = useMemo(() => {
    if (!clickOrigin || size.width === 0 || size.height === 0) {
      return { startX: 0, startY: -1.2 };
    }
    const cx = clickOrigin.x + clickOrigin.width / 2;
    const cy = clickOrigin.y + clickOrigin.height / 2;

    const ndcX = (cx / size.width) * 2 - 1;
    const ndcY = -(cy / size.height) * 2 + 1;

    const rayTarget = new THREE.Vector3(ndcX, ndcY, 0.5);
    rayTarget.unproject(camera);

    const rayDir = rayTarget.sub(camera.position).normalize();

    const targetZ = -2.4;
    const tDist = (targetZ - camera.position.z) / rayDir.z;

    const worldX = camera.position.x + rayDir.x * tDist;
    const worldY = camera.position.y + rayDir.y * tDist;

    return { startX: worldX, startY: worldY };
  }, [clickOrigin, camera, size.width, size.height]);

  // Subtle mouse tilt tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      mouseRef.current = { x, y };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Realistic book proportions
  const { width, height, depth } = useMemo(() => {
    const pages = book.pageCount || 280;
    const calcDepth = Math.max(0.38, Math.min(0.75, (pages / 600) * 0.72));
    return {
      width: 2.35,
      height: 3.35,
      depth: calcDepth,
    };
  }, [book.pageCount]);

  // Load cover texture
  const coverTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    try {
      const tex = loader.load(book.localCoverPath);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      return tex;
    } catch {
      return null;
    }
  }, [book.localCoverPath]);

  // Procedural canvas textures
  const { spineTexture, backTexture, pagesTexture } = useMemo(() => {
    // 1. Shared Ornate Spine Texture (identical to shelf spine)
    const { canvas: spineCanvas } = generateSpineCanvas({
      id: book.id,
      title: book.title,
      author: book.author,
      pageCount: book.pageCount,
      spineColor: book.spineColor,
      spineTextColor: book.spineTextColor,
    });
    const spineTex = new THREE.CanvasTexture(spineCanvas);
    spineTex.colorSpace = THREE.SRGBColorSpace;

    // 2. Back Cover Texture
    const backCanvas = document.createElement('canvas');
    backCanvas.width = 512;
    backCanvas.height = 768;
    const bCtx = backCanvas.getContext('2d');
    if (bCtx) {
      bCtx.fillStyle = book.spineColor || '#1e3a5f';
      bCtx.fillRect(0, 0, backCanvas.width, backCanvas.height);

      bCtx.strokeStyle = 'rgba(235, 215, 175, 0.4)';
      bCtx.lineWidth = 3;
      bCtx.strokeRect(28, 28, backCanvas.width - 56, backCanvas.height - 56);
      bCtx.strokeStyle = 'rgba(235, 215, 175, 0.2)';
      bCtx.lineWidth = 1;
      bCtx.strokeRect(36, 36, backCanvas.width - 72, backCanvas.height - 72);

      const drawCorner = (cx: number, cy: number, dx: number, dy: number) => {
        bCtx.strokeStyle = 'rgba(235, 215, 175, 0.6)';
        bCtx.lineWidth = 2;
        bCtx.beginPath();
        bCtx.moveTo(cx + dx * 16, cy);
        bCtx.lineTo(cx, cy);
        bCtx.lineTo(cx, cy + dy * 16);
        bCtx.stroke();
      };
      drawCorner(36, 36, 1, 1);
      drawCorner(backCanvas.width - 36, 36, -1, 1);
      drawCorner(36, backCanvas.height - 36, 1, -1);
      drawCorner(backCanvas.width - 36, backCanvas.height - 36, -1, -1);

      bCtx.fillStyle = '#ffffff';
      bCtx.fillRect(166, backCanvas.height - 110, 180, 65);
      bCtx.fillStyle = '#000000';
      for (let i = 0; i < 28; i++) {
        const x = 178 + i * 5.6;
        const w = i % 3 === 0 ? 3 : 1.5;
        bCtx.fillRect(x, backCanvas.height - 100, w, 45);
      }
    }
    const backTex = new THREE.CanvasTexture(backCanvas);
    backTex.colorSpace = THREE.SRGBColorSpace;

    // 3. Pages Edge Texture
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = 128;
    pageCanvas.height = 128;
    const pCtx = pageCanvas.getContext('2d');
    if (pCtx) {
      pCtx.fillStyle = '#f6f2e6';
      pCtx.fillRect(0, 0, 128, 128);
      pCtx.fillStyle = '#e8dfcd';
      for (let y = 0; y < 128; y += 2) {
        if (Math.random() > 0.4) {
          pCtx.fillRect(0, y, 128, 1);
        }
      }
    }
    const pageTex = new THREE.CanvasTexture(pageCanvas);
    pageTex.wrapS = THREE.RepeatWrapping;
    pageTex.wrapT = THREE.RepeatWrapping;

    return {
      spineTexture: spineTex,
      backTexture: backTex,
      pagesTexture: pageTex,
    };
  }, [book.id, book.spineColor, book.spineTextColor, book.title, book.author]);

  // Materials
  const materials = useMemo(() => {
    const pageMat = new THREE.MeshStandardMaterial({
      map: pagesTexture,
      roughness: 0.88,
    });

    const spineMat = new THREE.MeshStandardMaterial({
      map: spineTexture,
      roughness: 0.48,
      metalness: 0.12,
    });

    const frontMat = new THREE.MeshStandardMaterial({
      map: coverTexture,
      roughness: 0.32,
      metalness: 0.08,
    });

    const backMat = new THREE.MeshStandardMaterial({
      map: backTexture,
      roughness: 0.48,
      metalness: 0.12,
    });

    return [pageMat, spineMat, pageMat, pageMat, frontMat, backMat];
  }, [coverTexture, spineTexture, backTexture, pagesTexture]);

  // Exact 4-Phase Choreography:
  // Phase 1 (0.0s -> 1.4s): Lifts from clicked shelf slot to center of screen
  // Phase 2 (1.4s -> 2.8s): Smooth 90 deg turn in center to reveal front cover
  // Phase 3 (2.8s -> 3.8s): Glides smoothly to left side (x: 0 -> targetLeftX) as dialog appears
  // Phase 4 (> 3.8s): Clean settled display state with ambient floating
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    animTimeRef.current += delta;
    const t = animTimeRef.current;

    const T_P1_END = 1.4;  // Lift from slot to center
    const T_P2_END = 2.8;  // Center turn to cover
    const T_P3_END = 3.8;  // Glide to left side

    // Calculate left destination based on viewport width
    const vpWidth = state.viewport.width;
    const targetLeftX = vpWidth > 6 ? -vpWidth * 0.28 : (vpWidth > 4 ? -2.2 : 0);

    if (t < T_P1_END) {
      // Phase 1: Lifts from clicked shelf slot (startX, startY, -2.4) to screen center (0, 0, 0)
      const p = easeInOutCubic(t / T_P1_END);
      meshRef.current.position.x = startX * (1 - p);
      meshRef.current.position.y = startY * (1 - p);
      meshRef.current.position.z = -2.4 * (1 - p);
      meshRef.current.scale.setScalar(0.55 + 0.55 * p); // Scales up smoothly from shelf size
      meshRef.current.rotation.y = Math.PI / 2;         // Spine faces camera
      meshRef.current.rotation.x = 0;
      meshRef.current.rotation.z = 0;
    } else if (t < T_P2_END) {
      // Phase 2: Stays in center (x = 0, y = 0, z = 0), smoothly rotates 90 deg to front cover
      const p = easeInOutCubic((t - T_P1_END) / (T_P2_END - T_P1_END));
      meshRef.current.position.x = 0;
      meshRef.current.position.y = 0;
      meshRef.current.position.z = 0;
      meshRef.current.scale.setScalar(1.1);
      // Rotates from Math.PI / 2 (spine) down to 0 (front cover)
      meshRef.current.rotation.y = (Math.PI / 2) * (1 - p);
      meshRef.current.rotation.x = 0;
      meshRef.current.rotation.z = 0;
    } else if (t < T_P3_END) {
      // Phase 3: Glides from center (x: 0) to left (x: targetLeftX) as dialog appears
      const p = easeOutCubic((t - T_P2_END) / (T_P3_END - T_P2_END));
      meshRef.current.position.x = targetLeftX * p;
      meshRef.current.position.y = 0;
      meshRef.current.position.z = 0;
      meshRef.current.scale.setScalar(1.1);
      // Tilts smoothly to show 3D volume
      meshRef.current.rotation.y = -0.38 * p;
      meshRef.current.rotation.x = 0.06 * p;
      meshRef.current.rotation.z = 0.02 * p;
    } else {
      // Phase 4: Clean, elegant showcase display on the left
      const w = t - T_P3_END;
      const floatY = Math.sin(w * 1.5) * 0.05;

      meshRef.current.position.x = targetLeftX;
      meshRef.current.position.y = floatY;
      meshRef.current.position.z = 0;
      meshRef.current.scale.setScalar(1.1);

      meshRef.current.rotation.y = -0.38;
      meshRef.current.rotation.x = 0.06;
      meshRef.current.rotation.z = 0.02;
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[0, Math.PI / 2, 0]}
      position={[startX, startY, -2.4]}
      scale={[0.55, 0.55, 0.55]}
      material={materials}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[width, height, depth]} />
    </mesh>
  );
}
