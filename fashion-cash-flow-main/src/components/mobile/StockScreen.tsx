import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { brl } from "@/lib/format";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SIZES = ["PP", "P", "M", "G", "GG", "36", "38", "40", "42", "44", "46", "48"];
const STATUS = [
  { id: "all", label: "Todos" },
  { id: "estoque", label: "Em Estoque" },
  { id: "reservado", label: "Reservado" },
  { id: "bag", label: "Na Bag" },
] as const;

export function StockScreen() {
  const { products } = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [size, setSize] = useState("Todos");
  const [status, setStatus] = useState<(typeof STATUS)[number]["id"]>("all");
  const [selectedProduct, setSelectedProduct] = useState<(typeof products)[number] | null>(null);

  const categories = useMemo(
    () => ["Todas", ...Array.from(new Set(products.map((p) => p.category)))],
    [products],
  );

  const list = useMemo(
    () =>
      products.filter((p) => {
        const q = query.toLowerCase();
        const matchQ =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q)) ||
          p.variations.some((v) => v.color.toLowerCase().includes(q) || v.size.toLowerCase() === q);
        const matchC = category === "Todas" || p.category === category;
        const matchS = size === "Todos" || p.variations.some((v) => v.size === size);
        const matchSt =
          status === "all" ||
          p.variations.some((v) =>
            status === "estoque" ? v.qty > 0 : status === "reservado" ? v.reserved > 0 : v.inBag > 0,
          );
        return matchQ && matchC && matchS && matchSt;
      }),
    [products, query, category, size, status],
  );

  return (
    <div className="space-y-4 px-4 pb-28 pt-4">
      <div className="flex items-center justify-between gap-3"><div><h1 className="text-xl font-bold">Estoque</h1><p className="text-xs text-muted-foreground">Consulta rápida por produto, cor e tamanho.</p></div><div className="rounded-xl bg-muted px-3 py-2 text-right"><p className="text-[10px] text-muted-foreground">Unidades</p><p className="text-sm font-bold">{products.reduce((n, p) => n + p.variations.reduce((m, v) => m + v.qty, 0), 0)}</p></div></div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nome, cor, tamanho ou tag"
          className="h-12 rounded-2xl pl-9"
        />
      </div>

      <div className="grid grid-cols-2 gap-2"><div className="rounded-xl border border-border p-3"><p className="text-[11px] text-muted-foreground">Variações</p><p className="font-bold">{products.reduce((n, p) => n + p.variations.length, 0)}</p></div><div className="rounded-xl border border-warning/30 bg-warning/5 p-3"><p className="text-[11px] text-muted-foreground">No mínimo</p><p className="font-bold">{products.reduce((n, p) => n + p.variations.filter((v) => v.qty <= p.minStock).length, 0)}</p></div></div>\n\n      <Chips items={categories} value={category} onChange={setCategory} />
      <Chips items={["Todos", ...SIZES]} value={size} onChange={setSize} />
      <Chips
        items={STATUS.map((s) => s.label)}
        value={STATUS.find((s) => s.id === status)!.label}
        onChange={(label) => setStatus(STATUS.find((s) => s.label === label)!.id)}
      />

      <div className="space-y-4">
        {list.map((p) => (
          <button type="button" key={p.id} onClick={() => setSelectedProduct(p)} className="card-elevated block w-full overflow-hidden rounded-2xl text-left transition-transform active:scale-[0.99]">
            <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
              <img src={p.photo} alt={p.name} loading="lazy" className="h-full w-24 object-cover" />
              <div className="min-w-0 py-3 pr-3">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.category}</p>
                <p className="mt-1 font-bold text-primary">{brl(p.price)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 pt-0">
              {p.variations.map((v) => {
                const tone = v.qty === 0 ? "danger" : v.inBag > 0 ? "warning" : v.reserved > 0 ? "warning" : "success";
                return (
                  <div key={v.color + v.size} className="rounded-xl border border-border p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-medium">
                        {v.color} · {v.size}
                      </p>
                      <StatusBadge tone={tone}>{v.qty === 0 ? "Esgotado" : `${v.qty} un`}</StatusBadge>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Reservado {v.reserved} · Bag {v.inBag}
                    </p>
                  </div>
                );
              })}
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl p-0 sm:max-w-lg">
          {selectedProduct && (
            <>
              <div className="relative">
                <img src={selectedProduct.photo} alt={selectedProduct.name} className="h-56 w-full object-cover" />
                <button type="button" onClick={() => setSelectedProduct(null)} className="absolute right-3 top-3 rounded-full bg-background/90 p-2 shadow" aria-label="Fechar detalhes">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-5 p-5">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-xl">{selectedProduct.name}</DialogTitle>
                  <DialogDescription>{selectedProduct.category} · {selectedProduct.tags.join(" · ")}</DialogDescription>
                </DialogHeader>

                <div className="flex items-end justify-between gap-3">
                  <div><p className="text-xs text-muted-foreground">Preço de venda</p><p className="text-2xl font-bold text-primary">{brl(selectedProduct.price)}</p></div>
                  <div className="rounded-xl bg-muted px-3 py-2 text-right"><p className="text-[10px] text-muted-foreground">Estoque total</p><p className="font-bold">{selectedProduct.variations.reduce((n, v) => n + v.qty, 0)} un</p></div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ["Marca", selectedProduct.details?.brand],
                    ["Referência", selectedProduct.details?.reference],
                    ["Código de barras", selectedProduct.details?.barcode],
                    ["Fornecedor", selectedProduct.details?.supplier],
                    ["Unidade", selectedProduct.details?.unit],
                    ["Localização", selectedProduct.details?.location],
                    ["Garantia", selectedProduct.details?.warranty],
                  ].filter(([, value]) => value).map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-border p-3">
                      <p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 break-words font-medium">{value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">Cores e tamanhos</p>
                  <div className="space-y-2">
                    {selectedProduct.variations.map((v) => {
                      const tone = v.qty === 0 ? "danger" : v.inBag > 0 || v.reserved > 0 ? "warning" : "success";
                      return (
                        <div key={v.color + v.size} className="flex items-center justify-between rounded-xl border border-border p-3">
                          <div><p className="text-sm font-medium">{v.color} · {v.size}</p><p className="text-[11px] text-muted-foreground">Reservado {v.reserved} · Bag {v.inBag}</p></div>
                          <StatusBadge tone={tone}>{v.qty === 0 ? "Esgotado" : `${v.qty} un`}</StatusBadge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedProduct.details?.notes && <div className="rounded-xl bg-muted p-3"><p className="text-xs font-semibold">Observações</p><p className="mt-1 text-sm text-muted-foreground">{selectedProduct.details.notes}</p></div>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Chips({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
            value === i
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground"
          }`}
        >
          {i}
        </button>
      ))}
    </div>
  );
}
