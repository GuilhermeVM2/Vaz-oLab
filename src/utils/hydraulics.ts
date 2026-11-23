export interface HydraulicParams {
  volumeLiters: number; // Volume do tambor em litros (ex: 214)
  diameterMm: number;   // Diâmetro do tubo em mm (ex: 30)
  velocityMs: number;   // Velocidade do líquido em m/s (ex: 0.3)
}

export interface HydraulicResults {
  // SI (Metros)
  diameterM: number;
  radiusM: number;
  radiusSquaredM2: number;
  areaM2: number;
  flowM3s: number;
  flowLs: number;

  // "Pulo do gato" (Centímetros e mL)
  diameterCm: number;
  radiusCm: number;
  areaCm2: number;
  velocityCms: number;
  flowMls: number;
  volumeMl: number;

  // Tempo e checagens
  timeSeconds: number;
  timeSecondsRounded: number;
  timeMinutesDecimal: number;
  minutesWhole: number;
  secondsRemainder: number;
  litersPerMinute: number;
  americanCupsPerSecond: number; // Copo americano ~212 mL (ou 200 mL, na explicação: 212 mL)
}

export const PI_VALUE = 3.14;

export const DEFAULT_PARAMS: HydraulicParams = {
  volumeLiters: 214,
  diameterMm: 30,
  velocityMs: 0.3,
};

export function calculateHydraulics(params: HydraulicParams): HydraulicResults {
  const { volumeLiters, diameterMm, velocityMs } = params;

  // Passo 1 — Metros
  const diameterM = diameterMm / 1000;
  const radiusM = diameterM / 2;

  // Passo 2 — Área (A = 3,14 * r^2)
  const radiusSquaredM2 = radiusM * radiusM;
  const areaM2 = PI_VALUE * radiusSquaredM2;

  // Passo 3 — Vazão (Q = A * v)
  const flowM3s = areaM2 * velocityMs;
  const flowLs = flowM3s * 1000;

  // Pulo do gato (cm e mL)
  const diameterCm = diameterMm / 10;
  const radiusCm = diameterCm / 2;
  const areaCm2 = PI_VALUE * radiusCm * radiusCm;
  const velocityCms = velocityMs * 100;
  const flowMls = areaCm2 * velocityCms;
  const volumeMl = volumeLiters * 1000;

  // Passo 4 — Tempo (t = V / Q)
  const timeSeconds = flowLs > 0 ? volumeLiters / flowLs : 0;
  const timeSecondsRounded = Math.round(timeSeconds);
  const timeMinutesDecimal = timeSeconds / 60;

  // Arredondamento prático em relógio baseado no tempo arredondado ou exato
  const minutesWhole = Math.floor(timeSecondsRounded / 60);
  const secondsRemainder = timeSecondsRounded % 60;

  const litersPerMinute = flowLs * 60;
  const americanCupsPerSecond = flowMls / 212;

  return {
    diameterM,
    radiusM,
    radiusSquaredM2,
    areaM2,
    flowM3s,
    flowLs,
    diameterCm,
    radiusCm,
    areaCm2,
    velocityCms,
    flowMls,
    volumeMl,
    timeSeconds,
    timeSecondsRounded,
    timeMinutesDecimal,
    minutesWhole,
    secondsRemainder,
    litersPerMinute,
    americanCupsPerSecond,
  };
}

/**
 * Formata números no padrão brasileiro (vírgula decimal, ponto de milhar),
 * preservando zeros significativos solicitados ou evitando notação científica.
 */
export function formatPtBr(value: number, maxDecimals = 6, minDecimals = 0): string {
  if (!Number.isFinite(value)) return '0';
  // Evita resíduos de ponto flutuante (ex: 0.00022500000000000002 -> 0.000225)
  const clean = Number(value.toPrecision(10));
  return clean.toLocaleString('pt-BR', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });
}

export function formatClockDuration(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;

  if (hours > 0) {
    return `${hours} h ${mins} min e ${secs} s`;
  }
  if (mins > 0) {
    return `${mins} min e ${secs} s`;
  }
  return `${secs} s`;
}

