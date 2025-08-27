const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

if (token) {
    localStorage.setItem("token", token);
    // Remove o token da URL para maior segurança e limpeza
    window.history.replaceState({}, document.title, window.location.pathname);
}