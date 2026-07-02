const URL = '/historicoMorador';
const URL_MORADOR = '/morador';

let historicos = [];
let moradores = [];
let ordenacaoAtual = { chave: 'nome', direcao: 'asc' };

function atualizarIndicadoresOrdenacao() {
  document.querySelectorAll(".sortable").forEach((th) => {
    const indicador = th.querySelector(".sort-indicator");
    const ativa = th.dataset.sortKey === ordenacaoAtual.chave;
    th.classList.toggle("is-active", ativa);
    if (indicador) {
      indicador.textContent = ativa ? (ordenacaoAtual.direcao === "asc" ? "↑" : "↓") : "";
    }
  });
}

function comparar(a, b, chave, direcao) {
  let valorA = "";
  let valorB = "";

  if (chave === "nome" || chave === "cpf") {
    valorA = a.morador ? String(a.morador[chave] || "").toLowerCase() : "";
    valorB = b.morador ? String(b.morador[chave] || "").toLowerCase() : "";
  } else if (chave === "status") {
    valorA = a.dtSaida ? "inativo" : "ativo";
    valorB = b.dtSaida ? "inativo" : "ativo";
  } else {
    if (chave === "idHistoricoMorador") {
      valorA = a[chave] || 0;
      valorB = b[chave] || 0;
      if (valorA < valorB) return direcao === "asc" ? -1 : 1;
      if (valorA > valorB) return direcao === "asc" ? 1 : -1;
      return 0;
    }
    valorA = String(a[chave] || "").toLowerCase();
    valorB = String(b[chave] || "").toLowerCase();
  }

  if (valorA < valorB) return direcao === "asc" ? -1 : 1;
  if (valorA > valorB) return direcao === "asc" ? 1 : -1;
  return 0;
}

function exibirMensagem(tipo, mensagem) {
  const classe = document.getElementById('mensagem-feedback');

  if (classe) {
    classe.className = `popup-msg ${tipo}`;
    classe.textContent = mensagem;
    classe.classList.add('show');

    window.clearTimeout(exibirMensagem._timer);
    exibirMensagem._timer = window.setTimeout(() => {
      classe.classList.remove('show');
    }, 3200);
  }
}

function formatarData(data) {
  return (data || '').replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1');
}

function carregarMoradores(callback) {
  fetch(`${URL_MORADOR}/listar`)
      .then(response => response.json())
      .then(listaMoradores => {
        moradores = listaMoradores;

        const select = document.getElementById('idMorador');
        select.innerHTML = '<option value="">Selecione</option>';

        moradores.forEach(morador => {
          const option = document.createElement('option');
          option.value = morador.idMorador;
          option.textContent = morador.nome;
          select.appendChild(option);
        });

        if (typeof callback === 'function')
          callback();
      })
      .catch(error => console.error('Erro ao carregar moradores:', error));
}

function carregarHistoricos() {
  fetch(`${URL}/listar`)
      .then(response => response.json())
      .then(listaHistoricos => {
        historicos = listaHistoricos;
        aplicarFiltros();
      })
      .catch(error => console.error('Erro ao carregar históricos:', error));
}

function renderizarHistoricos(lista) {
  const tbody = document.getElementById('listaHistoricos');
  tbody.innerHTML = '';
  
  atualizarIndicadoresOrdenacao();

  lista.forEach(h => {
    const row = tbody.insertRow();

    row.insertCell(0).textContent = h.idHistoricoMorador;
    row.insertCell(1).textContent = h.morador ? h.morador.nome : '-';
    row.insertCell(2).textContent = h.morador ? h.morador.cpf : '-';
    row.insertCell(3).textContent = formatarData(h.dtEntrada);
    row.insertCell(4).textContent = h.dtSaida ? formatarData(h.dtSaida) : 'Em andamento';

    const status = row.insertCell(5);
    status.innerHTML = h.dtSaida
        ? '<span class="status-badge inativo">Inativo</span>'
        : '<span class="status-badge ativo">Ativo</span>';

    const acoes = row.insertCell(6);
    acoes.classList.add('text-right');
    const divAcoes = document.createElement('div');
    divAcoes.classList.add('acoes');

    if (!h.dtSaida) {
      const btnFinalizar = document.createElement('button');
      btnFinalizar.type = 'button';
      btnFinalizar.classList.add('action-icon-btn', 'edit');
      btnFinalizar.innerHTML = '<span class="material-symbols-outlined">check_circle</span>';
      btnFinalizar.onclick = () => abrirFinalizarHistorico(h);
      btnFinalizar.title = "Finalizar Histórico";
      divAcoes.appendChild(btnFinalizar);

      const btnEditar = document.createElement('button');
      btnEditar.type = 'button';
      btnEditar.classList.add('action-icon-btn', 'edit');
      btnEditar.innerHTML = '<span class="material-symbols-outlined">edit</span>';
      btnEditar.onclick = () => editarHistorico(h);
      btnEditar.title = "Editar Histórico";

      const btnDeletar = document.createElement('button');
      btnDeletar.type = 'button';
      btnDeletar.classList.add('action-icon-btn', 'delete');
      btnDeletar.innerHTML = '<span class="material-symbols-outlined">delete</span>';
      btnDeletar.onclick = () => deletarHistorico(h.idHistoricoMorador);
      btnDeletar.title = "Excluir Histórico";

      divAcoes.appendChild(btnEditar);
      divAcoes.appendChild(btnDeletar);
    } else {
      const btnRetornar = document.createElement('button');
      btnRetornar.type = 'button';
      btnRetornar.classList.add('action-icon-btn', 'edit');
      btnRetornar.innerHTML = '<span class="material-symbols-outlined">undo</span>';
      btnRetornar.onclick = () => retornarHistorico(h);
      btnRetornar.title = "Retornar Histórico para Ativo";
      divAcoes.appendChild(btnRetornar);
    }

    acoes.appendChild(divAcoes);
  });
}

