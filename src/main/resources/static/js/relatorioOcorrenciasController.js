let ocorrenciasRelatorio = [];
let graficoOcorrenciasMes = null;
let graficoGravidadeMes = null;
let graficoTiposOcorrencia = null;
let graficoPizzaGravidade = null;
let ordenacaoOcorrencias = "data";
let direcaoOrdenacaoOcorrencias = "desc";

const labelsMesesOcorrencia = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const API_BASE_OCORRENCIAS = "";

const estadoFiltroOcorrencias = {
    tipo: "",
    gravidade: "",
    funcionario: "",
    morador: "",
    dataInicial: "",
    dataFinal: ""
};

function mostrarMensagemRelatorio(mensagem, tipo = "error") {
    let toast = document.getElementById("mensagem-feedback");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "mensagem-feedback";
        toast.className = "popup-msg";
        document.body.appendChild(toast);
    }

    toast.className = `popup-msg ${tipo}`;
    toast.textContent = mensagem;
    toast.classList.add("show");
    window.clearTimeout(mostrarMensagemRelatorio._timer);
    mostrarMensagemRelatorio._timer = window.setTimeout(function () {
        toast.classList.remove("show");
    }, 3200);
}

function normalizarTextoOcorrencias(valor) {
    if (valor == null) {
        return "";
    } else {
        return String(valor)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toUpperCase();
    }
}

