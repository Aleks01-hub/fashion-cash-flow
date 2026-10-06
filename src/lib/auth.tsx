import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type AccessMode = "gestao" | "vendedor";
export type Permission = "dashboard" | "clientes" | "vendas" | "produtos" | "gestao" | "configuracoes" | "estoque" | "reservas";

export type AppUser = {
  id: string; login: string; passwordHash: string; name: string;
  role: "Administrador" | "Gerente" | "Vendedor" | "Caixa";
  accessMode: AccessMode; permissions: Permission[]; active: boolean;
};

const USERS_KEY = "modah:auth-users";
const SESSION_KEY = "modah:auth-session";
const RECOVERY_KEY = "modah:auth-recovery-code";
const DEFAULT_RECOVERY_CODE = "CAIXA2026";
export const ALL_PERMISSIONS: Permission[] = ["dashboard","clientes","vendas","produtos","gestao","configuracoes","estoque","reservas"];

const adminUser: AppUser = {
  id:"admin", login:"admin", passwordHash:"8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
  name:"Administrador", role:"Administrador", accessMode:"gestao", permissions:[...ALL_PERMISSIONS], active:true
};

async function hashPassword(value:string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b)=>b.toString(16).padStart(2,"0")).join("");
}

function normalizeUser(u:Partial<AppUser>):AppUser {
  const legacyPassword = (u as Partial<AppUser> & { password?: string }).password;
  return {
    ...adminUser,
    ...u,
    passwordHash: u.passwordHash || "",
    permissions: Array.isArray(u.permissions)?u.permissions:[...ALL_PERMISSIONS],
    accessMode:u.accessMode==="vendedor"?"vendedor":"gestao",
    active:u.active!==false,
    ...(legacyPassword ? { passwordHash: legacyPassword } : {}),
  } as AppUser;
}

function loadUsers():AppUser[] {
  if(typeof window==="undefined") return [adminUser];
  try {
    const saved=JSON.parse(localStorage.getItem(USERS_KEY)||"null");
    if(!Array.isArray(saved)||!saved.length){ localStorage.setItem(USERS_KEY,JSON.stringify([adminUser])); return [adminUser]; }
    const users=saved.map((u:Partial<AppUser>)=>normalizeUser(u));
    if(!users.some((u)=>u.id==="admin")) users.unshift(adminUser);
    return users;
  } catch { return [adminUser]; }
}

type AuthValue = {
  users:AppUser[]; user:AppUser|null; isAdmin:boolean;
  login:(login:string,password:string)=>Promise<{ok:boolean;message?:string}>;
  logout:()=>void; addUser:(u:Omit<AppUser,"id">)=>void;
  updateUser:(id:string,patch:Partial<AppUser>)=>void; removeUser:(id:string)=>void;
  changePassword:(id:string,password:string)=>Promise<void>; resetPassword:(login:string,code:string,password:string)=>Promise<{ok:boolean;message?:string}>; can:(permission:Permission)=>boolean;
};
const AuthContext=createContext<AuthValue|null>(null);

export function AuthProvider({children}:{children:ReactNode}){
  const [users,setUsers]=useState<AppUser[]>(loadUsers);
  const [sessionId,setSessionId]=useState<string|null>(()=>typeof window==="undefined"?null:localStorage.getItem(SESSION_KEY));
  const user=users.find((u)=>u.id===sessionId&&u.active)||null;
  const isAdmin=user?.id==="admin"||user?.role==="Administrador";
  const persist=(next:AppUser[])=>{setUsers(next);localStorage.setItem(USERS_KEY,JSON.stringify(next));};
  const value=useMemo<AuthValue>(()=>({
    users,user,isAdmin,
    login:async(loginValue,password)=>{
      const hash=await hashPassword(password);
      const found=users.find((u)=>u.login.toLowerCase()===loginValue.trim().toLowerCase()&&u.passwordHash===hash);
      if(!found)return {ok:false,message:"Login ou senha inválidos."};
      if(!found.active)return {ok:false,message:"Este usuário está desativado."};
      localStorage.setItem(SESSION_KEY,found.id);setSessionId(found.id);return {ok:true};
    },
    logout:()=>{localStorage.removeItem(SESSION_KEY);setSessionId(null);},
    addUser:(u)=>persist([...users,{...u,id:crypto.randomUUID()}]),
    updateUser:(id,patch)=>persist(users.map((u)=>u.id===id?{...u,...patch}:u)),
    removeUser:(id)=>{if(id!=="admin")persist(users.filter((u)=>u.id!==id));},
    changePassword:async(id,password)=>{const passwordHash=await hashPassword(password);persist(users.map((u)=>u.id===id?{...u,passwordHash}:u));},
    resetPassword:async(loginValue,code,password)=>{
      const recoveryCode=localStorage.getItem(RECOVERY_KEY)||DEFAULT_RECOVERY_CODE;
      if(code.trim()!==recoveryCode)return {ok:false,message:"Código de recuperação inválido."};
      const found=users.find((u)=>u.login.toLowerCase()===loginValue.trim().toLowerCase());
      if(!found)return {ok:false,message:"Usuário não encontrado."};
      if(!password.trim()||password.trim().length<4)return {ok:false,message:"A nova senha deve ter pelo menos 4 caracteres."};
      const passwordHash=await hashPassword(password.trim());
      persist(users.map((u)=>u.id===found.id?{...u,passwordHash,active:true}:u));
      return {ok:true};
    },
    can:(permission)=>Boolean(user&&(isAdmin||user.permissions.includes(permission))),
  }),[users,user,isAdmin]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const c=useContext(AuthContext);if(!c)throw new Error("useAuth must be used inside AuthProvider");return c;}
