import { useEffect, useState, useCallback } from "react";
import initial from "../data/initial.json";
import type { EstoqueData, Medicamento } from "./stock-types";

const STORAGE_KEY = "estoque-farmacia-v1";

function load(): EstoqueData {
  if (typeof window === "undefined") return initial as EstoqueData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as EstoqueData;
  } catch {
    /* ignore */
  }
  return initial as EstoqueData;
}

function save(d: EstoqueData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

export function useStockStore() {
  const [data, setData] = useState<EstoqueData>(initial as EstoqueData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(load());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: EstoqueData) => {
    setData(next);
    save(next);
  }, []);

  const replaceAll = useCallback(
    (next: EstoqueData) => persist(next),
    [persist],
  );

  const upsertItem = useCallback(
    (item: Medicamento, originalNome?: string) => {
      const key = (originalNome ?? item.nome).toLowerCase();
      const exists = data.items.some((m) => m.nome.toLowerCase() === key);
      const items = exists
        ? data.items.map((m) =>
            m.nome.toLowerCase() === key ? item : m,
          )
        : [...data.items, item];
      persist({
        dataAtualizacao: new Date().toLocaleDateString("pt-BR"),
        items,
      });
    },
    [data, persist],
  );

  const removeItem = useCallback(
    (nome: string) => {
      persist({
        dataAtualizacao: new Date().toLocaleDateString("pt-BR"),
        items: data.items.filter((m) => m.nome !== nome),
      });
    },
    [data, persist],
  );

  return { data, hydrated, replaceAll, upsertItem, removeItem };
}