function escaparHtmlOcorrencias(valor) {
    return String(valor || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function converterDataOcorrencias(valor) {
    if (valor == null) {
        return null;
    }

    const texto = String(valor).trim();
    if (texto === "") {
        return null;
    }

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

function obterChaveDataOcorrencias(valor) {
    const data = converterDataOcorrencias(valor);
    if (!data) {
        return "";
    } else {
        const ano = String(data.getFullYear());
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const dia = String(data.getDate()).padStart(2, "0");
        return `${ano}-${mes}-${dia}`;
    }
}

function obterTimestampOcorrencias(valor) {
    const data = converterDataOcorrencias(valor);
    if (!data) {
        return 0;
    } else {
        return data.getTime();
    }
}

function formatarDataHoraOcorrencias(valor) {
    const data = converterDataOcorrencias(valor);
    if (!data) {
        return "-";
    } else {
        return data.toLocaleString("pt-BR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    }
}

function formatarDataFiltroOcorrencias(valor) {
    if (!valor) {
        return "";
    }

    const texto = String(valor).trim();
    const partes = texto.split("-");

    if (partes.length === 3) {
        return partes[2] + "/" + partes[1] + "/" + partes[0];
    } else {
        return texto;
    }
}

function obterTextoGravidade(gravidade) {
    if (Number(gravidade) === 1) return "Baixa";
    if (Number(gravidade) === 2) return "Média";
    if (Number(gravidade) === 3) return "Alta";
    return "-";
}

function obterClasseGravidade(gravidade) {
    if (Number(gravidade) === 1) return "gravidade-baixa";
    if (Number(gravidade) === 2) return "gravidade-media";
    return "gravidade-alta";
}

function obterResumoFiltrosRelatorioOcorrencias() {
    const filtros = [];

    if (String(estadoFiltroOcorrencias.tipo || "").trim() !== "") {
        filtros.push("Tipo: " + estadoFiltroOcorrencias.tipo);
    }
    if (String(estadoFiltroOcorrencias.gravidade || "").trim() !== "") {
        filtros.push("Gravidade: " + obterTextoGravidade(estadoFiltroOcorrencias.gravidade));
    }
    if (String(estadoFiltroOcorrencias.funcionario || "").trim() !== "") {
        filtros.push("Funcionário: " + estadoFiltroOcorrencias.funcionario);
    }
    if (String(estadoFiltroOcorrencias.morador || "").trim() !== "") {
        filtros.push("Morador: " + estadoFiltroOcorrencias.morador);
    }
    if (String(estadoFiltroOcorrencias.dataInicial || "").trim() !== "") {
        filtros.push("Data inicial: " + formatarDataFiltroOcorrencias(estadoFiltroOcorrencias.dataInicial));
    }
    if (String(estadoFiltroOcorrencias.dataFinal || "").trim() !== "") {
        filtros.push("Data final: " + formatarDataFiltroOcorrencias(estadoFiltroOcorrencias.dataFinal));
    }

    if (filtros.length === 0) {
        filtros.push("Nenhum filtro aplicado");
    }

    return filtros;
}

function obterMaximoEscalaOcorrencias(dados) {
    let maior = 0;
    dados.forEach(function (valor) {
        const numero = Number(valor);
        if (numero > maior) {
            maior = numero;
        }
    });

    if (maior <= 10) {
        return 10;
    } else {
        return Math.ceil(maior * 1.15);
    }
}

function criarOpcoesLinhaApexOcorrencias(series, maximoEscala) {
    let quantidadeTicks = 6;
    if (maximoEscala <= 6) {
        quantidadeTicks = Math.ceil(maximoEscala);
    }
    if (quantidadeTicks < 2) {
        quantidadeTicks = 2;
    }

    return {
        series: series,
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
        colors: ["var(--bs-primary)", "var(--bs-warning)", "var(--bs-danger)"],
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
            categories: labelsMesesOcorrencia,
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
        }
    };
}

function esconderGraficoOcorrencias(idGrafico, textoAviso) {
    const grafico = document.getElementById(idGrafico);
    if (!grafico) {
        return;
    }

    const card = grafico.closest(".chart-card");
    if (!card) {
        return;
    }

    grafico.style.display = "none";

    const avisoAtual = card.querySelector(".grafico-sem-dados");
    if (avisoAtual) {
        avisoAtual.textContent = textoAviso;
        return;
    }

    card.insertAdjacentHTML("beforeend", `<p class="grafico-sem-dados">${textoAviso}</p>`);
}

function mostrarGraficoOcorrencias(idGrafico) {
    const grafico = document.getElementById(idGrafico);
    if (!grafico) {
        return;
    }

    const card = grafico.closest(".chart-card");
    if (!card) {
        return;
    }

    const aviso = card.querySelector(".grafico-sem-dados");
    if (aviso) {
        aviso.remove();
    }

    grafico.style.display = "block";
}

function atualizarCardsOcorrencias(listaFiltrada) {
    const htmlTotalMes = document.getElementById("totalOcorrenciasMes");
    const htmlTipos = document.getElementById("qtdTiposOcorrencia");
    const htmlFuncionarios = document.getElementById("qtdFuncionariosOcorrencia");
    const htmlMoradores = document.getElementById("qtdMoradoresOcorrencia");

    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    let totalMes = 0;
    const tipos = new Set();
    const funcionarios = new Set();
    const moradores = new Set();

    listaFiltrada.forEach(function (ocorrencia) {
        const data = converterDataOcorrencias(ocorrencia.dtOcorrencia);
        if (data && data.getFullYear() === anoAtual && data.getMonth() === mesAtual) {
            totalMes += 1;
        }

        const tipo = String(ocorrencia?.tipoOcorrencia?.descricao || "").trim();
        if (tipo !== "") {
            tipos.add(normalizarTextoOcorrencias(tipo));
        }

        const funcionario = String(ocorrencia?.funcionario?.nome || "").trim();
        if (funcionario !== "") {
            funcionarios.add(normalizarTextoOcorrencias(funcionario));
        }

        const listaMoradores = Array.isArray(ocorrencia.moradoresEnvolvidos) ? ocorrencia.moradoresEnvolvidos : [];
        listaMoradores.forEach(function (morador) {
            const nome = String(morador?.nome || "").trim();
            if (nome !== "") {
                moradores.add(normalizarTextoOcorrencias(nome));
            }
        });
    });

    if (htmlTotalMes) {
        htmlTotalMes.textContent = String(totalMes);
    }
    if (htmlTipos) {
        htmlTipos.textContent = String(tipos.size);
    }
    if (htmlFuncionarios) {
        htmlFuncionarios.textContent = String(funcionarios.size);
    }
    if (htmlMoradores) {
        htmlMoradores.textContent = String(moradores.size);
    }
}

function atualizarGraficosOcorrencias(listaFiltrada) {
    const idsGraficos = ["graficoOcorrenciasMes", "graficoGravidadeMes", "graficoTiposOcorrencia", "graficoPizzaGravidade"];
    idsGraficos.forEach(function (id) {
        mostrarGraficoOcorrencias(id);
    });

    if (graficoOcorrenciasMes) {
        graficoOcorrenciasMes.destroy();
    }
    if (graficoGravidadeMes) {
        graficoGravidadeMes.destroy();
    }
    if (graficoTiposOcorrencia) {
        graficoTiposOcorrencia.destroy();
    }
    if (graficoPizzaGravidade) {
        graficoPizzaGravidade.destroy();
    }

    graficoOcorrenciasMes = null;
    graficoGravidadeMes = null;
    graficoTiposOcorrencia = null;
    graficoPizzaGravidade = null;

    if (typeof ApexCharts === "undefined") {
        idsGraficos.forEach(function (id) {
            esconderGraficoOcorrencias(id, "Não foi possível carregar o gráfico.");
        });
        return;
    }

    const anoAtual = new Date().getFullYear();
    const ocorrenciasPorMes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const baixaPorMes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const mediaPorMes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const altaPorMes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    const contagemTipos = new Map();
    let qtdBaixa = 0;
    let qtdMedia = 0;
    let qtdAlta = 0;
    let temRegistroAnoAtual = false;

    listaFiltrada.forEach(function (ocorrencia) {
        const gravidade = Number(ocorrencia?.tipoOcorrencia?.gravidade || 0);
        const tipo = String(ocorrencia?.tipoOcorrencia?.descricao || "Não informado").trim() || "Não informado";

        contagemTipos.set(tipo, (contagemTipos.get(tipo) || 0) + 1);

        if (gravidade === 1) {
            qtdBaixa += 1;
        }
        if (gravidade === 2) {
            qtdMedia += 1;
        }
        if (gravidade === 3) {
            qtdAlta += 1;
        }

        const data = converterDataOcorrencias(ocorrencia.dtOcorrencia);
        if (!data) {
            return;
        }
        if (data.getFullYear() !== anoAtual) {
            return;
        }

        temRegistroAnoAtual = true;
        const mes = data.getMonth();
        ocorrenciasPorMes[mes] += 1;
        if (gravidade === 1) {
            baixaPorMes[mes] += 1;
        }
        if (gravidade === 2) {
            mediaPorMes[mes] += 1;
        }
        if (gravidade === 3) {
            altaPorMes[mes] += 1;
        }
    });

    graficoOcorrenciasMes = new ApexCharts(
        document.getElementById("graficoOcorrenciasMes"),
        criarOpcoesLinhaApexOcorrencias(
            [{ name: "Ocorrências", data: ocorrenciasPorMes }],
            obterMaximoEscalaOcorrencias(ocorrenciasPorMes)
        )
    );
    graficoOcorrenciasMes.render();

    const maxGravidade = obterMaximoEscalaOcorrencias(
        baixaPorMes.concat(mediaPorMes).concat(altaPorMes)
    );

    graficoGravidadeMes = new ApexCharts(
        document.getElementById("graficoGravidadeMes"),
        criarOpcoesLinhaApexOcorrencias(
            [
                { name: "Baixa", data: baixaPorMes },
                { name: "Média", data: mediaPorMes },
                { name: "Alta", data: altaPorMes }
            ],
            maxGravidade
        )
    );
    graficoGravidadeMes.render();

    if (!temRegistroAnoAtual) {
        esconderGraficoOcorrencias("graficoOcorrenciasMes", `Sem ocorrências em ${anoAtual}.`);
        esconderGraficoOcorrencias("graficoGravidadeMes", `Sem ocorrências em ${anoAtual}.`);
    }

    const tiposOrdenados = Array.from(contagemTipos.entries())
        .sort(function (a, b) {
            return b[1] - a[1];
        })
        .slice(0, 5);

    const categoriasTipos = tiposOrdenados.map(function (item) {
        return item[0];
    });
    const valoresTipos = tiposOrdenados.map(function (item) {
        return item[1];
    });

    if (valoresTipos.length === 0) {
        esconderGraficoOcorrencias("graficoTiposOcorrencia", "Sem dados para o gráfico.");
    } else {
        graficoTiposOcorrencia = new ApexCharts(
            document.getElementById("graficoTiposOcorrencia"),
            {
                series: [{ name: "Ocorrências", data: valoresTipos }],
                chart: {
                    type: "bar",
                    height: 280,
                    fontFamily: "inherit",
                    toolbar: {
                        show: false
                    }
                },
                colors: ["#00357f"],
                plotOptions: {
                    bar: {
                        borderRadius: 8,
                        horizontal: true
                    }
                },
                dataLabels: {
                    enabled: false
                },
                xaxis: {
                    categories: categoriasTipos,
                    labels: {
                        style: {
                            colors: "#64748b"
                        }
                    }
                },
                yaxis: {
                    labels: {
                        style: {
                            colors: "#334155"
                        }
                    }
                },
                grid: {
                    borderColor: "rgba(0,0,0,.1)"
                },
                tooltip: {
                    theme: "dark"
                }
            }
        );
        graficoTiposOcorrencia.render();
    }

    let dadosPizza = [qtdBaixa, qtdMedia, qtdAlta];
    let labelsPizza = ["Baixa", "Média", "Alta"];
    let coresPizza = ["#22c55e", "#f59e0b", "#ef4444"];
    let totalPizza = qtdBaixa + qtdMedia + qtdAlta;
    let semDadosPizza = false;

    if (totalPizza <= 0) {
        dadosPizza = [1];
        labelsPizza = ["Sem dados"];
        coresPizza = ["#cbd5e1"];
        totalPizza = 0;
        semDadosPizza = true;
    }

    graficoPizzaGravidade = new ApexCharts(
        document.getElementById("graficoPizzaGravidade"),
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
                    if (semDadosPizza) {
                        return "";
                    } else {
                        return valor.toFixed(1).replace(".", ",") + "%";
                    }
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
                        if (semDadosPizza) {
                            return "Sem dados";
                        } else {
                            return Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
                        }
                    }
                }
            }
        }
    );
    graficoPizzaGravidade.render();
}

