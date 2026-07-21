let moradoresNutri = [];
let moradorSelecionado = null;
let prontuarioAtual = null;

async function inicializarNutricao() {
    await carregarSessaoNutricionista();
    await carregarMoradoresNutri();
}

async function carregarSessaoNutricionista() {
    const resposta = await fetch("/login/sessao");
    if (!resposta.ok) {
        window.location.href = "login.html";
        return;
    }

    const sessao = await resposta.json();
    const categoria = normalizarTexto(sessao.categoria);
    if (categoria !== "nutricionista") {
        window.location.href = "negado.html";
        return;
    }

    document.getElementById("perfilNome").textContent = sessao.funcionarioNome || sessao.usuarioNome || "Nutricionista";
    document.getElementById("perfilCargo").textContent = "NUTRICIONISTA";
}

async function carregarMoradoresNutri() {
    try {
        const resposta = await fetch("/nutricao/moradores");
        if (!resposta.ok) throw new Error("Nao foi possivel carregar moradores.");
        moradoresNutri = await resposta.json();
        renderizarMoradoresNutri();
        if (moradoresNutri.length > 0) {
            await selecionarMoradorNutri(moradoresNutri[0].idMorador);
        }
    } catch (erro) {
        mostrarMensagem(erro.message, "error");
    }
}

