const API_BASE = "";
const API_ATIVIDADES = `${API_BASE}/atividades`;
const API_TIPOS_ATIVIDADES = `${API_BASE}/tipoatividades`;
const API_MORADOR = `${API_BASE}/morador`;
const API_ATIVIDADES_MORADOR = `${API_BASE}/atividadesmorador`;

let atividadesCarregadas = [];
let atividadesAntigasCarregadas = [];
let tiposAtividadesCarregados = [];
let moradoresCarregados = [];
let moradoresSelecionados = new Set();
let popupTimer;
let ordenacaoAtualAtividades = "date";
let ordemAtualAtividades = "asc";

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
                        <button style="background-color: red; color: #fff;" type="button" class="btn" id="confirmacaoOk">Confirmar</button>
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

function obterModalParticipantes() {
    let modal = document.getElementById("participantesModal");

    if (!modal) {
        modal = document.createElement("div");
        modal.id = "participantesModal";
        modal.className = "participantes-modal-overlay";
        modal.innerHTML = `
            <div class="participantes-modal-box">
                <div class="participantes-modal-header">
                    <h4>Moradores Participantes</h4>
                    <button type="button" class="participantes-modal-close" id="participantesModalFechar" aria-label="Fechar">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <p class="participantes-modal-subtitle" id="participantesModalSubtitle"></p>
                <div class="participantes-modal-list" id="participantesModalList"></div>
            </div>
        `;
        document.body.appendChild(modal);

        const fecharBtn = document.getElementById("participantesModalFechar");
        if (fecharBtn) {
            fecharBtn.onclick = function () {
                modal.classList.remove("show");
            };
        }

        modal.onclick = function (event) {
            if (event.target === modal) {
                modal.classList.remove("show");
            }
        };
    }

    return modal;
}

function renderizarModalParticipantes(idAtividade, idsMoradores) {
    const modal = obterModalParticipantes();
    const subtitulo = document.getElementById("participantesModalSubtitle");
    const lista = document.getElementById("participantesModalList");

    if (!subtitulo || !lista) {
        return;
    }

    let total = 0;
    if (Array.isArray(idsMoradores)) {
        total = idsMoradores.length;
    }
    subtitulo.textContent = total + " participante(s)";

    if (total === 0) {
        lista.innerHTML = `<div class="participante-modal-empty">Nenhum morador vinculado a esta atividade.</div>`;
        modal.classList.add("show");
        return;
    }

    let linhas = "";
    idsMoradores.forEach(function (idMorador) {
        const morador = moradoresCarregados.find(function (item) {
            return Number(obterIdMorador(item)) === Number(idMorador);
        });

        if (!morador) {
            linhas += `
                <div class="participante-modal-item">
                    <strong>Morador nao encontrado</strong>
                    <span>Dados do morador nao encontrados na lista atual.</span>
                </div>
            `;
            return;
        }

        const nome = escaparHtml(morador.nome || "Sem nome");
        const cpf = escaparHtml(morador.cpf || "");
        const cidade = escaparHtml(morador.cidade || "");
        const detalhes = [];
        if (cpf) {
            detalhes.push("CPF: " + cpf);
        }
        if (cidade) detalhes.push(cidade);

        linhas += `
            <div class="participante-modal-item">
                <strong>${nome}</strong>
                <span>${detalhes.join(" | ") || "Sem dados complementares"}</span>
            </div>
        `;
    });

    lista.innerHTML = linhas;
    modal.classList.add("show");
}

function obterIdTipoAtividade(atividade) {
    if (!atividade) {
        return null;
    }

    if (atividade.tipoatividades) {
        if (atividade.tipoatividades.idtipoatividades !== undefined && atividade.tipoatividades.idtipoatividades !== null) {
            return atividade.tipoatividades.idtipoatividades;
        }
        if (atividade.tipoatividades.idtipoatividade !== undefined && atividade.tipoatividades.idtipoatividade !== null) {
            return atividade.tipoatividades.idtipoatividade;
        }
    }

    if (atividade.idtipoatividade !== undefined && atividade.idtipoatividade !== null) {
        return atividade.idtipoatividade;
    }

    return null;
}

function obterIdMorador(morador) {
    if (!morador) {
        return null;
    }

    if (morador.idMorador !== undefined && morador.idMorador !== null) {
        return morador.idMorador;
    }

    if (morador.idmorador !== undefined && morador.idmorador !== null) {
        return morador.idmorador;
    }

    return null;
}

