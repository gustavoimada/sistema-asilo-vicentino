const estadoTransparencia = {
    transparencia: [],
    funcionario: null,
    contexto: {
        idFuncionario: 0,
        idUser: 0,
        usuarioNome: "",
        funcionarioNome: "",
        categoria: ""
    }
};

function parseJsonSeguro(response)
{
    return response.json().catch(() => ({}));
}

async function carregarFuncionarioSessaoTransparencia()
{
    const response = await fetch("/login/sessao");
    const data = await parseJsonSeguro(response);
    if (response.ok)
    {
        estadoTransparencia.funcionario = data;
    }
}

function preencherPerfilTopoSessaoTransparencia()
{
    const funcionario = estadoTransparencia.funcionario || {};
    const nome = String(funcionario.nome || "Usuario").trim();
    const categoria = String(funcionario.categoria || "").trim();
    let cargoTexto = "Acesso";

    if (categoria) cargoTexto = formatarCargoInclusivo(categoria);

    const nomeEl = document.getElementById("perfilNome");
    const cargoEl = document.getElementById("perfilCargo");
    if (nomeEl) nomeEl.textContent = nome || "Usuario";
    if (cargoEl) cargoEl.textContent = cargoTexto;
}

function preencherPerfilTopo()
{
    const nome = (estadoTransparencia.contexto.funcionarioNome
        || estadoTransparencia.contexto.usuarioNome
        || localStorage.getItem("funcionarioNome")
        || localStorage.getItem("usuarioNome")
        || "Usuário").trim();
    const categoria = (estadoTransparencia.contexto.categoria
        || localStorage.getItem("funcionarioCategoria")
        || "").trim();
    let cargoTexto = "Acesso";

    if (categoria) cargoTexto = formatarCargoInclusivo(categoria);

    const nomeEl = document.getElementById("perfilNome");
    const cargoEl = document.getElementById("perfilCargo");
    if (nomeEl) nomeEl.textContent = nome || "Usuário";
    if (cargoEl) cargoEl.textContent = cargoTexto;
}

function carregarContextoUrlCoordenador()
{
    const params = new URLSearchParams(window.location.search);
    const parametrosContexto = ["idFuncionario", "idUser", "usuarioNome", "funcionarioNome", "categoria"];
    const tinhaContexto = parametrosContexto.some((chave) => params.has(chave));
    const idFuncionario = Number(params.get("idFuncionario") || 0);
    const idUser = Number(params.get("idUser") || 0);
    const usuarioNome = String(params.get("usuarioNome") || "").trim();
    const funcionarioNome = String(params.get("funcionarioNome") || "").trim();
    const categoria = String(params.get("categoria") || "").trim();

    if (Number.isInteger(idFuncionario) && idFuncionario > 0)
    {
        estadoTransparencia.contexto.idFuncionario = idFuncionario;
        localStorage.setItem("idFuncionario", String(idFuncionario));
    }
    if (Number.isInteger(idUser) && idUser > 0)
    {
        estadoTransparencia.contexto.idUser = idUser;
        localStorage.setItem("usuarioId", String(idUser));
    }
    if (usuarioNome)
    {
        estadoTransparencia.contexto.usuarioNome = usuarioNome;
        localStorage.setItem("usuarioNome", usuarioNome);
    }
    if (funcionarioNome)
    {
        estadoTransparencia.contexto.funcionarioNome = funcionarioNome;
        localStorage.setItem("funcionarioNome", funcionarioNome);
    }
    if (categoria)
    {
        estadoTransparencia.contexto.categoria = categoria;
        localStorage.setItem("funcionarioCategoria", categoria);
    }

    if (!tinhaContexto || !window.history || typeof window.history.replaceState !== "function")
    {
        return;
    }

    parametrosContexto.forEach((chave) => params.delete(chave));
    const queryRestante = params.toString();
    window.history.replaceState({}, document.title, window.location.pathname + (queryRestante ? `?${queryRestante}` : "") + window.location.hash);
}

