import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import {
  HydraulicParams,
  HydraulicResults,
  formatClockDuration,
  formatPtBr,
} from '../utils/hydraulics';

interface HydraulicSimulatorProps {
  params: HydraulicParams;
  results: HydraulicResults;
  onChangeParams: (next: HydraulicParams) => void;
  onResetDefault: () => void;
  activeStepHighlight: number | null;
}

export const HydraulicSimulator: React.FC<HydraulicSimulatorProps> = ({
  params,
  results,
  onChangeParams,
  onResetDefault,
  activeStepHighlight,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 20 | 60>(60);
  const [elapsedSimSeconds, setElapsedSimSeconds] = useState(0);
  const [flowPhase, setFlowPhase] = useState(0);
  const lastFrameRef = useRef<number | null>(null);

  // Reset elapsed time smoothly if user changes drum/pipe params and it exceeded total time
  useEffect(() => {
    if (elapsedSimSeconds > results.timeSeconds) {
      setElapsedSimSeconds(0);
    }
  }, [params.volumeLiters, params.diameterMm, params.velocityMs, results.timeSeconds, elapsedSimSeconds]);

  useEffect(() => {
    if (!isPlaying) {
      lastFrameRef.current = null;
      return;
    }

    let rafId: number;
    const tick = (now: number) => {
      if (lastFrameRef.current !== null) {
        const dtSec = Math.min((now - lastFrameRef.current) / 1000, 0.1);
        setElapsedSimSeconds((prev) => {
          const next = prev + dtSec * speedMultiplier;
          if (next >= results.timeSeconds) {
            return results.timeSeconds;
          }
          return next;
        });
        setFlowPhase((prev) => (prev + dtSec * params.velocityMs * 160) % 40);
      }
      lastFrameRef.current = now;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, speedMultiplier, results.timeSeconds, params.velocityMs]);

  const fillFraction =
    results.timeSeconds > 0
      ? Math.min(1, Math.max(0, elapsedSimSeconds / results.timeSeconds))
      : 0;
  const currentLiters = fillFraction * params.volumeLiters;
  const isFull = fillFraction >= 0.999;

  // Visual proportions for SVG pipe & drum
  // Pipe inner height scales smoothly between 10px (10mm) and 42px (100mm)
  const pipeVisualHeight = 10 + ((params.diameterMm - 10) / 90) * 32;
  const pipeCenterY = 76;
  const pipeTopY = pipeCenterY - pipeVisualHeight / 2;
  const pipeBottomY = pipeCenterY + pipeVisualHeight / 2;

  // Cross-section zoom circle radius scales between 16 and 38 px
  const zoomRadius = 16 + ((params.diameterMm - 10) / 90) * 22;

  // Drum water level inside SVG drum body (y=130 to y=310 -> height 180)
  const drumTopY = 132;
  const drumHeight = 180;
  const waterHeight = fillFraction * drumHeight;
  const waterTopY = drumTopY + drumHeight - waterHeight;

  const handleRestart = () => {
    setElapsedSimSeconds(0);
    setIsPlaying(true);
  };

  const handleTogglePlay = () => {
    if (isFull) {
      setElapsedSimSeconds(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const isDefault =
    params.volumeLiters === 214 &&
    params.diameterMm === 30 &&
    Math.abs(params.velocityMs - 0.3) < 0.001;

  return (
    <section
      id="simulador"
      aria-label="Simulador interativo de enchimento do tambor"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
    >
      {/* Left Zone (60-65%): Interactive Hydraulic Stage */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Bancada Visual: Tubo de {formatPtBr(params.diameterMm, 0)} mm enchendo Tambor de{' '}
              {formatPtBr(params.volumeLiters, 0)} L
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Acompanhe a entrada do líquido e veja como a largura do cano e a velocidade definem o tempo.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-600">
            <span>{isFull ? 'Tambor cheio' : isPlaying ? 'Enchendo' : 'Pausado'}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-900">
              {formatPtBr(currentLiters, 1, 1)} / {formatPtBr(params.volumeLiters, 0)} L
            </span>
          </div>
        </div>

        {/* SVG Interactive Diagram */}
        <div className="relative my-4 bg-slate-50 border border-slate-200/80 rounded-lg overflow-hidden">
          <svg
            viewBox="0 0 680 350"
            className="w-full h-auto block select-none"
            role="img"
            aria-label={`Diagrama hidráulico mostrando tubo de ${params.diameterMm} milímetros com velocidade de ${params.velocityMs} metros por segundo enchendo um tambor de ${params.volumeLiters} litros`}
          >
            <defs>
              <linearGradient id="drumSteel" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="22%" stopColor="#f1f5f9" />
                <stop offset="55%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
              <linearGradient id="waterFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.88" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
              </linearGradient>
              <clipPath id="drumClip">
                <rect x="370" y={drumTopY} width="180" height={drumHeight} rx="4" />
              </clipPath>
              <clipPath id="pipeClip">
                <rect x="135" y={pipeTopY} width="265" height={pipeVisualHeight} />
              </clipPath>
            </defs>

            {/* Subtle Blueprint Grid */}
            <g stroke="#e2e8f0" strokeWidth="0.75" opacity="0.7">
              {[70, 140, 210, 280].map((y) => (
                <line key={`h-${y}`} x1="0" y1={y} x2="680" y2={y} />
              ))}
              {[136, 272, 408, 544].map((x) => (
                <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="350" />
              ))}
            </g>

            {/* Floor line */}
            <line x1="310" y1="316" x2="610" y2="316" stroke="#94a3b8" strokeWidth="2" />

            {/* Cross-Section Zoom Inset (Top Left) — Highlights Step 1 & Step 2 */}
            <g transform="translate(76, 86)">
              <rect
                x="-62"
                y="-68"
                width="124"
                height="148"
                rx="8"
                fill="#ffffff"
                stroke={
                  activeStepHighlight === 1 || activeStepHighlight === 2 ? '#0284c7' : '#cbd5e1'
                }
                strokeWidth={activeStepHighlight === 1 || activeStepHighlight === 2 ? '2' : '1'}
              />
              <text
                x="0"
                y="-49"
                textAnchor="middle"
                className="fill-slate-500 text-[10px] font-medium"
              >
                Boca do tubo (frente)
              </text>

              {/* Outer pipe wall */}
              <circle cx="0" cy="-2" r={zoomRadius + 5} fill="#94a3b8" />
              {/* Inner water cross-section (Area A) */}
              <circle cx="0" cy="-2" r={zoomRadius} fill="#0ea5e9" fillOpacity="0.22" stroke="#0284c7" strokeWidth="2" />

              {/* Diameter line */}
              <line
                x1={-zoomRadius}
                y1="-2"
                x2={zoomRadius}
                y2="-2"
                stroke="#0f172a"
                strokeWidth="1.2"
                strokeDasharray="3 2"
              />
              {/* Radius highlight */}
              <line x1="0" y1="-2" x2={zoomRadius} y2="-2" stroke="#d97706" strokeWidth="2.5" />
              <circle cx="0" cy="-2" r="2.5" fill="#0f172a" />

              <text
                x="0"
                y="49"
                textAnchor="middle"
                className="fill-slate-800 text-[11px] font-mono font-semibold"
              >
                Ø = {formatPtBr(params.diameterMm, 0)} mm ({formatPtBr(results.diameterCm, 1)} cm)
              </text>
              <text
                x="0"
                y="64"
                textAnchor="middle"
                className="fill-amber-700 text-[10px] font-mono font-medium"
              >
                r = {formatPtBr(results.radiusCm, 2)} cm · A = {formatPtBr(results.areaCm2, 2)} cm²
              </text>
            </g>

            {/* Horizontal Supply Pipe */}
            <g>
              {/* Outer metallic casing */}
              <rect
                x="148"
                y={pipeTopY - 4}
                width="254"
                height={pipeVisualHeight + 8}
                rx="3"
                fill="#64748b"
              />
              {/* Inner channel */}
              <rect
                x="148"
                y={pipeTopY}
                width="252"
                height={pipeVisualHeight}
                fill="#e0f2fe"
              />
              {/* Moving flow stream & velocity arrows */}
              <g clipPath="url(#pipeClip)">
                <rect
                  x="135"
                  y={pipeTopY}
                  width="265"
                  height={pipeVisualHeight}
                  fill="#0ea5e9"
                  fillOpacity="0.35"
                />
                {Array.from({ length: 8 }).map((_, idx) => {
                  const xPos = 135 + ((idx * 40 + flowPhase) % 300) - 20;
                  return (
                    <g key={idx} transform={`translate(${xPos}, ${pipeCenterY})`}>
                      <line x1="-10" y1="0" x2="8" y2="0" stroke="#0369a1" strokeWidth="1.8" />
                      <polyline
                        points="4,-3.5 9,0 4,3.5"
                        fill="none"
                        stroke="#0369a1"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  );
                })}
              </g>
              {/* Pipe nozzle lip */}
              <rect
                x="398"
                y={pipeTopY - 6}
                width="7"
                height={pipeVisualHeight + 12}
                rx="1.5"
                fill="#475569"
              />
            </g>

            {/* Velocity Callout above pipe */}
            <g transform="translate(274, 34)">
              <text
                x="0"
                y="0"
                textAnchor="middle"
                className="fill-slate-700 text-[11px] font-medium"
              >
                Velocidade do líquido (v)
              </text>
              <text
                x="0"
                y="15"
                textAnchor="middle"
                className="fill-sky-700 text-[12px] font-mono font-semibold"
              >
                {formatPtBr(params.velocityMs, 2)} m/s ({formatPtBr(results.velocityCms, 0)} cm/s)
              </text>
            </g>

            {/* Vertical Pouring Water Stream into Drum */}
            {!isFull && (
              <path
                d={`M 405 ${pipeTopY + 1} Q 432 ${pipeCenterY + 6} 436 ${Math.max(pipeCenterY + 14, waterTopY + 4)} L ${436 - Math.max(4, pipeVisualHeight * 0.42)} ${Math.max(pipeCenterY + 14, waterTopY + 4)} Q 422 ${pipeCenterY + 12} 405 ${pipeBottomY - 1} Z`}
                fill="#0ea5e9"
                fillOpacity="0.72"
              />
            )}

            {/* Industrial Steel Drum (214 L) */}
            <g>
              {/* Drum Back / Metallic Shell */}
              <rect
                x="364"
                y="124"
                width="192"
                height="192"
                rx="8"
                fill="url(#drumSteel)"
                stroke={activeStepHighlight === 4 ? '#0284c7' : '#64748b'}
                strokeWidth={activeStepHighlight === 4 ? '2.5' : '1.5'}
              />

              {/* Interior cutaway background */}
              <rect
                x="370"
                y={drumTopY}
                width="180"
                height={drumHeight}
                rx="4"
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth="1"
              />

              {/* Rising Liquid Level inside Drum */}
              <g clipPath="url(#drumClip)">
                <rect
                  x="370"
                  y={waterTopY}
                  width="180"
                  height={waterHeight + 2}
                  fill="url(#waterFill)"
                />
                {waterHeight > 4 && (
                  <line
                    x1="370"
                    y1={waterTopY}
                    x2="550"
                    y2={waterTopY}
                    stroke="#7dd3fc"
                    strokeWidth="2.5"
                  />
                )}
              </g>

              {/* Industrial Drum Structural Ribs */}
              <line x1="362" y1="184" x2="558" y2="184" stroke="#64748b" strokeWidth="3" opacity="0.45" />
              <line x1="362" y1="248" x2="558" y2="248" stroke="#64748b" strokeWidth="3" opacity="0.45" />

              {/* Drum Top Rim Opening */}
              <ellipse cx="460" cy="126" rx="94" ry="7" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" />
              <ellipse cx="430" cy="126" rx="26" ry="3.5" fill="#1e293b" />

              {/* Level Percentage Readout inside Drum */}
              <text
                x="460"
                y="220"
                textAnchor="middle"
                className={`text-[18px] font-mono font-semibold ${
                  fillFraction > 0.52 ? 'fill-white' : 'fill-slate-800'
                }`}
              >
                {Math.round(fillFraction * 100)}%
              </text>
              <text
                x="460"
                y="238"
                textAnchor="middle"
                className={`text-[11px] font-mono ${
                  fillFraction > 0.42 ? 'fill-sky-50' : 'fill-slate-500'
                }`}
              >
                {formatPtBr(currentLiters, 1)} L de {formatPtBr(params.volumeLiters, 0)} L
              </text>

              {/* Graduation ticks on right side of drum */}
              {[0.25, 0.5, 0.75, 1].map((mark) => {
                const tickY = drumTopY + drumHeight * (1 - mark);
                return (
                  <g key={mark}>
                    <line x1="556" y1={tickY} x2="566" y2={tickY} stroke="#64748b" strokeWidth="1.2" />
                    <text
                      x="570"
                      y={tickY + 3.5}
                      className="fill-slate-600 text-[10px] font-mono"
                    >
                      {formatPtBr(params.volumeLiters * mark, 0)} L
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Bottom-Left Real-World Intuition: Copo Americano */}
            <g transform="translate(22, 200)">
              <rect
                x="0"
                y="0"
                width="290"
                height="112"
                rx="8"
                fill="#ffffff"
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              {/* Simple Cup Icon */}
              <g transform="translate(22, 26)">
                <polygon
                  points="4,0 32,0 28,46 8,46"
                  fill="#e0f2fe"
                  stroke="#0284c7"
                  strokeWidth="1.8"
                />
                <polygon
                  points="6,14 30,14 28,46 8,46"
                  fill="#0ea5e9"
                  fillOpacity="0.65"
                />
                <text x="18" y="62" textAnchor="middle" className="fill-slate-500 text-[9px] font-mono">
                  212 mL
                </text>
              </g>
              <text x="76" y="28" className="fill-slate-900 text-[12px] font-semibold">
                Vazão na prática (1 segundo)
              </text>
              <text x="76" y="48" className="fill-sky-700 text-[14px] font-mono font-semibold">
                {formatPtBr(results.flowMls, 2)} mL/s ({formatPtBr(results.flowLs, 4)} L/s)
              </text>
              <text x="76" y="68" className="fill-slate-600 text-[11px]">
                Equivale a {formatPtBr(results.americanCupsPerSecond, 2)} copo(s) por segundo
              </text>
              <text x="76" y="86" className="fill-slate-600 text-[11px]">
                Em 1 minuto entram cerca de {formatPtBr(results.litersPerMinute, 1)} litros
              </text>
            </g>
          </svg>
        </div>

        {/* Playback & Time Simulation Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            >
              {isPlaying && !isFull ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isFull ? 'Encher novamente' : isPlaying ? 'Pausar' : 'Continuar'}</span>
            </button>
            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Zerar</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
              Velocidade da animação:
            </span>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {([1, 20, 60] as const).map((mult) => (
                <button
                  key={mult}
                  type="button"
                  onClick={() => setSpeedMultiplier(mult)}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    speedMultiplier === mult
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mult}×
                </button>
              ))}
            </div>
          </div>

          <div className="text-right font-mono tabular-nums">
            <div className="text-xs text-slate-500">Relógio simulado</div>
            <div className="text-sm font-semibold text-slate-900">
              {formatClockDuration(elapsedSimSeconds)} / {formatClockDuration(results.timeSeconds)}
            </div>
          </div>
        </div>
      </div>

      {/* Right Zone (35-40%): Parameter Control Deck & Live Results */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between gap-6">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Parâmetros do Problema
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Ajuste os valores e observe todos os cálculos mudarem em tempo real.
              </p>
            </div>
            {!isDefault && (
              <button
                type="button"
                onClick={onResetDefault}
                className="px-3 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Voltar ao 214 L
              </button>
            )}
          </div>

          {/* Slider 1: Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="slider-volume" className="text-sm font-medium text-slate-800">
                Volume do tambor (V)
              </label>
              <span className="text-sm font-mono font-semibold text-slate-900 tabular-nums">
                {formatPtBr(params.volumeLiters, 0)} litros
              </span>
            </div>
            <input
              id="slider-volume"
              type="range"
              min={50}
              max={500}
              step={2}
              value={params.volumeLiters}
              onChange={(e) =>
                onChangeParams({ ...params, volumeLiters: Number(e.target.value) })
              }
              className="w-full hydraulic-slider"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>50 L</span>
              <span>214 L (tambor padrão)</span>
              <span>500 L</span>
            </div>
          </div>

          {/* Slider 2: Diameter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="slider-diameter" className="text-sm font-medium text-slate-800">
                Diâmetro do tubo (Ø)
              </label>
              <span className="text-sm font-mono font-semibold text-slate-900 tabular-nums">
                {formatPtBr(params.diameterMm, 0)} mm ({formatPtBr(results.diameterCm, 1)} cm)
              </span>
            </div>
            <input
              id="slider-diameter"
              type="range"
              min={10}
              max={100}
              step={2}
              value={params.diameterMm}
              onChange={(e) =>
                onChangeParams({ ...params, diameterMm: Number(e.target.value) })
              }
              className="w-full hydraulic-slider"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>10 mm (1 cm)</span>
              <span>30 mm (cano de pia)</span>
              <span>100 mm (10 cm)</span>
            </div>
          </div>

          {/* Slider 3: Velocity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="slider-velocity" className="text-sm font-medium text-slate-800">
                Velocidade da água (v)
              </label>
              <span className="text-sm font-mono font-semibold text-slate-900 tabular-nums">
                {formatPtBr(params.velocityMs, 2)} m/s ({formatPtBr(results.velocityCms, 0)} cm/s)
              </span>
            </div>
            <input
              id="slider-velocity"
              type="range"
              min={0.1}
              max={2.0}
              step={0.05}
              value={params.velocityMs}
              onChange={(e) =>
                onChangeParams({ ...params, velocityMs: Number(e.target.value) })
              }
              className="w-full hydraulic-slider"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>0,1 m/s (lento)</span>
              <span>0,3 m/s</span>
              <span>2,0 m/s (forte)</span>
            </div>
          </div>

          {/* Quick Scenario Presets */}
          <div className="pt-1">
            <div className="text-xs font-medium text-slate-500 mb-2">Cenários rápidos para testar:</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onResetDefault}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                  isDefault
                    ? 'bg-sky-50 border-sky-300 text-sky-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Original (214 L · 30 mm · 0,3 m/s)
              </button>
              <button
                type="button"
                onClick={() =>
                  onChangeParams({ volumeLiters: 214, diameterMm: 60, velocityMs: 0.3 })
                }
                className="px-3 py-1.5 text-xs font-medium rounded-lg border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                Dobrar o cano (60 mm)
              </button>
              <button
                type="button"
                onClick={() =>
                  onChangeParams({ volumeLiters: 214, diameterMm: 30, velocityMs: 0.6 })
                }
                className="px-3 py-1.5 text-xs font-medium rounded-lg border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                Dobrar velocidade (0,6 m/s)
              </button>
            </div>
          </div>
        </div>

        {/* Live Final Answer Highlight */}
        <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Tempo total para encher</span>
            <span className="font-mono tabular-nums">π = 3,14</span>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <div className="text-2xl sm:text-3xl font-display font-bold tracking-tight tabular-nums">
              {formatClockDuration(results.timeSeconds)}
            </div>
            <div className="text-sm font-mono text-sky-300 tabular-nums">
              {formatPtBr(results.timeSeconds, 2, 2)} s
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-slate-400">Vazão (Q)</div>
              <div className="font-mono font-medium text-slate-100 tabular-nums mt-0.5">
                {formatPtBr(results.flowLs, 5)} L/s
              </div>
            </div>
            <div>
              <div className="text-slate-400">Área do tubo (A)</div>
              <div className="font-mono font-medium text-slate-100 tabular-nums mt-0.5">
                {formatPtBr(results.areaM2, 7)} m²
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
