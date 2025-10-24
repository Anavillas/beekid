// public/js/info.js

// ================== CONFIG ==================
const INFO_BASE = '/api/info';
// Utilitários esperados no projeto:
// - authHeaders()
// - showAlert(msg)
// - closeModal(id)
// - idCrianca (global)

// ENUM exato do banco:
const ENUM_TIPOS = ['ALERGIA', 'SAUDE', 'ESCOLA', 'OUTROS'];

// Remove acentos e normaliza
function normStr(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().toLowerCase();
}

// Converte qualquer entrada do front/BD para um dos 4 valores do banco
function normalizeTipoFront(v) {
  const s = normStr(v);
  const map = {
    alergia: 'ALERGIA',
    alergias: 'ALERGIA',
    saude: 'SAUDE',
    saude_: 'SAUDE',
    saude1: 'SAUDE',
    remedio: 'SAUDE',
    remedios: 'SAUDE',
    medicamento: 'SAUDE',
    escola: 'ESCOLA',
    school: 'ESCOLA',
    outros: 'OUTROS',
    outro: 'OUTROS'
  };
  // tenta direto ENUM
  const maybeEnum = s.toUpperCase();
  if (ENUM_TIPOS.includes(maybeEnum)) return maybeEnum;
  // mapeia alias
  return map[s] || null;
}

function enumToLabel(v) {
  switch (normalizeTipoFront(v)) {
    case 'ALERGIA': return 'Alergia';
    case 'SAUDE':   return 'Saúde';
    case 'ESCOLA':  return 'Escola';
    case 'OUTROS':  return 'Outros';
    default:        return v || '';
  }
}

// ================== MODAL ==================
async function openInfoModal(idInfo = null) {
  const modal = document.getElementById('infoModal');
  const title = document.getElementById('infoModalTitle');
  const btn   = document.getElementById('salvarInfoBtn');

  // limpa campos
  document.getElementById('infoIdInput').value = '';

  // Se o seu HTML do <select> ainda usa values minúsculos (ex.: "alergias"),
  // deixamos como está; ao salvar, convertemos para o ENUM do banco.
  // Para um default seguro, tenta selecionar a primeira opção disponível.
  const tipoSel = document.getElementById('tipoInfoSelect');
  if (tipoSel && tipoSel.options.length) tipoSel.selectedIndex = 0;

  document.getElementById('infoDescricaoInput').value = '';

  if (idInfo != null && idInfo !== '') {
    try {
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
      document.getElementById('infoDescricaoInput').value = info.descricao || '';

      // Tentar posicionar o <select> no valor equivalente, mesmo se HTML usar minúsculas
      const atualEnum = normalizeTipoFront(info.tipo_info); // -> ALERGIA|SAUDE|ESCOLA|OUTROS
      if (tipoSel && atualEnum) {
        // Procura uma option cujo value normalizado aponte para o mesmo ENUM
        for (let i = 0; i < tipoSel.options.length; i++) {
          const candidate = normalizeTipoFront(tipoSel.options[i].value);
          if (candidate === atualEnum) {
            tipoSel.selectedIndex = i;
            break;
          }
        }
      }

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
    const idInfo    = document.getElementById('infoIdInput').value;
    const tipoRaw   = document.getElementById('tipoInfoSelect').value; // pode ser minúsculo no HTML
    const tipoEnum  = normalizeTipoFront(tipoRaw); // -> ALERGIA|SAUDE|ESCOLA|OUTROS
    const descricao = document.getElementById('infoDescricaoInput').value.trim();

    if (!tipoEnum) {
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

    // IMPORTANTE: o backend atual reescreve o tipo para valores inválidos.
    // Assim, para funcionar você PRECISA aplicar o patch no controller (abaixo).
    const payloadBase = { tipo_info: tipoEnum, descricao, id_crianca: idCrianca };

    let resp, data;

    if (idInfo) {
      const urlPut = `${INFO_BASE}/${encodeURIComponent(idInfo)}`;
      resp = await fetch(urlPut, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payloadBase),
      });
    } else {
      resp = await fetch(INFO_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payloadBase),
      });
    }

    const ct = resp.headers.get('content-type') || '';
    data = ct.includes('application/json') ? await resp.json().catch(() => ({})) : {};

    if (!resp.ok) {
      console.error('Salvar info falhou:', resp.status, data);
      showAlert(data?.message || data?.error || 'Erro ao salvar informação.');
      return;
    }

    showAlert(idInfo ? 'Informação atualizada!' : 'Informação adicionada!');
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
      const tipoEnum = normalizeTipoFront(info.tipo_info) || 'OUTROS';
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="info-item">
          <strong>[${enumToLabel(tipoEnum)}]</strong>
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
