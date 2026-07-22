let moradoresNutri = [];
let moradorSelecionado = null;
let prontuarioAtual = null;
let evolucoesAtuais = [];
let editandoProntuario = false;
let idEvolucaoEmEdicao = null;
let acaoConfirmada = null;

async function inicializarNutricao() {
    await carregarSessaoNutricionista();
    await carregarMoradoresNutri();
    document.getElementById("buscaMoradorNutri")?.addEventListener("input", renderizarMoradoresNutri);
}

async function carregarSessaoNutricionista() {
    const resposta = await fetch("/login/sessao");
    if (!resposta.ok) {
        window.location.href = "login.html";
        return;
    }

    const sessao = await resposta.json();
    if (normalizarTexto(sessao.categoria) !== "nutricionista") {
        window.location.href = "negado.html";
        return;
    }

    document.getElementById("perfilNome").textContent = sessao.funcionarioNome || sessao.usuarioNome || "Nutricionista";
    document.getElementById("perfilCargo").textContent = "NUTRICIONISTA";
}

async function carregarMoradoresNutri() {
    try {
        const resposta = await fetch("/nutricao/moradores");
        if (!resposta.ok) throw new Error("Não foi possível carregar os moradores.");
        moradoresNutri = await resposta.json();
        renderizarMoradoresNutri();
    } catch (erro) {
        mostrarMensagem(erro.message, "error");
    }
}

function renderizarMoradoresNutri() {
    const lista = document.getElementById("listaMoradoresNutri");
    const busca = normalizarTexto(document.getElementById("buscaMoradorNutri")?.value);
    const moradoresFiltrados = moradoresNutri.filter((morador) => normalizarTexto(morador.nome).includes(busca));
    if (!moradoresFiltrados.length) {
        lista.innerHTML = `<div class="nutri-empty">Nenhum morador ativo encontrado.</div>`;
        return;
    }

    lista.innerHTML = moradoresFiltrados.map((morador) => `
        <button type="button" class="morador-nutri-item ${moradorSelecionado?.idMorador === morador.idMorador ? "active" : ""}"
                onclick="selecionarMoradorNutri(${morador.idMorador})">
            <strong>${escapar(morador.nome)}</strong>
            <span>${formatarGenero(morador.genero)} | ${morador.idade || "-"} anos</span>
        </button>
    `).join("");
}

async function selecionarMoradorNutri(idMorador) {
    try {
        const resposta = await fetch(`/nutricao/prontuario/${idMorador}`);
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(mensagemErro(dados));
        moradorSelecionado = dados.morador;
        prontuarioAtual = dados.prontuario;
        evolucoesAtuais = dados.evolucoes || [];
        editandoProntuario = false;
        idEvolucaoEmEdicao = null;
        document.getElementById("seletorMoradorNutri").hidden = true;
        document.querySelector(".nutri-grid")?.classList.add("resident-selected");
        renderizarMoradoresNutri();
        renderizarPainelNutricional();
    } catch (erro) {
        mostrarMensagem(erro.message, "error");
    }
}

function renderizarPainelNutricional() {
    const painel = document.getElementById("painelNutricional");
    if (!prontuarioAtual) {
        painel.innerHTML = htmlNovoProntuario(moradorSelecionado);
        atualizarImcDiretoNutri();
        return;
    }
    painel.innerHTML = editandoProntuario
        ? htmlEditarProntuario(prontuarioAtual)
        : htmlProntuario(prontuarioAtual, evolucoesAtuais);
}

function htmlNovoProntuario(morador) {
    return `
        <div class="nutri-card__header nutri-title-row nutri-panel-heading">
          <div>
            <h3>${escapar(morador.nome)}</h3>
            <p>${formatarGenero(morador.genero)} | ${morador.idade || "-"} anos | Prontuário ainda não iniciado.</p>
          </div>
          <button type="button" class="nutri-secondary" onclick="trocarMoradorNutri()">Trocar morador</button>
        </div>
        ${htmlFormularioProntuario("salvarProntuarioNutri(event)", "Salvar prontuário")}
    `;
}

