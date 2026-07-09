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
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", configurarSidebarRetiravel);
    } else {
        configurarSidebarRetiravel();
    }
})();
