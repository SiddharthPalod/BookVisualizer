'use client';

import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Book3DModel } from './Book3DModel';
import { BookWithDetails } from '@/types';

interface Book3DViewerProps {
  book: BookWithDetails;
  isInteractive?: boolean;
}

// Cursor-following light for realistic specular reflection
function CursorSheenLight() {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(({ pointer }) => {
    if (lightRef.current) {
      lightRef.current.position.x = pointer.x * 4;
      lightRef.current.position.y = pointer.y * 3 + 0.5;
      lightRef.current.position.z = 3.6;
    }
  });
  return <pointLight ref={lightRef} intensity={1.5} distance={9} color="#fffbeb" decay={1.8} />;
}

// Dynamic shadow anchor that tracks the book seamlessly across all phases
function DynamicShadow() {
  const shadowRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    if (shadowRef.current) {
      const vpWidth = state.viewport.width;
      const targetLeftX = vpWidth > 6 ? -vpWidth * 0.28 : (vpWidth > 4 ? -2.2 : 0);

      if (t < 1.4) {
        shadowRef.current.position.x = 0;
      } else if (t < 2.8) {
        shadowRef.current.position.x = 0;
      } else if (t < 3.8) {
        const p = (t - 2.8) / 1.0;
        shadowRef.current.position.x = targetLeftX * p;
      } else {
        shadowRef.current.position.x = targetLeftX;
      }
    }
  });

  return (
    <group ref={shadowRef} position={[0, -2.1, 0]}>
      <ContactShadows
        opacity={0.65}
        scale={7.5}
        blur={2.4}
        far={4}
      />
    </group>
  );
}

export function Book3DViewer({ book }: Book3DViewerProps) {
  return (
    <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 5.8], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.4} />
        {/* Main key light */}
        <directionalLight
          position={[4, 7, 5]}
          intensity={2.3}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        {/* Fill light from left */}
        <directionalLight position={[-6, 2, 4]} intensity={1.2} color="#fef3c7" />
        {/* Cool rim light from rear */}
        <directionalLight position={[-4, -2, -4]} intensity={0.8} color="#bae6fd" />

        <CursorSheenLight />

        <Suspense fallback={null}>
          <Book3DModel book={book} />
          <DynamicShadow />
        </Suspense>
      </Canvas>
    </div>
  );
}