function htmlEditarProntuario(prontuario) {
    return `
        <div class="nutri-card__header nutri-title-row nutri-panel-heading">
            <div>
                <h3>Editar prontuário</h3>
                <p>${escapar(prontuario.morador?.nome || "Morador")}</p>
            </div>
            <button type="button" class="nutri-secondary" onclick="cancelarEdicaoProntuario()">Cancelar edição</button>
        </div>
        ${htmlFormularioProntuario(
            "atualizarProntuarioNutri(event)",
            "Salvar alterações",
            prontuario.pesoKg,
            prontuario.alturaCm,
            prontuario.diagnosticoInicial
        )}
    `;
}

function htmlFormularioProntuario(acao, textoBotao, peso = "", altura = "", diagnostico = "") {
    return `
        <form class="nutri-form-grid" onsubmit="${acao}">
            <div class="nutri-field">
                <label>Peso (kg)</label>
                <input id="pesoKg" inputmode="decimal" value="${escapar(valorFormulario(peso))}" placeholder="Ex: 68,4" oninput="atualizarImcDiretoNutri()" />
            </div>
            <div class="nutri-field">
                <label>Altura (cm)</label>
                <input id="alturaCm" inputmode="decimal" value="${escapar(valorFormulario(altura))}" placeholder="Ex: 162" oninput="atualizarImcDiretoNutri()" />
            </div>
            <div id="resultadoImcNutri" class="nutri-imc-preview full" hidden></div>
            <div class="nutri-field full">
                <label>Diagnóstico inicial</label>
                <textarea id="diagnosticoInicial" placeholder="Registre o diagnóstico nutricional inicial...">${escapar(diagnostico || "")}</textarea>
            </div>
            <div class="nutri-actions full">
                <button type="submit" class="nutri-primary">
                    <span class="material-symbols-outlined">save</span>
                    ${textoBotao}
                </button>
            </div>
        </form>
    `;
}

function htmlProntuario(prontuario, evolucoes) {
    return `
        <div class="nutri-card__header nutri-title-row nutri-panel-heading">
            <div>
                <h3>${escapar(prontuario.morador?.nome || "Morador")}</h3>
                <p>Prontuário criado em ${formatarDataHora(prontuario.criadoEm)} por ${escapar(prontuario.nutricionista?.nome || "Nutricionista")}.</p>
            </div>
            <div class="nutri-record-actions">
                <button type="button" class="nutri-icon-action" onclick="iniciarEdicaoProntuario()" title="Editar prontuário" aria-label="Editar prontuário">
                    <span class="material-symbols-outlined">edit</span>
                </button>
                <button type="button" class="nutri-icon-action danger" onclick="confirmarExclusaoProntuario()" title="Excluir prontuário" aria-label="Excluir prontuário">
                    <span class="material-symbols-outlined">delete</span>
                </button>
                <button type="button" class="nutri-secondary" onclick="trocarMoradorNutri()">Trocar morador</button>
            </div>
        </div>

        <div class="nutri-resumo">
            <div class="nutri-metric"><span>Peso</span><strong>${formatarNumero(prontuario.pesoKg)} kg</strong></div>
            <div class="nutri-metric"><span>Altura</span><strong>${formatarNumero(prontuario.alturaCm)} cm</strong></div>
            <div class="nutri-metric"><span>IMC</span><strong>${formatarNumero(prontuario.imc)}</strong></div>
        </div>

        <div class="nutri-history-item">
            <header><strong>Diagnóstico inicial</strong><span>Medidas aferidas</span></header>
            <p>${escapar(prontuario.diagnosticoInicial || "-")}</p>
        </div>

        ${htmlFormularioEvolucao()}

        <div>
            <div class="nutri-card__header nutri-history-heading">
                <h3>Evoluções registradas</h3>
                <p>Acompanhe, edite ou remova os registros clínicos nutricionais.</p>
            </div>
            <div class="nutri-history">
                ${evolucoes.length ? evolucoes.map(htmlEvolucao).join("") : `<div class="nutri-empty">Nenhuma evolução registrada ainda.</div>`}
            </div>
        </div>
    `;
}

