"use client";

import {FormEvent,useState} from "react";
import {createClient} from "@/lib/supabase/client";

export default function AdminLogin(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  async function signIn(event:FormEvent){
    event.preventDefault();
    setLoading(true);
    setError("");
    const supabase=createClient();
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error){
      setError(error.message);
      setLoading(false);
      return;
    }
    window.location.href="/admin";
  }

  return <main className="admin"><div className="shell adminPanel" style={{maxWidth:520,margin:"80px auto"}}>
    <p className="sectionKicker">SUPERSTORESA ADMIN</p>
    <h1>Sign in.</h1>
    <p className="adminLead">Use a Supabase Auth account that is included in the server-side admin allowlist.</p>
    <form onSubmit={signIn} style={{display:"grid",gap:14,marginTop:28}}>
      <label>Email<input className="catalogSearch" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
      <label>Password<input className="catalogSearch" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
      {error&&<p role="alert">{error}</p>}
      <button className="saveBtn" disabled={loading}>{loading?"Signing in…":"Sign in →"}</button>
    </form>
    <p style={{marginTop:24}}><a href="/">← Storefront</a></p>
  </div></main>;
}
