const URL = '/despesa';

let despesas = [];
let direcaoOrdenacao = 'asc';

function formatarTipoDespesaLegivel(valor) {
    if (typeof window.formatarTituloLegivel === 'function')
        return window.formatarTituloLegivel(valor);

    return String(valor || '');
}

function carregarContextoUrl() {
    const params = new URLSearchParams(window.location.search);
    const parametrosContexto = ['idFuncionario', 'idUser', 'usuarioNome', 'funcionarioNome', 'categoria'];
    const tinhaContexto = parametrosContexto.some((chave) => params.has(chave));
    const idFuncionario = Number(params.get('idFuncionario') || 0);
    const idUser = Number(params.get('idUser') || 0);
    const usuarioNome = String(params.get('usuarioNome') || '').trim();
    const funcionarioNome = String(params.get('funcionarioNome') || '').trim();
    const categoria = String(params.get('categoria') || '').trim();

    if (Number.isInteger(idFuncionario) && idFuncionario > 0)
        localStorage.setItem('idFuncionario', String(idFuncionario));

    if (Number.isInteger(idUser) && idUser > 0)
        localStorage.setItem('usuarioId', String(idUser));

    if (usuarioNome !== '')
        localStorage.setItem('usuarioNome', usuarioNome);

    if (funcionarioNome !== '')
        localStorage.setItem('funcionarioNome', funcionarioNome);

    if (categoria !== '')
        localStorage.setItem('funcionarioCategoria', categoria);

    if (!tinhaContexto || !window.history || typeof window.history.replaceState !== 'function')
        return;

    parametrosContexto.forEach((chave) => params.delete(chave));
    const queryRestante = params.toString();
    window.history.replaceState({}, document.title, window.location.pathname + (queryRestante ? `?${queryRestante}` : '') + window.location.hash);
}

