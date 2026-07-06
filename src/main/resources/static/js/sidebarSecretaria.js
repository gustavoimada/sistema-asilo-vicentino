(function () {
    const itensMenu = [
        { href: "secretaria.html", icone: "dashboard", texto: "Painel", aliases: ["secretaria.html", "tipoOcorrencia.html"] },
        { href: "morador.html", icone: "elderly", texto: "Moradores" },
        { href: "quartos.html", icone: "bed", texto: "Quartos" },
        { href: "funcionario.html", icone: "badge", texto: "Funcionarios" },
        { href: "medicamentos.html", icone: "medical_services", texto: "Medicamentos" },
        { href: "caixinhas.html", icone: "inventory_2", texto: "Caixinhas" },
        { href: "atividades.html", icone: "event_note", texto: "Atividades", aliases: ["atividades.html", "tipoAtividades.html"] },
        { href: "doacao.html", icone: "volunteer_activism", texto: "Doacoes" },
        { href: "despesa.html", icone: "request_quote", texto: "Despesas", aliases: ["despesa.html", "tiposDespesas.html"] },
        { href: "noticias.html", icone: "newspaper", texto: "Noticias" }
    ];

    function paginaAtual() {
        const partes = String(window.location.pathname || "").split("/");
        return partes[partes.length - 1] || "secretaria.html";
    }

    function classeAtiva(item, pagina) {
        const aliases = item.aliases || [item.href];
        return aliases.indexOf(pagina) >= 0 ? " active" : "";
    }

    function montarLink(item, pagina) {
        return `
            <a href="${item.href}" class="sidebar-link${classeAtiva(item, pagina)}">
                <span class="material-symbols-outlined">${item.icone}</span>
                <span>${item.texto}</span>
            </a>
        `;
    }

    function renderizarSidebarSecretaria() {
        const sidebar = document.querySelector(".sidebar");
        if (!sidebar) return;

        sidebar.setAttribute("data-secretaria-sidebar", "true");

        const pagina = paginaAtual();
        const links = itensMenu.map(function (item) {
            return montarLink(item, pagina);
        }).join("");

        sidebar.innerHTML = `
            <div class="sidebar-brand">
                <div class="sidebar-brand-main">
                    <img src="assets/logo.png" alt="Logo Asilo Vicentino" />
                    <h1>SGAV</h1>
                </div>
            </div>

            <nav class="sidebar-nav">
                ${links}
            </nav>

            <div class="sidebar-footer">
                <a href="coordenador.html" class="sidebar-link secretaria-panel-link" id="linkPainelCoordenador" style="display: none;">
                    <span class="material-symbols-outlined">admin_panel_settings</span>
                    <span>Painel do Coordenador</span>
                </a>

                <a href="login.html" class="sidebar-link logout">
                    <span class="material-symbols-outlined">logout</span>
                    <span>Sair</span>
                </a>
            </div>
        `;

        configurarRolagemDoMenu(sidebar);
        atualizarAtalhoCoordenador(localStorage.getItem("funcionarioCategoria") || "");
        fetch("/login/sessao", { credentials: "include" })
            .then(function (response) {
                if (!response.ok) return null;
                return response.json();
            })
            .then(function (funcionario) {
                if (!funcionario) return;
                if (funcionario.categoria) {
                    localStorage.setItem("funcionarioCategoria", funcionario.categoria);
                }
                atualizarAtalhoCoordenador(funcionario.categoria || "");
            })
            .catch(function () {});
    }

    function configurarRolagemDoMenu(sidebar) {
        const nav = sidebar.querySelector(".sidebar-nav");
        if (!nav) return;

        function atualizarEstado() {
            const scrollavel = nav.scrollHeight > nav.clientHeight + 1;
            const noTopo = nav.scrollTop <= 1;
            const noFim = nav.scrollTop + nav.clientHeight >= nav.scrollHeight - 1;

            nav.classList.toggle("is-scrollable", scrollavel);
            nav.classList.toggle("at-top", noTopo);
            nav.classList.toggle("at-bottom", noFim);
        }

        nav.addEventListener("scroll", atualizarEstado, { passive: true });
        window.addEventListener("resize", atualizarEstado);
        requestAnimationFrame(atualizarEstado);
    }

    function atualizarAtalhoCoordenador(categoria) {
        const link = document.getElementById("linkPainelCoordenador");
        if (!link) return;

        const normalizada = String(categoria || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();

        link.style.display = normalizada.indexOf("coordenador") >= 0 ? "flex" : "none";
    }

    renderizarSidebarSecretaria();
})();
