export type Medicamento = {
  nome: string;
  unidade: string;
  estoque: number;
};

export type EstoqueData = {
  dataAtualizacao: string;
  items: Medicamento[];
};

export type StatusEstoque = "zerado" | "com-estoque";

export function getStatus(m: Medicamento): StatusEstoque {
  if (m.estoque <= 0) return "zerado";
  return "com-estoque";
}
