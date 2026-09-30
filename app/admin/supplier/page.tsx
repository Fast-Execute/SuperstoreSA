"use client";

import {useState} from "react";

export default function SupplierAdmin(){
  const [result,setResult]=useState<any>(null);
  const [loading,setLoading]=useState(false);

  async function check(){
    setLoading(true);
    const response=await fetch("/api/supplier/alibaba/status");
    setResult(await response.json());
    setLoading(false);
  }

  return <main className="admin"><div className="shell adminPanel">
    <p className="sectionKicker">SUPPLIER PIPELINE</p>
    <h1>Supplier connection.</h1>
    <p className="adminLead">Check whether the server has the required authorized supplier configuration before mapping live API calls.</p>
    <button className="saveBtn" onClick={check} disabled={loading}>{loading?"Checking…":"Check connection →"}</button>
    {result&&<pre className="importPreview">{JSON.stringify(result,null,2)}</pre>}
    <p><a href="/admin">← Admin</a></p>
  </div></main>;
}