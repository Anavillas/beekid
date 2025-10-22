// public/js/auth.js
(function () {
  if (window.__AUTH_INIT__) return; // evita rodar 2x
  window.__AUTH_INIT__ = true;

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  if (token) {
    localStorage.setItem("token", token);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
})();

window.getToken = function getToken() {
  return localStorage.getItem('token');
};

window.authHeaders = function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};
