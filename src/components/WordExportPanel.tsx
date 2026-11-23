import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import {
  HydraulicParams,
  HydraulicResults,
  buildWordEquationLines,
  buildWordPlainText,
} from '../utils/hydraulics';

interface WordExportPanelProps {
  params: HydraulicParams;
  results: HydraulicResults;
}

export const WordExportPanel: React.FC<WordExportPanelProps> = ({ params, results }) => {
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedLineIdx, setCopiedLineIdx] = useState<number | null>(null);

  const plainText = buildWordPlainText(params, results);
  const equationLines = buildWordEquationLines(params, results);

  const copyToClipboard = async (text: string, onDone: () => void) => {
    try {
      await navigator.clipboard.writeText(text);
      onDone();
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      onDone();
    }
  };

  const handleCopyFull = () => {
    copyToClipboard(plainText, () => {
      setCopiedFull(true);
      setTimeout(() => setCopiedFull(false), 2000);
    });
  };

  const handleCopyLine = (line: string, idx: number) => {
    copyToClipboard(line, () => {
      setCopiedLineIdx(idx);
      setTimeout(() => setCopiedLineIdx(null), 1800);
    });
  };

  return (
    <section id="word" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Plain Text for Word */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Texto limpo pronto para colar no Word
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Sem camadas invisíveis de fórmula que quebram a formatação ao colar.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyFull}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedFull ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedFull ? 'Texto copiado' : 'Copiar resolução completa'}</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
          {plainText}
        </pre>
      </div>

      {/* Bônus Alt + = Equations */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">
            Bônus: Editor de Equações do Word (Alt + =)
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Aperte <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[11px] font-mono">Alt + =</kbd> no Word, cole uma linha por vez e aperte{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[11px] font-mono">Ctrl + =</kbd> (ou Equação → Converter → Profissional).
          </p>
        </div>

        <div className="space-y-2.5">
          {equationLines.map((line, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-lg"
            >
              <code className="text-xs font-mono text-slate-900 break-all">{line}</code>
              <button
                type="button"
                onClick={() => handleCopyLine(line, idx)}
                aria-label={`Copiar equação ${idx + 1}`}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedLineIdx === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
