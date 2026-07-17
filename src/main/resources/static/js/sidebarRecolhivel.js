(function () {
    const CHAVE_MENU_RECOLHIDO = "sgav.sidebar.recolhido";

    function lerPreferencia() {
        try {
            return localStorage.getItem(CHAVE_MENU_RECOLHIDO) === "true";
        } catch (e) {
            return false;
        }
    }

    function salvarPreferencia(recolhido) {
        try {
            localStorage.setItem(CHAVE_MENU_RECOLHIDO, String(recolhido));
        } catch (e) {}
    }

    function configurarDicaDeRelatorio(botao) {
        const pagina = window.location.pathname.split("/").pop().toLowerCase();
        const paginasComDica = ["relatorioocorrencias.html", "relatoriofuncionarios.html"];
        const chaveDica = `sgav.sidebar.dica.${pagina}`;

        if (!paginasComDica.includes(pagina)
            || window.matchMedia("(max-width: 1099px)").matches
            || document.body.classList.contains("sidebar-collapsed")
            || new URLSearchParams(window.location.search).get("visao") === "graficos") {
            return;
        }

        try {
            if (sessionStorage.getItem(chaveDica) === "true") return;
        } catch (e) {}

        const dica = document.createElement("aside");
        dica.className = "sidebar-report-hint";
        dica.setAttribute("role", "status");
        dica.innerHTML = `
            <div class="sidebar-report-hint__icon" aria-hidden="true">
                <span class="material-symbols-outlined">view_sidebar</span>
            </div>
            <div class="sidebar-report-hint__content">
                <strong>Veja a tabela com mais espaço</strong>
                <p>Recolha o menu lateral para visualizar melhor todas as colunas.</p>
                <div class="sidebar-report-hint__actions">
                    <button type="button" class="sidebar-report-hint__collapse">Recolher menu</button>
                    <button type="button" class="sidebar-report-hint__dismiss">Agora não</button>
                </div>
            </div>`;
        document.body.appendChild(dica);
        botao.classList.add("sidebar-collapse-toggle--highlight");

        function posicionarDica() {
            const areaBotao = botao.getBoundingClientRect();
            const largura = Math.min(270, window.innerWidth - 24);
            const esquerda = Math.max(12, Math.min(areaBotao.right - largura, window.innerWidth - largura - 12));
            dica.style.width = `${largura}px`;
            dica.style.left = `${esquerda}px`;
            dica.style.top = `${areaBotao.bottom + 14}px`;
            dica.style.setProperty("--hint-arrow-left", `${Math.max(18, areaBotao.left + areaBotao.width / 2 - esquerda - 7)}px`);
        }

        function encerrarDica() {
            try {
                sessionStorage.setItem(chaveDica, "true");
            } catch (e) {}
            botao.classList.remove("sidebar-collapse-toggle--highlight");
            window.removeEventListener("resize", posicionarDica);
            dica.remove();
        }

        dica.querySelector(".sidebar-report-hint__collapse").addEventListener("click", function () {
            botao.click();
            encerrarDica();
        });
        dica.querySelector(".sidebar-report-hint__dismiss").addEventListener("click", encerrarDica);
        botao.addEventListener("click", encerrarDica, { once: true });
        window.addEventListener("resize", posicionarDica);
        posicionarDica();
    }

    function configurarSidebarRetiravel() {
        if (!document.body.classList.contains("sidebar-collapsible-demo")) return;

        const sidebar = document.querySelector(".sidebar");
        if (!sidebar || sidebar.querySelector(".sidebar-collapse-toggle")) return;

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "sidebar-collapse-toggle";
        botao.innerHTML = '<span class="material-symbols-outlined">keyboard_double_arrow_left</span>';
        sidebar.appendChild(botao);

        function aplicarEstado(recolhido) {
            document.body.classList.toggle("sidebar-collapsed", recolhido);
            botao.setAttribute("aria-expanded", String(!recolhido));
            botao.setAttribute("aria-label", recolhido ? "Fixar menu lateral aberto" : "Recolher menu lateral");
            botao.setAttribute("title", recolhido ? "Fixar menu aberto" : "Recolher menu");
        }

        botao.addEventListener("click", function () {
            const recolhido = !document.body.classList.contains("sidebar-collapsed");
            salvarPreferencia(recolhido);
            aplicarEstado(recolhido);
        });

        aplicarEstado(lerPreferencia());
        window.setTimeout(function () {
            configurarDicaDeRelatorio(botao);
        }, 450);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", configurarSidebarRetiravel);
    } else {
        configurarSidebarRetiravel();
    }
})();
