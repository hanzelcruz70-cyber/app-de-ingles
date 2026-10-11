// Browser-side fake supabase-js that forwards every call to the Node test server
(function(){
  const call = (m) => window.mockCall(JSON.stringify(m)).then(JSON.parse);
  let session = null;
  try { session = JSON.parse(sessionStorage.getItem('mock-session')); } catch (e) {}
  function builder(table){
    const st = {table, op:'select', filters:[], single:false, maybe:false, payload:null};
    const b = {
      select(){ return b; }, order(){ return b; },
      eq(c, v){ st.filters.push([c, v]); return b; },
      insert(p){ st.op = 'insert'; st.payload = p; return b; },
      upsert(p){ st.op = 'upsert'; st.payload = p; return b; },
      update(p){ st.op = 'update'; st.payload = p; return b; },
      delete(){ st.op = 'delete'; return b; },
      single(){ st.single = true; return b; }, maybeSingle(){ st.maybe = true; return b; },
      then(res, rej){ return call({kind:'q', uid: session && session.user.id, ...st}).then(res, rej); }
    };
    return b;
  }
  window.supabase = { createClient(){ return {
    from: builder,
    rpc(name){ return call({kind:'rpc', name, uid: session && session.user.id}); },
    auth: {
      async getSession(){ return {data:{session}}; },
      async signInWithPassword({email, password}){ const r = await call({kind:'login', email, password}); if (r.error) return {data:null, error:r.error}; session = {user:{id:r.id}}; sessionStorage.setItem('mock-session', JSON.stringify(session)); return {data:{user:{id:r.id}, session}, error:null}; },
      async signOut(){ session = null; sessionStorage.removeItem('mock-session'); return {error:null}; }
    },
    functions: { async invoke(name, {body}){ const r = await call({kind:'fn', name, body, uid: session && session.user.id}); return r.status >= 400 ? {data:null, error:{message:'Edge error', context:{json: async () => r.body}}} : {data:r.body, error:null}; } }
  }; } };
  window.PANDI_CONFIG = {supabaseUrl:'https://mock.supabase.co', supabaseAnonKey:'anon'};
})();
