// public/js/utils.js
// Precisa ser definido no EJS antes dos scripts: window.__ID_CRIANCA = "<%= crianca.idCrianca %>";
window.idCrianca = window.__ID_CRIANCA;

// ---- Alert wrapper usando showMessage ----
window.showAlert = function showAlert(message, type = 'info') {
  if (typeof window.showMessage === 'function') {
    // usa o modal bonito
    window.showMessage(
      type === 'error' ? 'Erro' : 'Aviso',
      message,
      type
    );
  } else {
    // fallback: console e alert nativo
    console.warn('showMessage não disponível, usando alert().');
    alert(message);
  }
};

// ---- Controle de modais ----
window.openModal = function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.style.display = 'flex';
};
window.closeModal = function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.style.display = 'none';
};

// ---- Logger global (debug) ----
window.onerror = (msg, src, line, col, err) => {
  console.error('Erro global:', msg, 'em', src, `${line}:${col}`, err);
};
