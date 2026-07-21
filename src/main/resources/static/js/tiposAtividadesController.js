const API_BASE = "";
const API_TIPOS_ATIVIDADES = `${API_BASE}/tipoatividades`;
let tiposAtividadesCarregados = [];
let popupTimer;
let ordenacaoAtualTiposAtividades = "tipo";
let ordemAtualTiposAtividades = "asc";

function escaparHtmlTipo(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatarTipoAtividade(valor) {
    if (typeof window.formatarTituloLegivel === "function") {
        return window.formatarTituloLegivel(valor);
    }

    return String(valor || "");
}

function normalizarCategoriaTipoAtividade(categoria) {
    return String(categoria || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function ehProfissionalAtividadesLogado() {
    const categoria = normalizarCategoriaTipoAtividade(localStorage.getItem("funcionarioCategoria") || "");
    return categoria === "artesao"
        || categoria === "educador fisico"
        || categoria === "fisioterapeuta";
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

function obterCampoOrdenacaoTiposAtividades() {
    return ordenacaoAtualTiposAtividades || "tipo";
}

function obterOrdemOrdenacaoTiposAtividades() {
    return ordemAtualTiposAtividades || "asc";
}

function atualizarIndicadoresOrdenacaoTiposAtividades() {
    const cabecalhos = document.querySelectorAll("th[data-sort]");

    cabecalhos.forEach(function (cabecalho) {
        const campo = cabecalho.getAttribute("data-sort");
        const textoOriginal = cabecalho.getAttribute("data-label") || cabecalho.textContent.replace(" ▲", "").replace(" ▼", "");
        cabecalho.setAttribute("data-label", textoOriginal);
        cabecalho.style.cursor = "pointer";
        cabecalho.style.userSelect = "none";

        if (campo === ordenacaoAtualTiposAtividades) {
            cabecalho.textContent = textoOriginal + (ordemAtualTiposAtividades === "asc" ? " ▲" : " ▼");
        } else {
            cabecalho.textContent = textoOriginal;
        }
    });
}

function configurarOrdenacaoCabecalhoTiposAtividades() {
    const cabecalhos = document.querySelectorAll("th[data-sort]");

    cabecalhos.forEach(function (cabecalho) {
        cabecalho.addEventListener("click", function () {
            const campo = cabecalho.getAttribute("data-sort");

            if (!campo) {
                return;
            }

            if (ordenacaoAtualTiposAtividades === campo) {
                ordemAtualTiposAtividades = ordemAtualTiposAtividades === "asc" ? "desc" : "asc";
            } else {
                ordenacaoAtualTiposAtividades = campo;
                ordemAtualTiposAtividades = "asc";
            }

            carregarTiposAtividades();
        });
    });

    atualizarIndicadoresOrdenacaoTiposAtividades();
}

function renderizarTabela(tiposAtividades) {
    const tabela = document.getElementById("tabelaTiposAtividades");

    if (!tabela) {
        return;
    }

    let linhas = "";
    const profissionalAtividades = ehProfissionalAtividadesLogado();

    if (tiposAtividades.length === 0) {
        linhas = `
            <tr>
                <td colspan="3" class="empty-row">
                    Nenhum tipo de atividade cadastrado.
                </td>
            </tr>
        `;
    } else {
        tiposAtividades.forEach(tipoAtividade => {
            const tipoFormatado = escaparHtmlTipo(formatarTipoAtividade(tipoAtividade.tipo) || "Sem nome");
            const organizacaoFormatada = escaparHtmlTipo(formatarTipoAtividade(tipoAtividade.org) || "Não informada");
            const acoes = profissionalAtividades ? "" : `
                            <button type="button" class="action-icon-btn edit" aria-label="Editar tipo de atividade" onclick="abrirEdicaoTipoAtividade(${tipoAtividade.idtipoatividades})">
                                <span class="material-symbols-outlined">edit</span>
                            </button>
                            <button type="button" class="action-icon-btn delete" aria-label="Excluir tipo de atividade" onclick="deletarTipoAtividade(${tipoAtividade.idtipoatividades})">
                                <span class="material-symbols-outlined">delete</span>
                            </button>
            `;
            linhas += `
                <tr>
                    <td>
                        <div class="tipo-item tipo-item--atividade">
                            <span class="tipo-item-icon" aria-hidden="true">
                                <span class="material-symbols-outlined">event_available</span>
                            </span>
                            <div class="tipo-item-copy">
                                <strong>${tipoFormatado}</strong>
                                <small>Tipo de atividade</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="tipo-organizacao">
                            <span class="material-symbols-outlined" aria-hidden="true">groups</span>
                            ${organizacaoFormatada}
                        </span>
                    </td>
                    <td class="text-right">
                        <div style="display:inline-flex; gap:8px;">
                            ${acoes}
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    tabela.innerHTML = linhas;
}

function limparFormularioTipoAtividade() {
    const form = document.getElementById("tipoAtividadeForm");

    if (!form) {
        return;
    }

    form.reset();
    document.getElementById("idtipoatividades").value = "";
}

function exibirFormularioTipoAtividade(modo) {
    const card = document.getElementById("tipoAtividadeFormCard");
    const titulo = document.getElementById("tipoAtividadeFormTitulo");
    const novoTipoAtividadeBtn = document.getElementById("novoTipoAtividadeBtn");

    if (!card || !titulo) {
        return;
    }

    titulo.textContent = modo === "edicao" ? "Editar Tipo de Atividade" : "Cadastrar Novo Tipo de Atividade";
    card.style.display = "block";

    if (novoTipoAtividadeBtn) {
        novoTipoAtividadeBtn.style.display = "none";
    }

    card.scrollIntoView({behavior: "smooth", block: "start"});
}

function ocultarFormularioTipoAtividade() {
    const card = document.getElementById("tipoAtividadeFormCard");
    const novoTipoAtividadeBtn = document.getElementById("novoTipoAtividadeBtn");

    if (!card) {
        return;
    }

    limparFormularioTipoAtividade();
    card.style.display = "none";

    if (novoTipoAtividadeBtn) {
        novoTipoAtividadeBtn.style.display = "inline-flex";
    }
}

function carregarTiposAtividades() {
    const tabela = document.getElementById("tabelaTiposAtividades");

    if (!tabela) {
        return;
    }

    tabela.innerHTML = `
        <tr>
            <td colspan="3" class="empty-row">
                Carregando tipos de atividades...
            </td>
        </tr>
    `;

    const valorOrdenacao = obterCampoOrdenacaoTiposAtividades();
    const ordem = obterOrdemOrdenacaoTiposAtividades();
    fetch(`${API_TIPOS_ATIVIDADES}/listarOrdenado?valor=${valorOrdenacao}&ordem=${ordem}`)
        .then(response =>
            extrairRespostaJson(response).then(body => ({
                ok: response.ok,
                body
            }))
        )
        .then(({ok, body}) => {
            if (!ok) {
                const msg = body && body.descricao ? body.descricao : "Não foi possível listar os tipos de atividades.";
                tabela.innerHTML = `
                    <tr>
                        <td colspan="3" class="empty-row">
                            Erro ao carregar tipos de atividades.
                        </td>
                    </tr>
                `;
                mostrarPopup(msg, "error");
                return;
            }

            const lista = Array.isArray(body) ? body : [];
            tiposAtividadesCarregados = lista;
            buscarTiposAtividades();
            atualizarIndicadoresOrdenacaoTiposAtividades();
        })
        .catch(error => {
            tabela.innerHTML = `
                <tr>
                    <td colspan="3" class="empty-row">
                        Erro ao carregar tipos de atividades.
                    </td>
                </tr>
            `;
            mostrarPopup("Erro ao carregar tipos de atividades: " + error, "error");
        });
}

function carregarTipoAtividade(id) {
    if (!id || !document.getElementById("idtipoatividades")) {
        return;
    }

    fetch(`${API_TIPOS_ATIVIDADES}/buscar?id=${id}`)
        .then(response =>
            extrairRespostaJson(response).then(body => ({
                ok: response.ok,
                body
            }))
        )
        .then(({ok, body}) => {
            if (!ok) {
                mostrarPopup((body && body.descricao) || "Tipo de atividade não encontrado.", "error");
                return;
            }

            exibirFormularioTipoAtividade("edicao");
            document.getElementById("idtipoatividades").value = body.idtipoatividades;
            document.getElementById("tipo").value = formatarTipoAtividade(body.tipo);
            document.getElementById("org").value = formatarTipoAtividade(body.org);
        })
        .catch(error => {
            mostrarPopup("Erro ao buscar tipo de atividade: " + error, "error");
        });
}

function cadastrarTipoAtividade() {
    const form = document.getElementById("tipoAtividadeForm");
    const tipoValor = String((form && form.tipo && form.tipo.value) ? form.tipo.value : "").trim();
    const orgValor = String((form && form.org && form.org.value) ? form.org.value : "").trim();

    if (!tipoValor || !orgValor) {
        mostrarPopup("Informe tipo e organização.", "error");
        return;
    }
    const params = new URLSearchParams();
    params.append("tipo", tipoValor);
    params.append("org", orgValor);

    const requestOptions = {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: params.toString()
    };

    fetch(`${API_TIPOS_ATIVIDADES}/cadastrar`, requestOptions)
        .then(response => {
            if (response.status === 200) {
                return response.json().then(tipoSalvo => {
                    mostrarPopup("Tipo de atividade " + tipoSalvo.tipo + " adicionado com sucesso!", "success");
                    ocultarFormularioTipoAtividade();
                    carregarTiposAtividades();
                });
            } else {
                return extrairRespostaJson(response).then(erro => {
                    mostrarPopup(erro.descricao || "Erro ao adicionar tipo de atividade!", "error");
                });
            }
        })
        .catch(error => {
            mostrarPopup("Erro ao adicionar tipo de atividade: " + error, "error");
        });
}

function editarTipoAtividade() {
    const form = document.getElementById("tipoAtividadeForm");
    const tipoValor = String((form && form.tipo && form.tipo.value) ? form.tipo.value : "").trim();
    const orgValor = String((form && form.org && form.org.value) ? form.org.value : "").trim();

    if (!tipoValor || !orgValor) {
        mostrarPopup("Informe tipo e organização.", "error");
        return;
    }
    const params = new URLSearchParams();
    params.append("id", document.getElementById("idtipoatividades").value);
    params.append("tipo", tipoValor);
    params.append("org", orgValor);

    const requestOptions = {
        method: "PUT",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: params.toString()
    };

    fetch(`${API_TIPOS_ATIVIDADES}/editar`, requestOptions)
        .then(response => {
            if (response.status === 200) {
                return response.json().then(tipoSalvo => {
                    mostrarPopup("Tipo de atividade " + tipoSalvo.tipo + " alterado com sucesso!", "success");
                    ocultarFormularioTipoAtividade();
                    carregarTiposAtividades();
                });
            } else {
                return extrairRespostaJson(response).then(erro => {
                    mostrarPopup(erro.descricao || "Erro ao editar tipo de atividade!", "error");
                });
            }
        })
        .catch(error => {
            mostrarPopup("Erro ao editar tipo de atividade: " + error, "error");
        });
}

function salvarTipoAtividade(event) {
    event.preventDefault();

    if (document.getElementById("idtipoatividades").value !== "") {
        editarTipoAtividade();
    } else {
        cadastrarTipoAtividade();
    }
}

async function deletarTipoAtividade(id) {
    const confirmado = await confirmarAcao("Tem certeza que deseja excluir este tipo de atividade?");

    if (!confirmado) {
        return;
    }

    fetch(`${API_TIPOS_ATIVIDADES}/deletar?id=${id}`, {method: "DELETE"})
        .then(response => {
            if (response.status === 200) {
                mostrarPopup("Tipo de atividade excluído com sucesso!", "success");
                carregarTiposAtividades();
            } else {
                return extrairRespostaJson(response).then(erro => {
                    mostrarPopup(erro.descricao || "Erro ao excluir tipo de atividade!", "error");
                });
            }
        })
        .catch(error => {
            mostrarPopup("Erro ao excluir tipo de atividade: " + error, "error");
        });
}

function abrirCadastroTipoAtividade() {
    limparFormularioTipoAtividade();
    exibirFormularioTipoAtividade("cadastro");
}

function abrirEdicaoTipoAtividade(id) {
    limparFormularioTipoAtividade();
    carregarTipoAtividade(id);
}

function buscarTiposAtividades() {
    const nome = document.getElementById("filtroNomeTipoAtividade");
    const org = document.getElementById("filtroOrgTipoAtividade");

    if (!nome || !org) {
        return;
    }

    const nomeFiltro = nome.value.trim().toLowerCase();
    const orgFiltro = org.value.trim().toLowerCase();

    if (nomeFiltro === "" && orgFiltro === "") {
        renderizarTabela(tiposAtividadesCarregados);
        atualizarIndicadoresOrdenacaoTiposAtividades();
        return;
    }

    const tiposFiltrados = tiposAtividadesCarregados.filter(tipoAtividade => {
        if (nomeFiltro && !String(tipoAtividade.tipo || "").toLowerCase().includes(nomeFiltro)) {
            return false;
        }

        if (orgFiltro && !String(tipoAtividade.org || "").toLowerCase().includes(orgFiltro)) {
            return false;
        }

        return true;
    });

    renderizarTabela(tiposFiltrados);
    atualizarIndicadoresOrdenacaoTiposAtividades();
}

function limparFiltrosTipoAtividade() {
    const nome = document.getElementById("filtroNomeTipoAtividade");
    const org = document.getElementById("filtroOrgTipoAtividade");

    if (nome) nome.value = "";
    if (org) org.value = "";

    renderizarTabela(tiposAtividadesCarregados);
    atualizarIndicadoresOrdenacaoTiposAtividades();
}

document.addEventListener("DOMContentLoaded", function () {
    if (!exigirPaginaViaServidor()) {
        return;
    }

    if (document.getElementById("tabelaTiposAtividades")) {
        const filtroPainel = document.getElementById("painelFiltroTipoAtividade");
        const botaoFiltros = document.getElementById("abrirFiltrosTipoAtividade");
        const fecharFiltros = document.getElementById("fecharFiltrosTipoAtividade");
        const limparFiltros = document.getElementById("limparFiltrosTipoAtividade");

        configurarOrdenacaoCabecalhoTiposAtividades();
        carregarTiposAtividades();

        document.getElementById("filtroNomeTipoAtividade").addEventListener("input", buscarTiposAtividades);
        document.getElementById("filtroOrgTipoAtividade").addEventListener("input", buscarTiposAtividades);
        document.getElementById("novoTipoAtividadeBtn").addEventListener("click", abrirCadastroTipoAtividade);

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
            limparFiltros.addEventListener("click", limparFiltrosTipoAtividade);
        }
    }

    if (document.getElementById("tipoAtividadeForm")) {
        document.getElementById("tipoAtividadeForm").addEventListener("submit", salvarTipoAtividade);
        document.getElementById("cancelarTipoAtividadeBtn").addEventListener("click", ocultarFormularioTipoAtividade);
    }
});
