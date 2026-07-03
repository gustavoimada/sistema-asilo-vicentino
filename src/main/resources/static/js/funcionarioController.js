let funcionarios = [];
let funcionarioPendenteExclusao = null;
let ordenacaoAtual = {
    chave: "nome",
    direcao: "asc"
};

function el(id)
{
    return document.getElementById(id);
}

function preencherPerfilTopo()
{
    const nome = (localStorage.getItem("funcionarioNome") || localStorage.getItem("usuarioNome") || "Usuário").trim();
    const categoria = (localStorage.getItem("funcionarioCategoria") || "").trim();

    let cargoTexto = "Acesso";
    if (categoria) cargoTexto = formatarCargoInclusivo(categoria);

    if (el("perfilNome")) el("perfilNome").textContent = nome || "Usuário";
    if (el("perfilCargo")) el("perfilCargo").textContent = cargoTexto;
}

function carregarContextoUrl()
{
    const params = new URLSearchParams(window.location.search);
    const idFuncionario = Number(params.get("idFuncionario") || 0);
    const idUser = Number(params.get("idUser") || 0);
    const usuarioNome = String(params.get("usuarioNome") || "").trim();
    const funcionarioNome = String(params.get("funcionarioNome") || "").trim();
    const categoria = String(params.get("categoria") || "").trim();

    if (Number.isInteger(idFuncionario) && idFuncionario > 0) localStorage.setItem("idFuncionario", String(idFuncionario));
    if (Number.isInteger(idUser) && idUser > 0) localStorage.setItem("usuarioId", String(idUser));
    if (usuarioNome) localStorage.setItem("usuarioNome", usuarioNome);
    if (funcionarioNome) localStorage.setItem("funcionarioNome", funcionarioNome);
    if (categoria) localStorage.setItem("funcionarioCategoria", categoria);
}

function formatarCargoInclusivo(categoria)
{
    const valor = removerAcentos(String(categoria || "").trim()).toLowerCase();
    if (valor === "coordenador") return "Coordenador(a)";
    if (valor === "cuidador") return "Cuidador(a)";
    if (valor === "secretaria") return "Secretária(o)";
    return String(categoria || "").trim();
}

function montarQueryContexto()
{
    const params = new URLSearchParams();
    const idFuncionario = localStorage.getItem("idFuncionario");
    const idUser = localStorage.getItem("usuarioId");
    const usuarioNome = localStorage.getItem("usuarioNome");
    const funcionarioNome = localStorage.getItem("funcionarioNome");
    const categoria = localStorage.getItem("funcionarioCategoria");

    if (idFuncionario) params.set("idFuncionario", idFuncionario);
    if (idUser) params.set("idUser", idUser);
    if (usuarioNome) params.set("usuarioNome", usuarioNome);
    if (funcionarioNome) params.set("funcionarioNome", funcionarioNome);
    if (categoria) params.set("categoria", categoria);

    return params.toString();
}

function ajustarMenuPorPerfil()
{
    const query = montarQueryContexto();
    const sufixo = query ? `?${query}` : "";

    document.querySelectorAll(".sidebar-nav a.sidebar-link").forEach((link) =>
    {
        const href = link.getAttribute("href") || "";
        if (query && href.endsWith(".html"))
        {
            link.setAttribute("href", `${href}${sufixo}`);
        }
    });
}

function padronizarTexto(texto)
{
    return (texto || "").trim().replace(/\s+/g, " ");
}

