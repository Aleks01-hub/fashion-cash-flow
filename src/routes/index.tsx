import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Monitor, Moon, Smartphone, Sun } from "lucide-react";
import { StoreProvider } from "@/lib/store";
import { MobileApp } from "@/components/mobile/MobileApp";
import { DesktopPanel } from "@/components/desktop/DesktopPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Modah — Estoque, Vendas e Fichas em Tempo Real" },
      {
        name: "description",
        content:
          "SaaS para lojas de roupas: estoque com variações, vendas por comando de voz, fichas de clientes e controle de AVs em tempo real.",
      },
      { property: "og:title", content: "Modah — Estoque, Vendas e Fichas em Tempo Real" },
      {
        property: "og:description",
        content:
          "Painel do caixa e app do vendedor com voz, fichas de clientes, AVs e reposição de estoque.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [view, setView] = useState<"mobile" | "desktop">("mobile");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <StoreProvider>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-50 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card/90 px-4 py-2 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-primary text-xs font-black text-primary-foreground">
              M
            </div>
            <h1 className="truncate text-sm font-bold">Modah Gestão</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex rounded-full border border-border p-0.5">
              <button
                onClick={() => setView("mobile")}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  view === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" /> Vendedor
              </button>
              <button
                onClick={() => setView("desktop")}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  view === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                <Monitor className="h-3.5 w-3.5" /> Caixa
              </button>
            </div>
            <button
              onClick={() => setDark(!dark)}
              aria-label="Alternar tema"
              className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>
        {view === "mobile" ? <MobileApp /> : <DesktopPanel />}
      </div>
    </StoreProvider>
  );
}
