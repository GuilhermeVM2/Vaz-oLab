import React, { useState } from 'react';
import { CheckCircle2, Lightbulb, AlertTriangle } from 'lucide-react';
import {
  HydraulicParams,
  HydraulicResults,
  formatClockDuration,
  formatPtBr,
} from '../utils/hydraulics';

interface StepByStepGuideProps {
  params: HydraulicParams;
  results: HydraulicResults;
  activeStep: number;
  onSelectStep: (step: number) => void;
}

type MethodMode = 'si' | 'cm';

export const StepByStepGuide: React.FC<StepByStepGuideProps> = ({
  params,
  results,
  activeStep,
  onSelectStep,
}) => {
  const [method, setMethod] = useState<MethodMode>('si');

  const dMm = formatPtBr(params.diameterMm, 0);
  const dM = formatPtBr(results.diameterM, 4);
  const rM = formatPtBr(results.radiusM, 4);
  const rSq = formatPtBr(results.radiusSquaredM2, 8);
  const aM2 = formatPtBr(results.areaM2, 7);
  const vMs = formatPtBr(params.velocityMs, 2);
  const qM3s = formatPtBr(results.flowM3s, 8);
  const qLs = formatPtBr(results.flowLs, 5);

  const dCm = formatPtBr(results.diameterCm, 2);
  const rCm = formatPtBr(results.radiusCm, 2);
  const aCm2 = formatPtBr(results.areaCm2, 4);
  const vCms = formatPtBr(results.velocityCms, 1);
  const qMls = formatPtBr(results.flowMls, 2);
  const vMl = formatPtBr(results.volumeMl, 0);

  const V = formatPtBr(params.volumeLiters, 0);
  const tS = formatPtBr(results.timeSeconds, 2, 2);
  const tRound = formatPtBr(results.timeSecondsRounded, 0);
  const tMinDec = formatPtBr(results.timeMinutesDecimal, 2, 2);
  const clockStr = formatClockDuration(results.timeSeconds);

  const siSteps = [
    {
      num: 1,
      title: 'Colocar a largura do tubo em metros',
      summary:
        'A velocidade está em metros, mas o tubo está em milímetros (mm). Como 1 metro tem 1.000 milímetros, dividimos por 1.000.',
      lines: [
        {
          label: 'Diâmetro (Ø)',
          formula: `${dMm} mm ÷ 1.000 = ${dM} m`,
        },
        {
          label: 'Raio (metade do diâmetro)',
          formula: `${dM} ÷ 2 = ${rM} m`,
        },
      ],
      tip: 'Erro comum: usar o diâmetro inteiro na fórmula da área. Sempre divida por 2 para achar o raio!',
    },
    {
      num: 2,
      title: 'Calcular a área da boca do tubo (A)',
      summary:
        'A boca do tubo é um círculo. Usamos a área do círculo: A = π × r² (com π = 3,14).',
      lines: [
        {
          label: 'Montando a conta',
          formula: `A = 3,14 × ${rM} × ${rM}`,
        },
        {
          label: 'Primeiro o raio ao quadrado',
          formula: `${rM} × ${rM} = ${rSq}`,
        },
        {
          label: 'Multiplicando por 3,14',
          formula: `A = ${aM2} m²`,
        },
      ],
      tip: `Cuidado com os zeros após a vírgula (${rSq}). Digite com atenção na calculadora.`,
    },
    {
      num: 3,
      title: 'Descobrir quantos litros saem por segundo (Vazão Q)',
      summary:
        'Multiplicamos a área da boca do tubo pela velocidade (Q = A × v). Depois convertemos m³ em litros multiplicando por 1.000.',
      lines: [
        {
          label: 'Vazão em m³/s',
          formula: `Q = ${aM2} × ${vMs} = ${qM3s} m³/s`,
        },
        {
          label: 'Convertendo para litros (1 m³ = 1.000 L)',
          formula: `Q = ${qM3s} × 1.000 = ${qLs} L/s (≈ ${qMls} mL/s)`,
        },
      ],
      tip: 'Pense na água como um "cilindro" de área A e comprimento v saindo a cada segundo.',
    },
    {
      num: 4,
      title: `Calcular o tempo para encher os ${V} litros (t)`,
      summary:
        'Se já sabemos o volume total do tambor e quanto entra por segundo, dividimos um pelo outro: t = V ÷ Q.',
      lines: [
        {
          label: 'Tempo em segundos',
          formula: `t = ${V} ÷ ${qLs} = ${tS} segundos (≈ ${tRound} s)`,
        },
        {
          label: 'Passando para minutos (÷ 60)',
          formula: `${tS} ÷ 60 = ${tMinDec} minutos`,
        },
        {
          label: 'Em relógio (min e s)',
          formula: `${clockStr} (porque ${results.minutesWhole} × 60 = ${results.minutesWhole * 60} s, sobram ${results.secondsRemainder} s)`,
        },
      ],
      tip: `Atenção: ${tMinDec} minutos NÃO são ${results.minutesWhole} min e ${Math.round((results.timeMinutesDecimal % 1) * 100)} s! A parte decimal é fração de 60 segundos.`,
    },
  ];

  const cmSteps = [
    {
      num: 1,
      title: 'Passe tudo para centímetros (cm)',
      summary:
        'Em vez de lidar com muitos zeros na frente da vírgula, trabalhamos em centímetros, pois 1 cm³ equivale exatamente a 1 mL.',
      lines: [
        {
          label: 'Diâmetro e Raio em cm',
          formula: `Ø = ${dMm} mm = ${dCm} cm → Raio = ${rCm} cm`,
        },
        {
          label: 'Velocidade em cm/s',
          formula: `v = ${vMs} m/s = ${vCms} cm/s`,
        },
      ],
      tip: 'Para passar de mm para cm, divida por 10. Para passar de m/s para cm/s, multiplique por 100.',
    },
    {
      num: 2,
      title: 'Calcule a área sem zeros na frente',
      summary:
        'Com o raio em centímetros, a área sai em cm² — um número limpo e fácil de conferir.',
      lines: [
        {
          label: 'Área do círculo (A = π × r²)',
          formula: `A = 3,14 × ${rCm} × ${rCm} = ${aCm2} cm²`,
        },
      ],
      tip: `Compare ${aCm2} cm² com ${aM2} m² — zero chance de errar um zero na calculadora!`,
    },
    {
      num: 3,
      title: 'Ache a vazão direto em mL/s',
      summary:
        'Multiplicando cm² por cm/s você obtém cm³/s — que já é exatamente mililitros por segundo (mL/s).',
      lines: [
        {
          label: 'Vazão Q = A × v',
          formula: `Q = ${aCm2} × ${vCms} = ${qMls} mL/s`,
        },
        {
          label: 'Comparação prática',
          formula: `≈ ${formatPtBr(results.americanCupsPerSecond, 2)} copo(s) americano(s) de 212 mL por segundo`,
        },
      ],
      tip: '1 cm³ = 1 mL sempre. Essa equivalência economiza duas conversões!',
    },
    {
      num: 4,
      title: `Divida o volume em mL (${vMl} mL)`,
      summary:
        'Como 1 litro = 1.000 mL, convertemos os litros do tambor e dividimos pela vazão em mL/s.',
      lines: [
        {
          label: 'Tempo total em segundos',
          formula: `t = ${vMl} ÷ ${qMls} = ${tS} segundos`,
        },
        {
          label: 'Resultado no relógio',
          formula: `${clockStr} (${tMinDec} min)`,
        },
      ],
      tip: 'O resultado final é idêntico ao método em metros, mas com contas muito mais seguras.',
    },
  ];

  const steps = method === 'si' ? siSteps : cmSteps;
  const current = steps.find((s) => s.num === activeStep) ?? steps[0];

  return (
    <section id="passos" className="space-y-8">
      {/* Header + Method Segmented Toggle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 text-balance">
            Resolvendo em 4 passos curtos e limpos
          </h2>
          <p className="text-slate-600 mt-1.5">
            Clique em cada passo para acompanhar a conta com os valores atuais ou alterne para o{' '}
            <strong className="font-semibold text-slate-900">Pulo do Gato (cm e mL)</strong>.
          </p>
        </div>

        {/* Method Segmented Control */}
        <div
          role="tablist"
          aria-label="Escolha o método de cálculo"
          className="inline-flex items-center p-1 bg-slate-200/70 rounded-lg self-start md:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={method === 'si'}
            onClick={() => setMethod('si')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              method === 'si'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Método Padrão (m e m³)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={method === 'cm'}
            onClick={() => setMethod('cm')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              method === 'cm'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pulo do Gato (cm e mL)
          </button>
        </div>
      </div>

      {/* Interactive 4-Step Selector Strip + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Step Navigation Column */}
        <div className="lg:col-span-5 space-y-2.5">
          {steps.map((step) => {
            const isActive = step.num === current.num;
            return (
              <button
                key={step.num}
                type="button"
                onClick={() => onSelectStep(step.num)}
                className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-white border-sky-500 shadow-xs'
                    : 'bg-white/70 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-semibold shrink-0 ${
                      isActive
                        ? method === 'cm'
                          ? 'bg-amber-600 text-white'
                          : 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {step.num}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">
                      Passo {step.num} — {step.title}
                    </div>
                    <div className="text-xs font-mono text-slate-600 mt-1 truncate tabular-nums">
                      {step.lines[step.lines.length - 1].formula}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Detailed Explanation Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div className="text-xs font-mono font-medium text-slate-500">
              {method === 'si' ? 'Unidades do Sistema Internacional (m / L)' : 'Atalho sem zeros (cm / mL)'}
              {' · '}
              Passo {current.num} de 4
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={current.num === 1}
                onClick={() => onSelectStep(Math.max(1, current.num - 1))}
                className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={current.num === 4}
                onClick={() => onSelectStep(Math.min(4, current.num + 1))}
                className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                Próximo
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-slate-900">{current.title}</h3>
            <p className="text-slate-600 mt-2 leading-relaxed">{current.summary}</p>
          </div>

          {/* Calculations */}
          <div className="space-y-3 bg-slate-50 border border-slate-200/80 rounded-lg p-4 sm:p-5">
            {current.lines.map((line, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 py-1.5 border-b last:border-b-0 border-slate-200/70"
              >
                <span className="text-xs font-medium text-slate-600">{line.label}</span>
                <code className="text-sm sm:text-base font-mono font-semibold text-slate-900 tabular-nums">
                  {line.formula}
                </code>
              </div>
            ))}
          </div>

          {/* Pedagogical Callout (without thick left border) */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-950 text-sm">
            {method === 'cm' ? (
              <Lightbulb className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            )}
            <p className="leading-relaxed">{current.tip}</p>
          </div>

          {/* Sanity Check Banner on Step 4 or Pulo do Gato */}
          <div
            id="pulo-do-gato"
            className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold">Checagem rápida de bom senso</div>
              <p className="leading-relaxed text-emerald-900">
                Se saem <span className="font-mono font-medium">{qMls} mL/s</span> (cerca de{' '}
                <span className="font-mono font-medium">
                  {formatPtBr(results.americanCupsPerSecond, 2)}
                </span>{' '}
                copo americano por segundo), em 1 minuto (60 s) entram cerca de{' '}
                <span className="font-mono font-medium">
                  {formatPtBr(results.litersPerMinute, 1)} litros
                </span>
                . Multiplicando por{' '}
                <span className="font-mono font-medium">
                  {Math.ceil(results.timeMinutesDecimal)} minutos
                </span>
                : {formatPtBr(results.litersPerMinute, 1)} × {Math.ceil(results.timeMinutesDecimal)}{' '}
                ≈{' '}
                <span className="font-mono font-semibold">
                  {formatPtBr(
                    results.litersPerMinute * Math.ceil(results.timeMinutesDecimal),
                    0
                  )}{' '}
                  litros
                </span>
                . Bate perfeitamente com o tambor de {V} litros!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
