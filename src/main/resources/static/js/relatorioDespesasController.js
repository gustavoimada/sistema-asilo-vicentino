let despesasRelatorio = [];
let graficoVencimentoMes = null;
let graficoPagoMes = null;
let graficoPendenteMes = null;
let graficoPizzaCategorias = null;

const labelsMesesDespesas = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const estadoFiltroDespesas = {
    categoria: "",
    valorMin: "",
    valorMax: "",
    status: "",
    mes: "",
    observacao: "",
    vencimentoInicio: "",
    vencimentoFim: "",
    quitacaoInicio: "",
    quitacaoFim: ""
};

function padronizarTextoDespesa(valor) {
    if (valor == null) return "";
    return String(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase();
}

function escaparHtmlDespesa(valor) {
    return String(valor == null ? "" : valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function obterValorNumericoDespesa(valor) {
    const numero = Number(valor);
    if (Number.isNaN(numero)) return 0;
    return numero;
}

function formatarNumeroDespesa(valor, casasDecimais) {
    return Number(valor).toLocaleString("pt-BR", {
        minimumFractionDigits: casasDecimais,
        maximumFractionDigits: casasDecimais
    });
}

function formatarMoedaDespesa(valor) {
    const numero = Number(valor);
    if (Number.isNaN(numero)) return "-";
    return numero.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function obterDataComparacaoDespesa(data) {
    if (data == null || data === "") return "";
    const textoData = String(data);
    if (textoData.length >= 10) {
        return textoData.slice(0, 10);
    }
    const dataObj = new Date(textoData);
    if (Number.isNaN(dataObj.getTime())) return "";
    return dataObj.toISOString().slice(0, 10);
}

function formatarDataDespesa(data) {
    const dataComparacao = obterDataComparacaoDespesa(data);
    if (dataComparacao === "") return "-";
    const partes = dataComparacao.split("-");
    if (partes.length !== 3) return "-";
    return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function formatarDataFiltroDespesa(data) {
    if (!data) return "";
    const texto = String(data).trim();
    const partes = texto.split("-");
    if (partes.length === 3) {
        return partes[2] + "/" + partes[1] + "/" + partes[0];
    }
    if (partes.length === 2) {
        return partes[1] + "/" + partes[0];
    }
    return texto;
}

function obterCategoriaDespesa(despesa) {
    if (despesa && despesa.tipoDespesa && despesa.tipoDespesa.tipo != null) {
        const categoria = String(despesa.tipoDespesa.tipo).trim();
        if (categoria !== "") return categoria;
    }
    if (despesa && despesa.tipo != null) {
        const categoria = String(despesa.tipo).trim();
        if (categoria !== "") return categoria;
    }
    return "Nao informado";
}

function obterObservacaoDespesa(despesa) {
    if (despesa && despesa.observacoes != null) {
        return String(despesa.observacoes);
    }
    return "";
}

function obterHojeIsoDespesa() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return ano + "-" + mes + "-" + dia;
}

function obterStatusDespesaRelatorio(despesa) {
    const quitacao = obterDataComparacaoDespesa(despesa.dtQuitacao);
    const vencimento = obterDataComparacaoDespesa(despesa.dtVencimento);

    if (quitacao !== "") {
        return { chave: "paga", label: "Paga" };
    }

    if (vencimento !== "" && vencimento < obterHojeIsoDespesa()) {
        return { chave: "vencida", label: "Vencida" };
    }

    return { chave: "pendente", label: "Pendente" };
}

function obterAnoMesDespesa(data) {
    const dataComparacao = obterDataComparacaoDespesa(data);
    if (dataComparacao === "") return null;
    const partes = dataComparacao.split("-");
    if (partes.length !== 3) return null;
    return {
        ano: Number(partes[0]),
        mes: Number(partes[1]) - 1,
        chaveMes: partes[0] + "-" + partes[1]
    };
}

function formatarValorPorUnidadeDespesa(valor) {
    return "R$ " + formatarNumeroDespesa(obterValorNumericoDespesa(valor), 2);
}

function formatarEixoMoedaDespesa(valor) {
    return "R$ " + Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

function obterMaximoEscalaDespesa(dados) {
    let maior = 0;
    dados.forEach(valor => {
        const numero = Number(valor);
        if (numero > maior) {
            maior = numero;
        }
    });

    if (maior <= 10) {
        return 10;
    }

    return Math.ceil(maior * 1.15);
}

function criarOpcoesLinhaDespesa(nomeSerie, dadosSerie, corLinha, maximoEscala) {
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
            categories: labelsMesesDespesas,
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
                    return formatarEixoMoedaDespesa(valor);
                }
            }
        },
        tooltip: {
            theme: "dark",
            y: {
                formatter: function (valor) {
                    return formatarValorPorUnidadeDespesa(valor);
                }
            }
        },
        legend: {
            show: false
        }
    };
}

function esconderGraficoDespesaEExibirAviso(idGrafico, textoAviso) {
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

function mostrarGraficoDespesa(idGrafico) {
    const grafico = document.getElementById(idGrafico);
    if (!grafico) return;

    const card = grafico.closest(".chart-card");
    if (!card) return;

    const aviso = card.querySelector(".grafico-sem-dados");
    if (aviso) aviso.remove();

    grafico.style.display = "block";
}

function atualizarGraficosDespesas(listaDespesas) {
    const idsGraficosLinha = ["graficoVencimento", "graficoPago", "graficoPendente"];
    const idGraficoPizza = "graficoPizzaCategorias";

    idsGraficosLinha.forEach(id => mostrarGraficoDespesa(id));
    mostrarGraficoDespesa(idGraficoPizza);

    if (graficoVencimentoMes) graficoVencimentoMes.destroy();
    if (graficoPagoMes) graficoPagoMes.destroy();
    if (graficoPendenteMes) graficoPendenteMes.destroy();
    if (graficoPizzaCategorias) graficoPizzaCategorias.destroy();

    graficoVencimentoMes = null;
    graficoPagoMes = null;
    graficoPendenteMes = null;
    graficoPizzaCategorias = null;

    const anoAtual = new Date().getFullYear();
    const vencimentoPorMes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const pagoPorMes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const pendentePorMes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    const totalPorCategoria = {};
    let temRegistroAnoAtual = false;
    let totalPizza = 0;

    listaDespesas.forEach(despesa => {
        const valor = obterValorNumericoDespesa(despesa.valor);
        const categoria = obterCategoriaDespesa(despesa);
        const status = obterStatusDespesaRelatorio(despesa);
        const dataVencimento = obterAnoMesDespesa(despesa.dtVencimento);
        const dataQuitacao = obterAnoMesDespesa(despesa.dtQuitacao);

        if (!totalPorCategoria[categoria]) {
            totalPorCategoria[categoria] = 0;
        }
        totalPorCategoria[categoria] += valor;
        totalPizza += valor;

        if (dataVencimento && dataVencimento.ano === anoAtual) {
            temRegistroAnoAtual = true;
            vencimentoPorMes[dataVencimento.mes] += valor;
            if (status.chave !== "paga") {
                pendentePorMes[dataVencimento.mes] += valor;
            }
        }

        if (dataQuitacao && dataQuitacao.ano === anoAtual) {
            temRegistroAnoAtual = true;
            pagoPorMes[dataQuitacao.mes] += valor;
        }
    });

    if (typeof ApexCharts === "undefined") {
        idsGraficosLinha.forEach(id => {
            esconderGraficoDespesaEExibirAviso(id, "Nao foi possivel carregar o grafico.");
        });
    } else {
        graficoVencimentoMes = new ApexCharts(
            document.getElementById("graficoVencimento"),
            criarOpcoesLinhaDespesa("Vencimento (R$)", vencimentoPorMes, "var(--bs-primary)", obterMaximoEscalaDespesa(vencimentoPorMes))
        );
        graficoVencimentoMes.render();

        graficoPagoMes = new ApexCharts(
            document.getElementById("graficoPago"),
            criarOpcoesLinhaDespesa("Pago (R$)", pagoPorMes, "var(--bs-success)", obterMaximoEscalaDespesa(pagoPorMes))
        );
        graficoPagoMes.render();

        graficoPendenteMes = new ApexCharts(
            document.getElementById("graficoPendente"),
            criarOpcoesLinhaDespesa("Pendente (R$)", pendentePorMes, "var(--bs-warning)", obterMaximoEscalaDespesa(pendentePorMes))
        );
        graficoPendenteMes.render();

        if (!temRegistroAnoAtual) {
            idsGraficosLinha.forEach(id => {
                esconderGraficoDespesaEExibirAviso(id, `Sem despesas em ${anoAtual}.`);
            });
        }
    }

    if (typeof ApexCharts === "undefined") {
        esconderGraficoDespesaEExibirAviso(idGraficoPizza, "Nao foi possivel carregar o grafico.");
        return;
    }

    let labelsPizza = Object.keys(totalPorCategoria);
    let dadosPizza = labelsPizza.map(categoria => totalPorCategoria[categoria]);
    let coresPizza = ["#00357f", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#475569"];
    let semDadosPizza = false;

    if (totalPizza <= 0 || dadosPizza.length === 0) {
        labelsPizza = ["Sem dados"];
        dadosPizza = [1];
        coresPizza = ["#cbd5e1"];
        totalPizza = 0;
        semDadosPizza = true;
    }

    graficoPizzaCategorias = new ApexCharts(
        document.getElementById("graficoPizzaCategorias"),
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
                                    return formatarNumeroDespesa(totalPizza, 2);
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
                        return formatarValorPorUnidadeDespesa(valor);
                    }
                }
            }
        }
    );
    graficoPizzaCategorias.render();
}

