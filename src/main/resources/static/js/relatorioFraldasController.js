let relatorioFraldas = null;
let graficoPacotesMes = null;
let graficoComprasMes = null;

const mesesFraldas = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function escaparHtmlFraldas(valor) {
    return String(valor == null ? "" : valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function mostrarMensagemFraldas(mensagem, tipo = "error") {
    let toast = document.getElementById("mensagem-feedback");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "mensagem-feedback";
        document.body.appendChild(toast);
    }

    toast.className = `popup-msg ${tipo}`;
    toast.textContent = mensagem;
    toast.classList.add("show");
    window.clearTimeout(mostrarMensagemFraldas._timer);
    mostrarMensagemFraldas._timer = window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function formatarDataFraldas(valor) {
    if (!valor) return "-";
    const partes = String(valor).slice(0, 10).split("-");
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : "-";
}

function textoPacotes(quantidade) {
    const total = Number(quantidade) || 0;
    return `${total} pacote${total === 1 ? "" : "s"}`;
}

async function extrairErroFraldas(resposta, padrao) {
    try {
        const corpo = await resposta.json();
        return corpo.mensagem || corpo.message || corpo.descricao || padrao;
    } catch (erro) {
        return padrao;
    }
}

function atualizarResumoFraldas(dados) {
    document.getElementById("totalPacotes").textContent = Number(dados.totalPacotes) || 0;
    document.getElementById("totalLancamentos").textContent = Number(dados.totalLancamentos) || 0;
    document.getElementById("mesesComRegistro").textContent = Number(dados.mesesComRegistro) || 0;
    document.getElementById("maiorCompra").textContent = textoPacotes(dados.maiorCompra);
    document.getElementById("periodoSelecionado").textContent = `Ano ${dados.ano}`;
}

function renderizarTabelaFraldas(lancamentos) {
    const tbody = document.querySelector("#tabelaFraldas tbody");
    if (!tbody) return;

    if (!Array.isArray(lancamentos) || lancamentos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="relatorio-empty">Nenhuma compra registrada neste ano.</td></tr>';
        return;
    }

    tbody.innerHTML = lancamentos.map(lancamento => {
        const pacotes = Number(lancamento.quantidadePacotes) || 0;
        const funcionario = String(lancamento.funcionarioNome || "Não informado").trim();
        const observacao = String(lancamento.observacao || "Sem observação").trim();
        return `
            <tr>
                <td><span class="relatorio-date">${formatarDataFraldas(lancamento.dataRegistro)}</span></td>
                <td>
                    <span class="pacotes-cell">
                        <span class="material-symbols-outlined">inventory_2</span>
                        ${escaparHtmlFraldas(textoPacotes(pacotes))}
                    </span>
                </td>
                <td><div class="relatorio-cell-main"><strong>${escaparHtmlFraldas(funcionario)}</strong></div></td>
                <td><span class="relatorio-note">${escaparHtmlFraldas(observacao)}</span></td>
            </tr>`;
    }).join("");
}

function opcoesGraficoFraldas(nome, dados, tipo, cor) {
    return {
        series: [{ name: nome, data: dados }],
        chart: {
            type: tipo,
            height: 260,
            toolbar: { show: false },
            fontFamily: "Manrope, sans-serif",
            animations: { enabled: true, easing: "easeinout", speed: 650 }
        },
        colors: [cor],
        stroke: { curve: "smooth", width: tipo === "bar" ? 0 : 3 },
        fill: tipo === "bar" ? { opacity: 0.9 } : {
            type: "gradient",
            gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.04, stops: [0, 95] }
        },
        plotOptions: { bar: { borderRadius: 6, columnWidth: "48%" } },
        dataLabels: { enabled: false },
        markers: { size: tipo === "bar" ? 0 : 4 },
        xaxis: { categories: mesesFraldas },
        yaxis: { min: 0, forceNiceScale: true, labels: { formatter: valor => Math.round(valor) } },
        grid: { borderColor: "#e5edf7", strokeDashArray: 4 },
        tooltip: { y: { formatter: valor => String(Math.round(valor)) } }
    };
}

function atualizarGraficosFraldas(totaisMensais) {
    const meses = Array.isArray(totaisMensais) ? totaisMensais : [];
    const pacotes = mesesFraldas.map((_, indice) => Number(meses[indice]?.totalPacotes) || 0);
    const compras = mesesFraldas.map((_, indice) => Number(meses[indice]?.lancamentos) || 0);

    if (graficoPacotesMes) graficoPacotesMes.destroy();
    if (graficoComprasMes) graficoComprasMes.destroy();

    graficoPacotesMes = new ApexCharts(
        document.querySelector("#graficoPacotesMes"),
        opcoesGraficoFraldas("Pacotes", pacotes, "area", "#0757b8")
    );
    graficoComprasMes = new ApexCharts(
        document.querySelector("#graficoComprasMes"),
        opcoesGraficoFraldas("Compras", compras, "bar", "#16a36a")
    );
    graficoPacotesMes.render();
    graficoComprasMes.render();
}

async function carregarRelatorioFraldas() {
    const campoAno = document.getElementById("anoRelatorioFraldas");
    const ano = Number(campoAno.value);
    if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) {
        mostrarMensagemFraldas("Informe um ano válido entre 2000 e 2100.");
        return;
    }

    try {
        const resposta = await fetch(`/controle-fraldas/relatorio?ano=${ano}`, { credentials: "include" });
        if (!resposta.ok) {
            throw new Error(await extrairErroFraldas(resposta, "Não foi possível carregar o relatório de fraldas."));
        }

        relatorioFraldas = await resposta.json();
        atualizarResumoFraldas(relatorioFraldas);
        renderizarTabelaFraldas(relatorioFraldas.lancamentos);
        atualizarGraficosFraldas(relatorioFraldas.totaisMensais);
    } catch (erro) {
        mostrarMensagemFraldas(erro.message || "Não foi possível carregar o relatório de fraldas.");
    }
}

