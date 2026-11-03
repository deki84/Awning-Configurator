"use client";

import type { FabricCategory } from "@markise/shared";

// Neigung der Markise in Grad (typischer Wert für Gelenkarmmarkisen)
const PITCH_DEG = 14;
// Montagehöhe der Kassette an der Wand in Metern
const MOUNT_HEIGHT_M = 2.5;

// Stofffarbe je Kategorie: A = Standard, B = Premium, C = Exklusiv
const FABRIC_COLORS: Record<FabricCategory, string> = {
  A: "#d8c8a8",
  B: "#3f6e91",
  C: "#8e2f33",
};

interface AwningModelProps {
  widthCm: number;
  projectionCm: number;
  fabricCategory: FabricCategory;
  motor: boolean;
}

/**
 * Prozedurales 3D-Modell einer Gelenkarmmarkise.
 * Alle Maße kommen direkt aus der Konfiguration, es gibt kein fertiges 3D-Modell.
 */
export function AwningModel({
  widthCm,
  projectionCm,
  fabricCategory,
  motor,
}: AwningModelProps) {
  // Zentimeter in Meter umrechnen, Three.js rechnet in "Einheiten" = Meter
  const width = widthCm / 100;
  const projection = projectionCm / 100;

  const pitch = (PITCH_DEG * Math.PI) / 180;
  // Ausfall ist horizontal gemessen, der Stoff selbst ist durch die Neigung etwas länger
  const fabricLength = projection / Math.cos(pitch);
  // Abstand der Gelenkarme vom Rand der Markise
  const armOffset = Math.max(width / 2 - 0.3, 0.2);
  const fabricColor = FABRIC_COLORS[fabricCategory];

  return (
    <group>
      {/* Hauswand */}
      <mesh position={[0, 1.6, -0.05]} receiveShadow>
        <boxGeometry args={[width + 3, 3.2, 0.1]} />
        <meshStandardMaterial color="#e9e6e1" />
      </mesh>

      {/* Boden (Terrasse) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2.5]} receiveShadow>
        <planeGeometry args={[width + 6, 9]} />
        <meshStandardMaterial color="#c9c4bb" />
      </mesh>

      {/* Kassette: hier ist der Stoff eingerollt */}
      <mesh position={[0, MOUNT_HEIGHT_M, 0.1]} castShadow>
        <boxGeometry args={[width + 0.1, 0.16, 0.2]} />
        <meshStandardMaterial color="#5b5f63" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Motor-Hinweis: kleines Gehäuse am rechten Ende der Kassette */}
      {motor && (
        <mesh position={[width / 2 + 0.12, MOUNT_HEIGHT_M, 0.1]} castShadow>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <meshStandardMaterial color="#2f8f5b" />
        </mesh>
      )}

      {/* Alles, was mit der Neigung kippt, liegt in dieser Gruppe */}
      <group position={[0, MOUNT_HEIGHT_M - 0.05, 0.15]} rotation={[pitch, 0, 0]}>
        {/* Markisenstoff */}
        <mesh
          position={[0, 0, fabricLength / 2]}
          rotation={[-Math.PI / 2, 0, 0]}
          castShadow
        >
          <planeGeometry args={[width, fabricLength]} />
          <meshStandardMaterial color={fabricColor} side={2} roughness={0.9} />
        </mesh>

        {/* Zwei Gelenkarme unter dem Stoff */}
        {[-armOffset, armOffset].map((x) => (
          <mesh key={x} position={[x, -0.05, fabricLength / 2]} castShadow>
            <boxGeometry args={[0.04, 0.04, fabricLength]} />
            <meshStandardMaterial color="#8a8f94" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}

        {/* Ausfallprofil vorne */}
        <mesh position={[0, -0.02, fabricLength]} castShadow>
          <boxGeometry args={[width + 0.04, 0.08, 0.08]} />
          <meshStandardMaterial color="#5b5f63" metalness={0.4} roughness={0.5} />
        </mesh>

        {/* Volant: der herabhängende Stoffstreifen vorne, bleibt durch Gegenrotation senkrecht */}
        <mesh position={[0, -0.14, fabricLength + 0.04]} rotation={[-pitch, 0, 0]}>
          <planeGeometry args={[width, 0.2]} />
          <meshStandardMaterial color={fabricColor} side={2} roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}
