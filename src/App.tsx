import { useState } from 'react';
import { HydraulicSimulator } from './components/HydraulicSimulator';
import { PracticeLab } from './components/PracticeLab';
import { StepByStepGuide } from './components/StepByStepGuide';
import { SummaryTable } from './components/SummaryTable';
import { WordExportPanel } from './components/WordExportPanel';
import {
  DEFAULT_PARAMS,
  HydraulicParams,
  calculateHydraulics,
  formatClockDuration,
  formatPtBr,
} from './utils/hydraulics';

export default function App() {
  const [params, setParams] = useState<HydraulicParams>(DEFAULT_PARAMS);
  const [activeStep, setActiveStep] = useState<number>(1);

  const results = calculateHydraulics(params);

  const handleResetDefault = () => {
    setParams(DEFAULT_PARAMS);
  };

  const scrollToPractice = () => {
    const el = document.getElementById('praticar');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: 1 row, 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element Brand Wordmark */}
          <a
            href="#topo"
            className="text-lg font-display font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            VazãoLab
          </a>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="#simulador"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Simulador
            </a>
            <a
              href="#passos"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              4 Passos
            </a>
            <a
              href="#resumo"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Quadro Resumo
            </a>
            <a
              href="#word"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Copiar para Word
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={scrollToPractice}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            >
              Modo Exercício
            </button>
          </div>
        </div>
      </header>

      <main id="topo" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-14">
        {/* 1. Traduzindo o problema para a vida real */}
        <section className="space-y-4">
          <div className="text-xs font-medium text-slate-500">
            Hidráulica Aplicada · Área do Círculo, Vazão e Tempo de Enchimento
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-8 space-y-3">
              <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-slate-900 text-balance">
                Quanto tempo leva para encher um tambor de {formatPtBr(params.volumeLiters, 0)} litros?
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
                Imagine um tambor metálico alto de{' '}
                <strong className="font-semibold text-slate-900">
                  {formatPtBr(params.volumeLiters, 0)} litros
                </strong>{' '}
                ligado a um tubo fino de{' '}
                <strong className="font-semibold text-slate-900">
                  {formatPtBr(params.diameterMm, 0)} mm
                </strong>{' '}
                ({formatPtBr(results.diameterCm, 1)} cm, parecido com um cano de pia), onde o líquido
                escorre a{' '}
                <strong className="font-semibold text-slate-900">
                  {formatPtBr(params.velocityMs, 2)} m/s
                </strong>{' '}
                ({formatPtBr(results.velocityCms, 0)} cm por segundo).
              </p>
            </div>
            <div className="lg:col-span-4 lg:text-right">
              <div className="text-xs text-slate-500">Resposta prática atual</div>
              <div className="text-xl sm:text-2xl font-display font-bold text-sky-700 tabular-nums mt-0.5">
                {formatClockDuration(results.timeSeconds)}{' '}
                <span className="text-sm font-mono font-normal text-slate-600">
                  ({formatPtBr(results.timeSecondsRounded, 0)} s)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Two-Zone Sandbox */}
        <HydraulicSimulator
          params={params}
          results={results}
          onChangeParams={setParams}
          onResetDefault={handleResetDefault}
          activeStepHighlight={activeStep}
        />

        {/* 2 & 4. Resolvendo em 4 passos + O Pulo do Gato (cm e mL) */}
        <StepByStepGuide
          params={params}
          results={results}
          activeStep={activeStep}
          onSelectStep={setActiveStep}
        />

        {/* 3. Quadro resumo para enxergar tudo de uma vez */}
        <SummaryTable params={params} results={results} />

        {/* Interactive Student Practice */}
        <PracticeLab />

        {/* Bônus: Texto limpo & Equações Alt + = para Word */}
        <WordExportPanel params={params} results={results} />
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>VazãoLab — Estudo interativo de vazão volumétrica (Q = A × v)</span>
          <span>Constante adotada nos exemplos: π = 3,14 · 1 m³ = 1.000 L · 1 cm³ = 1 mL</span>
        </div>
      </footer>
    </div>
  );
}