function preencherTiposRelatorioOcorrencias() {
    const selectTipo = document.getElementById("filtroTipoOcorrenciaRelatorio");
    if (!selectTipo) {
        return;
    }

    const valorAtual = selectTipo.value;
    const tipos = new Set();

    ocorrenciasRelatorio.forEach(function (ocorrencia) {
        const tipo = String(ocorrencia?.tipoOcorrencia?.descricao || "").trim();
        if (tipo !== "") {
            tipos.add(tipo);
        }
    });

    selectTipo.innerHTML = '<option value="">Todos</option>';

    Array.from(tipos).sort(function (a, b) {
        return a.localeCompare(b, "pt-BR");
    }).forEach(function (tipo) {
        const option = document.createElement("option");
        option.value = tipo;
        option.textContent = tipo;
        selectTipo.appendChild(option);
    });

    if (valorAtual && selectTipo.querySelector(`option[value="${valorAtual}"]`)) {
        selectTipo.value = valorAtual;
    }
}

function filtrarOcorrenciasRelatorio() {
    return ocorrenciasRelatorio.filter(function (ocorrencia) {
        const tipo = String(ocorrencia?.tipoOcorrencia?.descricao || "").trim();
        const gravidade = String(ocorrencia?.tipoOcorrencia?.gravidade || "").trim();
        const funcionario = String(ocorrencia?.funcionario?.nome || "").trim();
        const moradoresTexto = String(ocorrencia?._moradoresEnvolvidosTexto || "").trim();
        const data = obterChaveDataOcorrencias(ocorrencia?.dtOcorrencia || "");

        if (String(estadoFiltroOcorrencias.tipo || "").trim() !== "") {
            if (normalizarTextoOcorrencias(tipo) !== normalizarTextoOcorrencias(estadoFiltroOcorrencias.tipo)) {
                return false;
            }
        }

        if (String(estadoFiltroOcorrencias.gravidade || "").trim() !== "") {
            if (gravidade !== String(estadoFiltroOcorrencias.gravidade)) {
                return false;
            }
        }

        if (String(estadoFiltroOcorrencias.funcionario || "").trim() !== "") {
            if (!normalizarTextoOcorrencias(funcionario).includes(normalizarTextoOcorrencias(estadoFiltroOcorrencias.funcionario))) {
                return false;
            }
        }

        if (String(estadoFiltroOcorrencias.morador || "").trim() !== "") {
            if (!normalizarTextoOcorrencias(moradoresTexto).includes(normalizarTextoOcorrencias(estadoFiltroOcorrencias.morador))) {
                return false;
            }
        }

        if (String(estadoFiltroOcorrencias.dataInicial || "").trim() !== "") {
            if (data < estadoFiltroOcorrencias.dataInicial) {
                return false;
            }
        }

        if (String(estadoFiltroOcorrencias.dataFinal || "").trim() !== "") {
            if (data > estadoFiltroOcorrencias.dataFinal) {
                return false;
            }
        }

        return true;
    });
}

