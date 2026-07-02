let noticias = [];
let funcionario = null;

function parseJsonSeguro(response) {
    return response.json().catch(() => ({}));
}

async function carregarFuncionarioSessao() {
    const response = await fetch("/login/sessao");
    const data = await parseJsonSeguro(response);
    if (response.ok) {
        funcionario = data;
    }
}

function formatarCargoInclusivo(categoria) {
    const valor = String(categoria || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
    if (valor === "coordenador") return "Coordenador(a)";
    if (valor === "cuidador") return "Cuidador(a)";
    if (valor === "secretaria") return "Secretária(o)";
    return String(categoria || "").trim();
}

function preencherPerfilTopo() {
    const f = funcionario || {};
    const nome = String(f.nome || "Usuário").trim();
    const categoria = String(f.categoria || "").trim();
    let cargoTexto = "Acesso";
    if (categoria) cargoTexto = formatarCargoInclusivo(categoria);

    const nomeEl = document.getElementById("perfilNome");
    const cargoEl = document.getElementById("perfilCargo");
    if (nomeEl) nomeEl.textContent = nome;
    if (cargoEl) cargoEl.textContent = cargoTexto;
}

function exibirMensagem(mensagem, tipo = "info") {
    const div = document.getElementById("mensagem-feedback");
    if (div) {
        div.className = "popup-msg " + tipo + " show";
        div.textContent = mensagem;
        setTimeout(() => {
            div.classList.remove("show");
        }, 3000);
    }
}

function renderizarNoticias(lista = noticias) {
    const container = document.getElementById("listaNoticias");
    if (!container) return;

    if (!lista.length) {
        container.innerHTML = '<tr><td colspan="5" class="empty-text" style="text-align: center; padding: 2rem;">Nenhuma notícia publicada.</td></tr>';
        return;
    }

    container.innerHTML = lista.map(noticia => {
        let idNoticia = noticia.idNoticia || noticia.id;
        
        let dataStr = noticia.dataUpload || "";
        if (dataStr.includes("-")) {
            const partes = dataStr.split("-");
            if (partes.length === 3) dataStr = `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        
        return `
            <tr>
                <td><strong>#${idNoticia}</strong></td>
                <td><strong style="color: var(--on-surface);">${noticia.titulo || "Sem Título"}</strong></td>
                <td><span style="background: #e2e8f0; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 800;">${noticia.categoria || ""}</span></td>
                <td style="color: var(--on-surface-variant); font-size: 12px;">${dataStr}</td>
                <td class="text-right">
                  <div class="acoes">
                    <button type="button" class="action-icon-btn edit" onclick='prepararEdicao(${JSON.stringify(noticia)})' title="Editar">
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button type="button" class="action-icon-btn delete" onclick="excluirNoticia(${idNoticia})" title="Excluir">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </td>
            </tr>
        `;
    }).join("");
}

function mostrarFormulario() {
    document.getElementById("formContainer").style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function esconderFormulario() {
    document.getElementById("formContainer").style.display = "none";
    document.getElementById("formNoticia").reset();
    document.getElementById("idNoticia").value = "";
    document.getElementById("imagem").required = true;
    document.getElementById("imagemHelp").textContent = "";
    document.getElementById("formTitle").textContent = "Publicar nova notícia";
    
    const btnSubmit = document.getElementById("btnSalvarNoticia");
    if (btnSubmit) btnSubmit.innerHTML = '<span class="material-symbols-outlined">save</span> Salvar Notícia';
}

function abrirFiltros() {
    document.getElementById("filtroNoticia").hidden = false;
}

function fecharFiltros() {
    document.getElementById("filtroNoticia").hidden = true;
}

function limparFiltros() {
    document.getElementById("filtroTitulo").value = "";
    document.getElementById("filtroCategoria").value = "";
    renderizarNoticias(noticias);
}

function aplicarFiltros() {
    const tituloFiltro = document.getElementById("filtroTitulo").value.toLowerCase();
    const categoriaFiltro = document.getElementById("filtroCategoria").value.toLowerCase();
    
    const filtrados = noticias.filter(n => {
        const tituloMatch = !tituloFiltro || (n.titulo && n.titulo.toLowerCase().includes(tituloFiltro));
        const categoriaMatch = !categoriaFiltro || (n.categoria && n.categoria.toLowerCase() === categoriaFiltro);
        return tituloMatch && categoriaMatch;
    });
    
    renderizarNoticias(filtrados);
}

async function carregarNoticias() {
    const container = document.getElementById("listaNoticias");
    if (container) {
        container.innerHTML = '<p class="empty-text">Carregando notícias...</p>';
    }

    try {
        const response = await fetch("/noticia/listar");
        const data = await parseJsonSeguro(response);
        if (!response.ok || !Array.isArray(data)) {
            throw new Error("Falha ao carregar notícias");
        }
        noticias = data;
        renderizarNoticias();
    } catch (error) {
        console.error("Erro ao carregar noticias:", error);
        noticias = [];
        if (container) {
            container.innerHTML = '<p class="empty-text">Não foi possível carregar as notícias. Verifique sua conexão e tente novamente.</p>';
        }
    }
}

function prepararEdicao(noticia) {
    document.getElementById("idNoticia").value = noticia.idNoticia || noticia.id;
    document.getElementById("titulo").value = noticia.titulo || "";
    document.getElementById("descricao").value = noticia.descricao || "";
    document.getElementById("categoria").value = noticia.categoria || "";
    
    const imgInput = document.getElementById("imagem");
    imgInput.required = false;
    
    document.getElementById("imagemHelp").textContent = "(Deixe vazio para manter a atual)";
    document.getElementById("formTitle").textContent = "Editar Notícia";
    
    const btnSubmit = document.getElementById("btnSalvarNoticia");
    if (btnSubmit) btnSubmit.innerHTML = '<span class="material-symbols-outlined">save</span> Atualizar Notícia';
    
    mostrarFormulario();
}

async function salvarNoticia(event) {
    event.preventDefault();

    const idNoticia = document.getElementById("idNoticia").value;
    const titulo = document.getElementById("titulo").value;
    const descricao = document.getElementById("descricao").value;
    const categoria = document.getElementById("categoria").value;
    const imagem = document.getElementById("imagem").files[0];
    const botao = document.getElementById("btnSalvarNoticia");

    if (!titulo || !descricao || !categoria) {
        exibirMensagem("Preencha todos os campos de texto.", "error");
        return;
    }

    if (!idNoticia && !imagem) {
        exibirMensagem("A imagem é obrigatória para novas notícias.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("descricao", descricao);
    formData.append("categoria", categoria);
    if (imagem) formData.append("imagem", imagem);

    if (botao) {
        botao.disabled = true;
        botao.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span> Salvando...';
    }

    try {
        let url = "/noticia/upload";
        let method = "POST";
        
        if (idNoticia) {
            url = `/noticia/${idNoticia}`;
            method = "PUT";
        }

        const response = await fetch(url, {
            method: method,
            body: formData
        });
        const data = await parseJsonSeguro(response);

        if (!response.ok) {
            if (response.status === 409) {
                exibirMensagem("Já existe uma notícia com este título. Escolha outro.", "error");
            } else {
                exibirMensagem(data?.descricao || "Não foi possível salvar a notícia.", "error");
            }
            return;
        }

        exibirMensagem("Notícia salva com sucesso!", "success");
        esconderFormulario();
        await carregarNoticias();
    } catch (error) {
        console.error("Erro ao salvar noticia:", error);
        exibirMensagem("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.", "error");
    } finally {
        if (botao) {
            botao.disabled = false;
            if (idNoticia) {
                botao.innerHTML = '<span class="material-symbols-outlined">save</span> Atualizar Notícia';
            } else {
                botao.innerHTML = '<span class="material-symbols-outlined">save</span> Salvar Notícia';
            }
        }
    }
}

async function excluirNoticia(id) {
    if (!id || !window.confirm("Deseja realmente excluir esta notícia?")) return;

    try {
        const response = await fetch(`/noticia/deletar/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            const data = await parseJsonSeguro(response);
            exibirMensagem(data?.descricao || "Não foi possível excluir a notícia.", "error");
            return;
        }

        exibirMensagem("Notícia excluída com sucesso.", "success");
        await carregarNoticias();
        
        if (document.getElementById("idNoticia").value == id) {
            esconderFormulario();
        }
    } catch (error) {
        console.error("Erro ao excluir noticia:", error);
        exibirMensagem("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.", "error");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await carregarFuncionarioSessao();
    preencherPerfilTopo();
    await carregarNoticias();
    
    document.getElementById("formNoticia").addEventListener("submit", salvarNoticia);
});