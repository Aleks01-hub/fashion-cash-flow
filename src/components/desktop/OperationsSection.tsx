import { useState } from "react";
import { useStore } from "@/lib/store";
import { brl, dateOnly } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, Package, ShoppingCart, Truck, BarChart3, CalendarDays, ShieldCheck, ChevronLeft, ChevronRight, Cake, Plus } from "lucide-react";

type Cash = { open: boolean; openedAt: string; opening: number; withdrawals: number; additions: number; closedAt?: string; counted?: number };
type Purchase = { id:string; date:string; supplier:string; total:number; status:"recebida"|"pendente"; notes:string };
type Supplier = { id:string; name:string; phone:string; contact:string };
type Exchange = { id:string; date:string; saleNumber:number; customer:string; returned:string; received:string; difference:number; notes:string };
type Event = { id:string; date:string; title:string; type:"Aniversário"|"Feriado"|"Promoção"|"Importante"; notes:string };
type User = { id:string; name:string; role:"Administrador"|"Gerente"|"Vendedor"|"Caixa"; active:boolean };

function usePersisted<T>(key:string, initial:T) {
  const [value,setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try { return JSON.parse(window.localStorage.getItem(key) || "null") ?? initial; } catch { return initial; }
  });
  const save = (next:T) => { setValue(next); if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(next)); };
  return [value,save] as const;
}

const tabs = [
  ["caixa","Caixa",Wallet],["estoque","Estoque",Package],["compras","Compras",ShoppingCart],
  ["fornecedores","Fornecedores",Truck],["relatorios","Relatórios",BarChart3],
  ["eventos","Agenda",CalendarDays],["usuarios","Usuários",ShieldCheck],
] as const;