function formatarCargoInclusivo(categoria)
{
    const valor = String(categoria || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
    if (valor === "coordenador") return "Coordenador(a)";
    if (valor === "cuidador") return "Cuidador(a)";
    if (valor === "secretaria") return "Secretária";
    return String(categoria || "").trim();
}

function atualizarLinksContextoCoordenador()
{
    const linkPainel = document.querySelector('.sidebar-nav a.sidebar-link[href*="coordenador.html"]');
    const linkEscalas = document.querySelector('.sidebar-nav a.sidebar-link[href*="escalas.html"]');
    const linkTransparencia = document.querySelector('.sidebar-nav a.sidebar-link[href*="transparencia.html"]');
    if (linkPainel) linkPainel.setAttribute("href", "coordenador.html");
    if (linkEscalas) linkEscalas.setAttribute("href", "escalas.html");
    if (linkTransparencia) linkTransparencia.setAttribute("href", "transparencia.html");
}

function mostrarMensagemTransparencia(mensagem, tipo = "info")
{
    const div = document.createElement("div");
    div.className = "popup-msg " + tipo + " show";
    div.textContent = mensagem;
    document.body.appendChild(div);

    setTimeout(() =>
    {
        div.classList.remove("show");
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

function arquivoPdfValidoTransparencia(arquivo)
{
    if (!arquivo) return true;

    const nome = String(arquivo.name || "").toLowerCase();
    const tipo = String(arquivo.type || "").toLowerCase();
    return nome.endsWith(".pdf") || tipo === "application/pdf";
}

function validarArquivoTransparencia()
{
    const inputArquivo = document.getElementById("transparenciaArquivo");
    const arquivo = inputArquivo?.files?.[0];

    if (!arquivoPdfValidoTransparencia(arquivo))
    {
        mostrarMensagemTransparencia("Arquivo incompatível. Envie apenas PDF.", "error");
        if (inputArquivo) inputArquivo.value = "";
        return false;
    }

    return true;
}

function eventoTransparencia(arquivo)
{
    const evento = String(arquivo?.evento || "").trim();
    return evento || "Outros";
}

function mesTransparencia(arquivo)
{
    const numero = Number(arquivo?.mes || 0);
    if (Number.isInteger(numero) && numero >= 1 && numero <= 12)
    {
        return numero;
    }
    return 1;
}

function nomeMesTransparencia(mes)
{
    const nomes = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro"
    ];
    return nomes[Number(mes) - 1] || "Mês não informado";
}

function rotuloMesTransparencia(mes)
{
    const numero = mesTransparencia({ mes });
    return `${String(numero).padStart(2, "0")} - ${nomeMesTransparencia(numero)}`;
}

function prepararArquivoTransparencia(arquivo)
{
    const idArquivo = Number(arquivo?.idTransparencia || arquivo?.id || 0);
    const mes = mesTransparencia(arquivo);
    return {
        ...arquivo,
        idTransparencia: idArquivo,
        evento: eventoTransparencia(arquivo),
        mes,
        mesNome: nomeMesTransparencia(mes),
        mesRotulo: rotuloMesTransparencia(mes),
        dataUpload: formatarDataUploadTransparencia(arquivo?.dataUpload),
        url: `/transparencia/download/${idArquivo}`
    };
}

function nomeExibicaoArquivoTransparencia(arquivo)
{
    const nome = String(arquivo?.nomeArquivo || "Documento PDF").trim();
    return nome.replace(/^[0-9][a-z0-9]{9,}-/i, "") || "Documento PDF";
}

function formatarDataUploadTransparencia(valor)
{
    if (!valor) return "Data nao informada";

    const texto = String(valor).trim();
    if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(texto))
    {
        const dataComFuso = new Date(texto);
        if (!Number.isNaN(dataComFuso.getTime()))
        {
            const partesFuso = new Intl.DateTimeFormat("pt-BR",
            {
                timeZone: "America/Sao_Paulo",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            }).formatToParts(dataComFuso);
            const mapa = {};
            partesFuso.forEach((parte) =>
            {
                mapa[parte.type] = parte.value;
            });
            const data = `${mapa.day}/${mapa.month}/${mapa.year}`;
            const hora = `${mapa.hour}:${mapa.minute}`;
            if (hora && hora !== "00:00")
            {
                return `${data} as ${hora}`;
            }
            return data;
        }
    }

    const partes = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
    if (partes)
    {
        const data = `${partes[3]}/${partes[2]}/${partes[1]}`;
        const hora = partes[4] && partes[5] ? `${partes[4]}:${partes[5]}` : "";
        if (hora && hora !== "00:00")
        {
            return `${data} as ${hora}`;
        }
        return data;
    }

    return texto.replace("T", " ").replace(/Z$/i, "");
}

function agruparTransparenciaPorAnoMesEEvento(arquivos)
{
    const pastas = [];

    arquivos.forEach((item) =>
    {
        const arquivo = prepararArquivoTransparencia(item);
        const ano = String(arquivo.ano || "Sem ano");
        let pasta = pastas.find((p) => p.ano === ano);
        if (!pasta)
        {
            pasta = { ano, meses: [], arquivos: [] };
            pastas.push(pasta);
        }

        pasta.arquivos.push(arquivo);

        let mes = pasta.meses.find((p) => Number(p.mes) === Number(arquivo.mes));
        if (!mes)
        {
            mes = { mes: arquivo.mes, nome: arquivo.mesNome, rotulo: arquivo.mesRotulo, eventos: [], arquivos: [] };
            pasta.meses.push(mes);
            pasta.meses.sort((a, b) => Number(b.mes) - Number(a.mes));
        }

        mes.arquivos.push(arquivo);

        let evento = mes.eventos.find((p) => p.evento.toLowerCase() === arquivo.evento.toLowerCase());
        if (!evento)
        {
            evento = { evento: arquivo.evento, arquivos: [] };
            mes.eventos.push(evento);
        }

        evento.arquivos.push(arquivo);
    });

    return pastas;
}

function renderizarTransparenciaCoordenadorLegado()
{
    const container = document.getElementById("listaTransparenciaCoordenador");
    if (!container) return;

    if (!estadoTransparencia.transparencia.length)
    {
        container.innerHTML = '<p class="empty-text">Nenhum documento publicado.</p>';
        return;
    }

    container.innerHTML = estadoTransparencia.transparencia.map((pasta) =>
    {
        const meses = Array.isArray(pasta.meses) && pasta.meses.length
            ? pasta.meses
            : [{ mes: 1, rotulo: "01 - Janeiro", eventos: [{ evento: "Outros", arquivos: pasta.arquivos || [] }], arquivos: pasta.arquivos || [] }];

        const eventosHtml = eventos.map((evento) =>
        {
            const arquivos = (evento.arquivos || []).map((arquivo) =>
            {
                const idArquivo = arquivo.idTransparencia || arquivo.id || 0;
                const nomeExibicao = nomeExibicaoArquivoTransparencia(arquivo);
                return `
                <div class="transparencia-file-admin">
                    <a class="transparencia-file-link" href="${arquivo.url}" download>
                        <span class="material-symbols-outlined">picture_as_pdf</span>
                        <span class="file-text">
                            <strong title="${nomeExibicao}">${nomeExibicao}</strong>
                            <span class="info">${arquivo.dataUpload || "Data não informada"}</span>
                        </span>
                        <span class="material-symbols-outlined">download</span>
                    </a>
                    <button
                        type="button"
                        class="transparencia-delete-btn"
                        data-id="${idArquivo}"
                        aria-label="Excluir arquivo">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            `;
            }).join("");

            return `
                <section class="transparencia-event-admin">
                    <h5>${evento.evento || "Outros"}</h5>
                    <div class="transparencia-files-admin">${arquivos}</div>
                </section>
            `;
        }).join("");

        return `
            <details class="transparencia-year-admin">
                <summary>
                    <span class="material-symbols-outlined">folder</span>
                    <span>${pasta.ano}</span>
                    <span class="material-symbols-outlined expand">expand_more</span>
                </summary>
                <div class="transparencia-events-admin">${eventosHtml}</div>
            </details>
        `;
    }).join("");
}

function renderizarTransparenciaCoordenador()
{
    const container = document.getElementById("listaTransparenciaCoordenador");
    if (!container) return;

    if (!estadoTransparencia.transparencia.length)
    {
        container.innerHTML = '<p class="empty-text">Nenhum documento publicado.</p>';
        return;
    }

    container.innerHTML = estadoTransparencia.transparencia.map((pasta) =>
    {
        const meses = Array.isArray(pasta.meses) && pasta.meses.length
            ? pasta.meses
            : [{ mes: 1, rotulo: "01 - Janeiro", eventos: [{ evento: "Outros", arquivos: pasta.arquivos || [] }], arquivos: pasta.arquivos || [] }];

        const mesesHtml = meses.map((mes) =>
        {
            const eventos = Array.isArray(mes.eventos) && mes.eventos.length
                ? mes.eventos
                : [{ evento: "Outros", arquivos: mes.arquivos || [] }];

            const eventosHtml = eventos.map((evento) =>
            {
                const arquivos = (evento.arquivos || []).map((arquivo) =>
                {
                    const idArquivo = arquivo.idTransparencia || arquivo.id || 0;
                    const nomeExibicao = nomeExibicaoArquivoTransparencia(arquivo);
                    return `
                        <div class="transparencia-file-admin">
                            <a class="transparencia-file-link" href="${arquivo.url}" download>
                                <span class="material-symbols-outlined">picture_as_pdf</span>
                                <span class="file-text">
                                    <strong title="${nomeExibicao}">${nomeExibicao}</strong>
                                    <span class="info">${evento.evento || "Outros"} • ${arquivo.dataUpload || "Data nao informada"}</span>
                                </span>
                                <span class="material-symbols-outlined">download</span>
                            </a>
                            <button
                                type="button"
                                class="transparencia-delete-btn"
                                data-id="${idArquivo}"
                                aria-label="Excluir arquivo">
                                <span class="material-symbols-outlined">delete</span>
                            </button>
                        </div>
                    `;
                }).join("");

                return `
                    <section class="transparencia-event-admin">
                        <h5>${evento.evento || "Outros"}</h5>
                        <div class="transparencia-files-admin">${arquivos}</div>
                    </section>
                `;
            }).join("");

            return `
                <section class="transparencia-month-admin">
                    <div class="transparencia-month-admin-head">
                        <span class="material-symbols-outlined">calendar_month</span>
                        <strong>${mes.rotulo || rotuloMesTransparencia(mes.mes)}</strong>
                        <small>${(mes.arquivos || []).length} documento(s)</small>
                    </div>
                    <div class="transparencia-events-admin">${eventosHtml}</div>
                </section>
            `;
        }).join("");

        return `
            <details class="transparencia-year-admin">
                <summary>
                    <span class="material-symbols-outlined">folder</span>
                    <span>${pasta.ano}</span>
                    <span class="material-symbols-outlined expand">expand_more</span>
                </summary>
                <div class="transparencia-months-admin">${mesesHtml}</div>
            </details>
        `;
    }).join("");
}

function confirmarExclusaoTransparencia(nomeArquivo)
{
    let modal = document.getElementById("confirmacaoTransparenciaModal");

    if (!modal)
    {
        modal = document.createElement("div");
        modal.id = "confirmacaoTransparenciaModal";
        modal.className = "confirm-overlay";
        modal.innerHTML = `
            <div class="confirm-box">
                <h4>Excluir arquivo</h4>
                <p id="textoConfirmacaoTransparencia"></p>
                <div class="confirm-actions">
                    <button type="button" class="btn btn-secondary" id="cancelarExclusaoTransparencia">Cancelar</button>
                    <button type="button" class="btn btn-danger" id="confirmarExclusaoTransparencia">Excluir</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const texto = document.getElementById("textoConfirmacaoTransparencia");
    if (texto)
    {
        texto.textContent = `Deseja realmente excluir o arquivo "${nomeArquivo}"?`;
    }

    return new Promise((resolve) =>
    {
        const cancelar = document.getElementById("cancelarExclusaoTransparencia");
        const confirmar = document.getElementById("confirmarExclusaoTransparencia");

        function fechar(confirmado)
        {
            modal.classList.remove("show");
            cancelar?.removeEventListener("click", cancelarAcao);
            confirmar?.removeEventListener("click", confirmarAcao);
            modal.removeEventListener("click", clicarFora);
            resolve(confirmado);
        }

        function cancelarAcao()
        {
            fechar(false);
        }

        function confirmarAcao()
        {
            fechar(true);
        }

        function clicarFora(event)
        {
            if (event.target === modal)
            {
                fechar(false);
            }
        }

        cancelar?.addEventListener("click", cancelarAcao);
        confirmar?.addEventListener("click", confirmarAcao);
        modal.addEventListener("click", clicarFora);
        modal.classList.add("show");
    });
}

async function carregarTransparenciaCoordenador()
{
    const container = document.getElementById("listaTransparenciaCoordenador");
    if (container)
    {
        container.innerHTML = '<p class="empty-text">Carregando documentos...</p>';
    }

    try
    {
        const response = await fetch("/transparencia/listar");
        const data = await parseJsonSeguro(response);
        if (!response.ok || !Array.isArray(data))
        {
            throw new Error("Falha ao carregar transparencia");
        }
        estadoTransparencia.transparencia = agruparTransparenciaPorAnoMesEEvento(data);
        renderizarTransparenciaCoordenador();
    }
    catch (error)
    {
        console.error("Erro ao carregar transparencia:", error);
        estadoTransparencia.transparencia = [];
        if (container)
        {
            container.innerHTML = '<p class="empty-text">Nao foi possivel carregar documentos.</p>';
        }
    }
}

async function enviarTransparencia(event)
{
    event.preventDefault();

    const form = document.getElementById("formTransparencia");
    const botao = form?.querySelector(".transparencia-submit");
    const arquivo = document.getElementById("transparenciaArquivo")?.files?.[0];
    const ano = document.getElementById("transparenciaAno")?.value || "";
    const mes = document.getElementById("transparenciaMes")?.value || "";
    const evento = document.getElementById("transparenciaEvento")?.value || "";
    if (!arquivo)
    {
        mostrarMensagemTransparencia("Selecione um arquivo PDF.", "error");
        return;
    }

    if (!arquivoPdfValidoTransparencia(arquivo))
    {
        mostrarMensagemTransparencia("Somente arquivos PDF são permitidos.", "error");
        return;
    }

    if (!/^\d{4}$/.test(String(ano)))
    {
        mostrarMensagemTransparencia("Informe um ano válido.", "error");
        return;
    }

    const mesNumero = Number(mes);
    if (!Number.isInteger(mesNumero) || mesNumero < 1 || mesNumero > 12)
    {
        mostrarMensagemTransparencia("Selecione o mês de referência.", "error");
        return;
    }

    if (!String(evento).trim())
    {
        mostrarMensagemTransparencia("Selecione a categoria do PDF.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("arquivo", arquivo);
    formData.append("ano", ano);
    formData.append("mes", mes);
    formData.append("evento", evento);

    if (botao)
    {
        botao.disabled = true;
        botao.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span> Publicando...';
    }

    try
    {
        const response = await fetch("/transparencia/upload",
        {
            method: "POST",
            body: formData
        });
        const data = await parseJsonSeguro(response);

        if (!response.ok)
        {
            mostrarMensagemTransparencia(data?.mensagem || data?.descricao || "Nao foi possivel publicar o PDF.", "error");
            return;
        }

        mostrarMensagemTransparencia("PDF publicado na area de transparencia.", "success");
        form?.reset();
        await carregarTransparenciaCoordenador();
    }
    catch (error)
    {
        console.error("Erro ao enviar transparencia:", error);
        mostrarMensagemTransparencia("Erro ao publicar PDF.", "error");
    }
    finally
    {
        if (botao)
        {
            botao.disabled = false;
            botao.innerHTML = '<span class="material-symbols-outlined">publish</span> Publicar PDF';
        }
    }
}

async function excluirTransparencia(idArquivo)
{
    if (!idArquivo)
    {
        mostrarMensagemTransparencia("Arquivo invalido para exclusao.", "error");
        return;
    }

    try
    {
        const response = await fetch(`/transparencia/deletar/${idArquivo}`,
        {
            method: "DELETE"
        });
        const data = await parseJsonSeguro(response);

        if (!response.ok)
        {
            mostrarMensagemTransparencia(data?.mensagem || data?.descricao || "Nao foi possivel excluir o arquivo.", "error");
            return;
        }

        mostrarMensagemTransparencia("Arquivo excluido com sucesso.", "success");
        await carregarTransparenciaCoordenador();
    }
    catch (error)
    {
        console.error("Erro ao excluir transparencia:", error);
        mostrarMensagemTransparencia("Erro ao excluir arquivo.", "error");
    }
}

function adicionarEventListenersTransparencia()
{
    document.getElementById("formTransparencia")?.addEventListener("submit", enviarTransparencia);
    document.getElementById("transparenciaArquivo")?.addEventListener("change", validarArquivoTransparencia);
    document.getElementById("atualizarTransparenciaBtn")?.addEventListener("click", carregarTransparenciaCoordenador);
    document.getElementById("listaTransparenciaCoordenador")?.addEventListener("click", async (event) =>
    {
        const botao = event.target.closest(".transparencia-delete-btn");
        if (!botao) return;

        const idArquivo = Number(botao.dataset.id || 0);
        if (!idArquivo) return;

        const arquivo = estadoTransparencia.transparencia
            .flatMap((pasta) => pasta.arquivos || [])
            .find((item) => Number(item.idTransparencia || item.id || 0) === idArquivo);
        const nomeArquivo = nomeExibicaoArquivoTransparencia(arquivo);
        const confirmado = await confirmarExclusaoTransparencia(nomeArquivo);
        if (confirmado)
        {
            excluirTransparencia(idArquivo);
        }
    });
}

async function inicializarTransparencia()
{
    carregarContextoUrlCoordenador();
    await carregarFuncionarioSessaoTransparencia();
    preencherPerfilTopoSessaoTransparencia();
    atualizarLinksContextoCoordenador();
    adicionarEventListenersTransparencia();
    await carregarTransparenciaCoordenador();
}

document.addEventListener("DOMContentLoaded", inicializarTransparencia);
