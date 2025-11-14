// assets/js/scripts.js

// === BASE URL de microservicios ===
window.CATALOG_API   = 'http://localhost:3000/api';  // antes era API del backend
window.API           = window.CATALOG_API;           // compatibilidad con código viejo
window.USERS_API     = 'http://localhost:5000/api';  // identity-service
window.REVIEWS_API   = 'http://localhost:4000/api';  // reviews-service
window.FAVORITES_API = 'http://localhost:4500/api';  // favorites-service

// === Helpers de auth / token ===
window.getToken = function () {
  return localStorage.getItem('token') || '';
};

window.isLogged = function () {
  return !!getToken();
};

// includeJson = true → agrega Content-Type: application/json
window.authHeaders = function (includeJson = true) {
  const h = {};
  if (includeJson) h['Content-Type'] = 'application/json';
  const t = getToken();
  if (t) h['Authorization'] = 'Bearer ' + t;
  return h;
};

async function addToFavorites(code) {
  if (!isLogged()) {
    alert("Debes iniciar sesión para agregar a favoritos");
    location.href = "login.html";
    return;
  }

  const res = await fetch(`${FAVORITES_API}/favorites/${code}`, {
    method: "POST",
    headers: authHeaders(),
  });

  const data = await res.json();
  alert(data.message || "Error al añadir a favoritos");
}


// === Navbar: back, login/logout, tab Admin ===
(function setupHeader() {
  document.addEventListener('DOMContentLoaded', () => {
    const backBtn   = document.getElementById('gc-back');
    const loginLink = document.getElementById('gc-login-link');
    const adminTab  = document.getElementById('gc-admin-tab');

    if (backBtn) {
      backBtn.addEventListener('click', () => history.back());
    }

    const token = getToken();
    const role  = localStorage.getItem('role');

    if (loginLink) {
      if (token) {
        // Ya logueado → mostrar "Cerrar sesión"
        loginLink.textContent = 'Cerrar sesión';
        loginLink.href = '#';
        loginLink.addEventListener('click', (e) => {
          e.preventDefault();
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          location.href = 'index.html';
        });
      } else {
        // No logueado → "Acceder"
        loginLink.textContent = 'Acceder';
        loginLink.href = 'login.html';
      }
    }

    if (adminTab) {
      if (token && role === 'admin') adminTab.classList.remove('d-none');
      else adminTab.classList.add('d-none');
    }
  });
})();

// === Páginas solo admin ===
window.requireAdminPage = function () {
  const token = getToken();
  const role  = localStorage.getItem('role');
  if (!token || role !== 'admin') {
    alert('Solo administradores');
    location.href = 'index.html';
  }
};

// === Utilidades varias ===
window.abs = function (url) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // CATALOG_API: http://localhost:3000/api -> base http://localhost:3000
  return window.CATALOG_API.replace(/\/api$/, '') + url;
};

window.stars = function (avg) {
  const n = Math.round(Number(avg) || 0);
  return n ? '⭐'.repeat(n) : 'Sin reseñas';
};