function obterIdMoradorVinculo(vinculo) {
    if (!vinculo || !vinculo.idmorador) {
        return null;
    }

    if (vinculo.idmorador.idMorador !== undefined && vinculo.idmorador.idMorador !== null) {
        return vinculo.idmorador.idMorador;
    }

    if (vinculo.idmorador.idmorador !== undefined && vinculo.idmorador.idmorador !== null) {
        return vinculo.idmorador.idmorador;
    }

    return null;
}

function formatarData(valor) {
    if (!valor) {
        return "";
    }

    const partes = String(valor).split("-");
    if (partes.length !== 3) {
        return String(valor);
    }

    return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function formatarHora(valor) {
    if (!valor) {
        return "";
    }

    return String(valor).substring(0, 5);
}

function converterHoraParaMinutos(valor) {
    if (!valor) {
        return NaN;
    }

    const partes = String(valor).split(":");
    if (partes.length < 2) {
        return NaN;
    }

    const horas = Number(partes[0]);
    const minutos = Number(partes[1]);
    if (isNaN(horas) || isNaN(minutos)) {
        return NaN;
    }

    return (horas * 60) + minutos;
}

function horaFimEhMaiorQueInicio(horaInicio, horaFim) {
    const inicio = converterHoraParaMinutos(horaInicio);
    const fim = converterHoraParaMinutos(horaFim);

    if (isNaN(inicio) || isNaN(fim)) {
        return false;
    }

    return fim > inicio;
}

function obterDataHojeIso() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    return ano + "-" + mes + "-" + dia;
}

function validarDataFormularioAtividade(exibirMensagem) {
    const campoData = document.getElementById("date");
    if (!campoData || !campoData.value) {
        if (campoData) {
            campoData.setCustomValidity("");
        }
        return true;
    }

    const hoje = obterDataHojeIso();
    if (campoData.value < hoje) {
        campoData.setCustomValidity("Data da atividade nao pode ser passada");
        if (exibirMensagem) {
            mostrarPopup("Data da atividade nao pode ser passada", "error");
        }
        return false;
    }

    campoData.setCustomValidity("");
    return true;
}

function validarHorarioFormularioAtividade(exibirMensagem) {
    const campoHoraInicio = document.getElementById("horainicio");
    const campoHoraFim = document.getElementById("horafim");

    if (!campoHoraInicio || !campoHoraFim || !campoHoraInicio.value || !campoHoraFim.value) {
        if (campoHoraFim) {
            campoHoraFim.setCustomValidity("");
        }
        return true;
    }

    if (!horaFimEhMaiorQueInicio(campoHoraInicio.value, campoHoraFim.value)) {
        campoHoraFim.setCustomValidity("Hora fim deve ser maior que hora inicio");
        if (exibirMensagem) {
            mostrarPopup("Hora fim deve ser maior que hora inicio", "error");
        }
        return false;
    }

    campoHoraFim.setCustomValidity("");
    return true;
}

function configurarRestricaoDataAtividade() {
    const campoData = document.getElementById("date");
    if (!campoData) {
        return;
    }

    campoData.min = obterDataHojeIso();
    campoData.addEventListener("input", function () {
        campoData.min = obterDataHojeIso();
        validarDataFormularioAtividade(false);
    });
    campoData.addEventListener("change", function () {
        campoData.min = obterDataHojeIso();
        validarDataFormularioAtividade(false);
    });
}

function configurarValidacaoHorarioAtividade() {
    const campoHoraInicio = document.getElementById("horainicio");
    const campoHoraFim = document.getElementById("horafim");

    if (!campoHoraInicio || !campoHoraFim) {
        return;
    }

    const validarSemPopup = function () {
        validarHorarioFormularioAtividade(false);
    };

    campoHoraInicio.addEventListener("input", validarSemPopup);
    campoHoraFim.addEventListener("input", validarSemPopup);
    campoHoraInicio.addEventListener("change", validarSemPopup);
    campoHoraFim.addEventListener("change", validarSemPopup);
}

