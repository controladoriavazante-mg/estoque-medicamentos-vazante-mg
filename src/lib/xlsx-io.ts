import * as XLSX from "xlsx";
import type { EstoqueData, Medicamento } from "./stock-types";

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function parseEstoqueFile(file: File): Promise<EstoqueData> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName =
    wb.SheetNames.find((s) => s.toUpperCase().includes("ESTOQUE")) ?? wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });

  let dataAtualizacao = "";
  let headerIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const r = rows[i] ?? [];
    const c0 = r[0] ? String(r[0]) : "";
    if (c0.toUpperCase().includes("ATUALIZA")) {
      dataAtualizacao = c0.replace(/.*:/, "").trim();
    }
    if (
      c0.toUpperCase().includes("MEDICAMENTO") ||
      c0.toUpperCase().includes("PRODUTO")
    ) {
      headerIdx = i;
    }
  }
  if (headerIdx < 0) headerIdx = 0;

  const items: Medicamento[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i] ?? [];
    const nome = r[0] ? String(r[0]).trim() : "";
    if (!nome || nome.length < 2) continue;
    if (/^(MEDICAMENTOS|TOTAL|RESPONS|DATA)/i.test(nome)) continue;
    items.push({
      nome,
      unidade: r[1] ? String(r[1]).trim() : "",
      estoque: num(r[2]) ?? 0,
    });
  }

  if (!dataAtualizacao) {
    dataAtualizacao = new Date().toLocaleDateString("pt-BR");
  }

  return { dataAtualizacao, items };
}

export function exportToXlsx(items: Medicamento[], filename = "estoque-filtrado.xlsx") {
  const rows = items.map((m) => ({
    Medicamento: m.nome,
    Unidade: m.unidade,
    "Estoque atual": m.estoque,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Estoque");
  XLSX.writeFile(wb, filename);
}
