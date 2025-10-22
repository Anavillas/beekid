// /public/js/cuidador.js
'use strict';

function getToken(){ return localStorage.getItem('token'); }
function authHeaders(){ const t=getToken(); return t?{ Authorization:`Bearer ${t}` }:{}; }
function $(id){ return document.getElementById(id); }

function toast(msg){
  const el = $('toast');
  if(!el) return alert(msg || 'OK');
  el.textContent = msg || 'OK';
  el.classList.add('show');
  setTimeout(()=> el.classList.remove('show'), 2200);
}

/* ---------- RENDER: só preenche campos/containers existentes ---------- */

function renderPrincipal(c){
  const nomeTitulo = $('nomeTitulo');
  const emailTitulo = $('emailTitulo');
  const tipoUserTag = $('tipoUserTag');
  const avatar = $('avatar');

  if (nomeTitulo) nomeTitulo.textContent = c?.nome || '—';
  if (emailTitulo) emailTitulo.textContent = c?.email || '—';
  if (tipoUserTag) tipoUserTag.textContent = 'Cuidador';
  if (avatar) avatar.src = (c?.foto || '/Imagens/Icones crianças/Icone_Base.jpg');

  const nome = $('nome');
  const telefone = $('telefone');
  const email = $('email');
  const cpf = $('cpf');
  if (nome) nome.value = c?.nome || '';
  if (telefone) telefone.value = c?.telefone || '';
  if (email) email.value = c?.email || '';
  if (cpf) cpf.value = c?.cpf || '';

  const lista = $('listaEnderecos');
  const vazio = $('vazioEnderecos');
  if (!lista || !vazio) return;

  lista.innerHTML = '';
  if (!c?.enderecos || c.enderecos.length === 0) {
    vazio.style.display = 'block';
    return;
  }

  vazio.style.display = 'none';
  c.enderecos.forEach(e => {
    const div = document.createElement('div');
    div.className = 'addr';
    const h4 = [e.logradouro, e.numero].filter(Boolean).join(', ') || '(Sem logradouro)';
    const meta = [
      e.complemento,
      e.bairro,
      [e.cidade, e.estado].filter(Boolean).join(' - '),
      e.cep
    ].filter(Boolean).join(' • ');
    div.innerHTML = `<h4>${h4}</h4><div class="meta">${meta}</div>`;
    lista.appendChild(div);
  });
}

function renderOutros(cuidadores){
  const card = $('outrosCuidadoresCard');
  const ul = $('outrosCuidadoresLista');
  const multiInfo = $('multiInfo');
  if (!card || !ul) return;

  ul.innerHTML = '';

  if (!Array.isArray(cuidadores) || cuidadores.length <= 1) {
    card.style.display = 'none';
    if (multiInfo) multiInfo.style.display = 'none';
    return;
  }

  if (multiInfo) {
    multiInfo.style.display = 'block';
    multiInfo.textContent = `Esta criança possui ${cuidadores.length} cuidadores associados.`;
  }

  cuidadores.slice(1).forEach(c => {
    const wrap = document.createElement('div');
    wrap.className = 'mini-card';
    wrap.innerHTML = `
      <div class="mini-row">
        <div class="mini-title">${escapeHtml(c.nome || '—')}</div>
        <div class="mini-sub">${escapeHtml(c.email || '—')}</div>
      </div>
      <div class="mini-meta">${escapeHtml(c.telefone || '')}${c.cpf ? ' • CPF: '+escapeHtml(c.cpf) : ''}</div>
    `;
    ul.appendChild(wrap);
  });

  card.style.display = 'block';
}

/* ---------- BUSCA DE DADOS ---------- */

async function loadCuidadores(){
  // pega id da criança: global ou querystring
  let idCrianca = window.__ID_CRIANCA;
  if(!idCrianca){
    const params = new URLSearchParams(location.search);
    idCrianca = params.get('idCrianca');
  }
  if(!idCrianca){
    toast('ID da criança ausente. Use /criancas/:id/cuidadores ou ?idCrianca=123');
    return;
  }

  const headers = { ...authHeaders() };

  try {
    const url = `/api/criancas/${idCrianca}/cuidadores/full`;
    const r = await fetch(url, { headers });

    if (r.status === 401) { toast('Não autenticado'); return; }
    if (r.status === 403) { toast('Apenas o responsável pode visualizar os cuidadores.'); return; }
    if (!r.ok) { toast('Erro ao carregar cuidadores'); return; }

    let cuidadores = [];
    try {
      cuidadores = await r.json();
    } catch {
      const text = await r.text();
      console.error('[cuidador] resposta não-JSON:', text);
      toast('Resposta inválida do servidor'); 
      return;
    }

    if (!Array.isArray(cuidadores) || cuidadores.length === 0) {
      renderPrincipal(null);
      renderOutros([]);
      return;
    }

    // Se vier ?idCuidador=..., coloca esse como principal
    const params = new URLSearchParams(location.search);
    const idCuidadorSelecionado = params.get('idCuidador');
    if (idCuidadorSelecionado) {
      const idx = cuidadores.findIndex(c =>
        String(c.idCuidador || c.id || c._id || '') === String(idCuidadorSelecionado)
      );
      if (idx > 0) {
        const [sel] = cuidadores.splice(idx, 1);
        cuidadores.unshift(sel);
      }
    }

    renderPrincipal(cuidadores[0]);
    renderOutros(cuidadores);
  } catch (err) {
    console.error('[cuidador] loadCuidadores erro:', err);
    toast('Erro de conexão ao carregar cuidadores');
  }
}

/* ---------- HELPERS ---------- */

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/* ---------- BOOT ---------- */
document.addEventListener('DOMContentLoaded', loadCuidadores);
