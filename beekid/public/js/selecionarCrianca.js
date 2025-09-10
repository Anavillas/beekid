// selecionarCrianca.js

// --- Wrapper seguro para o modal de mensagens (usa seu template) ---
function notifySuccess(msg, title = 'Sucesso') {
  if (typeof showMessage === 'function') return showMessage(title, msg, 'success');
  return console.log('[success]', msg);
}
function notifyError(msg, title = 'Erro') {
  if (typeof showMessage === 'function') return showMessage(title, msg, 'error');
  return console.error('[error]', msg);
}
function notifyInfo(msg, title = 'Info') {
  if (typeof showMessage === 'function') return showMessage(title, msg, 'info');
  return console.log('[info]', msg);
}

// 1) Helper: captura token da URL > localStorage > (opcional) cookie não-httpOnly
function getTokenAndPersist() {
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get('token');

  if (tokenFromUrl) {
    localStorage.setItem('token', tokenFromUrl);
    // limpa a URL sem recarregar
    params.delete('token');
    const clean = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState({}, '', clean);
    return tokenFromUrl;
  }

  const t = localStorage.getItem('token');
  if (t) return t;

  // (opcional) cookie não-httpOnly
  // const m = document.cookie.match(/(?:^|; )token=([^;]+)/);
  // if (m) return decodeURIComponent(m[1]);

  return null;
}

async function carregarCriancas() {
  const containerResponsavel = document.getElementById('responsavel-container');
  const containerCuidador = document.getElementById('cuidador-container');
  const noCriancaMessage = document.getElementById('no-crianca-message');

  // Limpa os containers
  containerResponsavel.innerHTML = '';
  containerCuidador.innerHTML = '';
  noCriancaMessage.style.display = 'none';

  try {
    const token = getTokenAndPersist();
    if (!token) {
      notifyInfo('Sua sessão expirou. Faça login novamente para continuar.', 'Sessão');
      window.location.href = '/';
      return;
    }

    const response = await fetch('/api/criancas', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
      // , credentials: 'include' // se usar cookie httpOnly
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP! Status: ${response.status}`);
    }

    const criancas = await response.json();

    // Filtrar por papel
    const responsaveis = criancas.filter(c => c.papelDoUsuario === 'responsavel' || c.papelDoUsuario === 'ambos');
    const cuidadores  = criancas.filter(c => c.papelDoUsuario === 'cuidador');

    // Botão de adicionar só no bloco de responsável
    const btnAdicionarHTML = `
      <div class="profile-card adicionar-card" id="btn-adicionar-crianca">
        <i class="fa-solid fa-plus icon-add"></i>
        <h2>Adicionar Criança</h2>
      </div>
    `;
    containerResponsavel.insertAdjacentHTML('beforeend', btnAdicionarHTML);
    document.getElementById('btn-adicionar-crianca').onclick = () => openModal('modalAdicionarCrianca');

    // Renderizar cards de responsável
    if (responsaveis.length > 0) {
      responsaveis.forEach(crianca => {
        renderCard(crianca, containerResponsavel);
      });
    } else {
      containerResponsavel.insertAdjacentHTML('beforeend', `<p class="no-data">Você não é responsável por nenhuma criança.</p>`);
    }

    // Renderizar cards de cuidador
    if (cuidadores.length > 0) {
      cuidadores.forEach(crianca => {
        renderCard(crianca, containerCuidador);
      });
    } else {
      containerCuidador.insertAdjacentHTML('beforeend', `<p class="no-data">Você não cuida de nenhuma criança.</p>`);
    }

  } catch (error) {
    console.error("Erro ao carregar crianças:", error);
    noCriancaMessage.textContent = "Ocorreu um erro ao carregar as crianças. Tente novamente mais tarde.";
    noCriancaMessage.style.display = 'block';
    notifyError('Não foi possível carregar as crianças agora. Tente novamente mais tarde.');
  }
}

function renderCard(crianca, container) {
  const nome = crianca.nome || "Sem nome";
  const email = crianca.email || "";
  const iniciais = (nome.match(/\b\w/g) || []).slice(0,2).join("").toUpperCase();

  const cardHTML = `
    <div class="profile-card" tabindex="0">
      ${crianca.foto
        ? `<img class="avatar" src="${crianca.foto}" alt="${nome}">`
        : `<span class="avatar">${iniciais}</span>`
      }
      <div class="info">
        <div class="name">${nome}</div>
        ${email ? `<div class="meta">${email}</div>` : ""}
      </div>
      <div class="actions">
        <button class="btn-pill" onclick="acessarPerfil(${crianca.idCrianca})">Ver perfil</button>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', cardHTML);
}

// Modal (mantém sua API)
function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (!el) return;
  el.style.display = 'flex';
  el.setAttribute('aria-hidden', 'false');
}
function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (!el) return;
  el.style.display = 'none';
  el.setAttribute('aria-hidden', 'true');
}

// Validações simples para o formulário de nova criança
function isValidCPF(cpf) {
  const s = String(cpf || '').replace(/\D/g, '');
  return s.length === 11; // aqui só garantimos 11 dígitos; regra completa pode ser aplicada se quiser
}
function isValidDate(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  return !isNaN(d.getTime());
}

// Criar criança (substitui alert() por modal)
async function adicionarNovaCrianca() {
  const nome = document.getElementById('nomeCriancaInput').value?.trim();
  const cpf  = document.getElementById('cpfCriancaInput').value?.trim();
  const dataNascimento = document.getElementById('dataNascimentoCriancaInput').value?.trim();

  // validações básicas
  if (!nome)  return notifyError('Informe o nome da criança.');
  if (!cpf || !isValidCPF(cpf)) return notifyError('Informe um CPF válido (11 dígitos).');
  if (!isValidDate(dataNascimento)) return notifyError('Informe uma data de nascimento válida.');

  try {
    const token = getTokenAndPersist();
    if (!token) {
      notifyInfo('Sua sessão expirou. Faça login novamente para continuar.', 'Sessão');
      window.location.href = '/';
      return;
    }

    const response = await fetch('/api/criancas', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ nome, cpf, dataNascimento })
      // , credentials: 'include'
    });

    const payload = await response.json().catch(() => ({}));

    if (response.ok) {
      notifySuccess('Criança adicionada com sucesso!');
      closeModal('modalAdicionarCrianca');
      carregarCriancas();
    } else {
      const msg = payload?.message || payload?.error || response.statusText || 'Erro ao adicionar criança.';
      notifyError(msg);
    }
  } catch (error) {
    console.error("Erro ao adicionar criança:", error);
    notifyError('Erro de conexão ao adicionar criança.');
  }
}

function acessarPerfil(criancaId) {
  window.location.href = `/criancas/${criancaId}`;
}

// Início
document.addEventListener('DOMContentLoaded', carregarCriancas);