function removerAcentos(texto)
{
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function padronizarCategoriaValor(categoria)
{
    const valor = removerAcentos(String(categoria || "").trim()).toLowerCase();
    if (valor === "coordenador") return "Coordenador";
    if (valor === "cuidador") return "Cuidador";
    if (valor === "secretaria") return "Secretaria";
    return String(categoria || "").trim();
}

function somenteDigitos(valor)
{
    return String(valor || "").replace(/\D/g, "");
}

function formatarCpf(valor)
{
    const numeros = somenteDigitos(valor).slice(0, 11);
    return numeros
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarTelefone(valor)
{
    const numeros = somenteDigitos(valor).slice(0, 11);
    if (numeros.length <= 10)
    {
        return numeros
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
    }
    return numeros
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

function formatarCtps(valor)
{
    const numeros = somenteDigitos(valor).slice(0, 11);
    if (numeros.length <= 5) return numeros;
    return `${numeros.slice(0, 5)}/${numeros.slice(5)}`;
}

function validarCpf(cpf)
{
    const valor = somenteDigitos(cpf);
    if (valor.length !== 11 || /(\d)\1{10}/.test(valor)) return false;

    let soma = 0;
    let peso = 10;
    for (let i = 0; i < 9; i += 1) soma += Number(valor[i]) * peso--;
    let digito1 = 11 - (soma % 11);
    if (digito1 >= 10) digito1 = 0;

    soma = 0;
    peso = 11;
    for (let i = 0; i < 10; i += 1) soma += Number(valor[i]) * peso--;
    let digito2 = 11 - (soma % 11);
    if (digito2 >= 10) digito2 = 0;

    return digito1 === Number(valor[9]) && digito2 === Number(valor[10]);
}

function showToast(tipo, mensagem)
{
    const toast = el("mensagem-feedback");
    if (!toast) return;

    toast.className = `popup-msg ${tipo}`;
    toast.textContent = mensagem;
    toast.classList.add("show");

    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() =>
    {
        toast.classList.remove("show");
    }, 3200);
}

function togglePainel(id, abrir)
{
    const painel = el(id);
    if (!painel) return;
    painel.hidden = !abrir;
}

function limparFormulario()
{
    const titulo = el("formTitulo");
    const btn = el("salvarBtn");

    el("funcionarioId").value = "";
    el("nome").value = "";
    el("categoria").value = "";
    el("cpf").value = "";
    el("ctps").value = "";
    el("telefone").value = "";
    if (el("username")) el("username").value = "";
    if (el("senhaUsuario")) el("senhaUsuario").value = "";

    if (titulo) titulo.textContent = "Cadastrar Novo Funcionário";
    if (btn) btn.innerHTML = '<span class="material-symbols-outlined">save</span>Salvar Funcionário';
}

function atualizarIndicadoresOrdenacao()
{
    document.querySelectorAll(".sortable").forEach((th) =>
    {
        const indicador = th.querySelector(".sort-indicator");
        const ativa = th.dataset.sortKey === ordenacaoAtual.chave;
        th.classList.toggle("is-active", ativa);
        if (indicador)
        {
            indicador.textContent = ativa ? (ordenacaoAtual.direcao === "asc" ? "^" : "v") : "";
        }
    });
}

function comparar(a, b, chave, direcao)
{
    const valorA = String(a[chave] || "").toLowerCase();
    const valorB = String(b[chave] || "").toLowerCase();

    if (valorA < valorB) return direcao === "asc" ? -1 : 1;
    if (valorA > valorB) return direcao === "asc" ? 1 : -1;
    return 0;
}

function classeCategoria(categoria)
{
    const valor = String(categoria || "").toLowerCase();
    if (valor === "coordenador") return "categoria-coordenador";
    if (valor === "cuidador") return "categoria-cuidador";
    return "categoria-secretaria";
}

async function parseJsonSegura(response)
{
    try
    {
        return await response.json();
    }
    catch (e)
    {
        return {};
    }
}

function renderizarTabela()
{
    const corpo = el("tabelaFuncionarios");
    if (!corpo) return;

    const filtroNome = padronizarTexto(el("filtroNome")?.value).toLowerCase();
    const filtroCategoria = el("filtroCategoria")?.value || "";
    const filtroCpf = somenteDigitos(el("filtroCpf")?.value || "");
    const filtroCtps = somenteDigitos(el("filtroCtps")?.value || "");

    const dados = funcionarios
        .filter((item) =>
        {
            const bateNome = !filtroNome || String(item.nome || "").toLowerCase().includes(filtroNome);
            const bateCategoria = !filtroCategoria || padronizarCategoriaValor(item.categoria) === filtroCategoria;
            const bateCpf = !filtroCpf || somenteDigitos(item.cpf).includes(filtroCpf);
            const bateCtps = !filtroCtps || somenteDigitos(item.ctps).includes(filtroCtps);
            return bateNome && bateCategoria && bateCpf && bateCtps;
        })
        .sort((a, b) => comparar(a, b, ordenacaoAtual.chave, ordenacaoAtual.direcao));

    atualizarIndicadoresOrdenacao();

    if (dados.length === 0)
    {
        corpo.innerHTML = '<tr><td colspan="6" class="empty-row">Nenhum funcionário encontrado.</td></tr>';
        return;
    }

    corpo.innerHTML = dados.map((funcionario) => `
    <tr>
      <td>${funcionario.nome || ""}</td>
      <td><span class="categoria-badge ${classeCategoria(funcionario.categoria)}">${formatarCargoInclusivo(funcionario.categoria) || ""}</span></td>
      <td>${formatarCpf(funcionario.cpf || "")}</td>
      <td>${formatarCtps(funcionario.ctps || "")}</td>
      <td>${formatarTelefone(funcionario.telefone || "")}</td>
      <td class="text-right">
        <div class="acoes">
          <button type="button" class="action-icon-btn edit" data-action="editar" data-id="${funcionario.idFuncionario}" title="Editar">
            <span class="material-symbols-outlined">edit</span>
          </button>
          <button type="button" class="action-icon-btn delete" data-action="deletar" data-id="${funcionario.idFuncionario}" title="Excluir">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

async function carregarFuncionarios()
{
    const corpo = el("tabelaFuncionarios");
    if (corpo)
    {
        corpo.innerHTML = '<tr><td colspan="6" class="empty-row">Carregando funcionários...</td></tr>';
    }

    try
    {
        const response = await fetch("/funcionario/listar");
        const body = await parseJsonSegura(response);

        if (!response.ok || !Array.isArray(body))
        {
            throw new Error("Falha ao carregar");
        }

        funcionarios = body;
        renderizarTabela();
    }
    catch (e)
    {
        if (corpo)
        {
            corpo.innerHTML = '<tr><td colspan="6" class="empty-row">Erro ao carregar os dados.</td></tr>';
        }
        showToast("error", "Não foi possível listar os funcionários.");
    }
}

async function salvarFuncionario(event)
{
    event.preventDefault();

    const id = el("funcionarioId")?.value || "";
    const nome = padronizarTexto(el("nome")?.value || "");
    const categoria = el("categoria")?.value || "";
    const cpf = formatarCpf(el("cpf")?.value || "");
    const ctps = formatarCtps(el("ctps")?.value || "");
    const telefone = formatarTelefone(el("telefone")?.value || "");
    const username = (el("username")?.value || "").trim();
    const senhaUsuario = el("senhaUsuario")?.value || "";

    if (!nome)
    {
        showToast("error", "Nome do funcionário é obrigatório.");
        el("nome")?.focus();
        return;
    }

    if (!/^[\p{L} ]+$/u.test(nome))
    {
        showToast("error", "Use apenas letras e espaços no nome.");
        el("nome")?.focus();
        return;
    }

    if (!categoria)
    {
        showToast("error", "Categoria do funcionário é obrigatória.");
        el("categoria")?.focus();
        return;
    }

    if (!validarCpf(cpf))
    {
        showToast("error", "CPF inválido.");
        el("cpf")?.focus();
        return;
    }

    const ctpsDigitos = somenteDigitos(ctps);
    if (ctpsDigitos.length < 9 || ctpsDigitos.length > 11)
    {
        showToast("error", "CTPS inválida. Informe entre 9 e 11 dígitos.");
        el("ctps")?.focus();
        return;
    }

    if (somenteDigitos(telefone).length < 10)
    {
        showToast("error", "Telefone inválido.");
        el("telefone")?.focus();
        return;
    }

    if (!id && !username)
    {
        showToast("error", "Usuário de acesso é obrigatório no cadastro.");
        el("username")?.focus();
        return;
    }

    if (!id && !senhaUsuario)
    {
        showToast("error", "Senha de acesso é obrigatória no cadastro.");
        el("senhaUsuario")?.focus();
        return;
    }

    const cpfPadronizado = somenteDigitos(cpf);
    const duplicado = funcionarios.some((item) =>
        String(item.idFuncionario) !== String(id) && somenteDigitos(item.cpf) === cpfPadronizado
    );

    if (duplicado)
    {
        showToast("error", "Já existe um funcionário com esse CPF.");
        el("cpf")?.focus();
        return;
    }

    try
    {
        const params = new URLSearchParams(
        {
            id,
            nome,
            cpf,
            ctps,
            telefone,
            categoria
        });
        let response;

        if (!id)
        {
            const createParams = new URLSearchParams(
            {
                nome,
                cpf,
                ctps,
                telefone,
                categoria,
                username,
                senha: senhaUsuario
            });
            response = await fetch(`/funcionario/cadastrar?${createParams.toString()}`,
            {
                method: "POST"
            });
        }
        else
        {
            response = await fetch(`/funcionario/${id}?${params.toString()}`,
            {
                method: "PUT"
            });
        }

        const body = await parseJsonSegura(response);
        if (!response.ok)
        {
            showToast("error", body.descricao || body.title || "Não foi possível salvar o funcionário.");
            return;
        }

        showToast("success", id ? "Funcionário atualizado com sucesso." : "Funcionário cadastrado com sucesso.");
        limparFormulario();
        togglePainel("cadastroFuncionario", false);
        await carregarFuncionarios();
    }
    catch (e)
    {
        showToast("error", "Servidor indisponível no momento.");
    }
}

function abrirParaEditar(id)
{
    const funcionario = funcionarios.find((item) => Number(item.idFuncionario) === Number(id));
    if (!funcionario)
    {
        showToast("error", "Funcionário não encontrado.");
        return;
    }

    el("funcionarioId").value = funcionario.idFuncionario;
    el("nome").value = funcionario.nome || "";
    el("categoria").value = padronizarCategoriaValor(funcionario.categoria || "");
    el("cpf").value = formatarCpf(funcionario.cpf || "");
    el("ctps").value = formatarCtps(funcionario.ctps || "");
    el("telefone").value = formatarTelefone(funcionario.telefone || "");
    if (el("username")) el("username").value = "";
    if (el("senhaUsuario")) el("senhaUsuario").value = "";
    el("formTitulo").textContent = "Editar Funcionário";
    el("salvarBtn").innerHTML = '<span class="material-symbols-outlined">save</span>Salvar Alteração';
    togglePainel("cadastroFuncionario", true);
    el("nome").focus();
}

function solicitarExclusao(id)
{
    const funcionario = funcionarios.find((item) => Number(item.idFuncionario) === Number(id));
    if (!funcionario)
    {
        showToast("error", "Funcionário não encontrado.");
        return;
    }

    funcionarioPendenteExclusao = funcionario;
    el("textoConfirmacao").textContent = `Deseja realmente excluir "${funcionario.nome}"?`;
    el("painelConfirmacao").classList.add("show");
}

async function confirmarExclusao()
{
    if (!funcionarioPendenteExclusao) return;

    const id = funcionarioPendenteExclusao.idFuncionario;
    try
    {
        const response = await fetch(`/funcionario/${id}?id=${id}`,
        {
            method: "DELETE"
        });
        const body = await parseJsonSegura(response);

        if (!response.ok)
        {
            showToast("error", body.descricao || body.title || "Não foi possível excluir.");
            return;
        }

        el("painelConfirmacao").classList.remove("show");
        funcionarioPendenteExclusao = null;
        showToast("success", "Funcionário excluído com sucesso.");
        await carregarFuncionarios();
    }
    catch (e)
    {
        showToast("error", "Servidor indisponível no momento.");
    }
}

function configurarEventos()
{
    el("funcionarioForm")?.addEventListener("submit", salvarFuncionario);

    el("abrirCadastroFuncionario")?.addEventListener("click", () =>
    {
        limparFormulario();
        togglePainel("cadastroFuncionario", true);
    });
    el("fecharCadastroFuncionario")?.addEventListener("click", () => togglePainel("cadastroFuncionario", false));

    el("abrirFiltrosFuncionario")?.addEventListener("click", () => togglePainel("filtroFuncionario", true));
    el("fecharFiltrosFuncionario")?.addEventListener("click", () => togglePainel("filtroFuncionario", false));

    el("filtroNome")?.addEventListener("input", renderizarTabela);
    el("filtroCategoria")?.addEventListener("change", renderizarTabela);
    el("filtroCpf")?.addEventListener("input", (event) =>
    {
        event.target.value = formatarCpf(event.target.value);
        renderizarTabela();
    });
    el("filtroCtps")?.addEventListener("input", (event) =>
    {
        event.target.value = formatarCtps(event.target.value);
        renderizarTabela();
    });
    el("limparFiltros")?.addEventListener("click", () =>
    {
        el("filtroNome").value = "";
        el("filtroCategoria").value = "";
        el("filtroCpf").value = "";
        el("filtroCtps").value = "";
        renderizarTabela();
    });

    el("cpf")?.addEventListener("input", (event) =>
    {
        event.target.value = formatarCpf(event.target.value);
    });
    el("ctps")?.addEventListener("input", (event) =>
    {
        event.target.value = formatarCtps(event.target.value);
    });
    el("telefone")?.addEventListener("input", (event) =>
    {
        event.target.value = formatarTelefone(event.target.value);
    });

    el("tabelaFuncionarios")?.addEventListener("click", (event) =>
    {
        const botao = event.target.closest("button[data-action]");
        if (!botao) return;
        const id = botao.dataset.id;
        if (botao.dataset.action === "editar") abrirParaEditar(id);
        if (botao.dataset.action === "deletar") solicitarExclusao(id);
    });

    document.querySelectorAll(".sortable").forEach((th) =>
    {
        th.addEventListener("click", () =>
        {
            const chave = th.dataset.sortKey;
            if (!chave) return;
            if (ordenacaoAtual.chave === chave)
            {
                ordenacaoAtual.direcao = ordenacaoAtual.direcao === "asc" ? "desc" : "asc";
            }
            else
            {
                ordenacaoAtual.chave = chave;
                ordenacaoAtual.direcao = "asc";
            }
            renderizarTabela();
        });
    });

    el("confirmarExclusao")?.addEventListener("click", confirmarExclusao);
    el("cancelarExclusao")?.addEventListener("click", () =>
    {
        el("painelConfirmacao").classList.remove("show");
        funcionarioPendenteExclusao = null;
    });
}

document.addEventListener("DOMContentLoaded", carregarContextoUrl);
document.addEventListener("DOMContentLoaded", configurarEventos);
document.addEventListener("DOMContentLoaded", preencherPerfilTopo);
document.addEventListener("DOMContentLoaded", ajustarMenuPorPerfil);
