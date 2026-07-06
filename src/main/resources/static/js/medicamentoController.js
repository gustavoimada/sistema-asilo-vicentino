const estadoListaMedicamentos = {
    filtros: {
        nome: "",
        tipo: ""
    }
};

function el(id) {
    return document.getElementById(id);
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
    if (valor === "secretaria") return "Secretária(o)";
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

function sincronizarContextoUrlLegado() {
    const params = new URLSearchParams(window.location.search);
    if (!params.size) return;

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

    ["idFuncionario", "idUser", "usuarioNome", "funcionarioNome", "categoria"].forEach(function (chave) {
        params.delete(chave);
    });

    const queryRestante = params.toString();
    const urlLimpa = window.location.pathname + (queryRestante ? `?${queryRestante}` : "") + window.location.hash;

    if (window.history && typeof window.history.replaceState === "function") {
        window.history.replaceState({}, document.title, urlLimpa);
    }
}

sincronizarContextoUrlLegado();

document.addEventListener("DOMContentLoaded", function () {
    const botaoAbrir = document.getElementById("abrirCadastroMedicamento");
    const botaoFechar = document.getElementById("fecharCadastroMedicamento");
    const cadastro = document.getElementById("cadastroMedicamento");
    const selectTipoCadastro = document.getElementById("tipoMedicamento");
    const botaoAbrirFiltro = document.getElementById("abrirFiltrosMedicamento");
    const botaoFecharFiltro = document.getElementById("btnFecharFiltroMedicamento");
    const botaoLimparFiltro = document.getElementById("btnLimparFiltroMedicamento");
    const filtro = document.getElementById("filtroMedicamento");
    const editor = document.getElementById("editorMedicamento");
    const tabela = document.getElementById("tabelaMedicamentos");
    const nomeFiltroMedicamento = document.getElementById("nomeFiltroMedicamento");
    const tipoFiltroMedicamento = document.getElementById("tipoFiltroMedicamento");

    if (!botaoAbrir) {
        return;
    }
    if (!botaoFechar) {
        return;
    }
    if (!cadastro) {
        return;
    }

    botaoAbrir.addEventListener("click", function () {
        if (filtro) {
            filtro.hidden = true;
        }
        if (editor) {
            editor.hidden = true;
        }
        cadastro.hidden = !cadastro.hidden;
    });

    botaoFechar.addEventListener("click", function () {
        cadastro.hidden = true;
    });

    if (selectTipoCadastro) {
        configurarCampoDosagem(
            selectTipoCadastro,
            "grupoDosagemValor",
            "grupoDosagemUnidade",
            "dosagemUnidade",
            "dosagemValor"
        );
    }

    if (botaoAbrirFiltro) {
        if (filtro) {
            botaoAbrirFiltro.addEventListener("click", function () {
                cadastro.hidden = true;
                if (editor) {
                    editor.hidden = true;
                }
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
            document.getElementById("nomeFiltroMedicamento").value = "";
            document.getElementById("tipoFiltroMedicamento").value = "";
            estadoListaMedicamentos.filtros.nome = "";
            estadoListaMedicamentos.filtros.tipo = "";
            listarMedicamentos();
        });
    }

    if (nomeFiltroMedicamento) {
        nomeFiltroMedicamento.addEventListener("input", function () {
            aplicarFiltroMedicamento();
        });
    }

    if (tipoFiltroMedicamento) {
        tipoFiltroMedicamento.addEventListener("change", function () {
            aplicarFiltroMedicamento();
        });
    }

    if(tabela){
        configurarOrdenacaoMedicamento();
        listarMedicamentos();
    }
});

function preencherSelectUnidade(select, opcoes, valorSelecionado, desabilitado) {
    if (!select) {
        return;
    }

    select.innerHTML = "";

    opcoes.forEach(function (opcao) {
        const option = document.createElement("option");
        option.value = opcao;
        option.textContent = opcao;
        if (opcao === valorSelecionado) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    select.disabled = !!desabilitado;
}

function configurarCampoDosagem(tipoSelect, grupoValorId, grupoUnidadeId, selectUnidadeId, inputValorId) {
    const grupoValor = document.getElementById(grupoValorId);
    const grupoUnidade = document.getElementById(grupoUnidadeId);
    const selectUnidade = document.getElementById(selectUnidadeId);
    const inputValor = document.getElementById(inputValorId);

    if (!tipoSelect) {
        return;
    }
    if (!grupoValor) {
        return;
    }
    if (!grupoUnidade) {
        return;
    }
    if (!selectUnidade) {
        return;
    }
    if (!inputValor) {
        return;
    }

    const atualizar = function () {
        let tipo = "";
        if (tipoSelect.value != null) {
            tipo = String(tipoSelect.value).toLowerCase();
        }

        if (tipo === "pomada") {
            grupoValor.hidden = true;
            grupoUnidade.hidden = true;
            inputValor.value = "";
            selectUnidade.innerHTML = '<option value=""></option>';
            selectUnidade.disabled = false;
            return;
        }

        if (tipo === "xarope") {
            grupoValor.hidden = true;
            grupoUnidade.hidden = true;
            inputValor.value = "";
            selectUnidade.innerHTML = '<option value=""></option>';
            selectUnidade.disabled = false;
            return;
        }

        grupoValor.hidden = false;
        grupoUnidade.hidden = false;

        if (tipo === "") {
            preencherSelectUnidade(selectUnidade, [""], "", false);
            return;
        }

        if (tipo === "comprimido") {
            let unidadeSelecionada = "mg";
            if (selectUnidade.value != null) {
                if (String(selectUnidade.value).trim() !== "") {
                    unidadeSelecionada = selectUnidade.value;
                }
            }
            preencherSelectUnidade(selectUnidade, ["mg", "g"], unidadeSelecionada, false);
            return;
        }

        if (tipo === "xarope") {
            preencherSelectUnidade(selectUnidade, ["mL"], "mL", true);
        }

        if (tipo === "injecao") {
            preencherSelectUnidade(selectUnidade, ["mL"], "mL", true);
        }
    };

    tipoSelect.addEventListener("change", atualizar);
    atualizar();
}

function formatarDosagemMedicamento(medicamento) {
    const valor = medicamento.dosagemValor;
    const unidade = medicamento.dosagemUnidade;

    if (valor === null) {
        return "-";
    }
    if (valor === undefined) {
        return "-";
    }
    if (valor === "") {
        return "-";
    }
    if (!unidade) {
        return "-";
    }

    return `${valor} ${unidade}`;
}

const estadoOrdenacaoMedicamento = {
    valor: "nome",
    ordem: "ASC"
};

function atualizarOrdenacaoMedicamento(valorClicado) {
    if (estadoOrdenacaoMedicamento.valor === valorClicado) {
        if(estadoOrdenacaoMedicamento.ordem === "ASC")
            estadoOrdenacaoMedicamento.ordem = "DESC";
        else
            estadoOrdenacaoMedicamento.ordem = "ASC";
    } else {
        estadoOrdenacaoMedicamento.valor = valorClicado;
        estadoOrdenacaoMedicamento.ordem = "ASC";
    }
}

function configurarOrdenacaoMedicamento() {
    const colunas = document.querySelectorAll("#tabelaMedicamentos th[data-col]");

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
                atualizarOrdenacaoMedicamento(valorClicado);
                colunas.forEach((col) => col.classList.remove("ord-asc", "ord-desc"));
                if (estadoOrdenacaoMedicamento.ordem === "ASC")
                    th.classList.add("ord-asc");
                else
                    th.classList.add("ord-desc");
                listarMedicamentos();
            }
        });
    });
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

