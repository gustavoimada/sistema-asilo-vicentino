const URL = '/morador';
const URL_FAMILIAR = '/composicaoFamiliar';
const URL_QUARTO = '/quarto';
const CAPACIDADE_POR_QUARTO = 2;

let moradores = [];
let quartosDisponiveis = [];
let ordenacaoMoradores = '';
let direcaoOrdenacaoMoradores = 'asc';
let funcionarioLogado = null;
let ultimoCepConsultado = '';
let cepEmConsulta = '';
let estadoContatoResponsavel = 'pronto';

function parseJsonSeguro(response) {
    return response.json().catch(function () {
        return {};
    });
}

async function carregarFuncionarioSessao() {
    const response = await fetch('/login/sessao', { credentials: 'include' });
    const data = await parseJsonSeguro(response);

    if (response.ok)
        funcionarioLogado = data;
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
    const funcionario = funcionarioLogado || {};
    const nome = String(funcionario.nome || 'Usuario').trim();
    const categoria = String(funcionario.categoria || '').trim();
    let cargoTexto = 'Acesso';

    if (categoria !== '')
        cargoTexto = formatarCargoInclusivo(categoria);

    if (document.getElementById('perfilNome'))
        document.getElementById('perfilNome').textContent = nome || 'Usuario';

    if (document.getElementById('perfilCargo'))
        document.getElementById('perfilCargo').textContent = cargoTexto;
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

function confirmarAcaoMorador(titulo, mensagem, textoConfirmar = 'Confirmar') {
    let modal = document.getElementById('confirmacaoMoradorModal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'confirmacaoMoradorModal';
        modal.className = 'confirm-overlay';
        modal.innerHTML = `
            <div class="confirm-box">
                <h4 id="confirmacaoMoradorTitulo"></h4>
                <p id="confirmacaoMoradorMensagem"></p>
                <div class="confirm-actions">
                    <button type="button" class="btn btn-secondary" id="cancelarConfirmacaoMorador">Cancelar</button>
                    <button type="button" class="btn btn-danger" id="confirmarConfirmacaoMorador"></button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('confirmacaoMoradorTitulo').textContent = titulo;
    document.getElementById('confirmacaoMoradorMensagem').textContent = mensagem;
    document.getElementById('confirmarConfirmacaoMorador').textContent = textoConfirmar;

    return new Promise((resolve) => {
        const cancelar = document.getElementById('cancelarConfirmacaoMorador');
        const confirmar = document.getElementById('confirmarConfirmacaoMorador');

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

function somenteDigitos(valor) {
    return String(valor || '').replace(/\D/g, '');
}

function formatarCpf(valor) {
    const numeros = somenteDigitos(valor).slice(0, 11);

    return numeros.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function inferirTipoTelefone(valor) {
    const numeros = somenteDigitos(valor);
    return numeros.length === 10 && numeros.slice(2, 6) === '3269' ? 'fixo' : 'celular';
}

function obterTipoTelefoneResponsavel() {
    return document.getElementById('responsavelTipoTelefone')?.value || 'celular';
}

function formatarTelefone(valor, tipo) {
    const modo = tipo || inferirTipoTelefone(valor);
    const numeros = somenteDigitos(valor);

    if (modo === 'fixo') {
        if (!numeros) return '';
        const sufixo = numeros.length >= 10 && numeros.slice(2, 6) === '3269'
            ? numeros.slice(6, 10)
            : numeros.slice(-4);
        return `(18) 3269-${sufixo}`;
    }

    const celular = numeros.slice(0, 11);
    if (celular.length <= 10)
        return celular.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
    return celular.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

function atualizarTipoTelefoneResponsavel() {
    const campo = document.getElementById('responsavelTelefone');
    const ajuda = document.getElementById('responsavelTelefoneAjuda');
    const tipo = obterTipoTelefoneResponsavel();
    if (!campo) return;
    campo.value = tipo === 'fixo' ? formatarTelefone(campo.value, 'fixo') : '';
    campo.placeholder = tipo === 'fixo' ? '(18) 3269-0000' : '(00) 00000-0000';
    campo.maxLength = tipo === 'fixo' ? 14 : 15;
    if (ajuda) ajuda.textContent = tipo === 'fixo' ? 'Fixo: prefixo (18) 3269-XXXX' : 'Celular: (DD) 99999-9999';
}

function formatarCep(valor) {
    const numeros = somenteDigitos(valor).slice(0, 8);

    if (numeros.length <= 5)
        return numeros;
    else
        return numeros.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

function atualizarStatusCep(mensagem = '', tipo = '') {
    const status = document.getElementById('cepStatus');

    if (!status)
        return;

    status.textContent = mensagem;
    status.className = `cep-status${tipo ? ` is-${tipo}` : ''}`;
}

function preencherEnderecoPorCep(endereco) {
    const campoEndereco = document.getElementById('endereco');
    const campoCidade = document.getElementById('cidade');
    const campoEstado = document.getElementById('estado');

    if (campoEndereco && endereco.logradouro)
        campoEndereco.value = endereco.logradouro;

    if (campoCidade && endereco.localidade)
        campoCidade.value = endereco.localidade;

    if (campoEstado && endereco.uf && campoEstado.querySelector(`option[value="${endereco.uf}"]`))
        campoEstado.value = endereco.uf;
}

async function consultarEnderecoPorCep() {
    const campoCep = document.getElementById('cep');
    if (!campoCep)
        return;

    const cep = somenteDigitos(campoCep.value);
    if (cep.length !== 8) {
        ultimoCepConsultado = '';
        cepEmConsulta = '';
        atualizarStatusCep('');
        return;
    }

    if (cep === ultimoCepConsultado || cep === cepEmConsulta)
        return;

    cepEmConsulta = cep;
    campoCep.setAttribute('aria-busy', 'true');
    atualizarStatusCep('Buscando endereço...', 'loading');

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
            headers: { Accept: 'application/json' }
        });

        if (!response.ok)
            throw new Error('Falha ao consultar CEP');

        const endereco = await response.json();

        if (cep !== somenteDigitos(campoCep.value))
            return;

        ultimoCepConsultado = cep;

        if (endereco.erro) {
            atualizarStatusCep('CEP não encontrado. Preencha o endereço manualmente.', 'error');
            return;
        }

        preencherEnderecoPorCep(endereco);
        if (endereco.logradouro)
            atualizarStatusCep('Endereço preenchido automaticamente. Confira o número.', 'success');
        else
            atualizarStatusCep('Cidade e estado preenchidos. Informe a rua e o número.', 'success');
    }
    catch (error) {
        if (cep === somenteDigitos(campoCep.value))
            atualizarStatusCep('Não foi possível consultar o CEP. Preencha o endereço manualmente.', 'error');
    }
    finally {
        if (cep === cepEmConsulta) {
            cepEmConsulta = '';
            campoCep.removeAttribute('aria-busy');
        }
    }
}

function formatarData(data) {
    return (data || '').replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1');
}

function escaparHtml(valor) {
    const div = document.createElement('div');
    div.textContent = valor == null ? '' : String(valor);
    return div.innerHTML;
}

function calcularIdade(dtNascimento) {
    if (!dtNascimento)
        return '';

    const nascimento = new Date(dtNascimento);

    if (Number.isNaN(nascimento.getTime()))
        return '';

    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const aniversarioJaPassou = hoje >= new Date(hoje.getFullYear(), nascimento.getMonth(), nascimento.getDate());

    if (!aniversarioJaPassou)
        idade--;

    return idade > 0 ? String(idade) : '';
}

function formatarGenero(genero) {
    if (genero === 'M')
        return 'Masculino';
    else if (genero === 'F')
        return 'Feminino';
    else
        return genero || '';
}

function obterClasseGenero(genero) {
    if (genero === 'M')
        return 'masculino';
    else if (genero === 'F')
        return 'feminino';
    else
        return 'indefinido';
}

function formatarAlaQuarto(morador) {
    let descricao = '';

    if (morador.quarto && morador.quarto.ala != null && morador.quarto.numero != null)
        descricao = `Ala ${morador.quarto.ala} - Quarto ${morador.quarto.numero}`;
    else if (morador.quartoId != null && morador.quartoId !== '')
        descricao = `Quarto ${morador.quartoId}`;

    return descricao;
}

function validarCpf(cpf) {
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

    return cpfRegex.test(cpf);
}

function validarCep(cep) {
    const cepRegex = /^\d{5}-\d{3}$/;

    return cepRegex.test(cep);
}

function validarTelefone(telefone, tipo) {
    return tipo === 'fixo'
        ? /^\(18\)\s3269-\d{4}$/.test(telefone)
        : /^\(\d{2}\)\s\d{5}-\d{4}$/.test(telefone);
}

function validarIdadeMinima(dtNascimento) {
    const hoje = new Date();
    const nascimento = new Date(dtNascimento);

    let idade = hoje.getFullYear() - nascimento.getFullYear();

    if (hoje < new Date(hoje.getFullYear(), nascimento.getMonth(), nascimento.getDate()))
        idade--;

    return idade >= 60;
}

function carregarQuartosDisponiveis(quartoAtualId = '') {
    let url = `${URL_QUARTO}/listarDisponiveis`;

    if (quartoAtualId !== '' && quartoAtualId != null)
        url += `?quartoAtualId=${quartoAtualId}`;

    fetch(url)
        .then(response => response.json())
        .then(lista => {
            quartosDisponiveis = [];

            if (Array.isArray(lista))
                quartosDisponiveis = lista;
            preencherSelectQuartos(quartoAtualId);
        })
        .catch(error => console.error('Erro ao carregar quartos:', error));
}

function preencherSelectQuartos(quartoSelecionado = '') {
    const select = document.getElementById('quartoId');
    const generoSelect = document.getElementById('genero');
    let genero = '';

    if (generoSelect)
        genero = generoSelect.value;

    if (select) {
        select.innerHTML = '<option value="">Selecione um quarto</option>';

        quartosDisponiveis.forEach(quarto => {
            if (genero !== '' && String(quarto.ala || '').toUpperCase() !== String(genero).toUpperCase())
                return;

            const option = document.createElement('option');
            const ocupacao = Math.min(Math.max(Number.parseInt(quarto.qtndHospedes, 10) || 0, 0), CAPACIDADE_POR_QUARTO);
            const vagasLivres = CAPACIDADE_POR_QUARTO - ocupacao;
            const descricaoVagas = vagasLivres === 0
                ? 'Lotado'
                : `${vagasLivres} ${vagasLivres === 1 ? 'vaga livre' : 'vagas livres'}`;

            option.value = quarto.idQuartos;
            option.textContent = `Ala ${quarto.ala} - Quarto ${quarto.numero} - ${descricaoVagas}`;

            if (String(quarto.idQuartos) === String(quartoSelecionado))
                option.selected = true;

            select.appendChild(option);
        });
    }
}

function limparIndicadoresOrdenacaoMoradores() {
    ['nome', 'cpf', 'dtNascimento', 'endereco', 'cidade'].forEach(function (campo) {
        const indicador = document.getElementById(`sort-${campo}`);
        const th = document.getElementById(`th-${campo}`);

        if (indicador)
            indicador.textContent = '';

        if (th)
            th.classList.remove('is-active');
    });
}

function atualizarIndicadoresOrdenacaoMoradores() {
    let indicador;
    let th;

    limparIndicadoresOrdenacaoMoradores();

    if (ordenacaoMoradores !== '') {
        indicador = document.getElementById(`sort-${ordenacaoMoradores}`);
        th = document.getElementById(`th-${ordenacaoMoradores}`);

        if (indicador) {
            if (direcaoOrdenacaoMoradores === 'asc')
                indicador.textContent = '^';
            else
                indicador.textContent = 'v';
        }

        if (th)
            th.classList.add('is-active');
    }
}

function definirOrdenacaoMoradores(campo) {
    if (ordenacaoMoradores === campo) {
        if (direcaoOrdenacaoMoradores === 'asc')
            direcaoOrdenacaoMoradores = 'desc';
        else
            direcaoOrdenacaoMoradores = 'asc';
    }
    else {
        ordenacaoMoradores = campo;
        direcaoOrdenacaoMoradores = 'asc';
    }

    carregarMoradores();
}

function carregarMoradores() {
    const filtroNome = document.getElementById('filtroNome');
    const filtroCpf = document.getElementById('filtroCpf');
    const filtroDtNascimentoInicio = document.getElementById('filtroDtNascimentoInicio');
    const filtroDtNascimentoFim = document.getElementById('filtroDtNascimentoFim');
    const filtroEndereco = document.getElementById('filtroEndereco');
    const filtroCidade = document.getElementById('filtroCidade');
    const filtroEstado = document.getElementById('filtroEstado');
    let url;

    if (filtroNome != null) {
        const params = new URLSearchParams();

        if (filtroNome.value.trim() !== '')
            params.append('nome', filtroNome.value.trim());

        if (filtroCpf.value.trim() !== '')
            params.append('cpf', filtroCpf.value.trim());

        if (filtroDtNascimentoInicio.value !== '')
            params.append('dtNascimentoInicio', filtroDtNascimentoInicio.value);

        if (filtroDtNascimentoFim.value !== '')
            params.append('dtNascimentoFim', filtroDtNascimentoFim.value);

        if (filtroEndereco.value.trim() !== '')
            params.append('endereco', filtroEndereco.value.trim());

        if (filtroCidade.value.trim() !== '')
            params.append('cidade', filtroCidade.value.trim());

        if (filtroEstado.value !== '')
            params.append('estado', filtroEstado.value);

        if (ordenacaoMoradores !== '')
            params.append('ordenacao', ordenacaoMoradores);

        params.append('direcao', direcaoOrdenacaoMoradores);

        url = `${URL}/filtrar?${params.toString()}`;
    }
    else
        url = `${URL}/listar?ordenacao=${encodeURIComponent(ordenacaoMoradores)}&direcao=${encodeURIComponent(direcaoOrdenacaoMoradores)}`;

    fetch(url)
        .then(response => {
            if (!response.ok)
                throw new Error('Nao foi possivel carregar moradores.');

            return response.json();
        })
        .then(listaMoradores => {
            moradores = [];

            if (Array.isArray(listaMoradores))
                moradores = listaMoradores;
            renderizarMoradores(moradores);
        })
        .catch(error => console.error('Erro ao carregar moradores:', error));
}

function inicializarPaginaMorador() {
    carregarMoradores();
    carregarQuartosDisponiveis();

    const generoSelect = document.getElementById('genero');

    if (generoSelect)
        generoSelect.addEventListener('change', function () {
            const idAtual = document.getElementById('id').value;
            const selectQuarto = document.getElementById('quartoId');
            let quartoSelecionado = '';

            if (selectQuarto)
                quartoSelecionado = selectQuarto.value;

            if (idAtual !== '')
                carregarQuartosDisponiveis(quartoSelecionado);
            else
                preencherSelectQuartos();
        });

    window.setTimeout(function () {
        const tbody = document.getElementById('listaMoradores');

        if (tbody && tbody.children.length === 0)
            carregarMoradores();
    }, 400);
}

async function buscarContatoResponsavel(idMorador) {
    const response = await fetch(`${URL_FAMILIAR}/responsavel/${idMorador}`);

    if (response.status === 204)
        return null;

    if (!response.ok) {
        const erro = await parseJsonSeguro(response);
        throw new Error(erro.descricao || 'Nao foi possivel carregar o contato responsavel.');
    }

    return response.json();
}

async function carregarContatoResponsavelMorador(idMorador) {
    estadoContatoResponsavel = 'carregando';

    try {
        const contato = await buscarContatoResponsavel(idMorador);
        limparContatoResponsavel();

        if (contato)
            preencherContatoResponsavel(contato);

        estadoContatoResponsavel = 'pronto';
    } catch (error) {
        estadoContatoResponsavel = 'erro';
        console.error('Erro ao carregar contato responsavel:', error);
        exibirMensagem('error', error.message || 'Nao foi possivel carregar o contato responsavel.');
    }
}

function preencherContatoResponsavel(contato) {
    document.getElementById('responsavelId').value = contato.id || 0;
    document.getElementById('responsavelNome').value = contato.nome || '';
    const tipoTelefone = inferirTipoTelefone(contato.telefone || '');
    const tipoEl = document.getElementById('responsavelTipoTelefone');
    if (tipoEl) tipoEl.value = tipoTelefone;
    atualizarTipoTelefoneResponsavel();
    document.getElementById('responsavelTelefone').value = formatarTelefone(contato.telefone || '', tipoTelefone);
    document.getElementById('responsavelCpf').value = contato.cpf || '';
    document.getElementById('responsavelVinculo').value = contato.vinculo || '';
}

function renderizarMoradores(moradores) {
    const tbody = document.getElementById('listaMoradores');

    if (!tbody)
        return;

    tbody.innerHTML = '';
    atualizarIndicadoresOrdenacaoMoradores();

    let listaMoradores = [];

    if (Array.isArray(moradores))
        listaMoradores = moradores;

    if (listaMoradores.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="placeholder-table">Nenhum morador cadastrado.</div>
                </td>
            </tr>
        `;
        return;
    }

    listaMoradores.forEach(m => {
        const row = tbody.insertRow();
        const idade = calcularIdade(m.dtNascimento);
        const generoTexto = formatarGenero(m.genero);
        const quartoTexto = formatarAlaQuarto(m);
        const enderecoCurto = [m.endereco, m.numero].filter(Boolean).join(', ');
        const localizacao = [m.cidade, m.estado].filter(Boolean).join('/');
        const idMorador = Number(m.idMorador) || 0;

        row.insertCell(0).innerHTML = `
            <div class="morador-primary">
                <strong>${escaparHtml(m.nome || 'Sem nome')}</strong>
                <span>CPF ${escaparHtml(m.cpf || '-')}</span>
                <div class="morador-tags">
                    <span class="morador-badge genero-${obterClasseGenero(m.genero)}">${escaparHtml(generoTexto || 'Nao informado')}</span>
                    <span class="morador-badge idade">${idade ? escaparHtml(idade + ' anos') : 'Idade nao informada'}</span>
                </div>
            </div>
        `;

        row.insertCell(1).innerHTML = quartoTexto
            ? `<span class="morador-quarto-badge">${escaparHtml(quartoTexto)}</span>`
            : `<span class="morador-quarto-badge alerta">Sem quarto</span>`;

        row.insertCell(2).innerHTML = `
            <div class="morador-info-block">
                <strong>${escaparHtml(localizacao || '-')}</strong>
                <span>${escaparHtml(enderecoCurto || 'Endereco nao informado')}</span>
            </div>
        `;

        const acoes = row.insertCell(3);

        const btnDetalhes = document.createElement('button');
        btnDetalhes.type = 'button';
        btnDetalhes.classList.add('morador-row-btn', 'view');
        btnDetalhes.setAttribute('aria-label', 'Ver detalhes');
        btnDetalhes.setAttribute('data-tooltip', 'Visualizar');
        btnDetalhes.innerHTML = '<span class="material-symbols-outlined">visibility</span>';
        btnDetalhes.onclick = () => abrirDetalhesMorador(idMorador);

        const btnEditar = document.createElement('button');
        btnEditar.type = 'button';
        btnEditar.classList.add('morador-row-btn');
        btnEditar.setAttribute('aria-label', 'Editar');
        btnEditar.setAttribute('data-tooltip', 'Editar');
        btnEditar.innerHTML = '<span class="material-symbols-outlined">edit</span>';
        btnEditar.onclick = () => editarMorador(m);

        const btnDeletar = document.createElement('button');
        btnDeletar.type = 'button';
        btnDeletar.classList.add('morador-row-btn', 'danger');
        btnDeletar.setAttribute('aria-label', 'Excluir');
        btnDeletar.setAttribute('data-tooltip', 'Excluir');
        btnDeletar.innerHTML = '<span class="material-symbols-outlined">delete</span>';
        btnDeletar.onclick = () => deletarMorador(m.idMorador);

        acoes.classList.add('morador-actions-cell');
        acoes.appendChild(btnDetalhes);
        acoes.appendChild(btnEditar);
        acoes.appendChild(btnDeletar);
    });
}

function montarLinhaDetalhe(rotulo, valor) {
    return `
        <div class="morador-detail-item">
            <span>${rotulo}</span>
            <strong>${escaparHtml(valor || '-')}</strong>
        </div>
    `;
}

function renderizarResponsaveisDetalhes(vinculos) {
    if (!Array.isArray(vinculos) || vinculos.length === 0) {
        return `
            <div class="morador-empty-responsavel">
                Nenhum responsavel cadastrado para este morador.
            </div>
        `;
    }

    return vinculos.map(function (vinculo) {
        return `
            <div class="morador-responsavel-card">
                <div>
                    <span>${escaparHtml(vinculo.vinculo || 'Responsavel')}</span>
                    <strong>${escaparHtml(vinculo.nome || 'Sem nome')}</strong>
                </div>
                <p>${escaparHtml(vinculo.telefone || 'Telefone nao informado')}</p>
                <p>CPF ${escaparHtml(vinculo.cpf || '-')}</p>
            </div>
        `;
    }).join('');
}

async function carregarResponsaveisMorador(idMorador) {
    const contato = await buscarContatoResponsavel(idMorador);
    return contato ? [contato] : [];
}

async function abrirDetalhesMorador(idMorador) {
    const modal = document.getElementById('moradorDetalhesModal');
    const conteudo = document.getElementById('moradorDetalhesConteudo');
    const titulo = document.getElementById('moradorDetalhesTitulo');
    const morador = moradores.find(item => Number(item.idMorador) === Number(idMorador));

    if (!modal || !conteudo || !morador)
        return;

    const idade = calcularIdade(morador.dtNascimento);
    const quartoTexto = formatarAlaQuarto(morador) || 'Sem quarto';
    const endereco = [morador.endereco, morador.numero].filter(Boolean).join(', ');
    const cidadeEstado = [morador.cidade, morador.estado].filter(Boolean).join('/');

    titulo.textContent = morador.nome || 'Detalhes do morador';
    conteudo.innerHTML = '<div class="morador-detail-loading">Carregando detalhes...</div>';
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');

    try {
        const responsaveis = await carregarResponsaveisMorador(idMorador);
        conteudo.innerHTML = `
            <section class="morador-detail-section">
                <h4>Dados principais</h4>
                <div class="morador-detail-grid">
                    ${montarLinhaDetalhe('CPF', morador.cpf)}
                    ${montarLinhaDetalhe('G&ecirc;nero', formatarGenero(morador.genero))}
                    ${montarLinhaDetalhe('Nascimento', formatarData(morador.dtNascimento))}
                    ${montarLinhaDetalhe('Idade', idade ? idade + ' anos' : '')}
                    ${montarLinhaDetalhe('Quarto', quartoTexto)}
                </div>
            </section>
            <section class="morador-detail-section">
                <h4>Endere&ccedil;o</h4>
                <div class="morador-detail-grid">
                    ${montarLinhaDetalhe('Logradouro', endereco)}
                    ${montarLinhaDetalhe('Cidade/UF', cidadeEstado)}
                    ${montarLinhaDetalhe('CEP', morador.cep)}
                </div>
            </section>
            <section class="morador-detail-section">
                <h4>Respons&aacute;vel</h4>
                <div class="morador-responsaveis-list">
                    ${renderizarResponsaveisDetalhes(responsaveis)}
                </div>
            </section>
        `;
    } catch (error) {
        conteudo.innerHTML = `
            <div class="morador-empty-responsavel">
                Nao foi possivel carregar os detalhes do responsavel.
            </div>
        `;
    }
}

function fecharDetalhesMorador() {
    const modal = document.getElementById('moradorDetalhesModal');

    if (modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    }
}

function aplicarFiltros() {
    carregarMoradores();
}

function abrirFiltros() {
    const painel = document.getElementById('filtroMorador');

    if (painel)
        painel.hidden = false;
}

function fecharFiltros() {
    const painel = document.getElementById('filtroMorador');

    if (painel)
        painel.hidden = true;
}

function limparFiltros() {
    document.getElementById('filtroNome').value = '';
    document.getElementById('filtroCpf').value = '';
    document.getElementById('filtroDtNascimentoInicio').value = '';
    document.getElementById('filtroDtNascimentoFim').value = '';
    document.getElementById('filtroEndereco').value = '';
    document.getElementById('filtroCidade').value = '';
    document.getElementById('filtroEstado').value = '';

    carregarMoradores();
}

function limparContatoResponsavel() {
    document.getElementById('responsavelId').value = '';
    document.getElementById('responsavelNome').value = '';
    document.getElementById('responsavelTelefone').value = '';
    const tipoEl = document.getElementById('responsavelTipoTelefone');
    if (tipoEl) tipoEl.value = 'celular';
    atualizarTipoTelefoneResponsavel();
    document.getElementById('responsavelCpf').value = '';
    document.getElementById('responsavelVinculo').value = '';
}

function montarContatoResponsavel() {
    const id = Number(document.getElementById('responsavelId').value || 0);
    const nome = document.getElementById('responsavelNome').value.trim();
    const tipoTelefone = obterTipoTelefoneResponsavel();
    const telefone = formatarTelefone(document.getElementById('responsavelTelefone').value, tipoTelefone);
    const cpf = formatarCpf(document.getElementById('responsavelCpf').value);
    const vinculo = document.getElementById('responsavelVinculo').value.trim();
    const temContato = nome !== '' || telefone !== '' || cpf !== '' || vinculo !== '';

    document.getElementById('responsavelTelefone').value = telefone;
    document.getElementById('responsavelCpf').value = cpf;

    if (!temContato)
        return { valido: true, valor: '' };
    else if (nome === '')
        return { valido: false, mensagem: 'Informe o nome do contato responsavel.' };
    else if (telefone !== '' && !validarTelefone(telefone, tipoTelefone))
        return { valido: false, mensagem: 'Telefone do contato responsavel invalido.' };
    else if (cpf !== '' && !validarCpf(cpf))
        return { valido: false, mensagem: 'CPF do contato responsavel invalido.' };
    else if (vinculo === '')
        return { valido: false, mensagem: 'Informe o vinculo do contato responsavel.' };

    return {
        valido: true,
        valor: `${id};;${nome};;${telefone};;${cpf};;${vinculo}`
    };
}

function salvarMorador(event) {
    event.preventDefault();

    const id = document.getElementById('id').value;
    const nome = document.getElementById('nome').value;
    const cpf = formatarCpf(document.getElementById('cpf').value);
    const genero = document.getElementById('genero').value;
    const dtNascimento = document.getElementById('dtNascimento').value;
    const endereco = document.getElementById('endereco').value;
    const numero = document.getElementById('numero').value;
    const cidade = document.getElementById('cidade').value;
    const estado = document.getElementById('estado').value;
    const cep = formatarCep(document.getElementById('cep').value);
    const quartoId = document.getElementById('quartoId').value;

    document.getElementById('cpf').value = cpf;
    document.getElementById('cep').value = cep;

    if (genero === '')
        exibirMensagem('error', 'Selecione o genero do morador.');
    else if (quartoId === '')
        exibirMensagem('error', 'Selecione um quarto disponivel.');
    else if (!validarCpf(cpf))
        exibirMensagem('error', 'CPF invalido. Use o formato xxx.xxx.xxx-xx.');
    else if (!validarCep(cep))
        exibirMensagem('error', 'CEP invalido. Use o formato xxxxx-xxx.');
    else if (!validarIdadeMinima(dtNascimento))
        exibirMensagem('error', 'Data de nascimento invalida. O morador precisa ter 60 anos ou mais.');
    else {
        let url;
        let method;
        const contatoResponsavel = montarContatoResponsavel();

        if (!contatoResponsavel.valido) {
            exibirMensagem('error', contatoResponsavel.mensagem);
            return;
        }

        if (id && estadoContatoResponsavel !== 'pronto') {
            const mensagem = estadoContatoResponsavel === 'carregando'
                ? 'Aguarde o carregamento do contato responsavel.'
                : 'Reabra a edicao para carregar o contato responsavel antes de salvar.';
            exibirMensagem('error', mensagem);
            return;
        }

        if (id) {
            url = `${URL}/editarCompleto/${id}?nome=${encodeURIComponent(nome)}&cpf=${encodeURIComponent(cpf)}&genero=${encodeURIComponent(genero)}&dtNascimento=${dtNascimento}&endereco=${encodeURIComponent(endereco)}&numero=${numero}&cidade=${encodeURIComponent(cidade)}&estado=${estado}&cep=${encodeURIComponent(cep)}&quartoId=${quartoId}`;
            method = 'PUT';
        } else {
            url = `${URL}/cadastrarCompleto?nome=${encodeURIComponent(nome)}&cpf=${encodeURIComponent(cpf)}&genero=${encodeURIComponent(genero)}&dtNascimento=${dtNascimento}&endereco=${encodeURIComponent(endereco)}&numero=${numero}&cidade=${encodeURIComponent(cidade)}&estado=${estado}&cep=${encodeURIComponent(cep)}&quartoId=${quartoId}`;
            method = 'POST';
        }

        if (id || contatoResponsavel.valor !== '')
            url += `&familiares=${encodeURIComponent(contatoResponsavel.valor)}`;

        fetch(url, { method })
            .then(response => response.json())
            .then(data => {
                if (data.error || data.descricao) {
                    if (data.descricao)
                        exibirMensagem('error', data.descricao);
                    else
                        exibirMensagem('error', 'Nao foi possivel salvar o morador.');
                }
                else {
                    if (id)
                        exibirMensagem('success', 'Morador atualizado com sucesso!');
                    else
                        exibirMensagem('success', 'Morador cadastrado com sucesso!');

                    carregarMoradores();
                    carregarQuartosDisponiveis();
                    esconderFormulario();
                }
            })
            .catch(error => console.error('Erro ao salvar morador:', error));
    }
}

function editarMorador(morador) {
    estadoContatoResponsavel = 'carregando';
    document.getElementById('id').value = morador.idMorador;
    document.getElementById('nome').value = morador.nome;
    document.getElementById('cpf').value = morador.cpf;
    document.getElementById('genero').value = morador.genero || '';
    document.getElementById('dtNascimento').value = morador.dtNascimento;
    document.getElementById('endereco').value = morador.endereco;
    document.getElementById('numero').value = morador.numero;
    document.getElementById('cidade').value = morador.cidade;
    document.getElementById('estado').value = morador.estado;
    document.getElementById('cep').value = morador.cep;
    carregarQuartosDisponiveis(morador.quartoId || '');
    limparContatoResponsavel();

    mostrarFormulario('Editar Morador');
    carregarContatoResponsavelMorador(morador.idMorador);
}

async function deletarMorador(id) {
    const confirmado = await confirmarAcaoMorador('Excluir morador', 'Deseja realmente excluir este morador?', 'Excluir');
    if (!confirmado)
        return;

    fetch(`${URL}/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data && (data.error || data.descricao)) {
                if (data.descricao)
                    exibirMensagem('error', data.descricao);
                else
                    exibirMensagem('error', data.error);
            }
            else
            {
                exibirMensagem('success', 'Morador excluido com sucesso.');
                carregarMoradores();
                carregarQuartosDisponiveis();
            }
        })
        .catch(error => console.error('Erro ao deletar:', error));
}

function mostrarFormulario(titulo = 'Cadastrar Novo Morador') {
    document.getElementById('formTitle').textContent = titulo;
    document.getElementById('formContainer').hidden = false;
    document.getElementById('formContainer').style.display = 'block';

    if (document.getElementById('id').value === '')
        carregarQuartosDisponiveis();
}

function esconderFormulario() {
    document.getElementById('formContainer').hidden = true;
    document.getElementById('formContainer').style.display = 'none';
    document.getElementById('moradorForm').reset();
    document.getElementById('id').value = '';
    ultimoCepConsultado = '';
    cepEmConsulta = '';
    estadoContatoResponsavel = 'pronto';
    atualizarStatusCep('');
    limparContatoResponsavel();
    carregarQuartosDisponiveis();
}

document.addEventListener('DOMContentLoaded', async function () {
    await carregarFuncionarioSessao();
    preencherPerfilTopo();
    inicializarPaginaMorador();

    const campoCep = document.getElementById('cep');
    if (campoCep) {
        campoCep.addEventListener('input', consultarEnderecoPorCep);
        campoCep.addEventListener('blur', consultarEnderecoPorCep);
    }

    const modalDetalhes = document.getElementById('moradorDetalhesModal');

    if (modalDetalhes) {
        modalDetalhes.addEventListener('click', function (event) {
            if (event.target === modalDetalhes)
                fecharDetalhesMorador();
        });
    }

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape')
            fecharDetalhesMorador();
    });
});
