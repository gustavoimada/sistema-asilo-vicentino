(function () {
    "use strict";

    function estaNaVisaoGraficos() {
        return new URLSearchParams(window.location.search).get("visao") === "graficos";
    }

    function configurarVisaoGraficos() {
        if (!estaNaVisaoGraficos()) {
            return;
        }

        document.body.classList.add("modo-graficos");

        const titulo = document.querySelector(".page-title");
        const subtitulo = document.querySelector(".page-subtitle");
        const nomeRelatorio = document.body.dataset.relatorio || "Relatório";

        if (titulo) {
            titulo.textContent = `Gráficos de ${nomeRelatorio}`;
        }
        if (subtitulo) {
            subtitulo.textContent = "Visão analítica consolidada para consulta rápida.";
        }
    }

    window.abrirVisaoGraficos = function () {
        const url = new URL(window.location.href);
        url.searchParams.set("visao", "graficos");
        window.location.assign(url.toString());
    };

    window.voltarAoRelatorio = function () {
        const url = new URL(window.location.href);
        url.searchParams.delete("visao");
        window.location.assign(url.toString());
    };

    configurarVisaoGraficos();
}());
