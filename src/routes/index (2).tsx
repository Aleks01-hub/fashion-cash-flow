import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Moon, Sun, LogOut } from "lucide-react";
import { StoreProvider } from "@/lib/store";
import { AuthProvider, useAuth } from "@/lib/auth";
import { LoginScreen } from "@/components/LoginScreen";
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
  return <AuthProvider><AuthenticatedApp /></AuthProvider>;
}

function AuthenticatedApp() {
  const { user, logout, can } = useAuth();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  if (!user) return <LoginScreen />;

  const desktopAllowed = user.accessMode === "gestao" && can("gestao");
  const mobileAllowed = user.accessMode === "vendedor";

  return (
    <StoreProvider>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-border bg-card/90 px-4 py-2 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-primary text-xs font-black text-primary-foreground">M</div>
            <div className="min-w-0"><h1 className="truncate text-sm font-bold">Caixa Central</h1><p className="truncate text-[11px] text-muted-foreground">{user.name} · {user.accessMode === "gestao" ? "Gestão" : "Vendedor"}</p></div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={() => setDark(!dark)} aria-label="Alternar tema" className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground">{dark ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}</button>
            <button onClick={logout} className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground" title="Sair"><LogOut className="h-4 w-4"/></button>
          </div>
        </header>
        {desktopAllowed ? <DesktopPanel /> : mobileAllowed ? <MobileApp /> : (
          <main className="grid min-h-[80vh] place-items-center p-6"><div className="max-w-md text-center"><h2 className="text-xl font-bold">Acesso não configurado</h2><p className="mt-2 text-sm text-muted-foreground">Seu usuário ainda não recebeu uma tela de acesso. Peça ao administrador para ajustar suas permissões.</p></div></main>
        )}
      </div>
    </StoreProvider>
  );
}