function htmlFormularioEvolucao() {
    return `
        <form id="formEvolucaoNutri" class="nutri-form-grid" onsubmit="salvarEvolucaoNutri(event)">
            <div class="nutri-form-heading full">
                <div>
                    <h3 id="tituloFormularioEvolucao">Nova evolução</h3>
                    <p id="subtituloFormularioEvolucao">Registre o acompanhamento nutricional do morador.</p>
                </div>
                <button id="cancelarEdicaoEvolucao" type="button" class="nutri-secondary" onclick="cancelarEdicaoEvolucao()" hidden>Cancelar edição</button>
            </div>
            <div class="nutri-field full">
                <label>Evolução clínica</label>
                <textarea id="textoEvolucao" placeholder="Descreva a evolução clínica nutricional..."></textarea>
            </div>
            <div class="nutri-field">
                <label>Peso atualizado (opcional)</label>
                <input id="pesoEvolucao" inputmode="decimal" placeholder="Ex: 67,8" />
            </div>
            <div class="nutri-field">
                <label>Altura atualizada (opcional)</label>
                <input id="alturaEvolucao" inputmode="decimal" placeholder="Ex: 162" />
            </div>
            <div class="nutri-field">
                <label>Método</label>
                <select id="metodoEvolucao">
                    <option value="">Não atualizar medidas</option>
                    <option value="AFERIDO">Aferido diretamente</option>
                    <option value="ESTIMADO">Estimado</option>
                    <option value="MANUAL_REVISADO">Manual revisado</option>
                </select>
            </div>
            <div class="nutri-field">
                <label>Observações</label>
                <input id="observacoesEvolucao" placeholder="Opcional" />
            </div>
            <div class="nutri-actions full">
                <button type="submit" class="nutri-primary">
                    <span class="material-symbols-outlined">add_notes</span>
                    <span id="textoBotaoEvolucao">Registrar evolução</span>
                </button>
            </div>
        </form>
    `;
}

function htmlEvolucao(evolucao) {
    return `
        <article class="nutri-history-item">
            <header>
                <div>
                    <strong>${escapar(evolucao.nutricionista?.nome || "Nutricionista")}</strong>
                    <span>${formatarDataHora(evolucao.criadoEm)}</span>
                </div>
                <div class="nutri-history-actions">
                    <button type="button" class="nutri-icon-action" onclick="editarEvolucaoNutri(${evolucao.idEvolucao})" title="Editar evolução" aria-label="Editar evolução">
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button type="button" class="nutri-icon-action danger" onclick="confirmarExclusaoEvolucao(${evolucao.idEvolucao})" title="Excluir evolução" aria-label="Excluir evolução">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </header>
            <p>${escapar(evolucao.evolucao || "-")}</p>
            ${(evolucao.pesoKg || evolucao.alturaCm || evolucao.imc) ? `
                <p class="nutri-measures">
                    ${evolucao.pesoKg ? `<strong>Peso:</strong> ${formatarNumero(evolucao.pesoKg)} kg ` : ""}
                    ${evolucao.alturaCm ? `<strong>Altura:</strong> ${formatarNumero(evolucao.alturaCm)} cm ` : ""}
                    ${evolucao.imc ? `<strong>IMC:</strong> ${formatarNumero(evolucao.imc)}` : ""}
                </p>` : ""}
            ${evolucao.observacoes ? `<p class="nutri-observations">${escapar(evolucao.observacoes)}</p>` : ""}
        </article>
    `;
}

function trocarMoradorNutri() {
    moradorSelecionado = null;
    prontuarioAtual = null;
    evolucoesAtuais = [];
    editandoProntuario = false;
    idEvolucaoEmEdicao = null;
    document.getElementById("seletorMoradorNutri").hidden = false;
    document.querySelector(".nutri-grid")?.classList.remove("resident-selected");
    document.getElementById("painelNutricional").innerHTML = `<div class="nutri-empty">Selecione um morador para iniciar.</div>`;
    document.getElementById("buscaMoradorNutri")?.focus();
    renderizarMoradoresNutri();
}