function limparIndicadoresOrdenacaoOcorrencias() {
    document.getElementById("sort-ocorrencia-data").textContent = "";
    document.getElementById("sort-ocorrencia-tipo").textContent = "";
    document.getElementById("sort-ocorrencia-gravidade").textContent = "";
    document.getElementById("sort-ocorrencia-funcionario").textContent = "";
    document.getElementById("sort-ocorrencia-turno").textContent = "";
    document.getElementById("sort-ocorrencia-moradores").textContent = "";
    document.getElementById("sort-ocorrencia-observacoes").textContent = "";

    document.getElementById("th-ocorrencia-data").classList.remove("is-active");
    document.getElementById("th-ocorrencia-tipo").classList.remove("is-active");
    document.getElementById("th-ocorrencia-gravidade").classList.remove("is-active");
    document.getElementById("th-ocorrencia-funcionario").classList.remove("is-active");
    document.getElementById("th-ocorrencia-turno").classList.remove("is-active");
    document.getElementById("th-ocorrencia-moradores").classList.remove("is-active");
    document.getElementById("th-ocorrencia-observacoes").classList.remove("is-active");
}

function atualizarIndicadoresOrdenacaoOcorrencias() {
    let indicador = document.getElementById("sort-ocorrencia-" + ordenacaoOcorrencias);
    let th = document.getElementById("th-ocorrencia-" + ordenacaoOcorrencias);

    limparIndicadoresOrdenacaoOcorrencias();

    if (direcaoOrdenacaoOcorrencias === "asc") {
        indicador.textContent = "^";
    } else {
        indicador.textContent = "v";
    }

    th.classList.add("is-active");
}

