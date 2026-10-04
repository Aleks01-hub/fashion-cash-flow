import { useRef, useState } from "react";
import { ImagePlus, MoreVertical, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { brl } from "@/lib/format";
import type { Product, ProductDetails } from "@/lib/mock-data";

type Form = ProductDetails & { name: string; price: number; minStock: number; photo: string; variations: Product["variations"] };

const empty = (): Form => ({
  name: "", price: 0, minStock: 0, photo: "", variations: [{ color: "Única", size: "M", qty: 0, reserved: 0, inBag: 0 }],
  barcode: "", unit: "UN", cost: 0, margin: 0, wholesale: 0, group: "", subgroup: "",
  supplier: "", warranty: "", brand: "", reference: "", validity: "", commission: 0,
  location: "", hasGrid: false, notes: "", stock: 0, inactive: false,
});

const fromProduct = (p: Product): Form => ({
  ...empty(),
  group: p.category,
  stock: p.variations.reduce((s, v) => s + v.qty, 0),
  ...p.details,
  name: p.name, price: p.price, minStock: p.minStock, photo: p.photo, variations: p.variations,
});

export function SalesSection() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Form>(empty());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [status, setStatus] = useState<"todos"|"ativos"|"inativos"|"baixo">("todos");

  const open = (p?: Product) => {
    setForm(p ? fromProduct(p) : empty());
    setEditing(p ? p.id : "new");
  };

  const save = () => {
    const { name, price, minStock, photo, variations, ...details } = form;
    if (!name.trim()) return;
    if (editing === "new") {
      addProduct({
        name, price, minStock, photo, category: details.group || "Geral", tags: [],
        variations: variations.length ? variations : [{ color: "Única", size: "M", qty: details.stock, reserved: 0, inBag: 0 }],
        details,
      });
    } else if (editing) {
      updateProduct(editing, { name, price, minStock, photo, category: details.group || "Geral", details });
    }
    setEditing(null);
  };

  const categories = ["Todos", ...Array.from(new Set(products.map(p => p.category))).sort()];
  const filtered = products.filter(p => {
    const matchesSearch = !search || [p.name, p.category, p.details?.barcode, p.details?.brand, p.details?.reference].join(" ").toLowerCase().includes(search.toLowerCase());
    const total = p.variations.reduce((n,v)=>n+v.qty,0);
    const matchesCategory = category === "Todos" || p.category === category;
    const matchesStatus = status === "todos" || (status === "ativos" && !p.details?.inactive) || (status === "inativos" && !!p.details?.inactive) || (status === "baixo" && total <= p.minStock);
    return matchesSearch && matchesCategory && matchesStatus;
  });
  const totalUnits = products.reduce((n,p)=>n+p.variations.reduce((a,v)=>a+v.qty,0),0);
  const lowStock = products.filter(p=>p.variations.reduce((n,v)=>n+v.qty,0)<=p.minStock).length;

  return (
    <section className="card-elevated rounded-2xl p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-bold">Produtos</h2><p className="text-xs text-muted-foreground">{products.length} produtos · {totalUnits} unidades · {lowStock} abaixo do mínimo</p></div>
        <Button onClick={() => open()}><Plus className="h-4 w-4" /> Novo produto</Button>
      </div>
      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_180px_160px]">
        <Input placeholder="Buscar por nome, código, marca..." value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="h-10 rounded-md border bg-background px-3" value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(x=><option key={x}>{x}</option>)}</select>
        <select className="h-10 rounded-md border bg-background px-3" value={status} onChange={e=>setStatus(e.target.value as typeof status)}><option value="todos">Todos os status</option><option value="ativos">Ativos</option><option value="inativos">Inativos</option><option value="baixo">Estoque baixo</option></select>
      </div>
      <div className="divide-y divide-border">
        {filtered.length===0 ? <p className="py-8 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</p> : filtered.map((p) => (
          <div key={p.id} className="group flex flex-wrap items-center gap-3 py-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
              {p.photo ? (
                <img src={p.photo} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <Package className="m-auto mt-4 h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {p.details?.barcode || "Sem código"} · {p.category} · {p.variations.length} variações · {p.variations.reduce((n,v)=>n+v.qty,0)} un.
              </p>
            </div>
            {p.details?.inactive && <StatusBadge tone="neutral">Desativado</StatusBadge>}
            <div className="text-right"><span className="block font-semibold">{brl(p.price)}</span><span className={`text-xs ${p.variations.reduce((n,v)=>n+v.qty,0)<=p.minStock?"text-danger font-semibold":"text-muted-foreground"}`}>{p.variations.reduce((n,v)=>n+v.qty,0)} un.</span></div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Opções do produto"
                  className="opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => open(p)}>
                  <Pencil className="h-4 w-4" /> Editar produto
                </DropdownMenuItem>
                <DropdownMenuItem className="text-danger" onClick={() => deleteProduct(p.id)}>
                  <Trash2 className="h-4 w-4" /> Excluir produto
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Cadastrar produto" : "Editar produto"}</DialogTitle>
          </DialogHeader>
          <ProductForm form={form} setForm={setForm} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ProductForm({ form, setForm }: { form: Form; setForm: (f: Form) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    const next = { ...form, [k]: v };
    if (k === "cost" || k === "margin") next.price = +(next.cost * (1 + next.margin / 100)).toFixed(2);
    if (k === "price" && next.cost > 0) next.margin = +(((next.price / next.cost) - 1) * 100).toFixed(2);
    setForm(next);
  };
  const txt = (k: keyof Form, label: string, cls = "") => (
    <div className={cls}>
      <Label className="text-xs">{label}</Label>
      <Input value={String(form[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} />
    </div>
  );
  const num = (k: keyof Form, label: string, cls = "") => (
    <div className={cls}>
      <Label className="text-xs">{label}</Label>
      <Input type="number" step="0.01" value={Number(form[k]) || ""} onChange={(e) => set(k, (Number(e.target.value) || 0) as never)} />
    </div>
  );
  const onPhoto = (f?: File) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => set("photo", String(r.result));
    r.readAsDataURL(f);
  };

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_200px]">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <div className="col-span-2">
          <Label className="text-xs">Código / Cód. Barras</Label>
          <div className="flex gap-1">
            <Input value={form.barcode} onChange={(e) => set("barcode", e.target.value)} />
            <Button type="button" variant="outline" size="sm"
              onClick={() => set("barcode", "789" + Math.floor(Math.random() * 1e10).toString().padStart(10, "0"))}>
              Gerar
            </Button>
          </div>
        </div>
        {txt("name", "Descrição", "col-span-2 md:col-span-4")}
        {txt("unit", "Unidade")}
        {num("cost", "Preço de compra (R$)")}
        {num("margin", "Margem / Markup (%)")}
        <div>
          <Label className="text-xs">Lucro (R$)</Label>
          <Input readOnly value={(form.price - form.cost).toFixed(2)} className="bg-muted" />
        </div>
        {num("price", "Preço de venda (R$)")}
        {num("wholesale", "Preço atacado (R$)")}
        {txt("group", "Grupo", "col-span-2")}
        {txt("subgroup", "Sub-grupo", "col-span-2")}
        {txt("supplier", "Fornecedor")}
        {num("minStock", "Est. mínimo")}
        {txt("warranty", "Garantia", "col-span-2")}
        {txt("brand", "Marca")}
        {txt("reference", "Referência")}
        {txt("validity", "Validade (dd/mm/aaaa)")}
        {num("commission", "Comissão %")}
        {txt("location", "Localização", "col-span-2 md:col-span-3")}
        <label className="col-span-2 flex items-center gap-2 self-end pb-2 text-sm md:col-span-3">
          <Checkbox checked={form.hasGrid} onCheckedChange={(v) => set("hasGrid", !!v)} />
          Este produto possui grade/variação?
        </label>
        <div className="col-span-2 md:col-span-4">
          <Label className="text-xs">Observações</Label>
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Estoque atual</Label>
          <Input type="number" value={form.stock || ""} onChange={(e) => set("stock", Number(e.target.value) || 0)}
            className="text-right text-lg font-bold" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-semibold">Foto do produto</p>
        <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted">
          {form.photo ? (
            <img src={form.photo} alt="Foto do produto" className="h-full w-full object-cover" />
          ) : (
            <Package className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
        <Button type="button" variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
          <ImagePlus className="h-4 w-4" /> Inserir foto
        </Button>
        <p className="text-center text-xs text-muted-foreground">Imagens JPG, PNG ou WEBP</p>
        <label className="mt-auto flex items-center gap-2 text-sm">
          <Checkbox checked={form.inactive} onCheckedChange={(v) => set("inactive", !!v)} />
          Desativar produto?
        </label>
      </div>
    </div>
  );
}
