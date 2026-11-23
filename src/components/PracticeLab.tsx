import React, { useState } from 'react';
import { CheckCircle2, HelpCircle, RefreshCw, XCircle } from 'lucide-react';
import {
  DEFAULT_PARAMS,
  HydraulicParams,
  calculateHydraulics,
  formatClockDuration,
  formatPtBr,
  parsePtBrNumber,
} from '../utils/hydraulics';

interface StepInputState {
  value: string;
  status: 'idle' | 'correct' | 'incorrect';
  feedback: string;
}

const initialInputs = (): Record<'r' | 'a' | 'q' | 't', StepInputState> => ({
  r: { value: '', status: 'idle', feedback: '' },
  a: { value: '', status: 'idle', feedback: '' },
  q: { value: '', status: 'idle', feedback: '' },
  t: { value: '', status: 'idle', feedback: '' },
});

const PRESET_EXERCISES: HydraulicParams[] = [
  DEFAULT_PARAMS,
  { volumeLiters: 200, diameterMm: 40, velocityMs: 0.5 },
  { volumeLiters: 150, diameterMm: 20, velocityMs: 0.4 },
  { volumeLiters: 300, diameterMm: 50, velocityMs: 0.2 },
];

export const PracticeLab: React.FC = () => {
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [problem, setProblem] = useState<HydraulicParams>(DEFAULT_PARAMS);
  const [inputs, setInputs] = useState(initialInputs);
  const [unitMode, setUnitMode] = useState<'si' | 'cm'>('si');

  const res = calculateHydraulics(problem);

  const handleLoadExercise = (nextIdx: number) => {
    setExerciseIdx(nextIdx);
    setProblem(PRESET_EXERCISES[nextIdx]);
    setInputs(initialInputs());
  };

  const handleGenerateRandom = () => {
    const volumes = [100, 120, 180, 214, 250, 320, 400];
    const diameters = [20, 24, 30, 40, 50, 60];
    const velocities = [0.2, 0.25, 0.3, 0.4, 0.5, 0.8];
    const next: HydraulicParams = {
      volumeLiters: volumes[Math.floor(Math.random() * volumes.length)],
      diameterMm: diameters[Math.floor(Math.random() * diameters.length)],
      velocityMs: velocities[Math.floor(Math.random() * velocities.length)],
    };
    setExerciseIdx(-1);
    setProblem(next);
    setInputs(initialInputs());
  };

  const checkField = (field: 'r' | 'a' | 'q' | 't') => {
    const parsed = parsePtBrNumber(inputs[field].value);
    if (parsed === null) {
      setInputs((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          status: 'incorrect',
          feedback: 'Digite um número válido (você pode usar vírgula ou ponto).',
        },
      }));
      return;
    }

    const isClose = (actual: number, expected: number, relTol = 0.025) => {
      if (expected === 0) return Math.abs(actual) < 0.0001;
      return Math.abs(actual - expected) <= Math.max(Math.abs(expected) * relTol, 1e-6);
    };

    if (field === 'r') {
      const expected = unitMode === 'si' ? res.radiusM : res.radiusCm;
      if (isClose(parsed, expected, 0.015)) {
        setInputs((prev) => ({
          ...prev,
          r: {
            ...prev.r,
            status: 'correct',
            feedback: `Correto! O raio é metade do diâmetro: ${formatPtBr(expected, 4)} ${unitMode === 'si' ? 'm' : 'cm'}.`,
          },
        }));
      } else if (
        isClose(parsed, unitMode === 'si' ? res.diameterM : res.diameterCm, 0.02)
      ) {
        setInputs((prev) => ({
          ...prev,
          r: {
            ...prev.r,
            status: 'incorrect',
            feedback: 'Você digitou o diâmetro inteiro! Lembre-se de dividir por 2 para obter o raio.',
          },
        }));
      } else if (unitMode === 'si' && isClose(parsed, res.radiusCm, 0.02)) {
        setInputs((prev) => ({
          ...prev,
          r: {
            ...prev.r,
            status: 'incorrect',
            feedback: 'Esse valor está em centímetros. Para metros, divida os milímetros por 1.000.',
          },
        }));
      } else {
        setInputs((prev) => ({
          ...prev,
          r: {
            ...prev.r,
            status: 'incorrect',
            feedback: `Dica: divida ${problem.diameterMm} mm ${unitMode === 'si' ? 'por 1.000 e depois por 2' : 'por 10 e depois por 2'}.`,
          },
        }));
      }
      return;
    }

    if (field === 'a') {
      const expected = unitMode === 'si' ? res.areaM2 : res.areaCm2;
      if (isClose(parsed, expected, 0.02)) {
        setInputs((prev) => ({
          ...prev,
          a: {
            ...prev.a,
            status: 'correct',
            feedback: `Perfeito! A = 3,14 × r² = ${formatPtBr(expected, 7)} ${unitMode === 'si' ? 'm²' : 'cm²'}.`,
          },
        }));
      } else if (
        isClose(
          parsed,
          3.14 * Math.pow(unitMode === 'si' ? res.diameterM : res.diameterCm, 2),
          0.03
        )
      ) {
        setInputs((prev) => ({
          ...prev,
          a: {
            ...prev.a,
            status: 'incorrect',
            feedback: 'Atenção: você usou o diâmetro na fórmula em vez do raio (r)!',
          },
        }));
      } else {
        setInputs((prev) => ({
          ...prev,
          a: {
            ...prev.a,
            status: 'incorrect',
            feedback: `Dica: faça 3,14 × ${formatPtBr(unitMode === 'si' ? res.radiusM : res.radiusCm, 4)} × ${formatPtBr(unitMode === 'si' ? res.radiusM : res.radiusCm, 4)}.`,
          },
        }));
      }
      return;
    }

    if (field === 'q') {
      const expected = unitMode === 'si' ? res.flowLs : res.flowMls;
      if (isClose(parsed, expected, 0.025)) {
        setInputs((prev) => ({
          ...prev,
          q: {
            ...prev.q,
            status: 'correct',
            feedback: `Excelente! Entram ${formatPtBr(expected, 5)} ${unitMode === 'si' ? 'L/s' : 'mL/s'}.`,
          },
        }));
      } else if (unitMode === 'si' && isClose(parsed, res.flowM3s, 0.03)) {
        setInputs((prev) => ({
          ...prev,
          q: {
            ...prev.q,
            status: 'incorrect',
            feedback: 'Você achou a vazão em m³/s! Falta multiplicar por 1.000 para transformar em L/s.',
          },
        }));
      } else {
        setInputs((prev) => ({
          ...prev,
          q: {
            ...prev.q,
            status: 'incorrect',
            feedback:
              unitMode === 'si'
                ? `Dica: multiplique A (${formatPtBr(res.areaM2, 7)}) × v (${formatPtBr(problem.velocityMs, 2)}) e depois × 1.000.`
                : `Dica: multiplique A (${formatPtBr(res.areaCm2, 4)} cm²) × v (${formatPtBr(res.velocityCms, 0)} cm/s).`,
          },
        }));
      }
      return;
    }

    if (field === 't') {
      const expected = res.timeSeconds;
      if (isClose(parsed, expected, 0.025)) {
        setInputs((prev) => ({
          ...prev,
          t: {
            ...prev.t,
            status: 'correct',
            feedback: `Isso mesmo! ${formatPtBr(expected, 2, 2)} segundos (ou ${formatClockDuration(expected)}).`,
          },
        }));
      } else if (isClose(parsed, res.timeMinutesDecimal, 0.03)) {
        setInputs((prev) => ({
          ...prev,
          t: {
            ...prev.t,
            status: 'incorrect',
            feedback: 'Esse valor está em minutos! Aqui pedimos o resultado em segundos (t = V ÷ Q).',
          },
        }));
      } else {
        setInputs((prev) => ({
          ...prev,
          t: {
            ...prev.t,
            status: 'incorrect',
            feedback:
              unitMode === 'si'
                ? `Dica: divida ${problem.volumeLiters} L por ${formatPtBr(res.flowLs, 5)} L/s.`
                : `Dica: divida ${formatPtBr(res.volumeMl, 0)} mL por ${formatPtBr(res.flowMls, 2)} mL/s.`,
          },
        }));
      }
    }
  };

  const revealAnswer = (field: 'r' | 'a' | 'q' | 't') => {
    const valMap: Record<'r' | 'a' | 'q' | 't', string> = {
      r: formatPtBr(unitMode === 'si' ? res.radiusM : res.radiusCm, 4),
      a: formatPtBr(unitMode === 'si' ? res.areaM2 : res.areaCm2, 7),
      q: formatPtBr(unitMode === 'si' ? res.flowLs : res.flowMls, 5),
      t: formatPtBr(res.timeSeconds, 2, 2),
    };
    setInputs((prev) => ({
      ...prev,
      [field]: {
        value: valMap[field],
        status: 'correct',
        feedback: 'Valor preenchido para consulta.',
      },
    }));
  };

  const completedCount = (['r', 'a', 'q', 't'] as const).filter(
    (k) => inputs[k].status === 'correct'
  ).length;

  const fieldsConfig: Array<{
    key: 'r' | 'a' | 'q' | 't';
    stepNum: number;
    label: string;
    unit: string;
    placeholder: string;
  }> = [
    {
      key: 'r',
      stepNum: 1,
      label: unitMode === 'si' ? 'Raio do tubo (r) em metros' : 'Raio do tubo (r) em cm',
      unit: unitMode === 'si' ? 'm' : 'cm',
      placeholder: unitMode === 'si' ? 'Ex: 0,015' : 'Ex: 1,5',
    },
    {
      key: 'a',
      stepNum: 2,
      label: unitMode === 'si' ? 'Área da boca do tubo (A) em m²' : 'Área da boca do tubo (A) em cm²',
      unit: unitMode === 'si' ? 'm²' : 'cm²',
      placeholder: unitMode === 'si' ? 'Ex: 0,0007065' : 'Ex: 7,065',
    },
    {
      key: 'q',
      stepNum: 3,
      label: unitMode === 'si' ? 'Vazão (Q) em litros por segundo' : 'Vazão (Q) em mL por segundo',
      unit: unitMode === 'si' ? 'L/s' : 'mL/s',
      placeholder: unitMode === 'si' ? 'Ex: 0,21195' : 'Ex: 211,95',
    },
    {
      key: 't',
      stepNum: 4,
      label: 'Tempo total para encher (t) em segundos',
      unit: 's',
      placeholder: 'Ex: 1009,67',
    },
  ];

  return (
    <section id="praticar" className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Pratique passo a passo
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Resolva os 4 passos na calculadora usando π = 3,14 e confira se acertou cada etapa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setUnitMode('si');
                setInputs(initialInputs());
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                unitMode === 'si' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Responder em m e L/s
            </button>
            <button
              type="button"
              onClick={() => {
                setUnitMode('cm');
                setInputs(initialInputs());
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                unitMode === 'cm' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Responder em cm e mL/s
            </button>
          </div>

          <button
            type="button"
            onClick={handleGenerateRandom}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Novo problema</span>
          </button>
        </div>
      </div>

      {/* Problem Prompt & Preset Selector */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-500">Enunciado ativo</div>
          <p className="text-base text-slate-900 leading-relaxed">
            Um tambor de{' '}
            <strong className="font-mono font-semibold text-sky-800">
              {formatPtBr(problem.volumeLiters, 0)} litros
            </strong>{' '}
            recebe líquido por um tubo de{' '}
            <strong className="font-mono font-semibold text-sky-800">
              {formatPtBr(problem.diameterMm, 0)} mm
            </strong>{' '}
            a uma velocidade de{' '}
            <strong className="font-mono font-semibold text-sky-800">
              {formatPtBr(problem.velocityMs, 2)} m/s
            </strong>
            . Quanto tempo leva para encher?
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 shrink-0">
          {PRESET_EXERCISES.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadExercise(idx)}
              className={`px-2.5 py-1.5 text-xs font-mono rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                exerciseIdx === idx
                  ? 'bg-sky-600 border-sky-600 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {idx === 0 ? '214 L (Aula)' : `Desafio ${idx}`}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Input Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fieldsConfig.map((item) => {
          const state = inputs[item.key];
          return (
            <div
              key={item.key}
              className={`p-4 rounded-xl border transition-colors space-y-3 ${
                state.status === 'correct'
                  ? 'border-emerald-300 bg-emerald-50/40'
                  : state.status === 'incorrect'
                  ? 'border-rose-300 bg-rose-50/40'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={`practice-${item.key}`}
                  className="text-sm font-semibold text-slate-900"
                >
                  Passo {item.stepNum}: {item.label}
                </label>
                <button
                  type="button"
                  onClick={() => revealAnswer(item.key)}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-sky-700 cursor-pointer whitespace-nowrap"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Ver resposta</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    id={`practice-${item.key}`}
                    type="text"
                    inputMode="decimal"
                    value={state.value}
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        [item.key]: { value: e.target.value, status: 'idle', feedback: '' },
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') checkField(item.key);
                    }}
                    placeholder={item.placeholder}
                    className="w-full px-3.5 py-2 pr-14 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/15"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 pointer-events-none">
                    {item.unit}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => checkField(item.key)}
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Conferir
                </button>
              </div>

              {state.status !== 'idle' && (
                <div
                  className={`flex items-start gap-2 text-xs leading-relaxed ${
                    state.status === 'correct' ? 'text-emerald-800' : 'text-rose-800'
                  }`}
                >
                  {state.status === 'correct' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{state.feedback}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Line */}
      <div className="flex items-center justify-between text-xs text-slate-600 pt-2">
        <span>
          Etapas concluídas nesta atividade:{' '}
          <strong className="font-mono text-slate-900">{completedCount}/4</strong>
        </span>
        {completedCount === 4 && (
          <span className="font-semibold text-emerald-700">
            Exercício completo — tempo final: {formatClockDuration(res.timeSeconds)}
          </span>
        )}
      </div>
    </section>
  );
};
