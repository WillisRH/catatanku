"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin:      "Email atau password salah.",
  AccessDenied:           "Akunmu tidak diizinkan untuk masuk.",
  AccountSuspended:       "Akun ini telah di-suspend oleh admin.",
  OAuthCallbackError:     "Login Google gagal. Coba lagi.",
  OAuthSignInError:       "Gagal memulai login Google. Periksa koneksimu.",
  OAuthSignin:            "Gagal login dengan Google. Coba lagi.",
  AccountNotLinked:       "Email ini sudah terdaftar dengan metode login yang berbeda.",
  OAuthAccountNotLinked:  "Email ini sudah terdaftar dengan password. Masuk pakai email & password.",
  MissingCSRF:            "Sesi keamanan kedaluwarsa. Muat ulang halaman dan coba lagi.",
  EmailSignInError:       "Gagal mengirim email login. Periksa alamat emailmu.",
  Callback:               "Terjadi kesalahan saat login. Coba lagi.",
};

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const errorCode   = searchParams.get("error") ?? "";
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [isLogin, setIsLogin] = useState(true);
  const [email,    setEmail]   = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]    = useState("");
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState(
    errorCode ? (ERROR_MESSAGES[errorCode] ?? "Terjadi kesalahan login.") : ""
  );

  // Clear error on tab switch
  useEffect(() => { setError(""); }, [isLogin]);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        const res = await signIn("credentials", { email, password, redirect: false, callbackUrl });
        if (res?.error) {
          setError(ERROR_MESSAGES[res.error] ?? "Email atau password salah.");
        } else if (res?.ok) {
          router.push(callbackUrl);
        }
      } else {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (res.ok) {
          await signIn("credentials", { email, password, redirect: false, callbackUrl });
          router.push(callbackUrl);
        } else {
          if (data.error === "User already exists") {
            setError("Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.");
          } else if (data.error === "Missing email or password") {
            setError("Email dan password tidak boleh kosong.");
          } else {
            setError(data.error || "Pendaftaran gagal.");
          }
        }
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", padding:20, fontFamily:"'Lora',serif" }}>
      <div style={{ width:"100%", maxWidth:400, background:"var(--surface)", padding:40, borderRadius:24, boxShadow:"var(--shadow)", border:"1px solid var(--line)" }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2.4rem", textAlign:"center", marginBottom:8, color:"var(--ink)" }}>Catatanku</h1>
        <p style={{ textAlign:"center", color:"var(--ink2)", fontSize:".9rem", marginBottom:32 }}>
          {isLogin ? "Selamat datang kembali." : "Mulai perjalanan menulismu."}
        </p>

        {/* Google Sign-In */}
        <button
          onClick={() => signIn("google", { callbackUrl })}
          disabled={loading}
          style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"13px 16px", borderRadius:12, border:"1px solid var(--line)", background:"var(--bg)", fontFamily:"'Lora',serif", fontSize:".9rem", fontWeight:600, color:"var(--ink)", cursor:"pointer", marginBottom:20, transition:"box-shadow .15s" }}
          onMouseOver={e => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.1)")}
          onMouseOut={e  => (e.currentTarget.style.boxShadow = "none")}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Lanjutkan dengan Google
        </button>

        {/* Divider */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <div style={{ flex:1, height:1, background:"var(--line)" }}/>
          <span style={{ fontSize:".75rem", color:"var(--ink3)" }}>atau</span>
          <div style={{ flex:1, height:1, background:"var(--line)" }}/>
        </div>

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {!isLogin && (
            <input type="text" placeholder="Nama Lengkap" value={name} onChange={e => setName(e.target.value)} required
              style={{ padding:"12px 16px", borderRadius:12, border:"1px solid var(--line)", background:"var(--bg)", fontFamily:"'Lora',serif", fontSize:".9rem", color:"var(--ink)", outline:"none" }}/>
          )}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
            style={{ padding:"12px 16px", borderRadius:12, border:"1px solid var(--line)", background:"var(--bg)", fontFamily:"'Lora',serif", fontSize:".9rem", color:"var(--ink)", outline:"none" }}/>
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
            style={{ padding:"12px 16px", borderRadius:12, border:"1px solid var(--line)", background:"var(--bg)", fontFamily:"'Lora',serif", fontSize:".9rem", color:"var(--ink)", outline:"none" }}/>

          {error && <p style={{ color:"#C27054", fontSize:".8rem", textAlign:"center", margin:0 }}>{error}</p>}

          <button type="submit" disabled={loading}
            style={{ padding:"14px", borderRadius:12, border:"none", background:"var(--accent)", color:"#fff", fontFamily:"'Lora',serif", fontWeight:600, fontSize:".9rem", cursor:loading?"not-allowed":"pointer", marginTop:8, opacity:loading?0.7:1, transition:"opacity .2s" }}>
            {loading ? "Memproses..." : (isLogin ? "Masuk" : "Daftar")}
          </button>
        </form>

        <p style={{ textAlign:"center", marginTop:24, fontSize:".85rem", color:"var(--ink2)" }}>
          {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)}
            style={{ background:"none", border:"none", color:"var(--accent)", cursor:"pointer", fontWeight:600, fontFamily:"'Lora',serif", fontSize:".85rem" }}>
            {isLogin ? "Daftar di sini" : "Masuk di sini"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
