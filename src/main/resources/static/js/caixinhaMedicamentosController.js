
const estadoListaPrescricao = {
    filtros: {
        morador: "",
        medicamento: ""
    }
};

function el(id) {
    return document.getElementById(id);
}

function escapeHtml(valor) {
    return String(valor == null ? "" : valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function removerAcentos(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function formatarCargoInclusivo(categoria) {
    const valor = removerAcentos(String(categoria || "").trim()).toLowerCase();
    if (valor === "coordenador") return "Coordenador(a)";
    if (valor === "cuidador") return "Cuidador(a)";
    if (valor === "secretaria") return "Secretaria(o)";
    return String(categoria || "").trim();
}

function preencherPerfilTopo() {
    const nome = (localStorage.getItem("funcionarioNome") || localStorage.getItem("usuarioNome") || "Usuario").trim();
    const categoria = (localStorage.getItem("funcionarioCategoria") || "").trim();
    let cargoTexto = "Acesso";

    if (categoria) cargoTexto = formatarCargoInclusivo(categoria);
    if (el("perfilNome")) el("perfilNome").textContent = nome || "Usuario";
    if (el("perfilCargo")) el("perfilCargo").textContent = cargoTexto;
}

function carregarContextoUrl() {
    const params = new URLSearchParams(window.location.search);
    const parametrosContexto = ["idFuncionario", "idUser", "usuarioNome", "funcionarioNome", "categoria"];
    const tinhaContexto = parametrosContexto.some((chave) => params.has(chave));
    const idFuncionario = Number(params.get("idFuncionario") || 0);
    const idUser = Number(params.get("idUser") || 0);
    const usuarioNome = String(params.get("usuarioNome") || "").trim();
    const funcionarioNome = String(params.get("funcionarioNome") || "").trim();
    const categoria = String(params.get("categoria") || "").trim();

    if (Number.isInteger(idFuncionario) && idFuncionario > 0) localStorage.setItem("idFuncionario", String(idFuncionario));
    if (Number.isInteger(idUser) && idUser > 0) localStorage.setItem("usuarioId", String(idUser));
    if (usuarioNome) localStorage.setItem("usuarioNome", usuarioNome);
    if (funcionarioNome) localStorage.setItem("funcionarioNome", funcionarioNome);
    if (categoria) localStorage.setItem("funcionarioCategoria", categoria);

    if (!tinhaContexto || !window.history || typeof window.history.replaceState !== "function") return;

    parametrosContexto.forEach((chave) => params.delete(chave));
    const queryRestante = params.toString();
    window.history.replaceState({}, document.title, window.location.pathname + (queryRestante ? `?${queryRestante}` : "") + window.location.hash);
}

document.addEventListener("DOMContentLoaded", function () {
    const botaoAbrir = document.getElementById("abrirCadastroPrescricao");
    const botaoFechar = document.getElementById("fecharCadastroPrescricao");
    const cadastro = document.getElementById("cadastroPrescricao");
    const botaoAbrirFiltro = document.getElementById("abrirFiltrosPrescricao");
    const botaoFecharFiltro = document.getElementById("btnFecharFiltroPrescricao");
    const botaoLimparFiltro = document.getElementById("btnLimparFiltroPrescricao");
    const filtro = document.getElementById("filtroPrescricao");
    const moradorFiltroPrescricao = document.getElementById("moradorFiltroPrescricao");
    const medicamentoFiltroPrescricao = document.getElementById("medicamentoFiltroPrescricao");
    const selectMedicamento = document.getElementById("idMedicamento");
    const tabela = document.getElementById("tabelaPrescricao")

    if (!botaoAbrir) {
        return;
    }
    if (!botaoFechar) {
        return;
    }
    if (!cadastro) {
        return;
    }

    // Carrega listas de moradores e medicamentos para os formularios.
    carregarMedicamentos();
    carregarMorador();
    carregarMedicamentos("idMedicamentoEditar");
    carregarMorador("idMoradorEditar");

    botaoAbrir.addEventListener("click", function () {
        if (filtro) {
            filtro.hidden = true;
        }
        cadastro.hidden = !cadastro.hidden;
    });

    botaoFechar.addEventListener("click", function () {
        cadastro.hidden = true;
    });

    if (botaoAbrirFiltro) {
        if (filtro) {
        botaoAbrirFiltro.addEventListener("click", function () {
            cadastro.hidden = true;
            filtro.hidden = !filtro.hidden;
        });
        }
    }

    if (botaoFecharFiltro) {
        if (filtro) {
        botaoFecharFiltro.addEventListener("click", function () {
            filtro.hidden = true;
        });
        }
    }

    if (botaoLimparFiltro) {
        botaoLimparFiltro.addEventListener("click", function () {
            document.getElementById("moradorFiltroPrescricao").value = "";
            document.getElementById("medicamentoFiltroPrescricao").value = "";
            estadoListaPrescricao.filtros.morador = "";
            estadoListaPrescricao.filtros.medicamento = "";
            carregarTabela();
        });
    }

    if (moradorFiltroPrescricao) {
        moradorFiltroPrescricao.addEventListener("input", function () {
            aplicarFiltroPrescricao();
        });
    }

    if (medicamentoFiltroPrescricao) {
        medicamentoFiltroPrescricao.addEventListener("input", function () {
            aplicarFiltroPrescricao();
        });
    }

    if (selectMedicamento) {
        selectMedicamento.addEventListener("change", function () {
            atualizarQtdDosePorTipoMedicamento();
        });
    }

    const selectMedicamentoEditar = document.getElementById("idMedicamentoEditar");
    if (selectMedicamentoEditar) {
        selectMedicamentoEditar.addEventListener("change", function () {
            atualizarQtdDosePorTipoMedicamento("idMedicamentoEditar", "grupoQtdDoseEditar", "labelQtdDoseEditar", "qtdDoseEditar");
        });
    }

    if(tabela){
        configurarOrdenacaoPrescricao()
        carregarTabela();
    }

});

function carregarMedicamentos(selectId = "idMedicamento"){
    const html = document.getElementById(selectId)
    if (!html) return Promise.resolve();
    let linha = `<option value="" data-tipo="">Selecione um medicamento</option>`
    return fetch("/medicamentos/listar")
        .then(resp => resp.json())
        .then(medicamento =>{
            medicamento.forEach(medicamento =>{
                let medicamentotexto = medicamento.nome +" "+ medicamento.tipoMedicamento
                if(medicamento.dosagemUnidade !== null)
                    medicamentotexto += " " + medicamento.dosagemValor +" "+  medicamento.dosagemUnidade
                linha += `<option value="${medicamento.idMedicamento}" data-tipo="${medicamento.tipoMedicamento}">${medicamentotexto}</option>`;            })
            html.innerHTML = linha;
            if (selectId === "idMedicamento") {
                atualizarQtdDosePorTipoMedicamento();
            }
        })
        .catch(error => {
            mostrarPopup("Erro ao listar medicamentos: " + error.message, "error");
        });
}

function carregarMorador(selectId = "idMorador"){
    const html = document.getElementById(selectId)
    if (!html) return Promise.resolve();
    let linha = `<option value="">Selecione um morador</option>`
    return fetch("/morador/listar")
        .then(resp => resp.json())
        .then(moradores =>{
            moradores.forEach(morador =>{
                linha += `<option value="${morador.idMorador}">${morador.nome}</option>`;
            })
            html.innerHTML = linha;
        })
        .catch(error => {
            mostrarPopup("Erro ao listar moradores: " + error.message, "error");
        });
}

function atualizarQtdDosePorTipoMedicamento(selectId = "idMedicamento", grupoId = "grupoQtdDose", labelId = "labelQtdDose", inputId = "qtdDose") {
    const selectMedicamento = document.getElementById(selectId);
    const grupoQtdDose = document.getElementById(grupoId);
    const labelQtdDose = document.getElementById(labelId);
    const inputQtdDose = document.getElementById(inputId);

    if (selectMedicamento == null) {
        return;
    }
    if (grupoQtdDose == null) {
        return;
    }
    if (labelQtdDose == null) {
        return;
    }
    if (inputQtdDose == null) {
        return;
    }

    const opcaoSelecionada = selectMedicamento.options[selectMedicamento.selectedIndex];
    let tipoMedicamento = "";
    if (opcaoSelecionada != null) {
        if (opcaoSelecionada.dataset != null) {
            if (opcaoSelecionada.dataset.tipo != null) {
                tipoMedicamento = String(opcaoSelecionada.dataset.tipo).toLowerCase();
            }
        }
    }

    if (tipoMedicamento === "pomada") {
        grupoQtdDose.hidden = true;
        inputQtdDose.value = "0";
        inputQtdDose.disabled = true;
        return;
    }

    grupoQtdDose.hidden = false;
    inputQtdDose.disabled = false;

    if (tipoMedicamento === "xarope") {
        labelQtdDose.textContent = "Quantidade por dose (mL)";
        inputQtdDose.placeholder = "Ex: 10";
        inputQtdDose.min = "1";
        inputQtdDose.step = "1";
        if (inputQtdDose.value === "0") {
            inputQtdDose.value = "";
        }
        return;
    }

    if (tipoMedicamento === "injecao") {
        labelQtdDose.textContent = "Quantidade por dose (mL)";
        inputQtdDose.placeholder = "Ex: 10";
        inputQtdDose.min = "1";
        inputQtdDose.step = "1";
        if (inputQtdDose.value === "0") {
            inputQtdDose.value = "";
        }
        return;
    }

    labelQtdDose.textContent = "Quantidade por dose";
    inputQtdDose.placeholder = "Ex: 1";
    inputQtdDose.min = "1";
    inputQtdDose.step = "1";
    if (inputQtdDose.value === "0") {
        inputQtdDose.value = "";
    }
}

function formatarFrequencia(valor, unidade) {
    const unidadeTexto = String(unidade).toUpperCase();

    if (unidadeTexto === "DIA") {
        if (Number(valor) === 1) {
            return "1 vez ao dia";
        }
        return valor + " vezes ao dia";
    }

    if (unidadeTexto === "HORA") {
        if (Number(valor) === 1) {
            return "A cada 1 hora";
        }
        return "A cada " + valor + " horas";
    }

    if (unidadeTexto === "SEMANA") {
        if (Number(valor) === 1) {
            return "A cada 1 semana";
        }
        return "A cada " + valor + " semanas";
    }

    return "A cada " + valor + " " + unidade;
}

function normalizarUnidadeFrequencia(unidade) {
    const unidadeTexto = removerAcentos(String(unidade || "").trim()).toLowerCase();

    if (unidadeTexto.startsWith("hora")) {
        return "Hora";
    }

    if (unidadeTexto.startsWith("dia")) {
        return "Dia";
    }

    if (unidadeTexto.startsWith("semana")) {
        return "Semana";
    }

    return "Hora";
}

function formatarData(valorData) {
    if (valorData == null) {
        return "-";
    }

    if (String(valorData).trim() === "") {
        return "-";
    }

    const dataTexto = String(valorData).slice(0, 10);
    const partes = dataTexto.split("-");

    if (partes.length !== 3) {
        return dataTexto;
    }

    return partes[2] + "/" + partes[1] + "/" + partes[0];
}

const estadoOrdenacaoPrescricao = {
    valor: "dtfim",
    ordem: "ASC"
};

function atualizarOrdenacaoPrescricao(valorClicado) {
    if (estadoOrdenacaoPrescricao.valor === valorClicado) {
        if(estadoOrdenacaoPrescricao.ordem === "ASC")
            estadoOrdenacaoPrescricao.ordem = "DESC";
        else
            estadoOrdenacaoPrescricao.ordem = "ASC";
    } else {
        estadoOrdenacaoPrescricao.valor = valorClicado;
        estadoOrdenacaoPrescricao.ordem = "ASC";
    }
}

function configurarOrdenacaoPrescricao() {
    const colunas = document.querySelectorAll("#tabelaPrescricao th[data-col]");

    colunas.forEach((th) => {
        th.style.cursor = "pointer";

        th.addEventListener("click", function () {
            let valorClicado = "";
            if (th.dataset != null) {
                if (th.dataset.col != null) {
                    valorClicado = String(th.dataset.col);
                }
            }
            valorClicado = valorClicado.trim();
            if (valorClicado){
                atualizarOrdenacaoPrescricao(valorClicado);
                colunas.forEach((col) => col.classList.remove("ord-asc", "ord-desc"));
                if (estadoOrdenacaoPrescricao.ordem === "ASC")
                    th.classList.add("ord-asc");
                else
                    th.classList.add("ord-desc");
                carregarTabela();
            }
        });
    });
}

function obterTextoMedicamentoCaixinha(prescricao) {
    let medicamentoAtual = {};
    if (prescricao.medicamento != null) {
        medicamentoAtual = prescricao.medicamento;
    }

    let tipoMedicamento = "";
    if (medicamentoAtual.tipoMedicamento != null) {
        tipoMedicamento = String(medicamentoAtual.tipoMedicamento).toLowerCase();
    }

    let tipoMedicamentoTexto = "-";
    if (medicamentoAtual.tipoMedicamento != null && String(medicamentoAtual.tipoMedicamento).trim() !== "") {
        tipoMedicamentoTexto = medicamentoAtual.tipoMedicamento;
    }

    let medicamentoTexto = "-";
    if (medicamentoAtual.nome != null && String(medicamentoAtual.nome).trim() !== "") {
        medicamentoTexto = medicamentoAtual.nome;
    }

    if (tipoMedicamento !== "pomada" && tipoMedicamento !== "xarope") {
        if (medicamentoAtual.dosagemValor != null && medicamentoAtual.dosagemUnidade != null && String(medicamentoAtual.dosagemUnidade).trim() !== "") {
            medicamentoTexto += " " + medicamentoAtual.dosagemValor + " " + medicamentoAtual.dosagemUnidade;
        }
    }

    return {
        nome: medicamentoTexto,
        tipo: tipoMedicamentoTexto
    };
}

function agruparPrescricoesPorMorador(prescricoes) {
    const grupos = [];
    const indicePorMorador = {};

    prescricoes.forEach((prescricao, index) => {
        const morador = prescricao.morador || {};
        const chave = morador.idMorador != null ? String(morador.idMorador) : "sem-id-" + index;

        if (indicePorMorador[chave] == null) {
            indicePorMorador[chave] = grupos.length;
            grupos.push({
                morador: morador,
                itens: []
            });
        }

        grupos[indicePorMorador[chave]].itens.push(prescricao);
    });

    return grupos;
}

function renderizarMedicamentoCaixinha(prescricao) {
    const primeiraDoseFormatada = String(prescricao.primeiraDose || "").slice(0, 5) || "-";
    const frequenciaTexto = formatarFrequencia(prescricao.frequenciaValor, prescricao.frequenciaUnidade);
    const dtInicioFormatada = formatarData(prescricao.dtInicio);
    const dtFimFormatada = formatarData(prescricao.dtFim);
    const medicamento = obterTextoMedicamentoCaixinha(prescricao);
    const prescricaoJson = escapeHtml(JSON.stringify(prescricao));

    let qtdDoseTexto = "-";
    if (prescricao.qtdDose != null) {
        qtdDoseTexto = prescricao.qtdDose;
    }

    return `
        <div class="caixinha-med-item">
            <div class="caixinha-med-main">
                <p class="med-name">${escapeHtml(medicamento.nome)}</p>
                <span>${escapeHtml(medicamento.tipo)}</span>
            </div>
            <div class="caixinha-med-meta">
                <span>
                    <span class="material-symbols-outlined">schedule</span>
                    ${escapeHtml(frequenciaTexto)}
                </span>
                <span>
                    <span class="material-symbols-outlined">pill</span>
                    ${escapeHtml(qtdDoseTexto)} dose(s)
                </span>
                <span>
                    <span class="material-symbols-outlined">alarm</span>
                    ${escapeHtml(primeiraDoseFormatada)}
                </span>
                <span>
                    <span class="material-symbols-outlined">event</span>
                    ${escapeHtml(dtInicioFormatada)} ate ${escapeHtml(dtFimFormatada)}
                </span>
            </div>
            <div class="caixinha-med-actions">
                <button type="button" class="action-icon-btn edit" title="Editar" aria-label="Editar"
                  onclick='prepararEdicaoPrescricao(${prescricaoJson})'>
                  <span class="material-symbols-outlined">edit</span>
                </button>
                <button type="button" class="action-icon-btn delete" title="Remover" aria-label="Remover"
                  onclick="deletarPrescricao(${prescricao.idPrescricao})">
                  <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        </div>
    `;
}

function renderizarGrupoCaixinha(grupo) {
    const morador = grupo.morador || {};
    const nomeMorador = morador.nome || "Morador sem nome";
    const quantidade = grupo.itens.length;
    const quantidadeTexto = quantidade === 1 ? "1 medicamento" : quantidade + " medicamentos";
    const medicamentos = grupo.itens.map(renderizarMedicamentoCaixinha).join("");

    return `
        <tr class="caixinha-table-row">
            <td colspan="8">
                <article class="caixinha-group">
                    <header class="caixinha-group-header">
                        <div>
                            <span class="caixinha-label">Caixinha do morador</span>
                            <h3>${escapeHtml(nomeMorador)}</h3>
                        </div>
                        <span class="caixinha-count">${escapeHtml(quantidadeTexto)}</span>
                    </header>
                    <div class="caixinha-meds">
                        ${medicamentos}
                    </div>
                </article>
            </td>
        </tr>
    `;
}

function carregarTabela(moradorFiltro, medicamentoFiltro) {
    let linhas = "";
    const tabela = document.getElementById("tbodyPrescricao");

    if (moradorFiltro !== undefined) {
        estadoListaPrescricao.filtros.morador = moradorFiltro;
    }
    if (medicamentoFiltro !== undefined) {
        estadoListaPrescricao.filtros.medicamento = medicamentoFiltro;
    }

    fetch(`/caixinha/listarOrdenado?valor=${estadoOrdenacaoPrescricao.valor}&ordem=${estadoOrdenacaoPrescricao.ordem}`)
        .then(resp => resp.json())
        .then(prescricao => {
            let moradorBusca = "";
            if (estadoListaPrescricao.filtros.morador != null) {
                moradorBusca = String(estadoListaPrescricao.filtros.morador).toLowerCase().trim();
            }

            let medicamentoBusca = "";
            if (estadoListaPrescricao.filtros.medicamento != null) {
                medicamentoBusca = String(estadoListaPrescricao.filtros.medicamento).toLowerCase().trim();
            }

            const prescricoesFiltradas = prescricao.filter(item => {
                let moradorAtual = "";
                if (item.morador != null) {
                    if (item.morador.nome != null) {
                        moradorAtual = String(item.morador.nome).toLowerCase();
                    }
                }

                let medicamentoAtual = "";
                if (item.medicamento != null) {
                    if (item.medicamento.nome != null) {
                        medicamentoAtual = String(item.medicamento.nome).toLowerCase();
                    }
                }

                let moradorOk = false;
                if (moradorBusca === "") {
                    moradorOk = true;
                } else {
                    if (moradorAtual.includes(moradorBusca)) {
                        moradorOk = true;
                    }
                }

                let medicamentoOk = false;
                if (medicamentoBusca === "") {
                    medicamentoOk = true;
                } else {
                    if (medicamentoAtual.includes(medicamentoBusca)) {
                        medicamentoOk = true;
                    }
                }

                if (moradorOk) {
                    if (medicamentoOk) {
                        return true;
                    }
                }
                return false;
            });

            const grupos = agruparPrescricoesPorMorador(prescricoesFiltradas);
            linhas = grupos.map(renderizarGrupoCaixinha).join("");

            if (linhas === "") {
                tabela.innerHTML = `
                        <tr>
                            <td colSpan="8">Nenhuma caixinha cadastrada. Adicione o primeiro medicamento de um morador.</td>
                        </tr>
                    `;
            } else {
                tabela.innerHTML = linhas;
            }
        })
        .catch(error => {
            tabela.innerHTML = `
                <tr>
                    <td colSpan="8">Erro ao carregar caixinhas.</td>
                </tr>
            `;
            mostrarPopup("Erro ao listar caixinhas: " + error.message, "error");
        });
}

function aplicarFiltroPrescricao() {
    const moradorFiltro = document.getElementById("moradorFiltroPrescricao").value.trim();
    const medicamentoFiltro = document.getElementById("medicamentoFiltroPrescricao").value.trim();
    carregarTabela(moradorFiltro, medicamentoFiltro);
}

let popupTimer;
function mostrarPopup(mensagem, tipo) {
    let popup = document.getElementById("popupMensagem");
    if (!popup) {
        popup = document.createElement("div");
        popup.id = "popupMensagem";
        popup.className = "popup-msg";
        document.body.appendChild(popup);
    }

    let tipoPopup = "info";
    if (tipo != null) {
        if (String(tipo).trim() !== "") {
            tipoPopup = tipo;
        }
    }
    popup.className = "popup-msg show " + tipoPopup;
    popup.textContent = mensagem;

    clearTimeout(popupTimer);
    popupTimer = setTimeout(function () {
        popup.classList.remove("show");
    }, 3200);
}
function validarCamposCadastroPrescricao(form) {
    let idMorador = form.idMorador.value;
    let idMedicamento = form.idMedicamento.value;
    let frequenciaValor = form.frequenciaValor.value;
    let frequenciaUnidade = form.frequenciaUnidade.value;
    let qtdDose = form.qtdDose.value;
    let primeiraDose = form.primeiraDose.value;
    let dtInicio = form.dtInicio.value;
    let dtFim = form.dtFim.value;
    const selectMedicamento = document.getElementById("idMedicamento");
    let tipoMedicamentoSelecionado = "";

    idMorador = idMorador.trim();
    idMedicamento = idMedicamento.trim();
    frequenciaValor = frequenciaValor.trim();
    frequenciaUnidade = frequenciaUnidade.trim();
    qtdDose = qtdDose.trim();
    primeiraDose = primeiraDose.trim();
    dtInicio = dtInicio.trim();
    dtFim = dtFim.trim();
    if (selectMedicamento != null) {
        const opcaoSelecionada = selectMedicamento.options[selectMedicamento.selectedIndex];
        if (opcaoSelecionada != null) {
            if (opcaoSelecionada.dataset != null) {
                if (opcaoSelecionada.dataset.tipo != null) {
                    tipoMedicamentoSelecionado = String(opcaoSelecionada.dataset.tipo).toLowerCase();
                }
            }
        }
    }

    if (idMorador === "") {
        mostrarPopup("Morador e obrigatorio", "error");
        return false;
    }

    if (Number(idMorador) <= 0) {
        mostrarPopup("ID do morador deve ser maior que zero", "error");
        return false;
    }

    if (idMedicamento === "") {
        mostrarPopup("Medicamento e obrigatorio", "error");
        return false;
    }

    if (Number(idMedicamento) <= 0) {
        mostrarPopup("ID do medicamento deve ser maior que zero", "error");
        return false;
    }

    if (frequenciaValor === "") {
        mostrarPopup("Frequencia e obrigatoria", "error");
        return false;
    }

    if (Number(frequenciaValor) <= 0) {
        mostrarPopup("Frequencia deve ser maior que zero", "error");
        return false;
    }

    if (frequenciaUnidade === "") {
        mostrarPopup("Periodo da frequencia e obrigatorio", "error");
        return false;
    }

    if (tipoMedicamentoSelecionado !== "pomada") {
        if (qtdDose === "") {
            mostrarPopup("Quantidade da dose e obrigatoria", "error");
            return false;
        }

        if (Number(qtdDose) <= 0) {
            mostrarPopup("Quantidade da dose deve ser maior que zero", "error");
            return false;
        }
    }
    if (primeiraDose === "") {
        mostrarPopup("Primeiro horario e obrigatorio", "error");
        return false;
    }

    if (dtInicio === "") {
        mostrarPopup("Data de inicio e obrigatoria", "error");
        return false;
    }

    if (dtFim === "") {
        mostrarPopup("Data de fim e obrigatoria", "error");
        return false;
    }

    if (dtFim < dtInicio) {
        mostrarPopup("Data de fim nao pode ser menor que a data de inicio", "error");
        return false;
    }

    return true;
}

function cadastrar(){
    const prescricao = document.forms[0]
    if(validarCamposCadastroPrescricao(prescricao)){
        const requestOptions = {
            method: "POST",
            body: new FormData(prescricao)
        };
        fetch("/caixinha/cadastrar", requestOptions)
            .then(resp =>{
                if(resp.status === 200){
                    return resp.json()
                    .then(prescricaoCadastrada =>{
                        mostrarPopup("Medicamento adicionado a caixinha", "success");
                        carregarTabela();
                        document.forms[0].reset();
                        document.getElementById("cadastroPrescricao").hidden = true;
                    })
                }
                return resp.json().then(erro => {
                    mostrarPopup(erro.title + " - " + erro.descricao, "error");
                });
            })
            .catch(error => {
                mostrarPopup(error.message, "error");
            });
    }
    else{
        return;
    }

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
    });
}

async function deletarPrescricao(id) {
    const confirmado = await confirmarAcao("Remover este medicamento da caixinha? Se ja existir historico de uso, o sistema vai encerrar apenas a rotina futura e preservar os registros antigos.");
    if (confirmado) {
        fetch("/caixinha/" + id, {
            method: "DELETE"
        })
            .then(response => {
                return response.json()
                    .catch(() => ({}))
                    .then(body => ({ response, body }));
            })
            .then(({ response, body }) => {
                if (response.ok) {
                    mostrarPopup("Medicamento removido da caixinha", "success");
                    carregarTabela();
                } else {
                    mostrarPopup(body.descricao || body.title || "Nao foi possivel remover o medicamento da caixinha.", "error");
                }
            })
            .catch(error => {
                mostrarPopup("Erro ao remover medicamento da caixinha: " + error.message, "error");
            });
    }
}

function prepararEdicaoPrescricao(prescricao) {
    const cadastro = document.getElementById("cadastroPrescricao");
    const filtro = document.getElementById("filtroPrescricao");
    const editor = document.getElementById("editorPrescricao");

    if (cadastro) cadastro.hidden = true;
    if (filtro) filtro.hidden = true;

    document.getElementById("idMoradorEditar").value = prescricao.morador.idMorador;
    document.getElementById("idMedicamentoEditar").value = prescricao.medicamento.idMedicamento;
    document.getElementById("frequenciaValorEditar").value = prescricao.frequenciaValor;
    document.getElementById("frequenciaUnidadeEditar").value = normalizarUnidadeFrequencia(prescricao.frequenciaUnidade);
    if (prescricao.qtdDose != null) {
        document.getElementById("qtdDoseEditar").value = prescricao.qtdDose;
    } else {
        document.getElementById("qtdDoseEditar").value = "";
    }
    document.getElementById("primeiraDoseEditar").value = prescricao.primeiraDose;
    document.getElementById("dtInicioEditar").value = prescricao.dtInicio;
    document.getElementById("dtFimEditar").value = prescricao.dtFim;

    atualizarQtdDosePorTipoMedicamento("idMedicamentoEditar", "grupoQtdDoseEditar", "labelQtdDoseEditar", "qtdDoseEditar");
    
    editor.hidden = false;

    document.getElementById("salvarEdicaoPrescricao").onclick = function () {
        salvarEdicaoPrescricao(prescricao.idPrescricao);
    };

    document.getElementById("fecharEditorPrescricao").onclick = function () {
        editor.hidden = true;
    };
}

function salvarEdicaoPrescricao(id) {
    const params = new URLSearchParams();
    params.append("idMorador", document.getElementById("idMoradorEditar").value);
    params.append("idMedicamento", document.getElementById("idMedicamentoEditar").value);
    params.append("frequenciaValor", document.getElementById("frequenciaValorEditar").value);
    params.append("frequenciaUnidade", document.getElementById("frequenciaUnidadeEditar").value);
    params.append("qtdDose", document.getElementById("qtdDoseEditar").value);
    params.append("primeiraDose", document.getElementById("primeiraDoseEditar").value);
    params.append("dtInicio", document.getElementById("dtInicioEditar").value);
    params.append("dtFim", document.getElementById("dtFimEditar").value);

    fetch("/caixinha/" + id, {
        method: "PUT",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
    })
    .then(response => {
        if (response.status === 200) {
            return response.json().then(editada => {
                mostrarPopup("Medicamento da caixinha atualizado", "success");
                document.getElementById("editorPrescricao").hidden = true;
                carregarTabela();
            });
        }
        return response.json().then(erro => {
            mostrarPopup(erro.title + " - " + erro.descricao, "error");
        });
    })
    .catch(error => {
        mostrarPopup("Erro ao editar medicamento da caixinha: " + error.message, "error");
    });
}

document.addEventListener("DOMContentLoaded", carregarContextoUrl);
document.addEventListener("DOMContentLoaded", preencherPerfilTopo);