function validarCamposCadastro(form){
    let nome = form.nome.value;
    let tipoMedicamento = form.tipoMedicamento.value;
    let dosagemValor = form.dosagemValor.value;
    let dosagemUnidade = form.dosagemUnidade.value;

    nome = nome.trim();
    tipoMedicamento = tipoMedicamento.trim().toLowerCase();
    dosagemValor = dosagemValor.trim();
    dosagemUnidade = dosagemUnidade.trim();

    if (nome === "") {
        mostrarPopup("Nome do medicamento e obrigatorio", "error");
        return false;
    }

    if (/\d/.test(nome)) {
        mostrarPopup("Nome do medicamento nao pode conter numeros", "error");
        return false;
    }

    if (tipoMedicamento === "") {
        mostrarPopup("Tipo do medicamento e obrigatorio", "error");
        return false;
    }

    if (tipoMedicamento !== "pomada" && tipoMedicamento !== "xarope") {
        if (dosagemValor === "") {
            mostrarPopup("Dosagem deve ser informada", "error");
            return false;
        }

        if (Number(dosagemValor) <= 0) {
            mostrarPopup("Dosagem deve ser maior que zero", "error");
            return false;
        }

        if (tipoMedicamento === "comprimido") {
            if (dosagemUnidade !== "mg" && dosagemUnidade !== "g") {
                mostrarPopup("Comprimido deve usar mg ou g", "error");
                return false;
            }
        }

        if (tipoMedicamento === "injecao") {
            if (dosagemUnidade !== "mL") {
                mostrarPopup("Injecao deve usar mL", "error");
                return false;
            }
        }
    }

    return true;
}

