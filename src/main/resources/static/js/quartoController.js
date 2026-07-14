const API_QUARTO = "/quarto";
const CAPACIDADE_POR_QUARTO = 2;
let quartosCarregados = [];
let popupTimer;
let ordenacaoAtualQuartos = "idquartos";
let ordemAtualQuartos = "asc";

function mapearDisponibilidadeParaTela(disponibilidade) {
    return disponibilidade === "N" ? "I" : "D";
}

function obterDescricaoDisponibilidade(disponibilidade) {
    return mapearDisponibilidadeParaTela(disponibilidade) === "I" ? "Indisponivel" : "Disponivel";
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

function obterQuantidadeMoradores(quarto) {
    const quantidade = Number.parseInt(quarto && quarto.qtndHospedes, 10);
    return Math.min(Math.max(Number.isFinite(quantidade) ? quantidade : 0, 0), CAPACIDADE_POR_QUARTO);
}

function obterDescricaoAla(ala) {
    return String(ala || "").trim().toUpperCase() === "F" ? "Ala feminina" : "Ala masculina";
}

function obterBadgeDisponibilidade(quarto) {
    const moradores = obterQuantidadeMoradores(quarto);

    if (moradores >= CAPACIDADE_POR_QUARTO) {
        return `<span class="quarto-status-badge lotado"><span class="material-symbols-outlined">group</span>Lotado</span>`;
    }

    if (mapearDisponibilidadeParaTela(quarto.disponibilidade) === "I") {
        return `<span class="quarto-status-badge indisponivel"><span class="material-symbols-outlined">block</span>Indispon&iacute;vel</span>`;
    }

    return `<span class="quarto-status-badge disponivel"><span class="material-symbols-outlined">check_circle</span>Dispon&iacute;vel</span>`;
}

function obterResumoOcupacao(quarto) {
    const moradores = obterQuantidadeMoradores(quarto);
    const vagasLivres = CAPACIDADE_POR_QUARTO - moradores;
    const textoVagas = vagasLivres === 0 ? "Sem vagas livres" : `${vagasLivres} ${vagasLivres === 1 ? "vaga livre" : "vagas livres"}`;
    const vagas = Array.from({length: CAPACIDADE_POR_QUARTO}, (_, indice) =>
        `<span class="quarto-ocupacao-vaga${indice < moradores ? " ocupada" : ""}" aria-hidden="true"></span>`
    ).join("");

    return `
        <div class="quarto-ocupacao">
            <div class="quarto-ocupacao-topo">
                <strong>${moradores} de ${CAPACIDADE_POR_QUARTO} moradores</strong>
                <span class="quarto-ocupacao-vagas">${vagas}</span>
            </div>
            <span>${textoVagas}</span>
        </div>
    `;
}

function renderizarLinhaQuarto(quarto) {
    const ala = String(quarto.ala || "").trim().toUpperCase();
    const classeAla = ala === "F" ? "feminina" : "masculina";
    const numero = Number.parseInt(quarto.numero || quarto.idQuartos, 10) || "-";

    return `
        <tr>
            <td>
                <div class="quarto-identificacao">
                    <span class="material-symbols-outlined">bed</span>
                    <div>
                        <strong>Quarto ${numero}</strong>
                        <span>At&eacute; ${CAPACIDADE_POR_QUARTO} moradores</span>
                    </div>
                </div>
            </td>
            <td><span class="quarto-ala-badge ${classeAla}">${obterDescricaoAla(ala)}</span></td>
            <td>${obterResumoOcupacao(quarto)}</td>
            <td>${obterBadgeDisponibilidade(quarto)}</td>
            <td class="text-right">
                <div class="quarto-actions">
                    <button type="button" class="action-icon-btn edit" data-tooltip="Editar" aria-label="Editar quarto" onclick="abrirEdicaoQuarto(${quarto.idQuartos})">
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button type="button" class="action-icon-btn delete" data-tooltip="Excluir" aria-label="Excluir quarto" onclick="deletarQuarto(${quarto.idQuartos})">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function renderizarTabela(quartos) {
    const tabela = document.getElementById("tabelaQuartos");

    if (!tabela) {
        return;
    }

    if (quartos.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="placeholder-table">Nenhum quarto cadastrado.</div>
                </td>
            </tr>
        `;
        return;
    }

    tabela.innerHTML = quartos.map(renderizarLinhaQuarto).join("");
}