function formatarCargoInclusivo(categoria) {
    const valor = String(categoria || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();

    if (valor === 'coordenador')
        return 'Coordenador(a)';
    else if (valor === 'cuidador')
        return 'Cuidador(a)';
    else if (valor === 'secretaria')
        return 'Secretária';
    else
        return String(categoria || '').trim();
}

async function preencherPerfilTopo() {
    let nome = (localStorage.getItem('funcionarioNome') || localStorage.getItem('usuarioNome') || 'Usuario').trim();
    let categoria = (localStorage.getItem('funcionarioCategoria') || '').trim();
    let cargoTexto = 'Acesso';

    try {
        const resposta = await fetch('/login/sessao', { credentials: 'include' });

        if (resposta.ok) {
            const funcionario = await resposta.json();

            if (String(funcionario.nome || '').trim() !== '')
                nome = String(funcionario.nome || '').trim();

            if (String(funcionario.categoria || '').trim() !== '')
                categoria = String(funcionario.categoria || '').trim();
        }
    } catch (erro) {
    }

    if (document.getElementById('perfilNome'))
        document.getElementById('perfilNome').textContent = nome || 'Usuario';

    if (categoria !== '')
        cargoTexto = formatarCargoInclusivo(categoria);

    if (document.getElementById('perfilCargo'))
        document.getElementById('perfilCargo').textContent = cargoTexto;
}

function obterElementoTabelaDespesas() {
    let tbody = document.getElementById('listaDespesas');

    if (!tbody)
        tbody = document.getElementById('tabelaDespesas');

    return tbody;
}

function exibirMensagem(tipo, mensagem) {
    const classe = document.getElementById('mensagem-feedback');

    if (classe) {

        classe.className = `popup-msg ${tipo}`;
        classe.textContent = mensagem;
        classe.classList.add('show');

        window.clearTimeout(exibirMensagem._timer);
        exibirMensagem._timer = window.setTimeout(() => {
            classe.classList.remove('show');
        }, 3200);

    }
}

function confirmarAcaoDespesa(titulo, mensagem, textoConfirmar = 'Confirmar') {
    let modal = document.getElementById('confirmacaoDespesaModal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'confirmacaoDespesaModal';
        modal.className = 'confirm-overlay';
        modal.innerHTML = `
            <div class="confirm-box">
                <h4 id="confirmacaoDespesaTitulo"></h4>
                <p id="confirmacaoDespesaMensagem"></p>
                <div class="confirm-actions">
                    <button type="button" class="btn btn-secondary" id="cancelarConfirmacaoDespesa">Cancelar</button>
                    <button type="button" class="btn btn-danger" id="confirmarConfirmacaoDespesa"></button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('confirmacaoDespesaTitulo').textContent = titulo;
    document.getElementById('confirmacaoDespesaMensagem').textContent = mensagem;
    document.getElementById('confirmarConfirmacaoDespesa').textContent = textoConfirmar;

    return new Promise((resolve) => {
        const cancelar = document.getElementById('cancelarConfirmacaoDespesa');
        const confirmar = document.getElementById('confirmarConfirmacaoDespesa');

        function fechar(confirmado) {
            modal.classList.remove('show');
            cancelar.removeEventListener('click', cancelarAcao);
            confirmar.removeEventListener('click', confirmarAcao);
            modal.removeEventListener('click', clicarFora);
            resolve(confirmado);
        }

        function cancelarAcao() {
            fechar(false);
        }

        function confirmarAcao() {
            fechar(true);
        }

        function clicarFora(event) {
            if (event.target === modal)
                fechar(false);
        }

        cancelar.addEventListener('click', cancelarAcao);
        confirmar.addEventListener('click', confirmarAcao);
        modal.addEventListener('click', clicarFora);
        modal.classList.add('show');
    });
}

function formatarData(data) {
    if (!data)
        return '';

    const apenasData = data.split('T')[0];
    return apenasData.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1');
}

function dataISO(data) {
    if (!data)
        return '';
    else
        return data.split('T')[0];
}

function formatarValor(v) {
    if (!v)
        return '';

    let digitos = String(v).replace(/[^0-9]/g, '');

    if (digitos === '')
        return '';

    digitos = digitos.replace(/^0+/, '');

    if (digitos === '')
        digitos = '0';

    while (digitos.length < 3)
        digitos = '0' + digitos;

    const centavos = digitos.slice(-2);
    let inteira = digitos.slice(0, -2);

    inteira = inteira.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return inteira + ',' + centavos;
}

function formatarMoeda(valor) {
    if (valor === null || valor === undefined || valor === '')
        return '';

    const numero = Number(valor);

    if (isNaN(numero))
        return '';

    const partes = numero.toFixed(2).split('.');
    const inteira = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return 'R$ ' + inteira + ',' + partes[1];
}

function valorParaNumero(v) {
    if (!v)
        return '';
    else
        return String(v).replace(/\./g, '').replace(',', '.');
}

function obterStatusDespesa(despesa) {
    if (despesa.dtQuitacao)
        return 'Pago';
    else if (despesa.dtVencimento && dataISO(despesa.dtVencimento) < dataAtualFormatada())
        return 'Vencido';
    else
        return 'Pendente';
}

function dataAtualFormatada() {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
}

function DiferencaDiasDespesa(despesa) {
    if (despesa.dtQuitacao || !despesa.dtVencimento)
        return null;
    else {
        const hoje = new Date();
        const vencimento = new Date(`${dataISO(despesa.dtVencimento)}T00:00:00`);
        const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        const diferencaMs = vencimento - hojeSemHora;
        const diferencaDias = Math.round(diferencaMs / 86400000);

        if (diferencaDias < 0)
            return null;
        else
            return diferencaDias;
    }
}

function calcularDiasRestantes(despesa) {
    const diferencaDias = DiferencaDiasDespesa(despesa);

    if (diferencaDias === null)
        return '-';
    else {
        if (diferencaDias > 0)
            return `${diferencaDias} dia(s)`;
        else
            return 'Vence hoje';
    }
}

function corDiasRestantes(despesa) {
    const diferencaDias = DiferencaDiasDespesa(despesa);

    if (diferencaDias === null)
        return '';
    else {
        if (diferencaDias <= 3)
            return 'dias-restantes-vermelho';
        else if (diferencaDias <= 7)
            return 'dias-restantes-amarelo';
        else
            return 'dias-restantes-verde';
    }
}

function atualizarCamposDespesaFixa() {
    const fixa = document.getElementById('fixa');
    const campoPeriodicidade = document.getElementById('campoPeriodicidade');
    const periodicidade = document.getElementById('periodicidade');

    if (fixa.value === 'true') {
        periodicidade.required = true;
        periodicidade.disabled = false;
        campoPeriodicidade.classList.remove('is-disabled');
    }
    else {
        periodicidade.required = false;
        periodicidade.disabled = true;
        periodicidade.value = '';
        campoPeriodicidade.classList.add('is-disabled');
    }
}

function limparIndicadoresOrdenacao() {
    const idsIndicadores = ['sort-tipo', 'sort-valor', 'sort-dtVencimento', 'sort-dtQuitacao', 'sort-observacoes'];
    const idsCabecalho = ['th-tipo', 'th-valor', 'th-dtVencimento', 'th-dtQuitacao', 'th-observacoes'];

    idsIndicadores.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento)
            elemento.textContent = '';
    });

    idsCabecalho.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento)
            elemento.classList.remove('is-active');
    });
}

function atualizarIndicadoresOrdenacao() {
    const ordenacao = document.getElementById('ordenacaoDespesas');
    let indicador;
    let th;

    limparIndicadoresOrdenacao();

    if (ordenacao != null && ordenacao.value !== '') {
        indicador = document.getElementById(`sort-${ordenacao.value}`);
        th = document.getElementById(`th-${ordenacao.value}`);

        if (indicador) {
            if (direcaoOrdenacao === 'asc')
                indicador.textContent = '^';
            else
                indicador.textContent = 'v';
        }

        if (th)
            th.classList.add('is-active');
    }
}

function definirOrdenacao(campo) {
    const ordenacao = document.getElementById('ordenacaoDespesas');

    if (ordenacao != null) {
        if (ordenacao.value === campo) {
            if (direcaoOrdenacao === 'asc')
                direcaoOrdenacao = 'desc';
            else
                direcaoOrdenacao = 'asc';
        }
        else {
            ordenacao.value = campo;
            direcaoOrdenacao = 'asc';
        }

        carregarDespesas();
    }
}

function carregarDespesas() {
    const filtroTipo = document.getElementById('filtroTipo');
    let url;

    if (filtroTipo != null) {
        const filtroStatus = document.getElementById('filtroStatus');
        const filtroFixa = document.getElementById('filtroFixa');
        const filtroPeriodicidade = document.getElementById('filtroPeriodicidade');
        const filtroObservacao = document.getElementById('filtroObservacao');
        const filtroVencimentoInicio = document.getElementById('filtroVencimentoInicio');
        const filtroVencimentoFim = document.getElementById('filtroVencimentoFim');
        const filtroQuitacaoInicio = document.getElementById('filtroQuitacaoInicio');
        const filtroQuitacaoFim = document.getElementById('filtroQuitacaoFim');
        const filtroDiasRestantes = document.getElementById('filtroDiasRestantes');
        const ordenacao = document.getElementById('ordenacaoDespesas');
        const params = new URLSearchParams();

        if (filtroTipo.value.trim() !== '')
            params.append('tipo', filtroTipo.value.trim());

        if (filtroStatus.value !== '')
            params.append('status', filtroStatus.value);

        if (filtroFixa.value !== '')
            params.append('fixa', filtroFixa.value);

        if (filtroPeriodicidade.value !== '')
            params.append('periodicidade', filtroPeriodicidade.value);

        if (filtroObservacao.value.trim() !== '')
            params.append('observacoes', filtroObservacao.value.trim());

        if (filtroVencimentoInicio.value !== '')
            params.append('dtVencimentoInicio', filtroVencimentoInicio.value);

        if (filtroVencimentoFim.value !== '')
            params.append('dtVencimentoFim', filtroVencimentoFim.value);

        if (filtroQuitacaoInicio.value !== '')
            params.append('dtQuitacaoInicio', filtroQuitacaoInicio.value);

        if (filtroQuitacaoFim.value !== '')
            params.append('dtQuitacaoFim', filtroQuitacaoFim.value);

        if (ordenacao != null && ordenacao.value !== '')
            params.append('ordenacao', ordenacao.value);

        params.append('direcao', direcaoOrdenacao);
        url = `${URL}/filtrar?${params.toString()}`;
    }
    else
        url = `${URL}/listar`;

    fetch(url)
        .then(response => {
            if (!response.ok)
                throw new Error('Nao foi possivel carregar despesas.');

            return response.json();
        })
        .then(listaDespesas => {
            const filtroDiasRestantes = document.getElementById('filtroDiasRestantes');
            let listaFiltrada = [];

            if (Array.isArray(listaDespesas))
                listaFiltrada = listaDespesas;

            if (filtroDiasRestantes && filtroDiasRestantes.value !== '') {
                const limiteDias = Number(filtroDiasRestantes.value);

                listaFiltrada = listaDespesas.filter(despesa => {
                    const diferencaDias = DiferencaDiasDespesa(despesa);
                    return diferencaDias !== null && diferencaDias < limiteDias;
                });
            }

            despesas = listaFiltrada;
            renderizarDespesas(despesas);
        })
        .catch(error => console.error('Erro ao carregar despesas:', error));
}

function renderizarDespesas(listaDespesas) {
    const tbody = obterElementoTabelaDespesas();

    if (!tbody)
        return;

    tbody.innerHTML = '';
    atualizarIndicadoresOrdenacao();

    let listaRenderizacao = [];

    if (Array.isArray(listaDespesas))
        listaRenderizacao = listaDespesas;

    listaRenderizacao.forEach(d => {
        const row = tbody.insertRow();
        let tipoDespesa = '';

        if (d.tipoDespesa && d.tipoDespesa.tipo)
            tipoDespesa = formatarTipoDespesaLegivel(d.tipoDespesa.tipo);

        row.insertCell(0).textContent = tipoDespesa;

        //status da despesa
        const statusCell = row.insertCell(1);
        const statusSpan = document.createElement('span');
        statusSpan.textContent = obterStatusDespesa(d);
        statusSpan.classList.add('despesa-status');
        if (d.dtQuitacao)
            statusSpan.classList.add('pago');
        else if (obterStatusDespesa(d) === 'Vencido')
            statusSpan.classList.add('vencido');
        else
            statusSpan.classList.add('pendente');
        statusCell.appendChild(statusSpan);

        row.insertCell(2).textContent = formatarMoeda(d.valor);

        if (d.fixa)
            row.insertCell(3).textContent = 'Sim';
        else
            row.insertCell(3).textContent = 'Não';

        if (d.fixa && d.periodicidade)
            row.insertCell(4).textContent = d.periodicidade;
        else
            row.insertCell(4).textContent = '-';

        row.insertCell(5).textContent = formatarData(d.dtVencimento);

        const diasRestantesCell = row.insertCell(6);
        const diasRestantesSpan = document.createElement('span');
        diasRestantesSpan.textContent = calcularDiasRestantes(d);
        const classeDiasRestantes = corDiasRestantes(d);

        if (classeDiasRestantes !== '')
            diasRestantesSpan.classList.add('dias-restantes-badge', classeDiasRestantes);

        diasRestantesCell.appendChild(diasRestantesSpan);

        if (d.dtQuitacao)
            row.insertCell(7).textContent = formatarData(d.dtQuitacao);
        else
            row.insertCell(7).textContent = '-';

        row.insertCell(8).textContent = d.observacoes || '';

        const acoes = row.insertCell(9);
        acoes.classList.add('morador-actions-cell');

        if (!d.dtQuitacao) {
            const btnPagar = document.createElement('button');
            btnPagar.type = 'button';
            btnPagar.classList.add('despesa-pay-btn', 'morador-row-btn');
            btnPagar.setAttribute('aria-label', 'Pagar');
            btnPagar.innerHTML = '<span class="material-symbols-outlined">check_circle</span>';
            btnPagar.onclick = () => pagarDespesa(d);
            acoes.appendChild(btnPagar);
        }
        else {
            const btnEstornar = document.createElement('button');
            btnEstornar.type = 'button';
            btnEstornar.classList.add('despesa-pay-btn', 'morador-row-btn');
            btnEstornar.setAttribute('aria-label', 'Estornar');
            btnEstornar.innerHTML = '<span class="material-symbols-outlined">undo</span>';
            btnEstornar.onclick = () => estornarDespesa(d);
            acoes.appendChild(btnEstornar);
        }

        if (!d.dtQuitacao) {
            const btnEditar = document.createElement('button');
            btnEditar.type = 'button';
            btnEditar.classList.add('morador-row-btn');
            btnEditar.setAttribute('aria-label', 'Editar');
            btnEditar.innerHTML = '<span class="material-symbols-outlined">edit</span>';
            btnEditar.onclick = () => editarDespesa(d);
            acoes.appendChild(btnEditar);

            const btnDeletar = document.createElement('button');
            btnDeletar.type = 'button';
            btnDeletar.classList.add('morador-row-btn', 'danger');
            btnDeletar.setAttribute('aria-label', 'Excluir');
            btnDeletar.innerHTML = '<span class="material-symbols-outlined">delete</span>';
            btnDeletar.onclick = () => deletarDespesa(d.idDespesa);
            acoes.appendChild(btnDeletar);
        }
    });
}

function aplicarFiltros() {
    carregarDespesas();
}

function abrirFiltros() {
    const painel = document.getElementById('filtroDespesa');

    if (painel)
        painel.hidden = false;
}

function fecharFiltros() {
    const painel = document.getElementById('filtroDespesa');

    if (painel)
        painel.hidden = true;
}

function limparFiltros() {
    document.getElementById('filtroTipo').value = '';
    document.getElementById('filtroStatus').value = '';
    document.getElementById('filtroFixa').value = '';
    document.getElementById('filtroPeriodicidade').value = '';
    document.getElementById('filtroObservacao').value = '';
    document.getElementById('filtroVencimentoInicio').value = '';
    document.getElementById('filtroVencimentoFim').value = '';
    document.getElementById('filtroQuitacaoInicio').value = '';
    document.getElementById('filtroQuitacaoFim').value = '';
    document.getElementById('filtroDiasRestantes').value = '';

    carregarDespesas();
}

async function pagarDespesa(despesa) {
    const hoje = new Date();
    const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

    const confirmado = await confirmarAcaoDespesa('Registrar pagamento', 'Deseja marcar esta despesa como paga?', 'Registrar');
    if (!confirmado)
        return;

    const dtVencimentoEnvio = dataISO(despesa.dtVencimento);
    let url = `${URL}/${despesa.idDespesa}?valor=${despesa.valor}&observacoes=${encodeURIComponent(despesa.observacoes)}&dtVencimento=${dtVencimentoEnvio}&dtQuitacao=${dataHoje}&tipo=${encodeURIComponent(despesa.tipoDespesa.tipo)}&fixa=${despesa.fixa}`;

    if (despesa.periodicidade)
        url += `&periodicidade=${encodeURIComponent(despesa.periodicidade)}`;

    fetch(url, { method: 'PUT' })
        .then(response => response.json().then(data => ({ ok: response.ok, data })))
        .then(resultado => {
            if (!resultado.ok) {
                if (resultado.data.descricao)
                    exibirMensagem('error', resultado.data.descricao);
                else
                    exibirMensagem('error', 'Nao foi possivel registrar o pagamento.');
            }
            else {
                exibirMensagem('success', 'Pagamento registrado com sucesso!');
                carregarDespesas();
            }
        })
        .catch(error => console.error('Erro ao registrar pagamento:', error));
}

async function estornarDespesa(despesa) {
    const confirmado = await confirmarAcaoDespesa('Estornar pagamento', 'Deseja remover a quitação desta despesa?', 'Estornar');
    if (!confirmado)
        return;

    fetch(`${URL}/${despesa.idDespesa}/estornar`, { method: 'PUT' })
        .then(response => response.json().then(data => ({ ok: response.ok, data })))
        .then(resultado => {
            if (!resultado.ok) {
                if (resultado.data.descricao)
                    exibirMensagem('error', resultado.data.descricao);
                else
                    exibirMensagem('error', 'Nao foi possivel estornar a despesa.');
            }
            else {
                exibirMensagem('success', 'Pagamento estornado com sucesso!');
                carregarDespesas();
            }
        })
        .catch(error => console.error('Erro ao estornar pagamento:', error));
}

function salvarDespesa(event) {
    event.preventDefault();

    const id = document.getElementById('id').value;
    const tipo = document.getElementById('tipo').value;
    const valor = valorParaNumero(document.getElementById('valor').value);
    const dtVencimento = document.getElementById('dtVencimento').value;
    const dtQuitacao = document.getElementById('dtQuitacao').value;
    const observacoes = document.getElementById('observacoes').value;
    const fixa = document.getElementById('fixa').value;
    const periodicidade = document.getElementById('periodicidade').value;

    if (dtQuitacao !== '' && dtQuitacao > dtVencimento)
        exibirMensagem('error', 'A data de quitacao nao pode ser maior que a data de vencimento.');
    else if (fixa === 'true' && periodicidade === '')
        exibirMensagem('error', 'Informe a periodicidade da despesa fixa.');
    else {
        let url;
        let method;

        if (id) {
            url = `${URL}/${id}?valor=${valor}&observacoes=${encodeURIComponent(observacoes)}&dtVencimento=${dtVencimento}&tipo=${encodeURIComponent(tipo)}&fixa=${fixa}`;
            method = 'PUT';
        } else {
            url = `${URL}/cadastrar?valor=${valor}&observacoes=${encodeURIComponent(observacoes)}&dtVencimento=${dtVencimento}&tipo=${encodeURIComponent(tipo)}&fixa=${fixa}`;
            method = 'POST';
        }

        if (dtQuitacao !== '')
            url += `&dtQuitacao=${dtQuitacao}`;

        if (periodicidade !== '')
            url += `&periodicidade=${encodeURIComponent(periodicidade)}`;

        fetch(url, { method })
            .then(response => response.json().then(data => ({ ok: response.ok, data })))
            .then(resultado => {
                if (!resultado.ok) {
                    if (resultado.data.descricao)
                        exibirMensagem('error', resultado.data.descricao);
                    else
                        exibirMensagem('error', 'Nao foi possivel salvar a despesa.');
                }
                else {
                    if (id)
                        exibirMensagem('success', 'Despesa atualizada com sucesso!');
                    else
                        exibirMensagem('success', 'Despesa cadastrada com sucesso!');

                    carregarDespesas();
                    esconderFormulario();
                }
            })
            .catch(error => console.error('Erro ao salvar despesa:', error));
    }
}

function editarDespesa(despesa) {
    document.getElementById('id').value = despesa.idDespesa;
    document.getElementById('tipo').value = despesa.tipoDespesa.tipo;
    document.getElementById('valor').value = formatarValor(Number(despesa.valor).toFixed(2));
    document.getElementById('dtVencimento').value = dataISO(despesa.dtVencimento);
    document.getElementById('dtQuitacao').value = dataISO(despesa.dtQuitacao);
    document.getElementById('observacoes').value = despesa.observacoes;
    document.getElementById('fixa').value = String(despesa.fixa);

    if (despesa.periodicidade)
        document.getElementById('periodicidade').value = despesa.periodicidade;
    else
        document.getElementById('periodicidade').value = '';

    atualizarCamposDespesaFixa();

    mostrarFormulario('Editar Despesa');
}

async function deletarDespesa(id) {
    const confirmado = await confirmarAcaoDespesa('Excluir despesa', 'Deseja realmente excluir esta despesa?', 'Excluir');
    if (!confirmado)
        return;

    fetch(`${URL}/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.error || data.descricao) {
                if (data.descricao)
                    exibirMensagem('error', data.descricao);
                else
                    exibirMensagem('error', 'Nao foi possivel excluir a despesa.');
            }
            else {
                exibirMensagem('success', 'Despesa excluida com sucesso.');
                carregarDespesas();
            }
        })
        .catch(error => console.error('Erro ao deletar:', error));
}

