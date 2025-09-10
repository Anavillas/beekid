// public/js/info.js
const INFO_BASE = '/api/info';

async function openInfoModal(idInfo = null) {
  const modal = document.getElementById('infoModal');
  const title = document.getElementById('infoModalTitle');
  const btn   = document.getElementById('salvarInfoBtn');

  // limpa
  document.getElementById('infoIdInput').value = '';
  document.getElementById('tipoInfoSelect').value = 'alergias';
  document.getElementById('infoDescricaoInput').value = '';

  if (idInfo != null && idInfo !== '') {
    try {
      // 🔁 Em vez de GET /api/info/:id (que dá 404),
      // buscamos a lista da criança e filtramos pelo id:
      const listResp = await fetch(`${INFO_BASE}/crianca/${idCrianca}`, { headers: { ...authHeaders() } });
      if (!listResp.ok) throw new Error('Falha ao carregar informações da criança.');
      const infos = await listResp.json();
      const info = Array.isArray(infos)
        ? infos.find(i => String(i.idInfo_crianca) === String(idInfo))
        : null;

      if (!info) {
        showAlert('Essa informação não existe mais (talvez foi excluída).');
        return;
      }

      document.getElementById('infoIdInput').value = info.idInfo_crianca ?? '';
      document.getElementById('tipoInfoSelect').value = info.tipo_info || 'alergias';
      document.getElementById('infoDescricaoInput').value = info.descricao || '';

      title.textContent = 'Editar informação';
      btn.textContent   = 'Atualizar';
    } catch (e) {
      console.error(e);
      showAlert('Erro ao carregar informação.');
      return;
    }
  } else {
    title.textContent = 'Adicionar informação';
    btn.textContent   = 'Salvar';
  }

  modal.style.display = 'flex';
}

let savingInfo = false;
async function salvarInfo() {
  if (savingInfo) return;
  savingInfo = true;
  const btn = document.getElementById('salvarInfoBtn');
  if (btn) btn.disabled = true;

  try {
    const idInfo     = document.getElementById('infoIdInput').value;
    const tipo_info  = document.getElementById('tipoInfoSelect').value; // 'alergias' | 'medicamento' | 'outros'
    const descricao  = document.getElementById('infoDescricaoInput').value.trim();

    if (!descricao) {
      showAlert('Descrição é obrigatória.');
      return;
    }

    const payloadBase = { tipo_info, descricao, id_crianca: idCrianca };

    let resp, data;

    if (idInfo) {
      // 1) Tenta PUT /api/info/:id
      const urlPut = `${INFO_BASE}/${encodeURIComponent(idInfo)}`;
      resp = await fetch(urlPut, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payloadBase),
      });

      // 2) Se o backend não tiver a rota (404), tenta POST /api/info (fallback "update")
      if (resp.status === 404) {
        const urlPost = INFO_BASE; // /api/info
        const payloadUpdate = { ...payloadBase, idInfo_crianca: idInfo }; // o backend pode usar este id para atualizar
        resp = await fetch(urlPost, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify(payloadUpdate),
        });
      }

      data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        console.error('Salvar info falhou (update):', resp.status, data);
        showAlert(data?.message || data?.error || 'Erro ao salvar informação.');
        return;
      }

      showAlert('Informação atualizada!');
    } else {
      // Criar
      const urlPost = INFO_BASE; // /api/info
      resp = await fetch(urlPost, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payloadBase),
      });

      data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        console.error('Salvar info falhou (create):', resp.status, data);
        showAlert(data?.message || data?.error || 'Erro ao salvar informação.');
        return;
      }

      showAlert('Informação adicionada!');
    }

    closeModal('infoModal');
    carregarInfos();
  } catch (e) {
    console.error(e);
    showAlert('Erro ao conectar com o servidor.');
  } finally {
    savingInfo = false;
    if (btn) btn.disabled = false;
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