function iniciarEdicaoProntuario() {
    editandoProntuario = true;
    renderizarPainelNutricional();
    atualizarImcDiretoNutri();
}

function cancelarEdicaoProntuario() {
    editandoProntuario = false;
    renderizarPainelNutricional();
}

function atualizarImcDiretoNutri() {
    const peso = numeroCampo("pesoKg");
    const alturaCm = numeroCampo("alturaCm");
    const resultado = document.getElementById("resultadoImcNutri");
    if (!resultado) return;
    if (peso > 0 && alturaCm > 0) {
        resultado.textContent = `IMC calculado: ${formatarNumero(peso / Math.pow(alturaCm / 100, 2))}`;
        resultado.hidden = false;
    } else {
        resultado.hidden = true;
    }
}

async function salvarProntuarioNutri(event) {
    event.preventDefault();
    if (!moradorSelecionado) return;

    await executarRequisicaoNutri("/nutricao/prontuario", "POST", {
        idMorador: moradorSelecionado.idMorador,
        acamado: false,
        metodoMedicao: "AFERIDO",
        grupoEquacao: null,
        alturaJoelhoCm: null,
        circunferenciaBracoCm: null,
        pesoKg: valor("pesoKg"),
        alturaCm: valor("alturaCm"),
        diagnosticoInicial: valor("diagnosticoInicial")
    }, "Prontuário nutricional salvo.");
}

async function atualizarProntuarioNutri(event) {
    event.preventDefault();
    if (!prontuarioAtual) return;

    await executarRequisicaoNutri(`/nutricao/prontuario/${prontuarioAtual.idProntuario}`, "PUT", {
        pesoKg: valor("pesoKg"),
        alturaCm: valor("alturaCm"),
        diagnosticoInicial: valor("diagnosticoInicial")
    }, "Prontuário nutricional atualizado.");
}

function confirmarExclusaoProntuario() {
    abrirConfirmacao(
        "Excluir prontuário",
        "O prontuário e todas as evoluções vinculadas serão removidos. Esta ação não pode ser desfeita.",
        excluirProntuarioNutri
    );
}

async function excluirProntuarioNutri() {
    if (!prontuarioAtual) return;
    try {
        const resposta = await fetch(`/nutricao/prontuario/${prontuarioAtual.idProntuario}`, { method: "DELETE" });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(mensagemErro(dados));
        fecharConfirmacao();
        mostrarMensagem("Prontuário nutricional excluído.", "success");
        await selecionarMoradorNutri(moradorSelecionado.idMorador);
    } catch (erro) {
        fecharConfirmacao();
        mostrarMensagem(erro.message, "error");
    }
}

function editarEvolucaoNutri(idEvolucao) {
    const evolucao = evolucoesAtuais.find((item) => item.idEvolucao === idEvolucao);
    if (!evolucao) return;
    idEvolucaoEmEdicao = idEvolucao;
    document.getElementById("tituloFormularioEvolucao").textContent = "Editar evolução";
    document.getElementById("subtituloFormularioEvolucao").textContent = "Atualize os dados deste acompanhamento nutricional.";
    document.getElementById("textoBotaoEvolucao").textContent = "Salvar alterações";
    document.getElementById("cancelarEdicaoEvolucao").hidden = false;
    document.getElementById("textoEvolucao").value = evolucao.evolucao || "";
    document.getElementById("pesoEvolucao").value = valorFormulario(evolucao.pesoKg);
    document.getElementById("alturaEvolucao").value = valorFormulario(evolucao.alturaCm);
    document.getElementById("metodoEvolucao").value = evolucao.metodoMedicao || "";
    document.getElementById("observacoesEvolucao").value = evolucao.observacoes || "";
    document.getElementById("formEvolucaoNutri").scrollIntoView({ behavior: "smooth", block: "center" });
}

