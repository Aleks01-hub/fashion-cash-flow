import { useEffect, useRef, useState } from "react";
import { Mic, Check, X, Wifi, WifiOff, CloudOff, Sparkles, ShoppingBag, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { useStore, type ParsedCommand } from "@/lib/store";
import { stores } from "@/lib/mock-data";
import { brl } from "@/lib/format";

const SAMPLES: { text: string; build: (ctx: ReturnType<typeof useStore>) => ParsedCommand | null }[] = [
  {
    text: "Vendi regata preta M no Pix",
    build: () => ({
      type: "venda",
      produto: "Regata Canelada",
      cor: "Preta",
      tamanho: "M",
      quantidade: 1,
      forma_pagamento: "Pix",
      valor: 59.9,
      productId: "p1",
    }),
  },
  {
    text: "Registra 50 reais de abate no AV da cliente Maria",
    build: () => ({
      type: "abate_av",
      cliente: "Maria Oliveira",
      customerId: "c1",
      valor: 50,
      forma_pagamento: "Pix",
    }),
  },
  {
    text: "Vendi calça jeans azul claro 40 no cartão de crédito",
    build: () => ({
      type: "venda",
      produto: "Calça Jeans Wide Leg",
      cor: "Azul Claro",
      tamanho: "40",
      quantidade: 1,
      forma_pagamento: "Cartão Crédito",
      valor: 189.9,
      productId: "p2",
    }),
  },
  {
    text: "Registra 120 reais de abate no AV da cliente Renata em dinheiro",
    build: () => ({
      type: "abate_av",
      cliente: "Renata Lima",
      customerId: "c4",
      valor: 120,
      forma_pagamento: "Dinheiro",
    }),
  },
];

export function VoiceScreen() {
  const ctx = useStore();
  const { store, setStore, online, setOnline, registerSale, registerAv, feed } = ctx;
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [pending, setPending] = useState<ParsedCommand | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const listen = (sampleIndex?: number) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const sample = SAMPLES[sampleIndex ?? Math.floor(Math.random() * SAMPLES.length)]!;
    setPending(null);
    setDone(null);
    setTranscript("");
    setListening(true);
    const words = sample.text.split(" ");
    words.forEach((_, i) => {
      timers.current.push(
        setTimeout(() => setTranscript(words.slice(0, i + 1).join(" ")), 110 * (i + 1)),
      );
    });
    timers.current.push(
      setTimeout(
        () => {
          setListening(false);
          setPending(sample.build(ctx));
        },
        110 * words.length + 400,
      ),
    );
  };

  const confirm = () => {
    if (!pending) return;
    if (pending.type === "venda") registerSale(pending);
    else registerAv(pending);
    setDone(
      pending.type === "venda"
        ? `Baixa no estoque concluída — ${pending.produto}`
        : `Abate de ${brl(pending.valor)} lançado na ficha de ${pending.cliente}`,
    );
    setPending(null);
    setTimeout(() => setDone(null), 4000);
  };

  return (
    <div className="space-y-5 px-4 pb-28 pt-4">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">Vendedor Alex</p>
          <Select value={store} onValueChange={setStore}>
            <SelectTrigger className="h-9 w-full border-none bg-transparent px-0 text-base font-bold shadow-none focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stores.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button onClick={() => setOnline(!online)} className="shrink-0">
          <StatusBadge tone={online ? "success" : "warning"}>
            {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {online ? "Online" : "Offline · Salvo local"}
          </StatusBadge>
        </button>
      </header>

      <section className="card-elevated flex flex-col items-center gap-4 rounded-3xl p-6 text-center">
        <button
          onClick={() => listen()}
          aria-label="Ativar microfone"
          className={`grid h-28 w-28 place-items-center rounded-full bg-gradient-primary text-primary-foreground transition-transform active:scale-95 ${
            listening ? "mic-pulse" : ""
          }`}
        >
          <Mic className="h-12 w-12" />
        </button>
        <p className="text-sm text-muted-foreground">
          Fale um comando (ex: <span className="font-medium text-foreground">"Vendi regata preta M no Pix"</span> ou{" "}
          <span className="font-medium text-foreground">"Registra 50 reais de abate no AV da cliente Maria"</span>)
        </p>
        <div className="min-h-16 w-full rounded-2xl bg-muted px-4 py-3 text-left text-sm">
          {transcript ? (
            <span>
              {transcript}
              {listening && <span className="ml-0.5 animate-pulse">▍</span>}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {listening ? "Ouvindo…" : "A transcrição aparece aqui em tempo real."}
            </span>
          )}
        </div>
        <div className="flex w-full flex-wrap gap-2">
          {SAMPLES.map((s, i) => (
            <button
              key={s.text}
              onClick={() => listen(i)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-left text-xs text-muted-foreground"
            >
              <Sparkles className="mr-1 inline h-3 w-3 text-primary" />
              {s.text}
            </button>
          ))}
        </div>
      </section>

      {pending && (
        <section className="card-elevated rounded-3xl border border-primary/25 p-4">
          <div className="mb-2 flex items-center gap-2">
            {pending.type === "venda" ? (
              <ShoppingBag className="h-4 w-4 text-primary" />
            ) : (
              <Wallet className="h-4 w-4 text-primary" />
            )}
            <h3 className="text-sm font-bold">
              {pending.type === "venda" ? "Confirmar venda" : "Confirmar abatimento de AV"}
            </h3>
          </div>
          <pre className="overflow-x-auto rounded-xl bg-muted p-3 text-xs leading-relaxed">
            {JSON.stringify(pending, null, 2)}
          </pre>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button size="lg" onClick={confirm}>
              <Check className="h-4 w-4" /> Confirmar
            </Button>
            <Button size="lg" variant="outline" onClick={() => setPending(null)}>
              <X className="h-4 w-4" /> Cancelar
            </Button>
          </div>
        </section>
      )}

      {done && (
        <div className="flex items-center gap-2 rounded-2xl border border-success/30 bg-success/10 p-4 text-sm font-medium text-success">
          <Check className="h-4 w-4" /> {done} 🔊
        </div>
      )}

      {!online && (
        <div className="flex items-center gap-2 rounded-2xl border border-warning/35 bg-warning/10 p-3 text-xs text-warning">
          <CloudOff className="h-4 w-4" /> Comandos ficam na fila local e sincronizam ao reconectar.
        </div>
      )}

      <section>
        <h3 className="mb-2 text-sm font-bold">Ações recentes</h3>
        <div className="space-y-2">
          {feed.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma ação registrada nesta sessão.</p>
          )}
          {feed.map((f) => (
            <div key={f.id} className="card-elevated rounded-2xl p-3 text-sm">
              <p>{f.text}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(f.at).toLocaleTimeString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
