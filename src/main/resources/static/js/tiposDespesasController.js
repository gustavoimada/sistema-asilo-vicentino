const API_BASE = "";
const API_TIPOS_DESPESAS = `${API_BASE}/tipodespesas`;
let tiposDespesasCarregados = [];
let popupTimer;
let ordenacaoAtualTiposDespesas = "tipo";
let ordemAtualTiposDespesas = "asc";

function escaparHtmlTipo(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatarTipoDespesa(valor) {
    if (typeof window.formatarTituloLegivel === "function") {
        return window.formatarTituloLegivel(valor);
    }

    return String(valor || "");
}

function escaparApostrofo(valor) {
    return String(valor || "").replace(/'/g, "''");
}

function extrairRespostaJson(response) {
    return response.text().then(function (texto) {
        if (!texto) {
            return {};
        }

        try {
            return JSON.parse(texto);
        } catch (e) {
            return {descricao: texto};
        }
    });
}

function exigirPaginaViaServidor() {
    if (window.location.protocol !== "http:" && window.location.protocol !== "https:") {
        const arquivo = String(window.location.pathname || "").split("/").pop() || "index.html";
        mostrarPopup("Abra esta tela pelo servidor: /" + arquivo, "error");
        return false;
    }

    return true;
}

function mostrarPopup(mensagem, tipo) {
    let popup = document.getElementById("popupMensagem");

    if (!popup) {
        popup = document.createElement("div");
        popup.id = "popupMensagem";
        popup.className = "popup-msg";
        document.body.appendChild(popup);
    }

    popup.className = "popup-msg show " + (tipo || "info");
    popup.textContent = mensagem;

    clearTimeout(popupTimer);
    popupTimer = setTimeout(function () {
        popup.classList.remove("show");
    }, 3200);
}

function confirmarAcao(mensagem) {
    return new Promise(function (resolve) {
        let modal = document.getElementById("confirmacaoModal");

        if (!modal) {
            modal = document.createElement("div");
            modal.id = "confirmacaoModal";
            modal.className = "confirm-overlay";
            modal.innerHTML = `
                <div class="confirm-box">
                    <h4>Confirmar ação</h4>
                    <p id="confirmacaoTexto"></p>
                    <div class="confirm-actions">
                        <button type="button" class="btn btn-secondary" id="confirmacaoCancelar">Cancelar</button>
                        <button style="background-color: red" type="button" class="btn" id="confirmacaoOk">Confirmar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        document.getElementById("confirmacaoTexto").textContent = mensagem;
        modal.classList.add("show");

        document.getElementById("confirmacaoCancelar").onclick = function () {
            modal.classList.remove("show");
            resolve(false);
        };

        document.getElementById("confirmacaoOk").onclick = function () {
            modal.classList.remove("show");
            resolve(true);
        };

        modal.onclick = function (event) {
            if (event.target === modal) {
                modal.classList.remove("show");
                resolve(false);
            }
        };
    });
}

function obterCampoOrdenacaoTiposDespesas() {
    return ordenacaoAtualTiposDespesas || "tipo";
}

function obterOrdemOrdenacaoTiposDespesas() {
    return ordemAtualTiposDespesas || "asc";
}

function atualizarIndicadoresOrdenacaoTiposDespesas() {
    const cabecalhos = document.querySelectorAll("th[data-sort]");

    cabecalhos.forEach(function (cabecalho) {
        const campo = cabecalho.getAttribute("data-sort");
        const textoOriginal = cabecalho.getAttribute("data-label") || cabecalho.textContent.replace(" ▲", "").replace(" ▼", "");
        cabecalho.setAttribute("data-label", textoOriginal);
        cabecalho.style.cursor = "pointer";
        cabecalho.style.userSelect = "none";

        if (campo === ordenacaoAtualTiposDespesas) {
            cabecalho.textContent = textoOriginal + (ordemAtualTiposDespesas === "asc" ? " ▲" : " ▼");
        } else {
            cabecalho.textContent = textoOriginal;
        }
    });
}

function configurarOrdenacaoCabecalhoTiposDespesas() {
    const cabecalhos = document.querySelectorAll("th[data-sort]");

    cabecalhos.forEach(function (cabecalho) {
        cabecalho.addEventListener("click", function () {
            const campo = cabecalho.getAttribute("data-sort");

            if (!campo) {
                return;
            }

            if (ordenacaoAtualTiposDespesas === campo) {
                ordemAtualTiposDespesas = ordemAtualTiposDespesas === "asc" ? "desc" : "asc";
            } else {
                ordenacaoAtualTiposDespesas = campo;
                ordemAtualTiposDespesas = "asc";
            }

            carregarTiposDespesas();
        });
    });

    atualizarIndicadoresOrdenacaoTiposDespesas();
}

function renderizarTabela(tiposDespesas) {
    const tabela = document.getElementById("tabelaTiposDespesas");

    if (!tabela) {
        return;
    }

    let linhas = "";

    if (tiposDespesas.length === 0) {
        linhas = `
            <tr>
                <td colspan="2" class="empty-row">
                    Nenhum tipo de despesa cadastrado.
                </td>
            </tr>
        `;
    } else {
        tiposDespesas.forEach(tipoDespesa => {
            const tipoFormatado = escaparHtmlTipo(formatarTipoDespesa(tipoDespesa.tipo) || "Sem nome");
            linhas += `
                <tr>
                    <td>
                        <div class="tipo-item tipo-item--despesa">
                            <span class="tipo-item-icon" aria-hidden="true">
                                <span class="material-symbols-outlined">receipt_long</span>
                            </span>
                            <div class="tipo-item-copy">
                                <strong>${tipoFormatado}</strong>
                                <small>Classificação de despesa</small>
                            </div>
                        </div>
                    </td>
                    <td class="text-right">
                        <div style="display:inline-flex; gap:8px;">
                            <button type="button" class="action-icon-btn edit" aria-label="Editar tipo de despesa" onclick="abrirEdicaoTipoDespesa(${tipoDespesa.idtiposDespesas})">
                                <span class="material-symbols-outlined">edit</span>
                            </button>
                            <button type="button" class="action-icon-btn delete" aria-label="Excluir tipo de despesa" onclick="deletarTipoDespesa(${tipoDespesa.idtiposDespesas})">
                                <span class="material-symbols-outlined">delete</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    tabela.innerHTML = linhas;
}

function limparFormularioTipoDespesa() {
    const form = document.getElementById("tipoDespesaForm");

    if (!form) {
        return;
    }

    form.reset();
    document.getElementById("idtipodespesas").value = "";
}

function exibirFormularioTipoDespesa(modo) {
    const card = document.getElementById("tipoDespesaFormCard");
    const titulo = document.getElementById("tipoDespesaFormTitulo");
    const novoTipoDespesaBtn = document.getElementById("novoTipoDespesaBtn");

    if (!card || !titulo) {
        return;
    }

    titulo.textContent = modo === "edicao" ? "Editar Tipo de Despesa" : "Cadastrar Novo Tipo de Despesa";
    card.style.display = "block";

    if (novoTipoDespesaBtn) {
        novoTipoDespesaBtn.style.display = "none";
    }

    card.scrollIntoView({behavior: "smooth", block: "start"});
}

function ocultarFormularioTipoDespesa() {
    const card = document.getElementById("tipoDespesaFormCard");
    const novoTipoDespesaBtn = document.getElementById("novoTipoDespesaBtn");

    if (!card) {
        return;
    }

    limparFormularioTipoDespesa();
    card.style.display = "none";

    if (novoTipoDespesaBtn) {
        novoTipoDespesaBtn.style.display = "inline-flex";
    }
}

function carregarTiposDespesas() {
    const tabela = document.getElementById("tabelaTiposDespesas");

    if (!tabela) {
        return;
    }

    tabela.innerHTML = `
        <tr>
            <td colspan="2" class="empty-row">
                Carregando tipos de despesas...
            </td>
        </tr>
    `;

    const valorOrdenacao = obterCampoOrdenacaoTiposDespesas();
    const ordem = obterOrdemOrdenacaoTiposDespesas();
    fetch(`${API_TIPOS_DESPESAS}/listarOrdenado?valor=${valorOrdenacao}&ordem=${ordem}`)
        .then(response =>
            extrairRespostaJson(response).then(body => ({
                ok: response.ok,
                body
            }))
        )
        .then(({ok, body}) => {
            if (!ok) {
                const msg = body && body.descricao ? body.descricao : "Não foi possível listar os tipos de despesas.";
                tabela.innerHTML = `
                    <tr>
                        <td colspan="2" class="empty-row">
                            Erro ao carregar tipos de despesas.
                        </td>
                    </tr>
                `;
                mostrarPopup(msg, "error");
                return;
            }

            const lista = Array.isArray(body) ? body : [];
            tiposDespesasCarregados = lista;
            buscarTiposDespesas();
            atualizarIndicadoresOrdenacaoTiposDespesas();
        })
        .catch(error => {
            tabela.innerHTML = `
                <tr>
                    <td colspan="2" class="empty-row">
                        Erro ao carregar tipos de despesas.
                    </td>
                </tr>
            `;
            mostrarPopup("Erro ao carregar tipos de despesas: " + error, "error");
        });
}

function carregarTipoDespesa(id) {
    if (!id || !document.getElementById("idtipodespesas")) {
        return;
    }

    fetch(`${API_TIPOS_DESPESAS}/buscar?id=${id}`)
        .then(response =>
            extrairRespostaJson(response).then(body => ({
                ok: response.ok,
                body
            }))
        )
        .then(({ok, body}) => {
            if (!ok) {
                mostrarPopup((body && body.descricao) || "Tipo de despesa não encontrado.", "error");
                return;
            }

            exibirFormularioTipoDespesa("edicao");
            document.getElementById("idtipodespesas").value = body.idtiposDespesas;
            document.getElementById("tipo").value = formatarTipoDespesa(body.tipo);
        })
        .catch(error => {
            mostrarPopup("Erro ao buscar tipo de despesa: " + error, "error");
        });
}

function cadastrarTipoDespesa() {
    const form = document.getElementById("tipoDespesaForm");
    const tipoValor = String((form && form.tipo && form.tipo.value) ? form.tipo.value : "").trim();
    if (!tipoValor) {
        mostrarPopup("Informe o tipo de despesa.", "error");
        return;
    }
    const params = new URLSearchParams();
    params.append("tipo", tipoValor);

    const requestOptions = {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: params.toString()
    };

    fetch(`${API_TIPOS_DESPESAS}/cadastrar`, requestOptions)
        .then(response => {
            if (response.status === 200) {
                return response.json().then(tipoSalvo => {
                    mostrarPopup("Tipo de despesa " + tipoSalvo.tipo + " adicionado com sucesso!", "success");
                    ocultarFormularioTipoDespesa();
                    carregarTiposDespesas();
                });
            } else {
                return extrairRespostaJson(response).then(erro => {
                    mostrarPopup(erro.descricao || "Erro ao adicionar tipo de despesa!", "error");
                });
            }
        })
        .catch(error => {
            mostrarPopup("Erro ao adicionar tipo de despesa: " + error, "error");
        });
}

function editarTipoDespesa() {
    const form = document.getElementById("tipoDespesaForm");
    const tipoValor = String((form && form.tipo && form.tipo.value) ? form.tipo.value : "").trim();
    if (!tipoValor) {
        mostrarPopup("Informe o tipo de despesa.", "error");
        return;
    }
    const params = new URLSearchParams();
    params.append("id", document.getElementById("idtipodespesas").value);
    params.append("tipo", tipoValor);

    const requestOptions = {
        method: "PUT",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: params.toString()
    };

    fetch(`${API_TIPOS_DESPESAS}/editar`, requestOptions)
        .then(response => {
            if (response.status === 200) {
                return response.json().then(tipoSalvo => {
                    mostrarPopup("Tipo de despesa " + tipoSalvo.tipo + " alterado com sucesso!", "success");
                    ocultarFormularioTipoDespesa();
                    carregarTiposDespesas();
                });
            } else {
                return extrairRespostaJson(response).then(erro => {
                    mostrarPopup(erro.descricao || "Erro ao editar tipo de despesa!", "error");
                });
            }
        })
        .catch(error => {
            mostrarPopup("Erro ao editar tipo de despesa: " + error, "error");
        });
}

function salvarTipoDespesa(event) {
    event.preventDefault();

    if (document.getElementById("idtipodespesas").value !== "") {
        editarTipoDespesa();
    } else {
        cadastrarTipoDespesa();
    }
}

async function deletarTipoDespesa(id) {
    const confirmado = await confirmarAcao("Tem certeza que deseja excluir este tipo de despesa?");

    if (!confirmado) {
        return;
    }

    fetch(`${API_TIPOS_DESPESAS}/deletar?id=${id}`, {method: "DELETE"})
        .then(response => {
            if (response.status === 200) {
                mostrarPopup("Tipo de despesa excluído com sucesso!", "success");
                carregarTiposDespesas();
            } else {
                return extrairRespostaJson(response).then(erro => {
                    mostrarPopup(erro.descricao || "Erro ao excluir tipo de despesa!", "error");
                });
            }
        })
        .catch(error => {
            mostrarPopup("Erro ao excluir tipo de despesa: " + error, "error");
        });
}

function abrirCadastroTipoDespesa() {
    limparFormularioTipoDespesa();
    exibirFormularioTipoDespesa("cadastro");
}

function abrirEdicaoTipoDespesa(id) {
    limparFormularioTipoDespesa();
    carregarTipoDespesa(id);
}

function buscarTiposDespesas() {
    const nome = document.getElementById("filtroNomeTipoDespesa");

    if (!nome) {
        return;
    }

    const texto = nome.value.trim().toLowerCase();

    if (texto === "") {
        renderizarTabela(tiposDespesasCarregados);
        atualizarIndicadoresOrdenacaoTiposDespesas();
        return;
    }

    const tiposFiltrados = tiposDespesasCarregados.filter(tipoDespesa => {
        return String(tipoDespesa.tipo || "").toLowerCase().includes(texto);
    });

    renderizarTabela(tiposFiltrados);
    atualizarIndicadoresOrdenacaoTiposDespesas();
}

function limparFiltrosTipoDespesa() {
    const nome = document.getElementById("filtroNomeTipoDespesa");

    if (nome) nome.value = "";

    renderizarTabela(tiposDespesasCarregados);
    atualizarIndicadoresOrdenacaoTiposDespesas();
}

document.addEventListener("DOMContentLoaded", function () {
    if (!exigirPaginaViaServidor()) {
        return;
    }

    if (document.getElementById("tabelaTiposDespesas")) {
        const filtroPainel = document.getElementById("painelFiltroTipoDespesa");
        const botaoFiltros = document.getElementById("abrirFiltrosTipoDespesa");
        const fecharFiltros = document.getElementById("fecharFiltrosTipoDespesa");
        const limparFiltros = document.getElementById("limparFiltrosTipoDespesa");

        configurarOrdenacaoCabecalhoTiposDespesas();
        carregarTiposDespesas();

        document.getElementById("filtroNomeTipoDespesa").addEventListener("input", buscarTiposDespesas);
        document.getElementById("novoTipoDespesaBtn").addEventListener("click", abrirCadastroTipoDespesa);

        if (botaoFiltros && filtroPainel) {
            botaoFiltros.addEventListener("click", function () {
                filtroPainel.hidden = !filtroPainel.hidden;
            });
        }

        if (fecharFiltros && filtroPainel) {
            fecharFiltros.addEventListener("click", function () {
                filtroPainel.hidden = true;
            });
        }

        if (limparFiltros) {
            limparFiltros.addEventListener("click", limparFiltrosTipoDespesa);
        }
    }

    if (document.getElementById("tipoDespesaForm")) {
        document.getElementById("tipoDespesaForm").addEventListener("submit", salvarTipoDespesa);
        document.getElementById("cancelarTipoDespesaBtn").addEventListener("click", ocultarFormularioTipoDespesa);
    }
});
