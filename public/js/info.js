// public/js/info.js
const INFO_BASE = '/api/info';

// ===== Helpers para abrir o modal já com a criança selecionada =====
function openInfoModal(idCrianca) {
  // setamos o id da criança que receberá a info
  document.getElementById('criancaIdInput').value = idCrianca || '';
  document.getElementById('tipoInfoSelect').value = 'alergias';
  document.getElementById('infoDescricaoInput').value = '';
  // se você usa infoId para edição, limpe aqui:
  document.getElementById('infoIdInput').value = '';
  // abre o modal
  const modal = document.getElementById('infoModal');
  modal.style.display = 'block';
}

// ===== Salvar (CREATE) =====
const salvarInfoBtn = document.getElementById('salvarInfoBtn');
salvarInfoBtn.addEventListener('click', salvarInfo);

async function salvarInfo() {
  const tipo_info = document.getElementById('tipoInfoSelect').value;     // 'alergias' | 'medicamento' | 'outros'
  const descricao = document.getElementById('infoDescricaoInput').value.trim();
  const id_crianca = document.getElementById('criancaIdInput').value     // <-- backend espera id_crianca
                      || window.currentCriancaId                          // fallback, se você guarda globalmente
                      || '';

  if (!tipo_info || !descricao || !id_crianca) {
    alert('Preencha tipo, descrição e selecione a criança.');
    return;
  }

  salvarInfoBtn.disabled = true;

  try {
    // use UMA baseURL para evitar confusão entre localhost e produção
    const baseURL = 'https://beekid.duckdns.org';
    const token = localStorage.getItem('token');

    const resp = await fetch(`${baseURL}/api/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ tipo_info, descricao, id_crianca })
    });

    const ct = resp.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await resp.json() : null;

    if (!resp.ok) {
      const msg = (data && (data.error || data.message)) || `HTTP ${resp.status}`;
      console.error('Salvar info falhou (create):', msg, data || '');
      alert('Erro ao salvar informação: ' + msg);
      return;
    }

    // sucesso
    alert('Informação salva com sucesso!');
    closeModal('infoModal');
    // se tiver uma função para recarregar a lista, chame:
    if (typeof carregarInfosDaCrianca === 'function') {
      await carregarInfosDaCrianca(id_crianca);
    }
  } catch (e) {
    console.error('Salvar info falhou (create):', e);
    alert('Erro de conexão com o servidor.');
  } finally {
    salvarInfoBtn.disabled = false;
  }
}



async function carregarInfos() {
  try {
    const resp = await fetch(`${INFO_BASE}/crianca/${idCrianca}`, { headers: { ...authHeaders() } });
    const lista = document.getElementById('listaInfos');
    if (!lista) return;
    lista.innerHTML = '';

    if (!resp.ok) {
      if (resp.status === 404) {
        lista.innerHTML = '<li class="no-data">Nenhuma informação cadastrada.</li>';
        return;
      }
      throw new Error('Falha ao carregar informações.');
    }

    const infos = await resp.json();
    if (!Array.isArray(infos) || infos.length === 0) {
      lista.innerHTML = '<li class="no-data">Nenhuma informação cadastrada.</li>';
      return;
    }

    infos.forEach(info => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="info-item">
          <strong>[${info.tipo_info}]</strong>
          <p>${info.descricao || ''}</p>
        </div>
        <div class="info-actions">
          <button onclick="openInfoModal(${info.idInfo_crianca})">Editar</button>
          <button onclick="deletarInfo(${info.idInfo_crianca})">Excluir</button>
        </div>
      `;
      lista.appendChild(li);
    });
  } catch (e) {
    console.error(e);
    showAlert('Não foi possível carregar as informações.');
  }
}

async function deletarInfo(idInfo) {
  if (!confirm('Deseja excluir esta informação?')) return;
  try {
    const resp = await fetch(`${INFO_BASE}/${encodeURIComponent(idInfo)}`, {
      method: 'DELETE',
      headers: { ...authHeaders() }
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      showAlert(data?.message || data?.error || 'Erro ao excluir informação.');
      return;
    }
    showAlert('Informação excluída.');
    carregarInfos();
  } catch (e) {
    console.error(e);
    showAlert('Erro ao conectar com o servidor.');
  }
}

// expor
window.openInfoModal = openInfoModal;
window.salvarInfo    = salvarInfo;
window.carregarInfos = carregarInfos;
window.deletarInfo   = deletarInfo;

// init
document.addEventListener('DOMContentLoaded', () => {
  const btnInfo = document.getElementById('salvarInfoBtn');
  if (btnInfo) btnInfo.addEventListener('click', salvarInfo);
  carregarInfos();
});
