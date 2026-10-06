import { useEffect, useState } from "react";
import { Bell, Download, LockKeyhole, MessageCircle, Moon, Save, Settings, Sun, Trash2, UserCircle, Users, UserPlus, Pencil, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { stores } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { ALL_PERMISSIONS, type AccessMode, type AppUser, type Permission, useAuth } from "@/lib/auth";

type Profile = { name:string; email:string; phone:string; role:"Administrador"|"Gerente"|"Vendedor"|"Caixa"; photo:string };
type SettingsData = { businessName:string; defaultDueDays:number; lowStockWarning:boolean; birthdayReminders:boolean; overdueReminders:boolean; eventNotifications:boolean; theme:"light"|"dark"|"system"; compactTables:boolean };
type WhatsAppMessages = { enabled:boolean; apiUrl:string; phoneNumberId:string; ficha:string; pagamento:string; parcelamento:string; cobranca:string; compra:string };
const defaultWhatsApp:WhatsAppMessages={enabled:false,apiUrl:"/api/whatsapp/send",phoneNumberId:"",ficha:"Olá {cliente}! Sua ficha está com saldo de {saldo}.",pagamento:"Olá {cliente}! Recebemos {valor}. Seu saldo agora é {saldo}.",parcelamento:"Olá {cliente}! Sua ficha de {saldo} foi organizada em {parcelas}x de {parcela}.",cobranca:"Olá {cliente}! Sua ficha está com saldo de {saldo}. Vencimento: {vencimento}.",compra:"Olá {cliente}! Sua compra de {valor} foi lançada na ficha. Saldo atual: {saldo}."};
const defaultProfile:Profile={name:"Alex",email:"",phone:"",role:"Administrador",photo:""};
const defaultSettings:SettingsData={businessName:"Caixa Central",defaultDueDays:30,lowStockWarning:true,birthdayReminders:true,overdueReminders:true,eventNotifications:true,theme:"system",compactTables:false};

function load<T>(key:string,fallback:T):T{if(typeof window==="undefined")return fallback;try{return JSON.parse(localStorage.getItem(key)||"null")??fallback}catch{return fallback}}

const desktopPermissions:Array<{id:Permission;label:string}>=[["dashboard","Dashboard"],["clientes","Clientes"],["vendas","Vendas"],["produtos","Produtos"],["gestao","Gestão"],["configuracoes","Configurações"]].map(([id,label])=>({id:id as Permission,label:label as string}));
const mobilePermissions:Array<{id:Permission;label:string}>=[["clientes","Clientes"],["estoque","Estoque"],["reservas","Reservas"]].map(([id,label])=>({id:id as Permission,label:label as string}));

export function ProfileSettingsSection(){
  const {store,setStore}=useStore();
  const {user,isAdmin,users,updateUser,addUser,removeUser,changePassword}=useAuth();
  const [profile,setProfile]=useState<Profile>(()=>load("modah:profile",defaultProfile));
  const [settings,setSettings]=useState<SettingsData>(()=>load("modah:settings",defaultSettings));
  const [whatsapp,setWhatsapp]=useState<WhatsAppMessages>(()=>load("modah:whatsapp-messages",defaultWhatsApp));
  const [newPassword,setNewPassword]=useState("");
  const [saved,setSaved]=useState(false);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [userForm,setUserForm]=useState({name:"",login:"",password:"",role:"Vendedor" as AppUser["role"],accessMode:"vendedor" as AccessMode,permissions:["clientes","estoque","reservas"] as Permission[],active:true});

  useEffect(()=>{const dark=settings.theme==="dark"||(settings.theme==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);document.title=settings.businessName||"Caixa Central"},[settings.theme,settings.businessName]);

  const save=async()=>{
    localStorage.setItem("modah:profile",JSON.stringify(profile));
    localStorage.setItem("modah:settings",JSON.stringify(settings));
    localStorage.setItem("modah:whatsapp-messages",JSON.stringify(whatsapp));
    localStorage.setItem("modah:business-name",settings.businessName);
    if(user){
      updateUser(user.id,{name:profile.name,role:profile.role});
      if(newPassword.trim()) await changePassword(user.id,newPassword.trim());
    }
    window.dispatchEvent(new Event("modah:profile-updated"));setNewPassword("");setSaved(true);setTimeout(()=>setSaved(false),1800);
  };

  const exportData=()=>{const data=Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith("modah:")).map(k=>[k,localStorage.getItem(k)]));const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="backup-caixa-central.json";a.click();URL.revokeObjectURL(url)};
  const clearData=()=>{if(!window.confirm("Isso apagará os dados locais do sistema e restaurará o ambiente inicial. Continuar?"))return;Object.keys(localStorage).filter(k=>k.startsWith("modah:")).forEach(k=>localStorage.removeItem(k));window.location.reload()};
  const setPhoto=(file?:File)=>{if(!file)return;const reader=new FileReader();reader.onload=()=>setProfile(p=>({...p,photo:String(reader.result)}));reader.readAsDataURL(file)};

  const startEdit=(u:AppUser)=>{setEditingId(u.id);setUserForm({name:u.name,login:u.login,password:"",role:u.role,accessMode:u.accessMode,permissions:u.permissions,active:u.active})};
  const resetForm=()=>{setEditingId(null);setUserForm({name:"",login:"",password:"",role:"Vendedor",accessMode:"vendedor",permissions:["clientes","estoque","reservas"],active:true})};
  const togglePermission=(permission:Permission)=>setUserForm(f=>({...f,permissions:f.permissions.includes(permission)?f.permissions.filter(p=>p!==permission):[...f.permissions,permission]}));
  const saveUser=async()=>{
    if(!userForm.name.trim()||!userForm.login.trim()||(!editingId&&!userForm.password.trim()))return;
    if(userForm.accessMode==="gestao"&&!userForm.permissions.includes("gestao"))setUserForm(f=>({...f,permissions:[...f.permissions,"gestao"]}));
    const permissions=userForm.accessMode==="gestao"&& !userForm.permissions.includes("gestao")?[...userForm.permissions,"gestao"]:userForm.permissions;
    if(editingId){
      updateUser(editingId,{name:userForm.name.trim(),login:userForm.login.trim(),role:userForm.role,accessMode:userForm.accessMode,permissions,active:userForm.active});
      if(userForm.password.trim())await changePassword(editingId,userForm.password.trim());
    }else{
      const passwordHashUser=userForm.password.trim();
      await (async()=>{const tempId=crypto.randomUUID(); const data=new TextEncoder().encode(passwordHashUser);const digest=await crypto.subtle.digest("SHA-256",data);const hash=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");addUser({id:tempId,login:userForm.login.trim(),passwordHash:hash,name:userForm.name.trim(),role:userForm.role,accessMode:userForm.accessMode,permissions,active:userForm.active} as Omit<AppUser,"id">)})();
    }
    resetForm();
  };

  return <div className="space-y-5">
    <section className="card-elevated rounded-2xl p-5">
      <div className="mb-5 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><UserCircle className="h-5 w-5"/></div><div><h2 className="font-bold">Meu perfil e acesso</h2><p className="text-sm text-muted-foreground">Altere seus dados, login e senha.</p></div></div>
      <div className="grid gap-5 md:grid-cols-[140px_1fr]">
        <div className="space-y-2"><div className="aspect-square overflow-hidden rounded-2xl border bg-muted">{profile.photo?<img src={profile.photo} alt="Foto do perfil" className="h-full w-full object-cover"/>:<div className="grid h-full place-items-center text-muted-foreground"><UserCircle className="h-16 w-16"/></div>}</div><Input type="file" accept="image/*" onChange={e=>setPhoto(e.target.files?.[0])}/></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Nome</Label><Input value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})}/></div>
          <div><Label>Login atual</Label><Input value={user?.login||""} onChange={e=>user&&updateUser(user.id,{login:e.target.value.trim()})}/></div>
          <div><Label>Nova senha</Label><Input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Deixe vazio para manter"/></div>
          <div><Label>Perfil</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={profile.role} disabled={!isAdmin} onChange={e=>setProfile({...profile,role:e.target.value as Profile["role"]})}>{["Administrador","Gerente","Vendedor","Caixa"].map(x=><option key={x}>{x}</option>)}</select></div>
          <div><Label>E-mail</Label><Input type="email" value={profile.email} onChange={e=>setProfile({...profile,email:e.target.value})}/></div>
          <div><Label>Telefone</Label><Input value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})}/></div>
        </div>
      </div>
      <div className="mt-5"><Button onClick={save}><Save className="h-4 w-4"/>{saved?"Salvo":"Salvar perfil e acesso"}</Button></div>
    </section>

    <section className="card-elevated rounded-2xl p-5">
      <div className="mb-5 flex items-center gap-3"><Settings className="h-5 w-5 text-primary"/><div><h2 className="font-bold">Configurações do sistema</h2><p className="text-sm text-muted-foreground">Defina como o sistema deve funcionar para sua loja.</p></div></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div><Label>Nome da operação</Label><Input value={settings.businessName} onChange={e=>setSettings({...settings,businessName:e.target.value})}/></div>
        <div><Label>Loja atual</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={store} onChange={e=>setStore(e.target.value)}>{stores.map(x=><option key={x}>{x}</option>)}</select></div>
        <div><Label>Prazo padrão da ficha (dias)</Label><Input type="number" min="1" value={settings.defaultDueDays} onChange={e=>setSettings({...settings,defaultDueDays:Math.max(1,Number(e.target.value)||30)})}/></div>
        <div><Label>Aparência</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={settings.theme} onChange={e=>setSettings({...settings,theme:e.target.value as SettingsData["theme"]})}><option value="system">Sistema</option><option value="light">Claro</option><option value="dark">Escuro</option></select></div>
      </div>
      <div className="mt-5 space-y-2">{[["lowStockWarning","Alertar estoque abaixo do mínimo",settings.lowStockWarning],["birthdayReminders","Lembrar aniversários de clientes",settings.birthdayReminders],["overdueReminders","Lembrar fichas vencidas",settings.overdueReminders],["eventNotifications","Notificar eventos da agenda",settings.eventNotifications],["compactTables","Usar tabelas mais compactas",settings.compactTables]].map(([key,label,value])=><label key={String(key)} className="flex items-center justify-between rounded-xl border p-3 text-sm"><span>{label}</span><input type="checkbox" checked={Boolean(value)} onChange={e=>setSettings({...settings,[key as string]:e.target.checked} as SettingsData)}/></label>)}</div>
      <div className="mt-5"><Button onClick={save}><Save className="h-4 w-4"/>Salvar configurações</Button></div>
    </section>

    {isAdmin&&<section className="card-elevated rounded-2xl p-5">
      <div className="mb-5 flex items-center gap-3"><Users className="h-5 w-5 text-primary"/><div><h2 className="font-bold">Usuários e permissões</h2><p className="text-sm text-muted-foreground">Defina quem entra na Gestão e quem trabalha como vendedor.</p></div></div>
      <div className="rounded-2xl border p-4">
        <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">{editingId?"Editar usuário":"Novo usuário"}</h3>{editingId&&<Button variant="ghost" size="sm" onClick={resetForm}>Cancelar</Button>}</div>
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label>Nome</Label><Input value={userForm.name} onChange={e=>setUserForm({...userForm,name:e.target.value})}/></div>
          <div><Label>Login</Label><Input value={userForm.login} onChange={e=>setUserForm({...userForm,login:e.target.value})}/></div>
          <div><Label>{editingId?"Nova senha (opcional)":"Senha"}</Label><Input type="password" value={userForm.password} onChange={e=>setUserForm({...userForm,password:e.target.value})}/></div>
          <div><Label>Perfil</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={userForm.role} onChange={e=>setUserForm({...userForm,role:e.target.value as AppUser["role"]})}>{["Administrador","Gerente","Vendedor","Caixa"].map(x=><option key={x}>{x}</option>)}</select></div>
          <div><Label>Tela de acesso</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={userForm.accessMode} onChange={e=>{const mode=e.target.value as AccessMode;setUserForm({...userForm,accessMode:mode,permissions:mode==="gestao"?["dashboard","clientes","vendas","produtos","gestao","configuracoes"]:["clientes","estoque","reservas"]})}}><option value="vendedor">Vendedor · Mobile</option><option value="gestao">Gestão · Desktop</option></select></div>
          <label className="flex items-center justify-between rounded-xl border p-3 text-sm"><span>Usuário ativo</span><input type="checkbox" checked={userForm.active} onChange={e=>setUserForm({...userForm,active:e.target.checked})}/></label>
        </div>
        <div className="mt-4"><p className="mb-2 text-sm font-semibold">Permissões</p><div className="grid gap-2 sm:grid-cols-2">{(userForm.accessMode==="gestao"?desktopPermissions:mobilePermissions).map(p=><label key={p.id} className="flex items-center gap-2 rounded-xl border p-3 text-sm"><input type="checkbox" checked={userForm.permissions.includes(p.id)} onChange={()=>togglePermission(p.id)}/>{p.label}</label>)}</div></div>
        <Button className="mt-4" onClick={saveUser} disabled={!userForm.name.trim()||!userForm.login.trim()||(!editingId&&!userForm.password.trim())}>{editingId?<><Pencil className="h-4 w-4"/>Salvar usuário</>:<><UserPlus className="h-4 w-4"/>Criar usuário</>}</Button>
      </div>
      <div className="mt-4 space-y-2">{users.map(u=><div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"><div><p className="font-medium">{u.name} <span className="text-xs text-muted-foreground">(@{u.login})</span></p><p className="text-xs text-muted-foreground">{u.role} · {u.accessMode==="gestao"?"Gestão/Desktop":"Vendedor/Mobile"}</p></div><div className="flex items-center gap-2"><span className={"rounded-full px-2.5 py-1 text-xs "+(u.active?"bg-success/15 text-success":"bg-muted text-muted-foreground")}>{u.active?"Ativo":"Inativo"}</span><Button size="sm" variant="outline" onClick={()=>startEdit(u)}><Pencil className="h-4 w-4"/>Editar</Button>{u.id!=="admin"&&<Button size="sm" variant="ghost" onClick={()=>removeUser(u.id)}><Trash2 className="h-4 w-4"/></Button>}</div></div>)}</div>
    </section>}

    <section className="card-elevated rounded-2xl p-5">
      <div className="mb-5 flex items-center gap-3"><MessageCircle className="h-5 w-5 text-primary"/><div><h2 className="font-bold">WhatsApp e mensagens automáticas</h2><p className="text-sm text-muted-foreground">Configure os textos e o endereço usado pela integração com a API do WhatsApp.</p></div></div>
      <div className="space-y-4">
        <label className="flex items-center justify-between rounded-xl border p-3 text-sm"><span><b>Ativar integração</b><br/><span className="text-xs text-muted-foreground">O segredo da API fica no servidor.</span></span><input type="checkbox" checked={whatsapp.enabled} onChange={e=>setWhatsapp({...whatsapp,enabled:e.target.checked})}/></label>
        <div className="grid gap-3 md:grid-cols-2"><div><Label>Endpoint de envio</Label><Input value={whatsapp.apiUrl} onChange={e=>setWhatsapp({...whatsapp,apiUrl:e.target.value})}/></div><div><Label>Phone Number ID</Label><Input value={whatsapp.phoneNumberId} onChange={e=>setWhatsapp({...whatsapp,phoneNumberId:e.target.value})}/></div></div>
        <div className="grid gap-3 md:grid-cols-2">{[["ficha","Nova ficha"],["compra","Compra adicionada"],["pagamento","Pagamento/abatimento"],["parcelamento","Parcelamento"],["cobranca","Cobrança"]].map(([key,label])=><div key={key}><Label>{label}</Label><textarea className="mt-1 min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm" value={whatsapp[key as keyof WhatsAppMessages] as string} onChange={e=>setWhatsapp({...whatsapp,[key]:e.target.value})}/></div>)}</div>
        <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">Variáveis: <b>{"{cliente}"}</b>, <b>{"{valor}"}</b>, <b>{"{saldo}"}</b>, <b>{"{parcelas}"}</b>, <b>{"{parcela}"}</b>, <b>{"{vencimento}"}</b>.</p>
        <Button onClick={save}><Save className="h-4 w-4"/>Salvar WhatsApp</Button>
      </div>
    </section>

    <section className="card-elevated rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-3"><Bell className="h-5 w-5 text-primary"/><div><h2 className="font-bold">Preferências rápidas</h2><p className="text-sm text-muted-foreground">Ferramentas para manutenção da operação local.</p></div></div>
      <div className="grid gap-3 sm:grid-cols-2"><Button variant="outline" onClick={exportData}><Download className="h-4 w-4"/>Exportar backup local</Button><Button variant="outline" onClick={()=>{setSettings({...settings,theme:"light"});localStorage.setItem("modah:settings",JSON.stringify({...settings,theme:"light"}))}}><Sun className="h-4 w-4"/>Forçar modo claro</Button><Button variant="outline" onClick={()=>{setSettings({...settings,theme:"dark"});localStorage.setItem("modah:settings",JSON.stringify({...settings,theme:"dark"}))}}><Moon className="h-4 w-4"/>Forçar modo escuro</Button><Button variant="destructive" onClick={clearData}><Trash2 className="h-4 w-4"/>Restaurar dados iniciais</Button></div>
      <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><LockKeyhole className="h-3 w-3"/>Os dados de autenticação deste MVP ficam no armazenamento local do navegador.</p>
    </section>
  </div>;
}