function mostrarFormulario(titulo = 'Cadastrar Nova Despesa') {
    document.getElementById('formTitle').textContent = titulo;
    document.getElementById('formContainer').style.display = 'block';
}

function esconderFormulario() {
    document.getElementById('formContainer').style.display = 'none';
    document.getElementById('despesaForm').reset();
    document.getElementById('id').value = '';
    document.getElementById('fixa').value = 'false';
    atualizarCamposDespesaFixa();
}

function carregarTiposDespesa() {
    fetch(`${URL}/tiposDespesa`)
        .then(response => {
            if (!response.ok)
                throw new Error('Nao foi possivel carregar tipos de despesa.');

            return response.json();
        })
        .then(tipos => {
            const selectTipo = document.getElementById('tipo');
            const selectFiltro = document.getElementById('filtroTipo');

            let listaTipos = [];

            if (Array.isArray(tipos))
                listaTipos = tipos;

            listaTipos.forEach(t => {
                if (selectTipo && selectTipo.tagName === 'SELECT') {
                    const opcaoForm = document.createElement('option');
                    opcaoForm.value = t.tipo;
                    opcaoForm.textContent = formatarTipoDespesaLegivel(t.tipo);
                    selectTipo.appendChild(opcaoForm);
                }

                if (selectFiltro && selectFiltro.tagName === 'SELECT') {
                    const opcaoFiltro = document.createElement('option');
                    opcaoFiltro.value = t.tipo;
                    opcaoFiltro.textContent = formatarTipoDespesaLegivel(t.tipo);
                    selectFiltro.appendChild(opcaoFiltro);
                }
            });
        })
        .catch(error => console.error('Erro ao carregar tipos de despesa:', error));
}

function inicializarPaginaDespesa() {
    carregarTiposDespesa();
    carregarDespesas();
    atualizarCamposDespesaFixa();

    window.setTimeout(function () {
        const tbody = obterElementoTabelaDespesas();

        if (tbody && tbody.children.length === 0)
            carregarDespesas();
    }, 400);
}

document.addEventListener('DOMContentLoaded', carregarContextoUrl);
document.addEventListener('DOMContentLoaded', preencherPerfilTopo);
document.addEventListener('DOMContentLoaded', inicializarPaginaDespesa);
