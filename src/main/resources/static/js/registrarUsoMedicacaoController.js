let relogioIniciadoRegistroMedicacao = false;

document.addEventListener("DOMContentLoaded", async function () {
    const contextoRegistroMedicacao = await carregarContextoRegistroMedicacao();

    const temTurnoAtivo = await garantirTurnoAtivoNoCarregamentoRegistroMedicacao();
    if (!temTurnoAtivo) {
        return;
    }

    configurarFiltrosPrescricaoDose();
    configurarPainelAtrasados();
    atualizarNomeCuidadorNaTela(contextoRegistroMedicacao);
    carregarPrescricoes();
    carregarPrescricoesAtrasadas();
    listarUso();
    iniciarRelogio();
});

async function carregarContextoRegistroMedicacao() {
    const response = await fetch("/login/sessao");
    if (!response.ok) {
        return null;
    }
    const funcionario = await response.json().catch(() => null);
    if (!funcionario) {
        return null;
    }

    const contextoRegistroMedicacao = {
        funcionarioNome: "",
        categoria: ""
    };

    if (funcionario.nome != null) {
        contextoRegistroMedicacao.funcionarioNome = String(funcionario.nome).trim();
    }
    if (funcionario.categoria != null) {
        contextoRegistroMedicacao.categoria = String(funcionario.categoria).trim();
    }

    return contextoRegistroMedicacao;
}

