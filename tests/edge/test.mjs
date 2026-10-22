globalThis.Deno = { env: { get: k => ({PANDI_SETUP_TOKEN:'secreto'})[k] } };
const { handle } = await import('./index.mjs');
const T = { schools:[], profiles:[], groups:[{school_id:null,id:'g1'}], progress:[] }; const authUsers = []; const tokens = {}; const revoked = [];
let n=0; const uid = () => 'u'+(++n);
function q(table){ let rows = null, filters=[], op='select', payload=null;
  const api = {
    select(){ return api; }, eq(c,v){ filters.push([c,v]); return api; },
    insert(p){ op='insert'; payload=p; return api; }, delete(){ op='delete'; return api; },
    async maybeSingle(){ return run(true); }, async single(){ return run(true); },
    then(res){ return Promise.resolve(run(false)).then(res); } };
  function run(one){
    if (op==='insert'){ const r = {...payload}; if (table==='schools') r.id = 'sch'+(++n); T[table].push(r); return {data:r, error:null}; }
    const match = r => filters.every(([c,v]) => r[c]===v);
    if (op==='delete'){ T[table] = T[table].filter(r => !match(r)); return {data:null,error:null}; }
    const out = T[table].filter(match); return {data: one ? (out[0]||null) : out, error:null};
  }
  return api; }
const admin = { from:q, async rpc(name, args){ if (name==='revoke_user_sessions') revoked.push(args.uid); return {error:null}; }, auth:{ admin:{
  async createUser({email,password}){ if (authUsers.some(u=>u.email===email)) return {data:null, error:{message:'User already registered'}}; const u={id:uid(),email,password}; authUsers.push(u); return {data:{user:u}, error:null}; },
  async deleteUser(id){ const i=authUsers.findIndex(u=>u.id===id); authUsers.splice(i,1); T.profiles=T.profiles.filter(p=>p.id!==id); return {error:null}; },
  async updateUserById(id,{password}){ authUsers.find(u=>u.id===id).password=password; return {error:null}; } },
  async getUser(jwt){ const id = tokens[jwt]; return id ? {data:{user:{id}}, error:null} : {data:null, error:{message:'bad'}}; } } };
const call = async (body, jwt) => { const r = await handle(new Request('http://x/', {method:'POST', headers: jwt ? {Authorization:'Bearer '+jwt} : {}, body:JSON.stringify(body)}), admin); return [r.status, await r.json()]; };
const out = [];
out.push(['school bad token', ...(await call({action:'create_school', setup_token:'x'}))]);
const [s1, sc] = await call({action:'create_school', setup_token:'secreto', school_name:'Smart Kids', name:'Profe', username:'profe.sk', password:'clave123'}); out.push(['school ok', s1, sc]);
T.groups[0].school_id = sc.school_id; tokens.A = sc.user_id;
out.push(['student no auth', ...(await call({action:'create_student', name:'Ana', username:'ana', password:'ana123'}))]);
const [s2, st] = await call({action:'create_student', name:'Ana', username:'Ana', password:'ana123', group_id:'g1'}, 'A'); out.push(['student ok', s2, st, T.progress.length]);
out.push(['dup user', ...(await call({action:'create_student', name:'Ana 2', username:'ana', password:'ana123'}, 'A'))]);
out.push(['short pw', ...(await call({action:'create_student', name:'Leo', username:'leo', password:'123'}, 'A'))]);
out.push(['bad group', ...(await call({action:'create_student', name:'Leo', username:'leo', password:'leo123', group_id:'zz'}, 'A'))]);
tokens.S = st.id;
out.push(['student acting as admin', ...(await call({action:'reset_password', user_id:st.id, password:'xxxxxx'}, 'S'))]);
out.push(['reset ok', ...(await call({action:'reset_password', user_id:st.id, password:'nueva1'}, 'A')), authUsers.find(u=>u.id===st.id).password, 'sesiones cerradas:'+revoked.includes(st.id)]);
out.push(['delete ok', ...(await call({action:'delete_student', user_id:st.id}, 'A')), T.profiles.length]);
out.push(['list no token', ...(await call({action:'list_schools', setup_token:'x'}))]);
out.push(['list ok', ...(await call({action:'list_schools', setup_token:'secreto'}))]);
out.push(['owner reset bad user', ...(await call({action:'owner_reset_admin_password', setup_token:'secreto', username:'nadie', password:'abcdef'}))]);
out.push(['owner reset short', ...(await call({action:'owner_reset_admin_password', setup_token:'secreto', username:'profe.sk', password:'123'}))]);
out.push(['owner reset ok', ...(await call({action:'owner_reset_admin_password', setup_token:'secreto', username:'profe.sk', password:'nueva99'})), authUsers.find(u=>u.email.startsWith('profe.sk')).password, 'sesiones cerradas:'+revoked.includes(sc.user_id)]);
out.push(['unknown', ...(await call({action:'zzz'}, 'A'))]);
console.log(out.map(x=>JSON.stringify(x)).join('\n'));
