import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

interface SatelliteModelProps {
  modelPath: string;
  autoRotate?: boolean;
  rotationSpeed?: number;
}

const FALLBACK_TGA_TEXTURE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export const SatelliteModel: React.FC<SatelliteModelProps> = ({
  modelPath,
  autoRotate = true,
  rotationSpeed = 0.2,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath, undefined, undefined, (loader) => {
    loader.manager.setURLModifier((url) =>
      url.toLowerCase().endsWith('.tga') ? FALLBACK_TGA_TEXTURE : url
    );
  });

  // Clonar la escena para evitar efectos secundarios al intercambiar modelos
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  // Rotación automática suave sobre el eje Y
  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  return (
    <group ref={groupRef} dispose={null}>
      <Center>
        <primitive object={clonedScene} />
      </Center>
    </group>
  );
};
