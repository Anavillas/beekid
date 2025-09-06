// selecionarCrianca.js

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

  // fallback: localStorage
  const t = localStorage.getItem('token');
  if (t) return t;

  // (opcional) tentar cookie não-httpOnly, se você guardar também no cliente
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
      // Sem token -> manda pra login
      // (ou mostre uma mensagem amigável em vez de redirecionar)
      window.location.href = '/';
      return;
    }

    const response = await fetch('/api/criancas', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
      // Se você tiver optado por cookie httpOnly no backend em vez de header:
      // , credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP! Status: ${response.status}`);
    }

    const criancas = await response.json();

    // Filtrar por papel
    const responsaveis = criancas.filter(c => c.papelDoUsuario === 'responsavel' || c.papelDoUsuario === 'ambos');
    const cuidadores = criancas.filter(c => c.papelDoUsuario === 'cuidador');

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
  }
}

function renderCard(crianca, container) {
  const fotoDaCrianca = crianca.foto;
  const urlFinal = (fotoDaCrianca && fotoDaCrianca !== 'https://via.placeholder.com/40')
    ? fotoDaCrianca
    : './Imagens/Icones crianças/Icone_Base.jpg';

  const cardHTML = `
    <div class="profile-card">
      <h2>${crianca.nome}</h2>
      <button class="add-btn" onclick="acessarPerfil(${crianca.idCrianca})">Acessar</button>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', cardHTML);
}

// Modal
function openModal(modalId) {
  document.getElementById(modalId).style.display = 'flex';
}
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// Criar criança
async function adicionarNovaCrianca() {
  const nome = document.getElementById('nomeCriancaInput').value;
  const cpf = document.getElementById('cpfCriancaInput').value;
  const dataNascimento = document.getElementById('dataNascimentoCriancaInput').value;

  try {
    const token = getTokenAndPersist();
    if (!token) {
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
      // Se estiver usando cookie httpOnly:
      // , credentials: 'include'
    });

    if (response.ok) {
      alert('Criança adicionada com sucesso!');
      closeModal('modalAdicionarCrianca');
      carregarCriancas();
    } else {
      const errorData = await response.json().catch(() => ({}));
      alert('Erro ao adicionar criança: ' + (errorData.error || response.statusText));
    }
  } catch (error) {
    console.error("Erro ao adicionar criança:", error);
    alert('Erro de conexão ao adicionar criança.');
  }
}

function acessarPerfil(criancaId) {
  window.location.href = `/criancas/${criancaId}`;
}

// Início
document.addEventListener('DOMContentLoaded', carregarCriancas);
