const estadoCoordenadorEscala = {
    funcionarios: [],
    turnos: [],
    escalas: [],
    historicoTurnos: [],
    turnoSelecionado: null,
    transparencia: [],
    escalaPendenteExclusao: null,
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
    return response.json().catch(() => (
    {}));
}

async function carregarFuncionarioSessaoCoordenador()
{
    const response = await fetch("/login/sessao");
    const data = await parseJsonSeguro(response);
    if (response.ok)
    {
        estadoCoordenadorEscala.funcionario = data;
    }
}

function preencherPerfilTopoSessaoCoordenador()
{
    const funcionario = estadoCoordenadorEscala.funcionario || {};
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
    const nome = (estadoCoordenadorEscala.contexto.funcionarioNome
        || estadoCoordenadorEscala.contexto.usuarioNome
        || localStorage.getItem("funcionarioNome")
        || localStorage.getItem("usuarioNome")
        || "Usuário").trim();
    const categoria = (estadoCoordenadorEscala.contexto.categoria
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
        estadoCoordenadorEscala.contexto.idFuncionario = idFuncionario;
        localStorage.setItem("idFuncionario", String(idFuncionario));
    }
    if (Number.isInteger(idUser) && idUser > 0)
    {
        estadoCoordenadorEscala.contexto.idUser = idUser;
        localStorage.setItem("usuarioId", String(idUser));
    }
    if (usuarioNome)
    {
        estadoCoordenadorEscala.contexto.usuarioNome = usuarioNome;
        localStorage.setItem("usuarioNome", usuarioNome);
    }
    if (funcionarioNome)
    {
        estadoCoordenadorEscala.contexto.funcionarioNome = funcionarioNome;
        localStorage.setItem("funcionarioNome", funcionarioNome);
    }
    if (categoria)
    {
        estadoCoordenadorEscala.contexto.categoria = categoria;
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
    const linkSecretaria = document.querySelector('.sidebar-footer a.sidebar-link[href*="secretaria.html"]');
    if (linkPainel) linkPainel.setAttribute("href", "coordenador.html");
    if (linkEscalas) linkEscalas.setAttribute("href", "escalas.html");
    if (linkTransparencia) linkTransparencia.setAttribute("href", "transparencia.html");
    if (linkSecretaria) linkSecretaria.setAttribute("href", "secretaria.html");
}

function mostrarModalEscala()
{
    const modal = document.getElementById("escalaModalContainer");
    if (modal) modal.style.display = "block";
}

function esconderModalEscala()
{
    const modal = document.getElementById("escalaModalContainer");
    if (modal) modal.style.display = "none";
}

function mostrarMensagemEscala(mensagem, tipo = "info")
{
    const div = document.createElement("div");
    div.className = `popup-msg ${tipo} show`;
    div.textContent = mensagem;
    document.body.appendChild(div);

    setTimeout(() =>
    {
        div.classList.remove("show");
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

function renderizarTransparenciaCoordenador()
{
    const container = document.getElementById("listaTransparenciaCoordenador");
    if (!container) return;

    if (!estadoCoordenadorEscala.transparencia.length)
    {
        container.innerHTML = '<p class="empty-text">Nenhum documento publicado.</p>';
        return;
    }

    container.innerHTML = estadoCoordenadorEscala.transparencia.map((pasta, index) =>
    {
        const arquivos = (pasta.arquivos || []).map((arquivo) => `
            <a class="transparencia-file-admin" href="${arquivo.url}" download>
                <span class="material-symbols-outlined">picture_as_pdf</span>
                <span class="file-text">
                    <strong>${arquivo.nomeArquivo || "Documento PDF"}</strong>
                    <span class="info">${arquivo.dataUpload || "Data não informada"}</span>
                </span>
                <span class="material-symbols-outlined">download</span>
            </a>
        `).join("");

        return `
            <details class="transparencia-year-admin">
                <summary>
                    <span class="material-symbols-outlined">folder</span>
                    <span>${pasta.ano}</span>
                    <span class="material-symbols-outlined expand">expand_more</span>
                </summary>
                <div class="transparencia-files-admin">${arquivos}</div>
            </details>
        `;
    }).join("");
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
        estadoCoordenadorEscala.transparencia = data;
        renderizarTransparenciaCoordenador();
    }
    catch (error)
    {
        console.error("Erro ao carregar transparencia:", error);
        estadoCoordenadorEscala.transparencia = [];
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
    if (!arquivo)
    {
        mostrarMensagemEscala("Selecione um arquivo PDF.", "error");
        return;
    }

    if (!String(arquivo.name || "").toLowerCase().endsWith(".pdf"))
    {
        mostrarMensagemEscala("Somente arquivos PDF sao permitidos.", "error");
        return;
    }

    if (!/^\d{4}$/.test(String(ano)))
    {
        mostrarMensagemEscala("Informe um ano valido.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("arquivo", arquivo);
    formData.append("ano", ano);

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
            mostrarMensagemEscala(data?.mensagem || data?.descricao || "Nao foi possivel publicar o PDF.", "error");
            return;
        }

        mostrarMensagemEscala("PDF publicado na area de transparencia.", "success");
        form.reset();
        await carregarTransparenciaCoordenador();
    }
    catch (error)
    {
        console.error("Erro ao enviar transparencia:", error);
        mostrarMensagemEscala("Erro ao publicar PDF.", "error");
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

function padronizarCategoria(categoria)
{
    const valor = String(categoria || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
    if (valor === "coordenador") return "Coordenador(a)";
    if (valor === "cuidador") return "Cuidador(a)";
    if (valor === "secretaria") return "Secretaria";
    return String(categoria || "").trim();
}

function atualizarIndicadoresEquipe()
{
    const coordenadores = estadoCoordenadorEscala.funcionarios.filter((f) => padronizarCategoria(f.categoria) === "Coordenador(a)").length;
    const cuidadores = estadoCoordenadorEscala.funcionarios.filter((f) => padronizarCategoria(f.categoria) === "Cuidador(a)").length;
    const secretarias = estadoCoordenadorEscala.funcionarios.filter((f) => padronizarCategoria(f.categoria) === "Secretaria").length;

    const elCoordenadores = document.getElementById("qtdCoordenadores");
    const elCuidadores = document.getElementById("qtdCuidadores");
    const elSecretarias = document.getElementById("qtdSecretarias");

    if (elCoordenadores) elCoordenadores.textContent = String(coordenadores);
    if (elCuidadores) elCuidadores.textContent = String(cuidadores);
    if (elSecretarias) elSecretarias.textContent = String(secretarias);
}

function atualizarSelectFuncionariosEscala()
{
    const select = document.getElementById("selectFuncionario");
    if (!select) return;

    const cuidadores = estadoCoordenadorEscala.funcionarios.filter((f) => padronizarCategoria(f.categoria) === "Cuidador(a)");
    select.innerHTML = '<option value="">-- Selecione um Cuidador(a) --</option>';

    cuidadores.forEach((funcionario) =>
    {
        const option = document.createElement("option");
        option.value = String(funcionario.idFuncionario);
        option.textContent = funcionario.nome;
        select.appendChild(option);
    });
}

async function carregarFuncionariosEscala()
{
    try
    {
        const response = await fetch("/funcionario/listar");
        const data = await parseJsonSeguro(response);
        if (!response.ok || !Array.isArray(data))
        {
            throw new Error("Falha ao carregar funcionarios");
        }
        estadoCoordenadorEscala.funcionarios = data;
        atualizarIndicadoresEquipe();
        atualizarSelectFuncionariosEscala();
    }
    catch (error)
    {
        console.error("Erro ao carregar funcionarios:", error);
        estadoCoordenadorEscala.funcionarios = [];
        atualizarIndicadoresEquipe();
        atualizarSelectFuncionariosEscala();
    }
}

async function carregarTurnosEscala()
{
    estadoCoordenadorEscala.turnos = [
    {
        idTurnos: 1,
        horaIni: "07:00",
        horaFim: "19:00",
        descricao: "Turno Manhã"
    },
    {
        idTurnos: 2,
        horaIni: "19:00",
        horaFim: "07:00",
        descricao: "Turno Noite"
    }];

    const select = document.getElementById("selectTurno");
    if (!select) return;

    select.innerHTML = '<option value="">-- Selecione um Turno --</option>';
    estadoCoordenadorEscala.turnos.forEach((turno) =>
    {
        const option = document.createElement("option");
        option.value = String(turno.idTurnos);
        option.textContent = `${turno.descricao} (${turno.horaIni} - ${turno.horaFim})`;
        select.appendChild(option);
    });
}

function formatarDataEscala(valor)
{
    if (!valor) return "-";
    try
    {
        const data = new Date(`${valor}T00:00:00`);
        if (Number.isNaN(data.getTime())) return valor;
        return data.toLocaleDateString("pt-BR");
    }
    catch (e)
    {
        return valor;
    }
}

function escaparHtmlCoordenador(valor)
{
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatarDataHoraCoordenador(valor)
{
    if (!valor) return "-";
    const data = valor instanceof Date ? valor : new Date(String(valor).replace(" ", "T"));
    if (Number.isNaN(data.getTime())) return String(valor);
    return data.toLocaleString("pt-BR",
    {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function obterMinutosHoraCoordenador(hora)
{
    const match = String(hora || "").trim().match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
}

function formatarDataHoraRealCoordenador(dataEscala, hora, horaInicioReferencia)
{
    if (!dataEscala || !hora) return "-";

    const horaNormalizada = String(hora).trim().length === 5 ? `${String(hora).trim()}:00` : String(hora).trim();
    const data = new Date(`${dataEscala}T${horaNormalizada}`);
    if (Number.isNaN(data.getTime())) return formatarDataHoraCoordenador(`${dataEscala} ${hora}`);

    const minutosInicio = obterMinutosHoraCoordenador(horaInicioReferencia);
    const minutosAtual = obterMinutosHoraCoordenador(hora);
    if (minutosInicio !== null && minutosAtual !== null && minutosAtual <= minutosInicio)
    {
        data.setDate(data.getDate() + 1);
    }

    return formatarDataHoraCoordenador(data);
}

function nomeTurnoCurto(idTurno)
{
    return Number(idTurno) === 1 ? "Manhã" : "Noite";
}

function obterHorarioTurnoCurto(idTurno)
{
    const turno = estadoCoordenadorEscala.turnos.find((t) => Number(t.idTurnos) === Number(idTurno));
    if (!turno) return "-";
    return `${turno.horaIni} - ${turno.horaFim}`;
}

function obterFimEscala(escala)
{
    const dataEscala = escala?.dataEscala;
    if (!dataEscala) return null;

    const idTurno = obterIdTurnoEscalaCoordenador(escala);
    const dataFim = new Date(`${dataEscala}T00:00:00`);
    if (Number.isNaN(dataFim.getTime())) return null;

    if (idTurno === 1)
    {
        dataFim.setHours(19, 0, 0, 0);
        return dataFim;
    }

    if (idTurno === 2)
    {
        dataFim.setDate(dataFim.getDate() + 1);
        dataFim.setHours(7, 0, 0, 0);
        return dataFim;
    }

    dataFim.setHours(23, 59, 59, 999);
    return dataFim;
}

function escalaPendenteVencidaSemInicio(escala)
{
    const status = String(escala?.status || "").toLowerCase();
    const semInicio = !escala?.horaInicio;
    const fimEscala = obterFimEscala(escala);
    return status === "pendente" && semInicio && fimEscala && fimEscala.getTime() < Date.now();
}

function obterFimRealEscala(escala)
{
    const dataEscala = escala?.dataEscala;
    const horaFim = escala?.horaFim;
    if (!dataEscala || !horaFim) return null;

    const horaNormalizada = String(horaFim).trim().length === 5
        ? `${String(horaFim).trim()}:00`
        : String(horaFim).trim();
    const dataFim = new Date(`${dataEscala}T${horaNormalizada}`);
    if (Number.isNaN(dataFim.getTime())) return null;

    const minutosInicio = obterMinutosHoraCoordenador(escala?.horaInicio);
    const minutosFim = obterMinutosHoraCoordenador(horaFim);
    if (minutosInicio !== null && minutosFim !== null && minutosFim <= minutosInicio)
    {
        dataFim.setDate(dataFim.getDate() + 1);
    }

    return dataFim;
}

function escalaFinalizadaComAtraso(escala)
{
    if (String(escala?.status || "").toLowerCase() !== "finalizado") return false;

    const fimPrevisto = obterFimEscala(escala);
    const fimReal = obterFimRealEscala(escala);
    return fimPrevisto && fimReal && fimReal.getTime() > fimPrevisto.getTime();
}

function statusExibicaoEscala(escala)
{
    if (escalaPendenteVencidaSemInicio(escala))
    {
        return {
            classe: "sem-inicio",
            texto: "Finalizado sem in\u00edcio",
            titulo: "Escala vencida sem registro de in\u00edcio.",
            descricao: "N\u00e3o iniciou"
        };
    }

    const valor = String(escala?.status || "").toLowerCase();
    if (valor === "ativo")
    {
        return {
            classe: "andamento",
            texto: "Em andamento",
            titulo: "Turno iniciado e ainda nao encerrado.",
            descricao: "Turno ativo"
        };
    }
    if (valor === "pendente")
    {
        return {
            classe: "pendente",
            texto: "Pendente",
            titulo: "Cuidador(a) escalado(a), aguardando in\u00edcio do turno.",
            descricao: "Aguardando in\u00edcio"
        };
    }
    if (valor === "finalizado")
    {
        if (escalaFinalizadaComAtraso(escala))
        {
            return {
                classe: "finalizado-atraso",
                texto: "Finalizado com atraso",
                titulo: "Turno encerrado após o horário previsto.",
                descricao: "Encerrado com atraso"
            };
        }

        return {
            classe: "finalizado",
            texto: "Finalizado",
            titulo: "Turno encerrado pelo cuidador.",
            descricao: "Encerrado"
        };
    }

    return {
        classe: "indefinido",
        texto: escala?.status || "-",
        titulo: "",
        descricao: "Sem status"
    };
}

function classeStatus(status)
{
    const valor = String(status || "").toLowerCase();
    if (valor === "ativo") return "andamento";
    if (valor === "pendente") return "pendente";
    if (valor === "finalizado") return "finalizado";
    return "finalizado";
}

function textoStatus(status)
{
    const valor = String(status || "").toLowerCase();
    if (valor === "ativo") return "Em andamento";
    if (valor === "pendente") return "Pendente";
    if (valor === "finalizado") return "Finalizado";
    return status || "-";
}
function obterNomeTurno(idTurno)
{
    const turno = estadoCoordenadorEscala.turnos.find((t) => Number(t.idTurnos) === Number(idTurno));
    if (!turno) return `Turno #${idTurno || "-"}`;
    return `${turno.descricao} (${turno.horaIni} - ${turno.horaFim})`;
}

function renderizarEscalas()
{
    const container = document.getElementById("escalasLista");
    if (!container) return;

    if (!estadoCoordenadorEscala.escalas.length)
    {
        container.innerHTML = '<p class="empty-text">Nenhuma escala registrada.</p>';
        return;
    }

    const linhas = estadoCoordenadorEscala.escalas.map((escala) =>
    {
        const funcionario = estadoCoordenadorEscala.funcionarios.find((f) => Number(f.idFuncionario) === Number(escala.idFuncionario || escala.Funcionario_idFuncionario));
        const idTurno = escala.idTurno || escala.Turnos_idTurnos;
        const statusExibicao = statusExibicaoEscala(escala);
        const dataEscala = escala.dataEscala || "-";
        const idEscala = Number(escala.idFuncionarioTurnos || 0);
        const removivel = idEscala > 0;
        const tituloRemocao = removivel ? "Excluir escala" : "Dados insuficientes para exclusao";
        return `
            <tr>
                <td>${funcionario?.nome || "-"}</td>
                <td>${obterNomeTurno(idTurno)}</td>
                <td><span class="status-chip ${statusExibicao.classe}" title="${statusExibicao.titulo}">${statusExibicao.texto}</span></td>
                <td>${formatarDataEscala(dataEscala)}</td>
                <td class="escala-acoes-cell">
                    <button
                        type="button"
                        class="escala-remove-btn"
                        data-id-escala="${idEscala}"
                        ${removivel ? "" : "disabled"}
                        title="${tituloRemocao}">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    container.innerHTML = `
        <table class="escala-tabela">
            <thead>
                <tr>
                    <th>Funcionário</th>
                    <th>Turno</th>
                    <th>Status</th>
                    <th>Data</th>
                    <th>Ação</th>
                </tr>
            </thead>
            <tbody>${linhas}</tbody>
        </table>
    `;
}

function obterTurnosFiltrados()
{
    return estadoCoordenadorEscala.historicoTurnos;
}

function atualizarResumoStatusTurnos(turnos)
{
    const container = document.getElementById("turnosStatusResumo");
    if (!container) return;

    const ordem = [
        { classe: "pendente", texto: "Pendentes" },
        { classe: "andamento", texto: "Em andamento" },
        { classe: "finalizado", texto: "Finalizados" },
        { classe: "finalizado-atraso", texto: "Com atraso" },
        { classe: "sem-inicio", texto: "Sem in\u00edcio" }
    ];
    const totais = ordem.reduce((acc, item) =>
    {
        acc[item.classe] = 0;
        return acc;
    }, {});

    turnos.forEach((turno) =>
    {
        const status = statusExibicaoEscala(turno);
        if (Object.prototype.hasOwnProperty.call(totais, status.classe))
        {
            totais[status.classe] += 1;
        }
    });

    container.innerHTML = ordem.map((item) => `
        <div class="turnos-status-card ${item.classe}">
            <strong>${totais[item.classe]}</strong>
            <span>${item.texto}</span>
        </div>
    `).join("");
}

function obterIdTurnoEscalaCoordenador(escala)
{
    return Number(escala?.idTurno || escala?.turno?.idTurnos || escala?.Turnos_idTurnos || 0);
}

function obterNomeFuncionarioEscalaCoordenador(escala)
{
    return escala?.funcionario?.nome || escala?.funcionarioNome || "-";
}

async function carregarEventosTurnoCoordenador(idFuncionarioTurnos)
{
    const [ocorrenciasResponse, medicacoesResponse] = await Promise.all([
        fetch(`/ocorrencia/turno?idFuncionarioTurnos=${idFuncionarioTurnos}`),
        fetch(`/registrarusomedicacao/turno?idFuncionarioTurnos=${idFuncionarioTurnos}`)
    ]);

    const ocorrencias = await parseJsonSeguro(ocorrenciasResponse);
    const medicacoes = await parseJsonSeguro(medicacoesResponse);

    return {
        ocorrencias: ocorrenciasResponse.ok && Array.isArray(ocorrencias) ? ocorrencias : [],
        medicacoes: medicacoesResponse.ok && Array.isArray(medicacoes) ? medicacoes : []
    };
}

function renderizarHistoricoTurnos()
{
    const container = document.getElementById("historicoTurnosLista");
    if (!container) return;

    const turnos = obterTurnosFiltrados();
    atualizarResumoStatusTurnos(turnos);
    if (!turnos.length)
    {
        container.innerHTML = '<p class="empty-text">Nenhum turno encontrado.</p>';
        return;
    }

    container.innerHTML = turnos.map((turno) =>
    {
        const ativo = estadoCoordenadorEscala.turnoSelecionado && Number(estadoCoordenadorEscala.turnoSelecionado.idFuncionarioTurnos) === Number(turno.idFuncionarioTurnos);
        const statusExibicao = statusExibicaoEscala(turno);
        const idTurno = obterIdTurnoEscalaCoordenador(turno);
        return `
            <button type="button" class="turno-historico-item status-${statusExibicao.classe} ${ativo ? "active" : ""}" data-id-turno="${turno.idFuncionarioTurnos}">
                <span class="turno-historico-main">
                    <span class="turno-historico-top">
                        <strong>${escaparHtmlCoordenador(obterNomeFuncionarioEscalaCoordenador(turno))}</strong>
                        <span class="status-chip ${statusExibicao.classe}" title="${statusExibicao.titulo}">${statusExibicao.texto}</span>
                    </span>
                    <small class="turno-historico-meta">
                        <span>${nomeTurnoCurto(idTurno)}</span>
                        <span>${formatarDataEscala(turno.dataEscala)}</span>
                        <span>${obterHorarioTurnoCurto(idTurno)}</span>
                    </small>
                </span>
            </button>
        `;
    }).join("");
}

function montarEventosTurnoCoordenador(turno)
{
    const ocorrencias = turno.ocorrencias || [];
    const medicacoes = turno.medicacoes || [];
    const blocos = [];

    if (ocorrencias.length)
    {
        blocos.push(`
            <div class="turno-eventos-bloco">
                <h5>Ocorrências</h5>
                ${ocorrencias.map((ocorrencia) => `
                    <article class="turno-evento">
                        <div>
                            <strong>${escaparHtmlCoordenador(ocorrencia.tipoOcorrencia?.descricao || "Ocorrência")}</strong>
                            <span>${formatarDataHoraCoordenador(ocorrencia.dtOcorrencia)} - Gravidade ${escaparHtmlCoordenador(ocorrencia.tipoOcorrencia?.gravidade || "-")}</span>
                        </div>
                        <p>${escaparHtmlCoordenador(ocorrencia.observacoes || "Sem observações.")}</p>
                        ${Array.isArray(ocorrencia.moradores) && ocorrencia.moradores.length ? `<small>Moradores: ${escaparHtmlCoordenador(ocorrencia.moradores.map((morador) => morador.nome).filter(Boolean).join(", "))}</small>` : ""}
                    </article>
                `).join("")}
            </div>
        `);
    }

    if (medicacoes.length)
    {
        blocos.push(`
            <div class="turno-eventos-bloco">
                <h5>Medicação</h5>
                ${medicacoes.map((medicacao) => `
                    <article class="turno-evento">
                        <div>
                            <strong>${escaparHtmlCoordenador(medicacao.prescricaoDose?.prescricao?.medicamento?.nome || "Medicação")}</strong>
                            <span>${formatarDataHoraCoordenador(medicacao.dataRegistro)}</span>
                        </div>
                        <p>${escaparHtmlCoordenador(medicacao.prescricaoDose?.prescricao?.morador?.nome || "Morador não informado")}</p>
                    </article>
                `).join("")}
            </div>
        `);
    }

    return blocos.length ? blocos.join("") : '<p class="empty-text">Nenhuma ocorrência ou medicação registrada nesse turno.</p>';
}

function renderizarDetalhesTurnoCoordenador()
{
    const container = document.getElementById("detalhesTurnoCoordenador");
    if (!container) return;

    const turno = estadoCoordenadorEscala.turnoSelecionado;
    if (!turno)
    {
        container.innerHTML = '<p class="empty-text">Selecione um turno para ver os detalhes.</p>';
        renderizarHistoricoTurnos();
        return;
    }
    const statusExibicao = statusExibicaoEscala(turno);
    const podeExcluir = Number(turno.idFuncionarioTurnos || 0) > 0;
    const idTurno = obterIdTurnoEscalaCoordenador(turno);
    const nomeFuncionario = obterNomeFuncionarioEscalaCoordenador(turno);
    const totalOcorrencias = (turno.ocorrencias || []).length;
    const totalMedicacoes = (turno.medicacoes || []).length;
    const totalRegistros = totalOcorrencias + totalMedicacoes;

    container.innerHTML = `
        <div class="turno-detail-hero status-${statusExibicao.classe}">
            <div class="turno-detail-main">
                <span class="turno-detail-eyebrow">${statusExibicao.descricao}</span>
                <h3>${escaparHtmlCoordenador(nomeFuncionario)}</h3>
                <div class="turno-detail-tags">
                    <span>${nomeTurnoCurto(idTurno)}</span>
                    <span>${formatarDataEscala(turno.dataEscala)}</span>
                    <span>${obterHorarioTurnoCurto(idTurno)}</span>
                </div>
            </div>
            <div class="turno-detail-actions">
                <span class="status-chip ${statusExibicao.classe}" title="${statusExibicao.titulo}">${statusExibicao.texto}</span>
                <button type="button" class="turno-detail-delete-btn" data-id-escala="${turno.idFuncionarioTurnos}" ${podeExcluir ? "" : "disabled"} title="Excluir escala">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        </div>
        <div class="turno-resumo-grid">
            <div><span>In\u00edcio real</span><strong>${formatarDataHoraRealCoordenador(turno.dataEscala, turno.horaInicio)}</strong></div>
            <div><span>Fim real</span><strong>${formatarDataHoraRealCoordenador(turno.dataEscala, turno.horaFim, turno.horaInicio)}</strong></div>
            <div><span>Registros</span><strong>${totalRegistros}</strong><small>${totalOcorrencias} ocorr\u00eancia(s) / ${totalMedicacoes} uso(s) de medica\u00e7\u00e3o</small></div>
        </div>
        <div class="turno-descricao-box">
            <span>Observa\u00e7\u00e3o do encerramento</span>
            <p>${escaparHtmlCoordenador(turno.descricao || "Nenhuma descrição informada.")}</p>
        </div>
        ${montarEventosTurnoCoordenador(turno)}
    `;

    renderizarHistoricoTurnos();
}

async function selecionarTurnoCoordenador(idFuncionarioTurnos)
{
    const container = document.getElementById("detalhesTurnoCoordenador");
    if (container)
    {
        container.innerHTML = '<p class="empty-text">Carregando detalhes do turno...</p>';
    }

    try
    {
        const response = await fetch(`/turno/detalhes?idFuncionarioTurnos=${idFuncionarioTurnos}`);
        const data = await parseJsonSeguro(response);
        if (!response.ok)
        {
            throw new Error(data?.descricao || "Falha ao carregar detalhes");
        }
        const eventos = await carregarEventosTurnoCoordenador(idFuncionarioTurnos);
        data.ocorrencias = eventos.ocorrencias;
        data.medicacoes = eventos.medicacoes;
        estadoCoordenadorEscala.turnoSelecionado = data;
        renderizarDetalhesTurnoCoordenador();
    }
    catch (error)
    {
        console.error("Erro ao carregar detalhes do turno:", error);
        estadoCoordenadorEscala.turnoSelecionado = null;
        if (container)
        {
            container.innerHTML = '<p class="empty-text">Nao foi possivel carregar os detalhes do turno.</p>';
        }
    }
}

async function carregarHistoricoTurnosCoordenador()
{
    const container = document.getElementById("historicoTurnosLista");
    if (container)
    {
        container.innerHTML = '<p class="empty-text">Carregando turnos...</p>';
    }

    try
    {
        const response = await fetch("/turno/historico");
        const data = await parseJsonSeguro(response);
        if (!response.ok || !Array.isArray(data))
        {
            throw new Error("Falha ao carregar historico");
        }

        estadoCoordenadorEscala.historicoTurnos = data;
        renderizarHistoricoTurnos();

        if (data.length && !estadoCoordenadorEscala.turnoSelecionado)
        {
            await selecionarTurnoCoordenador(data[0].idFuncionarioTurnos);
        }
    }
    catch (error)
    {
        console.error("Erro ao carregar historico de turnos:", error);
        estadoCoordenadorEscala.historicoTurnos = [];
        renderizarHistoricoTurnos();
    }
}

async function excluirEscalaAtalho(idFuncionarioTurnos)
{
    if (!idFuncionarioTurnos)
    {
        mostrarMensagemEscala("Dados da escala invalidos para exclusao.", "error");
        return;
    }

    const url = `/funcionarioTurnos/deletar?idFuncionarioTurnos=${idFuncionarioTurnos}`;

    try
    {
        const response = await fetch(url,
        {
            method: "DELETE"
        });
        const data = await parseJsonSeguro(response);

        if (response.ok)
        {
            mostrarMensagemEscala("Escala excluida com sucesso!", "success");
            if (estadoCoordenadorEscala.turnoSelecionado && Number(estadoCoordenadorEscala.turnoSelecionado.idFuncionarioTurnos) === Number(idFuncionarioTurnos))
            {
                estadoCoordenadorEscala.turnoSelecionado = null;
            }
            await carregarHistoricoTurnosCoordenador();
            renderizarDetalhesTurnoCoordenador();
            return;
        }

        mostrarMensagemEscala(data?.mensagem || data?.descricao || "Nao foi possivel excluir a escala.", "error");
    }
    catch (error)
    {
        console.error("Erro ao excluir escala:", error);
        mostrarMensagemEscala("Erro ao excluir escala.", "error");
    }
}

function abrirConfirmacaoExclusaoEscala(idFuncionarioTurnos)
{
    if (!idFuncionarioTurnos)
    {
        mostrarMensagemEscala("Dados da escala invalidos para exclusao.", "error");
        return;
    }

    estadoCoordenadorEscala.escalaPendenteExclusao = { idFuncionarioTurnos };

    const texto = document.getElementById("textoConfirmacaoEscala");
    if (texto)
    {
        texto.textContent = "Deseja realmente excluir esta escala?";
    }

    document.getElementById("painelConfirmacaoEscala")?.classList.add("show");
}

function fecharConfirmacaoExclusaoEscala()
{
    document.getElementById("painelConfirmacaoEscala")?.classList.remove("show");
    estadoCoordenadorEscala.escalaPendenteExclusao = null;
}

async function confirmarExclusaoEscala()
{
    const pendente = estadoCoordenadorEscala.escalaPendenteExclusao;
    if (!pendente) return;

    await excluirEscalaAtalho(pendente.idFuncionarioTurnos);
    fecharConfirmacaoExclusaoEscala();
}

async function carregarEscalasCoordenador()
{
    try
    {
        const response = await fetch("/funcionarioTurnos/listarTodas");
        const data = await parseJsonSeguro(response);
        if (!response.ok || !Array.isArray(data))
        {
            throw new Error("Falha ao carregar escalasController");
        }
        estadoCoordenadorEscala.escalas = data;
        renderizarEscalas();
    }
    catch (error)
    {
        console.error("Erro ao carregar escalasController:", error);
        estadoCoordenadorEscala.escalas = [];
        renderizarEscalas();
    }
}

async function escalarFuncionarioCoordenador()
{
    const idFuncionario = document.getElementById("selectFuncionario")?.value || "";
    const idTurno = document.getElementById("selectTurno")?.value || "";

    if (!idFuncionario || !idTurno)
    {
        mostrarMensagemEscala("Selecione funcionario e turno", "error");
        return;
    }

    try
    {
        const response = await fetch("/turno/escalar",
        {
            method: "POST",
            headers:
            {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `idFuncionario=${idFuncionario}&idTurno=${idTurno}`
        });

        const data = await parseJsonSeguro(response);
        if (response.ok)
        {
            mostrarMensagemEscala("Funcionario escalado com sucesso!", "success");
            const selectFuncionario = document.getElementById("selectFuncionario");
            const selectTurno = document.getElementById("selectTurno");
            if (selectFuncionario) selectFuncionario.value = "";
            if (selectTurno) selectTurno.value = "";
            await carregarEscalasCoordenador();
            return;
        }

        mostrarMensagemEscala(data.msg || data.erro || data.descricao || "Falha ao escalar funcionario", "error");
    }
    catch (error)
    {
        console.error("Erro ao escalar funcionario:", error);
        mostrarMensagemEscala("Erro ao escalar funcionario", "error");
    }
}

function adicionarEventListenersEscala()
{
    document.getElementById("verEscalaBtn")?.addEventListener("click", mostrarModalEscala);
    document.getElementById("fecharEscalaBtn")?.addEventListener("click", esconderModalEscala);
    document.getElementById("escalarBtn")?.addEventListener("click", escalarFuncionarioCoordenador);
    document.getElementById("escalasLista")?.addEventListener("click", async (event) =>
    {
        const botao = event.target.closest(".escala-remove-btn");
        if (!botao || botao.disabled) return;

        const idEscala = Number(botao.dataset.idEscala || 0);
        abrirConfirmacaoExclusaoEscala(idEscala);
    });
    document.getElementById("confirmarExclusaoEscala")?.addEventListener("click", confirmarExclusaoEscala);
    document.getElementById("cancelarExclusaoEscala")?.addEventListener("click", fecharConfirmacaoExclusaoEscala);
    document.getElementById("historicoTurnosLista")?.addEventListener("click", (event) =>
    {
        const botao = event.target.closest(".turno-historico-item");
        if (!botao) return;

        selecionarTurnoCoordenador(Number(botao.dataset.idTurno || 0));
    });
    document.getElementById("detalhesTurnoCoordenador")?.addEventListener("click", (event) =>
    {
        const botao = event.target.closest(".turno-detail-delete-btn");
        if (!botao || botao.disabled) return;

        abrirConfirmacaoExclusaoEscala(Number(botao.dataset.idEscala || 0));
    });
    document.getElementById("formTransparencia")?.addEventListener("submit", enviarTransparencia);
    document.getElementById("atualizarTransparenciaBtn")?.addEventListener("click", carregarTransparenciaCoordenador);
}

async function inicializarCoordenadorEscala()
{
    carregarContextoUrlCoordenador();
    await carregarFuncionarioSessaoCoordenador();
    preencherPerfilTopoSessaoCoordenador();
    atualizarLinksContextoCoordenador();
    adicionarEventListenersEscala();
    await carregarTurnosEscala();
    await carregarFuncionariosEscala();
    await carregarHistoricoTurnosCoordenador();

    if (document.getElementById("listaTransparenciaCoordenador"))
    {
        await carregarTransparenciaCoordenador();
    }
}

document.addEventListener("DOMContentLoaded", inicializarCoordenadorEscala);
document.addEventListener("click", (event) =>
{
    const painel = document.getElementById("painelConfirmacaoEscala");
    if (painel && event.target === painel)
    {
        fecharConfirmacaoExclusaoEscala();
    }
});
