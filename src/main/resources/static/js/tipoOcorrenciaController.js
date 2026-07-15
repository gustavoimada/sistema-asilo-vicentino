let tiposOcorrencia = [];
let tipoPendenteExclusao = null;
let ordenacaoAtual = { chave: "descricao", direcao: "asc" };

function escaparHtmlTipo(valor)
{
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function preencherPerfilTopo()
{
  const nome = (localStorage.getItem("funcionarioNome") || localStorage.getItem("usuarioNome") || "Usuário").trim();
  const categoria = (localStorage.getItem("funcionarioCategoria") || "").trim();
  const nomeEl = document.getElementById("perfilNome");
  const cargoEl = document.getElementById("perfilCargo");

  if (nomeEl)
  {
    nomeEl.textContent = nome || "Usuário";
  }
  if (cargoEl)
  {
    cargoEl.textContent = categoria ? formatarCargoInclusivo(categoria) : "Acesso";
  }
}

function formatarCargoInclusivo(categoria)
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

function mostrarMensagem(tipo, mensagem)
{
  const aviso = document.getElementById("mensagem-feedback");
  if (!aviso)
  {
    return;
  }

  aviso.className = `popup-msg ${tipo}`;
  aviso.textContent = mensagem;
  aviso.classList.add("show");

  window.clearTimeout(mostrarMensagem._temporizador);
  mostrarMensagem._temporizador = window.setTimeout(function ()
  {
    aviso.classList.remove("show");
  }, 3200);
}

function renderizarTabela()
{
  const corpo = document.getElementById("tabelaTipos");
  if (!corpo)
  {
    return;
  }

  const filtroDescricao = String(document.getElementById("filtroDescricao")?.value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
  const filtroGravidade = document.getElementById("filtroGravidade")?.value || "";

  const dados = tiposOcorrencia
    .filter(function (item)
    {
      const descricao = String(item.descricao || "").toLowerCase();
      const bateDescricao = !filtroDescricao || descricao.includes(filtroDescricao);
      const bateGravidade = !filtroGravidade || String(item.gravidade) === filtroGravidade;
      return bateDescricao && bateGravidade;
    })
    .sort(function (a, b)
    {
      if (ordenacaoAtual.chave === "gravidade")
      {
        const valorA = Number(a.gravidade || 0);
        const valorB = Number(b.gravidade || 0);
        if (valorA < valorB)
        {
          return ordenacaoAtual.direcao === "asc" ? -1 : 1;
        }
        if (valorA > valorB)
        {
          return ordenacaoAtual.direcao === "asc" ? 1 : -1;
        }
        return 0;
      }

      const valorA = String(a.descricao || "").toLowerCase();
      const valorB = String(b.descricao || "").toLowerCase();
      if (valorA < valorB)
      {
        return ordenacaoAtual.direcao === "asc" ? -1 : 1;
      }
      if (valorA > valorB)
      {
        return ordenacaoAtual.direcao === "asc" ? 1 : -1;
      }
      return 0;
    });

  document.querySelectorAll(".sortable").forEach(function (cabecalho)
  {
    const indicador = cabecalho.querySelector(".sort-indicator");
    const ativa = cabecalho.dataset.sortKey === ordenacaoAtual.chave;
    cabecalho.classList.toggle("is-active", ativa);
    if (indicador)
    {
      indicador.textContent = ativa ? (ordenacaoAtual.direcao === "asc" ? "^" : "v") : "";
    }
  });

  if (dados.length === 0)
  {
    corpo.innerHTML = '<tr><td colspan="3" class="empty-row">Nenhum tipo de ocorrência encontrado.</td></tr>';
    return;
  }

  let html = "";
  for (let i = 0; i < dados.length; i += 1)
  {
    const item = dados[i];
    let classeGravidade = "gravidade-alta";
    let textoGravidade = "Alta";
    if (Number(item.gravidade) === 1)
    {
      classeGravidade = "gravidade-baixa";
      textoGravidade = "Baixa";
    }
    else if (Number(item.gravidade) === 2)
    {
      classeGravidade = "gravidade-media";
      textoGravidade = "Média";
    }

    const descricao = escaparHtmlTipo(item.descricao || "Sem descrição");

    html += `
      <tr>
        <td>
          <div class="tipo-item tipo-item--ocorrencia ${classeGravidade}">
            <span class="tipo-item-icon" aria-hidden="true">
              <span class="material-symbols-outlined">warning</span>
            </span>
            <div class="tipo-item-copy">
              <strong>${descricao}</strong>
              <small>Tipo de ocorrência</small>
            </div>
          </div>
        </td>
        <td><span class="gravidade-badge ${classeGravidade}">${textoGravidade}</span></td>
        <td class="text-right">
          <div class="acoes">
            <button type="button" class="action-icon-btn edit" data-action="editar" data-id="${item.idOcorrencias}" title="Editar">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button type="button" class="action-icon-btn delete" data-action="deletar" data-id="${item.idOcorrencias}" title="Excluir">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  corpo.innerHTML = html;
}

function carregarTipos()
{
  const corpo = document.getElementById("tabelaTipos");
  if (corpo)
  {
    corpo.innerHTML = '<tr><td colspan="3" class="empty-row">Carregando tipos de ocorrência...</td></tr>';
  }

  return fetch("/tipoocorrencia/listar")
    .then(function (resposta)
    {
      return resposta.json().catch(function ()
      {
        return {};
      }).then(function (corpoResposta)
      {
        return { resposta: resposta, corpoResposta: corpoResposta };
      });
    })
    .then(function (resultado)
    {
      if (!resultado.resposta.ok || !Array.isArray(resultado.corpoResposta))
      {
        throw new Error("Falha ao carregar");
      }

      tiposOcorrencia = resultado.corpoResposta;
      renderizarTabela();
    })
    .catch(function ()
    {
      if (corpo)
      {
        corpo.innerHTML = '<tr><td colspan="3" class="empty-row">Erro ao carregar os dados.</td></tr>';
      }
      mostrarMensagem("error", "Não foi possível listar os tipos de ocorrência.");
    });
}

function salvarTipo(evento)
{
  evento.preventDefault();

  const id = document.getElementById("tipoId")?.value || "";
  const descricao = String(document.getElementById("descricao")?.value || "")
    .trim()
    .replace(/\s+/g, " ");
  const gravidade = document.getElementById("gravidade")?.value || "";

  if (!descricao)
  {
    mostrarMensagem("error", "Nome da ocorrência é obrigatório.");
    document.getElementById("descricao")?.focus();
    return;
  }
  if (descricao.length > 45)
  {
    mostrarMensagem("error", "Nome da ocorrência deve ter no máximo 45 caracteres.");
    document.getElementById("descricao")?.focus();
    return;
  }
  if (!/^[\p{L} ]+$/u.test(descricao))
  {
    mostrarMensagem("error", "Use apenas letras e espaços no nome.");
    document.getElementById("descricao")?.focus();
    return;
  }
  if (!["1", "2", "3"].includes(String(gravidade)))
  {
    mostrarMensagem("error", "Gravidade inválida. Use 1, 2 ou 3.");
    document.getElementById("gravidade")?.focus();
    return;
  }

  const descricaoPadronizada = descricao.toLowerCase();
  const duplicado = tiposOcorrencia.some(function (item)
  {
    const descricaoItem = String(item.descricao || "").trim().replace(/\s+/g, " ").toLowerCase();
    return String(item.idOcorrencias) !== String(id) && descricaoItem === descricaoPadronizada;
  });

  if (duplicado)
  {
    mostrarMensagem("error", "Já existe uma ocorrência com esse nome.");
    document.getElementById("descricao")?.focus();
    return;
  }

  let requisicao;
  if (!id)
  {
    const parametrosCadastro = new URLSearchParams({ descricao, gravidade });
    requisicao = fetch(`/tipoocorrencia/cadastrar?${parametrosCadastro.toString()}`, { method: "POST" });
  }
  else
  {
    const parametrosEdicao = new URLSearchParams({ id, descricao, gravidade });
    requisicao = fetch(`/tipoocorrencia/${id}?${parametrosEdicao.toString()}`, { method: "PUT" });
  }

  return requisicao
    .then(function (resposta)
    {
      return resposta.json().catch(function ()
      {
        return {};
      }).then(function (corpoResposta)
      {
        return { resposta: resposta, corpoResposta: corpoResposta };
      });
    })
    .then(function (resultado)
    {
      if (!resultado.resposta.ok)
      {
        mostrarMensagem("error", resultado.corpoResposta.descricao || resultado.corpoResposta.title || "Não foi possível salvar a ocorrência.");
        return;
      }

      document.getElementById("tipoId").value = "";
      document.getElementById("descricao").value = "";
      document.getElementById("gravidade").value = "";
      document.getElementById("formTitulo").textContent = "Cadastrar Novo Tipo de Ocorrência";
      document.getElementById("salvarBtn").innerHTML = '<span class="material-symbols-outlined">save</span>Salvar Ocorrência';
      document.getElementById("cadastroOcorrencia").hidden = true;

      mostrarMensagem("success", id ? "Ocorrência atualizada com sucesso." : "Ocorrência cadastrada com sucesso.");
      return carregarTipos();
    })
    .catch(function ()
    {
      mostrarMensagem("error", "Servidor indisponível no momento.");
    });
}

function confirmarExclusao()
{
  if (!tipoPendenteExclusao)
  {
    return;
  }

  const id = tipoPendenteExclusao.idOcorrencias;
  return fetch(`/tipoocorrencia/${id}?id=${id}`, { method: "DELETE" })
    .then(function (resposta)
    {
      return resposta.json().catch(function ()
      {
        return {};
      }).then(function (corpoResposta)
      {
        return { resposta: resposta, corpoResposta: corpoResposta };
      });
    })
    .then(function (resultado)
    {
      if (!resultado.resposta.ok)
      {
        mostrarMensagem("error", resultado.corpoResposta.descricao || resultado.corpoResposta.title || "Não foi possível excluir.");
        return;
      }

      document.getElementById("painelConfirmacao").classList.remove("show");
      tipoPendenteExclusao = null;
      mostrarMensagem("success", "Tipo de ocorrência excluído com sucesso.");
      return carregarTipos();
    })
    .catch(function ()
    {
      mostrarMensagem("error", "Servidor indisponível no momento.");
    });
}

function inicializarTipoOcorrencia()
{
  preencherPerfilTopo();

  document.getElementById("tipoOcorrenciaForm")?.addEventListener("submit", salvarTipo);

  document.getElementById("abrirCadastroOcorrencia")?.addEventListener("click", function ()
  {
    document.getElementById("tipoId").value = "";
    document.getElementById("descricao").value = "";
    document.getElementById("gravidade").value = "";
    document.getElementById("formTitulo").textContent = "Cadastrar Novo Tipo de Ocorrência";
    document.getElementById("salvarBtn").innerHTML = '<span class="material-symbols-outlined">save</span>Salvar Ocorrência';
    document.getElementById("cadastroOcorrencia").hidden = false;
  });

  document.getElementById("fecharCadastroOcorrencia")?.addEventListener("click", function ()
  {
    document.getElementById("cadastroOcorrencia").hidden = true;
  });

  document.getElementById("abrirFiltrosOcorrencia")?.addEventListener("click", function ()
  {
    document.getElementById("filtroOcorrencia").hidden = false;
  });

  document.getElementById("fecharFiltrosOcorrencia")?.addEventListener("click", function ()
  {
    document.getElementById("filtroOcorrencia").hidden = true;
  });

  document.getElementById("filtroDescricao")?.addEventListener("input", renderizarTabela);
  document.getElementById("filtroGravidade")?.addEventListener("change", renderizarTabela);
  document.getElementById("limparFiltros")?.addEventListener("click", function ()
  {
    document.getElementById("filtroDescricao").value = "";
    document.getElementById("filtroGravidade").value = "";
    renderizarTabela();
  });

  document.getElementById("tabelaTipos")?.addEventListener("click", function (evento)
  {
    const botao = evento.target.closest("button[data-action]");
    if (!botao)
    {
      return;
    }
    const id = botao.dataset.id;

    if (botao.dataset.action === "editar")
    {
      const tipo = tiposOcorrencia.find(function (item)
      {
        return Number(item.idOcorrencias) === Number(id);
      });
      if (!tipo)
      {
        mostrarMensagem("error", "Tipo de ocorrência não encontrado.");
        return;
      }

      document.getElementById("tipoId").value = tipo.idOcorrencias;
      document.getElementById("descricao").value = tipo.descricao || "";
      document.getElementById("gravidade").value = String(tipo.gravidade || "");
      document.getElementById("formTitulo").textContent = "Editar Tipo de Ocorrência";
      document.getElementById("salvarBtn").innerHTML = '<span class="material-symbols-outlined">save</span>Salvar Alteração';
      document.getElementById("cadastroOcorrencia").hidden = false;
      document.getElementById("descricao").focus();
      return;
    }

    if (botao.dataset.action === "deletar")
    {
      const tipo = tiposOcorrencia.find(function (item)
      {
        return Number(item.idOcorrencias) === Number(id);
      });
      if (!tipo)
      {
        mostrarMensagem("error", "Tipo de ocorrência não encontrado.");
        return;
      }

      tipoPendenteExclusao = tipo;
      document.getElementById("textoConfirmacao").textContent = `Deseja realmente excluir "${tipo.descricao}"?`;
      document.getElementById("painelConfirmacao").classList.add("show");
    }
  });

  document.querySelectorAll(".sortable").forEach(function (cabecalho)
  {
    cabecalho.addEventListener("click", function ()
    {
      const chave = cabecalho.dataset.sortKey;
      if (!chave)
      {
        return;
      }
      if (ordenacaoAtual.chave === chave)
      {
        ordenacaoAtual.direcao = ordenacaoAtual.direcao === "asc" ? "desc" : "asc";
      }
      else
      {
        ordenacaoAtual.chave = chave;
        ordenacaoAtual.direcao = "asc";
      }
      renderizarTabela();
    });
  });

  document.getElementById("confirmarExclusao")?.addEventListener("click", confirmarExclusao);
  document.getElementById("cancelarExclusao")?.addEventListener("click", function ()
  {
    document.getElementById("painelConfirmacao").classList.remove("show");
    tipoPendenteExclusao = null;
  });

  carregarTipos();
}

document.addEventListener("DOMContentLoaded", inicializarTipoOcorrencia);