function definirOrdenacaoOcorrencias(campo) {
    if (ordenacaoOcorrencias === campo) {
        if (direcaoOrdenacaoOcorrencias === "asc")
            direcaoOrdenacaoOcorrencias = "desc";
        else
            direcaoOrdenacaoOcorrencias = "asc";
    }
    else {
        ordenacaoOcorrencias = campo;
        direcaoOrdenacaoOcorrencias = "asc";
    }

    renderizarOcorrenciasRelatorio();
}

function obterValorOrdenacaoOcorrencia(ocorrencia, campo) {
    let turno = "";

    if (campo === "data") {
        return obterTimestampOcorrencias(ocorrencia.dtOcorrencia);
    } else if (campo === "tipo") {
        return normalizarTextoOcorrencias(ocorrencia?.tipoOcorrencia?.descricao || "");
    } else if (campo === "gravidade") {
        return Number(ocorrencia?.tipoOcorrencia?.gravidade || 0);
    } else if (campo === "funcionario") {
        return normalizarTextoOcorrencias(ocorrencia?.funcionario?.nome || "");
    } else if (campo === "moradores") {
        return normalizarTextoOcorrencias(ocorrencia?._moradoresEnvolvidosTexto || "");
    } else if (campo === "observacoes") {
        return normalizarTextoOcorrencias(ocorrencia?.observacoes || "");
    } else if (campo === "turno") {
        if (ocorrencia?.turno?.horaIni) {
            turno += String(ocorrencia.turno.horaIni);
        }
        if (ocorrencia?.turno?.horaFim) {
            turno += String(ocorrencia.turno.horaFim);
        }
        return turno;
    } else {
        return "";
    }
}

