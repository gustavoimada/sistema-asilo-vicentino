(function () {
    function removerAcentos(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function formatarCargo(categoria) {
        const valor = removerAcentos(String(categoria || "").trim()).replace(/[_-]+/g, " ").replace(/\s+/g, " ").toLowerCase();

        if (valor === "coordenador")
            return "Coordenador(a)";
        if (valor === "cuidador")
            return "Cuidador(a)";
        if (valor === "secretaria")
            return "Secretária";
        if (valor === "nutricionista")
            return "Nutricionista";
        if (valor === "artesao")
            return "Artesão";
        if (valor === "educador fisico")
            return "Educador Físico";
        if (valor === "fisioterapeuta")
            return "Fisioterapeuta";

        return String(categoria || "").trim() || "Acesso";
    }

    function preencher(nome, categoria) {
        const nomeEl = document.getElementById("perfilNome");
        const cargoEl = document.getElementById("perfilCargo");

        if (nomeEl)
            nomeEl.textContent = String(nome || "Usuario").trim() || "Usuario";
        if (cargoEl)
            cargoEl.textContent = formatarCargo(categoria);
    }

    async function carregarPerfilTopo() {
        let nome = localStorage.getItem("funcionarioNome") || localStorage.getItem("usuarioNome") || "Usuario";
        let categoria = localStorage.getItem("funcionarioCategoria") || "";

        try {
            const response = await fetch("/login/sessao", { credentials: "include" });

            if (response.ok) {
                const funcionario = await response.json();

                if (funcionario.nome) {
                    nome = funcionario.nome;
                    localStorage.setItem("funcionarioNome", funcionario.nome);
                }
                if (funcionario.categoria) {
                    categoria = funcionario.categoria;
                    localStorage.setItem("funcionarioCategoria", funcionario.categoria);
                }
            }
        }
        catch (error) {
            console.warn("Nao foi possivel carregar o perfil da sessao.", error);
        }

        preencher(nome, categoria);
    }

    document.addEventListener("DOMContentLoaded", carregarPerfilTopo);
})();