function aplicarFiltros() {
  const filtroNome = document.getElementById('filtroNome').value.trim().toLowerCase();
  const filtroStatus = document.getElementById('filtroStatus').value;
  const filtroEntrada = document.getElementById('filtroEntrada').value;
  const filtroSaida = document.getElementById('filtroSaida').value;

  let listaFiltrada = historicos.filter(h => {
    const nome = h.morador ? h.morador.nome.toLowerCase() : '';
    const status = h.dtSaida ? 'inativo' : 'ativo';

    if (filtroNome && !nome.includes(filtroNome))
      return false;

    if (filtroStatus && status !== filtroStatus)
      return false;

    if (filtroEntrada && h.dtEntrada !== filtroEntrada)
      return false;

    if (filtroSaida) {
      if (!h.dtSaida || h.dtSaida !== filtroSaida)
        return false;
    }

    return true;
  });

  listaFiltrada = listaFiltrada.sort((a, b) => comparar(a, b, ordenacaoAtual.chave, ordenacaoAtual.direcao));

  renderizarHistoricos(listaFiltrada);
}

function abrirFiltros() {
  const painel = document.getElementById('filtroHistorico');
  if (painel)
    painel.hidden = false;
}

function fecharFiltros() {
  const painel = document.getElementById('filtroHistorico');
  if (painel)
    painel.hidden = true;
}

function limparFiltros() {
  document.getElementById('filtroNome').value = '';
  document.getElementById('filtroStatus').value = '';
  document.getElementById('filtroEntrada').value = '';
  document.getElementById('filtroSaida').value = '';
  aplicarFiltros();
}

function salvarHistorico(event) {
  event.preventDefault();

  const id = document.getElementById('idHistoricoMorador').value;
  const idMorador = document.getElementById('idMorador').value;
  const dtEntrada = document.getElementById('dtEntrada').value;
  const dtSaida = document.getElementById('dtSaida').value;

  if (!idMorador) {
    exibirMensagem('error', 'Selecione um morador.');
    return;
  }

  if (!dtEntrada) {
    exibirMensagem('error', 'Informe a data de entrada.');
    return;
  }

  if (dtSaida && dtSaida <= dtEntrada) {
    exibirMensagem('error', 'A data de saída deve ser posterior à data de entrada.');
    return;
  }

  let url;
  let method;

  if (id) {
    url = `${URL}/${id}?idMorador=${idMorador}&dtEntrada=${dtEntrada}`;
    method = 'PUT';
  } else {
    url = `${URL}/cadastrar?idMorador=${idMorador}&dtEntrada=${dtEntrada}`;
    method = 'POST';
  }

  if (dtSaida)
    url += `&dtSaida=${dtSaida}`;

  fetch(url, { method })
      .then(response => response.json().then(data => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          const msg = data.descricao || data.title || data.error || 'Não foi possível salvar o histórico. Tente novamente.';
          exibirMensagem('error', msg);
        } else {
          exibirMensagem('success', id ? 'Histórico atualizado com sucesso!' : 'Histórico cadastrado com sucesso!');
          carregarHistoricos();
          esconderFormulario();
        }
      })
      .catch(error => {
        console.error('Erro ao salvar histórico:', error);
        exibirMensagem('error', 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
      });
}