function atualizarCategoriasFiltroDespesas() {
    const selectCategoria = document.getElementById("filtroCategoriaRelatorio");
    if (!selectCategoria) return;

    const valorAtual = selectCategoria.value;
    const categorias = [];

    despesasRelatorio.forEach(despesa => {
        const categoria = obterCategoriaDespesa(despesa);
        if (categoria !== "" && !categorias.includes(categoria)) {
            categorias.push(categoria);
        }
    });

    categorias.sort((a, b) => a.localeCompare(b, "pt-BR"));

    let opcoes = '<option value="">Todas</option>';
    categorias.forEach(categoria => {
        const selecionado = categoria === valorAtual ? " selected" : "";
        const categoriaSegura = escaparHtmlDespesa(categoria);
        opcoes += `<option value="${categoriaSegura}"${selecionado}>${categoriaSegura}</option>`;
    });

    selectCategoria.innerHTML = opcoes;
}

function filtrarDespesasRelatorio() {
    return despesasRelatorio.filter(despesa => {
        const categoria = obterCategoriaDespesa(despesa);
        const valor = obterValorNumericoDespesa(despesa.valor);
        const status = obterStatusDespesaRelatorio(despesa);
        const observacao = obterObservacaoDespesa(despesa);
        const dataVencimento = obterDataComparacaoDespesa(despesa.dtVencimento);
        const dataQuitacao = obterDataComparacaoDespesa(despesa.dtQuitacao);
        const mesVencimento = dataVencimento.length >= 7 ? dataVencimento.slice(0, 7) : "";

        if (estadoFiltroDespesas.categoria !== "") {
            if (padronizarTextoDespesa(categoria) !== padronizarTextoDespesa(estadoFiltroDespesas.categoria)) {
                return false;
            }
        }

        if (estadoFiltroDespesas.valorMin !== "") {
            if (valor < Number(estadoFiltroDespesas.valorMin)) {
                return false;
            }
        }

        if (estadoFiltroDespesas.valorMax !== "") {
            if (valor > Number(estadoFiltroDespesas.valorMax)) {
                return false;
            }
        }

        if (estadoFiltroDespesas.status !== "") {
            if (status.chave !== estadoFiltroDespesas.status) {
                return false;
            }
        }

        if (estadoFiltroDespesas.mes !== "") {
            if (mesVencimento !== estadoFiltroDespesas.mes) {
                return false;
            }
        }

        if (estadoFiltroDespesas.observacao !== "") {
            if (!padronizarTextoDespesa(observacao).includes(padronizarTextoDespesa(estadoFiltroDespesas.observacao))) {
                return false;
            }
        }

        if (estadoFiltroDespesas.vencimentoInicio !== "") {
            if (dataVencimento === "" || dataVencimento < estadoFiltroDespesas.vencimentoInicio) {
                return false;
            }
        }

        if (estadoFiltroDespesas.vencimentoFim !== "") {
            if (dataVencimento === "" || dataVencimento > estadoFiltroDespesas.vencimentoFim) {
                return false;
            }
        }

        if (estadoFiltroDespesas.quitacaoInicio !== "") {
            if (dataQuitacao === "" || dataQuitacao < estadoFiltroDespesas.quitacaoInicio) {
                return false;
            }
        }

        if (estadoFiltroDespesas.quitacaoFim !== "") {
            if (dataQuitacao === "" || dataQuitacao > estadoFiltroDespesas.quitacaoFim) {
                return false;
            }
        }

        return true;
    });
}

