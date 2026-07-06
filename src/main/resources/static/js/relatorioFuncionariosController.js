let registrosFuncionariosRelatorio = [];
let graficoRegistrosMes = null;
let graficoOcorrenciasMes = null;
let graficoMedicamentosMes = null;
let graficoDistribuicaoRegistros = null;

const labelsMesesRelatorio = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const estadoFiltroFuncionarios = {
    funcionario: "",
    data: "",
    ocorrencia: "",
    medicamento: ""
};

function parseJsonSeguroRelatorio(response) {
    return response.json().catch(function () {
        return {};
    });
}

function normalizarTextoRelatorio(valor) {
    if (valor == null) return "";
    return String(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase();
}

function escaparHtmlRelatorio(valor) {
    return String(valor || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function converterDataRelatorio(valor) {
    if (valor == null) return null;

    const texto = String(valor).trim();
    if (texto === "") return null;

    let textoData = texto;
    if (textoData.includes(" ") && !textoData.includes("T")) {
        textoData = textoData.replace(" ", "T");
    }

    const data = new Date(textoData);
    if (!Number.isNaN(data.getTime())) {
        return data;
    }

    if (texto.length >= 10) {
        const partes = texto.slice(0, 10).split("-");
        if (partes.length === 3) {
            const ano = Number(partes[0]);
            const mes = Number(partes[1]) - 1;
            const dia = Number(partes[2]);
            const alternativa = new Date(ano, mes, dia);
            if (!Number.isNaN(alternativa.getTime())) {
                return alternativa;
            }
        }
    }

    return null;
}

function obterChaveDataRelatorio(valor) {
    const data = converterDataRelatorio(valor);
    if (!data) return "";

    const ano = String(data.getFullYear());
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

function obterTimestampRelatorio(valor) {
    const data = converterDataRelatorio(valor);
    if (!data) return 0;
    return data.getTime();
}

function formatarDataHoraRelatorio(valor) {
    const data = converterDataRelatorio(valor);
    if (!data) return "-";

    return data.toLocaleString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatarDataFiltroRelatorio(valor) {
    if (!valor) return "";
    const texto = String(valor).trim();
    const partes = texto.split("-");
    if (partes.length === 3) {
        return partes[2] + "/" + partes[1] + "/" + partes[0];
    }
    return texto;
}

function obterResumoFiltrosRelatorioFuncionarios() {
    const filtros = [];
    const funcionario = String(estadoFiltroFuncionarios.funcionario || "").trim();
    const data = String(estadoFiltroFuncionarios.data || "").trim();
    const ocorrencia = String(estadoFiltroFuncionarios.ocorrencia || "").trim();
    const medicamento = String(estadoFiltroFuncionarios.medicamento || "").trim();

    if (funcionario !== "") filtros.push("Funcionário: " + funcionario);
    if (data !== "") filtros.push("Data: " + formatarDataFiltroRelatorio(data));
    if (ocorrencia !== "") filtros.push("Ocorrência: " + ocorrencia);
    if (medicamento !== "") filtros.push("Medicamento: " + medicamento);

    if (filtros.length === 0) {
        filtros.push("Nenhum filtro aplicado");
    }

    return filtros;
}

function obterMaximoEscalaRelatorio(dados) {
    let maior = 0;
    dados.forEach(function (valor) {
        const numero = Number(valor);
        if (numero > maior) {
            maior = numero;
        }
    });

    if (maior <= 10) return 10;
    return Math.ceil(maior * 1.15);
}

function criarOpcoesLinhaApexRelatorio(nomeSerie, dadosSerie, corLinha, maximoEscala) {
    let quantidadeTicks = 6;
    if (maximoEscala <= 6) {
        quantidadeTicks = Math.ceil(maximoEscala);
    }
    if (quantidadeTicks < 2) quantidadeTicks = 2;

    return {
        series: [
            {
                name: nomeSerie,
                data: dadosSerie
            }
        ],
        chart: {
            fontFamily: "inherit",
            type: "line",
            height: 280,
            foreColor: "#adb0bb",
            offsetY: 10,
            offsetX: -15,
            toolbar: {
                show: false
            },
            zoom: {
                enabled: false
            }
        },
        colors: [corLinha],
        stroke: {
            curve: "smooth",
            width: 4
        },
        markers: {
            size: 4,
            strokeWidth: 2,
            hover: {
                size: 6
            }
        },
        dataLabels: {
            enabled: false
        },
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.35,
                opacityTo: 0.05,
                stops: [0, 90, 100]
            }
        },
        grid: {
            show: true,
            strokeDashArray: 3,
            borderColor: "rgba(0,0,0,.1)"
        },
        xaxis: {
            categories: labelsMesesRelatorio,
            axisTicks: {
                show: false
            },
            axisBorder: {
                show: false
            },
            labels: {
                style: {
                    colors: "#a1aab2"
                }
            }
        },
        yaxis: {
            min: 0,
            max: maximoEscala,
            tickAmount: quantidadeTicks,
            labels: {
                style: {
                    colors: "#a1aab2"
                },
                formatter: function (valor) {
                    return Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
                }
            }
        },
        tooltip: {
            theme: "dark",
            y: {
                formatter: function (valor) {
                    return Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
                }
            }
        },
        legend: {
            show: false
        }
    };
}

function esconderGraficoRelatorio(idGrafico, textoAviso) {
    const grafico = document.getElementById(idGrafico);
    if (!grafico) return;

    const card = grafico.closest(".chart-card");
    if (!card) return;

    grafico.style.display = "none";

    const avisoAtual = card.querySelector(".grafico-sem-dados");
    if (avisoAtual) {
        avisoAtual.textContent = textoAviso;
        return;
    }

    card.insertAdjacentHTML("beforeend", `<p class="grafico-sem-dados">${textoAviso}</p>`);
}

function mostrarGraficoRelatorio(idGrafico) {
    const grafico = document.getElementById(idGrafico);
    if (!grafico) return;

    const card = grafico.closest(".chart-card");
    if (!card) return;

    const aviso = card.querySelector(".grafico-sem-dados");
    if (aviso) aviso.remove();

    grafico.style.display = "block";
}

function atualizarGraficosRelatorioFuncionarios(listaRegistros) {
    const idsGraficosLinha = ["graficoRegistrosMes", "graficoOcorrenciasMes", "graficoMedicamentosMes"];
    const idGraficoPizza = "graficoDistribuicaoRegistros";

    idsGraficosLinha.forEach(function (id) {
        mostrarGraficoRelatorio(id);
    });
    mostrarGraficoRelatorio(idGraficoPizza);

    if (graficoRegistrosMes) graficoRegistrosMes.destroy();
    if (graficoOcorrenciasMes) graficoOcorrenciasMes.destroy();
    if (graficoMedicamentosMes) graficoMedicamentosMes.destroy();
    if (graficoDistribuicaoRegistros) graficoDistribuicaoRegistros.destroy();

    graficoRegistrosMes = null;
    graficoOcorrenciasMes = null;
    graficoMedicamentosMes = null;
    graficoDistribuicaoRegistros = null;

    const anoAtual = new Date().getFullYear();
    const registrosPorMes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const ocorrenciasPorMes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const medicacoesPorMes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    let qtdOcorrenciasTotal = 0;
    let qtdMedicacoesTotal = 0;
    let temRegistroAnoAtual = false;

    listaRegistros.forEach(function (registro) {
        if (registro.tipoRegistro === "ocorrencia") qtdOcorrenciasTotal += 1;
        if (registro.tipoRegistro === "medicacao") qtdMedicacoesTotal += 1;

        const data = converterDataRelatorio(registro.dataRegistro);
        if (!data) return;
        if (data.getFullYear() !== anoAtual) return;

        temRegistroAnoAtual = true;
        const mes = data.getMonth();
        registrosPorMes[mes] += 1;
        if (registro.tipoRegistro === "ocorrencia") ocorrenciasPorMes[mes] += 1;
        if (registro.tipoRegistro === "medicacao") medicacoesPorMes[mes] += 1;
    });

    if (typeof ApexCharts === "undefined") {
        idsGraficosLinha.forEach(function (id) {
            esconderGraficoRelatorio(id, "Nao foi possivel carregar o grafico.");
        });
        esconderGraficoRelatorio(idGraficoPizza, "Nao foi possivel carregar o grafico.");
        return;
    }

    graficoRegistrosMes = new ApexCharts(
        document.getElementById("graficoRegistrosMes"),
        criarOpcoesLinhaApexRelatorio("Registros", registrosPorMes, "var(--bs-primary)", obterMaximoEscalaRelatorio(registrosPorMes))
    );
    graficoRegistrosMes.render();

    graficoOcorrenciasMes = new ApexCharts(
        document.getElementById("graficoOcorrenciasMes"),
        criarOpcoesLinhaApexRelatorio("Ocorrências", ocorrenciasPorMes, "var(--bs-warning)", obterMaximoEscalaRelatorio(ocorrenciasPorMes))
    );
    graficoOcorrenciasMes.render();

    graficoMedicamentosMes = new ApexCharts(
        document.getElementById("graficoMedicamentosMes"),
        criarOpcoesLinhaApexRelatorio("Medicações", medicacoesPorMes, "var(--bs-success)", obterMaximoEscalaRelatorio(medicacoesPorMes))
    );
    graficoMedicamentosMes.render();

    if (!temRegistroAnoAtual) {
        idsGraficosLinha.forEach(function (id) {
            esconderGraficoRelatorio(id, `Sem registros em ${anoAtual}.`);
        });
    }

    let dadosPizza = [qtdOcorrenciasTotal, qtdMedicacoesTotal];
    let labelsPizza = ["Ocorrências", "Medicações"];
    let coresPizza = ["var(--bs-warning)", "var(--bs-success)"];
    let totalPizza = qtdOcorrenciasTotal + qtdMedicacoesTotal;
    let semDadosPizza = false;

    if (totalPizza <= 0) {
        dadosPizza = [1];
        labelsPizza = ["Sem dados"];
        coresPizza = ["#cbd5e1"];
        totalPizza = 0;
        semDadosPizza = true;
    }

    graficoDistribuicaoRegistros = new ApexCharts(
        document.getElementById("graficoDistribuicaoRegistros"),
        {
            series: dadosPizza,
            labels: labelsPizza,
            chart: {
                type: "donut",
                height: 280,
                fontFamily: "inherit"
            },
            colors: coresPizza,
            dataLabels: {
                enabled: true,
                formatter: function (valor) {
                    if (semDadosPizza) return "";
                    return valor.toFixed(1).replace(".", ",") + "%";
                }
            },
            stroke: {
                width: 0
            },
            plotOptions: {
                pie: {
                    expandOnClick: true,
                    donut: {
                        size: "78%",
                        labels: {
                            show: true,
                            name: {
                                show: false
                            },
                            value: {
                                show: false
                            },
                            total: {
                                show: true,
                                showAlways: true,
                                label: "",
                                formatter: function () {
                                    return String(totalPizza);
                                }
                            }
                        }
                    }
                }
            },
            legend: {
                position: "bottom",
                labels: {
                    colors: "#334155"
                },
                fontWeight: 700
            },
            tooltip: {
                y: {
                    formatter: function (valor) {
                        if (semDadosPizza) return "Sem dados";
                        return Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
                    }
                }
            }
        }
    );
    graficoDistribuicaoRegistros.render();
}

function atualizarCardsRelatorioFuncionarios(listaFiltrada) {
    const htmlTotalMes = document.getElementById("totalRegistrosMes");
    const htmlQtdFuncionarios = document.getElementById("qtdFuncionariosRegistro");
    const htmlQtdOcorrencias = document.getElementById("qtdOcorrenciasRegistradas");
    const htmlQtdMedicamentos = document.getElementById("qtdMedicamentosRegistrados");

    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    let totalMes = 0;
    let qtdOcorrencias = 0;
    let qtdMedicacoes = 0;
    const funcionariosUnicos = new Set();

    listaFiltrada.forEach(function (registro) {
        const nomeFuncionario = String(registro.funcionario || "").trim();
        if (nomeFuncionario !== "") {
            funcionariosUnicos.add(normalizarTextoRelatorio(nomeFuncionario));
        }

        if (registro.tipoRegistro === "ocorrencia") qtdOcorrencias += 1;
        if (registro.tipoRegistro === "medicacao") qtdMedicacoes += 1;

        const data = converterDataRelatorio(registro.dataRegistro);
        if (!data) return;
        if (data.getFullYear() === anoAtual && data.getMonth() === mesAtual) {
            totalMes += 1;
        }
    });

    if (htmlTotalMes) htmlTotalMes.textContent = String(totalMes);
    if (htmlQtdFuncionarios) htmlQtdFuncionarios.textContent = String(funcionariosUnicos.size);
    if (htmlQtdOcorrencias) htmlQtdOcorrencias.textContent = String(qtdOcorrencias);
    if (htmlQtdMedicamentos) htmlQtdMedicamentos.textContent = String(qtdMedicacoes);
}

function filtrarRegistrosRelatorioFuncionarios() {
    return registrosFuncionariosRelatorio.filter(function (registro) {
        const funcionario = String(registro.funcionario || "");
        const data = obterChaveDataRelatorio(registro.dataRegistro);
        const ocorrencia = String(registro.ocorrencia || "");
        const medicamento = String(registro.medicamento || "");

        const filtroFuncionario = normalizarTextoRelatorio(estadoFiltroFuncionarios.funcionario);
        const filtroOcorrencia = normalizarTextoRelatorio(estadoFiltroFuncionarios.ocorrencia);
        const filtroMedicamento = normalizarTextoRelatorio(estadoFiltroFuncionarios.medicamento);
        const filtroData = String(estadoFiltroFuncionarios.data || "").trim();

        if (filtroFuncionario !== "") {
            if (!normalizarTextoRelatorio(funcionario).includes(filtroFuncionario)) {
                return false;
            }
        }

        if (filtroData !== "") {
            if (data !== filtroData) {
                return false;
            }
        }

        if (filtroOcorrencia !== "") {
            if (!normalizarTextoRelatorio(ocorrencia).includes(filtroOcorrencia)) {
                return false;
            }
        }

        if (filtroMedicamento !== "") {
            if (!normalizarTextoRelatorio(medicamento).includes(filtroMedicamento)) {
                return false;
            }
        }

        return true;
    });
}

function renderizarRegistrosFuncionarios() {
    const tabela = document.getElementById("registrosFuncionarios");
    if (!tabela) return;

    const tbody = tabela.querySelector("tbody");
    if (!tbody) return;

    const listaFiltrada = filtrarRegistrosRelatorioFuncionarios();

    atualizarCardsRelatorioFuncionarios(listaFiltrada);
    atualizarGraficosRelatorioFuncionarios(listaFiltrada);

    if (listaFiltrada.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">Nenhum registro encontrado.</td>
            </tr>
        `;
        return;
    }

    let linhas = "";
    listaFiltrada.forEach(function (registro) {
        const funcionario = escaparHtmlRelatorio(registro.funcionario || "-");
        const data = escaparHtmlRelatorio(formatarDataHoraRelatorio(registro.dataRegistro));
        const ocorrencia = escaparHtmlRelatorio(registro.ocorrencia || "-");
        const medicamento = escaparHtmlRelatorio(registro.medicamento || "-");
        const observacoes = escaparHtmlRelatorio(registro.observacoes || "-");

        linhas += `
            <tr>
                <td>${funcionario}</td>
                <td>${data}</td>
                <td>${ocorrencia}</td>
                <td>${medicamento}</td>
                <td>${observacoes}</td>
            </tr>
        `;
    });

    tbody.innerHTML = linhas;
}

function montarTextoUsoMedicamentoRelatorio(registroUso) {
    const medicamento = registroUso?.prescricaoDose?.prescricao?.medicamento;
    if (!medicamento) return "";

    const nome = String(medicamento.nome || "").trim();
    const tipo = String(medicamento.tipoMedicamento || "").trim();
    const dosagemValor = medicamento.dosagemValor;
    const dosagemUnidade = String(medicamento.dosagemUnidade || "").trim();

    let texto = "";
    if (nome !== "") texto += nome;
    if (tipo !== "") texto += (texto === "" ? "" : " ") + tipo;
    if (dosagemUnidade !== "" && dosagemValor != null) {
        texto += (texto === "" ? "" : " ") + String(dosagemValor) + " " + dosagemUnidade;
    }

    return texto.trim();
}

async function carregarRegistrosFuncionarios() {
    const tabela = document.getElementById("registrosFuncionarios");
    if (!tabela) return;

    const tbody = tabela.querySelector("tbody");
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">Carregando registros...</td>
            </tr>
        `;
    }

    try {
        const [respostaOcorrencias, respostaUsoMedicacao] = await Promise.all([
            fetch("/ocorrencia/listar"),
            fetch("/registrarusomedicacao/listar")
        ]);

        const ocorrenciasBody = await parseJsonSeguroRelatorio(respostaOcorrencias);
        const usoMedicacaoBody = await parseJsonSeguroRelatorio(respostaUsoMedicacao);

        if (!respostaOcorrencias.ok || !Array.isArray(ocorrenciasBody)) {
            throw new Error("Falha ao carregar ocorrencias");
        }
        if (!respostaUsoMedicacao.ok || !Array.isArray(usoMedicacaoBody)) {
            throw new Error("Falha ao carregar registros de uso de medicacao");
        }

        const ocorrenciasComMoradores = await Promise.all(
            ocorrenciasBody.map(async function (ocorrencia) {
                const idOcorrencia = Number(ocorrencia?.idOcorrencia || 0);
                if (!Number.isInteger(idOcorrencia) || idOcorrencia <= 0) {
                    return { ...ocorrencia, _moradoresEnvolvidosTexto: "" };
                }

                try {
                    const respostaMoradores = await fetch(`/ocorrencia/moradores/${idOcorrencia}`);
                    const moradoresBody = await parseJsonSeguroRelatorio(respostaMoradores);
                    if (!respostaMoradores.ok || !Array.isArray(moradoresBody)) {
                        return { ...ocorrencia, _moradoresEnvolvidosTexto: "" };
                    }

                    const nomesMoradores = moradoresBody
                        .map(function (morador) {
                            return String(morador?.nome || "").trim();
                        })
                        .filter(function (nome) {
                            return nome !== "";
                        });

                    return {
                        ...ocorrencia,
                        _moradoresEnvolvidosTexto: nomesMoradores.join(", ")
                    };
                } catch (e) {
                    return { ...ocorrencia, _moradoresEnvolvidosTexto: "" };
                }
            })
        );

        const registros = [];

        ocorrenciasComMoradores.forEach(function (ocorrencia) {
            const observacaoBase = String(ocorrencia?.observacoes || "").trim();
            const moradoresEnvolvidos = String(ocorrencia?._moradoresEnvolvidosTexto || "").trim();
            let observacoesCompletas = observacaoBase;
            if (moradoresEnvolvidos !== "") {
                if (observacoesCompletas !== "") {
                    observacoesCompletas += " | ";
                }
                observacoesCompletas += "Moradores envolvidos: " + moradoresEnvolvidos;
            }

            registros.push({
                tipoRegistro: "ocorrencia",
                funcionario: String(ocorrencia?.funcionario?.nome || "Nao informado").trim(),
                dataRegistro: ocorrencia?.dtOcorrencia || "",
                ocorrencia: String(ocorrencia?.tipoOcorrencia?.descricao || "").trim(),
                medicamento: "",
                observacoes: observacoesCompletas
            });
        });

        usoMedicacaoBody.forEach(function (registroUso) {
            const morador = String(registroUso?.prescricaoDose?.prescricao?.morador?.nome || "").trim();
            registros.push({
                tipoRegistro: "medicacao",
                funcionario: String(registroUso?.funcionario?.nome || "Nao informado").trim(),
                dataRegistro: registroUso?.dataRegistro || "",
                ocorrencia: "",
                medicamento: montarTextoUsoMedicamentoRelatorio(registroUso),
                observacoes: morador !== "" ? "Morador: " + morador : ""
            });
        });

        registros.sort(function (a, b) {
            return obterTimestampRelatorio(b.dataRegistro) - obterTimestampRelatorio(a.dataRegistro);
        });

        registrosFuncionariosRelatorio = registros;
        renderizarRegistrosFuncionarios();
    } catch (error) {
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5">Erro ao carregar registros.</td>
                </tr>
            `;
        }
    }
}

function configurarFiltrosRelatorioFuncionarios() {
    const abrirFiltros = document.getElementById("abrirFiltrosFuncionarioRelatorio");
    const fecharFiltros = document.getElementById("fecharFiltrosFuncionarioRelatorio");
    const painelFiltros = document.getElementById("filtroFuncionariosRelatorioPainel");

    const filtroFuncionario = document.getElementById("filtroFuncionarioRelatorio");
    const filtroData = document.getElementById("filtroDataRelatorio");
    const filtroOcorrencia = document.getElementById("filtroOcorrenciaRelatorio");
    const filtroMedicamento = document.getElementById("filtroMedicamentoRelatorio");
    const btnLimpar = document.getElementById("limparFiltrosFuncionarioRelatorio");

    if (abrirFiltros && painelFiltros) {
        abrirFiltros.addEventListener("click", function () {
            painelFiltros.hidden = false;
        });
    }

    if (fecharFiltros && painelFiltros) {
        fecharFiltros.addEventListener("click", function () {
            painelFiltros.hidden = true;
        });
    }

    if (filtroFuncionario) {
        filtroFuncionario.addEventListener("input", function () {
            estadoFiltroFuncionarios.funcionario = filtroFuncionario.value;
            renderizarRegistrosFuncionarios();
        });
    }

    if (filtroData) {
        filtroData.addEventListener("input", function () {
            estadoFiltroFuncionarios.data = filtroData.value;
            renderizarRegistrosFuncionarios();
        });
    }

    if (filtroOcorrencia) {
        filtroOcorrencia.addEventListener("input", function () {
            estadoFiltroFuncionarios.ocorrencia = filtroOcorrencia.value;
            renderizarRegistrosFuncionarios();
        });
    }

    if (filtroMedicamento) {
        filtroMedicamento.addEventListener("input", function () {
            estadoFiltroFuncionarios.medicamento = filtroMedicamento.value;
            renderizarRegistrosFuncionarios();
        });
    }

    if (btnLimpar) {
        btnLimpar.addEventListener("click", function () {
            estadoFiltroFuncionarios.funcionario = "";
            estadoFiltroFuncionarios.data = "";
            estadoFiltroFuncionarios.ocorrencia = "";
            estadoFiltroFuncionarios.medicamento = "";

            if (filtroFuncionario) filtroFuncionario.value = "";
            if (filtroData) filtroData.value = "";
            if (filtroOcorrencia) filtroOcorrencia.value = "";
            if (filtroMedicamento) filtroMedicamento.value = "";

            renderizarRegistrosFuncionarios();
        });
    }
}

function formatarCargoPerfilFuncionarios(categoria) {
    const texto = String(categoria || "").trim();
    const cargo = normalizarTextoRelatorio(texto).toLowerCase();

    if (cargo === "coordenador") return "Coordenador(a)";
    if (cargo === "cuidador") return "Cuidador(a)";
    if (cargo === "secretaria") return "Secretária(o)";
    return texto || "Acesso";
}

async function carregarPerfilRelatorioFuncionarios() {
    try {
        const resposta = await fetch("/login/sessao", { credentials: "include" });
        if (!resposta.ok) return;

        const funcionario = await parseJsonSeguroRelatorio(resposta);
        const nome = String(funcionario.nome || "").trim();
        const cargo = formatarCargoPerfilFuncionarios(funcionario.categoria);
        const nomePerfil = document.getElementById("perfilNome");
        const cargoPerfil = document.getElementById("perfilCargo");

        if (nomePerfil && nome !== "") nomePerfil.textContent = nome;
        if (cargoPerfil) cargoPerfil.textContent = cargo;
    } catch (erro) {
        // Mantem os textos padrao quando nao for possivel consultar a sessao.
    }
}

function gerarPdfRelatorioFuncionarios() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("Biblioteca de PDF nao carregou.");
        return;
    }

    const tabela = document.getElementById("registrosFuncionarios");
    if (!tabela) {
        alert("Tabela de registros nao encontrada.");
        return;
    }

    const linhasTabela = tabela.querySelectorAll("tbody tr");
    const body = [];

    linhasTabela.forEach(function (linha) {
        const colunas = linha.querySelectorAll("td");
        if (colunas.length !== 5) return;

        const primeiraColuna = colunas[0];
        if (primeiraColuna && primeiraColuna.colSpan > 1) return;

        const dadosLinha = [];
        colunas.forEach(function (coluna) {
            dadosLinha.push(coluna.textContent.trim());
        });
        body.push(dadosLinha);
    });

    if (body.length === 0) {
        alert("Nao ha registros listados para gerar o PDF.");
        return;
    }

    const jsPDF = window.jspdf.jsPDF;
    const doc = new jsPDF("p", "pt", "a4");

    doc.setFontSize(14);
    doc.text("Relatório de Funcionários", 40, 38);
    doc.setFontSize(10);
    doc.text("Gerado em: " + new Date().toLocaleString("pt-BR"), 40, 54);
    const textoFiltros = "Filtros: " + obterResumoFiltrosRelatorioFuncionarios().join(" | ");
    const linhasFiltros = doc.splitTextToSize(textoFiltros, 515);
    doc.text(linhasFiltros, 40, 68);
    const inicioTabela = 68 + (linhasFiltros.length * 12) + 6;

    doc.autoTable({
        startY: inicioTabela,
        head: [["Funcionário", "Data", "Ocorrência", "Registro de Uso de Medicamento", "Observações"]],
        body: body,
        headStyles: {
            fillColor: [0, 53, 127]
        },
        styles: {
            fontSize: 9,
            cellPadding: 4
        }
    });

    doc.save("relatorio-funcionarios.pdf");
}

document.addEventListener("DOMContentLoaded", function () {
    carregarPerfilRelatorioFuncionarios();
    configurarFiltrosRelatorioFuncionarios();
    carregarRegistrosFuncionarios();

    const btnGerarPdf = document.getElementById("btnGerarPdfFuncionarios");
    if (btnGerarPdf) {
        btnGerarPdf.addEventListener("click", gerarPdfRelatorioFuncionarios);
    }
});
