import { useState } from "react";
import { ArrowLeft, KeyRound, LockKeyhole, LogIn, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export function LoginScreen(){
  const {login,resetPassword}=useAuth();
  const [recovery,setRecovery]=useState(false);
  const [loginValue,setLoginValue]=useState("");
  const [password,setPassword]=useState("");
  const [code,setCode]=useState("");
  const [newPassword,setNewPassword]=useState("");
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault(); setError(""); setMessage("");
    if(recovery){
      const result=await resetPassword(loginValue,code,newPassword);
      if(result.ok){setMessage("Senha redefinida com sucesso. Agora entre com a nova senha.");setRecovery(false);setPassword("");setCode("");setNewPassword("");}
      else setError(result.message||"Não foi possível redefinir a senha.");
      return;
    }
    const result=await login(loginValue,password);
    if(!result.ok)setError(result.message||"Login ou senha inválidos.");
  };

  return <main className="grid min-h-screen place-items-center bg-background px-4">
    <form onSubmit={submit} className="card-elevated w-full max-w-md rounded-3xl p-6 sm:p-8">
      <div className="mb-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground"><LockKeyhole className="h-7 w-7"/></div>
        <h1 className="mt-4 text-2xl font-black">Caixa Central</h1>
        <p className="mt-1 text-sm text-muted-foreground">{recovery?"Recupere o acesso à sua conta.":"Entre para acessar o sistema."}</p>
      </div>
      <div className="space-y-4">
        <div><Label>Login</Label><div className="relative mt-1"><UserCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input autoFocus value={loginValue} onChange={e=>setLoginValue(e.target.value)} className="pl-9" placeholder="Seu login"/></div></div>
        {!recovery&&<div><Label>Senha</Label><div className="relative mt-1"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="pl-9" placeholder="Sua senha"/></div></div>}
        {recovery&&<>
          <div><Label>Código de recuperação</Label><Input value={code} onChange={e=>setCode(e.target.value)} placeholder="Digite o código de recuperação"/></div>
          <div><Label>Nova senha</Label><Input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Mínimo de 4 caracteres"/></div>
          <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">Como esta versão ainda não usa e-mail/SMS, a recuperação utiliza um código local de recuperação.</p>
        </>}
        {error&&<p className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}
        {message&&<p className="rounded-xl bg-success/10 p-3 text-sm text-success">{message}</p>}
        <Button className="w-full" size="lg" type="submit">{recovery?<><KeyRound className="h-4 w-4"/>Redefinir senha</>:<><LogIn className="h-4 w-4"/>Entrar</>}</Button>
        <button type="button" className="mx-auto flex items-center gap-1 text-sm font-medium text-primary hover:underline" onClick={()=>{setRecovery(!recovery);setError("");setMessage("")}}>{recovery?<><ArrowLeft className="h-4 w-4"/>Voltar para o login</>:<>Esqueci minha senha</>}</button>
      </div>
    </form>
  </main>;
}
