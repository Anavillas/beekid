// public/js/agenda.js

// ================== HELPERS ==================
function normalizeStatus(v) {
  if (!v) return null;
  const s = String(v)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().toUpperCase();
  if (s === 'PENDENTE' || s === 'CONCLUIDO') return s;

  // aliases comuns -> CONCLUIDO
  if (['CONCLUIDA','CONCLUIDOS','CONCLUIDAS','CONCLUIDO','FEITO','FEITA','DONE','FINALIZADO','FINALIZADA'].includes(s)) {
    return 'CONCLUIDO';
  }
  // aliases comuns -> PENDENTE
  if (['PEND','TODO','ABERTO','ABERTA','EM_ABERTO','EMABERTO','AGUARDANDO'].includes(s)) {
    return 'PENDENTE';
  }
  return null;
}

function labelFromEnum(s) {
  return s === 'CONCLUIDO' ? 'Concluída' : 'Pendente';
}

function statusClassFromEnum(s) {
  return s === 'CONCLUIDO' ? 'concluida' : 'pendente';
}

// Espera-se que existam no projeto:
// - authHeaders(): retorna { Authorization: 'Bearer ...' } quando existir
// - showAlert(msg): exibe toast/alert
// - closeModal(id): fecha modal
// - idCrianca (global)

// ================== ABRIR MODAL ==================
async function openAtividadeModal(atividadeId = null) {
  const modal  = document.getElementById('atividadeModal');
  const h2     = document.getElementById('modalAtividadeTitle');
  const saveBtn= document.getElementById('salvarAtividadeBtn');

  // limpa campos
  document.getElementById('atividadeIdInput').value = '';
  document.getElementById('horarioInput').value     = '';
  document.getElementById('tituloInput').value      = '';
  document.getElementById('descricaoInput').value   = '';

  // default seguro no select (mesmo que HTML use minúsculo)
  const statusSel = document.getElementById('statusInput');
  if (statusSel) statusSel.value = 'PENDENTE';

  if (atividadeId) {
    try {
      const response = await fetch(`/api/agenda/${atividadeId}`, { headers: { ...authHeaders() } });
      if (!response.ok) throw new Error('Atividade não encontrada.');
      const tarefa = await response.json();

      document.getElementById('atividadeIdInput').value = tarefa.idAgenda;
      document.getElementById('horarioInput').value     = tarefa.horario ?? tarefa.horio ?? '';
      document.getElementById('tituloInput').value      = tarefa.titulo ?? '';
      document.getElementById('descricaoInput').value   = tarefa.descricao ?? '';

      const st = normalizeStatus(tarefa.status_tarefa) || 'PENDENTE';
      if (statusSel) statusSel.value = st;

      h2.textContent   = 'Editar Atividade';
      saveBtn.textContent = 'Atualizar';
    } catch (err) {
      console.error(err);
      showAlert('Erro ao carregar dados da atividade.');
      return;
    }
  } else {
    h2.textContent       = 'Adicionar Atividade';
    saveBtn.textContent  = 'Salvar';
  }

  modal.style.display = 'flex';
}

// ================== SALVAR (CREATE/UPDATE) ==================
async function salvarAtividade() {
  try {
    const atividadeId = document.getElementById('atividadeIdInput').value;
    const horario     = document.getElementById('horarioInput').value.trim();
    const titulo      = document.getElementById('tituloInput').value.trim();
    const descricao   = document.getElementById('descricaoInput').value.trim();

    const rawStatus   = document.getElementById('statusInput').value;
    const status_tarefa = normalizeStatus(rawStatus) || 'PENDENTE'; // default seguro

    if (!horario || !titulo || !descricao) {
      showAlert("Preencha todos os campos obrigatórios!");
      return;
    }
    if (!idCrianca) {
      showAlert("Nenhuma criança selecionada.");
      return;
    }

    const data   = { horario, titulo, descricao, status_tarefa, id_crianca: idCrianca };
    const method = atividadeId ? 'PUT' : 'POST';
    const url    = atividadeId ? `/api/agenda/${encodeURIComponent(atividadeId)}` : '/api/agenda';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data)
    });

    const result = await (async () => {
      const ct = response.headers.get('content-type') || '';
      return ct.includes('application/json') ? await response.json().catch(() => ({})) : {};
    })();

    if (!response.ok) {
      console.error('Salvar falhou:', response.status, result);
      showAlert(result?.message || result?.error || 'Erro ao salvar a atividade.');
      return;
    }

    showAlert(atividadeId ? 'Atividade atualizada com sucesso!' : 'Atividade adicionada com sucesso!');
    closeModal('atividadeModal');
    carregarAtividadesDoDia();
  } catch (err) {
    console.error('Erro em salvarAtividade:', err);
    showAlert('Erro ao conectar com o servidor.');
  }
}

