
// ==== CONFIG ====
// Actualizamos los valores de las URLs de tus microservicios.
const API = 'http://localhost:3000/api';  // Catálogo
const ORIGIN = API.replace(/\/api\/?$/, ''); // -> http://localhost:3000
const FAVORITES_API = 'http://localhost:5000/api'; // Favoritos

// Aquí asignamos los puertos de los microservicios correctamente
window.API = 'http://localhost:3001/api/catalog'; // Catálogo
window.REVIEWS_API = 'http://localhost:4000/api';  // Reseñas
window.USERS_API = 'http://localhost:5001/api';   // **Nuevo puerto para Usuarios (5001)**

function abs(u){
  if (!u) return u;
  return /^https?:\/\//i.test(u) ? u : ORIGIN + (u.startsWith('/') ? u : '/' + u);
}

// ==== AUTH HELPERS ====
// Funciones para manejar el estado de autenticación del usuario
function getToken() { return localStorage.getItem('token') || ''; }
function getRole()  { return localStorage.getItem('role')  || ''; }
function isLogged() { return !!getToken(); }
function isAdmin()  { return getRole() === 'admin'; }

// Genera los headers para las solicitudes (incluyendo el token si el usuario está logueado)
function authHeaders(json = true) {
  const h = {};
  if (json) h['Content-Type'] = 'application/json';
  const t = getToken();
  if (t) h['Authorization'] = 'Bearer ' + t;
  return h;
}

// Funciones que redirigen al usuario si no está logueado o no es admin
function requireAuthPage() { if (!isLogged()) location.href = 'login.html'; }
function requireAdminPage() { 
  if (!isLogged()) location.href = 'login.html'; 
  if (!isAdmin()) location.href = 'index.html'; 
}

// ==== UI HELPERS ====
// Función para mostrar las estrellas en las calificaciones
function stars(n) {
  const x = Math.round(Number(n) || 0); 
  return '★'.repeat(x).padEnd(5, '☆');
}

// Función para obtener la portada del juego (si existe)
function bestCoverUrl(code, files) {
  if (!files || !files.length) return 'img/placeholder_600x320.png';
  const cover = files.find(f => /portada/i.test(f)) || files[0];
  const url = (typeof cover === 'string' && cover.startsWith('/uploads/'))
    ? cover
    : `/uploads/${code}/${cover}`;
  return abs(url);
}

// ==== HEADER COMÚN + BOTÓN VOLVER ====
// Cargar el encabezado común y manejar los eventos de la UI
(async () => {
  const slot = document.createElement('div');
  document.body.prepend(slot);
  try {
    const res = await fetch('partials/header.html');
    slot.innerHTML = await res.text();
    const backBtn = document.getElementById('gc-back');
    if (backBtn) backBtn.onclick = () => (history.length > 1 ? history.back() : location.href = 'index.html');

    const loginLink = document.getElementById('gc-login-link');
    const adminTab = document.getElementById('gc-admin-tab');
    if (loginLink) {
      if (isLogged()) {
        loginLink.textContent = 'Cerrar sesión';
        loginLink.href = '#';
        loginLink.onclick = (e) => { e.preventDefault(); localStorage.clear(); location.href = 'index.html'; };
      } else {
        loginLink.textContent = 'Acceder';
        loginLink.href = 'login.html';
      }
    }
    if (isAdmin() && adminTab) adminTab.classList.remove('d-none');
  } catch { }
})();

// Exponer funciones para el uso en otras partes de la app
window.API = API;
window.authHeaders = authHeaders;
window.isLogged = isLogged;
window.isAdmin = isAdmin;
window.requireAuthPage = requireAuthPage;
window.requireAdminPage = requireAdminPage;
window.stars = stars;
window.bestCoverUrl = bestCoverUrl;
window.abs = abs;