function obterCampoOrdenacaoQuartos() {
    return ordenacaoAtualQuartos || "idquartos";
}

function obterOrdemOrdenacaoQuartos() {
    return ordemAtualQuartos || "asc";
}

function atualizarIndicadoresOrdenacaoQuartos() {
    const cabecalhos = document.querySelectorAll("th[data-sort]");

    cabecalhos.forEach(function (cabecalho) {
        const campo = cabecalho.getAttribute("data-sort");
        const textoOriginal = cabecalho.getAttribute("data-label") || cabecalho.textContent.replace(" ▲", "").replace(" ▼", "");
        cabecalho.setAttribute("data-label", textoOriginal);
        cabecalho.style.cursor = "pointer";
        cabecalho.style.userSelect = "none";

        if (campo === ordenacaoAtualQuartos) {
            cabecalho.textContent = textoOriginal + (ordemAtualQuartos === "asc" ? " ▲" : " ▼");
        } else {
            cabecalho.textContent = textoOriginal;
        }
    });
}

function configurarOrdenacaoCabecalhoQuartos() {
    const cabecalhos = document.querySelectorAll("th[data-sort]");

    cabecalhos.forEach(function (cabecalho) {
        cabecalho.addEventListener("click", function () {
            const campo = cabecalho.getAttribute("data-sort");

            if (!campo) {
                return;
            }

            if (ordenacaoAtualQuartos === campo) {
                ordemAtualQuartos = ordemAtualQuartos === "asc" ? "desc" : "asc";
            } else {
                ordenacaoAtualQuartos = campo;
                ordemAtualQuartos = "asc";
            }

            carregarQuartos();
        });
    });

    atualizarIndicadoresOrdenacaoQuartos();
}

function limparFormularioQuarto() {
    const form = document.getElementById("quartoForm");

    if (!form) {
        return;
    }

    form.reset();
    document.getElementById("quartoId").value = "";
    document.getElementById("ala").value = "M";
    document.getElementById("disponibilidade").value = "D";
}

