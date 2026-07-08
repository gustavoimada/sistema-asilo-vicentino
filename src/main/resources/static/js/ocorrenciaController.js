const estadoOcorrencia = {
  funcionario: null,
  turnoAtivo: null,
  idFuncionarioContexto: 0,
  idUserContexto: 0,
  nomeUsuarioContexto: "",
  nomeFuncionarioContexto: "",
  categoriaContexto: "",
  tiposOcorrencia: [],
  moradores: [],
  cuidadores: [],
  ocorrencias: [],
  idOcorrenciaEmEdicao: null,
  idOcorrenciaPendenteExclusao: null
};

let ordenacaoOcorrencia = { chave: "data", direcao: "desc" };
let filtrosOcorrencia = { tipo: "", morador: "", cuidador: "", dataInicial: "", dataFinal: "", gravidade: "" };

function elOcorrencia(id)
{
  return document.getElementById(id);
}

function carregarContextoUrlOcorrencia()
{
  const params = new URLSearchParams(window.location.search);
  const parametrosContexto = ["idFuncionario", "idUser", "usuarioNome", "funcionarioNome", "categoria"];
  const tinhaContexto = parametrosContexto.some(function (chave) {
    return params.has(chave);
  });
  estadoOcorrencia.idFuncionarioContexto = Number(params.get("idFuncionario") || 0);
  estadoOcorrencia.idUserContexto = Number(params.get("idUser") || 0);
  estadoOcorrencia.nomeUsuarioContexto = String(params.get("usuarioNome") || "").trim();
  estadoOcorrencia.nomeFuncionarioContexto = String(params.get("funcionarioNome") || "").trim();
  estadoOcorrencia.categoriaContexto = String(params.get("categoria") || "").trim();

  if (!tinhaContexto || !window.history || typeof window.history.replaceState !== "function")
{
    return;
  }

  parametrosContexto.forEach(function (chave) {
    params.delete(chave);
  });
  const queryRestante = params.toString();
  window.history.replaceState({}, document.title, window.location.pathname + (queryRestante ? `?${queryRestante}` : "") + window.location.hash);
}

function parseJsonSeguroOcorrencia(response)
{
  return response.json().catch (function ()
{
    return {};
  });
}

function obterNomeUsuarioOcorrencia()
{
  return String(estadoOcorrencia.nomeUsuarioContexto || "").trim();
}

function obterNomeFuncionarioOcorrencia()
{
  return String(estadoOcorrencia.nomeFuncionarioContexto || "").trim();
}

function obterIdFuncionarioOcorrencia()
{
  const id = Number(estadoOcorrencia.idFuncionarioContexto || 0);
  if (!Number.isInteger(id) || id <= 0) return "";
  return String(id);
}

function obterIdUsuarioOcorrencia()
{
  const id = Number(estadoOcorrencia.idUserContexto || 0);
  if (!Number.isInteger(id) || id <= 0) return "";
  return String(id);
}

function montarParamsOcorrencia()
{
  return new URLSearchParams();
}

function atualizarLinksContextoOcorrencia()
{
  const linkPainel = document.querySelector('.sidebar-nav a.sidebar-link[href*="cuidador.html"]');
  const linkOcorrencia = document.querySelector('.sidebar-nav a.sidebar-link[href*="ocorrencia.html"]');

  if (linkPainel)
{
    linkPainel.setAttribute("href", "cuidador.html");
  }

  if (linkOcorrencia)
{
    linkOcorrencia.setAttribute("href", "ocorrencia.html");
  }
}

function persistirFuncionarioOcorrencia(funcionario)
{
  if (!funcionario) return;

  if (funcionario.idFuncionario != null && Number(funcionario.idFuncionario) > 0)
{
    estadoOcorrencia.idFuncionarioContexto = Number(funcionario.idFuncionario);
  }

  if (funcionario.nome != null && String(funcionario.nome).trim() !== "")
{
    estadoOcorrencia.nomeFuncionarioContexto = String(funcionario.nome).trim();
  }

  if (funcionario.categoria != null && String(funcionario.categoria).trim() !== "")
{
    estadoOcorrencia.categoriaContexto = String(funcionario.categoria).trim();
  }

  atualizarLinksContextoOcorrencia();
}

function obterCargoPerfilOcorrencia()
{
  const categoria = (estadoOcorrencia.funcionario?.categoria || estadoOcorrencia.categoriaContexto || "").trim();
  if (categoria) return formatarCargoInclusivoOcorrencia(categoria);

  return "Acesso";
}