function escaparHtml(valor) {
    return String(valor || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function escaparApostrofo(valor) {
    return String(valor || "").replace(/'/g, "''");
}

function obterDescricaoTipoAtividade(idTipoAtividade) {
    const tipo = tiposAtividadesCarregados.find(function (item) {
        return String(item.idtipoatividades) === String(idTipoAtividade);
    });

    if (!tipo) {
        return "Tipo " + idTipoAtividade;
    }

    if (tipo.org) {
        return tipo.tipo + " (" + tipo.org + ")";
    }

    return tipo.tipo || ("Tipo " + idTipoAtividade);
}

function atualizarContadorMoradores() {
    const contador = document.getElementById("contadorMoradores");
    if (contador) {
        contador.textContent = moradoresSelecionados.size + " selecionado(s)";
    }
}

function renderizarListaMoradores() {
    const container = document.getElementById("listaMoradores");

    if (!container) {
        return;
    }

    if (!Array.isArray(moradoresCarregados) || moradoresCarregados.length === 0) {
        container.innerHTML = `<div class="placeholder-table" style="padding: 12px;">Nenhum morador cadastrado.</div>`;
        atualizarContadorMoradores();
        return;
    }

    let linhas = "";
    const lista = moradoresCarregados
        .slice()
        .sort(function (a, b) {
            return String(a.nome || "").localeCompare(String(b.nome || ""));
        });

    lista.forEach(function (morador) {
        const idMorador = obterIdMorador(morador);
        const nomeMorador = morador.nome || "Sem nome";
        const cpf = morador.cpf || "";
        const cidade = morador.cidade || "";

        if (idMorador === null || idMorador === undefined || idMorador === "") {
            return;
        }

        let checked = "";
        if (moradoresSelecionados.has(Number(idMorador))) {
            checked = "checked";
        }
        let cpfTexto = "";
        if (cpf) {
            cpfTexto = "CPF: " + cpf;
        }
        let cidadeTexto = "";
        if (cidade) {
            cidadeTexto = cidade;
        }
        const detalhes = [cpfTexto, cidadeTexto].filter(Boolean).join(" | ") || "Sem dados complementares";

        linhas += `
            <div class="morador-item">
                <label>
                    <div class="morador-info">
                        <strong>${nomeMorador}</strong>
                        <span>${detalhes}</span>
                    </div>
                    <input class="morador-checkbox" type="checkbox" ${checked} onchange="alternarMoradorSelecionado(${idMorador}, this.checked)" />
                </label>
            </div>
        `;
    });

    if (linhas === "") {
        linhas = `<div class="placeholder-table" style="padding: 12px;">Nenhum morador cadastrado.</div>`;
    }

    container.innerHTML = linhas;
    atualizarContadorMoradores();
}

function alternarMoradorSelecionado(idMorador, selecionado) {
    const id = Number(idMorador);

    if (selecionado) {
        moradoresSelecionados.add(id);
    } else {
        moradoresSelecionados.delete(id);
    }

    atualizarContadorMoradores();
}

window.alternarMoradorSelecionado = alternarMoradorSelecionado;

function renderizarSelectTiposAtividades() {
    const select = document.getElementById("idtipoatividade");
    if (!select) {
        return;
    }

    if (!Array.isArray(tiposAtividadesCarregados) || tiposAtividadesCarregados.length === 0) {
        select.innerHTML = `<option value="">Nenhum tipo cadastrado</option>`;
        return;
    }

    let opcoes = `<option value="">Selecione...</option>`;
    tiposAtividadesCarregados.forEach(function (tipoAtividade) {
        let texto = tipoAtividade.tipo;
        if (tipoAtividade.org) {
            texto = tipoAtividade.tipo + " (" + tipoAtividade.org + ")";
        }
        opcoes += `<option value="${tipoAtividade.idtipoatividades}">${texto}</option>`;
    });

    select.innerHTML = opcoes;
}

function renderizarTabela(atividades) {
    const tabela = document.getElementById("tabelaAtividades");

    if (!tabela) {
        return;
    }

    let linhas = "";

    if (atividades.length === 0) {
        linhas = `
            <tr>
                <td colspan="5">
                    <div class="placeholder-table">Nenhuma atividade agendada.</div>
                </td>
            </tr>
        `;
    } else {
        atividades.forEach(function (atividade) {
            const idTipo = obterIdTipoAtividade(atividade);
            const horario = formatarHora(atividade.horainicio) + " - " + formatarHora(atividade.horafim);

            linhas += `
                <tr>
                    <td>${atividade.nome || ""}</td>
                    <td>${formatarData(atividade.date)}</td>
                    <td>${horario}</td>
                    <td>${obterDescricaoTipoAtividade(idTipo)}</td>
                    <td class="text-right">
                        <div style="display:inline-flex; gap:8px;">
                            <button type="button" class="action-icon-btn view" aria-label="Ver moradores participantes" onclick="visualizarParticipantesAtividade(${atividade.idatividade})">
                                <span class="material-symbols-outlined">visibility</span>
                            </button>
                            <button type="button" class="action-icon-btn edit" aria-label="Editar atividade" onclick="abrirEdicaoAtividade(${atividade.idatividade})">
                                <span class="material-symbols-outlined">edit</span>
                            </button>
                            <button type="button" class="action-icon-btn delete" aria-label="Excluir atividade" onclick="deletarAtividade(${atividade.idatividade})">
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

function obterCampoOrdenacaoAtividades() {
    return ordenacaoAtualAtividades || "date";
}

function obterOrdemOrdenacaoAtividades() {
    return ordemAtualAtividades || "asc";
}

function obterValorOrdenacaoAtividade(atividade, campo) {
    if (campo === "idatividade") {
        return Number(atividade.idatividade || 0);
    }

    if (campo === "nome") {
        return String(atividade.nome || "").toLowerCase();
    }

    if (campo === "date") {
        return String(atividade.date || "");
    }

    if (campo === "horainicio") {
        return String(atividade.horainicio || "");
    }

    if (campo === "idtipoatividade") {
        return Number(obterIdTipoAtividade(atividade) || 0);
    }

    return "";
}

function ordenarAtividadesLocalmente(atividades) {
    const campo = obterCampoOrdenacaoAtividades();
    const ordem = obterOrdemOrdenacaoAtividades();
    let fator = 1;
    if (ordem === "desc") {
        fator = -1;
    }

    return atividades.slice().sort(function (a, b) {
        const valorA = obterValorOrdenacaoAtividade(a, campo);
        const valorB = obterValorOrdenacaoAtividade(b, campo);

        if (valorA < valorB) {
            return -1 * fator;
        }
        if (valorA > valorB) {
            return 1 * fator;
        }
        return 0;
    });
}

function atualizarIndicadoresOrdenacaoAtividades() {
    const cabecalhos = document.querySelectorAll("th[data-sort]");

    cabecalhos.forEach(function (cabecalho) {
        const campo = cabecalho.getAttribute("data-sort");
        const textoOriginal = cabecalho.getAttribute("data-label") || cabecalho.textContent.replace(" ▲", "").replace(" ▼", "");
        cabecalho.setAttribute("data-label", textoOriginal);
        cabecalho.style.cursor = "pointer";
        cabecalho.style.userSelect = "none";

        if (campo === ordenacaoAtualAtividades) {
            let indicador = " ▼";
            if (ordemAtualAtividades === "asc") {
                indicador = " ▲";
            }
            cabecalho.textContent = textoOriginal + indicador;
        } else {
            cabecalho.textContent = textoOriginal;
        }
    });
}

function configurarOrdenacaoCabecalhoAtividades() {
    const cabecalhos = document.querySelectorAll("th[data-sort]");

    cabecalhos.forEach(function (cabecalho) {
        cabecalho.addEventListener("click", function () {
            const campo = cabecalho.getAttribute("data-sort");

            if (!campo) {
                return;
            }

            if (ordenacaoAtualAtividades === campo) {
                if (ordemAtualAtividades === "asc") {
                    ordemAtualAtividades = "desc";
                } else {
                    ordemAtualAtividades = "asc";
                }
            } else {
                ordenacaoAtualAtividades = campo;
                ordemAtualAtividades = "asc";
            }

            carregarAtividades();
        });
    });

    atualizarIndicadoresOrdenacaoAtividades();
}

function limparFormularioAtividade() {
    const form = document.getElementById("atividadeForm");

    if (!form) {
        return;
    }

    form.reset();
    document.getElementById("atividadeId").value = "";
    moradoresSelecionados = new Set();
    renderizarListaMoradores();
}

function exibirFormularioAtividade(modo) {
    const card = document.getElementById("atividadeFormCard");
    const titulo = document.getElementById("atividadeFormTitulo");
    const novoAtividadeBtn = document.getElementById("novoAtividadeBtn");

    if (!card || !titulo) {
        return;
    }

    if (modo === "edicao") {
        titulo.textContent = "Editar atividade";
    } else {
        titulo.textContent = "Agendar atividade";
    }
    card.style.display = "block";

    if (novoAtividadeBtn) {
        novoAtividadeBtn.style.display = "none";
    }

    card.scrollIntoView({behavior: "smooth", block: "start"});
}

function ocultarFormularioAtividade() {
    const card = document.getElementById("atividadeFormCard");
    const novoAtividadeBtn = document.getElementById("novoAtividadeBtn");

    if (!card) {
        return;
    }

    limparFormularioAtividade();
    card.style.display = "none";

    if (novoAtividadeBtn) {
        novoAtividadeBtn.style.display = "inline-flex";
    }
}

async function carregarTiposAtividades() {
    const response = await fetch(`${API_TIPOS_ATIVIDADES}/listarOrdenado?valor=tipo&ordem=asc`);
    const body = await extrairRespostaJson(response);

    if (!response.ok) {
        const mensagemErro = (body && body.descricao) || "Nao foi possivel carregar os tipos de atividades.";
        mostrarPopup(mensagemErro, "error");
        tiposAtividadesCarregados = [];
        renderizarSelectTiposAtividades();
        return;
    }

    if (Array.isArray(body)) {
        tiposAtividadesCarregados = body;
    } else {
        tiposAtividadesCarregados = [];
    }
    renderizarSelectTiposAtividades();
}

async function carregarMoradores() {
    const response = await fetch(`${API_MORADOR}/listar`);
    const body = await extrairRespostaJson(response);

    if (!response.ok) {
        const mensagemErro = (body && body.descricao) || "Nao foi possivel carregar os moradores.";
        mostrarPopup(mensagemErro, "error");
        moradoresCarregados = [];
        renderizarListaMoradores();
        return;
    }

    if (Array.isArray(body)) {
        moradoresCarregados = body;
    } else {
        moradoresCarregados = [];
    }
    renderizarListaMoradores();
}

async function carregarAtividades() {
    const tabela = document.getElementById("tabelaAtividades");
    if (!tabela) {
        return;
    }

    tabela.innerHTML = `
        <tr>
            <td colspan="5">
                <div class="placeholder-table">Carregando atividades...</div>
            </td>
        </tr>
    `;

    const response = await fetch(`${API_ATIVIDADES}/listar`);
    const body = await extrairRespostaJson(response);

    if (!response.ok) {
        console.error("Erro ao listar atividades:", body);
        let msg = "Nao foi possivel listar as atividades.";
        if (body && body.descricao) {
            msg = body.descricao;
        }
        tabela.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="placeholder-table">Erro ao carregar atividades.</div>
                </td>
            </tr>
        `;
        mostrarPopup(msg, "error");
        return;
    }

    let listaAtividades = [];
    if (Array.isArray(body)) {
        listaAtividades = body;
    }
    atividadesCarregadas = ordenarAtividadesLocalmente(listaAtividades);
    await buscarAtividades();
    atualizarIndicadoresOrdenacaoAtividades();
}

async function carregarAtividadesAntigas() {
    const response = await fetch(`${API_ATIVIDADES}/listarAntigas`);
    const body = await extrairRespostaJson(response);

    if (!response.ok) {
        console.error("Erro ao listar atividades antigas:", body);
        let msg = "Nao foi possivel listar as atividades antigas.";
        if (body && body.descricao) {
            msg = body.descricao;
        }
        mostrarPopup(msg, "error");
        atividadesAntigasCarregadas = [];
        return [];
    }

    let listaAtividadesAntigas = [];
    if (Array.isArray(body)) {
        listaAtividadesAntigas = body;
    }
    atividadesAntigasCarregadas = ordenarAtividadesLocalmente(listaAtividadesAntigas);
    return atividadesAntigasCarregadas;
}

async function carregarAtividadePorId(idAtividade) {
    const response = await fetch(`${API_ATIVIDADES}/buscar?id=${idAtividade}`);
    const body = await extrairRespostaJson(response);

    if (!response.ok) {
        mostrarPopup((body && body.descricao) || "Atividade nao encontrada.", "error");
        return null;
    }

    return body;
}

async function carregarIdsMoradoresDaAtividade(idAtividade) {
    const response = await fetch(`${API_ATIVIDADES_MORADOR}/listarPorAtividade?idatividade=${idAtividade}`);
    const body = await extrairRespostaJson(response);

    if (!response.ok) {
        return [];
    }

    if (!Array.isArray(body)) {
        return [];
    }

    return body
        .map(function (vinculo) {
            return Number(obterIdMoradorVinculo(vinculo));
        })
        .filter(function (idMorador) {
            return !isNaN(idMorador);
        });
}

async function visualizarParticipantesAtividade(idAtividade) {
    if (!Array.isArray(moradoresCarregados) || moradoresCarregados.length === 0) {
        await carregarMoradores();
    }

    const idsMoradores = await carregarIdsMoradoresDaAtividade(idAtividade);
    renderizarModalParticipantes(idAtividade, idsMoradores);
}

function obterParamsFormularioAtividade(incluirId) {
    const form = document.getElementById("atividadeForm");
    const params = new URLSearchParams();

    if (incluirId) {
        params.append("id", document.getElementById("atividadeId").value);
    }

    params.append("nome", escaparApostrofo(form.nome.value.trim()));
    params.append("descricao", escaparApostrofo(form.descricao.value.trim()));
    params.append("date", form.date.value);
    params.append("horainicio", form.horainicio.value);
    params.append("horafim", form.horafim.value);
    params.append("idtipoatividade", form.idtipoatividade.value);

    return params;
}

async function cadastrarVinculoAtividadeMorador(idAtividade, idMorador) {
    const params = new URLSearchParams();
    params.append("idatividade", idAtividade);
    params.append("idmorador", idMorador);

    const response = await fetch(`${API_ATIVIDADES_MORADOR}/cadastrar`, {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: params.toString()
    });

    if (!response.ok) {
        const vinculoExiste = await verificarVinculoAtividadeMorador(idAtividade, idMorador);
        if (vinculoExiste === true) {
            return {ok: true};
        }

        const erro = await extrairRespostaJson(response);
        let descricaoErro = "";
        if (erro && erro.descricao) {
            descricaoErro = String(erro.descricao);
        }
        return {ok: false, mensagem: descricaoErro || "Falha ao vincular morador " + idMorador};
    }

    return {ok: true};
}

async function deletarVinculoAtividadeMorador(idAtividade, idMorador) {
    const response = await fetch(`${API_ATIVIDADES_MORADOR}/deletar?idatividade=${idAtividade}&idmorador=${idMorador}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        const vinculoExiste = await verificarVinculoAtividadeMorador(idAtividade, idMorador);
        if (vinculoExiste === false) {
            return {ok: true};
        }

        const erro = await extrairRespostaJson(response);
        let descricaoErro = "";
        if (erro && erro.descricao) {
            descricaoErro = String(erro.descricao);
        }
        return {ok: false, mensagem: descricaoErro || "Falha ao remover vinculo do morador " + idMorador};
    }

    return {ok: true};
}

async function verificarVinculoAtividadeMorador(idAtividade, idMorador) {
    try {
        const response = await fetch(`${API_ATIVIDADES_MORADOR}/buscar?idatividade=${idAtividade}&idmorador=${idMorador}`);
        return response.ok;
    } catch (e) {
        return null;
    }
}

async function vincularMoradoresNaAtividade(idAtividade, idsMoradores) {
    const falhas = [];

    for (let i = 0; i < idsMoradores.length; i++) {
        const idMorador = idsMoradores[i];
        const resultado = await cadastrarVinculoAtividadeMorador(idAtividade, idMorador);
        if (!resultado.ok) {
            falhas.push(resultado.mensagem);
        }
    }

    return {falhas: falhas};
}

async function sincronizarMoradoresDaAtividade(idAtividade, idsNovosMoradores) {
    const idsAtuais = await carregarIdsMoradoresDaAtividade(idAtividade);
    const conjuntoAtual = new Set(idsAtuais.map(function (id) { return Number(id); }));
    const conjuntoNovo = new Set(idsNovosMoradores.map(function (id) { return Number(id); }));
    const falhas = [];

    const idsRemover = [];
    conjuntoAtual.forEach(function (id) {
        if (!conjuntoNovo.has(id)) {
            idsRemover.push(id);
        }
    });

    const idsAdicionar = [];
    conjuntoNovo.forEach(function (id) {
        if (!conjuntoAtual.has(id)) {
            idsAdicionar.push(id);
        }
    });

    for (let i = 0; i < idsRemover.length; i++) {
        const resultadoRemocao = await deletarVinculoAtividadeMorador(idAtividade, idsRemover[i]);
        if (!resultadoRemocao.ok) {
            falhas.push(resultadoRemocao.mensagem);
        }
    }

    for (let i = 0; i < idsAdicionar.length; i++) {
        const resultadoAdicao = await cadastrarVinculoAtividadeMorador(idAtividade, idsAdicionar[i]);
        if (!resultadoAdicao.ok) {
            falhas.push(resultadoAdicao.mensagem);
        }
    }

    return {falhas: falhas};
}

async function cadastrarAtividade() {
    const form = document.getElementById("atividadeForm");
    const idsMoradores = Array.from(moradoresSelecionados);

    if (!form.idtipoatividade.value) {
        mostrarPopup("Selecione o tipo de atividade.", "error");
        return;
    }

    if (idsMoradores.length === 0) {
        mostrarPopup("Selecione pelo menos um morador participante.", "error");
        return;
    }

    if (!validarDataFormularioAtividade(true)) {
        return;
    }

    if (!validarHorarioFormularioAtividade(true)) {
        return;
    }

    const response = await fetch(`${API_ATIVIDADES}/cadastrar`, {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: obterParamsFormularioAtividade(false).toString()
    });

    const body = await extrairRespostaJson(response);
    if (!response.ok) {
        console.error("Erro ao cadastrar atividade:", body);
        mostrarPopup((body && body.descricao) || "Erro ao cadastrar atividade.", "error");
        return;
    }

    const idAtividade = body.idatividade;
    if (!idAtividade) {
        mostrarPopup("Atividade salva, mas o ID retornado foi invalido.", "error");
        ocultarFormularioAtividade();
        await carregarAtividades();
        return;
    }

    const resultadoVinculos = await vincularMoradoresNaAtividade(idAtividade, idsMoradores);

    if (resultadoVinculos.falhas.length > 0) {
        mostrarPopup("Atividade salva, mas houve falhas ao vincular alguns moradores.", "error");
    } else {
        mostrarPopup("Atividade agendada com sucesso!", "success");
    }

    ocultarFormularioAtividade();
    await carregarAtividades();
}

async function editarAtividade() {
    const form = document.getElementById("atividadeForm");
    const idAtividade = document.getElementById("atividadeId").value;
    const idsMoradores = Array.from(moradoresSelecionados);

    if (!form.idtipoatividade.value) {
        mostrarPopup("Selecione o tipo de atividade.", "error");
        return;
    }

    if (idsMoradores.length === 0) {
        mostrarPopup("Selecione pelo menos um morador participante.", "error");
        return;
    }

    if (!validarDataFormularioAtividade(true)) {
        return;
    }

    if (!validarHorarioFormularioAtividade(true)) {
        return;
    }

    const response = await fetch(`${API_ATIVIDADES}/editar`, {
        method: "PUT",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: obterParamsFormularioAtividade(true).toString()
    });

    const body = await extrairRespostaJson(response);
    if (!response.ok) {
        mostrarPopup((body && body.descricao) || "Erro ao editar atividade.", "error");
        return;
    }

    const resultadoVinculos = await sincronizarMoradoresDaAtividade(idAtividade, idsMoradores);
    if (resultadoVinculos.falhas.length > 0) {
        mostrarPopup("Atividade editada, mas houve falhas ao atualizar alguns moradores.", "error");
    } else {
        mostrarPopup("Atividade editada com sucesso!", "success");
    }

    ocultarFormularioAtividade();
    await carregarAtividades();
}

async function salvarAtividade(event) {
    event.preventDefault();

    const idAtividade = document.getElementById("atividadeId").value;
    if (idAtividade) {
        await editarAtividade();
    } else {
        await cadastrarAtividade();
    }
}

async function deletarAtividade(idAtividade) {
    const confirmado = await confirmarAcao("Tem certeza que deseja excluir esta atividade?");
    if (!confirmado) {
        return;
    }

    const idsMoradores = await carregarIdsMoradoresDaAtividade(idAtividade);
    for (let i = 0; i < idsMoradores.length; i++) {
        await deletarVinculoAtividadeMorador(idAtividade, idsMoradores[i]);
    }

    const response = await fetch(`${API_ATIVIDADES}/deletar?id=${idAtividade}`, {method: "DELETE"});
    if (!response.ok) {
        const erro = await extrairRespostaJson(response);
        console.error("Erro ao excluir atividade:", erro);
        mostrarPopup((erro && erro.descricao) || "Nao foi possivel excluir a atividade.", "error");
        return;
    }

    mostrarPopup("Atividade excluida com sucesso!", "success");
    await carregarAtividades();
}

async function abrirEdicaoAtividade(idAtividade) {
    limparFormularioAtividade();

    const atividade = await carregarAtividadePorId(idAtividade);
    if (!atividade) {
        return;
    }

    const idsMoradores = await carregarIdsMoradoresDaAtividade(idAtividade);
    moradoresSelecionados = new Set(idsMoradores);

    exibirFormularioAtividade("edicao");
    document.getElementById("atividadeId").value = atividade.idatividade;
    document.getElementById("nome").value = atividade.nome || "";
    document.getElementById("descricao").value = atividade.descricao || "";
    document.getElementById("date").value = atividade.date || "";
    document.getElementById("horainicio").value = formatarHora(atividade.horainicio);
    document.getElementById("horafim").value = formatarHora(atividade.horafim);
    document.getElementById("idtipoatividade").value = String(obterIdTipoAtividade(atividade) || "");
    renderizarListaMoradores();
}

window.abrirEdicaoAtividade = abrirEdicaoAtividade;
window.deletarAtividade = deletarAtividade;
window.visualizarParticipantesAtividade = visualizarParticipantesAtividade;

function abrirCadastroAtividade() {
    limparFormularioAtividade();
    const campoData = document.getElementById("date");
    if (campoData) {
        campoData.min = obterDataHojeIso();
    }
    exibirFormularioAtividade("cadastro");
}

async function buscarAtividades() {
    const campo = document.getElementById("filtroCampoAtividade");
    const busca = document.getElementById("filtroBuscaAtividade");

    if (!campo || !busca) {
        return;
    }

    const texto = busca.value.trim().toLowerCase();
    const tipoFiltro = campo.value;
    let atividadesBase = atividadesCarregadas;

    if (tipoFiltro === "antigas") {
        atividadesBase = await carregarAtividadesAntigas();
        renderizarTabela(atividadesBase);
        atualizarIndicadoresOrdenacaoAtividades();
        return;
    }

    if (texto === "") {
        renderizarTabela(atividadesBase);
        atualizarIndicadoresOrdenacaoAtividades();
        return;
    }

    const atividadesFiltradas = atividadesBase.filter(function (atividade) {
        if (tipoFiltro === "date") {
            return formatarData(atividade.date).toLowerCase().includes(texto) || String(atividade.date || "").toLowerCase().includes(texto);
        }

        if (tipoFiltro === "tipo") {
            const idTipo = obterIdTipoAtividade(atividade);
            return obterDescricaoTipoAtividade(idTipo).toLowerCase().includes(texto);
        }

        return String(atividade.nome || "").toLowerCase().includes(texto);
    });

    renderizarTabela(atividadesFiltradas);
    atualizarIndicadoresOrdenacaoAtividades();
}

function alterarTipoBuscaAtividade() {
    const campo = document.getElementById("filtroCampoAtividade");
    const busca = document.getElementById("filtroBuscaAtividade");

    if (!campo || !busca) {
        return;
    }

    if (campo.value === "antigas") {
        busca.type = "text";
        busca.placeholder = "Atividades antigas";
        busca.value = "";
        busca.disabled = true;
        buscarAtividades();
        return;
    }

    busca.disabled = false;

    busca.type = "text";
    busca.placeholder = "Digite para buscar";

    busca.value = "";
    buscarAtividades();
    atualizarIndicadoresOrdenacaoAtividades();
}

async function inicializarDadosTela() {
    try {
        await carregarTiposAtividades();
        await carregarMoradores();
        await carregarAtividades();
    } catch (e) {
        mostrarPopup("Erro ao inicializar a tela: " + e, "error");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    if (!exigirPaginaViaServidor()) {
        return;
    }

    if (document.getElementById("tabelaAtividades")) {
        const filtroPainel = document.getElementById("painelFiltroAtividade");
        const botaoFiltros = document.getElementById("abrirFiltrosAtividade");
        const fecharFiltros = document.getElementById("fecharFiltrosAtividade");

        configurarOrdenacaoCabecalhoAtividades();
        inicializarDadosTela();
        alterarTipoBuscaAtividade();

        document.getElementById("filtroCampoAtividade").addEventListener("change", alterarTipoBuscaAtividade);
        document.getElementById("filtroBuscaAtividade").addEventListener("input", buscarAtividades);
        document.getElementById("novoAtividadeBtn").addEventListener("click", abrirCadastroAtividade);

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

    if (document.getElementById("atividadeForm")) {
        configurarRestricaoDataAtividade();
        configurarValidacaoHorarioAtividade();
        document.getElementById("atividadeForm").addEventListener("submit", salvarAtividade);
        document.getElementById("cancelarAtividadeBtn").addEventListener("click", ocultarFormularioAtividade);
    }
});
