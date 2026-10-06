import { useState } from "react";
import { LockKeyhole, LogIn, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export function LoginScreen(){
  const {login}=useAuth();
  const [loginValue,setLoginValue]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();
    const result=await login(loginValue,password);
    if(!result.ok)setError(result.message||"Não foi possível entrar.");
  };
  return <main className="grid min-h-screen place-items-center bg-background px-4">
    <form onSubmit={submit} className="card-elevated w-full max-w-md rounded-3xl p-6 sm:p-8">
      <div className="mb-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground"><LockKeyhole className="h-7 w-7"/></div>
        <h1 className="mt-4 text-2xl font-black">Caixa Central</h1>
        <p className="mt-1 text-sm text-muted-foreground">Entre para acessar o sistema.</p>
      </div>
      <div className="space-y-4">
        <div><Label>Login</Label><div className="relative mt-1"><UserCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input autoFocus value={loginValue} onChange={e=>setLoginValue(e.target.value)} className="pl-9" placeholder="Seu login"/></div></div>
        <div><Label>Senha</Label><div className="relative mt-1"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="pl-9" placeholder="Sua senha"/></div></div>
        {error&&<p className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}
        <Button className="w-full" size="lg" type="submit"><LogIn className="h-4 w-4"/>Entrar</Button>
      </div>
    </form>
  </main>;
}
