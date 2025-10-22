// public/js/agenda.js

async function openAtividadeModal(atividadeId = null) {
  const modal = document.getElementById('atividadeModal');
  const h2 = document.getElementById('modalAtividadeTitle');
  const saveBtn = document.getElementById('salvarAtividadeBtn');

  // limpa
  document.getElementById('horarioInput').value = '';
  document.getElementById('tituloInput').value = '';
  document.getElementById('descricaoInput').value = '';
  document.getElementById('statusInput').value = 'pendente';
  document.getElementById('atividadeIdInput').value = '';

  if (atividadeId) {
    try {
      const response = await fetch(`/api/agenda/${atividadeId}`, { headers: { ...authHeaders() } });
      if (!response.ok) throw new Error('Atividade não encontrada.');
      const tarefa = await response.json();

      document.getElementById('horarioInput').value   = tarefa.horario ?? tarefa.horio ?? '';
      document.getElementById('tituloInput').value    = tarefa.titulo ?? '';
      document.getElementById('descricaoInput').value = tarefa.descricao ?? '';
      document.getElementById('statusInput').value    = tarefa.status_tarefa ?? 'pendente';
      document.getElementById('atividadeIdInput').value = tarefa.idAgenda;

      h2.textContent = 'Editar Atividade';
      saveBtn.textContent = 'Atualizar';
    } catch (err) {
      console.error(err);
      showAlert('Erro ao carregar dados da atividade.');
      return;
    }
  } else {
    h2.textContent = 'Adicionar Atividade';
    saveBtn.textContent = 'Salvar';
  }

  modal.style.display = 'flex';
}

async function salvarAtividade() {
  try {
    const atividadeId   = document.getElementById('atividadeIdInput').value;
    const horario       = document.getElementById('horarioInput').value.trim();
    const titulo        = document.getElementById('tituloInput').value.trim();
    const descricao     = document.getElementById('descricaoInput').value.trim();
    const status_tarefa = (document.getElementById('statusInput').value || '').toLowerCase();

    if (!horario || !titulo || !descricao) {
      showAlert("Preencha todos os campos obrigatórios!");
      return;
    }

    const data = { horario, titulo, descricao, status_tarefa, id_crianca: idCrianca };
    const method = atividadeId ? 'PUT' : 'POST';
    const url    = atividadeId ? `/api/agenda/${atividadeId}` : '/api/agenda';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data)
    });

    const result = await response.json().catch(() => ({}));

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

async function carregarAtividadesDoDia() {
  try {
    const response = await fetch(`/api/agenda/crianca/${idCrianca}`, { headers: { ...authHeaders() } });
    const lista = document.getElementById('listaAtividades');
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
      const status = (tarefa.status_tarefa || 'pendente').toLowerCase();
    const statusClass =
      status.includes('concl') ? 'concluida' :
      status.includes('cancel') ? 'cancelada' : 'pendente';

    const li = document.createElement('li');
    li.className = 'task';
    li.setAttribute('data-status', statusClass);
    li.innerHTML = `
      <div class="task-main">
        <div class="task-top">
          <span class="time">${tarefa.horario || ''}</span>
          <span class="badge ${statusClass}">
            ${statusClass === 'concluida' ? 'Concluída' :
              statusClass === 'cancelada' ? 'Cancelada' : 'Pendente'}
          </span>
        </div>
        <div class="title">${tarefa.titulo || ''}</div>
        <p class="desc">${tarefa.descricao ?? ''}</p>
      </div>
      <div class="atividade-actions">
        <button onclick="openAtividadeModal(${tarefa.idAgenda})">Editar</button>
        <button onclick="deletarAtividade(${tarefa.idAgenda})">Excluir</button>
      </div>
    `;
lista.appendChild(li);
    });
  } catch (err) {
    console.error('Erro ao carregar atividades:', err);
    showAlert('Não foi possível carregar as atividades.');
  }
}

async function askConfirm(message, opts = {}) {
  if (typeof showConfirm === 'function') {
    try {
      const ok = await showConfirm({
        title: opts.title || 'Confirmar ação',
        message,
        confirmText: opts.confirmText || 'Confirmar',
        cancelText: opts.cancelText || 'Cancelar',
        variant: opts.variant || 'danger', // usa o estilo "perigoso" para exclusão
      });
      return !!ok;
    } catch (_) {
      return false;
    }
  }
  // fallback se o modal não estiver carregado
  return window.confirm(message);
}

async function deletarAtividade(id) {
  const ok = await askConfirm(
    'Tem certeza que deseja excluir esta atividade?',
    { title: 'Excluir atividade', confirmText: 'Excluir', cancelText: 'Cancelar', variant: 'danger' }
  );
  if (!ok) return;

  try {
    const response = await fetch(`/api/agenda/${id}`, {
      method: 'DELETE',
      headers: { ...authHeaders() }
    });
    const result = await response.json().catch(() => ({}));
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

// expor pro HTML (onclick)
window.openAtividadeModal = openAtividadeModal;
window.salvarAtividade = salvarAtividade;
window.carregarAtividadesDoDia = carregarAtividadesDoDia;
window.deletarAtividade = deletarAtividade;

// init local
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('salvarAtividadeBtn');
  if (btn) btn.addEventListener('click', salvarAtividade);
  carregarAtividadesDoDia();
});
