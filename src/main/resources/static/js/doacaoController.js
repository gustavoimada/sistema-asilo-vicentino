let doacoes = [];
let doacaoPendenteExclusao = null;
let ordenacaoAtual = { chave: "status", direcao: "desc" };

function somenteDigitos(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function escaparHtml(valor) {
  return String(valor == null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatarCpf(valor) {
  const numeros = somenteDigitos(valor).slice(0, 11);
  return numeros
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function obterNomeDoador(doacao) {
  let nome = "";
  let cpfDoador = "";

  if (doacao != null) {
    if (doacao.nomeDoador != null) {
      nome = String(doacao.nomeDoador).trim();
    }

    if (nome === "" && doacao.nome != null) {
      nome = String(doacao.nome).trim();
    }

    if (nome === "" && doacao.doadorNome != null) {
      nome = String(doacao.doadorNome).trim();
    }

    if (doacao.cpfDoador != null) {
      cpfDoador = String(doacao.cpfDoador).trim();
    }
  }

  if (nome !== "") return nome;
  if (cpfDoador === "") return "Anônimo";
  return "Não informado";
}

function formatarStatus(status) {
  const valor = String(status || "").trim();
  if (valor === "Em_Analise") return "Em análise";
  if (valor === "Concluida") return "Concluída";
  return valor || "-";
}

function classeStatusDoacao(status) {
  return String(status || "").trim() === "Concluida" ? "concluida" : "analise";
}

function formatarDataDoacao(data) {
  if (!data) return "";
  const texto = String(data).trim();
  const partes = texto.slice(0, 10).split("-");
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  const valorData = new Date(data);
  if (Number.isNaN(valorData.getTime())) return "";
  return valorData.toLocaleDateString("pt-BR");
}

function formatarValorDoacao(doacao) {
  const valor = Number(doacao?.valor);
  if (Number.isNaN(valor)) return "";
  const tipo = normalizarTexto(doacao?.tipo || doacao?.tipoDoacaoNome || "");

  if (tipo === "patrimônio" || tipo === "patrimonio") {
    return "";
  }
  if (tipo === "alimento") {
    return `${valor.toFixed(2).replace(/\.?0+$/, "")}kg`;
  }
  return `R$${valor.toFixed(2)}`;
}

function validarCpf(cpf) {
  const valor = somenteDigitos(cpf);
  if (valor.length !== 11 || /(\d)\1{10}/.test(valor)) return false;
  let soma = 0;
  let peso = 10;
  for (let i = 0; i < 9; i += 1) soma += Number(valor[i]) * peso--;
  let digito1 = 11 - (soma % 11);
  if (digito1 >= 10) digito1 = 0;
  soma = 0;
  peso = 11;
  for (let i = 0; i < 10; i += 1) soma += Number(valor[i]) * peso--;
  let digito2 = 11 - (soma % 11);
  if (digito2 >= 10) digito2 = 0;
  return digito1 === Number(valor[9]) && digito2 === Number(valor[10]);
}

function el(id) { return document.getElementById(id); }

function preencherPerfilTopo() {
  const nome = (localStorage.getItem("funcionarioNome") || localStorage.getItem("usuarioNome") || "Usuário").trim();
  const categoria = (localStorage.getItem("funcionarioCategoria") || "").trim();
  let cargoTexto = "Acesso";

  if (categoria) cargoTexto = formatarCargoInclusivo(categoria);

  if (el("perfilNome")) el("perfilNome").textContent = nome || "Usuário";
  if (el("perfilCargo")) el("perfilCargo").textContent = cargoTexto;
}

function formatarCargoInclusivo(categoria) {
  const valor = String(categoria || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  if (valor === "coordenador") return "Coordenador(a)";
  if (valor === "cuidador") return "Cuidador(a)";
  if (valor === "secretaria") return "Secretária";
  return String(categoria || "").trim();
}

function showToast(tipo, mensagem) {
  const toast = el("mensagem-feedback");
  if (!toast) return;
  toast.className = `popup-msg ${tipo}`;
  toast.textContent = mensagem;
  toast.classList.add("show");
  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(function () { toast.classList.remove("show"); }, 3200);
}

function togglePainel(id, abrir) {
  const painel = el(id);
  if (!painel) return;
  painel.hidden = !abrir;
}

function limparFormulario() {
  el("doacaoId").value = "";
  el("valor").value = "";
  el("tipoDoacaoId").value = "2";
  el("cpfDoador").value = "";
  el("nomeDoador").value = "";
  el("dtDoacao").value = "";
  el("observacoes").value = "";
  el("formTitulo").textContent = "Cadastrar Nova Doação";
  el("salvarBtn").innerHTML = '<span class="material-symbols-outlined">save</span>Salvar Doação';
  atualizarCampoValor("Financeiro");
}

function atualizarIndicadoresOrdenacao() {
  document.querySelectorAll(".sortable").forEach((th) => {
    const indicador = th.querySelector(".sort-indicator");
    const ativa = th.dataset.sortKey === ordenacaoAtual.chave;
    th.classList.toggle("is-active", ativa);
    if (indicador) {
      indicador.textContent = ativa ? (ordenacaoAtual.direcao === "asc" ? "^" : "v") : "";
    }
  });
}

function comparar(a, b, chave, direcao) {
  const valorA = String(a[chave] || "").toLowerCase();
  const valorB = String(b[chave] || "").toLowerCase();
  if (valorA < valorB) return direcao === "asc" ? -1 : 1;
  if (valorA > valorB) return direcao === "asc" ? 1 : -1;
  return 0;
}

function parseJsonSegura(response) {
  return response.json().catch(function () { return {}; });
}

function renderizarTabela() {
  const corpo = el("tabelaDoacoes");
  if (!corpo) return;
  atualizarIndicadoresOrdenacao();
  const filtroValor = el("filtroValor")?.value;
  const filtroTipo = normalizarTexto(el("filtroTipo")?.value);
  const filtroNome = normalizarTexto(el("filtroNome")?.value);
  const filtroCpf = somenteDigitos(el("filtroCpf")?.value || "");
  const filtroDataInicio = el("filtroDataInicio")?.value;
  const filtroDataFim = el("filtroDataFim")?.value;
  let dados = doacoes.filter((item) => {
    const tipoItem = normalizarTexto(item.tipo || item.tipoDoacaoNome);
    const nomeItem = normalizarTexto(obterNomeDoador(item));
    let bateValor = !filtroValor || Number(item.valor) === Number(filtroValor);
    let bateTipo = !filtroTipo || tipoItem === filtroTipo;
    let bateNome = !filtroNome || nomeItem.includes(filtroNome);
    let bateCpf = !filtroCpf || somenteDigitos(item.cpfDoador).includes(filtroCpf);
    let bateData = true;
    if ((filtroDataInicio || filtroDataFim) && item.dtDoacao) {
      const dataItem = String(item.dtDoacao).slice(0, 10);
      bateData = (!filtroDataInicio || dataItem >= filtroDataInicio) && (!filtroDataFim || dataItem <= filtroDataFim);
    } else if ((filtroDataInicio || filtroDataFim) && !item.dtDoacao) {
      bateData = false;
    }
    return bateValor && bateTipo && bateNome && bateCpf && bateData;
  });
  dados = dados.sort((a, b) => comparar(a, b, ordenacaoAtual.chave, ordenacaoAtual.direcao));
  if (dados.length === 0) {
    corpo.innerHTML = '<tr><td colspan="6" class="empty-row">Nenhuma doação encontrada.</td></tr>';
    return;
  }
  var html = "";
  for (var i = 0; i < dados.length; i++) {
    var doacao = dados[i];
    const nomeDoador = obterNomeDoador(doacao);
    const estaConcluida = doacao.status === "Concluida";
    const valorFormatado = formatarValorDoacao(doacao) || "-";
    const tipoBruto = doacao.tipoDoacaoNome || doacao.tipo;
    const tipoFormatado = tipoBruto && typeof window.formatarTituloLegivel === "function"
      ? window.formatarTituloLegivel(tipoBruto)
      : (tipoBruto || "Não informado");
    const emailFormatado = doacao.pagEmail || "E-mail não informado";
    const cpfFormatado = formatarCpf(doacao.cpfDoador || "") || "CPF não informado";
    const dataFormatada = formatarDataDoacao(doacao.dtDoacao) || "-";
    const statusFormatado = formatarStatus(doacao.status);
    const classeStatus = classeStatusDoacao(doacao.status);
    const observacaoFormatada = doacao.observacoes || "Sem observações";
    html += `
      <tr>
        <td>
          <div class="doacao-value-cell">
            <strong>${escaparHtml(valorFormatado)}</strong>
            <span class="doacao-type-badge">${escaparHtml(tipoFormatado)}</span>
          </div>
        </td>
        <td>
          <div class="doacao-donor-cell">
            <strong>${escaparHtml(nomeDoador)}</strong>
            <span>${escaparHtml(emailFormatado)}</span>
            <span>${escaparHtml(cpfFormatado)}</span>
          </div>
        </td>
        <td>
          <div class="doacao-date-cell">
            <strong>${escaparHtml(dataFormatada)}</strong>
          </div>
        </td>
        <td><span class="doacao-status-badge ${classeStatus}">${escaparHtml(statusFormatado)}</span></td>
        <td>
          <div class="doacao-note-cell">
            <span>${escaparHtml(observacaoFormatada)}</span>
          </div>
        </td>
        <td class="text-right">
          <div class="acoes">
            ${estaConcluida ? `
            <button type="button" class="action-icon-btn edit" data-action="retornar-analise" data-id="${doacao.idDoacao}" title="Retornar para análise">
              <span class="material-symbols-outlined">undo</span>
            </button>` : `
            <button type="button" class="action-icon-btn edit" data-action="concluir" data-id="${doacao.idDoacao}" title="Concluir análise">
              <span class="material-symbols-outlined">check_circle</span>
            </button>
            <button type="button" class="action-icon-btn edit" data-action="editar" data-id="${doacao.idDoacao}" title="Editar">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button type="button" class="action-icon-btn delete" data-action="deletar" data-id="${doacao.idDoacao}" title="Excluir">
              <span class="material-symbols-outlined">delete</span>
            </button>`}
          </div>
        </td>
      </tr>
    `;
  }
  corpo.innerHTML = html;
}

function carregarDoacoes() {
  const corpo = el("tabelaDoacoes");
  if (corpo) corpo.innerHTML = '<tr><td colspan="6" class="empty-row">Carregando doações...</td></tr>';
  return fetch("/doacao/listar")
    .then(function (response) {
      return parseJsonSegura(response).then(function (body) {
        return { response: response, body: body };
      });
    })
    .then(function (resultado) {
      if (!resultado.response.ok || !Array.isArray(resultado.body)) {
        if (Array.isArray(resultado.body) && resultado.body.length === 0) {
          doacoes = [];
          renderizarTabela();
          return;
        }
        throw new Error();
      }

      doacoes = [];
      for (var i = 0; i < resultado.body.length; i++) {
        var d = resultado.body[i];
        doacoes.push({
          idDoacao: d.idDoacao,
          valor: d.valor,
          tipoDoacaoId: d.tipoDoacaoId,
          tipo: d.tipo,
          tipoDoacaoNome: d.tipo || "",
          nomeDoador: d.nomeDoador || "",
          cpfDoador: d.cpfDoador,
          pagEmail: d.pag_email || d.pagEmail || "",
          dtDoacao: d.dtDoacao,
          observacoes: d.observacoes,
          status: d.status
        });
      }
      renderizarTabela();
    })
    .catch(function () {
      if (corpo) corpo.innerHTML = '<tr><td colspan="6" class="empty-row">Nenhuma doação encontrada.</td></tr>';
    });
}

function salvarDoacao(event) {
  event.preventDefault();
  const id = el("doacaoId")?.value || "";
  const tipoDoacaoId = el("tipoDoacaoId")?.value || "";
  let tipo = "";
  if (tipoDoacaoId === "1") tipo = "Patrimônio";
  else if (tipoDoacaoId === "2") tipo = "Financeiro";
  else if (tipoDoacaoId === "3") tipo = "Alimento";
  const valor = (tipo === "Patrimônio") ? 0 : parseFloat(el("valor")?.value || "0");
  const cpfDoador = el("cpfDoador")?.value || "";
  const nomeDoador = el("nomeDoador")?.value || "";
  let dtDoacao = el("dtDoacao")?.value || "";
  const observacoes = el("observacoes")?.value || "";
  if (tipo !== "Patrimônio" && (!valor || valor <= 0)) { showToast("error", "Valor da doação é obrigatório."); el("valor")?.focus(); return; }
  if (tipo === "Patrimônio" && !observacoes.trim()) { showToast("error", "Observações são obrigatórias para patrimônio."); el("observacoes")?.focus(); return; }
  if (!tipo) { showToast("error", "Tipo de doação é obrigatório."); el("tipoDoacaoId")?.focus(); return; }
  if (cpfDoador && !validarCpf(cpfDoador)) { showToast("error", "CPF do doador inválido."); el("cpfDoador")?.focus(); return; }
  if (dtDoacao) {
    dtDoacao = dtDoacao + " 00:00:00";
  }
  const params = new URLSearchParams({ id, valor, tipo, cpfDoador, nomeDoador, dtDoacao, observacoes });
  let request;
  if (!id) {
    const createParams = new URLSearchParams({ valor, tipo, cpfDoador, nomeDoador, dtDoacao, observacoes });
    request = fetch(`/doacao/cadastrar?${createParams.toString()}`, { method: "POST" });
  } else {
    request = fetch(`/doacao/${id}?${params.toString()}`, { method: "PUT" });
  }

  return request
    .then(function (response) {
      return parseJsonSegura(response).then(function (body) {
        return { response: response, body: body };
      });
    })
    .then(function (resultado) {
      if (!resultado.response.ok) {
        showToast("error", resultado.body.descricao || resultado.body.title || "Não foi possível salvar a doação.");
        return;
      }
      showToast("success", id ? "Doação atualizada com sucesso." : "Doação cadastrada com sucesso.");
      limparFormulario();
      togglePainel("cadastroDoacao", false);
      return carregarDoacoes();
    })
    .catch(function () {
      showToast("error", "Servidor indisponível no momento.");
    });
}

function abrirParaEditar(id) {
  const doacao = doacoes.find((item) => Number(item.idDoacao) === Number(id));
  if (!doacao) { showToast("error", "Doação não encontrada."); return; }
  el("doacaoId").value = doacao.idDoacao;
  let tipoVal = "";
  if (el("tipoDoacaoId")) {
    if (doacao.tipoDoacaoNome === "Patrimônio") { el("tipoDoacaoId").value = "1"; tipoVal = "Patrimônio"; }
    else if (doacao.tipoDoacaoNome === "Financeiro") { el("tipoDoacaoId").value = "2"; tipoVal = "Financeiro"; }
    else if (doacao.tipoDoacaoNome === "Alimento") { el("tipoDoacaoId").value = "3"; tipoVal = "Alimento"; }
    else el("tipoDoacaoId").value = "";
  }
  atualizarCampoValor(tipoVal);
  if (tipoVal !== "Patrimônio") el("valor").value = doacao.valor;
  el("cpfDoador").value = doacao.cpfDoador || "";
  el("nomeDoador").value = doacao.nomeDoador || "";
  if (el("dtDoacao")) {
    if (doacao.dtDoacao) {
      el("dtDoacao").value = String(doacao.dtDoacao).slice(0, 10);
    } else {
      el("dtDoacao").value = "";
    }
  }
  el("observacoes").value = doacao.observacoes || "";
  el("formTitulo").textContent = "Editar Doação";
  el("salvarBtn").innerHTML = '<span class="material-symbols-outlined">save</span>Salvar Alteração';
  togglePainel("cadastroDoacao", true);
  if (tipoVal !== "Patrimônio") el("valor").focus();
}

function concluirAnalise(id) {
  return fetch(`/doacao/${id}/concluir`, { method: "PUT" })
    .then(function (response) {
      return parseJsonSegura(response).then(function (body) {
        return { response: response, body: body };
      });
    })
    .then(function (resultado) {
      if (!resultado.response.ok) {
        showToast("error", resultado.body.descricao || resultado.body.title || "Não foi possível concluir a análise.");
        return;
      }
      showToast("success", "Análise da doação concluída.");
      return carregarDoacoes();
    })
    .catch(function () {
      showToast("error", "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
    });
}

function retornarAnalise(id) {
  return fetch(`/doacao/${id}/retornar-analise`, { method: "PUT" })
    .then(function (response) {
      return parseJsonSegura(response).then(function (body) {
        return { response: response, body: body };
      });
    })
    .then(function (resultado) {
      if (!resultado.response.ok) {
        showToast("error", resultado.body.descricao || resultado.body.title || "Não foi possível retornar a doação para análise.");
        return;
      }
      showToast("success", "Doação retornada para análise.");
      return carregarDoacoes();
    })
    .catch(function () {
      showToast("error", "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
    });
}



function solicitarExclusao(id) {
  const doacao = doacoes.find((item) => Number(item.idDoacao) === Number(id));
  if (!doacao) { showToast("error", "Doação não encontrada."); return; }
  doacaoPendenteExclusao = doacao;
  el("textoConfirmacao").textContent = `Deseja realmente excluir esta doação de valor R$ ${Number(doacao.valor).toFixed(2)}?`;
  el("painelConfirmacao").classList.add("show");
}

function confirmarExclusao() {
  if (!doacaoPendenteExclusao) return;
  const id = doacaoPendenteExclusao.idDoacao;
  return fetch(`/doacao/${id}?id=${id}`, { method: "DELETE" })
    .then(function (response) {
      return parseJsonSegura(response).then(function (body) {
        return { response: response, body: body };
      });
    })
    .then(function (resultado) {
      if (!resultado.response.ok) {
        showToast("error", resultado.body.descricao || resultado.body.title || "Não foi possível excluir.");
        return;
      }
      el("painelConfirmacao").classList.remove("show");
      doacaoPendenteExclusao = null;
      showToast("success", "Doação excluída com sucesso.");
      return carregarDoacoes();
    })
    .catch(function () {
      showToast("error", "Servidor indisponível no momento.");
    });
}


function atualizarCampoValor(tipo) {
  const label = el("valorLabel");
  const input = el("valor");
  if (!label || !input) return;
  const tipoNorm = String(tipo || "").trim().toLowerCase();
  if (tipoNorm === "financeiro") {
    label.textContent = "Valor (R$):";
    input.disabled = false;
    input.placeholder = "Ex: 100.00";
    if (input.value === "0" || input.value === "0.00") input.value = "";
  } else if (tipoNorm === "alimento") {
    label.textContent = "Quantidade (kg):";
    input.disabled = false;
    input.placeholder = "Ex: 5.00";
    if (input.value === "0" || input.value === "0.00") input.value = "";
  } else if (tipoNorm === "patrimônio" || tipoNorm === "patrimonio") {
    label.textContent = "Valor:";
    input.value = "0";
    input.disabled = true;
  } else {
    label.textContent = "Valor";
    input.disabled = false;
    input.placeholder = "Ex: 100.00";
  }
}

function configurarEventos() {
  el("doacaoForm")?.addEventListener("submit", salvarDoacao);
  el("abrirCadastroDoacao")?.addEventListener("click", () => { limparFormulario(); togglePainel("cadastroDoacao", true); });
  el("fecharCadastroDoacao")?.addEventListener("click", () => togglePainel("cadastroDoacao", false));
  el("abrirFiltrosDoacao")?.addEventListener("click", () => togglePainel("filtroDoacao", true));
  el("fecharFiltrosDoacao")?.addEventListener("click", () => togglePainel("filtroDoacao", false));
  el("tipoDoacaoId")?.addEventListener("change", () => {
    const sel = el("tipoDoacaoId");
    let nomeAtual = "";
    if (sel.value === "1") nomeAtual = "Patrimônio";
    else if (sel.value === "2") nomeAtual = "Financeiro";
    else if (sel.value === "3") nomeAtual = "Alimento";
    atualizarCampoValor(nomeAtual);
  });
  el("limparFiltros")?.addEventListener("click", () => {
    el("filtroValor").value = "";
    el("filtroTipo").value = "";
    el("filtroNome").value = "";
    el("filtroCpf").value = "";
    el("filtroDataInicio").value = "";
    el("filtroDataFim").value = "";
    renderizarTabela();
  });
  el("filtroValor")?.addEventListener("input", renderizarTabela);
  el("filtroTipo")?.addEventListener("change", renderizarTabela);
  el("filtroNome")?.addEventListener("input", renderizarTabela);
  el("filtroCpf")?.addEventListener("input", (event) => {
    event.target.value = formatarCpf(event.target.value);
    renderizarTabela();
  });
  el("filtroDataInicio")?.addEventListener("input", renderizarTabela);
  el("filtroDataFim")?.addEventListener("input", renderizarTabela);
  el("cpfDoador")?.addEventListener("input", (event) => {
    event.target.value = formatarCpf(event.target.value);
  });
  el("tabelaDoacoes")?.addEventListener("click", (event) => {
    const botao = event.target.closest("button[data-action]");
    if (!botao) return;
    const id = botao.dataset.id;
    if (botao.dataset.action === "concluir") concluirAnalise(id);
    if (botao.dataset.action === "retornar-analise") retornarAnalise(id);
    if (botao.dataset.action === "editar") abrirParaEditar(id);
    if (botao.dataset.action === "deletar") solicitarExclusao(id);
  });
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
      renderizarTabela();
    });
  });
  el("confirmarExclusao")?.addEventListener("click", confirmarExclusao);
  el("cancelarExclusao")?.addEventListener("click", () => {
    el("painelConfirmacao").classList.remove("show");
    doacaoPendenteExclusao = null;
  });
}
document.addEventListener("DOMContentLoaded", configurarEventos);
document.addEventListener("DOMContentLoaded", preencherPerfilTopo);