function formatarCargoInclusivoOcorrencia(categoria)
{
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

function atualizarTopoPerfilOcorrencia()
{
  const nome = estadoOcorrencia.funcionario?.nome || obterNomeFuncionarioOcorrencia() || obterNomeUsuarioOcorrencia() || "Usuario";
  const cargo = obterCargoPerfilOcorrencia();

  if (elOcorrencia("perfilNome")) elOcorrencia("perfilNome").textContent = nome;
  if (elOcorrencia("perfilCargo")) elOcorrencia("perfilCargo").textContent = cargo;
  atualizarLinksContextoOcorrencia();
}

function mostrarMensagemOcorrencia(tipo, mensagem)
{
  const toast = elOcorrencia("mensagem-feedback");
  if (!toast)
{
    window.alert(mensagem);
    return;
  }

  toast.className = `popup-msg ${tipo}`;
  toast.textContent = mensagem;
  toast.classList.add("show");

  window.clearTimeout(mostrarMensagemOcorrencia._timer);
  mostrarMensagemOcorrencia._timer = window.setTimeout(function () {
    toast.classList.remove("show");
  }, 3200);
}

function definirVisibilidadeConteudoOcorrencia(visivel)
{
  const conteudo = document.querySelector(".ocorrencia-page .content");
  if (conteudo)
{
    conteudo.hidden = !visivel;
  }
}

function obterOuCriarModalTurnoInativoOcorrencia()
{
  let modal = document.getElementById("avisoTurnoOcorrenciaModal");
  if (modal == null)
{
    modal = document.createElement("div");
    modal.id = "avisoTurnoOcorrenciaModal";
    modal.className = "confirm-overlay";
    modal.innerHTML = `
      <div class="confirm-box">
        <h4>Turno inativo</h4>
        <p id="avisoTurnoOcorrenciaTexto"></p>
        <div class="confirm-actions">
          <button type="button" class="btn btn-primary" id="avisoTurnoOcorrenciaOk">Ir para iniciar turno</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  return modal;
}

function exibirAvisoSemTurnoAtivoOcorrencia()
{
  const modal = obterOuCriarModalTurnoInativoOcorrencia();
  const texto = document.getElementById("avisoTurnoOcorrenciaTexto");
  const botaoOk = document.getElementById("avisoTurnoOcorrenciaOk");

  if (texto != null)
{
    texto.textContent = "Voce nao esta com turno ativo. Volte ao painel inicial para iniciar o turno.";
  }

  modal.classList.add("show");

  if (botaoOk == null)
{
    return Promise.resolve();
  }

  return new Promise(function (resolve) {
    botaoOk.onclick = function () {
      modal.classList.remove("show");
      resolve();
    };
  });
}

function obterTurnoAtivoDaRespostaOcorrencia(data)
{
  if (!data || typeof data !== "object") return null;
  if (data.turnoAtivo && typeof data.turnoAtivo === "object") return data.turnoAtivo;
  if (data.idTurnos != null) return data;
  return null;
}

async function garantirTurnoAtivoNoCarregamentoOcorrencia()
{
  try {
    const response = await fetch("/turno/resumo-ativo");
    if (response.ok)
    {
      const data = await response.json().catch(function () {
        return null;
      });
      const turnoAtivo = obterTurnoAtivoDaRespostaOcorrencia(data);
      if (turnoAtivo)
      {
        estadoOcorrencia.turnoAtivo = turnoAtivo;
        return true;
      }
    }
  } catch (e)
  {
    // segue fluxo de aviso
  }

  estadoOcorrencia.turnoAtivo = null;
  await exibirAvisoSemTurnoAtivoOcorrencia();
  window.location.href = "cuidador.html";
  return false;
}

function escaparHtmlOcorrencia(valor)
{
  return String(valor || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatarCpfOcorrencia(valor)
{
  const numeros = String(valor || "").replace(/\D/g, "").slice(0, 11);
  if (numeros.length !== 11) return valor || "-";
  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
}

function formatarDataOcorrencia(data)
{
  if (!data) return "-";
  try {
    return new Date(data).toLocaleDateString("pt-BR");
  } catch (e)
{
    return "-";
  }
}

function formatarHoraOcorrencia(data)
{
  if (!data) return "-";
  try {
    return new Date(data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch (e)
{
    return "-";
  }
}

function obterChaveDataLocalOcorrencia(data)
{
  if (!data) return "";
  const dataConvertida = new Date(data);
  if (Number.isNaN(dataConvertida.getTime())) return "";

  const ano = dataConvertida.getFullYear();
  const mes = String(dataConvertida.getMonth() + 1).padStart(2, "0");
  const dia = String(dataConvertida.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function classeTipoOcorrencia(item)
{
  const gravidade = Number(item?.tipoOcorrencia?.gravidade || 0);
  if (gravidade === 1) return "baixa";
  if (gravidade === 2) return "media";
  return "alta";
}

function padronizarItemOcorrencia(item)
{
  if (!item || typeof item !== "object") return null;
  const ocorrencia = { ...item };
  ocorrencia.moradoresEnvolvidos = Array.isArray(ocorrencia.moradoresEnvolvidos) ? ocorrencia.moradoresEnvolvidos : [];
  return ocorrencia;
}

function renderMoradoresEnvolvidosOcorrencia(item)
{
  const moradores = Array.isArray(item.moradoresEnvolvidos) ? item.moradoresEnvolvidos : [];
  if (!moradores.length)
{
    return '<span class="morador-chip">Nenhum</span>';
  }

  let chips = "";
  for (let i = 0; i < moradores.length; i += 1)
{
    const morador = moradores[i];
    const nome = morador.nome || `Morador #${morador.idMorador}`;
    chips += `<span class="morador-chip">${escaparHtmlOcorrencia(nome)}</span>`;
  }

  return `<div class="moradores-envolvidos">${chips}</div>`;
}

function preencherTiposOcorrencia()
{
  const selectCadastro = elOcorrencia("tipoOcorrencia");
  const selectFiltro = elOcorrencia("filtroTipo");
  if (!selectCadastro) return;

  selectCadastro.innerHTML = '<option value="">Selecione</option>';
  if (selectFiltro)
{
    selectFiltro.innerHTML = '<option value="">Todos</option>';
  }

  for (let i = 0; i < estadoOcorrencia.tiposOcorrencia.length; i += 1)
{
    const tipo = estadoOcorrencia.tiposOcorrencia[i];

    const optionCadastro = document.createElement("option");
    optionCadastro.value = String(tipo.idOcorrencias);
    optionCadastro.textContent = `${tipo.descricao} (G${tipo.gravidade})`;
    selectCadastro.appendChild(optionCadastro);

    if (selectFiltro)
{
      const optionFiltro = document.createElement("option");
      optionFiltro.value = String(tipo.idOcorrencias);
      optionFiltro.textContent = tipo.descricao;
      selectFiltro.appendChild(optionFiltro);
    }
  }
}

function preencherFiltroMoradorOcorrencia()
{
  const select = elOcorrencia("filtroMorador");
  if (!select) return;

  select.innerHTML = '<option value="">Todos</option>';
  for (let i = 0; i < estadoOcorrencia.moradores.length; i += 1)
{
    const morador = estadoOcorrencia.moradores[i];
    const option = document.createElement("option");
    option.value = String(morador.idMorador);
    option.textContent = morador.nome || `Morador #${morador.idMorador}`;
    select.appendChild(option);
  }
}

function preencherFiltroCuidadorOcorrencia()
{
  const select = elOcorrencia("filtroCuidador");
  if (!select) return;
  const valorAtual = filtrosOcorrencia.cuidador;

  const itens = [];
  if (Array.isArray(estadoOcorrencia.cuidadores) && estadoOcorrencia.cuidadores.length)
{
    for (let i = 0; i < estadoOcorrencia.cuidadores.length; i += 1)
{
      const cuidador = estadoOcorrencia.cuidadores[i];
      const id = Number(cuidador.idFuncionario || 0);
      const nome = String(cuidador.nome || "").trim();
      if (id <= 0 || !nome) continue;
      itens.push({ idFuncionario: id, nome: nome });
    }
  } else
{
    const mapa = new Map();
    for (let i = 0; i < estadoOcorrencia.ocorrencias.length; i += 1)
{
      const funcionario = estadoOcorrencia.ocorrencias[i]?.funcionario;
      if (!funcionario) continue;

      const id = Number(funcionario.idFuncionario || 0);
      const nome = String(funcionario.nome || "").trim();
      if (id <= 0 || !nome) continue;
      mapa.set(id, nome);
    }

    const entradas = Array.from(mapa.entries());
    for (let i = 0; i < entradas.length; i += 1)
{
      itens.push({ idFuncionario: entradas[i][0], nome: entradas[i][1] });
    }
  }

  itens.sort(function (a, b) {
    return a.nome.localeCompare(b.nome, "pt-BR");
  });

  select.innerHTML = '<option value="">Todos</option>';
  for (let i = 0; i < itens.length; i += 1)
{
    const item = itens[i];
    const option = document.createElement("option");
    option.value = String(item.idFuncionario);
    option.textContent = item.nome;
    select.appendChild(option);
  }

  if (valorAtual && select.querySelector(`option[value="${valorAtual}"]`))
{
    select.value = valorAtual;
  }
}

function preencherMoradoresOcorrencia()
{
  const container = elOcorrencia("listaMoradores");
  if (!container) return;

  if (!estadoOcorrencia.moradores.length)
{
    container.innerHTML = '<tr><td colspan="3" class="empty-row">Nenhum morador cadastrado.</td></tr>';
    return;
  }

  let html = "";
  for (let i = 0; i < estadoOcorrencia.moradores.length; i += 1)
{
    const morador = estadoOcorrencia.moradores[i];
    html += `
      <tr>
        <td class="select-col">
          <input type="checkbox" class="morador-check" value="${morador.idMorador}" />
        </td>
        <td>${escaparHtmlOcorrencia(morador.nome || `Morador #${morador.idMorador}`)}</td>
        <td class="cpf-col">${formatarCpfOcorrencia(morador.cpf || "")}</td>
      </tr>
    `;
  }
  container.innerHTML = html;
}

function obterIdsMoradoresSelecionadosOcorrencia()
{
  const selecionados = document.querySelectorAll(".morador-check:checked");
  let texto = "";
  for (let i = 0; i < selecionados.length; i += 1)
{
    if (i > 0) texto += ",";
    texto += selecionados[i].value;
  }
  return texto;
}

function marcarMoradoresSelecionadosOcorrencia(moradores)
{
  const ids = new Set();
  const lista = Array.isArray(moradores) ? moradores : [];
  for (let i = 0; i < lista.length; i += 1)
{
    ids.add(String(lista[i].idMorador));
  }

  const checkboxes = document.querySelectorAll(".morador-check");
  for (let i = 0; i < checkboxes.length; i += 1)
{
    const checkbox = checkboxes[i];
    checkbox.checked = ids.has(String(checkbox.value));
  }
}

function atualizarIndicadoresOrdenacaoOcorrencia()
{
  const cabecalhos = document.querySelectorAll(".sortable");
  for (let i = 0; i < cabecalhos.length; i += 1)
{
    const cabecalho = cabecalhos[i];
    const indicador = cabecalho.querySelector(".sort-indicator");
    const ativa = cabecalho.dataset.sortKey === ordenacaoOcorrencia.chave;
    cabecalho.classList.toggle("is-active", ativa);
    if (indicador)
{
      indicador.textContent = ativa ? (ordenacaoOcorrencia.direcao === "asc" ? "^" : "v") : "";
    }
  }
}

function compararOcorrencias(a, b, chave, direcao)
{
  let valorA = "";
  let valorB = "";

  if (chave === "tipo")
{
    const gravidadeA = Number(a.tipoOcorrencia?.gravidade || 0);
    const gravidadeB = Number(b.tipoOcorrencia?.gravidade || 0);

    if (gravidadeA < gravidadeB) return direcao === "asc" ? -1 : 1;
    if (gravidadeA > gravidadeB) return direcao === "asc" ? 1 : -1;

    valorA = String(a.tipoOcorrencia?.descricao || "").toLowerCase();
    valorB = String(b.tipoOcorrencia?.descricao || "").toLowerCase();
  } else if (chave === "data" || chave === "hora" || chave === "dtOcorrencia")
{
    valorA = new Date(a.dtOcorrencia || 0).getTime();
    valorB = new Date(b.dtOcorrencia || 0).getTime();
  } 
else
{
    valorA = String(a[chave] || "").toLowerCase();
    valorB = String(b[chave] || "").toLowerCase();
  }

  if (valorA < valorB) return direcao === "asc" ? -1 : 1;
  if (valorA > valorB) return direcao === "asc" ? 1 : -1;
  return 0;
}

function renderizarTabelaOcorrencias(ocorrencias)
{
  const corpo = elOcorrencia("tabelaOcorrenciasCadastro");
  if (!corpo) return;

  if (!Array.isArray(ocorrencias) || !ocorrencias.length)
{
    corpo.innerHTML = '<tr><td colspan="7" class="empty-row">Sem ocorrencias cadastradas.</td></tr>';
    return;
  }

  let html = "";
  for (let i = 0; i < ocorrencias.length; i += 1)
{
    const item = ocorrencias[i];
    html += `
      <tr>
        <td>${formatarDataOcorrencia(item.dtOcorrencia)}</td>
        <td>${formatarHoraOcorrencia(item.dtOcorrencia)}</td>
        <td>${escaparHtmlOcorrencia(item.funcionario?.nome || "-")}</td>
        <td><span class="tipo-chip ${classeTipoOcorrencia(item)}">${escaparHtmlOcorrencia(item.tipoOcorrencia?.descricao || "-")}</span></td>
        <td>${renderMoradoresEnvolvidosOcorrencia(item)}</td>
        <td>${escaparHtmlOcorrencia(item.observacoes || "-")}</td>
        <td class="text-right">
          <div class="acoes">
            <button type="button" class="action-icon-btn edit" data-acao="editar" data-id="${item.idOcorrencia}" title="Editar">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button type="button" class="action-icon-btn delete" data-acao="excluir" data-id="${item.idOcorrencia}" title="Excluir">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  corpo.innerHTML = html;
}

function aplicarFiltrosEOrdenacaoOcorrencia()
{
  const base = estadoOcorrencia.ocorrencias || [];
  const dados = [];

  for (let i = 0; i < base.length; i += 1)
{
    const item = base[i];
    let incluir = true;

    if (filtrosOcorrencia.tipo)
{
      incluir = String(item.tipoOcorrencia?.idOcorrencias) === filtrosOcorrencia.tipo;
    }

    if (incluir && filtrosOcorrencia.morador)
{
      incluir = false;
      const moradores = Array.isArray(item.moradoresEnvolvidos) ? item.moradoresEnvolvidos : [];
      for (let j = 0; j < moradores.length; j += 1)
{
        if (String(moradores[j].idMorador) === filtrosOcorrencia.morador)
{
          incluir = true;
          break;
        }
      }
    }

    if (incluir && filtrosOcorrencia.cuidador)
{
      incluir = String(item.funcionario?.idFuncionario || "") === filtrosOcorrencia.cuidador;
    }

    if (incluir && (filtrosOcorrencia.dataInicial || filtrosOcorrencia.dataFinal))
{
      const dataItem = obterChaveDataLocalOcorrencia(item.dtOcorrencia);
      if (!dataItem)
{
        incluir = false;
      }
      if (incluir && filtrosOcorrencia.dataInicial)
{
        incluir = dataItem >= filtrosOcorrencia.dataInicial;
      }
      if (incluir && filtrosOcorrencia.dataFinal)
{
        incluir = dataItem <= filtrosOcorrencia.dataFinal;
      }
    }

    if (incluir && filtrosOcorrencia.gravidade)
{
      incluir = String(item.tipoOcorrencia?.gravidade || "") === filtrosOcorrencia.gravidade;
    }

    if (incluir)
{
      dados.push(item);
    }
  }

  dados.sort(function (a, b) {
    return compararOcorrencias(a, b, ordenacaoOcorrencia.chave, ordenacaoOcorrencia.direcao);
  });

  renderizarTabelaOcorrencias(dados);
  atualizarIndicadoresOrdenacaoOcorrencia();
}

function carregarContextoRegistroOcorrencia()
{
  const carregarFuncionario = fetch("/ocorrencia/funcionario-contexto")
    .then(function (response) {
      return parseJsonSeguroOcorrencia(response).then(function (body) {
        return response.ok ? body : null;
      });
    })
    .catch (function ()
{
      return null;
    });

  const carregarTurno = fetch("/ocorrencia/turno-ativo")
    .then(function (response) {
      return parseJsonSeguroOcorrencia(response).then(function (body) {
        return response.ok ? body : null;
      });
    })
    .catch (function ()
{
      return null;
    });

  const carregarTipos = fetch("/ocorrencia/tipos")
    .then(function (response) {
      return parseJsonSeguroOcorrencia(response).then(function (body) {
        return response.ok && Array.isArray(body) ? body : [];
      });
    })
    .catch (function ()
{
      return [];
    });

  const carregarMoradores = fetch("/ocorrencia/moradores")
    .then(function (response) {
      return parseJsonSeguroOcorrencia(response).then(function (body) {
        return response.ok && Array.isArray(body) ? body : [];
      });
    })
    .catch (function ()
{
      return [];
    });

  const carregarCuidadores = fetch("/funcionario/listarCuidadores")
    .then(function (response) {
      return parseJsonSeguroOcorrencia(response).then(function (body) {
        return response.ok && Array.isArray(body) ? body : [];
      });
    })
    .catch (function ()
{
      return [];
    });

  return Promise.all([carregarFuncionario, carregarTurno, carregarTipos, carregarMoradores, carregarCuidadores])
    .then(function (valores) {
      estadoOcorrencia.funcionario = valores[0];
      estadoOcorrencia.turnoAtivo = valores[1];
      estadoOcorrencia.tiposOcorrencia = valores[2];
      estadoOcorrencia.moradores = valores[3];
      estadoOcorrencia.cuidadores = valores[4];

      persistirFuncionarioOcorrencia(estadoOcorrencia.funcionario);
      atualizarTopoPerfilOcorrencia();
      preencherTiposOcorrencia();
      preencherFiltroMoradorOcorrencia();
      preencherFiltroCuidadorOcorrencia();
      preencherMoradoresOcorrencia();
      atualizarBotaoCadastroOcorrencia();
    });
}

function atualizarStatusTurnoAtivoOcorrencia()
{
  return fetch("/ocorrencia/turno-ativo")
    .then(function (response) {
      return parseJsonSeguroOcorrencia(response).then(function (body) {
        return { response, body };
      });
    })
    .then(function (resultado) {
      if (resultado.response.ok)
{
        estadoOcorrencia.turnoAtivo = resultado.body && resultado.body.idTurnos != null ? resultado.body : null;
        if (estadoOcorrencia.turnoAtivo)
{
          atualizarBotaoCadastroOcorrencia();
          return true;
        }
      }

      return fetch("/ocorrencia/funcionario-contexto")
        .then(function (fallbackResponse) {
          return parseJsonSeguroOcorrencia(fallbackResponse).then(function (fallbackBody) {
            return { fallbackResponse, fallbackBody };
          });
        })
        .then(function (fallback) {
          if (fallback.fallbackResponse.ok)
{
            estadoOcorrencia.funcionario = fallback.fallbackBody || estadoOcorrencia.funcionario;
            persistirFuncionarioOcorrencia(estadoOcorrencia.funcionario);
            atualizarTopoPerfilOcorrencia();
          }
          estadoOcorrencia.turnoAtivo = null;
          atualizarBotaoCadastroOcorrencia();
          return false;
        });
    })
    .catch (function ()
{
      estadoOcorrencia.turnoAtivo = null;
      atualizarBotaoCadastroOcorrencia();
      return false;
    });
}

function carregarOcorrenciasCadastroOcorrencia()
{
  return fetch("/ocorrencia/listar")
    .then(function (response) {
      return parseJsonSeguroOcorrencia(response).then(function (body) {
        return { response, body };
      });
    })
    .then(function (resultado) {
      if (!resultado.response.ok)
{
        estadoOcorrencia.ocorrencias = [];
        aplicarFiltrosEOrdenacaoOcorrencia();
        return;
      }

      const lista = Array.isArray(resultado.body) ? resultado.body : [];
      const padronizadas = [];
      for (let i = 0; i < lista.length; i += 1)
{
        const item = padronizarItemOcorrencia(lista[i]);
        if (item && item.idOcorrencia != null)
{
          padronizadas.push(item);
        }
      }

      const promessasMoradores = padronizadas.map(function (item) {
        return fetch(`/ocorrencia/moradores/${item.idOcorrencia}`)
          .then(function (response) {
            return parseJsonSeguroOcorrencia(response).then(function (body) {
              item.moradoresEnvolvidos = response.ok && Array.isArray(body) ? body : [];
              return item;
            });
          })
          .catch (function ()
{
            item.moradoresEnvolvidos = [];
            return item;
          });
      });

      return Promise.all(promessasMoradores).then(function (itensComMoradores) {
        estadoOcorrencia.ocorrencias = itensComMoradores;
        preencherFiltroCuidadorOcorrencia();
        aplicarFiltrosEOrdenacaoOcorrencia();
      });
    });
}

function atualizarBotaoCadastroOcorrencia()
{
  const botao = elOcorrencia("abrirCadastroOcorrencia");
  if (!botao) return;

  const turnoAtivo = !!estadoOcorrencia.turnoAtivo;
  botao.disabled = !turnoAtivo;
  botao.classList.toggle("is-disabled", !turnoAtivo);
  botao.title = turnoAtivo ? "" : "Inicie um turno para cadastrar uma ocorrência.";
}

function atualizarTextoBotaoCadastroOcorrencia()
{
  const botao = elOcorrencia("registrarOcorrenciaBtn");
  if (!botao) return;

  if (estadoOcorrencia.idOcorrenciaEmEdicao != null)
{
    botao.innerHTML = '<span class="material-symbols-outlined">edit</span>Salvar edicao';
  } 
else
{
    botao.innerHTML = '<span class="material-symbols-outlined">save</span>Registrar Ocorrencia';
  }
}

function limparFormularioCadastroOcorrencia()
{
  estadoOcorrencia.idOcorrenciaEmEdicao = null;
  if (elOcorrencia("observacoes")) elOcorrencia("observacoes").value = "";
  if (elOcorrencia("tipoOcorrencia")) elOcorrencia("tipoOcorrencia").value = "";

  const checks = document.querySelectorAll(".morador-check");
  for (let i = 0; i < checks.length; i += 1)
{
    checks[i].checked = false;
  }
  atualizarTextoBotaoCadastroOcorrencia();
}

function abrirCadastroOcorrencia()
{
  if (!estadoOcorrencia.turnoAtivo)
{
    mostrarMensagemOcorrencia("error", "Inicie um turno antes de registrar ocorrência.");
    atualizarStatusTurnoAtivoOcorrencia();
    return;
  }

  const painel = elOcorrencia("cadastroOcorrencia");
  if (!painel) return;
  painel.hidden = false;
  atualizarTextoBotaoCadastroOcorrencia();
}

function fecharCadastroOcorrencia()
{
  const painel = elOcorrencia("cadastroOcorrencia");
  if (!painel) return;
  painel.hidden = true;
  limparFormularioCadastroOcorrencia();
}

function abrirFiltrosOcorrencia()
{
  const painel = elOcorrencia("filtroOcorrencia");
  if (!painel) return;
  painel.hidden = false;
}

function fecharFiltrosOcorrencia()
{
  const painel = elOcorrencia("filtroOcorrencia");
  if (!painel) return;
  painel.hidden = true;
}

function limparFiltrosOcorrencia()
{
  filtrosOcorrencia = { tipo: "", morador: "", cuidador: "", dataInicial: "", dataFinal: "", gravidade: "" };
  if (elOcorrencia("filtroTipo")) elOcorrencia("filtroTipo").value = "";
  if (elOcorrencia("filtroMorador")) elOcorrencia("filtroMorador").value = "";
  if (elOcorrencia("filtroCuidador")) elOcorrencia("filtroCuidador").value = "";
  if (elOcorrencia("filtroDataInicial")) elOcorrencia("filtroDataInicial").value = "";
  if (elOcorrencia("filtroDataFinal")) elOcorrencia("filtroDataFinal").value = "";
  if (elOcorrencia("filtroGravidade")) elOcorrencia("filtroGravidade").value = "";
  aplicarFiltrosEOrdenacaoOcorrencia();
}

function registrarOcorrenciaUnica(event)
{
  event.preventDefault();

  const idTipoOcorrencia = elOcorrencia("tipoOcorrencia")?.value || "";
  const observacoes = (elOcorrencia("observacoes")?.value || "").trim().replace(/\s+/g, " ");
  const idsMoradores = obterIdsMoradoresSelecionadosOcorrencia();

  if (observacoes.length > 45)
{
    mostrarMensagemOcorrencia("error", "Descricao deve ter no maximo 45 caracteres.");
    return;
  }

  if (!/^[\p{L} ]+$/u.test(observacoes))
{
    mostrarMensagemOcorrencia("error", "Use apenas letras e espacos na descricao.");
    return;
  }

  const continuarRegistro = function () {
    const params = montarParamsOcorrencia();
    params.append("idTipoOcorrencia", idTipoOcorrencia);
    params.append("observacoes", observacoes);
    params.append("idsMoradores", idsMoradores);

    let endpoint = "/ocorrencia/cadastrar";
    let metodo = "POST";
    if (estadoOcorrencia.idOcorrenciaEmEdicao != null)
{
      endpoint = "/ocorrencia/editar";
      metodo = "PUT";
      params.append("idOcorrencia", String(estadoOcorrencia.idOcorrenciaEmEdicao));
    }

    return fetch(`${endpoint}?${params.toString()}`, { method: metodo })
      .then(function (response) {
        return parseJsonSeguroOcorrencia(response).then(function (body) {
          return { response, body };
        });
      })
      .then(function (resultado) {
        if (!resultado.response.ok)
        {
          mostrarMensagemOcorrencia("error", resultado.body.descricao || "Nao foi possivel salvar a ocorrencia.");
          return;
        }

        mostrarMensagemOcorrencia("success", estadoOcorrencia.idOcorrenciaEmEdicao != null ? "Ocorrencia atualizada com sucesso." : "Ocorrencia registrada com sucesso.");
        return carregarOcorrenciasCadastroOcorrencia().then(function () {
          fecharCadastroOcorrencia();
        });
      })
      .catch (function ()
    {
        mostrarMensagemOcorrencia("error", "Erro ao salvar ocorrencia.");
      });
  };

  if (estadoOcorrencia.turnoAtivo)
  {
    continuarRegistro();
    return;
  }

  atualizarStatusTurnoAtivoOcorrencia().then(function (temTurnoAtivo) {
    if (!temTurnoAtivo)
{
      mostrarMensagemOcorrencia("error", "Inicie um turno antes de registrar ocorrencia.");
      return;
    }
    continuarRegistro();
  });
}

function iniciarEdicaoOcorrencia(idOcorrencia)
{
  let ocorrencia = null;
  for (let i = 0; i < estadoOcorrencia.ocorrencias.length; i += 1)
{
    const item = estadoOcorrencia.ocorrencias[i];
    if (Number(item.idOcorrencia) === Number(idOcorrencia))
{
      ocorrencia = item;
      break;
    }
  }

  if (!ocorrencia)
{
    mostrarMensagemOcorrencia("error", "Ocorrencia nao encontrada para edicao.");
    return;
  }

  estadoOcorrencia.idOcorrenciaEmEdicao = Number(idOcorrencia);
  if (elOcorrencia("tipoOcorrencia"))
{
    elOcorrencia("tipoOcorrencia").value = String(ocorrencia.tipoOcorrencia?.idOcorrencias || "");
  }
  if (elOcorrencia("observacoes"))
{
    elOcorrencia("observacoes").value = ocorrencia.observacoes || "";
  }
  marcarMoradoresSelecionadosOcorrencia(ocorrencia.moradoresEnvolvidos || []);
  atualizarTextoBotaoCadastroOcorrencia();
  abrirCadastroOcorrencia();
}

function solicitarExclusaoOcorrencia(idOcorrencia)
{
  let ocorrencia = null;
  for (let i = 0; i < estadoOcorrencia.ocorrencias.length; i += 1)
{
    const item = estadoOcorrencia.ocorrencias[i];
    if (Number(item.idOcorrencia) === Number(idOcorrencia))
{
      ocorrencia = item;
      break;
    }
  }

  if (!ocorrencia)
{
    mostrarMensagemOcorrencia("error", "Ocorrencia nao encontrada para exclusao.");
    return;
  }

  estadoOcorrencia.idOcorrenciaPendenteExclusao = Number(idOcorrencia);
  if (elOcorrencia("textoConfirmacaoOcorrencia"))
{
    elOcorrencia("textoConfirmacaoOcorrencia").textContent = `Deseja realmente excluir a ocorrencia "${ocorrencia.tipoOcorrencia?.descricao || ""}"?`;
  }
  elOcorrencia("painelConfirmacaoOcorrencia")?.classList.add("show");
}

function fecharConfirmacaoExclusaoOcorrencia()
{
  elOcorrencia("painelConfirmacaoOcorrencia")?.classList.remove("show");
  estadoOcorrencia.idOcorrenciaPendenteExclusao = null;
}

function excluirOcorrencia(idOcorrencia)
{
  const params = montarParamsOcorrencia();
  params.append("idOcorrencia", String(idOcorrencia));

  return fetch(`/ocorrencia/deletar?${params.toString()}`, { method: "DELETE" })
    .then(function (response) {
      return parseJsonSeguroOcorrencia(response).then(function (body) {
        return { response, body };
      });
    })
    .then(function (resultado) {
      if (!resultado.response.ok)
{
        mostrarMensagemOcorrencia("error", resultado.body.descricao || "Nao foi possivel excluir a ocorrencia.");
        return false;
      }

      mostrarMensagemOcorrencia("success", "Ocorrencia excluida com sucesso.");
      return carregarOcorrenciasCadastroOcorrencia().then(function () {
        return true;
      });
    })
    .catch (function ()
{
      mostrarMensagemOcorrencia("error", "Erro ao excluir ocorrencia.");
      return false;
    });
}

function confirmarExclusaoOcorrencia()
{
  if (estadoOcorrencia.idOcorrenciaPendenteExclusao == null) return;

  excluirOcorrencia(estadoOcorrencia.idOcorrenciaPendenteExclusao).then(function (excluiu) {
    if (excluiu)
{
      fecharConfirmacaoExclusaoOcorrencia();
    }
  });
}

function tratarAcaoOcorrenciaClick(event)
{
  const alvo = event.target.closest("button[data-acao][data-id]");
  if (!alvo) return;

  const idOcorrencia = alvo.dataset.id;
  const acao = alvo.dataset.acao;
  if (!idOcorrencia || !acao) return;

  if (acao === "editar")
{
    iniciarEdicaoOcorrencia(idOcorrencia);
  } else if (acao === "excluir")
{
    solicitarExclusaoOcorrencia(idOcorrencia);
  }
}

function tratarOrdenacaoOcorrencia(event)
{
  const chave = event.currentTarget.dataset.sortKey;
  if (!chave) return;

  if (ordenacaoOcorrencia.chave === chave)
{
    ordenacaoOcorrencia.direcao = ordenacaoOcorrencia.direcao === "asc" ? "desc" : "asc";
  } 
else
{
    ordenacaoOcorrencia.chave = chave;
    ordenacaoOcorrencia.direcao = "asc";
  }

  aplicarFiltrosEOrdenacaoOcorrencia();
}

function configurarEventosOcorrencia()
{
  elOcorrencia("ocorrenciaForm")?.addEventListener("submit", registrarOcorrenciaUnica);
  elOcorrencia("abrirCadastroOcorrencia")?.addEventListener("click", abrirCadastroOcorrencia);
  elOcorrencia("fecharCadastroOcorrencia")?.addEventListener("click", fecharCadastroOcorrencia);

  elOcorrencia("abrirFiltrosOcorrencia")?.addEventListener("click", abrirFiltrosOcorrencia);
  elOcorrencia("fecharFiltrosOcorrencia")?.addEventListener("click", fecharFiltrosOcorrencia);
  elOcorrencia("limparFiltros")?.addEventListener("click", limparFiltrosOcorrencia);

  const cabecalhos = document.querySelectorAll(".sortable");
  for (let i = 0; i < cabecalhos.length; i += 1)
{
    cabecalhos[i].addEventListener("click", tratarOrdenacaoOcorrencia);
  }

  elOcorrencia("filtroTipo")?.addEventListener("change", function () {
    filtrosOcorrencia.tipo = elOcorrencia("filtroTipo").value;
    aplicarFiltrosEOrdenacaoOcorrencia();
  });

  elOcorrencia("filtroMorador")?.addEventListener("change", function () {
    filtrosOcorrencia.morador = elOcorrencia("filtroMorador").value;
    aplicarFiltrosEOrdenacaoOcorrencia();
  });

  elOcorrencia("filtroCuidador")?.addEventListener("change", function () {
    filtrosOcorrencia.cuidador = elOcorrencia("filtroCuidador").value;
    aplicarFiltrosEOrdenacaoOcorrencia();
  });

  elOcorrencia("filtroDataInicial")?.addEventListener("change", function () {
    filtrosOcorrencia.dataInicial = elOcorrencia("filtroDataInicial").value;
    aplicarFiltrosEOrdenacaoOcorrencia();
  });

  elOcorrencia("filtroDataFinal")?.addEventListener("change", function () {
    filtrosOcorrencia.dataFinal = elOcorrencia("filtroDataFinal").value;
    aplicarFiltrosEOrdenacaoOcorrencia();
  });

  elOcorrencia("filtroGravidade")?.addEventListener("change", function () {
    filtrosOcorrencia.gravidade = elOcorrencia("filtroGravidade").value;
    aplicarFiltrosEOrdenacaoOcorrencia();
  });

  elOcorrencia("tabelaOcorrenciasCadastro")?.addEventListener("click", tratarAcaoOcorrenciaClick);
  elOcorrencia("confirmarExclusaoOcorrencia")?.addEventListener("click", confirmarExclusaoOcorrencia);
  elOcorrencia("cancelarExclusaoOcorrencia")?.addEventListener("click", fecharConfirmacaoExclusaoOcorrencia);
}

function inicializarOcorrencia()
{
  carregarContextoUrlOcorrencia();
  definirVisibilidadeConteudoOcorrencia(false);
  atualizarTopoPerfilOcorrencia();
  atualizarLinksContextoOcorrencia();

  garantirTurnoAtivoNoCarregamentoOcorrencia()
    .then(function (temTurnoAtivo) {
      if (!temTurnoAtivo)
{
        return null;
      }

      definirVisibilidadeConteudoOcorrencia(true);
      configurarEventosOcorrencia();
      return carregarContextoRegistroOcorrencia();
    })
    .then(function (contextoCarregado) {
      if (contextoCarregado == null && !estadoOcorrencia.turnoAtivo)
{
        return null;
      }
      return carregarOcorrenciasCadastroOcorrencia();
    })
    .catch (function ()
{
      definirVisibilidadeConteudoOcorrencia(true);
      mostrarMensagemOcorrencia("error", "Nao foi possivel carregar os dados de ocorrencia.");
    });
}

document.addEventListener("DOMContentLoaded", inicializarOcorrencia);
