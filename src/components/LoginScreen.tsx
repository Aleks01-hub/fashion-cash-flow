import { useState } from "react";
import { ArrowLeft, KeyRound, LockKeyhole, LogIn, UserCircle, Mail, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export function LoginScreen() {
  const { login, resetPassword } = useAuth();
  const [recovery, setRecovery] = useState(false);
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      if (recovery) {
        const result = await resetPassword(loginValue, code, newPassword);
        if (result.ok) {
          setMessage("Senha redefinida com sucesso. Agora entre com a nova senha.");
          setRecovery(false);
          setPassword("");
          setCode("");
          setNewPassword("");
        } else {
          setError(result.message || "Não foi possível redefinir a senha.");
        }
        return;
      }

      const result = await login(loginValue, password);
      if (!result.ok) {
        setError(result.message || "Login ou senha inválidos.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <div className="relative w-full max-w-md">
        {/* Background decorative elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <form onSubmit={submit} className="card-elevated rounded-3xl p-6 sm:p-8 backdrop-blur-sm bg-card/80 border border-border/50">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-lg shadow-primary/25">
              <LockKeyhole className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Caixa Central</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {recovery ? "Recupere o acesso à sua conta." : "Sistema de gestão para lojas de moda"}
            </p>
            {!recovery && (
              <p className="mt-4 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground border border-border/50">
                Primeiro acesso: <span className="font-mono font-semibold text-foreground">admin</span> / <span className="font-mono font-semibold text-foreground">admin</span>
                <span className="ml-2 text-primary">Troque a senha após entrar</span>
              </p>
            )}
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Login</Label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" aria-hidden="true" />
                <Input
                  autoFocus
                  value={loginValue}
                  onChange={(e) => setLoginValue(e.target.value)}
                  className="pl-11 h-11 rounded-xl border-border/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  placeholder="Seu login"
                  disabled={isLoading}
                />
              </div>
            </div>

            {!recovery && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Senha</Label>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline"
                    onClick={() => {
                      setRecovery(true);
                      setError("");
                      setMessage("");
                    }}
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" aria-hidden="true" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 h-11 rounded-xl border-border/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="Sua senha"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {recovery && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Código de recuperação</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" aria-hidden="true" />
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="pl-11 h-11 rounded-xl border-border/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                      placeholder="Digite o código de recuperação"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nova senha</Label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" aria-hidden="true" />
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-11 h-11 rounded-xl border-border/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                      placeholder="Mínimo de 4 caracteres"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground border border-border/50">
                  Como esta versão ainda não usa e-mail/SMS, a recuperação utiliza um código local de recuperação.
                </p>
              </>
            )}

            {error && (
              <div className="rounded-xl bg-danger/10 border border-danger/20 p-3 text-sm text-danger animate-in slide-in-from-top-2 duration-200" role="alert">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl bg-success/10 border border-success/20 p-3 text-sm text-success animate-in slide-in-from-top-2 duration-200" role="status">
                {message}
              </div>
            )}

            <Button
              className="w-full h-12 rounded-xl text-base font-semibold shadow-sm hover:shadow-md transition-all"
              size="lg"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {recovery ? "Redefinindo..." : "Entrando..."}
                </>
              ) : recovery ? (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Redefinir senha
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </>
              )}
            </Button>

            <button
              type="button"
              className="mx-auto flex items-center gap-1 text-sm font-medium text-primary hover:underline transition-colors"
              onClick={() => {
                setRecovery(!recovery);
                setError("");
                setMessage("");
              }}
              disabled={isLoading}
            >
              {recovery ? (
                <>
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o login
                </>
              ) : (
                <>
                  Esqueci minha senha
                </>
              )}
            </button>
          </div>
        </form>

        {/* Version info */}
        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Modah Gestão v1.0.0 — Powered by TanStack Start + Spring Boot
        </p>
      </div>
    </main>
  );
}