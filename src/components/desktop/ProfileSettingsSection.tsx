import { useEffect, useState } from "react";
import { Bell, Download, LockKeyhole, Moon, Save, Settings, Sun, Trash2, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { stores } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

type Profile = { name: string; email: string; phone: string; role: "Administrador" | "Gerente" | "Vendedor" | "Caixa"; photo: string };
type SettingsData = {
  businessName: string; defaultDueDays: number; lowStockWarning: boolean; birthdayReminders: boolean;
  overdueReminders: boolean; eventNotifications: boolean; theme: "light" | "dark" | "system"; compactTables: boolean;
};

const defaultProfile: Profile = { name: "Alex", email: "", phone: "", role: "Administrador", photo: "" };
const defaultSettings: SettingsData = {
  businessName: "Caixa Central", defaultDueDays: 30, lowStockWarning: true, birthdayReminders: true,
  overdueReminders: true, eventNotifications: true, theme: "system", compactTables: false,
};

function load<T>(key:string, fallback:T):T {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(window.localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
}

export function ProfileSettingsSection() {
  const { store, setStore } = useStore();
  const [profile,setProfile]=useState<Profile>(()=>load("modah:profile",defaultProfile));
  const [settings,setSettings]=useState<SettingsData>(()=>load("modah:settings",defaultSettings));
  const [saved,setSaved]=useState(false);

  useEffect(()=>{
    const dark = settings.theme === "dark" || (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    document.title = settings.businessName || "Caixa Central";
  },[settings.theme, settings.businessName]);

  const save=()=>{
    localStorage.setItem("modah:profile",JSON.stringify(profile));
    localStorage.setItem("modah:settings",JSON.stringify(settings));
    localStorage.setItem("modah:business-name",settings.businessName);
    window.dispatchEvent(new Event("modah:profile-updated"));
    setSaved(true); setTimeout(()=>setSaved(false),1800);
  };

  const exportData=()=>{
    const data=Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith("modah:")).map(k=>[k,localStorage.getItem(k)]));
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a");
    a.href=url; a.download="backup-caixa-central.json"; a.click(); URL.revokeObjectURL(url);
  };

  const clearData=()=>{
    if(!window.confirm("Isso apagará os dados locais do sistema e restaurará o ambiente inicial. Continuar?")) return;
    Object.keys(localStorage).filter(k=>k.startsWith("modah:")).forEach(k=>localStorage.removeItem(k));
    window.location.reload();
  };

  const setPhoto=(file?:File)=>{
    if(!file) return;
    const reader=new FileReader(); reader.onload=()=>setProfile(p=>({...p,photo:String(reader.result)})); reader.readAsDataURL(file);
  };

  return <div className="space-y-5">
    <section className="card-elevated rounded-2xl p-5">
      <div className="mb-5 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><UserCircle className="h-5 w-5"/></div><div><h2 className="font-bold">Meu perfil</h2><p className="text-sm text-muted-foreground">Dados do usuário conectado e preferências de acesso.</p></div></div>
      <div className="grid gap-5 md:grid-cols-[140px_1fr]">
        <div className="space-y-2">
          <div className="aspect-square overflow-hidden rounded-2xl border bg-muted">{profile.photo?<img src={profile.photo} alt="Foto do perfil" className="h-full w-full object-cover"/>:<div className="grid h-full place-items-center text-muted-foreground"><UserCircle className="h-16 w-16"/></div>}</div>
          <Input type="file" accept="image/*" onChange={e=>setPhoto(e.target.files?.[0])}/>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Nome</Label><Input value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})}/></div>
          <div><Label>Perfil</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={profile.role} onChange={e=>setProfile({...profile,role:e.target.value as Profile["role"]})}>{["Administrador","Gerente","Vendedor","Caixa"].map(x=><option key={x}>{x}</option>)}</select></div>
          <div><Label>E-mail</Label><Input type="email" value={profile.email} onChange={e=>setProfile({...profile,email:e.target.value})}/></div>
          <div><Label>Telefone</Label><Input value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})}/></div>
        </div>
      </div>
    </section>

    <section className="card-elevated rounded-2xl p-5">
      <div className="mb-5 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Settings className="h-5 w-5"/></div><div><h2 className="font-bold">Configurações do sistema</h2><p className="text-sm text-muted-foreground">Defina como o sistema deve funcionar para sua loja.</p></div></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div><Label>Nome da operação</Label><Input value={settings.businessName} onChange={e=>setSettings({...settings,businessName:e.target.value})}/></div>
        <div><Label>Loja atual</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={store} onChange={e=>setStore(e.target.value)}>{stores.map(x=><option key={x}>{x}</option>)}</select></div>
        <div><Label>Prazo padrão da ficha (dias)</Label><Input type="number" min="1" value={settings.defaultDueDays} onChange={e=>setSettings({...settings,defaultDueDays:Math.max(1,Number(e.target.value)||30)})}/></div>
        <div><Label>Aparência</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={settings.theme} onChange={e=>setSettings({...settings,theme:e.target.value as SettingsData["theme"]})}><option value="system">Sistema</option><option value="light">Claro</option><option value="dark">Escuro</option></select></div>
      </div>
      <div className="mt-5 space-y-2">
        {[
          ["lowStockWarning","Alertar estoque abaixo do mínimo",settings.lowStockWarning],
          ["birthdayReminders","Lembrar aniversários de clientes",settings.birthdayReminders],
          ["overdueReminders","Lembrar fichas vencidas",settings.overdueReminders],
          ["eventNotifications","Notificar eventos da agenda",settings.eventNotifications],
          ["compactTables","Usar tabelas mais compactas",settings.compactTables],
        ].map(([key,label,value])=><label key={String(key)} className="flex items-center justify-between rounded-xl border p-3 text-sm"><span>{label}</span><input type="checkbox" checked={Boolean(value)} onChange={e=>setSettings({...settings,[key as string]:e.target.checked} as SettingsData)}/></label>)}
      </div>
      <div className="mt-5 flex flex-wrap gap-2"><Button onClick={save}><Save className="h-4 w-4"/>{saved?"Salvo":"Salvar configurações"}</Button></div>
    </section>

    <section className="card-elevated rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-3"><Bell className="h-5 w-5 text-primary"/><div><h2 className="font-bold">Preferências rápidas</h2><p className="text-sm text-muted-foreground">Ferramentas para manutenção da operação local.</p></div></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="outline" onClick={exportData}><Download className="h-4 w-4"/> Exportar backup local</Button>
        <Button variant="outline" onClick={()=>{localStorage.setItem("modah:settings",JSON.stringify({...settings,theme:"light"}));setSettings({...settings,theme:"light"});}}><Sun className="h-4 w-4"/> Forçar modo claro</Button>
        <Button variant="outline" onClick={()=>{localStorage.setItem("modah:settings",JSON.stringify({...settings,theme:"dark"}));setSettings({...settings,theme:"dark"});}}><Moon className="h-4 w-4"/> Forçar modo escuro</Button>
        <Button variant="destructive" onClick={clearData}><Trash2 className="h-4 w-4"/> Restaurar dados iniciais</Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1"><LockKeyhole className="h-3 w-3"/> A limpeza afeta apenas os dados locais deste aplicativo.</p>
    </section>
  </div>;
}