function renderizarOcorrenciasRelatorio() {
    const tabela = document.getElementById("ocorrenciasRelatorio");
    if (!tabela) {
        return;
    }

    const tbody = tabela.querySelector("tbody");
    if (!tbody) {
        return;
    }

    const listaFiltrada = filtrarOcorrenciasRelatorio().sort(function (a, b) {
        let valorA = obterValorOrdenacaoOcorrencia(a, ordenacaoOcorrencias);
        let valorB = obterValorOrdenacaoOcorrencia(b, ordenacaoOcorrencias);

        if (valorA < valorB) {
            if (direcaoOrdenacaoOcorrencias === "asc")
                return -1;
            else
                return 1;
        }
        else if (valorA > valorB) {
            if (direcaoOrdenacaoOcorrencias === "asc")
                return 1;
            else
                return -1;
        }
        else
            return 0;
    });

    atualizarCardsOcorrencias(listaFiltrada);
    atualizarGraficosOcorrencias(listaFiltrada);
    atualizarIndicadoresOrdenacaoOcorrencias();

    if (listaFiltrada.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="relatorio-empty">Nenhuma ocorrência encontrada.</td>
            </tr>
        `;
        return;
    }

    let linhas = "";
    listaFiltrada.forEach(function (ocorrencia) {
        const data = escaparHtmlOcorrencias(formatarDataHoraOcorrencias(ocorrencia.dtOcorrencia));
        const tipo = escaparHtmlOcorrencias(ocorrencia?.tipoOcorrencia?.descricao || "-");
        const gravidadeNumero = Number(ocorrencia?.tipoOcorrencia?.gravidade || 0);
        const gravidade = escaparHtmlOcorrencias(obterTextoGravidade(gravidadeNumero));
        const funcionario = escaparHtmlOcorrencias(ocorrencia?.funcionario?.nome || "-");
        const observacoes = escaparHtmlOcorrencias(ocorrencia?.observacoes || "-");
        const moradoresTexto = String(ocorrencia?._moradoresEnvolvidosTexto || "").trim();
        const moradores = moradoresTexto === ""
            ? "<span>Nenhum</span>"
            : moradoresTexto
                .split(",")
                .map(function (nome) { return nome.trim(); })
                .filter(function (nome) { return nome !== ""; })
                .map(function (nome) { return `<span>${escaparHtmlOcorrencias(nome)}</span>`; })
                .join("");

        let turno = "-";
        if (ocorrencia?.turno?.horaIni && ocorrencia?.turno?.horaFim) {
            turno = `${String(ocorrencia.turno.horaIni).slice(0, 5)} - ${String(ocorrencia.turno.horaFim).slice(0, 5)}`;
        }

        linhas += `
            <tr>
                <td><span class="relatorio-date">${data}</span></td>
                <td>
                    <div class="relatorio-cell-main">
                        <strong>${tipo}</strong>
                        <span class="relatorio-muted">Tipo</span>
                    </div>
                </td>
                <td><span class="gravidade-chip ${obterClasseGravidade(gravidadeNumero)}">${gravidade}</span></td>
                <td>
                    <div class="relatorio-cell-main">
                        <strong>${funcionario}</strong>
                        <span class="relatorio-muted">Funcionário</span>
                    </div>
                </td>
                <td><span class="relatorio-chip neutro">${escaparHtmlOcorrencias(turno)}</span></td>
                <td><div class="moradores-lista relatorio-inline-list">${moradores}</div></td>
                <td><span class="relatorio-note">${observacoes}</span></td>
            </tr>
        `;
    });

    tbody.innerHTML = linhas;
}

function carregarOcorrenciasRelatorio() {
    const tabela = document.getElementById("ocorrenciasRelatorio");
    if (!tabela) {
        return;
    }

    const tbody = tabela.querySelector("tbody");
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">Carregando ocorrências...</td>
            </tr>
        `;
    }

    fetch(`${API_BASE_OCORRENCIAS}/ocorrencia/listar`, { credentials: "include" })
        .then(resp => resp.json())
        .then(ocorrencias => {
            if (!Array.isArray(ocorrencias)) {
                ocorrenciasRelatorio = [];
                preencherTiposRelatorioOcorrencias();
                renderizarOcorrenciasRelatorio();
                return;
            }

            return Promise.all(
                ocorrencias.map(ocorrencia => {
                    const idOcorrencia = Number(ocorrencia?.idOcorrencia || 0);
                    return fetch(`${API_BASE_OCORRENCIAS}/ocorrencia/moradores/${idOcorrencia}`, { credentials: "include" })
                        .then(resp => resp.json().catch(() => []))
                        .then(moradores => {
                            const lista = Array.isArray(moradores) ? moradores : [];
                            const texto = lista
                                .map(m => String(m?.nome || "").trim())
                                .filter(nome => nome !== "")
                                .join(", ");
                            return {
                                ...ocorrencia,
                                moradoresEnvolvidos: lista,
                                _moradoresEnvolvidosTexto: texto
                            };
                        })
                        .catch(() => ({
                            ...ocorrencia,
                            moradoresEnvolvidos: [],
                            _moradoresEnvolvidosTexto: ""
                        }));
                })
            ).then(lista => {
                ocorrenciasRelatorio = lista.slice().sort(function (a, b) {
                    return obterTimestampOcorrencias(b.dtOcorrencia) - obterTimestampOcorrencias(a.dtOcorrencia);
                });
                preencherTiposRelatorioOcorrencias();
                renderizarOcorrenciasRelatorio();
            });
        })
        .catch(() => {
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7">Erro ao carregar ocorrências.</td>
                    </tr>
                `;
            }
        });
}

function configurarFiltrosRelatorioOcorrencias() {
    const abrirFiltros = document.getElementById("abrirFiltrosOcorrenciaRelatorio");
    const fecharFiltros = document.getElementById("fecharFiltrosOcorrenciaRelatorio");
    const painelFiltros = document.getElementById("filtroOcorrenciaRelatorio");

    const filtroTipo = document.getElementById("filtroTipoOcorrenciaRelatorio");
    const filtroGravidade = document.getElementById("filtroGravidadeOcorrenciaRelatorio");
    const filtroFuncionario = document.getElementById("filtroFuncionarioOcorrenciaRelatorio");
    const filtroMorador = document.getElementById("filtroMoradorOcorrenciaRelatorio");
    const filtroDataInicial = document.getElementById("filtroDataInicialOcorrenciaRelatorio");
    const filtroDataFinal = document.getElementById("filtroDataFinalOcorrenciaRelatorio");
    const btnLimpar = document.getElementById("limparFiltrosOcorrenciaRelatorio");

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

    if (filtroTipo) {
        filtroTipo.addEventListener("change", function () {
            estadoFiltroOcorrencias.tipo = filtroTipo.value;
            renderizarOcorrenciasRelatorio();
        });
    }

    if (filtroGravidade) {
        filtroGravidade.addEventListener("change", function () {
            estadoFiltroOcorrencias.gravidade = filtroGravidade.value;
            renderizarOcorrenciasRelatorio();
        });
    }

    if (filtroFuncionario) {
        filtroFuncionario.addEventListener("input", function () {
            estadoFiltroOcorrencias.funcionario = filtroFuncionario.value;
            renderizarOcorrenciasRelatorio();
        });
    }

    if (filtroMorador) {
        filtroMorador.addEventListener("input", function () {
            estadoFiltroOcorrencias.morador = filtroMorador.value;
            renderizarOcorrenciasRelatorio();
        });
    }

    if (filtroDataInicial) {
        filtroDataInicial.addEventListener("input", function () {
            estadoFiltroOcorrencias.dataInicial = filtroDataInicial.value;
            renderizarOcorrenciasRelatorio();
        });
    }

    if (filtroDataFinal) {
        filtroDataFinal.addEventListener("input", function () {
            estadoFiltroOcorrencias.dataFinal = filtroDataFinal.value;
            renderizarOcorrenciasRelatorio();
        });
    }

    if (btnLimpar) {
        btnLimpar.addEventListener("click", function () {
            estadoFiltroOcorrencias.tipo = "";
            estadoFiltroOcorrencias.gravidade = "";
            estadoFiltroOcorrencias.funcionario = "";
            estadoFiltroOcorrencias.morador = "";
            estadoFiltroOcorrencias.dataInicial = "";
            estadoFiltroOcorrencias.dataFinal = "";

            if (filtroTipo) {
                filtroTipo.value = "";
            }
            if (filtroGravidade) {
                filtroGravidade.value = "";
            }
            if (filtroFuncionario) {
                filtroFuncionario.value = "";
            }
            if (filtroMorador) {
                filtroMorador.value = "";
            }
            if (filtroDataInicial) {
                filtroDataInicial.value = "";
            }
            if (filtroDataFinal) {
                filtroDataFinal.value = "";
            }

            renderizarOcorrenciasRelatorio();
        });
    }
}

function formatarCargoPerfilOcorrencias(categoria) {
    const texto = String(categoria || "").trim();
    const cargo = normalizarTextoOcorrencias(texto).toLowerCase();

    if (cargo === "coordenador") return "Coordenador(a)";
    if (cargo === "cuidador") return "Cuidador(a)";
    if (cargo === "secretaria") return "Secretária";
    return texto || "Acesso";
}

async function carregarPerfilRelatorioOcorrencias() {
    try {
        const resposta = await fetch("/login/sessao", { credentials: "include" });
        if (!resposta.ok) return;

        const funcionario = await resposta.json();
        const nome = String(funcionario.nome || "").trim();
        const cargo = formatarCargoPerfilOcorrencias(funcionario.categoria);
        const nomePerfil = document.getElementById("perfilNome");
        const cargoPerfil = document.getElementById("perfilCargo");

        if (nomePerfil && nome !== "") nomePerfil.textContent = nome;
        if (cargoPerfil) cargoPerfil.textContent = cargo;
    } catch (erro) {
        // Mantem os textos padrao quando nao for possivel consultar a sessao.
    }
}

function gerarPdfRelatorioOcorrencias() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        mostrarMensagemRelatorio("Biblioteca de PDF não carregou.");
        return;
    }

    const tabela = document.getElementById("ocorrenciasRelatorio");
    if (!tabela) {
        mostrarMensagemRelatorio("Tabela de ocorrências não encontrada.");
        return;
    }

    const linhasTabela = tabela.querySelectorAll("tbody tr");
    const body = [];

    linhasTabela.forEach(function (linha) {
        const colunas = linha.querySelectorAll("td");
        if (colunas.length !== 7) return;

        const primeiraColuna = colunas[0];
        if (primeiraColuna && primeiraColuna.colSpan > 1) return;

        const dadosLinha = [];
        colunas.forEach(function (coluna) {
            dadosLinha.push(coluna.textContent.trim());
        });
        body.push(dadosLinha);
    });

    if (body.length === 0) {
        mostrarMensagemRelatorio("Não há ocorrências listadas para gerar o PDF.");
        return;
    }

    const jsPDF = window.jspdf.jsPDF;
    const doc = new jsPDF("l", "pt", "a4");

    doc.setFontSize(14);
    doc.text("Relatório de Ocorrências", 40, 38);
    doc.setFontSize(10);
    doc.text("Gerado em: " + new Date().toLocaleString("pt-BR"), 40, 54);
    const textoFiltros = "Filtros: " + obterResumoFiltrosRelatorioOcorrencias().join(" | ");
    const linhasFiltros = doc.splitTextToSize(textoFiltros, 760);
    doc.text(linhasFiltros, 40, 68);
    const inicioTabela = 68 + (linhasFiltros.length * 12) + 6;

    doc.autoTable({
        startY: inicioTabela,
        head: [["Data", "Tipo", "Gravidade", "Funcionário", "Turno", "Moradores envolvidos", "Observações"]],
        body: body,
        headStyles: {
            fillColor: [0, 53, 127]
        },
        styles: {
            fontSize: 8,
            cellPadding: 4
        },
        columnStyles: {
            5: { cellWidth: 150 },
            6: { cellWidth: 160 }
        }
    });

    doc.save("relatorio-ocorrencias.pdf");
}

document.addEventListener("DOMContentLoaded", function () {
    carregarPerfilRelatorioOcorrencias();
    configurarFiltrosRelatorioOcorrencias();
    carregarOcorrenciasRelatorio();

    const btnGerarPdf = document.getElementById("btnGerarPdfOcorrencias");
    if (btnGerarPdf) {
        btnGerarPdf.addEventListener("click", gerarPdfRelatorioOcorrencias);
    }
});