function cadastrarMedicamento() {
    const medicamento = document.forms[0];

    if (!validarCamposCadastro(medicamento)) {
        return;
    }

    const dadosCadastro = new FormData(medicamento);
    const tipoCadastro = String(document.getElementById("tipoMedicamento").value).toLowerCase();
    if (tipoCadastro === "pomada") {
        dadosCadastro.set("dosagemUnidade", "");
        dadosCadastro.set("dosagemValor", "");
    } else if (tipoCadastro === "xarope") {
        dadosCadastro.set("dosagemUnidade", "");
        dadosCadastro.set("dosagemValor", "");
    } else {
        dadosCadastro.set("dosagemUnidade", document.getElementById("dosagemUnidade").value);
    }

    const requestOptions = {
        method: "POST",
        body: dadosCadastro
    };

    fetch("/medicamentos/cadastrar", requestOptions)
        .then(response => {
            if (response.status === 200) {
                return response.json()
                    .then(medicamentoCadastrado => {
                        mostrarPopup(medicamentoCadastrado.nome + " cadastrado", "success");
                        listarMedicamentos();
                        document.forms[0].reset();
                        document.getElementById("cadastroMedicamento").hidden = true;
                    });
            }

            return response.json().then(erro => {
                mostrarPopup(erro.title + " - " + erro.descricao, "error");
            });
        })
        .catch(error => {
            mostrarPopup(error.message, "error");
        });
}

function listarMedicamentos(nomeFiltro, tipoFiltro) {
    const html = document.getElementById("tbodyMedicamentos");

    if (nomeFiltro !== undefined) {
        estadoListaMedicamentos.filtros.nome = nomeFiltro;
    }
    if (tipoFiltro !== undefined) {
        estadoListaMedicamentos.filtros.tipo = tipoFiltro;
    }

    fetch(`/medicamentos/listarOrdenado?valor=${estadoOrdenacaoMedicamento.valor}&ordem=${estadoOrdenacaoMedicamento.ordem}`)
        .then(response => response.json())
        .then(medicamentos => {
            if (medicamentos != null && medicamentos.length > 0) {
                let linhas = "";
                let nomeBusca = "";
                if (estadoListaMedicamentos.filtros.nome != null) {
                    nomeBusca = String(estadoListaMedicamentos.filtros.nome).toLowerCase().trim();
                }
                let tipoBusca = "";
                if (estadoListaMedicamentos.filtros.tipo != null) {
                    tipoBusca = String(estadoListaMedicamentos.filtros.tipo).toLowerCase().trim();
                }

                const medicamentosFiltrados = medicamentos.filter(medicamento => {
                    let nomeAtual = "";
                    if (medicamento.nome != null) {
                        nomeAtual = String(medicamento.nome).toLowerCase();
                    }

                    let tipoAtual = "";
                    if (medicamento.tipoMedicamento != null) {
                        tipoAtual = String(medicamento.tipoMedicamento).toLowerCase();
                    }

                    const semFiltro = nomeBusca === "" && tipoBusca === "";
                    let nomeOk = false;
                    if (nomeBusca === "") {
                        nomeOk = true;
                    } else {
                        if (nomeAtual.includes(nomeBusca)) {
                            nomeOk = true;
                        }
                    }

                    let tipoOk = false;
                    if (tipoBusca === "") {
                        tipoOk = true;
                    } else {
                        if (tipoAtual === tipoBusca) {
                            tipoOk = true;
                        }
                    }

                    if (semFiltro) {
                        return true;
                    }
                    if (nomeOk) {
                        if (tipoOk) {
                            return true;
                        }
                    }
                    return false;
                });

                medicamentosFiltrados.forEach(medicamento => {
                    const dosagemTexto = formatarDosagemMedicamento(medicamento);
                    let icone = "pill";
                    let cor = "blue";

                    const tipo = (medicamento.tipoMedicamento).toLowerCase();

                    if (tipo === "comprimido") {
                        icone = "pill";
                        cor = "blue";
                    }
                    else if (tipo === "injecao") {
                        icone = "vaccines";
                        cor = "amber";
                    }
                    else if (tipo === "xarope") {
                        icone = "science";
                        cor = "purple";
                    }
                    else if (tipo === "pomada") {
                        icone = "healing";
                        cor = "green";
                    }

                    linhas += `
                        <tr>
                            <td>
                                <div class="medicamento-info">
                                    <div class="medicamento-icon ${cor}">
                                        <span class="material-symbols-outlined">${icone}</span>
                                    </div>
                                    <span class="medicamento-name">${medicamento.nome}</span>
                                </div>
                            </td>
                            <td>${medicamento.tipoMedicamento}</td>
                            <td>${dosagemTexto}</td>
                            <td style="text-align: right;">
                                <div style="display: inline-flex; gap: 8px;">
                                    <button type="button" class="action-icon-btn edit"
                                      onclick='editarMedicamento(${medicamento.idMedicamento}, ${JSON.stringify(medicamento.nome)}, ${JSON.stringify(medicamento.tipoMedicamento)}, ${JSON.stringify(medicamento.dosagemValor)}, ${JSON.stringify(medicamento.dosagemUnidade)})'>
                                      <span class="material-symbols-outlined">edit</span>
                                    </button>
                                    <button type="button" class="action-icon-btn delete" title="Deletar" aria-label="Deletar" onclick="deletarMedicamento(${medicamento.idMedicamento})"><span class="material-symbols-outlined">delete</span></button>
                                </div>
                            </td>
                        </tr>
                    `;
                });

                if (linhas === "") {
                    html.innerHTML = `
                        <tr>
                            <td colSpan="4">Nenhum medicamento encontrado.</td>
                        </tr>
                    `;
                } else {
                    html.innerHTML = linhas;
                }
            } else {
                html.innerHTML = `
                    <tr>
                        <td colSpan="4">Nenhum medicamento carregado.</td>
                    </tr>
                `;
            }
        })
        .catch(error => {
            html.innerHTML = `
                <tr>
                    <td colSpan="4">Erro ao carregar medicamentos.</td>
                </tr>
            `;
            mostrarPopup("Erro ao listar medicamentos: " + error.message, "error");
        });
}

