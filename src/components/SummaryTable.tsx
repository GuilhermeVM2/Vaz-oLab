import React from 'react';
import { HydraulicParams, HydraulicResults, formatClockDuration, formatPtBr } from '../utils/hydraulics';

interface SummaryTableProps {
  params: HydraulicParams;
  results: HydraulicResults;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({ params, results }) => {
  const rows = [
    {
      measure: 'Volume do tambor (V)',
      original: `${formatPtBr(params.volumeLiters, 0)} litros`,
      converted: `${formatPtBr(params.volumeLiters, 0)} litros (${formatPtBr(results.volumeMl, 0)} mL)`,
    },
    {
      measure: 'Diâmetro do tubo (Ø)',
      original: `${formatPtBr(params.diameterMm, 0)} mm`,
      converted: `${formatPtBr(results.diameterM, 4)} m (raio = ${formatPtBr(results.radiusM, 4)} m)`,
    },
    {
      measure: 'Área do tubo (A)',
      original: `${formatPtBr(results.areaCm2, 4)} cm²`,
      converted: `${formatPtBr(results.areaM2, 7)} m²`,
    },
    {
      measure: 'Velocidade (v)',
      original: `${formatPtBr(params.velocityMs, 2)} m/s`,
      converted: `${formatPtBr(results.velocityCms, 0)} cm/s`,
    },
    {
      measure: 'Vazão (Q)',
      original: `${formatPtBr(results.flowM3s, 8)} m³/s`,
      converted: `${formatPtBr(results.flowLs, 5)} L/s (${formatPtBr(results.flowMls, 2)} mL/s)`,
    },
    {
      measure: 'Tempo para encher (t)',
      original: `${formatPtBr(results.timeSeconds, 2, 2)} segundos`,
      converted: `${formatClockDuration(results.timeSeconds)} (${formatPtBr(results.timeMinutesDecimal, 2, 2)} min)`,
      highlight: true,
    },
  ];

  return (
    <section id="resumo" className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Quadro resumo para enxergar tudo de uma vez
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Todas as grandezas originais e convertidas lado a lado, atualizadas conforme o simulador.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th scope="col" className="py-3.5 px-5">
                  O que estamos medindo
                </th>
                <th scope="col" className="py-3.5 px-5">
                  Valor original
                </th>
                <th scope="col" className="py-3.5 px-5">
                  Valor convertido / calculado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {rows.map((row) => (
                <tr
                  key={row.measure}
                  className={row.highlight ? 'bg-sky-50/60' : 'hover:bg-slate-50/70 transition-colors'}
                >
                  <td className="py-3.5 px-5 font-semibold text-slate-900">{row.measure}</td>
                  <td className="py-3.5 px-5 font-mono text-slate-700 tabular-nums">
                    {row.original}
                  </td>
                  <td
                    className={`py-3.5 px-5 font-mono tabular-nums ${
                      row.highlight ? 'font-bold text-sky-900' : 'text-slate-900'
                    }`}
                  >
                    {row.converted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
