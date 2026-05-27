import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Calendar,
  Download,
  Package,
  PackageX,
  Pencil,
  Pill,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useStockStore } from "@/lib/stock-store";
import {
  calcCMM,
  calcCobertura,
  calcPontoRessuprimento,
  calcQR,
  getStatus,
  type StatusEstoque,
} from "@/lib/stock-types";
import { exportToXlsx, parseEstoqueFile } from "@/lib/xlsx-io";
import { MedicamentoDialog } from "@/components/medicamento-dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel de Estoque - Assistência Farmacêutica" },
      {
        name: "description",
        content:
          "Painel público de controle e monitoramento de estoque de medicamentos da assistência farmacêutica municipal.",
      },
    ],
  }),
  component: Painel,
});

const statusInfo: Record<StatusEstoque, { label: string; cls: string; dot: string }> = {
  zerado: { label: "Zerado", cls: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
  critico: { label: "Crítico", cls: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  baixo: { label: "Baixo", cls: "bg-yellow-100 text-yellow-800 border-yellow-200", dot: "bg-yellow-500" },
  ok: { label: "Adequado", cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  "sem-info": { label: "Sem parâmetro", cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};

function fmtNum(n: number | null | undefined, digits = 0) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", { maximumFractionDigits: digits });
}

function Painel() {
  const { data, replaceAll, upsertItem, removeItem } = useStockStore();
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.items;
    return data.items.filter((m) => m.nome.toLowerCase().includes(q));
  }, [data.items, query]);

  const totalItens = data.items.length;
  const totalZerados = data.items.filter((m) => m.estoque <= 0).length;
  const totalUnidades = data.items.reduce((s, m) => s + (m.estoque || 0), 0);

  async function handleImport(file: File) {
    try {
      const parsed = await parseEstoqueFile(file);
      if (!parsed.items.length) {
        toast.error("Nenhum medicamento encontrado na planilha.");
        return;
      }
      replaceAll(parsed);
      toast.success(`Planilha importada: ${parsed.items.length} medicamentos.`);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível ler a planilha. Verifique o formato.");
    }
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-slate-50">
        <Toaster richColors position="top-right" />

        {/* Header */}
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-600 p-2 text-white">
                <Pill className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  Painel de Estoque — Assistência Farmacêutica
                </h1>
                <p className="text-sm text-slate-500">
                  Monitoramento do estoque da Central de Abastecimento Farmacêutico
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="h-4 w-4" />
              Última atualização: <strong className="text-slate-900">{data.dataAtualizacao}</strong>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard
              icon={<Pill className="h-5 w-5" />}
              label="Medicamentos cadastrados"
              value={fmtNum(totalItens)}
              tone="emerald"
            />
            <SummaryCard
              icon={<PackageX className="h-5 w-5" />}
              label="Itens com estoque zerado"
              value={fmtNum(totalZerados)}
              tone="red"
            />
            <SummaryCard
              icon={<Package className="h-5 w-5" />}
              label="Total de unidades em estoque"
              value={fmtNum(totalUnidades)}
              tone="blue"
            />
          </div>

          {/* Toolbar */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Pesquisar medicamento..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImport(f);
                  e.target.value = "";
                }}
              />
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Importar Excel
              </Button>
              <Button
                variant="outline"
                onClick={() => exportToXlsx(filtered)}
                disabled={filtered.length === 0}
              >
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
              <MedicamentoDialog
                onSave={(m) => {
                  upsertItem(m);
                  toast.success("Medicamento salvo.");
                }}
                trigger={
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Novo
                  </Button>
                }
              />
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            {filtered.length} de {totalItens} medicamentos
          </p>

          {/* Table */}
          <div className="mt-3 overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="min-w-[260px]">Medicamento</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead className="text-right">CMM</TableHead>
                    <TableHead className="text-right">Cobertura (m)</TableHead>
                    <TableHead className="text-right">Ponto Ressup.</TableHead>
                    <TableHead className="text-right">Qtd. Repor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[110px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-10 text-center text-slate-500">
                        Nenhum medicamento encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((m) => {
                    const status = getStatus(m);
                    const info = statusInfo[status];
                    const cmm = calcCMM(m);
                    const cob = calcCobertura(m);
                    const pr = calcPontoRessuprimento(m);
                    const qr = calcQR(m);
                    return (
                      <TableRow key={m.nome}>
                        <TableCell className="font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block h-2 w-2 rounded-full ${info.dot}`} />
                            {m.nome}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">{m.unidade || "—"}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {fmtNum(m.estoque)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-slate-600">
                          {fmtNum(cmm, 1)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-slate-600">
                          {fmtNum(cob, 1)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-slate-600">
                          {fmtNum(pr)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-slate-600">
                          {fmtNum(qr)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={info.cls}>
                            {info.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <MedicamentoDialog
                              initial={m}
                              onSave={(updated, original) => {
                                upsertItem(updated, original);
                                toast.success("Medicamento atualizado.");
                              }}
                              trigger={
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Editar</TooltipContent>
                                </Tooltip>
                              }
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir medicamento?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação removerá <strong>{m.nome}</strong> do estoque.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      removeItem(m.nome);
                                      toast.success("Medicamento removido.");
                                    }}
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            CMM = Consumo médio mensal · Cobertura = meses estimados de estoque · Ponto de
            ressuprimento = CMM × TR · Qtd. Repor = CMM × (TR + PR) − estoque atual.
          </p>
        </main>
      </div>
    </TooltipProvider>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "emerald" | "red" | "blue";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
  } as const;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{label}</CardTitle>
        <div className={`rounded-md p-2 ${tones[tone]}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
      </CardContent>
    </Card>
  );
}
