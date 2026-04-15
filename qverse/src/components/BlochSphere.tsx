import { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Line } from '@react-three/drei';
import { useQuantumStore } from '../store/quantumStore';
import type { Amplitudes } from '../store/quantumStore';
import * as THREE from 'three';

// ── Physics Mapping ──────────────────────────────────────────────────────────
function getTargetVector(amp: Amplitudes, q: 0 | 1): THREE.Vector3 {
  const [a00, a01, a10, a11] = amp;
  
  let alpha, beta;
  if (q === 0) {
    const rho00 = a00*a00 + a01*a01;
    const rho01 = a00*a10 + a01*a11;
    alpha = Math.sqrt(rho00);
    beta = alpha > 0 ? rho01 / alpha : 1;
  } else {
    const rho00 = a00*a00 + a10*a10;
    const rho01 = a00*a01 + a10*a11;
    alpha = Math.sqrt(rho00);
    beta = alpha > 0 ? rho01 / alpha : 1;
  }

  const mag = Math.sqrt(alpha*alpha + beta*beta);
  if (mag > 0) { alpha /= mag; beta /= mag; }

  const theta = 2 * Math.acos(Math.abs(alpha));
  const phi = (beta < 0) ? Math.PI : 0; 

  // Mapping Physics (x,y,z) to Three.js (x,z,y)
  // z_phys (up) -> y_three
  return new THREE.Vector3(
    Math.sin(theta) * Math.cos(phi),
    Math.cos(theta),
    Math.sin(theta) * Math.sin(phi)
  ).normalize();
}

const SphereVisual = ({ qubitIndex }: { qubitIndex: 0 | 1 }) => {
  const amplitudes = useQuantumStore(s => s.amplitudes);
  const arrowRef = useRef<THREE.ArrowHelper>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // Animation state
  const currentVec = useRef(new THREE.Vector3(0, 1, 0));
  const targetVec  = useRef(new THREE.Vector3(0, 1, 0));
  
  // Arc trajectory points
  const [arcPoints, setArcPoints] = useState<THREE.Vector3[]>([]);

  useEffect(() => {
    const v = getTargetVector(amplitudes, qubitIndex);
    targetVec.current.copy(v);
  }, [amplitudes, qubitIndex]);

  useFrame(() => {
    if (arrowRef.current && groupRef.current) {
      // 1. Smoothly interpolate vector direction (lerp 0.08)
      currentVec.current.lerp(targetVec.current, 0.08);
      const direction = currentVec.current.clone().normalize();
      arrowRef.current.setDirection(direction);
      
      // 2. Slow auto-rotate of the scene for professional look
      groupRef.current.rotation.y += 0.005;

      // 3. Update trajectory (optional arc)
      if (currentVec.current.distanceTo(targetVec.current) > 0.01) {
          setArcPoints(prev => {
              const last = prev[prev.length - 1];
              if (!last || last.distanceTo(direction) > 0.05) {
                  const newPoints = [...prev, direction.clone().multiplyScalar(1.5)];
                  return newPoints.slice(-20); // Keep last 20 points
              }
              return prev;
          });
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* ── Scientific Sphere Design ────────────────────────────────────── */}
      <Sphere args={[1.5, 32, 32]}>
        <meshPhongMaterial 
            color="#94a3b8" 
            transparent 
            opacity={0.1} 
            side={THREE.DoubleSide} 
            shininess={10}
        />
      </Sphere>
      
      {/* Grid: Latitude & Longitude Thin Grey Lines */}
      <Sphere args={[1.5, 16, 16]}>
        <meshBasicMaterial color="#475569" wireframe transparent opacity={0.3} />
      </Sphere>

      {/* ── Axes (Scientific Style) ─────────────────────────────────────── */}
      {/* Z-Axis (Vertical) */}
      <Line points={[[0, -1.8, 0], [0, 1.8, 0]]} color="#94a3b8" lineWidth={1} />
      <Text position={[0, 2.0, 0]} fontSize={0.2} color="white">|0⟩</Text>
      <Text position={[0, -2.0, 0]} fontSize={0.2} color="white">|1⟩</Text>

      {/* X-Axis (Red) */}
      <Line points={[[-1.8, 0, 0], [1.8, 0, 0]]} color="#ef4444" lineWidth={1} />
      <Text position={[2.0, 0, 0]} fontSize={0.15} color="#ef4444">x</Text>

      {/* Y-Axis (Blue) */}
      <Line points={[[0, 0, -1.8], [0, 0, 1.8]]} color="#3b82f6" lineWidth={1} />
      <Text position={[0, 0, 2.0]} fontSize={0.15} color="#3b82f6">y</Text>

      {/* ── Trajectory Arc ──────────────────────────────────────────────── */}
      {arcPoints.length > 1 && (
        <Line 
            points={arcPoints} 
            color="#22d3ee" 
            lineWidth={2} 
            dashed 
            dashScale={2} 
            gapSize={1}
        />
      )}

      {/* ── State Vector Arrow (ArrowHelper) ────────────────────────────── */}
      <primitive 
        object={useMemo(() => new THREE.ArrowHelper(
            new THREE.Vector3(0,1,0), 
            new THREE.Vector3(0,0,0), 
            1.5, 
            "#10b981", // Green vector
            0.2, 
            0.1
        ), [])} 
        ref={arrowRef} 
      />
    </group>
  );
};

export default function BlochSphere({ qubitIndex }: { qubitIndex: 0 | 1 }) {
  return (
    <div className="w-full h-full min-h-[220px]">
      <Canvas camera={{ position: [3, 2, 5], fov: 40 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <OrbitControls enableZoom={false} autoRotate={false} />
        <SphereVisual qubitIndex={qubitIndex} />
      </Canvas>
    </div>
  );
}
