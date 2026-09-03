import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { brl, dateOnly } from "@/lib/format";

export function ReservationsScreen() {
  const { reservations, products, restock } = useStore();
  const [bought, setBought] = useState<Record<string, boolean>>({});

  const lowStock = useMemo(
    () =>
      products.flatMap((p) =>
        p.variations
          .filter((v) => v.qty <= p.minStock)
          .map((v) => ({
            key: `${p.id}-${v.color}-${v.size}`,
            productId: p.id,
            name: p.name,
            color: v.color,
            size: v.size,
            qty: v.qty,
            min: p.minStock,
          })),
      ),
    [products],
  );

  const render = (kind: "reserva" | "bag") =>
    reservations
      .filter((r) => r.kind === kind)
      .map((r) => (
        <div key={r.id} className="card-elevated grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-2xl p-4">
          <div className="min-w-0">
            <p className="truncate font-semibold">{r.customer}</p>
            <p className="truncate text-xs text-muted-foreground">{r.items}</p>
            <p className="mt-1 text-sm font-semibold">{brl(r.value)}</p>
          </div>
          <StatusBadge tone={kind === "reserva" ? "primary" : "warning"}>
            até {dateOnly(r.until)}
          </StatusBadge>
        </div>
      ));

  return (
    <div className="space-y-4 px-4 pb-28 pt-4">
      <h1 className="text-xl font-bold">Reservas, Bags e Viagem</h1>
      <Tabs defaultValue="reservas">
        <TabsList className="w-full">
          <TabsTrigger value="reservas" className="flex-1 text-xs">
            Reservas
          </TabsTrigger>
          <TabsTrigger value="bags" className="flex-1 text-xs">
            Condicionais
          </TabsTrigger>
          <TabsTrigger value="viagem" className="flex-1 text-xs">
            Aba de Viagem
          </TabsTrigger>
        </TabsList>
        <TabsContent value="reservas" className="mt-3 space-y-3">
          {render("reserva")}
        </TabsContent>
        <TabsContent value="bags" className="mt-3 space-y-3">
          {render("bag")}
        </TabsContent>
        <TabsContent value="viagem" className="mt-3 space-y-3">
          <p className="text-sm text-muted-foreground">
            Peças no limite mínimo — marque ao comprar no fornecedor para dar entrada direta no estoque.
          </p>
          {lowStock.map((l) => (
            <label
              key={l.key}
              className="card-elevated grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-4"
            >
              <Checkbox
                checked={!!bought[l.key]}
                onCheckedChange={(v) => {
                  if (v) {
                    setBought((b) => ({ ...b, [l.key]: true }));
                    restock(l.productId, l.color, l.size, 10);
                  }
                }}
                className="h-6 w-6"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold">{l.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {l.color} · {l.size} — mínimo {l.min}
                </p>
              </div>
              <StatusBadge tone={l.qty === 0 ? "danger" : "warning"}>{l.qty} un</StatusBadge>
            </label>
          ))}
          {lowStock.length === 0 && <p className="text-sm text-muted-foreground">Estoque saudável.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
