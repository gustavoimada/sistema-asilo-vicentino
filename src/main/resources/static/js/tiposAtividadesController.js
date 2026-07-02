const API_BASE = "";
const API_TIPOS_ATIVIDADES = `${API_BASE}/tipoatividades`;
let tiposAtividadesCarregados = [];
let popupTimer;
let ordenacaoAtualTiposAtividades = "idtipoatividade";
let ordemAtualTiposAtividades = "asc";

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
                    <h4>Confirmar acao</h4>
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
    return ordenacaoAtualTiposAtividades || "idtipoatividade";
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

    if (tiposAtividades.length === 0) {
        linhas = `
            <tr>
                <td colspan="4">
                    <div class="placeholder-table">Nenhum tipo de atividade cadastrado.</div>
                </td>
            </tr>
        `;
    } else {
        tiposAtividades.forEach(tipoAtividade => {
            linhas += `
                <tr>
                    <td class="strong">${tipoAtividade.idtipoatividades}</td>
                    <td>${tipoAtividade.tipo || ""}</td>
                    <td>${tipoAtividade.org || ""}</td>
                    <td class="text-right">
                        <div style="display:inline-flex; gap:8px;">
                            <button type="button" class="action-icon-btn edit" aria-label="Editar tipo de atividade" onclick="abrirEdicaoTipoAtividade(${tipoAtividade.idtipoatividades})">
                                <span class="material-symbols-outlined">edit</span>
                            </button>
                            <button type="button" class="action-icon-btn delete" aria-label="Excluir tipo de atividade" onclick="deletarTipoAtividade(${tipoAtividade.idtipoatividades})">
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

    titulo.textContent = modo === "edicao" ? "Editar tipo de atividade" : "Cadastrar tipo de atividade";
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
            <td colspan="4">
                <div class="placeholder-table">Carregando tipos de atividades...</div>
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
                const msg = body && body.descricao ? body.descricao : "Nao foi possivel listar os tipos de atividades.";
                tabela.innerHTML = `
                    <tr>
                        <td colspan="4">
                            <div class="placeholder-table">Erro ao carregar tipos de atividades.</div>
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
                    <td colspan="4">
                        <div class="placeholder-table">Erro ao carregar tipos de atividades.</div>
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
                mostrarPopup((body && body.descricao) || "Tipo de atividade nao encontrado.", "error");
                return;
            }

            exibirFormularioTipoAtividade("edicao");
            document.getElementById("idtipoatividades").value = body.idtipoatividades;
            document.getElementById("tipo").value = body.tipo || "";
            document.getElementById("org").value = body.org || "";
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
        mostrarPopup("Informe tipo e organizacao.", "error");
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
        mostrarPopup("Informe tipo e organizacao.", "error");
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
    const confirmado = await confirmarAcao("Tem certeza que deseja excluir o tipo de atividade ID " + id + "?");

    if (!confirmado) {
        return;
    }

    fetch(`${API_TIPOS_ATIVIDADES}/deletar?id=${id}`, {method: "DELETE"})
        .then(response => {
            if (response.status === 200) {
                mostrarPopup("Tipo de atividade excluido com sucesso!", "success");
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
    const campo = document.getElementById("filtroCampoTipoAtividade");
    const busca = document.getElementById("filtroBuscaTipoAtividade");

    if (!campo || !busca) {
        return;
    }

    const texto = busca.value.trim().toLowerCase();
    const tipoFiltro = campo.value;

    if (texto === "") {
        renderizarTabela(tiposAtividadesCarregados);
        return;
    }

    const tiposFiltrados = tiposAtividadesCarregados.filter(tipoAtividade => {
        if (tipoFiltro === "idtipoatividades") {
            return String(tipoAtividade.idtipoatividades).toLowerCase().includes(texto);
        }

        if (tipoFiltro === "org") {
            return String(tipoAtividade.org || "").toLowerCase().includes(texto);
        }

        return String(tipoAtividade.tipo || "").toLowerCase().includes(texto);
    });

    renderizarTabela(tiposFiltrados);
    atualizarIndicadoresOrdenacaoTiposAtividades();
}

function alterarTipoBusca() {
    const campo = document.getElementById("filtroCampoTipoAtividade");
    const busca = document.getElementById("filtroBuscaTipoAtividade");

    if (!campo || !busca) {
        return;
    }

    if (campo.value === "idtipoatividades") {
        busca.type = "number";
        busca.placeholder = "Digite o ID";
    } else {
        busca.type = "text";
        busca.placeholder = "Digite para buscar";
    }

    busca.value = "";
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

        configurarOrdenacaoCabecalhoTiposAtividades();
        carregarTiposAtividades();
        alterarTipoBusca();

        document.getElementById("filtroCampoTipoAtividade").addEventListener("change", alterarTipoBusca);
        document.getElementById("filtroBuscaTipoAtividade").addEventListener("input", buscarTiposAtividades);
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
    }

    if (document.getElementById("tipoAtividadeForm")) {
        document.getElementById("tipoAtividadeForm").addEventListener("submit", salvarTipoAtividade);
        document.getElementById("cancelarTipoAtividadeBtn").addEventListener("click", ocultarFormularioTipoAtividade);
    }
});
