import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError, setAccessToken } from "./api";

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
  id:"admin", login:"admin", passwordHash:"",
  name:"Administrador", role:"Administrador", accessMode:"gestao", permissions:[...ALL_PERMISSIONS], active:true
};

type ApiUser = {
  id: string; login: string; name: string; role: AppUser["role"];
  accessMode: AccessMode; permissions: string | Permission[]; active: boolean;
};
type LoginResponse = { token: string; user: ApiUser };

async function hashPassword(value:string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b)=>b.toString(16).padStart(2,"0")).join("");
}
function parsePermissions(value: string | Permission[]): Permission[] {
  if (Array.isArray(value)) return value;
  try { const parsed = JSON.parse(value) as Permission[]; return Array.isArray(parsed) ? parsed : [...ALL_PERMISSIONS]; }
  catch { return [...ALL_PERMISSIONS]; }
}
function fromApi(user: ApiUser): AppUser {
  return { ...user, passwordHash:"", permissions:parsePermissions(user.permissions), accessMode:user.accessMode === "vendedor" ? "vendedor" : "gestao", active:user.active !== false };
}
function normalizeUser(u:Partial<AppUser>):AppUser {
  return { ...adminUser, ...u, passwordHash:u.passwordHash || "", permissions:Array.isArray(u.permissions)?u.permissions:[...ALL_PERMISSIONS], accessMode:u.accessMode==="vendedor"?"vendedor":"gestao", active:u.active!==false } as AppUser;
}
function loadUsers():AppUser[] {
  if(typeof window==="undefined") return [adminUser];
  try {
    const saved=JSON.parse(localStorage.getItem(USERS_KEY)||"null");
    if(!Array.isArray(saved)||!saved.length) return [adminUser];
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
  changePassword:(id:string,password:string)=>Promise<void>;
  resetPassword:(login:string,code:string,password:string)=>Promise<{ok:boolean;message?:string}>;
  can:(permission:Permission)=>boolean;
};
const AuthContext=createContext<AuthValue|null>(null);

export function AuthProvider({children}:{children:ReactNode}){
  const [users,setUsers]=useState<AppUser[]>(loadUsers);
  const [sessionId,setSessionId]=useState<string|null>(()=>typeof window==="undefined"?null:localStorage.getItem(SESSION_KEY));
  const user=users.find((u)=>u.id===sessionId&&u.active)||null;
  const isAdmin=user?.id==="admin"||user?.role==="Administrador";
  const persist=(next:AppUser[])=>{setUsers(next);localStorage.setItem(USERS_KEY,JSON.stringify(next));};

  // Restore the server-validated session instead of trusting a local user ID.
  useEffect(() => {
    if (typeof window === "undefined" || !localStorage.getItem("caixa-central:access-token")) return;
    void api.get<ApiUser>("/api/auth/me").then((apiUser) => {
      const restored = fromApi(apiUser);
      setUsers((current) => current.some((u) => u.id === restored.id) ? current.map((u) => u.id === restored.id ? restored : u) : [...current, restored]);
      setSessionId(restored.id);
      localStorage.setItem(SESSION_KEY, restored.id);
    }).catch(() => {
      setAccessToken(null);
      localStorage.removeItem(SESSION_KEY);
      setSessionId(null);
    });
  }, []);

  const value=useMemo<AuthValue>(()=>({
    users,user,isAdmin,
    login:async(loginValue,password)=>{
      try {
        const response = await api.post<LoginResponse>("/api/auth/login", { login:loginValue.trim(), password });
        setAccessToken(response.token);
        const signedIn = fromApi(response.user);
        setUsers((current) => current.some((u) => u.id === signedIn.id) ? current.map((u) => u.id === signedIn.id ? signedIn : u) : [...current.filter((u) => u.id !== "admin"), signedIn]);
        localStorage.setItem(SESSION_KEY,signedIn.id);
        setSessionId(signedIn.id);
        return {ok:true};
      } catch (error) {
        const message = error instanceof ApiError && error.status === 0
          ? "Não foi possível conectar ao servidor. Inicie a API e tente novamente."
          : error instanceof ApiError && error.status === 401
            ? "Login ou senha inválidos."
            : error instanceof Error ? error.message : "Não foi possível entrar.";
        return {ok:false,message};
      }
    },
    logout:()=>{
      void api.post<void>("/api/auth/logout", {}).catch(()=>{});
      setAccessToken(null);
      localStorage.removeItem(SESSION_KEY);
      setSessionId(null);
    },
    // User administration and password recovery are retained for compatibility
    // while their dedicated protected API endpoints are implemented.
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