function gerarPdfRelatorioFraldas() {
    if (!window.jspdf?.jsPDF || !relatorioFraldas) {
        mostrarMensagemFraldas("Os dados do relatório ainda não estão disponíveis.");
        return;
    }

    const lancamentos = Array.isArray(relatorioFraldas.lancamentos) ? relatorioFraldas.lancamentos : [];
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "pt", "a4");

    doc.setFontSize(14);
    doc.text(`Relatório de Fraldas - ${relatorioFraldas.ano}`, 40, 38);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 40, 54);
    doc.text(`Total: ${textoPacotes(relatorioFraldas.totalPacotes)} em ${relatorioFraldas.totalLancamentos || 0} compra(s).`, 40, 70);

    doc.autoTable({
        startY: 84,
        head: [["Data", "Pacotes", "Registrado por", "Observação"]],
        body: lancamentos.map(item => [
            formatarDataFraldas(item.dataRegistro),
            String(Number(item.quantidadePacotes) || 0),
            String(item.funcionarioNome || "Não informado"),
            String(item.observacao || "Sem observação")
        ]),
        headStyles: { fillColor: [0, 63, 145] },
        styles: { fontSize: 9, cellPadding: 4 }
    });

    doc.save(`relatorio-fraldas-${relatorioFraldas.ano}.pdf`);
}

async function preencherPerfilFraldas() {
    try {
        const resposta = await fetch("/login/sessao", { credentials: "include" });
        if (!resposta.ok) return;
        const funcionario = await resposta.json();
        const perfilNome = document.getElementById("perfilNome");
        const perfilCargo = document.getElementById("perfilCargo");
        if (perfilNome && funcionario.nome) perfilNome.textContent = funcionario.nome;
        if (perfilCargo) perfilCargo.textContent = "Coordenador(a)";
    } catch (erro) {
        // Mantém os dados neutros quando a sessão não puder ser consultada.
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const campoAno = document.getElementById("anoRelatorioFraldas");
    campoAno.value = new Date().getFullYear();

    document.getElementById("aplicarAnoFraldas").addEventListener("click", carregarRelatorioFraldas);
    campoAno.addEventListener("keydown", evento => {
        if (evento.key === "Enter") carregarRelatorioFraldas();
    });
    document.getElementById("btnGerarPdfFraldas").addEventListener("click", gerarPdfRelatorioFraldas);

    preencherPerfilFraldas();
    carregarRelatorioFraldas();
});