export function parsePtBrNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s+/g, '');
  if (!trimmed) return null;

  // Se houver tanto ponto quanto vírgula, assume ponto = milhar e vírgula = decimal (ex: 1.009,67)
  let normalized = trimmed;
  if (trimmed.includes(',') && trimmed.includes('.')) {
    normalized = trimmed.replace(/\./g, '').replace(',', '.');
  } else if (trimmed.includes(',')) {
    normalized = trimmed.replace(',', '.');
  } else if ((trimmed.match(/\./g) || []).length > 1) {
    // Múltiplos pontos são milhares
    normalized = trimmed.replace(/\./g, '');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildWordPlainText(params: HydraulicParams, res: HydraulicResults): string {
  const V = formatPtBr(params.volumeLiters, 2);
  const dMm = formatPtBr(params.diameterMm, 2);
  const dCm = formatPtBr(res.diameterCm, 2);
  const dM = formatPtBr(res.diameterM, 4);
  const rM = formatPtBr(res.radiusM, 4);
  const rSq = formatPtBr(res.radiusSquaredM2, 8);
  const aM2 = formatPtBr(res.areaM2, 7);
  const vMs = formatPtBr(params.velocityMs, 2);
  const vCms = formatPtBr(res.velocityCms, 1);
  const qM3s = formatPtBr(res.flowM3s, 8);
  const qLs = formatPtBr(res.flowLs, 5);
  const qMls = formatPtBr(res.flowMls, 2);
  const tS = formatPtBr(res.timeSeconds, 2, 2);
  const tSRound = formatPtBr(res.timeSecondsRounded, 0);
  const tMinDec = formatPtBr(res.timeMinutesDecimal, 2, 2);
  const clockStr = formatClockDuration(res.timeSeconds);

  return `1. Traduzindo o problema para a vida real

Imagine um tambor grande de ${V} litros (daqueles tambores metálicos altos usados na indústria).
Conectado a ele tem um tubo de ${dMm} mm (${dCm} cm). O líquido está escorrendo por esse cano, andando ${vMs} metro a cada segundo (ou seja, ${vCms} cm por segundo).
Pergunta: quanto tempo você terá que esperar até esse tambor de ${V} litros encher por completo?

2. Resolvendo em 4 passos curtos e limpos

Passo 1 — Colocar a largura do tubo em metros
Como 1 metro tem 1.000 milímetros, dividimos por 1.000:
- Diâmetro (Ø): ${dMm} mm ÷ 1.000 = ${dM} m
- Raio (metade do diâmetro): ${dM} ÷ 2 = ${rM} m

Passo 2 — Calcular a área da boca do tubo (A)
Usando a área do círculo (A = π × r²):
- A = 3,14 × ${rM} × ${rM}
- Primeiro: ${rM} × ${rM} = ${rSq}
- Multiplicando por 3,14: A = ${aM2} m²

Passo 3 — Descobrir quantos litros saem por segundo (Vazão Q)
Multiplicamos a área da boca do tubo pela velocidade (Q = A × v):
- Q = ${aM2} × ${vMs} = ${qM3s} m³/s
Como 1 m³ = 1.000 litros, multiplicamos por 1.000 para saber em litros por segundo:
- Q = ${qM3s} × 1.000 = ${qLs} L/s (cerca de ${qMls} mL por segundo)

Passo 4 — Calcular o tempo para encher os ${V} litros (t)
Dividimos o volume total pela vazão (t = V ÷ Q):
- t = ${V} ÷ ${qLs} = ${tS} segundos (arredondando: ${tSRound} segundos)
Dividindo por 60 para passar para minutos:
- ${tS} ÷ 60 = ${tMinDec} minutos (ou ${clockStr}).

Resposta prática: O tambor levará cerca de ${tSRound} segundos (ou ${clockStr}) para encher totalmente.`;
}

export function buildWordEquationLines(params: HydraulicParams, res: HydraulicResults): string[] {
  const dM = formatPtBr(res.diameterM, 4);
  const rM = formatPtBr(res.radiusM, 4);
  const aM2 = formatPtBr(res.areaM2, 7);
  const vMs = formatPtBr(params.velocityMs, 2);
  const qM3s = formatPtBr(res.flowM3s, 8);
  const qLs = formatPtBr(res.flowLs, 5);
  const V = formatPtBr(params.volumeLiters, 2);
  const tS = formatPtBr(res.timeSeconds, 2, 2);
  const clockStr = formatClockDuration(res.timeSeconds);

  return [
    `r = ${dM}/2 = ${rM} m`,
    `A = π × r^2 = 3,14 × ${rM}^2 = ${aM2} m^2`,
    `Q = A × v = ${aM2} × ${vMs} = ${qM3s} m^3/s = ${qLs} L/s`,
    `t = V/Q = ${V}/${qLs} = ${tS} s ≈ ${clockStr}`,
  ];
}
