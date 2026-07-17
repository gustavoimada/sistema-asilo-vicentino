let valorDoacao = 0;
let qtdDoacao = 0;
let qtdAlimento = 0;
let qtdPatrimonio = 0;
let doacoesRelatorio = [];
let graficoFinanceiroMes = null;
let graficoAlimentoMes = null;
let graficoPizzaTipos = null;

const labelsMeses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const estadoFiltroDoacoes = {
    doador: "",
    tipo: "",
    data: "",
    dataFim: ""
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

function padronizarTexto(valor) {
    if (valor == null) return "";
    return String(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase();
}

function escaparHtmlDoacao(valor) {
    return String(valor == null ? "" : valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatarValorDoacao(valor) {
    const numero = Number(valor);
    if (Number.isNaN(numero)) return "-";
    return numero.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarDataDoacao(data) {
    if (!data) return "-";
    const texto = String(data).trim();
    const partes = texto.slice(0, 10).split("-");
    if (partes.length === 3) {
        return partes[2] + "/" + partes[1] + "/" + partes[0];
    }
    const valorData = new Date(data);
    if (Number.isNaN(valorData.getTime())) return "-";
    return valorData.toLocaleDateString("pt-BR");
}

function obterClasseTipoDoacao(tipo) {
    const tipoNormalizado = padronizarTexto(tipo).toLowerCase();

    if (tipoNormalizado === "financeiro") return "financeiro";
    if (tipoNormalizado === "alimento") return "alimento";
    if (tipoNormalizado === "patrimonio") return "patrimonio";

    return "neutro";
}

function doacaoFoiContabilizada(doacao) {
    return padronizarTexto(doacao?.status) === "CONCLUIDA";
}

function formatarDataFiltroRelatorio(data) {
    if (!data) return "";
    const texto = String(data).trim();
    const partes = texto.split("-");
    if (partes.length === 3) {
        return partes[2] + "/" + partes[1] + "/" + partes[0];
    }
    return texto;
}

function obterResumoFiltrosRelatorioDoacoes() {
    const filtros = [];
    const doador = String(estadoFiltroDoacoes.doador || "").trim();
    const tipo = String(estadoFiltroDoacoes.tipo || "").trim();
    const dataInicial = String(estadoFiltroDoacoes.data || "").trim();
    const dataFinal = String(estadoFiltroDoacoes.dataFim || "").trim();

    if (doador !== "") filtros.push("Doador: " + doador);
    if (tipo !== "") filtros.push("Tipo: " + tipo);
    if (dataInicial !== "") filtros.push("Data inicial: " + formatarDataFiltroRelatorio(dataInicial));
    if (dataFinal !== "") filtros.push("Data final: " + formatarDataFiltroRelatorio(dataFinal));

    if (filtros.length === 0) {
        filtros.push("Nenhum filtro aplicado");
    }

    return filtros;
}

function formatarCargoPerfilDoacoes(categoria) {
    const texto = String(categoria || "").trim();
    const cargo = padronizarTexto(texto).toLowerCase();

    if (cargo === "coordenador") return "Coordenador(a)";
    if (cargo === "cuidador") return "Cuidador(a)";
    if (cargo === "secretaria") return "Secretária";
    return texto || "Acesso";
}

async function carregarPerfilRelatorioDoacoes() {
    try {
        const resposta = await fetch("/login/sessao", { credentials: "include" });
        if (!resposta.ok) return;

        const funcionario = await resposta.json();
        const nome = String(funcionario.nome || "").trim();
        const cargo = formatarCargoPerfilDoacoes(funcionario.categoria);
        const nomePerfil = document.getElementById("perfilNome");
        const cargoPerfil = document.getElementById("perfilCargo");

        if (nomePerfil && nome !== "") nomePerfil.textContent = nome;
        if (cargoPerfil) cargoPerfil.textContent = cargo;
    } catch (erro) {
        // Mantem os textos padrao quando nao for possivel consultar a sessao.
    }
}

function obterDataComparacao(data) {
    if (data == null) return "";
    const textoData = String(data);
    if (textoData.length >= 10) {
        return textoData.slice(0, 10);
    }
    const dataObj = new Date(textoData);
    if (Number.isNaN(dataObj.getTime())) return "";
    return dataObj.toISOString().slice(0, 10);
}

function obterDoador(doacao) {
    if (doacao.cpfDoador != null) {
        if (String(doacao.cpfDoador).trim() !== "") {
            return String(doacao.cpfDoador);
        }
    }
    return "Anonimo";
}

function obterNomeDoador(doacao) {
    let nome = "";
    let cpfDoador = "";

    if (doacao != null) {
        if (doacao.nomeDoador != null) {
            nome = String(doacao.nomeDoador).trim();
        }

        if (nome === "" && doacao.nome != null) {
            nome = String(doacao.nome).trim();
        }

        if (nome === "" && doacao.doadorNome != null) {
            nome = String(doacao.doadorNome).trim();
        }

        if (doacao.cpfDoador != null) {
            cpfDoador = String(doacao.cpfDoador).trim();
        }
    }

    if (nome !== "") return nome;
    if (cpfDoador === "") return "Anonimo";
    return "Nao informado";
}

function obterTipo(doacao) {
    if (doacao.tipo != null) {
        if (String(doacao.tipo).trim() !== "") {
            return String(doacao.tipo);
        }
    }
    return "-";
}

function formatarValorOuQuantidade(doacao) {
    const numeroValor = Number(doacao.valor);
    if (Number.isNaN(numeroValor)) return "-";

    const tipo = padronizarTexto(obterTipo(doacao));
    if (tipo === "ALIMENTO") {
        return numeroValor.toLocaleString("pt-BR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }) + " kg";
    }
    return formatarValorDoacao(numeroValor);
}

function obterValorNumerico(valor) {
    const numero = Number(valor);
    if (Number.isNaN(numero)) return 0;
    return numero;
}

function formatarNumero(valor, casasDecimais) {
    return Number(valor).toLocaleString("pt-BR", {
        minimumFractionDigits: casasDecimais,
        maximumFractionDigits: casasDecimais
    });
}

function formatarValorPorUnidade(valor, unidade) {
    const numero = obterValorNumerico(valor);
    if (unidade === "R$") {
        return "R$ " + formatarNumero(numero, 2);
    }
    if (unidade === "kg") {
        return formatarNumero(numero, 2) + " kg";
    }
    return formatarNumero(numero, 2);
}

function formatarEixoPorUnidade(valor, unidade) {
    const numero = obterValorNumerico(valor);
    if (unidade === "R$") {
        return "R$ " + Number(numero).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
    }
    if (unidade === "kg") {
        return Number(numero).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " kg";
    }
    return Number(numero).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

function obterMaximoEscala(dados) {
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

function criarOpcoesLinhaApex(nomeSerie, dadosSerie, corLinha, maximoEscala, unidade) {
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
            categories: labelsMeses,
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
                    return formatarEixoPorUnidade(valor, unidade);
                }
            }
        },
        tooltip: {
            theme: "dark",
            y: {
                formatter: function (valor) {
                    return formatarValorPorUnidade(valor, unidade);
                }
            }
        },
        legend: {
            show: false
        }
    };
}

function esconderGraficoEExibirAviso(idGrafico, textoAviso) {
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

function mostrarGrafico(idGrafico) {
    const grafico = document.getElementById(idGrafico);
    if (!grafico) return;

    const card = grafico.closest(".chart-card");
    if (!card) return;

    const aviso = card.querySelector(".grafico-sem-dados");
    if (aviso) aviso.remove();

    grafico.style.display = "block";
}

function atualizarGraficos(listaDoacoes) {
    const idsGraficosLinha = ["graficoFinanceiro", "graficoAlimento"];
    const idGraficoPizza = "graficoPizzaTipos";

    idsGraficosLinha.forEach(id => mostrarGrafico(id));
    mostrarGrafico(idGraficoPizza);

    if (graficoFinanceiroMes) graficoFinanceiroMes.destroy();
    if (graficoAlimentoMes) graficoAlimentoMes.destroy();
    if (graficoPizzaTipos) graficoPizzaTipos.destroy();

    graficoFinanceiroMes = null;
    graficoAlimentoMes = null;
    graficoPizzaTipos = null;

    const anoAtual = new Date().getFullYear();
    const financeiroPorMes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const alimentoPorMes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const quantidadePorTipo = {
        FINANCEIRO: 0,
        ALIMENTO: 0,
        PATRIMONIO: 0
    };
    let temRegistroAnoAtual = false;

    listaDoacoes.forEach(doacao => {
        const tipo = padronizarTexto(doacao.tipo);
        const data = new Date(doacao.dtDoacao);
        const valor = obterValorNumerico(doacao.valor);

        if (Object.prototype.hasOwnProperty.call(quantidadePorTipo, tipo)) {
            quantidadePorTipo[tipo] += 1;
        }

        if (Number.isNaN(data.getTime())) {
            return;
        }

        if (data.getFullYear() !== anoAtual) {
            return;
        }

        temRegistroAnoAtual = true;

        const mes = data.getMonth();
        if (tipo === "FINANCEIRO") financeiroPorMes[mes] += valor;
        if (tipo === "ALIMENTO") alimentoPorMes[mes] += valor;
    });

    if (typeof ApexCharts === "undefined") {
        idsGraficosLinha.forEach(id => {
            esconderGraficoEExibirAviso(id, "Nao foi possivel carregar o grafico.");
        });
    } else {
        const maxFinanceiro = obterMaximoEscala(financeiroPorMes);
        const maxAlimento = obterMaximoEscala(alimentoPorMes);

        graficoFinanceiroMes = new ApexCharts(
            document.getElementById("graficoFinanceiro"),
            criarOpcoesLinhaApex("Financeiro (R$)", financeiroPorMes, "#2563eb", maxFinanceiro, "R$")
        );
        graficoFinanceiroMes.render();

        graficoAlimentoMes = new ApexCharts(
            document.getElementById("graficoAlimento"),
            criarOpcoesLinhaApex("Alimento (kg)", alimentoPorMes, "#16a34a", maxAlimento, "kg")
        );
        graficoAlimentoMes.render();

        if (!temRegistroAnoAtual) {
            idsGraficosLinha.forEach(id => {
                esconderGraficoEExibirAviso(id, `Sem doacoes em ${anoAtual}.`);
            });
        }
    }

    if (typeof ApexCharts === "undefined") {
        esconderGraficoEExibirAviso(idGraficoPizza, "Nao foi possivel carregar o grafico.");
        return;
    }

    const categoriasComDados = [
        { chave: "FINANCEIRO", label: "Financeiro", cor: "#2563eb" },
        { chave: "ALIMENTO", label: "Alimento", cor: "#16a34a" },
        { chave: "PATRIMONIO", label: "Patrimônio", cor: "#f59e0b" }
    ].filter(categoria => quantidadePorTipo[categoria.chave] > 0);

    let dadosPizza = categoriasComDados.map(categoria => quantidadePorTipo[categoria.chave]);
    let labelsPizza = categoriasComDados.map(categoria => categoria.label);
    let coresPizza = categoriasComDados.map(categoria => categoria.cor);
    let totalPizza = dadosPizza.reduce((total, quantidade) => total + quantidade, 0);
    let semDadosPizza = false;

    if (totalPizza <= 0) {
        dadosPizza = [1];
        labelsPizza = ["Sem dados"];
        coresPizza = ["#cbd5e1"];
        totalPizza = 0;
        semDadosPizza = true;
    }

    graficoPizzaTipos = new ApexCharts(
        document.getElementById("graficoPizzaTipos"),
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
                },
                style: {
                    fontSize: "12px",
                    fontWeight: 800,
                    colors: ["#ffffff"]
                },
                dropShadow: {
                    enabled: false
                }
            },
            stroke: {
                width: 4,
                colors: ["#ffffff"]
            },
            plotOptions: {
                pie: {
                    expandOnClick: true,
                    donut: {
                        size: "70%",
                        labels: {
                            show: true,
                            name: {
                                show: false
                            },
                            value: {
                                show: false,
                                formatter: function (valor) {
                                    if (semDadosPizza) return "0%";
                                    const percentual = (Number(valor) * 100) / totalPizza;
                                    return percentual.toFixed(1).replace(".", ",") + "%";
                                }
                            },
                            total: {
                                show: true,
                                showAlways: true,
                                label: "Doações",
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
                fontWeight: 700,
                formatter: function (nome, opcoes) {
                    const quantidade = opcoes.w.globals.series[opcoes.seriesIndex];
                    return `${nome} (${quantidade})`;
                }
            },
            tooltip: {
                y: {
                    formatter: function (valor) {
                        if (semDadosPizza) return "Sem dados";
                        return `${valor} ${valor === 1 ? "doação" : "doações"}`;
                    }
                }
            }
        }
    );
    graficoPizzaTipos.render();
}

function renderizarDoacoes() {
    const tabela = document.getElementById("doacoes");
    if (!tabela) return;

    const tbody = tabela.querySelector("tbody");
    if (!tbody) return;
    const htmlAlimento = document.getElementById("qtdAlimento");
    const htmlDoadores = document.getElementById("qtdDoadores");
    const htmlArrecadado = document.getElementById("totalArrecadado");
    const htmlPatrimonio = document.getElementById("qtdPatrimonio");

    let linhas = "";

    const listaFiltrada = doacoesRelatorio.filter(doacao => {
        if (!doacaoFoiContabilizada(doacao)) {
            return false;
        }

        const doador = obterDoador(doacao);
        const nomeDoador = obterNomeDoador(doacao);
        const tipo = obterTipo(doacao);
        const dataItem = obterDataComparacao(doacao.dtDoacao);

        let passouDoador = true;
        const filtroDoador = padronizarTexto(estadoFiltroDoacoes.doador);
        if (filtroDoador !== "") {
            const correspondeCpf = padronizarTexto(doador).includes(filtroDoador);
            const correspondeNome = padronizarTexto(nomeDoador).includes(filtroDoador);
            if (!correspondeCpf && !correspondeNome) {
                passouDoador = false;
            }
        }

        let passouTipo = true;
        const filtroTipo = padronizarTexto(estadoFiltroDoacoes.tipo);
        if (filtroTipo !== "") {
            if (padronizarTexto(tipo) !== filtroTipo) {
                passouTipo = false;
            }
        }

        let passouData = true;
        if (estadoFiltroDoacoes.data !== "") {
            if (dataItem < estadoFiltroDoacoes.data) {
                passouData = false;
            }
        }

        if (estadoFiltroDoacoes.dataFim !== "") {
            if (dataItem > estadoFiltroDoacoes.dataFim) {
                passouData = false;
            }
        }

        return passouDoador && passouTipo && passouData;
    });

    valorDoacao = 0;
    qtdDoacao = 0;
    qtdAlimento = 0;
    qtdPatrimonio = 0;

    listaFiltrada.forEach(doacao => {
        const valor = escaparHtmlDoacao(formatarValorOuQuantidade(doacao));
        const tipo = obterTipo(doacao);
        const tipoSeguro = escaparHtmlDoacao(tipo);
        const classeTipo = obterClasseTipoDoacao(tipo);
        const nomeDoador = escaparHtmlDoacao(obterNomeDoador(doacao));
        const doador = escaparHtmlDoacao(obterDoador(doacao));
        const data = escaparHtmlDoacao(formatarDataDoacao(doacao.dtDoacao));
        let observacoes = "";
        if (doacao.observacoes != null) {
            observacoes = String(doacao.observacoes);
        }
        observacoes = escaparHtmlDoacao(observacoes || "-");
        const tipoAtual = padronizarTexto(doacao.tipo);
        if (tipoAtual === "FINANCEIRO") {
            valorDoacao += Number(doacao.valor);
        }
        qtdDoacao += 1;
        if (tipoAtual === "ALIMENTO") {
            qtdAlimento += Number(doacao.valor);
        }
        if (tipoAtual === "PATRIMONIO") {
            qtdPatrimonio += Number(doacao.valor);
        }

        linhas += `
            <tr>
                <td><span class="relatorio-value">${valor}</span></td>
                <td><span class="relatorio-chip ${classeTipo}">${tipoSeguro}</span></td>
                <td>
                    <div class="relatorio-cell-main">
                        <strong>${nomeDoador}</strong>
                    </div>
                </td>
                <td><span class="relatorio-muted">${doador}</span></td>
                <td><span class="relatorio-date">${data}</span></td>
                <td><span class="relatorio-note">${observacoes}</span></td>
            </tr>
        `;
    });

    if (htmlArrecadado) htmlArrecadado.innerHTML = formatarValorDoacao(valorDoacao);
    if (htmlDoadores) htmlDoadores.innerHTML = qtdDoacao;
    if (htmlAlimento) htmlAlimento.innerHTML = qtdAlimento + " kg";
    if (htmlPatrimonio) htmlPatrimonio.innerHTML = formatarNumero(qtdPatrimonio, 2);

    atualizarGraficos(listaFiltrada);

    if (linhas === "") {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="relatorio-empty">Nenhuma doacao contabilizada encontrada.</td>
            </tr>
        `;
    } else {
        tbody.innerHTML = linhas;
    }
}

function carregarDoacoes() {
    const tabela = document.getElementById("doacoes");
    if (!tabela) return;

    const tbody = tabela.querySelector("tbody");
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">Carregando doacoes...</td>
            </tr>
        `;
    }

    fetch("/doacao/listarOrdenado?valor=dtdoacao&ordem=DESC")
        .then(resp => resp.json())
        .then(doacoes => {
            doacoesRelatorio = Array.isArray(doacoes) ? doacoes : [];
            renderizarDoacoes();
        })
        .catch(() => {
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6">Erro ao carregar doacoes.</td>
                    </tr>
                `;
            }
        });
}

function configurarFiltrosDoacaoRelatorio() {
    const abrirFiltros = document.getElementById("abrirFiltrosDoacaoRelatorio");
    const fecharFiltros = document.getElementById("fecharFiltrosDoacaoRelatorio");
    const painelFiltros = document.getElementById("filtroDoacaoRelatorio");

    const filtroDoador = document.getElementById("filtroDoadorRelatorio");
    const filtroTipo = document.getElementById("filtroTipoRelatorio");
    const filtroData = document.getElementById("filtroDataRelatorio");
    const filtroDataFim = document.getElementById("filtroDataFimRelatorio");
    const btnLimpar = document.getElementById("limparFiltrosDoacaoRelatorio");
    const pesquisaTopo = document.getElementById("pesquisaDoador");

    if (abrirFiltros && painelFiltros) {
        abrirFiltros.addEventListener("click", function () {
            painelFiltros.removeAttribute("hidden");
            painelFiltros.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    if (fecharFiltros && painelFiltros) {
        fecharFiltros.addEventListener("click", function () {
            painelFiltros.setAttribute("hidden", "");
        });
    }

    if (filtroDoador) {
        filtroDoador.addEventListener("input", function () {
            estadoFiltroDoacoes.doador = filtroDoador.value;
            if (pesquisaTopo) {
                pesquisaTopo.value = filtroDoador.value;
            }
            renderizarDoacoes();
        });
    }

    if (pesquisaTopo) {
        pesquisaTopo.addEventListener("input", function () {
            estadoFiltroDoacoes.doador = pesquisaTopo.value;
            if (filtroDoador) {
                filtroDoador.value = pesquisaTopo.value;
            }
            renderizarDoacoes();
        });
    }

    if (filtroTipo) {
        filtroTipo.addEventListener("change", function () {
            estadoFiltroDoacoes.tipo = filtroTipo.value;
            renderizarDoacoes();
        });
    }

    if (filtroData) {
        filtroData.addEventListener("input", function () {
            estadoFiltroDoacoes.data = filtroData.value;
            renderizarDoacoes();
        });
    }

    if (filtroDataFim) {
        filtroDataFim.addEventListener("input", function () {
            estadoFiltroDoacoes.dataFim = filtroDataFim.value;
            renderizarDoacoes();
        });
    }

    if (btnLimpar) {
        btnLimpar.addEventListener("click", function () {
            estadoFiltroDoacoes.doador = "";
            estadoFiltroDoacoes.tipo = "";
            estadoFiltroDoacoes.data = "";
            estadoFiltroDoacoes.dataFim = "";

            if (filtroDoador) filtroDoador.value = "";
            if (filtroTipo) filtroTipo.value = "";
            if (filtroData) filtroData.value = "";
            if (filtroDataFim) filtroDataFim.value = "";
            if (pesquisaTopo) pesquisaTopo.value = "";

            renderizarDoacoes();
        });
    }
}

function gerarPdfRelatorioDoacoes() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        mostrarMensagemRelatorio("Biblioteca de PDF nao carregou.");
        return;
    }

    const tabela = document.getElementById("doacoes");
    if (!tabela) {
        mostrarMensagemRelatorio("Tabela de doacoes nao encontrada.");
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
        mostrarMensagemRelatorio("Nao ha doacoes listadas para gerar o PDF.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "pt", "a4");

    doc.setFontSize(14);
    doc.text("Relatorio de Doacoes", 40, 38);
    doc.setFontSize(10);
    doc.text("Gerado em: " + new Date().toLocaleString("pt-BR"), 40, 54);
    const textoFiltros = "Filtros: " + obterResumoFiltrosRelatorioDoacoes().join(" | ");
    const linhasFiltros = doc.splitTextToSize(textoFiltros, 515);
    doc.text(linhasFiltros, 40, 68);
    const inicioTabela = 68 + (linhasFiltros.length * 12) + 6;

    doc.autoTable({
        startY: inicioTabela,
        head: [["Valor/Qtd", "Tipo", "Nome Doador", "CPF Doador", "Data", "Observacoes"]],
        body: body,
        headStyles: {
            fillColor: [0, 53, 127]
        },
        styles: {
            fontSize: 9,
            cellPadding: 4
        }
    });

    doc.save("relatorio-doacoes.pdf");
}

document.addEventListener("DOMContentLoaded", function () {
    const btnGerarPdf = document.getElementById("btnGerarPdfDoacoes");
    if (btnGerarPdf) {
        btnGerarPdf.addEventListener("click", gerarPdfRelatorioDoacoes);
    }
    carregarPerfilRelatorioDoacoes();
    configurarFiltrosDoacaoRelatorio();
    carregarDoacoes();
});
