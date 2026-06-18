// ════ API SUPABASE — dbGet, dbInsert, dbUpdate, dbDelete ════
async function dbGet(table, params=''){
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${params}&order=created_at.asc`, {headers:{...H,'Accept':'application/json'}});
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}
async function dbInsert(table, body){
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, {method:'POST', headers:H, body:JSON.stringify(body)});
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}
async function dbUpdate(table, id, body){
  const r = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, {method:'PATCH', headers:H, body:JSON.stringify(body)});
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}
async function dbDelete(table, id){
  const r = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, {method:'DELETE', headers:H});
  if(!r.ok) throw new Error(await r.text());
  return true;
}
