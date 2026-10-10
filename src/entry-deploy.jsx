import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import App from "./tjc.jsx";

const C = {
  paper: "#ECE9E2",
  card: "#F6F4EF",
  ink: "#171C26",
  mutedInk: "#5D6470",
  hairline: "rgba(23,28,38,0.14)",
  bronze: "#A5804C",
  brick: "#8A3B2E",
  green: "#3E5C46",
};
const MONO = "'IBM Plex Mono', Menlo, monospace";
const cfg = window.__SUPABASE__ || {};
const sb = createClient(cfg.url, cfg.key);
window.__standalone = true; // AI calls need the Claude.ai runtime; everything else runs here.

// Storage adapter: the same four calls the artifact runtime offers, backed by journal_kv under RLS.
const makeStorage = (userId) => ({
  async get(key) {
    const { data, error } = await sb
      .from("journal_kv")
      .select("value")
      .eq("user_id", userId)
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    return data ? { key, value: data.value } : null;
  },
  async set(key, value) {
    const { error } = await sb
      .from("journal_kv")
      .upsert({ user_id: userId, key, value, updated_at: new Date().toISOString() }, { onConflict: "user_id,key" });
    if (error) throw error;
    return { key, value };
  },
  async delete(key) {
    const { error } = await sb.from("journal_kv").delete().eq("user_id", userId).eq("key", key);
    if (error) throw error;
    return { key, deleted: true };
  },
  async list(prefix) {
    let q = sb.from("journal_kv").select("key").eq("user_id", userId);
    if (prefix) q = q.like("key", prefix + "%");
    const { data, error } = await q;
    if (error) throw error;
    return { keys: (data || []).map((r) => r.key) };
  },
});

const input = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 10px",
  minHeight: 44,
  fontSize: 14,
  fontFamily: "'Archivo', sans-serif",
  color: C.ink,
  background: "transparent",
  border: "1px solid " + C.hairline,
  borderRadius: 4,
  marginBottom: 10,
};
const btn = (primary) => ({
  minHeight: 44,
  padding: "0 16px",
  fontSize: 13,
  cursor: "pointer",
  background: primary ? C.ink : "transparent",
  color: primary ? C.card : C.mutedInk,
  border: "1px solid " + (primary ? C.ink : C.hairline),
  borderRadius: 4,
});

function Shell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: C.paper, color: C.ink, fontFamily: "'Archivo', sans-serif", padding: "48px 16px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');`}</style>
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: C.bronze, marginBottom: 6 }}>Personal trading</div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 18px 0" }}>Trade journal and compounder</h1>
        <div style={{ background: C.card, border: "1px solid " + C.hairline, borderRadius: 6, padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [tone, setTone] = useState(C.mutedInk);
  const [busy, setBusy] = useState(false);
  const say = (m, t) => { setMsg(m); setTone(t || C.mutedInk); };
  const signIn = async () => {
    setBusy(true);
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false);
    if (error) say(error.message, C.brick);
  };
  const signUp = async () => {
    if (pw.length < 8) return say("Password: eight characters at least.", C.brick);
    setBusy(true);
    const { data, error } = await sb.auth.signUp({ email: email.trim(), password: pw, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) return say(error.message, C.brick);
    if (data.session) return;
    say("Account created. Confirm it from the email just sent, then sign in.", C.green);
  };
  const reset = async () => {
    if (!email.trim()) return say("Enter the email first.", C.brick);
    setBusy(true);
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    setBusy(false);
    if (error) return say(error.message, C.brick);
    say("Reset link sent. Open it on this device to set a new password.", C.green);
  };
  return (
    <Shell>
      <div style={{ fontSize: 13, color: C.mutedInk, marginBottom: 14, lineHeight: 1.5 }}>
        Your journal is stored under your own account and nobody else can read it. Sign in, or create an account with the email you want attached to it.
      </div>
      <input style={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      <input style={input} type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" onKeyDown={(e) => e.key === "Enter" && signIn()} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button style={btn(true)} onClick={signIn} disabled={busy}>Sign in</button>
        <button style={btn(false)} onClick={signUp} disabled={busy}>Create account</button>
        <button style={{ ...btn(false), border: "none", padding: "0 6px" }} onClick={reset} disabled={busy}>Forgot password</button>
      </div>
      {msg && <div style={{ fontSize: 13, color: tone, marginTop: 12, lineHeight: 1.5 }}>{msg}</div>}
    </Shell>
  );
}

function NewPassword({ onDone }) {
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const save = async () => {
    if (pw.length < 8) return setMsg("Eight characters at least.");
    const { error } = await sb.auth.updateUser({ password: pw });
    if (error) return setMsg(error.message);
    onDone();
  };
  return (
    <Shell>
      <div style={{ fontSize: 13, color: C.mutedInk, marginBottom: 14 }}>Set a new password for this account.</div>
      <input style={input} type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} />
      <button style={btn(true)} onClick={save}>Save password</button>
      {msg && <div style={{ fontSize: 13, color: C.brick, marginTop: 12 }}>{msg}</div>}
    </Shell>
  );
}

function Root() {
  const [session, setSession] = useState(undefined);
  const [recovery, setRecovery] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = sb.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      setSession(s || null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (session && session.user) {
      window.storage = makeStorage(session.user.id);
      setReady(true);
    } else {
      setReady(false);
    }
  }, [session && session.user && session.user.id]);

  if (session === undefined) return <Shell><div style={{ fontSize: 13, color: C.mutedInk }}>Loading...</div></Shell>;
  if (!session) return <Login />;
  if (recovery) return <NewPassword onDone={() => setRecovery(false)} />;
  if (!ready) return null;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 10,
          padding: "6px 16px 0 16px",
          background: C.paper,
          fontFamily: MONO,
          fontSize: 11,
          color: C.mutedInk,
        }}
      >
        <span>{session.user.email}</span>
        <button
          onClick={() => sb.auth.signOut()}
          title="Sign out of this browser; the journal stays in your account"
          style={{ minHeight: 28, padding: "0 10px", fontSize: 11, cursor: "pointer", background: "transparent", color: C.mutedInk, border: "1px solid " + C.hairline, borderRadius: 4 }}
        >
          Sign out
        </button>
      </div>
      <App key={session.user.id} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
