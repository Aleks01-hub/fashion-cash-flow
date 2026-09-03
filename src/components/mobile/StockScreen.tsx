import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { brl } from "@/lib/format";

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
      <h1 className="text-xl font-bold">Estoque & Variações</h1>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nome, cor, tamanho ou tag"
          className="h-12 rounded-2xl pl-9"
        />
      </div>

      <Chips items={categories} value={category} onChange={setCategory} />
      <Chips items={["Todos", ...SIZES]} value={size} onChange={setSize} />
      <Chips
        items={STATUS.map((s) => s.label)}
        value={STATUS.find((s) => s.id === status)!.label}
        onChange={(label) => setStatus(STATUS.find((s) => s.label === label)!.id)}
      />

      <div className="space-y-4">
        {list.map((p) => (
          <article key={p.id} className="card-elevated overflow-hidden rounded-2xl">
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
          </article>
        ))}
      </div>
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
