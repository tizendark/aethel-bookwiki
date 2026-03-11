"use client";

import { useState } from "react";
import { auth, db, googleProvider } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  signInWithPopup
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Loader2, BookOpen, AlertCircle, Key, Mail, User } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Log in
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/");
      } else {
        // Sign up
        if (!name) throw new Error("Por favor, ingresa tu nombre.");
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update profile with name
        await updateProfile(user, { displayName: name });

        // Create user document with role
        await setDoc(doc(db, "users", user.uid), {
          name: name,
          email: email,
          role: "user",
          createdAt: new Date()
        });
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Credenciales inválidas. Verifica tu correo y contraseña.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Este correo ya está registrado.");
      } else if (err.code === "auth/weak-password") {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setError(err.message || "Ocurrió un error de autenticación.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          name: user.displayName || "Usuario Anónimo",
          email: user.email,
          role: "user",
          createdAt: new Date()
        });
      }
      
      router.push("/");
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setError(err.message || "Ocurrió un error al iniciar sesión con Google.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-text">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <BookOpen size={32} strokeWidth={2} />
          </div>
        </div>
        <h2 className="text-center text-4xl font-serif font-bold tracking-tight">
          {isLogin ? "Acceso al" : "Únete al"} <span className="text-primary italic font-light">Archivo</span>
        </h2>
        <p className="mt-3 text-center text-sm text-muted">
          {isLogin ? "¿No tienes cuenta? " : "¿Ya eres miembro? "}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="font-medium text-primary hover:text-primary/80 transition-colors uppercase tracking-widest text-[10px]"
          >
            {isLogin ? "Regístrate aquí" : "Inicia Sesión"}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow-soft border border-border sm:rounded-3xl sm:px-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 opacity-50" />
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-muted mb-2">
                  Nombre Público
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-muted/50" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-text placeholder-muted/50 outline-none"
                    placeholder="Tu nombre de autor"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-muted mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted/50" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-text placeholder-muted/50 outline-none"
                  placeholder="acólito@aethel.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-muted mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-muted/50" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-text placeholder-muted/50 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-4 px-8 border border-transparent rounded-full shadow-editorial text-xs font-black uppercase tracking-[0.2em] text-black bg-white hover:bg-primary hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                isLogin ? "Desbloquear Archivo" : "Forjar Credenciales"
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface px-2 text-muted font-sans uppercase tracking-widest text-[9px] font-black">
                  O puedes
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full flex justify-center items-center gap-3 py-4 px-8 rounded-full border border-border bg-background hover:bg-white/5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-black uppercase tracking-[0.2em] text-text shadow-soft"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor"/>
              </svg>
              Continúa con Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
