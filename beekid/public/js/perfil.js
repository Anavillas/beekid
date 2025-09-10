// ===== Helpers Auth
function getToken(){ return localStorage.getItem('token'); }
function authHeaders(){
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function toast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg || 'OK';
  el.classList.add('show');
  setTimeout(()=> el.classList.remove('show'), 2200);
}

// ===== Estado local
let ME = null;
let END_EDIT_ID = null; // idEndereco sendo editado

// ===== Carregar perfil
async function loadMe(){
  const r = await fetch('/api/usuario/me',{ headers:{...authHeaders()} });
  if(!r.ok){ toast('Erro ao carregar perfil'); return; }
  ME = await r.json();

  document.getElementById('nome').value = ME.nome || '';
  document.getElementById('telefone').value = ME.telefone || '';
  document.getElementById('email').value = ME.email || '';
  document.getElementById('tipoUser').value = ME.tipoUser || 'RESPONSAVEL';
  document.getElementById('cpf').value = ME.cpf || '';
  document.getElementById('senha').value = '';

  document.getElementById('nomeDisplay').textContent = ME.nome || '—';
  document.getElementById('emailDisplay').textContent = ME.email || '—';
  document.getElementById('tipoUserTag').textContent =
    (ME.tipoUser === 'CUIDADOR' ? 'Cuidador' : 'Responsável');

  if(ME.foto) document.getElementById('avatar').src = ME.foto;
}

// ===== Salvar perfil (nome/telefone/senha opcional)
async function saveMe(){
  const payload = {
    nome: document.getElementById('nome').value.trim(),
    telefone: document.getElementById('telefone').value.trim(),
  };
  const novaSenha = document.getElementById('senha').value.trim();
  if(novaSenha) payload.senha = novaSenha;

  const r = await fetch('/api/usuario/me',{
    method:'PUT',
    headers:{ 'Content-Type':'application/json', ...authHeaders() },
    body: JSON.stringify(payload)
  });
  const data = await r.json().catch(()=> ({}));
  if(!r.ok){ toast(data?.message || data?.error || 'Erro ao salvar'); return; }
  toast('Perfil atualizado!');
  await loadMe();
}

// ===== Endereços
async function loadEnderecos(){
  const r = await fetch('/api/enderecos',{ headers:{...authHeaders()} });
  const list = document.getElementById('listaEnderecos');
  const vazio = document.getElementById('vazioEnderecos');
  list.innerHTML = '';
  if(!r.ok){ vazio.style.display='block'; return; }
  const items = await r.json();
  if(!Array.isArray(items) || items.length===0){ vazio.style.display='block'; return; }
  vazio.style.display='none';

  items.forEach(addr => {
    const h4 = [addr.logradouro, addr.numero].filter(Boolean).join(', ');
    const meta = [
      addr.complemento,
      addr.bairro,
      [addr.cidade, addr.estado].filter(Boolean).join(' - '),
      addr.cep
    ].filter(Boolean).join(' • ');
    const el = document.createElement('div');
    el.className = 'addr';
    el.innerHTML = `
      <h4>${h4 || '(Sem logradouro)'}</h4>
      <div class="meta">${meta}</div>
      <div class="addr-actions">
        <button class="btn ghost" onclick="openEnderecoModal(${addr.idEndereco}, ${JSON.stringify(addr).replace(/"/g,'&quot;')})"><i class="fa-regular fa-pen-to-square"></i> Editar</button>
        <button class="btn danger" onclick="excluirEndereco(${addr.idEndereco})"><i class="fa-regular fa-trash-can"></i> Excluir</button>
      </div>`;
    list.appendChild(el);
  });
}