function obterOuCriarModalTurnoInativo() {
    let modal = document.getElementById("avisoTurnoModal");
    if (modal == null) {
        modal = document.createElement("div");
        modal.id = "avisoTurnoModal";
        modal.className = "confirm-overlay";
        modal.innerHTML = `
            <div class="confirm-box">
                <h4>Turno inativo</h4>
                <p id="avisoTurnoTexto"></p>
                <div class="confirm-actions">
                    <button type="button" class="btn btn-primary" id="avisoTurnoOk">Ir para iniciar turno</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    return modal;
}

function exibirAvisoSemTurnoAtivoRegistroMedicacao() {
    const modal = obterOuCriarModalTurnoInativo();
    const texto = document.getElementById("avisoTurnoTexto");
    const botaoOk = document.getElementById("avisoTurnoOk");

    if (texto != null) {
        texto.textContent = "Voce nao esta com turno ativo. Volte ao painel inicial para iniciar o turno.";
    }

    modal.classList.add("show");

    if (botaoOk == null) {
        return Promise.resolve();
    }

    return new Promise(resolve => {
        botaoOk.onclick = function () {
            modal.classList.remove("show");
            resolve();
        };
    });
}

function obterTurnoAtivoDaRespostaRegistroMedicacao(data) {
    if (!data || typeof data !== "object") {
        return null;
    }
    if (data.turnoAtivo && typeof data.turnoAtivo === "object") {
        return data.turnoAtivo;
    }
    if (data.idTurnos != null) {
        return data;
    }
    return null;
}

async function garantirTurnoAtivoNoCarregamentoRegistroMedicacao() {
    try {
        const response = await fetch("/turno/resumo-ativo");
        if (response.ok) {
            const data = await response.json().catch(() => null);
            const turnoAtivo = obterTurnoAtivoDaRespostaRegistroMedicacao(data);
            if (turnoAtivo) {
                return true;
            }
        }
    } catch (e) {
        // segue fluxo de aviso
    }

    await exibirAvisoSemTurnoAtivoRegistroMedicacao();
    window.location.href = "cuidador.html";
    return false;
}

function cargoPerfilRegistroMedicacao(categoria) {
    if (categoria)
        return categoria;
    return "Acesso";
}

function atualizarNomeCuidadorNaTela(contextoRegistroMedicacao) {
    let nome = "";
    let categoria = "";
    if (contextoRegistroMedicacao != null) {
        if (contextoRegistroMedicacao.funcionarioNome != null) {
            nome = String(contextoRegistroMedicacao.funcionarioNome).trim();
        }
        if (contextoRegistroMedicacao.categoria != null) {
            categoria = String(contextoRegistroMedicacao.categoria).trim();
        }
    }
    if (nome === "") {
        nome = "Usuario";
    }
    const nomeEl = document.getElementById("perfilNome");
    const cargoEl = document.getElementById("perfilCargo");
    if (nomeEl != null) nomeEl.textContent = nome;
    if (cargoEl != null) cargoEl.textContent = cargoPerfilRegistroMedicacao(categoria);
}

function configurarFiltrosPrescricaoDose() {
    const botaoAbrirFiltro = document.getElementById("abrirFiltrosPrescricaoDose");
    const botaoFecharFiltro = document.getElementById("btnFecharFiltroPrescricaoDose");
    const botaoLimparFiltro = document.getElementById("btnLimparFiltroPrescricaoDose");
    const painelFiltro = document.getElementById("filtroPrescricaoDose");
    const inputMorador = document.getElementById("moradorFiltroPrescricaoDose");
    const inputHorario = document.getElementById("horarioFiltroPrescricaoDose");
    const inputAtrasados = document.getElementById("atrasadosFiltroPrescricaoDose");

    if (painelFiltro != null) {
        if (botaoAbrirFiltro != null) {
            botaoAbrirFiltro.addEventListener("click", function () {
                if (painelFiltro.hidden) {
                    painelFiltro.hidden = false;
                } else {
                    painelFiltro.hidden = true;
                }
            });
        }

        if (botaoFecharFiltro != null) {
            botaoFecharFiltro.addEventListener("click", function () {
                painelFiltro.hidden = true;
            });
        }

        if (botaoLimparFiltro != null) {
            botaoLimparFiltro.addEventListener("click", function () {
                if (inputMorador != null) {
                    inputMorador.value = "";
                }
                if (inputHorario != null) {
                    inputHorario.value = "";
                }
                if (inputAtrasados != null) {
                    inputAtrasados.checked = false;
                }

                carregarPrescricoes();
            });
        }

        if (inputMorador != null) {
            inputMorador.addEventListener("input", function () {
                carregarPrescricoes();
            });
        }

        if (inputHorario != null) {
            inputHorario.addEventListener("input", function () {
                carregarPrescricoes();
            });
        }

        if (inputAtrasados != null) {
            inputAtrasados.addEventListener("change", function () {
                carregarPrescricoes();
            });
        }
    }
}

function configurarPainelAtrasados() {
    const botaoAbrirPainel = document.getElementById("abrirPainelAtrasados");
    const botaoFecharPainel = document.getElementById("btnFecharPainelAtrasados");
    const botaoLimparFiltro = document.getElementById("btnLimparFiltroAtrasados");
    const painelAtrasados = document.getElementById("painelAtrasadosDiasAnteriores");
    const inputDia = document.getElementById("diaFiltroAtrasados");
    const inputMorador = document.getElementById("moradorFiltroAtrasados");

    if (painelAtrasados != null) {
        atualizarTextoBotaoPainelAtrasados();

        if (botaoAbrirPainel != null) {
            botaoAbrirPainel.addEventListener("click", function () {
                if (painelAtrasados.hidden) {
                    painelAtrasados.hidden = false;
                } else {
                    painelAtrasados.hidden = true;
                }
                atualizarTextoBotaoPainelAtrasados();
            });
        }

        if (botaoFecharPainel != null) {
            botaoFecharPainel.addEventListener("click", function () {
                painelAtrasados.hidden = true;
                atualizarTextoBotaoPainelAtrasados();
            });
        }

        if (botaoLimparFiltro != null) {
            botaoLimparFiltro.addEventListener("click", function () {
                if (inputDia != null) {
                    inputDia.value = "";
                }
                if (inputMorador != null) {
                    inputMorador.value = "";
                }

                carregarPrescricoesAtrasadas();
            });
        }

        if (inputDia != null) {
            inputDia.addEventListener("change", function () {
                carregarPrescricoesAtrasadas();
            });
            inputDia.addEventListener("input", function () {
                carregarPrescricoesAtrasadas();
            });
        }

        if (inputMorador != null) {
            inputMorador.addEventListener("input", function () {
                carregarPrescricoesAtrasadas();
            });
        }
    }
}

function atualizarTextoBotaoPainelAtrasados() {
    const botaoAbrirPainel = document.getElementById("abrirPainelAtrasados");
    const painelAtrasados = document.getElementById("painelAtrasadosDiasAnteriores");

    if (botaoAbrirPainel != null && painelAtrasados != null) {
        if (painelAtrasados.hidden) {
            botaoAbrirPainel.innerHTML = `<span class="material-symbols-outlined">visibility</span>Visualizar`;
        } else {
            botaoAbrirPainel.innerHTML = `<span class="material-symbols-outlined">visibility_off</span>Ocultar`;
        }
    }
}

function montarTextoMedicamento(medicamento) {
    if (medicamento == null) {
        return "-";
    }

    let medicamentoTexto = "";

    if (medicamento.nome != null) {
        medicamentoTexto = String(medicamento.nome);
    }
    if (medicamento.tipoMedicamento != null) {
        medicamentoTexto += " " + medicamento.tipoMedicamento;
    }
    if (medicamento.dosagemUnidade != null) {
        medicamentoTexto += " " + medicamento.dosagemValor + " " + medicamento.dosagemUnidade;
    }

    medicamentoTexto = medicamentoTexto.trim();
    if (medicamentoTexto === "") {
        return "-";
    }

    return medicamentoTexto;
}

function obterHorarioPrescrito(dataHoraPrevista) {
    if (dataHoraPrevista == null) {
        return "";
    }

    const partes = String(dataHoraPrevista).split("T");
    if (partes.length < 2) {
        return "";
    }

    return String(partes[1]).slice(0, 5);
}

function formatarData(dataHoraPrevista) {
    if (dataHoraPrevista == null) {
        return "";
    }

    const partesDataHora = String(dataHoraPrevista).split("T");
    if (partesDataHora.length === 0) {
        return "";
    }

    const data = String(partesDataHora[0]);
    const partesData = data.split("-");
    if (partesData.length !== 3) {
        return data;
    }

    return partesData[2] + "/" + partesData[1] + "/" + partesData[0];
}

function converterDataHora(dataHoraTexto) {
    if (dataHoraTexto == null) {
        return null;
    }

    const valor = String(dataHoraTexto).trim();
    if (valor === "") {
        return null;
    }

    const dataConvertida = new Date(valor);
    if (Number.isNaN(dataConvertida.getTime())) {
        return null;
    }

    return dataConvertida;
}

function atualizarContadorPendentes(quantidade) {
    const Pendentes = document.getElementById("numeroPrescricoes");
    if (Pendentes != null) {
        Pendentes.innerHTML = `<span>${quantidade} Pendentes</span>`;
    }
}

function atualizarContadorAtrasados(quantidade) {
    const Atrasados = document.getElementById("numeroPrescricoesAtrasadas");
    if (Atrasados != null) {
        let totalAtrasados = quantidade;
        if (typeof totalAtrasados !== "number") {
            totalAtrasados = 0;
        }

        Atrasados.innerHTML = `<span class="material-symbols-outlined">priority_high</span><span>${totalAtrasados} Atrasados</span>`;
    }
}

function renderizarPrescricoesPendentes(listaPrescricoes) {
    const html = document.getElementById("prescricaoDoseMorador");

    if (html != null) {
        let lista = [];
        if (Array.isArray(listaPrescricoes)) {
            lista = listaPrescricoes;
        }

        let linhas = "";

        lista.forEach(item => {
            const horarioPrescrito = obterHorarioPrescrito(item.dataHoraPrevista);
            const dataPrevista = converterDataHora(item.dataHoraPrevista);

            let classeStatus = "pending";
            let textoStatus = "Pendente";
            if (dataPrevista != null) {
                const agora = new Date();
                if (dataPrevista.getTime() < agora.getTime()) {
                    classeStatus = "late";
                    textoStatus = "Atrasado";
                }
            }

            let medicamento = null;
            if (item != null) {
                if (item.prescricao != null) {
                    if (item.prescricao.medicamento != null) {
                        medicamento = item.prescricao.medicamento;
                    }
                }
            }
            const medicamentoTexto = montarTextoMedicamento(medicamento);

            let nomeMorador = "-";
            if (item != null) {
                if (item.prescricao != null) {
                    if (item.prescricao.morador != null) {
                        if (item.prescricao.morador.nome != null) {
                            nomeMorador = item.prescricao.morador.nome;
                        }
                    }
                }
            }

            linhas += `<div class="pending-card">
                        <div class="pending-card-top">
                            <div class="resident-info">
                                <div class="resident-photo resident-photo-man"></div>
                                <div class="resident-text">
                                    <h4>${nomeMorador}</h4>
                                    <div class="med-name">
                                        <span class="material-symbols-outlined small-icon">pill</span>
                                        <p>${medicamentoTexto}</p>
                                    </div>
                                    <p class="schedule-text">Horario Prescrito: <strong>${horarioPrescrito}</strong></p>
                                </div>
                            </div>

                            <div class="pending-actions">
                                <span class="status-chip ${classeStatus}">${textoStatus}</span>
                                <button class="btn-register" onclick="registrarUso(${item.idPrescricaoDose})">
                                    <span class="material-symbols-outlined">check_circle</span>
                                    Registrar
                                </button>
                            </div>
                        </div>
                    </div>`;
        });

        if (linhas === "") {
            html.innerHTML = "<p>Nenhum medicamento pendente encontrado.</p>";
        } else {
            html.innerHTML = linhas;
        }
    }
}

function renderizarPrescricoesAtrasadas(listaPrescricoes) {
    const html = document.getElementById("prescricaoDoseAtrasadas");
    if (html != null) {
        let lista = [];
        if (Array.isArray(listaPrescricoes)) {
            lista = listaPrescricoes;
        }

        let linhas = "";

        lista.forEach(item => {
            const horarioPrescrito = obterHorarioPrescrito(item.dataHoraPrevista);
            const dataPrevista = formatarData(item.dataHoraPrevista);
            const dataPrevistaComparacao = converterDataHora(item.dataHoraPrevista);

            let classeStatus = "pending";
            let textoStatus = "Pendente";
            if (dataPrevistaComparacao != null) {
                const agora = new Date();
                if (dataPrevistaComparacao.getTime() < agora.getTime()) {
                    classeStatus = "late";
                    textoStatus = "Atrasado";
                }
            }

            let medicamento = null;
            if (item != null) {
                if (item.prescricao != null) {
                    if (item.prescricao.medicamento != null) {
                        medicamento = item.prescricao.medicamento;
                    }
                }
            }
            const medicamentoTexto = montarTextoMedicamento(medicamento);

            let nomeMorador = "-";
            if (item != null) {
                if (item.prescricao != null) {
                    if (item.prescricao.morador != null) {
                        if (item.prescricao.morador.nome != null) {
                            nomeMorador = item.prescricao.morador.nome;
                        }
                    }
                }
            }

            linhas += `<div class="pending-card">
                        <div class="pending-card-top">
                            <div class="resident-info">
                                <div class="resident-photo resident-photo-man"></div>
                                <div class="resident-text">
                                    <h4>${nomeMorador}</h4>
                                    <div class="med-name">
                                        <span class="material-symbols-outlined small-icon">pill</span>
                                        <p>${medicamentoTexto}</p>
                                    </div>
                                    <p class="schedule-text">Previsto: <strong>${dataPrevista} ${horarioPrescrito}</strong></p>
                                </div>
                            </div>

                            <div class="pending-actions">
                                <span class="status-chip ${classeStatus}">${textoStatus}</span>
                                <button class="btn-register" onclick="registrarUso(${item.idPrescricaoDose})">
                                    <span class="material-symbols-outlined">check_circle</span>
                                    Registrar
                                </button>
                            </div>
                        </div>
                    </div>`;
        });

        if (linhas === "") {
            html.innerHTML = "<p>Nenhum medicamento atrasado encontrado.</p>";
        } else {
            html.innerHTML = linhas;
        }
    }
}

function carregarPrescricoes() {
    const html = document.getElementById("prescricaoDoseMorador");
    if (html != null) {
        const params = new URLSearchParams();
        const inputMorador = document.getElementById("moradorFiltroPrescricaoDose");
        const inputHorario = document.getElementById("horarioFiltroPrescricaoDose");
        const inputAtrasados = document.getElementById("atrasadosFiltroPrescricaoDose");

        if (inputMorador != null) {
            const morador = inputMorador.value.trim();
            if (morador != "") {
                params.append("morador", morador);
            }
        }

        if (inputHorario != null) {
            const horario = inputHorario.value.trim();
            if (horario != "") {
                params.append("horario", horario);
            }
        }

        if (inputAtrasados != null) {
            if (inputAtrasados.checked) {
                params.append("somenteAtrasados", "true");
            }
        }

        fetch("/prescricaodose/listarHoje?" + params)
            .then(resp => resp.json())
            .then(prescricaoDose => {
                let lista = [];
                if (Array.isArray(prescricaoDose)) {
                    lista = prescricaoDose;
                }
                atualizarContadorPendentes(lista.length);
                renderizarPrescricoesPendentes(lista);
            })
            .catch(error => {
                atualizarContadorPendentes(0);
                html.innerHTML = "<p>Erro ao carregar pendencias.</p>";
                mostrarPopup("Erro ao listar prescricoes: " + error.message, "error");
            });
    }
}

function carregarPrescricoesAtrasadas() {
    const html = document.getElementById("prescricaoDoseAtrasadas");
    if (html != null) {
        const params = new URLSearchParams();
        const inputDia = document.getElementById("diaFiltroAtrasados");
        const inputMorador = document.getElementById("moradorFiltroAtrasados");

        if (inputDia != null) {
            const dia = inputDia.value.trim();
            if (dia != "") {
                params.append("dia", dia);
            }
        }

        if (inputMorador != null) {
            const morador = inputMorador.value.trim();
            if (morador != "") {
                params.append("morador", morador);
            }
        }

        fetch("/prescricaodose/listarAtrasadasDiasAnteriores?" + params)
            .then(resp => resp.json())
            .then(prescricaoDose => {
                let lista = [];
                if (Array.isArray(prescricaoDose)) {
                    lista = prescricaoDose;
                }
                atualizarContadorAtrasados(lista.length);
                renderizarPrescricoesAtrasadas(lista);
            })
            .catch(error => {
                atualizarContadorAtrasados(0);
                html.innerHTML = "<p>Erro ao carregar atrasados.</p>";
                mostrarPopup("Erro ao listar atrasados: " + error.message, "error");
            });
    }
}

let popupTimer;
function mostrarPopup(mensagem, tipo) {
    let popup = document.getElementById("popupMensagem");
    if (popup == null) {
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

function registrarUso(idPrescricaoDose) {
    const agora = new Date();
    const dataAgora =
        `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}T` +
        `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}:${String(agora.getSeconds()).padStart(2, "0")}`;

    fetch(`/registrarusomedicacao/gravar?idPrescricaoDose=${idPrescricaoDose}&dataRegistro=${encodeURIComponent(dataAgora)}`, {
        method: "PUT"
    })
        .then(response => {
            if (response.status === 200) {
                return response.json();
            }
            return response.json().then(erro => {
                throw new Error(erro.title + " - " + erro.descricao);
            });
        })
        .then(() => atualizar(idPrescricaoDose))
        .then(() => {
            mostrarPopup("Uso registrado", "success");
            listarUso();
        })
        .catch(error => {
            mostrarPopup(error.message, "error");
        });
}

function listarUso() {
    const html = document.getElementById("listarUso");

    let linhas = "";

    fetch("/registrarusomedicacao/listarHoje")
        .then(resp => resp.json())
        .then(registros => {
            registros.forEach(registro => {
                const horarioCompleto = registro.dataRegistro.split("T")[1];
                let medicamentoTexto = registro.prescricaoDose.prescricao.medicamento.nome + " " + registro.prescricaoDose.prescricao.medicamento.tipoMedicamento;
                if (registro.prescricaoDose.prescricao.medicamento.dosagemUnidade !== null) {
                    medicamentoTexto += " " + registro.prescricaoDose.prescricao.medicamento.dosagemValor + " " + registro.prescricaoDose.prescricao.medicamento.dosagemUnidade;
                }

                linhas += `<tr>
                                <td class="resident-cell">
                                    <div class="mini-avatar woman-mini"></div>
                                    <span>${registro.prescricaoDose.prescricao.morador.nome}</span>
                                </td>
                                <td>${medicamentoTexto}</td>
                                <td>${horarioCompleto}</td>
                                <td>
                                    <span class="table-status">
                                        <span class="material-symbols-outlined tiny-icon">done_all</span>
                                        Aplicado
                                    </span>
                                </td>
                                <td style="text-align: right;">
                                    <button type="button" class="action-icon-btn delete" title="Deletar" aria-label="Deletar" onclick="deletarRegistroUso(${registro.idRegistrarUsoMedicacao})">
                                        <span class="material-symbols-outlined">delete</span>
                                    </button>
                                </td>
                            </tr>`;
            });

            if (linhas === "") {
                html.innerHTML = `
                        <tr>
                            <td colSpan="5">Nenhum registro de uso encontrado.</td>
                        </tr>
                    `;
            } else {
                html.innerHTML = linhas;
            }
        })
        .catch(error => {
            html.innerHTML = `
                    <tr>
                        <td colSpan="5">Erro ao carregar historico de uso.</td>
                    </tr>
                `;
            mostrarPopup("Erro ao listar uso de medicacao: " + error.message, "error");
        });
}

function confirmarAcao(mensagem) {
    return new Promise(function (resolve) {
        let modal = document.getElementById("confirmacaoModal");
        if (modal == null) {
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

async function deletarRegistroUso(idRegistroUso) {
    const confirmou = await confirmarAcao("Tem certeza que deseja deletar este registro de uso?");
    if (!confirmou) {
        return;
    }

    fetch("/registrarusomedicacao/" + idRegistroUso, {
        method: "DELETE"
    })
        .then(response => {
            if (response.status === 200) {
                mostrarPopup("Registro de uso deletado com sucesso!", "success");
                listarUso();
                carregarPrescricoes();
                carregarPrescricoesAtrasadas();
                return;
            }

            return response.json().then(erro => {
                throw new Error(erro.title + " - " + erro.descricao);
            });
        })
        .catch(error => {
            mostrarPopup("Erro ao deletar registro de uso: " + error.message, "error");
        });
}

function atualizar(id) {
    return fetch("/prescricaodose/" + id, {
        method: "PUT"
    })
        .then(response => {
            if (response.status === 200) {
                carregarPrescricoes();
                carregarPrescricoesAtrasadas();
                return;
            }
            return response.json().then(erro => {
                throw new Error(erro.title + " - " + erro.descricao);
            });
        });
}

function atualizarDataHoraAtual() {
    const agora = new Date();
    const texto = agora.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "America/Sao_Paulo"
    });

    const el = document.getElementById("dataHoraAtual");
    if (el != null) {
        el.textContent = texto;
    }
}

function iniciarRelogio() {
    if (relogioIniciadoRegistroMedicacao) {
        return;
    }
    relogioIniciadoRegistroMedicacao = true;

    atualizarDataHoraAtual();
    setInterval(atualizarDataHoraAtual, 1000);
}