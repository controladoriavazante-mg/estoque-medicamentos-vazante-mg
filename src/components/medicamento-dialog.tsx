import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Medicamento } from "@/lib/stock-types";

type Props = {
  trigger: React.ReactNode;
  initial?: Medicamento;
  onSave: (m: Medicamento, originalNome?: string) => void;
  title?: string;
};

const empty: Medicamento = {
  nome: "",
  unidade: "",
  estoque: 0,
};

export function MedicamentoDialog({ trigger, initial, onSave, title }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Medicamento>(initial ?? empty);

  const reset = () => setForm(initial ?? empty);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title ?? (initial ? "Editar medicamento" : "Novo medicamento")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="nome">Nome do medicamento/produto</Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex.: DIPIRONA 500 MG"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="unidade">Unidade</Label>
              <Input
                id="unidade"
                value={form.unidade}
                onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                placeholder="COMPRIMIDO"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="estoque">Estoque atual</Label>
              <Input
                id="estoque"
                type="number"
                value={form.estoque}
                onChange={(e) => setForm({ ...form, estoque: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!form.nome.trim()) return;
              onSave({ ...form, nome: form.nome.trim().toUpperCase() }, initial?.nome);
              setOpen(false);
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
