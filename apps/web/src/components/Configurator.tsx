"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  LIMITS,
  calculatePrice,
  type AwningConfig,
  type FabricCategory,
} from "@markise/shared";
import { AwningModel } from "./AwningModel";

// Startwerte, wenn die Seite geöffnet wird
const INITIAL_CONFIG: AwningConfig = {
  widthCm: 400,
  projectionCm: 250,
  fabricCategory: "B",
  motor: true,
};

const FABRIC_OPTIONS: { value: FabricCategory; label: string }[] = [
  { value: "A", label: "A · Standard" },
  { value: "B", label: "B · Premium (+10 %)" },
  { value: "C", label: "C · Exklusiv (+20 %)" },
];

// Cent-Beträge als Euro anzeigen, z. B. 223720 → "2.237,20 €"
const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const formatCents = (cents: number) => euro.format(cents / 100);

export function Configurator() {
  const [config, setConfig] = useState<AwningConfig>(INITIAL_CONFIG);

  // Dieselbe Preisfunktion wie im Backend (aus @markise/shared).
  // Im Browser nur zur Anzeige, der order-service rechnet beim Speichern selbst nach.
  const price = useMemo(() => calculatePrice(config), [config]);

  // Hilfsfunktion: ein einzelnes Feld der Konfiguration ändern
  const update = <K extends keyof AwningConfig>(key: K, value: AwningConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  const width = config.widthCm / 100;
  const projection = config.projectionCm / 100;

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* 3D-Vorschau */}
      <div className="h-[55vh] lg:h-auto lg:flex-1 bg-gradient-to-b from-sky-200 to-sky-50">
        <Canvas
          shadows
          camera={{ position: [width + 2.5, 2.4, projection + 4.5], fov: 45 }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[4, 8, 6]}
            intensity={1.4}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <AwningModel {...config} />
          {/* Maus: drehen und zoomen, nicht unter den Boden schauen */}
          <OrbitControls
            target={[0, 1.6, projection / 2]}
            maxPolarAngle={Math.PI / 2 - 0.05}
            minDistance={2}
            maxDistance={15}
          />
        </Canvas>
      </div>

      {/* Bedienelemente */}
      <aside className="w-full lg:w-96 shrink-0 bg-white p-6 flex flex-col gap-6 border-l border-zinc-200">
        <h1 className="text-2xl font-semibold text-zinc-900">Markise konfigurieren</h1>

        <label className="flex flex-col gap-2">
          <span className="flex justify-between text-sm font-medium text-zinc-700">
            Breite <span>{config.widthCm} cm</span>
          </span>
          <input
            type="range"
            min={LIMITS.minWidthCm}
            max={LIMITS.maxWidthCm}
            step={10}
            value={config.widthCm}
            onChange={(e) => update("widthCm", Number(e.target.value))}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="flex justify-between text-sm font-medium text-zinc-700">
            Ausfall <span>{config.projectionCm} cm</span>
          </span>
          <input
            type="range"
            min={LIMITS.minProjectionCm}
            max={LIMITS.maxProjectionCm}
            step={10}
            value={config.projectionCm}
            onChange={(e) => update("projectionCm", Number(e.target.value))}
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-zinc-700 mb-2">Stoffkategorie</legend>
          {FABRIC_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-zinc-800">
              <input
                type="radio"
                name="fabric"
                value={option.value}
                checked={config.fabricCategory === option.value}
                onChange={() => update("fabricCategory", option.value)}
              />
              {option.label}
            </label>
          ))}
        </fieldset>

        <label className="flex items-center gap-2 text-zinc-800">
          <input
            type="checkbox"
            checked={config.motor}
            onChange={(e) => update("motor", e.target.checked)}
          />
          Elektromotor (+450 € netto)
        </label>

        {/* Live-Preis */}
        <div className="mt-auto rounded-lg bg-zinc-50 p-4 text-sm text-zinc-700">
          <div className="flex justify-between">
            <span>Netto</span>
            <span>{formatCents(price.netCents)}</span>
          </div>
          <div className="flex justify-between">
            <span>MwSt. 19 %</span>
            <span>{formatCents(price.vatCents)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-zinc-200 pt-2 text-lg font-semibold text-zinc-900">
            <span>Gesamt</span>
            <span>{formatCents(price.grossCents)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
