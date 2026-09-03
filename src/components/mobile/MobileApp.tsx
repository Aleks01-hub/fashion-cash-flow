import { useState } from "react";
import { Mic, Users, Shirt, ShoppingBasket } from "lucide-react";
import { VoiceScreen } from "./VoiceScreen";
import { CustomersScreen } from "./CustomersScreen";
import { StockScreen } from "./StockScreen";
import { ReservationsScreen } from "./ReservationsScreen";

const TABS = [
  { id: "voz", label: "Caixa", icon: Mic },
  { id: "fichas", label: "Fichas", icon: Users },
  { id: "estoque", label: "Estoque", icon: Shirt },
  { id: "reservas", label: "Reservas", icon: ShoppingBasket },
] as const;

export function MobileApp() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("voz");

  return (
    <div className="mx-auto min-h-screen w-full max-w-lg">
      {tab === "voz" && <VoiceScreen />}
      {tab === "fichas" && <CustomersScreen />}
      {tab === "estoque" && <StockScreen />}
      {tab === "reservas" && <ReservationsScreen />}

      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg border-t border-border bg-card/95 backdrop-blur">
        <ul className="grid grid-cols-4">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <li key={t.id}>
                <button
                  onClick={() => setTab(t.id)}
                  className={`flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <t.icon className={`h-5 w-5 ${active ? "scale-110" : ""} transition-transform`} />
                  {t.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