function aplicarFiltroMedicamento() {
    const nomeFiltro = document.getElementById("nomeFiltroMedicamento").value.trim();
    const tipoFiltro = document.getElementById("tipoFiltroMedicamento").value.trim();
    listarMedicamentos(nomeFiltro, tipoFiltro);
}

function editarMedicamento(id, nome, tipoMedicamento, dosagemValor, dosagemUnidade) {
    const cadastro = document.getElementById("cadastroMedicamento");
    const filtro = document.getElementById("filtroMedicamento");
    const editor = document.getElementById("editorMedicamento");

    if (cadastro) cadastro.hidden = true;
    if (filtro) filtro.hidden = true;

    document.getElementById("nomeEditar").value = nome;
    let tipoMedicamentoValor = "";
    if (tipoMedicamento != null) {
        tipoMedicamentoValor = String(tipoMedicamento).toLowerCase();
    }
    document.getElementById("tipoMedicamentoEditar").value = tipoMedicamentoValor;

    configurarCampoDosagem(
        document.getElementById("tipoMedicamentoEditar"),
        "grupoDosagemValorEditar",
        "grupoDosagemUnidadeEditar",
        "dosagemUnidadeEditar",
        "dosagemValorEditar"
    );

    if (dosagemValor !== null && dosagemValor !== undefined) {
        document.getElementById("dosagemValorEditar").value = dosagemValor;
    } else {
        document.getElementById("dosagemValorEditar").value = "";
    }

    if (dosagemUnidade) {
        document.getElementById("dosagemUnidadeEditar").value = dosagemUnidade;
    }

    editor.hidden = false;

    document.getElementById("salvarEdicaoMedicamento").onclick = function () {
        salvarEdicaoMedicamento(id);
    };

    document.getElementById("fecharEditorMedicamento").onclick = function () {
        editor.hidden = true;
    };
}

function salvarEdicaoMedicamento(id) {
    const medicamento = new URLSearchParams();
    medicamento.append("nome", document.getElementById("nomeEditar").value);
    medicamento.append("tipoMedicamento", document.getElementById("tipoMedicamentoEditar").value);
    medicamento.append("dosagemValor", document.getElementById("dosagemValorEditar").value);
    medicamento.append("dosagemUnidade", document.getElementById("dosagemUnidadeEditar").value);

    fetch("/medicamentos/" + id, {
        method: "PUT",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: medicamento.toString()
    })
        .then(response => {
            if (response.status === 200) {
                return response.json()
                    .then(medicamentoEditado => {
                        mostrarPopup(medicamentoEditado.nome + " editado", "success");
                        document.getElementById("editorMedicamento").hidden = true;
                        listarMedicamentos();
                    });
            }

            return response.json().then(erro => {
                mostrarPopup(erro.title + " - " + erro.descricao, "error");
            });
        })
        .catch(error => {
            mostrarPopup(error.message, "error");
        });
}

async function deletarMedicamento(id) {
    const confirmado = await confirmarAcao("Tem certeza que deseja deletar este medicamento?");
    if (confirmado) {
        fetch("/medicamentos/" + id, {
            method: "DELETE"
        })
            .then(response => {
                if (response.status === 200) {
                    mostrarPopup("Medicamento deletado com sucesso!", "success");
                    listarMedicamentos();
                } else {
                    mostrarPopup("Nao foi possivel deletar o medicamento.", "error");
                }
            })
            .catch(error => {
                mostrarPopup("Erro ao deletar medicamento: " + error.message, "error");
            });
    }
}

document.addEventListener("DOMContentLoaded", preencherPerfilTopo);