function exibirFormularioQuarto(modo) {
    const card = document.getElementById("quartoFormCard");
    const titulo = document.getElementById("quartoFormTitulo");
    const novoQuartoBtn = document.getElementById("novoQuartoBtn");

    if (!card || !titulo) {
        return;
    }

    titulo.textContent = modo === "edicao" ? "Editar quarto" : "Novo quarto";
    card.style.display = "block";

    if (novoQuartoBtn) {
        novoQuartoBtn.style.display = "none";
    }

    card.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ocultarFormularioQuarto() {
    const card = document.getElementById("quartoFormCard");
    const novoQuartoBtn = document.getElementById("novoQuartoBtn");

    if (!card) {
        return;
    }

    limparFormularioQuarto();
    card.style.display = "none";

    if (novoQuartoBtn) {
        novoQuartoBtn.style.display = "inline-flex";
    }
}

function carregarQuartos() {
    const tabela = document.getElementById("tabelaQuartos");

    if (!tabela) {
        return;
    }

    tabela.innerHTML = `
        <tr>
            <td colspan="5">
                <div class="placeholder-table">Carregando quartos...</div>
            </td>
        </tr>
    `;

    const valorOrdenacao = obterCampoOrdenacaoQuartos();
    const ordem = obterOrdemOrdenacaoQuartos();
    fetch(`${API_QUARTO}/listarOrdenado?valor=${valorOrdenacao}&ordem=${ordem}`)
        .then(response =>
            extrairRespostaJson(response).then(body => ({
                ok: response.ok,
                status: response.status,
                body
            }))
        )
        .then(({ok, body}) => {
            if (!ok) {
                const msg = body && body.descricao ? body.descricao : "Nao foi possivel listar os quartos.";
                tabela.innerHTML = `
                    <tr>
                        <td colspan="5">
                            <div class="placeholder-table">Erro ao carregar quartos.</div>
                        </td>
                    </tr>
                `;
                mostrarPopup(msg, "error");
                return;
            }

            const lista = Array.isArray(body) ? body : [];
            quartosCarregados = lista;
            buscarQuartos();
            atualizarIndicadoresOrdenacaoQuartos();
        })
        .catch(error => {
            tabela.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div class="placeholder-table">Erro ao carregar quartos.</div>
                    </td>
                </tr>
            `;
            mostrarPopup("Erro ao carregar quartos: " + error, "error");
        });
}

function carregarQuarto(id) {
    if (!id || !document.getElementById("quartoId")) {
        return;
    }

    fetch(`${API_QUARTO}/buscar?id=${id}`)
        .then(response =>
            extrairRespostaJson(response).then(body => ({
                ok: response.ok,
                body
            }))
        )
        .then(({ok, body}) => {
            if (!ok) {
                mostrarPopup((body && body.descricao) || "Quarto nao encontrado.", "error");
                return;
            }

            const quarto = body;
            exibirFormularioQuarto("edicao");
            document.getElementById("quartoId").value = quarto.idQuartos;
            document.getElementById("ala").value = quarto.ala || "";
            document.getElementById("numero").value = quarto.numero;
            document.getElementById("disponibilidade").value = mapearDisponibilidadeParaTela(quarto.disponibilidade);
        })
        .catch(error => {
            mostrarPopup("Erro ao buscar quarto: " + error, "error");
        });
}

function cadastrarQuarto() {
    const form = document.getElementById("quartoForm");
    const alaValor = String((form && form.ala && form.ala.value) ? form.ala.value : "").trim();
    const numeroValor = String((form && form.numero && form.numero.value) ? form.numero.value : "").trim();
    const dispValor = String((form && form.disponibilidade && form.disponibilidade.value) ? form.disponibilidade.value : "").trim();

    if (!alaValor || !numeroValor || !dispValor) {
        mostrarPopup("Preencha todos os campos do quarto.", "error");
        return;
    }
    const params = new URLSearchParams();
    params.append("ala", alaValor);
    params.append("numero", numeroValor);
    params.append("disponibilidade", dispValor);

    const requestOptions = {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: params.toString()
    };

    fetch(`${API_QUARTO}/cadastrar`, requestOptions)
        .then(response => {
            if (response.status === 200) {
                return response.json()
                    .then(quartoSalvo => {
                        mostrarPopup("Quarto " + quartoSalvo.ala + " adicionado com sucesso!", "success");
                        ocultarFormularioQuarto();
                        carregarQuartos();
                    });
            } else {
                return extrairRespostaJson(response)
                    .then(erro => {
                        mostrarPopup(erro.descricao || "Erro ao adicionar o quarto!", "error");
                    });
            }
        })
        .catch(error => {
            mostrarPopup("Erro ao adicionar quarto: " + error, "error");
        });
}

function editarQuarto() {
    const form = document.getElementById("quartoForm");
    const alaValor = String((form && form.ala && form.ala.value) ? form.ala.value : "").trim();
    const numeroValor = String((form && form.numero && form.numero.value) ? form.numero.value : "").trim();
    const dispValor = String((form && form.disponibilidade && form.disponibilidade.value) ? form.disponibilidade.value : "").trim();

    if (!alaValor || !numeroValor || !dispValor) {
        mostrarPopup("Preencha todos os campos do quarto.", "error");
        return;
    }
    const params = new URLSearchParams();
    params.append("id", document.getElementById("quartoId").value);
    params.append("ala", alaValor);
    params.append("numero", numeroValor);
    params.append("disponibilidade", dispValor);

    const requestOptions = {
        method: "PUT",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: params.toString()
    };

    fetch(`${API_QUARTO}/editar`, requestOptions)
        .then(response => {
            if (response.status === 200) {
                return response.json()
                    .then(quartoSalvo => {
                        mostrarPopup("Quarto " + quartoSalvo.ala + " alterado com sucesso!", "success");
                        ocultarFormularioQuarto();
                        carregarQuartos();
                    });
            } else {
                return extrairRespostaJson(response)
                    .then(erro => {
                        mostrarPopup(erro.descricao || "Erro ao editar o quarto!", "error");
                    });
            }
        })
        .catch(error => {
            mostrarPopup("Erro ao editar quarto: " + error, "error");
        });
}

function salvarQuarto(event) {
    event.preventDefault();

    if (document.getElementById("quartoId").value !== "") {
        editarQuarto();
    } else {
        cadastrarQuarto();
    }
}

async function deletarQuarto(id) {
    const confirmado = await confirmarAcao("Tem certeza que deseja excluir este quarto?");

    if (!confirmado) {
        return;
    }

    const requestOptions = { method: "DELETE" };

    fetch(`${API_QUARTO}/deletar?id=${id}`, requestOptions)
        .then(response => {
            if (response.status === 200) {
                mostrarPopup("Quarto excluido com sucesso!", "success");
                carregarQuartos();
            } else {
                return extrairRespostaJson(response)
                    .then(erro => {
                        mostrarPopup(erro.descricao || "Erro ao excluir o quarto!", "error");
                    });
            }
        })
        .catch(error => {
            mostrarPopup("Erro ao excluir quarto: " + error, "error");
        });
}

function abrirCadastroQuarto() {
    limparFormularioQuarto();
    exibirFormularioQuarto("cadastro");
}

function abrirEdicaoQuarto(id) {
    limparFormularioQuarto();
    carregarQuarto(id);
}

function buscarQuartos() {
    const disponibilidade = document.getElementById("filtroDisponibilidadeQuarto");
    const ala = document.getElementById("filtroAlaQuarto");
    const tabela = document.getElementById("tabelaQuartos");

    if (!disponibilidade || !ala || !tabela) {
        return;
    }

    const disponibilidadeFiltro = disponibilidade.value;
    const alaFiltro = ala.value;

    const quartosFiltrados = quartosCarregados.filter(quarto => {
        const disponibilidadeQuarto = mapearDisponibilidadeParaTela(quarto.disponibilidade);
        const alaQuarto = String(quarto.ala || "");

        if (disponibilidadeFiltro && disponibilidadeQuarto !== disponibilidadeFiltro) {
            return false;
        }

        if (alaFiltro && alaQuarto !== alaFiltro) {
            return false;
        }

        return true;
    });

    renderizarTabela(quartosFiltrados);
    atualizarIndicadoresOrdenacaoQuartos();
}

function limparFiltrosQuarto() {
    const disponibilidade = document.getElementById("filtroDisponibilidadeQuarto");
    const ala = document.getElementById("filtroAlaQuarto");

    if (disponibilidade) disponibilidade.value = "";
    if (ala) ala.value = "";

    renderizarTabela(quartosCarregados);
    atualizarIndicadoresOrdenacaoQuartos();
}

document.addEventListener("DOMContentLoaded", function () {
    if (!exigirPaginaViaServidor()) {
        return;
    }

    if (document.getElementById("tabelaQuartos")) {
        const filtroPainel = document.getElementById("painelFiltroQuarto");
        const botaoFiltros = document.getElementById("abrirFiltrosQuarto");
        const fecharFiltros = document.getElementById("fecharFiltrosQuarto");
        const limparFiltros = document.getElementById("limparFiltrosQuarto");

        configurarOrdenacaoCabecalhoQuartos();
        carregarQuartos();
        document.getElementById("filtroDisponibilidadeQuarto").addEventListener("change", buscarQuartos);
        document.getElementById("filtroAlaQuarto").addEventListener("change", buscarQuartos);
        document.getElementById("novoQuartoBtn").addEventListener("click", abrirCadastroQuarto);

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
            limparFiltros.addEventListener("click", limparFiltrosQuarto);
        }
    }

    if (document.getElementById("quartoForm")) {
        document.getElementById("quartoForm").addEventListener("submit", salvarQuarto);
        document.getElementById("cancelarQuartoBtn").addEventListener("click", ocultarFormularioQuarto);
    }




});
