// public/js/info.js

// ================== CONFIG ==================
const INFO_BASE = '/api/info';
// Funções utilitárias esperadas no projeto:
// - authHeaders(): retorna { Authorization: 'Bearer ...' } quando existir
// - showAlert(msg): exibe alert/toast
// - closeModal(id): fecha modal
// - idCrianca: variável global com o ID da criança atual

// Valores aceitos pelo ENUM no banco:
const ENUM_TIPOS = ['alergias', 'medicamento', 'outros'];

// (Opcional) Normalizador simples no front — mantém só valores válidos
function normalizeTipoFront(v) {
  if (!v) return null;
  const s = String(v).trim().toLowerCase();
  // mapeia alguns aliases comuns do front para o enum exato
  const map = {
    alergia: 'alergias',
    alergias: 'alergias',
    saude: 'medicamento',
    remedio: 'medicamento',
    medicamento: 'medicamento',
    outros: 'outros'
  };
  const normalized = map[s] || null;
  return ENUM_TIPOS.includes(normalized) ? normalized : null;
}

// ================== MODAL ==================
async function openInfoModal(idInfo = null) {
  const modal = document.getElementById('infoModal');
  const title = document.getElementById('infoModalTitle');
  const btn   = document.getElementById('salvarInfoBtn');

  // limpa campos
  document.getElementById('infoIdInput').value = '';
  document.getElementById('tipoInfoSelect').value = 'alergias'; // default válido
  document.getElementById('infoDescricaoInput').value = '';

  if (idInfo != null && idInfo !== '') {
    try {
      // Busca todas as infos da criança e filtra pelo id (já que GET /:id pode não existir)
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

      // Garante que o tipo lido do backend é um dos três válidos
      const tipoOk = normalizeTipoFront(info.tipo_info) || 'outros';

      document.getElementById('infoIdInput').value = info.idInfo_crianca ?? '';
      document.getElementById('tipoInfoSelect').value = tipoOk;
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

// ================== CRIAR / ATUALIZAR ==================
let savingInfo = false;
async function salvarInfo() {
  if (savingInfo) return;
  savingInfo = true;
  const btn = document.getElementById('salvarInfoBtn');
  if (btn) btn.disabled = true;

  try {
    const idInfo     = document.getElementById('infoIdInput').value;
    const tipoRaw    = document.getElementById('tipoInfoSelect').value;
    const tipo_info  = normalizeTipoFront(tipoRaw); // garante ENUM válido
    const descricao  = document.getElementById('infoDescricaoInput').value.trim();

    if (!tipo_info) {
      showAlert('Selecione um tipo válido.');
      return;
    }
    if (!descricao) {
      showAlert('Descrição é obrigatória.');
      return;
    }
    if (!idCrianca) {
      showAlert('Nenhuma criança selecionada.');
      return;
    }

    const payloadBase = { tipo_info, descricao, id_crianca: idCrianca };

    let resp, data;

    if (idInfo) {
      // PUT /api/info/:idInfo_crianca (conforme seu controller)
      const urlPut = `${INFO_BASE}/${encodeURIComponent(idInfo)}`;
      resp = await fetch(urlPut, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payloadBase),
      });

      // Lê resposta (JSON se houver)
      const ct = resp.headers.get('content-type') || '';
      data = ct.includes('application/json') ? await resp.json().catch(() => ({})) : {};

      if (!resp.ok) {
        console.error('Salvar info falhou (update):', resp.status, data);
        showAlert(data?.message || data?.error || 'Erro ao salvar informação.');
        return;
      }

      showAlert('Informação atualizada!');
    } else {
      // POST /api/info
      resp = await fetch(INFO_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payloadBase),
      });

      const ct = resp.headers.get('content-type') || '';
      data = ct.includes('application/json') ? await resp.json().catch(() => ({})) : {};

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

// ================== LISTAR ==================
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
      const tipoOk = normalizeTipoFront(info.tipo_info) || info.tipo_info || 'outros';
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="info-item">
          <strong>[${tipoOk}]</strong>
          <p>${info.descricao ? String(info.descricao).replace(/</g, "&lt;").replace(/>/g, "&gt;") : ''}</p>
        </div>
        <div class="info-actions">
          <button type="button" onclick="openInfoModal(${info.idInfo_crianca})">Editar</button>
          <button type="button" onclick="deletarInfo(${info.idInfo_crianca})">Excluir</button>
        </div>
      `;
      lista.appendChild(li);
    });
  } catch (e) {
    console.error(e);
    showAlert('Não foi possível carregar as informações.');
  }
}

// ================== DELETAR ==================
async function deletarInfo(idInfo) {
  if (!confirm('Deseja excluir esta informação?')) return;
  try {
    const resp = await fetch(`${INFO_BASE}/${encodeURIComponent(idInfo)}`, {
      method: 'DELETE',
      headers: { ...authHeaders() }
    });

    const ct = resp.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await resp.json().catch(() => ({})) : {};

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

// ================== EXPOSE / INIT ==================
window.openInfoModal = openInfoModal;
window.salvarInfo    = salvarInfo;
window.carregarInfos = carregarInfos;
window.deletarInfo   = deletarInfo;

document.addEventListener('DOMContentLoaded', () => {
  const btnInfo = document.getElementById('salvarInfoBtn');
  if (btnInfo) btnInfo.addEventListener('click', salvarInfo);
  carregarInfos();
});
