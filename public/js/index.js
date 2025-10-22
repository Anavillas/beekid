// ==================== LOGIN ====================
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('emailLogin').value.trim();
  const senha = document.getElementById('senhaLogin').value;

  if (!email || !senha) { alert('Preencha email e senha.'); return; }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // alinhe com o backend: { email, senha } ou { email, password }
      body: JSON.stringify({ email, senha })
      // body: JSON.stringify({ email, password: senha })
    });

    // Tente ler corpo, mas não dependa disso pro redirect
    const contentType = response.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // pode ser 204/HTML/redirect seguido
      await response.text(); // consome pra não dar erro, opcional
    }

    if (!response.ok) {
      const msg = (data && (data.message || data.error)) || `HTTP ${response.status}`;
      alert('Erro no login: ' + msg);
      return;
    }

    // Se o backend mandou um token no JSON, guarde; se usa cookie HttpOnly, ignore isto
    if (data?.token) localStorage.setItem('token', data.token);

    // Redireciona a aba explicitamente (fetch nunca “troca de página” sozinho)
    window.location.replace('/dashboard'); // não expõe token na URL
  } catch (err) {
    console.error('Falha no login', err);
    alert('Erro de conexão com o servidor.');
  }
});


// ==================== LOGIN GOOGLE ====================
document.getElementById("btnLoginGoogle").addEventListener("click", () => {
    window.location.href = "http://localhost:3000/api/auth/google";
});

// ==================== MODAIS ====================
const btnAbrirModal = document.getElementById("btnAbrirModal");
const modalCadastro = document.getElementById("modalCadastro");
const btnFecharCadastro = document.getElementById("btnFecharCadastro");
const btnCadastrar = document.getElementById("btnCadastrar");
const modalResponsavel = document.getElementById("modalResponsavel");
const btnFecharResponsavel = document.getElementById("btnFecharResponsavel");
const modalErro = document.getElementById("modalErro");
const btnFecharErro = document.getElementById("btnFecharErro");
const modalSucesso = document.getElementById("modalSucesso");
const btnFecharSucesso = document.getElementById("btnFecharSucesso");

btnAbrirModal.addEventListener("click", () => {
    modalCadastro.style.display = "block";
});

btnFecharCadastro.addEventListener("click", () => {
    modalCadastro.style.display = "none";
});

btnCadastrar.addEventListener("click", async () => {
    // Captura os valores dos campos do cadastro
    const nome = document.getElementById("nomeCadastro").value;
    const cpf = document.getElementById("cpfCadastro").value; // ⚡ precisa existir no modal
    const email = document.getElementById("emailCadastro").value;
    const senha = document.getElementById("senhaCadastro").value;
    const tipoUser = 'responsavel'; // Tipo de usuário fixo

    if (!nome || !cpf || !email || !senha) {
        modalErro.style.display = 'block';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, cpf, email, senha, tipoUser })
        });

        const data = await response.json();

        if (response.ok) {
            if (response.ok) {
              localStorage.setItem('token', data.token);
              window.location.replace('/dashboard');
          }

        } else {
            alert('Erro no cadastro: ' + data.error);
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
        alert('Erro de conexão com o servidor. Tente novamente mais tarde.');
    }
});

btnFecharResponsavel.addEventListener("click", () => {
    modalResponsavel.style.display = "none";
    modalCadastro.style.display = "block";
});

btnFecharErro.addEventListener("click", () => {
    modalErro.style.display = "none";
});

btnFecharSucesso.addEventListener("click", () => {
    modalSucesso.style.display = "none";
});

// ==================== TOGGLE SENHA ====================
const toggleSenha = document.querySelector('.toggleSenha');
toggleSenha.addEventListener('click', function() {
    const senhaInput = this.previousElementSibling;
    const tipo = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
    senhaInput.setAttribute('type', tipo);
    this.classList.toggle('bx-show');
    this.classList.toggle('bx-hide');
});
