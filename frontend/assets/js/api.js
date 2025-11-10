const API = '/api';

// Auth helpers
function getToken() { return localStorage.getItem('token') || ''; }
function getRole()  { return localStorage.getItem('role')  || ''; }
function isLogged() { return !!getToken(); }
function isAdmin()  { return getRole() === 'admin'; }

function authHeaders(json = true) {
  const h = {};
  if (json) h['Content-Type'] = 'application/json';
  const t = getToken();
  if (t) h['Authorization'] = 'Bearer ' + t;
  return h;
}

window.API = API;
window.getToken = getToken;
window.getRole  = getRole;
window.isLogged = isLogged;
window.isAdmin  = isAdmin;
window.authHeaders = authHeaders;
