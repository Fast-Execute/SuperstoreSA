"use client";

import {useState} from "react";

export default function SupplierAdmin(){
  const [result,setResult]=useState<any>(null);
  const [loading,setLoading]=useState(false);

  async function check(){
    setLoading(true);
    try{
      const response=await fetch("/api/supplier/alibaba/status");
      setResult(await response.json());
    }catch{
      setResult({status:"unreachable"});
    }finally{
      setLoading(false);
    }
  }

  return <main className="admin"><div className="shell adminPanel">
    <p className="sectionKicker">SUPPLIER PIPELINE</p>
    <h1>Alibaba connection.</h1>
    <p className="adminLead">SuperstoreSA uses Alibaba.com Open Platform APIs through an authorized server-side adapter. Public listing scraping is not part of the architecture.</p>

    <div className="catalogActions" style={{marginTop:24}}>
      <span>Integration state</span>
      <strong>Endpoint mapping required</strong>
    </div>

    <p style={{marginTop:20}}>
      Alibaba requires developer registration, application approval, API permissions and supplier authorization before protected business data can be requested.
    </p>

    <button className="saveBtn" onClick={check} disabled={loading}>{loading?"Checking…":"Check server configuration →"}</button>

    {result&&<pre className="importPreview">{JSON.stringify(result,null,2)}</pre>}

    <div style={{marginTop:28}}>
      <p><a href="https://openapi.alibaba.com/doc/doc.htm" target="_blank" rel="noreferrer">Alibaba Open Platform documentation ↗</a></p>
      <p><a href="/admin/import">Open import preview →</a></p>
      <p><a href="/admin">← Admin</a></p>
    </div>
  </div></main>;
}