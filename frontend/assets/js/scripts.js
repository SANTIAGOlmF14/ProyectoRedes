// ==== CONFIG ====
const API = 'http://localhost:3000/api';
const ORIGIN = API.replace(/\/api\/?$/, ''); // -> http://localhost:3000

function abs(u){
  if (!u) return u;
  return /^https?:\/\//i.test(u) ? u : ORIGIN + (u.startsWith('/') ? u : '/'+u);
}

// ==== AUTH HELPERS ====
function getToken() { return localStorage.getItem('token') || ''; }
function getRole()  { return localStorage.getItem('role')  || ''; }
function isLogged() { return !!getToken(); }
function isAdmin()  { return getRole() === 'admin'; }
function authHeaders(json=true){
  const h={};
  if (json) h['Content-Type']='application/json';
  const t=getToken(); if(t) h['Authorization']='Bearer '+t;
  return h;
}
function requireAuthPage(){ if(!isLogged()) location.href='login.html'; }
function requireAdminPage(){ if(!isLogged()) location.href='login.html'; if(!isAdmin()) location.href='index.html'; }

// ==== UI HELPERS ====
function stars(n){ const x=Math.round(Number(n)||0); return '★'.repeat(x).padEnd(5,'☆'); }
function bestCoverUrl(code, files){
  if (!files || !files.length) return 'img/placeholder_600x320.png';
  const cover = files.find(f => /portada/i.test(f)) || files[0];
  const url = (typeof cover === 'string' && cover.startsWith('/uploads/'))
    ? cover
    : `/uploads/${code}/${cover}`;
  return abs(url);
}


// ==== HEADER COMÚN + BOTÓN VOLVER ====
(async ()=>{
  const slot = document.createElement('div');
  document.body.prepend(slot);
  try{
    const res = await fetch('partials/header.html');
    slot.innerHTML = await res.text();
    const backBtn = document.getElementById('gc-back');
    if (backBtn) backBtn.onclick = () => (history.length>1 ? history.back() : location.href='index.html');

    const loginLink = document.getElementById('gc-login-link');
    const adminTab  = document.getElementById('gc-admin-tab');
    if (loginLink){
      if (isLogged()){
        loginLink.textContent='Cerrar sesión';
        loginLink.href='#';
        loginLink.onclick=(e)=>{ e.preventDefault(); localStorage.clear(); location.href='index.html'; };
      } else {
        loginLink.textContent='Acceder';
        loginLink.href='login.html';
      }
    }
    if (isAdmin() && adminTab) adminTab.classList.remove('d-none');
  }catch{}
})();

// Expose
window.API=API; window.authHeaders=authHeaders;
window.isLogged=isLogged; window.isAdmin=isAdmin;
window.requireAuthPage=requireAuthPage; window.requireAdminPage=requireAdminPage;
window.stars=stars; window.bestCoverUrl=bestCoverUrl; window.abs=abs;