function editarHistorico(historico) {
  document.getElementById('idHistoricoMorador').value = historico.idHistoricoMorador;
  document.getElementById('idMorador').value = historico.morador ? historico.morador.idMorador : '';
  document.getElementById('dtEntrada').value = historico.dtEntrada;
  document.getElementById('dtSaida').value = historico.dtSaida || '';

  mostrarFormulario('Editar Histórico');
}

function deletarHistorico(id) {
  if (confirm('Tem certeza que deseja excluir este histórico?')) {
    fetch(`${URL}/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
          if (data && data.error)
            exibirMensagem('error', data.error);
          else {
            exibirMensagem('success', 'Histórico excluído com sucesso!');
            carregarHistoricos();
          }
        })
        .catch(error => console.error('Erro ao deletar histórico:', error));
  }
}

function retornarHistorico(historico) {
  if (confirm('Deseja realmente retornar a entrada para o estado de ativa? Isso apagará a data de saída.')) {
    const url = `${URL}/${historico.idHistoricoMorador}?idMorador=${historico.morador.idMorador}&dtEntrada=${historico.dtEntrada}`;
    
    fetch(url, { method: 'PUT' })
      .then(response => response.json().then(data => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          const msg = data.descricao || data.title || data.error || 'Não foi possível retornar o histórico. Tente novamente.';
          exibirMensagem('error', msg);
        } else {
          exibirMensagem('success', 'Histórico retornado para o estado ativo com sucesso!');
          carregarHistoricos();
        }
      })
      .catch(error => {
        console.error('Erro ao retornar histórico:', error);
        exibirMensagem('error', 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
      });
  }
}

function mostrarFormulario(titulo = 'Cadastrar Novo Histórico') {
  esconderFinalizarForm();
  document.getElementById('formTitle').textContent = titulo;
  document.getElementById('formContainer').style.display = 'block';
}

function esconderFormulario() {
  document.getElementById('formContainer').style.display = 'none';
  document.getElementById('historicoForm').reset();
  document.getElementById('idHistoricoMorador').value = '';
}

function abrirFinalizarHistorico(historico) {
  esconderFormulario();
  document.getElementById('finIdHistoricoMorador').value = historico.idHistoricoMorador;
  document.getElementById('finIdMorador').value = historico.morador.idMorador;
  document.getElementById('finNomeMorador').value = historico.morador.nome;
  document.getElementById('finDtEntradaHidden').value = historico.dtEntrada;
  document.getElementById('finDtEntrada').value = formatarData(historico.dtEntrada);
  document.getElementById('finDtSaida').value = '';

  document.getElementById('finalizarContainer').style.display = 'block';
}

function esconderFinalizarForm() {
  document.getElementById('finalizarContainer').style.display = 'none';
  document.getElementById('finalizarForm').reset();
}

function salvarFinalizarHistorico(event) {
  event.preventDefault();

  const id = document.getElementById('finIdHistoricoMorador').value;
  const idMorador = document.getElementById('finIdMorador').value;
  const dtEntrada = document.getElementById('finDtEntradaHidden').value;
  const dtSaida = document.getElementById('finDtSaida').value;

  if (!dtSaida) {
    exibirMensagem('error', 'Informe a data de saída para concluir.');
    return;
  }

  if (dtSaida <= dtEntrada) {
    exibirMensagem('error', 'A data de saída deve ser posterior à data de entrada.');
    return;
  }

  const url = `${URL}/${id}?idMorador=${idMorador}&dtEntrada=${dtEntrada}&dtSaida=${dtSaida}`;

  fetch(url, { method: 'PUT' })
      .then(response => response.json().then(data => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          const msg = data.descricao || data.title || data.error || 'Não foi possível concluir o histórico. Tente novamente.';
          exibirMensagem('error', msg);
        } else {
          exibirMensagem('success', 'Histórico concluído com sucesso!');
          carregarHistoricos();
          esconderFinalizarForm();
        }
      })
      .catch(error => {
        console.error('Erro ao finalizar histórico:', error);
        exibirMensagem('error', 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
      });
}

function configurarEventosTabela() {
  document.querySelectorAll(".sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const chave = th.dataset.sortKey;
      if (!chave) return;
      if (ordenacaoAtual.chave === chave) {
        ordenacaoAtual.direcao = ordenacaoAtual.direcao === "asc" ? "desc" : "asc";
      } else {
        ordenacaoAtual.chave = chave;
        ordenacaoAtual.direcao = "asc";
      }
      aplicarFiltros();
    });
  });
}

document.addEventListener("DOMContentLoaded", configurarEventosTabela);
carregarMoradores(carregarHistoricos);