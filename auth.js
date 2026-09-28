/* EduManage frontend authentication. Demo-only: credentials are stored client-side. */
(function(){
  const DEMO_ACCOUNTS = [
    {name:'Admin User',email:'admin@school.com',password:'admin123',role:'Admin'},
    {name:'Teacher User',email:'teacher@school.com',password:'teacher123',role:'Teacher'},
    {name:'Parent User',email:'parent@school.com',password:'parent123',role:'Parent'}
  ];
  const STORE_KEY='edumanage_accounts_v2', SESSION_KEY='edumanage_session_v2', NAME_KEY='edumanage_auth_bridge_v2';
  const cleanEmail=e=>String(e||'').trim().toLowerCase();
  const safeParse=v=>{try{return JSON.parse(v)}catch{return null}};
  function bridge(){
    const x=safeParse(window.name||'');
    return x&&x.__edumanage===1?x:{};
  }
  function read(key,fallback){
    try{const v=localStorage.getItem(key);if(v)return JSON.parse(v)}catch{}
    try{const v=sessionStorage.getItem(key);if(v)return JSON.parse(v)}catch{}
    const b=bridge(); return b[key]??fallback;
  }
  function write(key,value){
    const str=JSON.stringify(value);
    try{localStorage.setItem(key,str)}catch{}
    try{sessionStorage.setItem(key,str)}catch{}
    try{const b=bridge();b.__edumanage=1;b[key]=value;window.name=JSON.stringify(b)}catch{}
  }
  function accounts(){
    let list=read(STORE_KEY,[]);
    if(!Array.isArray(list))list=[];
    const merged=[...DEMO_ACCOUNTS,...list];
    const seen=new Set();
    return merged.filter(a=>{const k=cleanEmail(a.email);if(!k||seen.has(k))return false;seen.add(k);return true});
  }
  function saveAccounts(list){write(STORE_KEY,list)}
  function currentUser(){return read(SESSION_KEY,null)}
  function setSession(user){write(SESSION_KEY,user)}
  function clearSession(){
    try{localStorage.removeItem(SESSION_KEY)}catch{}
    try{sessionStorage.removeItem(SESSION_KEY)}catch{}
    try{const b=bridge();delete b[SESSION_KEY];b.__edumanage=1;window.name=JSON.stringify(b)}catch{}
  }
  function login(email,password,role){
    const e=cleanEmail(email), p=String(password||''), r=String(role||'');
    const account=accounts().find(a=>cleanEmail(a.email)===e&&String(a.password)===p&&String(a.role)===r);
    if(!account)return false;
    setSession({name:account.name,email:cleanEmail(account.email),role:account.role,loggedInAt:new Date().toISOString()});
    return true;
  }
  function register(account){
    const name=String(account.name||'').trim(),email=cleanEmail(account.email),password=String(account.password||''),role=String(account.role||'Parent');
    if(name.length<2)throw Error('Enter a valid full name.');
    if(!/^\S+@\S+\.\S+$/.test(email))throw Error('Enter a valid email address.');
    if(password.length<6)throw Error('Password must contain at least 6 characters.');
    if(!['Admin','Teacher','Parent'].includes(role))throw Error('Select a valid role.');
    const list=accounts().filter(a=>!['admin@school.com','teacher@school.com','parent@school.com'].includes(cleanEmail(a.email)));
    if(list.some(a=>cleanEmail(a.email)===email))throw Error('An account with this email already exists.');
    list.push({name,email,password,role,createdAt:new Date().toISOString()});
    saveAccounts(list);
    try{const b=bridge();b.__edumanage=1;b.lastRegistered={email,role};window.name=JSON.stringify(b)}catch{}
    return {name,email,role};
  }
  function applyRoleAccess(){
    const u=currentUser(); if(!u)return;
    document.querySelectorAll('.user-name').forEach(x=>x.textContent=u.name||u.email);
    document.querySelectorAll('.user-role').forEach(x=>x.textContent=u.role||'User');
    const initial=String(u.name||u.email||'U').trim().split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase();
    document.querySelectorAll('.user-initials').forEach(x=>x.textContent=initial);
    const allowed={Admin:['dashboard','students','teachers','classes','attendance','grades','fees','timetable','reports','exams','communications','receipts','photos','notifications'],Teacher:['dashboard','students','attendance','grades','timetable','exams','communications','receipts','photos','notifications'],Parent:['dashboard','students','attendance','grades','fees','timetable','exams','communications','receipts','photos','notifications']}[u.role]||['dashboard'];
    document.querySelectorAll('.nav-item[data-page]').forEach(btn=>btn.hidden=!allowed.includes(btn.dataset.page));
    if(!allowed.includes(window.currentPage||'dashboard'))window.navigate('dashboard');
  }
  window.EduAuth={DEMO_ACCOUNTS,accounts,currentUser,login,register,setSession,clearSession,applyRoleAccess,read,write,cleanEmail,STORE_KEY,SESSION_KEY};
})();