function renderizarDespesasRelatorio() {
    const tabela = document.getElementById("despesas");
    if (!tabela) return;

    const tbody = tabela.querySelector("tbody");
    if (!tbody) return;

    const htmlTotalDespesas = document.getElementById("totalDespesas");
    const htmlTotalPago = document.getElementById("totalPago");
    const htmlTotalPendente = document.getElementById("totalPendente");
    const htmlQtdVencidas = document.getElementById("qtdVencidas");

    const listaFiltrada = filtrarDespesasRelatorio();

    let linhas = "";
    let totalDespesas = 0;
    let totalPago = 0;
    let totalPendente = 0;
    let qtdVencidas = 0;

    listaFiltrada.forEach(despesa => {
        const valor = obterValorNumericoDespesa(despesa.valor);
        const categoria = obterCategoriaDespesa(despesa);
        const status = obterStatusDespesaRelatorio(despesa);
        const vencimento = formatarDataDespesa(despesa.dtVencimento);
        const quitacao = formatarDataDespesa(despesa.dtQuitacao);
        const observacao = obterObservacaoDespesa(despesa);

        totalDespesas += valor;
        if (status.chave === "paga") {
            totalPago += valor;
        } else {
            totalPendente += valor;
        }
        if (status.chave === "vencida") {
            qtdVencidas += 1;
        }

        linhas += `
            <tr>
                <td><span class="relatorio-value">${formatarMoedaDespesa(valor)}</span></td>
                <td>
                    <div class="relatorio-cell-main">
                        <strong>${escaparHtmlDespesa(categoria)}</strong>
                        <span class="relatorio-muted">Categoria</span>
                    </div>
                </td>
                <td><span class="status-pill ${status.chave}">${status.label}</span></td>
                <td><span class="relatorio-date">${vencimento}</span></td>
                <td><span class="relatorio-date">${quitacao}</span></td>
                <td><span class="relatorio-note">${escaparHtmlDespesa(observacao || "-")}</span></td>
            </tr>
        `;
    });

    if (htmlTotalDespesas) htmlTotalDespesas.innerHTML = formatarMoedaDespesa(totalDespesas);
    if (htmlTotalPago) htmlTotalPago.innerHTML = formatarMoedaDespesa(totalPago);
    if (htmlTotalPendente) htmlTotalPendente.innerHTML = formatarMoedaDespesa(totalPendente);
    if (htmlQtdVencidas) htmlQtdVencidas.innerHTML = String(qtdVencidas);

    atualizarGraficosDespesas(listaFiltrada);

    if (linhas === "") {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="relatorio-empty">Nenhuma despesa encontrada.</td>
            </tr>
        `;
    } else {
        tbody.innerHTML = linhas;
    }
}

function carregarDespesasRelatorio() {
    const tabela = document.getElementById("despesas");
    if (!tabela) return;

    const tbody = tabela.querySelector("tbody");
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">Carregando despesas...</td>
            </tr>
        `;
    }

    fetch("/despesa/listar")
        .then(resp => resp.json())
        .then(despesas => {
            if (!Array.isArray(despesas)) {
                despesasRelatorio = [];
            } else {
                despesasRelatorio = despesas.slice().sort((a, b) => {
                    const dataA = obterDataComparacaoDespesa(a.dtVencimento);
                    const dataB = obterDataComparacaoDespesa(b.dtVencimento);
                    if (dataA < dataB) return 1;
                    if (dataA > dataB) return -1;
                    return Number(b.idDespesa || 0) - Number(a.idDespesa || 0);
                });
            }
            atualizarCategoriasFiltroDespesas();
            renderizarDespesasRelatorio();
        })
        .catch(() => {
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6">Erro ao carregar despesas.</td>
                    </tr>
                `;
            }
        });
}

function obterResumoFiltrosRelatorioDespesas() {
    const filtros = [];

    if (estadoFiltroDespesas.categoria !== "") filtros.push("Categoria: " + estadoFiltroDespesas.categoria);
    if (estadoFiltroDespesas.valorMin !== "") filtros.push("Valor minimo: " + formatarMoedaDespesa(estadoFiltroDespesas.valorMin));
    if (estadoFiltroDespesas.valorMax !== "") filtros.push("Valor maximo: " + formatarMoedaDespesa(estadoFiltroDespesas.valorMax));
    if (estadoFiltroDespesas.status !== "") filtros.push("Status: " + estadoFiltroDespesas.status);
    if (estadoFiltroDespesas.mes !== "") filtros.push("Mes de vencimento: " + formatarDataFiltroDespesa(estadoFiltroDespesas.mes));
    if (estadoFiltroDespesas.observacao !== "") filtros.push("Observacoes: " + estadoFiltroDespesas.observacao);
    if (estadoFiltroDespesas.vencimentoInicio !== "") filtros.push("Vencimento inicial: " + formatarDataFiltroDespesa(estadoFiltroDespesas.vencimentoInicio));
    if (estadoFiltroDespesas.vencimentoFim !== "") filtros.push("Vencimento final: " + formatarDataFiltroDespesa(estadoFiltroDespesas.vencimentoFim));
    if (estadoFiltroDespesas.quitacaoInicio !== "") filtros.push("Quitacao inicial: " + formatarDataFiltroDespesa(estadoFiltroDespesas.quitacaoInicio));
    if (estadoFiltroDespesas.quitacaoFim !== "") filtros.push("Quitacao final: " + formatarDataFiltroDespesa(estadoFiltroDespesas.quitacaoFim));

    if (filtros.length === 0) {
        filtros.push("Nenhum filtro aplicado");
    }

    return filtros;
}

function configurarFiltrosDespesaRelatorio() {
    const abrirFiltros = document.getElementById("abrirFiltrosDespesaRelatorio");
    const fecharFiltros = document.getElementById("fecharFiltrosDespesaRelatorio");
    const painelFiltros = document.getElementById("filtroDespesaRelatorio");

    const campos = [
        ["filtroCategoriaRelatorio", "categoria", "change"],
        ["filtroValorMinRelatorio", "valorMin", "input"],
        ["filtroValorMaxRelatorio", "valorMax", "input"],
        ["filtroStatusRelatorio", "status", "change"],
        ["filtroMesRelatorio", "mes", "input"],
        ["filtroObservacaoRelatorio", "observacao", "input"],
        ["filtroVencimentoInicioRelatorio", "vencimentoInicio", "input"],
        ["filtroVencimentoFimRelatorio", "vencimentoFim", "input"],
        ["filtroQuitacaoInicioRelatorio", "quitacaoInicio", "input"],
        ["filtroQuitacaoFimRelatorio", "quitacaoFim", "input"]
    ];

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

    campos.forEach(configuracao => {
        const elemento = document.getElementById(configuracao[0]);
        if (!elemento) return;
        elemento.addEventListener(configuracao[2], function () {
            estadoFiltroDespesas[configuracao[1]] = elemento.value;
            renderizarDespesasRelatorio();
        });
    });

    const btnLimpar = document.getElementById("limparFiltrosDespesaRelatorio");
    if (btnLimpar) {
        btnLimpar.addEventListener("click", function () {
            campos.forEach(configuracao => {
                estadoFiltroDespesas[configuracao[1]] = "";
                const elemento = document.getElementById(configuracao[0]);
                if (elemento) elemento.value = "";
            });

            renderizarDespesasRelatorio();
        });
    }
}

function gerarPdfRelatorioDespesas() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("Biblioteca de PDF nao carregou.");
        return;
    }

    const tabela = document.getElementById("despesas");
    if (!tabela) {
        alert("Tabela de despesas nao encontrada.");
        return;
    }

    const linhasTabela = tabela.querySelectorAll("tbody tr");
    const body = [];

    linhasTabela.forEach(linha => {
        const colunas = linha.querySelectorAll("td");
        if (colunas.length !== 6) {
            return;
        }

        const primeiraColuna = colunas[0];
        if (primeiraColuna && primeiraColuna.colSpan > 1) {
            return;
        }

        const dadosLinha = [];
        colunas.forEach(coluna => {
            dadosLinha.push(coluna.textContent.trim());
        });
        body.push(dadosLinha);
    });

    if (body.length === 0) {
        alert("Nao ha despesas listadas para gerar o PDF.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "pt", "a4");

    doc.setFontSize(14);
    doc.text("Relatorio de Despesas", 40, 38);
    doc.setFontSize(10);
    doc.text("Gerado em: " + new Date().toLocaleString("pt-BR"), 40, 54);
    const textoFiltros = "Filtros: " + obterResumoFiltrosRelatorioDespesas().join(" | ");
    const linhasFiltros = doc.splitTextToSize(textoFiltros, 515);
    doc.text(linhasFiltros, 40, 68);
    const inicioTabela = 68 + (linhasFiltros.length * 12) + 6;

    doc.autoTable({
        startY: inicioTabela,
        head: [["Valor", "Categoria", "Status", "Vencimento", "Quitacao", "Observacoes"]],
        body: body,
        headStyles: {
            fillColor: [0, 53, 127]
        },
        styles: {
            fontSize: 9,
            cellPadding: 4
        }
    });

    doc.save("relatorio-despesas.pdf");
}

function formatarCargoPerfilDespesas(categoria) {
    const texto = String(categoria || "").trim();
    const cargo = padronizarTextoDespesa(texto).toLowerCase();

    if (cargo === "coordenador") return "Coordenador(a)";
    if (cargo === "cuidador") return "Cuidador(a)";
    if (cargo === "secretaria") return "Secretária";
    return texto || "Acesso";
}

async function preencherPerfilTopoDespesas() {
    try {
        const resposta = await fetch("/login/sessao", { credentials: "include" });
        if (!resposta.ok) return;

        const funcionario = await resposta.json();
        const nome = String(funcionario.nome || "").trim();
        const cargo = formatarCargoPerfilDespesas(funcionario.categoria);
        const perfilNome = document.getElementById("perfilNome");
        const perfilCargo = document.getElementById("perfilCargo");

        if (perfilNome && nome !== "") perfilNome.textContent = nome;
        if (perfilCargo) perfilCargo.textContent = cargo;
    } catch (erro) {
        // Mantem os textos padrao quando nao for possivel consultar a sessao.
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const btnGerarPdf = document.getElementById("btnGerarPdfDespesas");
    if (btnGerarPdf) {
        btnGerarPdf.addEventListener("click", gerarPdfRelatorioDespesas);
    }
    preencherPerfilTopoDespesas();
    configurarFiltrosDespesaRelatorio();
    carregarDespesasRelatorio();
});