// ===== Modal Endereço
function openEnderecoModal(id=null, addr=null){
  END_EDIT_ID = id;
  document.getElementById('endModalTitle').textContent = id ? 'Editar endereço' : 'Novo endereço';
  document.getElementById('logradouro').value  = addr?.logradouro || '';
  document.getElementById('numero').value      = addr?.numero || '';
  document.getElementById('complemento').value = addr?.complemento || '';
  document.getElementById('bairro').value      = addr?.bairro || '';
  document.getElementById('cidade').value      = addr?.cidade || '';
  document.getElementById('estado').value      = addr?.estado || '';
  document.getElementById('cep').value         = addr?.cep || '';
  document.getElementById('modalEndereco').style.display='flex';
}
function closeEnderecoModal(){ document.getElementById('modalEndereco').style.display='none'; }

function validaEndereco(payload){
  const required = ['logradouro','numero','bairro','cidade','estado','cep'];
  for(const k of required){
    if(!payload[k] || !String(payload[k]).trim()) return `Preencha ${k}`;
  }
  if(payload.estado.length !== 2) return 'UF deve ter 2 letras';
  if(!/^\d{5}-?\d{3}$/.test(payload.cep)) return 'CEP inválido (use 00000-000)';
  return null;
}

async function salvarEndereco(){
  const payload = {
    logradouro: document.getElementById('logradouro').value.trim(),
    numero: document.getElementById('numero').value.trim(),
    complemento: document.getElementById('complemento').value.trim(),
    bairro: document.getElementById('bairro').value.trim(),
    cidade: document.getElementById('cidade').value.trim(),
    estado: document.getElementById('estado').value.trim().toUpperCase(),
    cep: document.getElementById('cep').value.trim(),
  };
  const err = validaEndereco(payload);
  if(err) return toast(err);

  const url = END_EDIT_ID ? `/api/enderecos/${END_EDIT_ID}` : '/api/enderecos';
  const method = END_EDIT_ID ? 'PUT' : 'POST';

  const r = await fetch(url,{
    method,
    headers:{ 'Content-Type':'application/json', ...authHeaders() },
    body: JSON.stringify(payload)
  });
  const data = await r.json().catch(()=> ({}));
  if(!r.ok){ toast(data?.message || data?.error || 'Erro ao salvar endereço'); return; }

  toast(END_EDIT_ID ? 'Endereço atualizado' : 'Endereço criado');
  closeEnderecoModal();
  END_EDIT_ID = null;
  await loadEnderecos();
}

// Confirmação via modal-confirm-template (fallback para window.confirm)
async function askConfirm(message, opts = {}) {
  if (typeof showConfirm === 'function') {
    try {
      const ok = await showConfirm({
        title: opts.title || 'Confirmar ação',
        message,
        confirmText: opts.confirmText || 'Confirmar',
        cancelText: opts.cancelText || 'Cancelar',
        variant: opts.variant || 'danger', // deixa o botão de confirmação em vermelho
      });
      return !!ok;
    } catch {
      return false;
    }
  }
  // Se o template ainda não estiver carregado, usa confirm() mesmo
  return window.confirm(message);
}


async function excluirEndereco(id){
  const ok = await askConfirm(
    'Excluir este endereço?',
    { title: 'Excluir endereço', confirmText: 'Excluir', cancelText: 'Cancelar', variant: 'danger' }
  );
  if(!ok) return;

  const r = await fetch(`/api/enderecos/${id}`,{ method:'DELETE', headers:{...authHeaders()} });
  const data = await r.json().catch(()=> ({}));
  if(!r.ok){ toast(data?.message || data?.error || 'Erro ao excluir'); return; }
  toast('Endereço excluído');
  await loadEnderecos();
}


// ===== Bind
document.addEventListener('DOMContentLoaded', async ()=>{
  document.getElementById('btnSave').addEventListener('click', saveMe);
  document.getElementById('btnReset').addEventListener('click', loadMe);
  document.getElementById('btnAddEndereco').addEventListener('click', ()=> openEnderecoModal());
  document.getElementById('btnSalvarEndereco').addEventListener('click', salvarEndereco);

  await loadMe();
  await loadEnderecos();
});

// Expor para onclick inlined
window.openEnderecoModal = openEnderecoModal;
window.closeEnderecoModal = closeEnderecoModal;
window.excluirEndereco = excluirEndereco;