// ================== LISTAR DO DIA ==================
async function carregarAtividadesDoDia() {
  try {
    const response = await fetch(`/api/agenda/crianca/${idCrianca}`, { headers: { ...authHeaders() } });
    const lista = document.getElementById('listaAtividades');
    if (!lista) return;
    lista.innerHTML = '';

    if (!response.ok) {
      if (response.status === 404) {
        lista.innerHTML = '<li class="no-data">Nenhuma atividade agendada.</li>';
        return;
      }
      throw new Error('Erro ao carregar atividades.');
    }

    const atividades = await response.json();
    if (!Array.isArray(atividades) || atividades.length === 0) {
      lista.innerHTML = '<li class="no-data">Nenhuma atividade agendada.</li>';
      return;
    }

    atividades.forEach((tarefa) => {
      const stEnum = normalizeStatus(tarefa.status_tarefa) || 'PENDENTE';
      const statusClass = statusClassFromEnum(stEnum);

      const li = document.createElement('li');
      li.className = 'task';
      li.setAttribute('data-status', statusClass);
      li.innerHTML = `
        <div class="task-main">
          <div class="task-top">
            <span class="time">${tarefa.horario || ''}</span>
            <span class="badge ${statusClass}">
              ${labelFromEnum(stEnum)}
            </span>
          </div>
          <div class="title">${tarefa.titulo || ''}</div>
          <p class="desc">${tarefa.descricao ?? ''}</p>
        </div>
        <div class="atividade-actions">
          <button type="button" onclick="openAtividadeModal(${tarefa.idAgenda})">Editar</button>
          <button type="button" onclick="deletarAtividade(${tarefa.idAgenda})">Excluir</button>
        </div>
      `;
      lista.appendChild(li);
    });
  } catch (err) {
    console.error('Erro ao carregar atividades:', err);
    showAlert('Não foi possível carregar as atividades.');
  }
}

// ================== EXCLUIR ==================
async function askConfirm(message, opts = {}) {
  if (typeof showConfirm === 'function') {
    try {
      const ok = await showConfirm({
        title: opts.title || 'Confirmar ação',
        message,
        confirmText: opts.confirmText || 'Confirmar',
        cancelText: opts.cancelText || 'Cancelar',
        variant: opts.variant || 'danger',
      });
      return !!ok;
    } catch (_) {
      return false;
    }
  }
  return window.confirm(message);
}

async function deletarAtividade(id) {
  const ok = await askConfirm(
    'Tem certeza que deseja excluir esta atividade?',
    { title: 'Excluir atividade', confirmText: 'Excluir', cancelText: 'Cancelar', variant: 'danger' }
  );
  if (!ok) return;

  try {
    const response = await fetch(`/api/agenda/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { ...authHeaders() }
    });
    const result = await (async () => {
      const ct = response.headers.get('content-type') || '';
      return ct.includes('application/json') ? await response.json().catch(() => ({})) : {};
    })();

    if (!response.ok) {
      showAlert(result?.message || result?.error || 'Erro ao excluir a atividade.');
      return;
    }
    showAlert('Atividade excluída com sucesso.');
    carregarAtividadesDoDia();
  } catch (err) {
    console.error('Erro ao deletar atividade:', err);
    showAlert('Erro ao conectar com o servidor para deletar.');
  }
}

// ================== EXPOSE / INIT ==================
window.openAtividadeModal      = openAtividadeModal;
window.salvarAtividade         = salvarAtividade;
window.carregarAtividadesDoDia = carregarAtividadesDoDia;
window.deletarAtividade        = deletarAtividade;

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('salvarAtividadeBtn');
  if (btn) btn.addEventListener('click', salvarAtividade);
  carregarAtividadesDoDia();
});
