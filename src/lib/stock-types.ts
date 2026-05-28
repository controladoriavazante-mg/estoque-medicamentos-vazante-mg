export type Medicamento = {
  nome: string;
  unidade: string;
  estoque: number;
  consumo: number | null;
  periodo: number | null;
  tr: number | null;
  pr: number | null;
};

export type EstoqueData = {
  dataAtualizacao: string;
  items: Medicamento[];
};

export function calcCMM(m: Medicamento): number | null {
  if (m.consumo != null && m.periodo && m.periodo > 0) return m.consumo / m.periodo;
  return null;
}

export function calcCobertura(m: Medicamento): number | null {
  const cmm = calcCMM(m);
  if (!cmm || cmm <= 0) return null;
  return m.estoque / cmm;
}

export function calcPontoRessuprimento(m: Medicamento): number | null {
  const cmm = calcCMM(m);
  if (cmm == null || m.tr == null) return null;
  return cmm * m.tr;
}

export function calcQR(m: Medicamento): number | null {
  const cmm = calcCMM(m);
  if (cmm == null || m.tr == null || m.pr == null) return null;
  const qr = cmm * m.tr + cmm * m.pr - m.estoque;
  return Math.max(0, Math.round(qr));
}

export type StatusEstoque = "zerado" | "critico" | "baixo" | "ok" | "sem-info";

export function getStatus(m: Medicamento): StatusEstoque {
  if (m.estoque <= 0) return "zerado";
  const pr = calcPontoRessuprimento(m);
  if (pr == null) return "sem-info";
  if (m.estoque <= pr) return "critico";
  if (m.estoque <= pr * 1.5) return "baixo";
  return "ok";
}
