// public/js/cuidadores.js

function openEmailModal() {
  // usa o util se existir; senão, fallback direto
  if (typeof openModal === 'function') {
    openModal('emailModal');
  } else {
    const m = document.getElementById('emailModal');
    if (m) m.style.display = 'flex';
  }
}

async function associarCuidador() {
  const idCrianca = window.__ID_CRIANCA; // vem do EJS
  const email = (document.getElementById('emailCuidadorInput')?.value || '').trim();
  if (!email) {
    alert("Por favor, digite um e-mail.");
    return;
  }

  try {
    const resp = await fetch('/api/associar/cuidador', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
      },
      body: JSON.stringify({ emailCuidador: email, idCrianca })
    });

    const result = await resp.json().catch(() => ({}));
    if (resp.ok) {
      alert(result.message || 'Cuidador associado com sucesso!');
      const input = document.getElementById('emailCuidadorInput');
      if (input) input.value = '';
      if (typeof closeModal === 'function') closeModal('emailModal');
      if (typeof carregarCuidadores === 'function') carregarCuidadores();
    } else {
      alert("Erro: " + (result.message || result.error || 'Não foi possível associar.'));
    }
  } catch (error) {
    console.error(error);
    alert("Erro ao conectar com o servidor.");
  }
}

async function carregarCuidadores() {
  const idCrianca = window.__ID_CRIANCA;
  try {
    const resp = await fetch(`/api/criancas/${idCrianca}/cuidadores`, {
      headers: { ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}) }
    });

    const lista = document.getElementById('listaCuidadores');
    if (!lista) return;
    lista.innerHTML = '';

    if (!resp.ok) {
      if (resp.status === 404) {
        // se seu backend retornar 404 quando não houver cuidadores
        lista.innerHTML = '<li class="no-data">Nenhum cuidador associado.</li>';
        return;
      }
      throw new Error('Erro ao listar cuidadores.');
    }

    const cuidadores = await resp.json();
    if (!Array.isArray(cuidadores) || cuidadores.length === 0) {
      lista.innerHTML = '<li class="no-data">Nenhum cuidador associado.</li>';
      return;
    }

    cuidadores.forEach(c => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="cuidador-info">
          <strong>${c.nome || '(sem nome)'}</strong>
          <p>${c.email}</p>
        </div>
        <div class="cuidador-actions">
          <button onclick="desassociarCuidador(${c.idUser}, ${idCrianca})">Remover</button>
        </div>
      `;
      lista.appendChild(li);
    });
  } catch (e) {
    console.error(e);
    alert("Erro ao carregar cuidadores.");
  }
}

async function desassociarCuidador(idCuidador, idCrianca) {
  if (!confirm("Tem certeza que deseja remover este cuidador?")) return;

  try {
    const resp = await fetch(`/api/criancas/${idCrianca}/cuidadores/${idCuidador}`, {
      method: 'DELETE',
      headers: {
        ...(localStorage.getItem('token')
          ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
          : {})
      }
    });

    const result = await resp.json().catch(() => ({}));
    if (resp.ok) {
      alert(result.message || 'Cuidador removido com sucesso!');
      carregarCuidadores(); // recarrega a lista
    } else {
      alert("Erro: " + (result.message || result.error || 'Não foi possível remover.'));
    }
  } catch (e) {
    console.error(e);
    alert('Erro ao conectar com o servidor.');
  }
}

// expor no escopo global p/ funcionar com onclick no HTML
window.openEmailModal = openEmailModal;
window.associarCuidador = associarCuidador;
window.carregarCuidadores = carregarCuidadores;
window.desassociarCuidador = desassociarCuidador;

// carrega lista ao entrar na página
document.addEventListener('DOMContentLoaded', carregarCuidadores);