function cancelarEdicaoEvolucao() {
    idEvolucaoEmEdicao = null;
    const formulario = document.getElementById("formEvolucaoNutri");
    formulario?.reset();
    document.getElementById("tituloFormularioEvolucao").textContent = "Nova evolução";
    document.getElementById("subtituloFormularioEvolucao").textContent = "Registre o acompanhamento nutricional do morador.";
    document.getElementById("textoBotaoEvolucao").textContent = "Registrar evolução";
    document.getElementById("cancelarEdicaoEvolucao").hidden = true;
}

async function salvarEvolucaoNutri(event) {
    event.preventDefault();
    if (!prontuarioAtual) return;

    const corpo = {
        idProntuario: prontuarioAtual.idProntuario,
        evolucao: valor("textoEvolucao"),
        pesoKg: valor("pesoEvolucao"),
        alturaCm: valor("alturaEvolucao"),
        metodoMedicao: valor("metodoEvolucao"),
        observacoes: valor("observacoesEvolucao")
    };
    const editando = idEvolucaoEmEdicao !== null;
    const url = editando ? `/nutricao/evolucao/${idEvolucaoEmEdicao}` : "/nutricao/evolucao";
    await executarRequisicaoNutri(url, editando ? "PUT" : "POST", corpo,
        editando ? "Evolução atualizada." : "Evolução registrada.");
}

function confirmarExclusaoEvolucao(idEvolucao) {
    abrirConfirmacao(
        "Excluir evolução",
        "Este registro de evolução será removido permanentemente.",
        () => excluirEvolucaoNutri(idEvolucao)
    );
}

async function excluirEvolucaoNutri(idEvolucao) {
    try {
        const resposta = await fetch(`/nutricao/evolucao/${idEvolucao}`, { method: "DELETE" });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(mensagemErro(dados));
        fecharConfirmacao();
        mostrarMensagem("Evolução nutricional excluída.", "success");
        await selecionarMoradorNutri(moradorSelecionado.idMorador);
    } catch (erro) {
        fecharConfirmacao();
        mostrarMensagem(erro.message, "error");
    }
}

async function executarRequisicaoNutri(url, metodo, corpo, sucesso) {
    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(corpo)
        });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(mensagemErro(dados));
        mostrarMensagem(sucesso, "success");
        await selecionarMoradorNutri(moradorSelecionado.idMorador);
    } catch (erro) {
        mostrarMensagem(erro.message, "error");
    }
}

function abrirConfirmacao(titulo, mensagem, acao) {
    acaoConfirmada = acao;
    document.getElementById("tituloConfirmacaoNutri").textContent = titulo;
    document.getElementById("textoConfirmacaoNutri").textContent = mensagem;
    document.getElementById("confirmacaoNutri").classList.add("show");
}

function fecharConfirmacao() {
    acaoConfirmada = null;
    document.getElementById("confirmacaoNutri").classList.remove("show");
}

function executarConfirmacao() {
    const acao = acaoConfirmada;
    if (acao) acao();
}

function valor(id) {
    return document.getElementById(id)?.value?.trim() || "";
}

function numeroCampo(id) {
    return Number(valor(id).replace(",", "."));
}

function valorFormulario(numero) {
    if (numero === null || numero === undefined || numero === "") return "";
    return String(numero).replace(".", ",");
}

function mensagemErro(dados) {
    return dados?.mensagem || dados?.message || dados?.descricao || "Não foi possível concluir a operação.";
}

function mostrarMensagem(texto, tipo) {
    const popup = document.getElementById("mensagem-feedback");
    popup.textContent = texto;
    popup.className = `popup-msg show ${tipo}`;
    window.clearTimeout(mostrarMensagem.timer);
    mostrarMensagem.timer = window.setTimeout(() => popup.className = "popup-msg", 3600);
}

function formatarGenero(genero) {
    const texto = normalizarTexto(genero);
    if (texto.startsWith("f")) return "Feminino";
    if (texto.startsWith("m")) return "Masculino";
    return "Gênero não informado";
}

function formatarNumero(numero) {
    if (numero === null || numero === undefined || numero === "") return "-";
    return Number(numero).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarDataHora(data) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function normalizarTexto(texto) {
    return String(texto || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function escapar(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