export function OperationsSection() {
  const [tab,setTab] = useState<(typeof tabs)[number][0]>("caixa");
  return <div className="space-y-4">
    <div className="flex gap-2 overflow-x-auto rounded-2xl border bg-card p-2">
      {tabs.map(([id,label,Icon]) => <button key={id} onClick={()=>setTab(id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${tab===id?"bg-primary text-primary-foreground":"hover:bg-muted"}`}><Icon className="h-4 w-4"/>{label}</button>)}
    </div>
    {tab==="caixa" && <CashTab/>}
    {tab==="estoque" && <StockTab/>}
    {tab==="compras" && <PurchasesTab/>}
    {tab==="fornecedores" && <SuppliersTab/>}
    {tab==="relatorios" && <ReportsTab/>}
    {tab==="eventos" && <EventsTab/>}
    {tab==="usuarios" && <UsersTab/>}
  </div>;
}

function CashTab() {
  const { sales } = useStore();
  const [cash,setCash] = usePersisted<Cash>("modah:cash",{open:false,openedAt:"",opening:0,withdrawals:0,additions:0});
  const [opening,setOpening]=useState("");
  const [counted,setCounted]=useState("");
  const today = new Date().toISOString().slice(0,10);
  const todaySales=sales.filter(s=>s.date.slice(0,10)===today);
  const received=todaySales.reduce((n,s)=>n+s.amountPaid,0);
  const expected=(cash.opening||0)+cash.additions+received-cash.withdrawals;
  const byMethod=Object.entries(todaySales.reduce<Record<string,number>>((a,s)=>{a[s.paymentMethod]=(a[s.paymentMethod]||0)+s.amountPaid;return a},{}));
  const open=()=>{ const n=Number(opening)||0; saveCash(setCash,{open:true,openedAt:new Date().toISOString(),opening:n,withdrawals:0,additions:0}); setOpening(""); };
  const saveCash=(setter:any,next:Cash)=>setter(next);
  return <section className="card-elevated rounded-2xl p-4 space-y-5">
    <div className="flex items-center justify-between"><div><h2 className="font-bold">Caixa</h2><p className="text-sm text-muted-foreground">Abertura, movimentações e fechamento diário.</p></div>{cash.open?<span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">Caixa aberto</span>:<span className="rounded-full bg-muted px-3 py-1 text-xs">Fechado</span>}</div>
    {!cash.open ? <div className="flex max-w-sm gap-2"><Input type="number" placeholder="Troco inicial (R$)" value={opening} onChange={e=>setOpening(e.target.value)}/><Button onClick={open}>Abrir caixa</Button></div> :
    <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Abertura",cash.opening],["Recebido hoje",received],["Saídas",cash.withdrawals],["Esperado",expected]].map(([l,v])=><div key={String(l)} className="rounded-xl bg-muted p-4"><p className="text-xs text-muted-foreground">{l}</p><b className="text-xl">{brl(Number(v))}</b></div>)}</div>
    <div className="grid gap-3 sm:grid-cols-2"><Button variant="outline" onClick={()=>{const v=Number(prompt("Valor da sangria:"))||0; if(v>0)setCash({...cash,withdrawals:cash.withdrawals+v})}}>Registrar sangria</Button><Button variant="outline" onClick={()=>{const v=Number(prompt("Valor do suprimento:"))||0; if(v>0)setCash({...cash,additions:cash.additions+v})}}>Registrar suprimento</Button></div>
    <div className="rounded-xl border p-4"><h3 className="mb-3 font-semibold">Vendas por pagamento</h3><div className="space-y-2">{byMethod.map(([m,v])=><div key={m} className="flex justify-between text-sm"><span>{m}</span><b>{brl(v)}</b></div>)}</div></div>
    <div className="flex gap-2"><Input type="number" placeholder="Valor contado no caixa" value={counted} onChange={e=>setCounted(e.target.value)}/><Button onClick={()=>{const n=Number(counted)||0; setCash({...cash,open:false,closedAt:new Date().toISOString(),counted:n});setCounted("");}}>Fechar caixa</Button></div>
    {cash.closedAt && <p className="text-sm">Último fechamento: contado {brl(cash.counted||0)} · diferença {brl((cash.counted||0)-expected)}</p>}</>}
  </section>;
}

function StockTab() {
  const { products, restock } = useStore();
  const [filter,setFilter]=useState("");
  const low=products.filter(p=>p.variations.reduce((n,v)=>n+v.qty,0)<=p.minStock);
  const rows=products.filter(p=>p.name.toLowerCase().includes(filter.toLowerCase()));
  return <section className="card-elevated rounded-2xl p-4"><div className="mb-4 flex flex-wrap items-end gap-3"><div><Label>Buscar produto</Label><Input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Nome..." /></div><div className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">{low.length} com estoque baixo</div></div><Table><TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Variação</TableHead><TableHead>Estoque</TableHead><TableHead>Mínimo</TableHead><TableHead>Entrada</TableHead></TableRow></TableHeader><TableBody>{rows.flatMap(p=>p.variations.map(v=><TableRow key={p.id+v.color+v.size}><TableCell>{p.name}</TableCell><TableCell>{v.color} / {v.size}</TableCell><TableCell className={v.qty<=p.minStock?"font-bold text-danger":""}>{v.qty}</TableCell><TableCell>{p.minStock}</TableCell><TableCell><Button size="sm" variant="outline" onClick={()=>{const q=Number(prompt("Quantidade de entrada:"))||0;if(q>0)restock(p.id,v.color,v.size,q)}}>+ Entrada</Button></TableCell></TableRow>))}</TableBody></Table></section>;
}

function PurchasesTab() {
  const [purchases,setPurchases]=usePersisted<Purchase[]>("modah:purchases",[]);
  const [supplier,setSupplier]=useState(""); const [total,setTotal]=useState(""); const [notes,setNotes]=useState("");
  const add=()=>{const n=Number(total)||0;if(!supplier||n<=0)return;setPurchases([{id:crypto.randomUUID(),date:new Date().toISOString(),supplier,total:n,status:"recebida",notes},...purchases]);setSupplier("");setTotal("");setNotes("")};
  const totalBought=purchases.reduce((n,p)=>n+p.total,0);
  return <section className="card-elevated rounded-2xl p-4 space-y-4"><h2 className="font-bold">Compras de mercadoria</h2><div className="grid gap-2 md:grid-cols-4"><Input placeholder="Fornecedor" value={supplier} onChange={e=>setSupplier(e.target.value)}/><Input type="number" placeholder="Total da compra" value={total} onChange={e=>setTotal(e.target.value)}/><Input placeholder="Observações" value={notes} onChange={e=>setNotes(e.target.value)}/><Button onClick={add}>Registrar compra</Button></div><div className="rounded-xl bg-muted p-3 text-sm">Total comprado registrado: <b>{brl(totalBought)}</b></div><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Fornecedor</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{purchases.map(p=><TableRow key={p.id}><TableCell>{dateOnly(p.date)}</TableCell><TableCell>{p.supplier}</TableCell><TableCell>{brl(p.total)}</TableCell><TableCell>{p.status}</TableCell></TableRow>)}</TableBody></Table></section>;
}

function SuppliersTab() {
  const [items,setItems]=usePersisted<Supplier[]>("modah:suppliers",[]);
  const [name,setName]=useState("");const [phone,setPhone]=useState("");const [contact,setContact]=useState("");
  const add=()=>{if(!name.trim())return;setItems([{id:crypto.randomUUID(),name,phone,contact},...items]);setName("");setPhone("");setContact("")};
  return <section className="card-elevated rounded-2xl p-4 space-y-4"><h2 className="font-bold">Fornecedores</h2><div className="grid gap-2 md:grid-cols-4"><Input placeholder="Fornecedor" value={name} onChange={e=>setName(e.target.value)}/><Input placeholder="Telefone" value={phone} onChange={e=>setPhone(e.target.value)}/><Input placeholder="Contato" value={contact} onChange={e=>setContact(e.target.value)}/><Button onClick={add}>Cadastrar</Button></div><Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Telefone</TableHead><TableHead>Contato</TableHead></TableRow></TableHeader><TableBody>{items.map(x=><TableRow key={x.id}><TableCell>{x.name}</TableCell><TableCell>{x.phone}</TableCell><TableCell>{x.contact}</TableCell></TableRow>)}</TableBody></Table></section>;
}

function ReportsTab() {
  const { sales, products, customers }=useStore();
  const sold=sales.reduce((n,s)=>n+s.items.reduce((a,i)=>a+i.quantity,0),0);
  const revenue=sales.reduce((n,s)=>n+s.total,0);
  const received=sales.reduce((n,s)=>n+s.amountPaid,0);
  const cost=sales.reduce((n,s)=>n+s.items.reduce((a,i)=>{const p=products.find(p=>p.id===i.productId);return a+(p?.details?.cost||0)*i.quantity},0),0);
  const stock=products.reduce((n,p)=>n+p.variations.reduce((a,v)=>a+v.qty,0),0);
  const low=products.filter(p=>p.variations.reduce((a,v)=>a+v.qty,0)<=p.minStock);
  const avg=customers.length?revenue/customers.length:0;
  return <section className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Faturamento",brl(revenue)],["Recebido",brl(received)],["Custo estimado",brl(cost)],["Lucro bruto",brl(revenue-cost)]].map(([a,b])=><div key={a} className="card-elevated rounded-2xl p-4"><p className="text-xs text-muted-foreground">{a}</p><b className="text-xl">{b}</b></div>)}</div><div className="grid gap-3 sm:grid-cols-3"><div className="card-elevated rounded-2xl p-4">Peças vendidas <b>{sold}</b></div><div className="card-elevated rounded-2xl p-4">Estoque atual <b>{stock}</b></div><div className="card-elevated rounded-2xl p-4">Ticket médio por cliente <b>{brl(avg)}</b></div></div><div className="card-elevated rounded-2xl p-4"><h2 className="mb-3 font-bold">Produtos encalhados / estoque baixo</h2>{low.length?<ul className="space-y-2">{low.map(p=><li key={p.id} className="flex justify-between rounded-xl bg-muted p-3 text-sm"><span>{p.name}</span><b>{p.variations.reduce((n,v)=>n+v.qty,0)} un.</b></li>)}</ul>:<p className="text-sm text-muted-foreground">Nenhum produto abaixo do mínimo.</p>}</div></section>;
}

/* Trocas/devoluções ficam vinculadas ao fluxo de vendas. */
function ExchangesTab() {
  const { sales }=useStore();
  const [items,setItems]=usePersisted<Exchange[]>("modah:exchanges",[]);
  const [saleNumber,setSaleNumber]=useState("");const [returned,setReturned]=useState("");const [received,setReceived]=useState("");const [notes,setNotes]=useState("");
  const sale=sales.find(s=>String(s.number)===saleNumber);
  const add=()=>{if(!sale||!returned||!received)return;const diff=(Number(received)||0)-(Number(returned)||0);setItems([{id:crypto.randomUUID(),date:new Date().toISOString(),saleNumber:sale.number,customer:sale.customerName,returned,received,difference:diff,notes},...items]);setSaleNumber("");setReturned("");setReceived("");setNotes("")};
  return <section className="card-elevated rounded-2xl p-4 space-y-4"><h2 className="font-bold">Trocas e devoluções</h2><div className="grid gap-2 md:grid-cols-4"><Input placeholder="Nº da venda" value={saleNumber} onChange={e=>setSaleNumber(e.target.value)}/><Input placeholder="Produto devolvido" value={returned} onChange={e=>setReturned(e.target.value)}/><Input placeholder="Produto recebido" value={received} onChange={e=>setReceived(e.target.value)}/><Button disabled={!sale} onClick={add}>Registrar troca</Button></div>{sale&&<p className="text-sm text-muted-foreground">Cliente: {sale.customerName} · Total original: {brl(sale.total)}</p>}<Input placeholder="Observações" value={notes} onChange={e=>setNotes(e.target.value)}/><Table><TableHeader><TableRow><TableHead>Venda</TableHead><TableHead>Cliente</TableHead><TableHead>Devolvido</TableHead><TableHead>Recebido</TableHead><TableHead>Diferença</TableHead></TableRow></TableHeader><TableBody>{items.map(x=><TableRow key={x.id}><TableCell>#{x.saleNumber}</TableCell><TableCell>{x.customer}</TableCell><TableCell>{x.returned}</TableCell><TableCell>{x.received}</TableCell><TableCell>{brl(x.difference)}</TableCell></TableRow>)}</TableBody></Table></section>;
}

function EventsTab() {
  const { customers } = useStore();
  const [items,setItems]=usePersisted<Event[]>("modah:events",[]);
  const [cursor,setCursor]=useState(() => new Date());
  const [date,setDate]=useState("");const [title,setTitle]=useState("");const [type,setType]=useState<Event["type"]>("Importante");const [notes,setNotes]=useState("");
  const year=cursor.getFullYear(); const month=cursor.getMonth();
  const first=new Date(year,month,1); const daysInMonth=new Date(year,month+1,0).getDate();
  const offset=(first.getDay()+6)%7;
  const monthName=new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(cursor);
  const birthdayEvents=customers.filter(c=>c.birthDate).map(c=>({
    id:"birthday-"+c.id, date:year+"-"+String(month+1).padStart(2,"0")+"-"+c.birthDate.slice(8,10),
    title:"Aniversário de "+c.name, type:"Aniversário" as const, notes:"Cliente cadastrado"
  }));
  const monthEvents=[...items.filter(e=>e.date.slice(0,7)===year+"-"+String(month+1).padStart(2,"0")), ...birthdayEvents];
  const add=()=>{if(!date||!title)return;setItems([...items,{id:crypto.randomUUID(),date,title,type,notes}].sort((a,b)=>a.date.localeCompare(b.date)));setDate("");setTitle("");setNotes("")};
  const eventFor=(day:number)=>monthEvents.filter(e=>e.date.slice(8,10)===String(day).padStart(2,"0"));
  const goMonth=(delta:number)=>setCursor(new Date(year,month+delta,1));
  const openBirthday=(event: Event)=>{ if(event.type!=="Aniversário") return; const customer=customers.find(c=>event.title==="Aniversário de "+c.name); if(customer) window.dispatchEvent(new CustomEvent("modah:open-customer",{detail:customer.id})); };
  return <section className="space-y-4">
    <div className="card-elevated rounded-2xl p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" onClick={()=>goMonth(-1)} aria-label="Mês anterior"><ChevronLeft className="h-4 w-4"/></Button>
        <h2 className="text-lg font-bold capitalize">{monthName}</h2>
        <Button variant="outline" size="icon" onClick={()=>goMonth(1)} aria-label="Próximo mês"><ChevronRight className="h-4 w-4"/></Button>
      </div>
      <div className="grid grid-cols-7 border-l border-t text-xs">
        {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map(d=><div key={d} className="border-b border-r bg-muted p-2 text-center font-semibold">{d}</div>)}
        {Array.from({length:offset}).map((_,i)=><div key={"e"+i} className="min-h-24 border-b border-r bg-muted/30"/>)}
        {Array.from({length:daysInMonth},(_,i)=>i+1).map(day=>{
          const events=eventFor(day);
          return <div key={day} className="min-h-24 border-b border-r p-2">
            <div className="mb-1 text-right font-semibold">{day}</div>
            <div className="space-y-1">{events.map(e=><button key={e.id} onClick={()=>openBirthday(e)} className={`w-full rounded-md px-2 py-1 text-left text-[11px] ${e.type==="Aniversário"?"bg-warning/15 text-warning":"bg-primary/10 text-primary"} ${e.type==="Aniversário"?"cursor-pointer":"cursor-default"}`}><span className="flex items-center gap-1">{e.type==="Aniversário"&&<Cake className="h-3 w-3"/>}{e.title}</span></button>)}</div>
          </div>;
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground"><span>• Eventos cadastrados</span><span>• Aniversários dos clientes</span><span>• Clique no aniversário para abrir a ficha</span></div>
    </div>
    <div className="card-elevated rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between"><div><h2 className="font-bold">Adicionar evento</h2><p className="text-sm text-muted-foreground">Os eventos ficam salvos no calendário.</p></div><Plus className="h-5 w-5 text-muted-foreground"/></div>
      <div className="grid gap-2 md:grid-cols-5"><Input type="date" value={date} onChange={e=>setDate(e.target.value)}/><Input placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)}/><select className="h-10 rounded-md border bg-background px-3" value={type} onChange={e=>setType(e.target.value as Event["type"])}>{["Aniversário","Feriado","Promoção","Importante"].map(x=><option key={x}>{x}</option>)}</select><Input placeholder="Observações" value={notes} onChange={e=>setNotes(e.target.value)}/><Button onClick={add}>Adicionar</Button></div>
    </div>
    <div className="card-elevated rounded-2xl p-4">
      <h3 className="mb-3 font-bold">Eventos do mês</h3>
      {monthEvents.length===0?<p className="text-sm text-muted-foreground">Nenhum evento neste mês.</p>:<Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Evento</TableHead><TableHead>Observações</TableHead></TableRow></TableHeader><TableBody>{monthEvents.sort((a,b)=>a.date.localeCompare(b.date)).map(x=><TableRow key={x.id} className={x.type==="Aniversário"?"cursor-pointer":""} onClick={()=>openBirthday(x)}><TableCell>{dateOnly(x.date)}</TableCell><TableCell>{x.type}</TableCell><TableCell className={x.type==="Aniversário"?"font-medium text-primary":""}>{x.title}</TableCell><TableCell>{x.notes}</TableCell></TableRow>)}</TableBody></Table>}
    </div>
  </section>;
}
function UsersTab() {
  const [items,setItems]=usePersisted<User[]>("modah:users",[
    {id:"u1",name:"Administrador",role:"Administrador",active:true},
    {id:"u2",name:"Vendedor",role:"Vendedor",active:true},
  ]);
  const [name,setName]=useState("");const [role,setRole]=useState<User["role"]>("Vendedor");
  const add=()=>{if(!name)return;setItems([...items,{id:crypto.randomUUID(),name,role,active:true}]);setName("")};
  return <section className="card-elevated rounded-2xl p-4 space-y-4"><h2 className="font-bold">Usuários e permissões</h2><div className="grid gap-2 md:grid-cols-3"><Input placeholder="Nome do usuário" value={name} onChange={e=>setName(e.target.value)}/><select className="h-10 rounded-md border bg-background px-3" value={role} onChange={e=>setRole(e.target.value as User["role"])}>{["Administrador","Gerente","Vendedor","Caixa"].map(x=><option key={x}>{x}</option>)}</select><Button onClick={add}>Adicionar usuário</Button></div><Table><TableHeader><TableRow><TableHead>Usuário</TableHead><TableHead>Perfil</TableHead><TableHead>Status</TableHead><TableHead>Ação</TableHead></TableRow></TableHeader><TableBody>{items.map(x=><TableRow key={x.id}><TableCell>{x.name}</TableCell><TableCell>{x.role}</TableCell><TableCell>{x.active?"Ativo":"Inativo"}</TableCell><TableCell><Button size="sm" variant="outline" onClick={()=>setItems(items.map(u=>u.id===x.id?{...u,active:!u.active}:u))}>{x.active?"Desativar":"Ativar"}</Button></TableCell></TableRow>)}</TableBody></Table><p className="text-xs text-muted-foreground">Os perfis estão preparados para permissões por função; autenticação real deve ser ligada ao backend antes de produção.</p></section>;
}