function renderizarMoradoresNutri() {
    const lista = document.getElementById("listaMoradoresNutri");
    if (!moradoresNutri.length) {
        lista.innerHTML = `<div class="nutri-empty">Nenhum morador ativo encontrado.</div>`;
        return;
    }

    lista.innerHTML = moradoresNutri.map((morador) => `
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
        if (!resposta.ok) throw new Error("Nao foi possivel carregar o prontuario.");
        const dados = await resposta.json();
        moradorSelecionado = dados.morador;
        prontuarioAtual = dados.prontuario;
        renderizarMoradoresNutri();
        renderizarPainelNutricional(dados);
    } catch (erro) {
        mostrarMensagem(erro.message, "error");
    }
}

function renderizarPainelNutricional(dados) {
    const painel = document.getElementById("painelNutricional");
    if (!dados.prontuario) {
        painel.innerHTML = htmlNovoProntuario(dados.morador);
        alternarMetodoInicial();
        return;
    }

    painel.innerHTML = htmlProntuario(dados.prontuario, dados.evolucoes || []);
}

function htmlNovoProntuario(morador) {
    return `
        <div class="nutri-card__header" style="padding:0 0 18px;border-bottom:none;">
            <h3>${escapar(morador.nome)}</h3>
            <p>${formatarGenero(morador.genero)} | ${morador.idade || "-"} anos | Prontuario ainda nao iniciado.</p>
        </div>

        <form class="nutri-form-grid" onsubmit="salvarProntuarioNutri(event)">
            <div class="nutri-field">
                <label>Metodo de medicao</label>
                <select id="metodoMedicao" onchange="alternarMetodoInicial()">
                    <option value="ESTIMADO">Estimado por formula</option>
                    <option value="AFERIDO">Aferido diretamente</option>
                    <option value="MANUAL_REVISADO">Manual revisado</option>
                </select>
            </div>
            <div class="nutri-field">
                <label>Morador acamado?</label>
                <select id="acamado">
                    <option value="false">Nao</option>
                    <option value="true">Sim</option>
                </select>
            </div>

            <div class="nutri-field campo-estimado">
                <label>Grupo da formula</label>
                <select id="grupoEquacao">
                    <option value="BRANCA">Branca</option>
                    <option value="NEGRA">Negra</option>
                </select>
            </div>
            <div class="nutri-field campo-estimado">
                <label>Altura do joelho (cm)</label>
                <input id="alturaJoelhoCm" inputmode="decimal" placeholder="Ex: 48,5" />
            </div>
            <div class="nutri-field campo-estimado">
                <label>Circunferencia do braco (cm)</label>
                <input id="circunferenciaBracoCm" inputmode="decimal" placeholder="Ex: 29,0" />
            </div>
            <div class="nutri-field campo-estimado">
                <label>Previa calculada</label>
                <button type="button" class="nutri-secondary" onclick="calcularPreviaNutri()">Calcular estimativa</button>
                <p id="previaEstimativa" style="margin-top:10px;color:#64748b;font-weight:700;"></p>
            </div>

            <div class="nutri-field campo-manual" style="display:none;">
                <label>Peso (kg)</label>
                <input id="pesoKg" inputmode="decimal" placeholder="Ex: 68,4" />
            </div>
            <div class="nutri-field campo-manual" style="display:none;">
                <label>Altura (cm)</label>
                <input id="alturaCm" inputmode="decimal" placeholder="Ex: 162" />
            </div>
            <div class="nutri-field full">
                <label>Diagnostico inicial</label>
                <textarea id="diagnosticoInicial" placeholder="Registre o diagnostico nutricional inicial..."></textarea>
            </div>
            <div class="nutri-actions full">
                <button type="submit" class="primary-action">
                    <span class="material-symbols-outlined">save</span>
                    Salvar prontuario
                </button>
            </div>
        </form>
    `;
}

function htmlProntuario(prontuario, evolucoes) {
    return `
        <div class="nutri-card__header" style="padding:0 0 18px;border-bottom:none;">
            <h3>${escapar(prontuario.morador?.nome || "Morador")}</h3>
            <p>Prontuario criado em ${formatarDataHora(prontuario.criadoEm)} por ${escapar(prontuario.nutricionista?.nome || "Nutricionista")}.</p>
        </div>

        <div class="nutri-resumo">
            <div class="nutri-metric"><span>Peso</span><strong>${formatarNumero(prontuario.pesoKg)} kg</strong></div>
            <div class="nutri-metric"><span>Altura</span><strong>${formatarNumero(prontuario.alturaCm)} cm</strong></div>
            <div class="nutri-metric"><span>IMC</span><strong>${formatarNumero(prontuario.imc)}</strong></div>
            <div class="nutri-metric"><span>Metodo</span><strong>${formatarMetodo(prontuario.metodoMedicao)}</strong></div>
        </div>

        <div class="nutri-history-item">
            <header><strong>Diagnostico inicial</strong><span>${prontuario.pesoEstimado ? "Medidas estimadas" : "Medidas aferidas"}</span></header>
            <p>${escapar(prontuario.diagnosticoInicial || "-")}</p>
            ${prontuario.formulaPeso ? `<p style="margin-top:10px;color:#64748b;font-size:13px;"><strong>Formula peso:</strong> ${escapar(prontuario.formulaPeso)}<br><strong>Formula altura:</strong> ${escapar(prontuario.formulaAltura || "")}</p>` : ""}
        </div>

        <form class="nutri-form-grid" onsubmit="salvarEvolucaoNutri(event)">
            <div class="nutri-field full">
                <label>Nova evolucao</label>
                <textarea id="textoEvolucao" placeholder="Descreva a evolucao clinica nutricional..."></textarea>
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
                <label>Metodo</label>
                <select id="metodoEvolucao">
                    <option value="">Nao atualizar medidas</option>
                    <option value="AFERIDO">Aferido diretamente</option>
                    <option value="ESTIMADO">Estimado</option>
                    <option value="MANUAL_REVISADO">Manual revisado</option>
                </select>
            </div>
            <div class="nutri-field">
                <label>Observacoes</label>
                <input id="observacoesEvolucao" placeholder="Opcional" />
            </div>
            <div class="nutri-actions full">
                <button type="submit" class="primary-action">
                    <span class="material-symbols-outlined">add_notes</span>
                    Registrar evolucao
                </button>
            </div>
        </form>

        <div>
            <div class="nutri-card__header" style="padding:0 0 14px;border-bottom:none;">
                <h3>Evolucoes registradas</h3>
                <p>Historico imutavel para acompanhamento clinico.</p>
            </div>
            <div class="nutri-history">
                ${evolucoes.length ? evolucoes.map(htmlEvolucao).join("") : `<div class="nutri-empty">Nenhuma evolucao registrada ainda.</div>`}
            </div>
        </div>
    `;
}

function htmlEvolucao(evolucao) {
    return `
        <article class="nutri-history-item">
            <header>
                <strong>${escapar(evolucao.nutricionista?.nome || "Nutricionista")}</strong>
                <span>${formatarDataHora(evolucao.criadoEm)}</span>
            </header>
            <p>${escapar(evolucao.evolucao || "-")}</p>
            <p style="margin-top:10px;color:#64748b;font-size:13px;">
                ${evolucao.pesoKg ? `<strong>Peso:</strong> ${formatarNumero(evolucao.pesoKg)} kg ` : ""}
                ${evolucao.alturaCm ? `<strong>Altura:</strong> ${formatarNumero(evolucao.alturaCm)} cm ` : ""}
                ${evolucao.imc ? `<strong>IMC:</strong> ${formatarNumero(evolucao.imc)}` : ""}
            </p>
            ${evolucao.observacoes ? `<p style="margin-top:8px;color:#64748b;">${escapar(evolucao.observacoes)}</p>` : ""}
        </article>
    `;
}

function alternarMetodoInicial() {
    const metodo = document.getElementById("metodoMedicao")?.value;
    document.querySelectorAll(".campo-estimado").forEach((campo) => campo.style.display = metodo === "ESTIMADO" ? "" : "none");
    document.querySelectorAll(".campo-manual").forEach((campo) => campo.style.display = metodo === "ESTIMADO" ? "none" : "");
}

async function calcularPreviaNutri() {
    if (!moradorSelecionado) return;
    try {
        const resposta = await fetch("/nutricao/estimativa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idade: moradorSelecionado.idade,
                genero: moradorSelecionado.genero,
                grupoEquacao: valor("grupoEquacao"),
                alturaJoelhoCm: valor("alturaJoelhoCm"),
                circunferenciaBracoCm: valor("circunferenciaBracoCm")
            })
        });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(mensagemErro(dados));
        document.getElementById("previaEstimativa").textContent =
            `Peso ${formatarNumero(dados.pesoKg)} kg | Altura ${formatarNumero(dados.alturaCm)} cm | IMC ${formatarNumero(dados.imc)}`;
    } catch (erro) {
        mostrarMensagem(erro.message, "error");
    }
}

async function salvarProntuarioNutri(event) {
    event.preventDefault();
    if (!moradorSelecionado) return;

    try {
        const resposta = await fetch("/nutricao/prontuario", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idMorador: moradorSelecionado.idMorador,
                acamado: valor("acamado") === "true",
                metodoMedicao: valor("metodoMedicao"),
                grupoEquacao: valor("grupoEquacao"),
                alturaJoelhoCm: valor("alturaJoelhoCm"),
                circunferenciaBracoCm: valor("circunferenciaBracoCm"),
                pesoKg: valor("pesoKg"),
                alturaCm: valor("alturaCm"),
                diagnosticoInicial: valor("diagnosticoInicial")
            })
        });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(mensagemErro(dados));
        mostrarMensagem("Prontuario nutricional salvo.", "success");
        await selecionarMoradorNutri(moradorSelecionado.idMorador);
    } catch (erro) {
        mostrarMensagem(erro.message, "error");
    }
}

async function salvarEvolucaoNutri(event) {
    event.preventDefault();
    if (!prontuarioAtual) return;

    try {
        const resposta = await fetch("/nutricao/evolucao", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idProntuario: prontuarioAtual.idProntuario,
                evolucao: valor("textoEvolucao"),
                pesoKg: valor("pesoEvolucao"),
                alturaCm: valor("alturaEvolucao"),
                metodoMedicao: valor("metodoEvolucao"),
                observacoes: valor("observacoesEvolucao")
            })
        });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(mensagemErro(dados));
        mostrarMensagem("Evolucao registrada.", "success");
        await selecionarMoradorNutri(moradorSelecionado.idMorador);
    } catch (erro) {
        mostrarMensagem(erro.message, "error");
    }
}

function valor(id) {
    return document.getElementById(id)?.value?.trim() || "";
}

function mensagemErro(dados) {
    return dados?.mensagem || dados?.message || dados?.descricao || "Nao foi possivel concluir a operacao.";
}

function mostrarMensagem(texto, tipo) {
    const popup = document.getElementById("mensagem-feedback");
    popup.textContent = texto;
    popup.className = `popup-msg show ${tipo}`;
    window.clearTimeout(mostrarMensagem.timer);
    mostrarMensagem.timer = window.setTimeout(() => popup.className = "popup-msg", 3600);
}

function formatarGenero(genero) {
    const valor = normalizarTexto(genero);
    if (valor.startsWith("f")) return "Feminino";
    if (valor.startsWith("m")) return "Masculino";
    return "Genero nao informado";
}

function formatarMetodo(metodo) {
    if (metodo === "ESTIMADO") return "Estimado";
    if (metodo === "AFERIDO") return "Aferido";
    if (metodo === "MANUAL_REVISADO") return "Revisado";
    return "-";
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
