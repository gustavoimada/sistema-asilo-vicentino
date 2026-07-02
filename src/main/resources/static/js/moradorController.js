const URL = '/morador';
const URL_FAMILIAR = '/composicaoFamiliar';
const URL_QUARTO = '/quarto';

let moradores = [];
let familiaresDisponiveis = [];
let familiaresDoFormulario = [];
let quartosDisponiveis = [];
let ordenacaoMoradores = '';
let direcaoOrdenacaoMoradores = 'asc';
let funcionarioLogado = null;

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
        return 'Secretária(o)';
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

function somenteDigitos(valor) {
    return String(valor || '').replace(/\D/g, '');
}

function formatarCpf(valor) {
    const numeros = somenteDigitos(valor).slice(0, 11);

    return numeros.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatarTelefone(valor) {
    const numeros = somenteDigitos(valor).slice(0, 11);

    if (numeros.length <= 10)
        return numeros.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
    else
        return numeros.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

function formatarCep(valor) {
    const numeros = somenteDigitos(valor).slice(0, 8);

    if (numeros.length <= 5)
        return numeros;
    else
        return numeros.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

function formatarData(data) {
    return (data || '').replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1');
}

function formatarGenero(genero) {
    if (genero === 'M')
        return 'M';
    else if (genero === 'F')
        return 'F';
    else
        return genero || '';
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

function validarTelefone(telefone) {
    const telefoneRegex = /^\(\d{2}\)\s\d{5}-\d{4}$/;

    return telefoneRegex.test(telefone);
}

function validarIdadeMinima(dtNascimento) {
    const hoje = new Date();
    const nascimento = new Date(dtNascimento);

    let idade = hoje.getFullYear() - nascimento.getFullYear();

    if (hoje < new Date(hoje.getFullYear(), nascimento.getMonth(), nascimento.getDate()))
        idade--;

    return idade >= 60;
}

function carregarFamiliaresDisponiveis() {
    fetch(`${URL_FAMILIAR}/listarTodos`)
        .then(response => {
            if (!response.ok)
                throw new Error('Nao foi possivel carregar familiares.');

            return response.json();
        })
        .then(lista => {
            familiaresDisponiveis = [];

            if (Array.isArray(lista))
                familiaresDisponiveis = lista;
            preencherSelectFamiliares();
        })
        .catch(error => console.error('Erro ao carregar familiares:', error));
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
            const restante = Math.max((quarto.capacidademax || 0) - (quarto.qtndHospedes || 0), 0);

            option.value = quarto.idQuartos;
            option.textContent = `Ala ${quarto.ala} - Quarto ${quarto.numero} - Restante ${restante}`;

            if (String(quarto.idQuartos) === String(quartoSelecionado))
                option.selected = true;

            select.appendChild(option);
        });
    }
}

function preencherSelectFamiliares() {
    const select = document.getElementById('familiarExistente');

    if (select) {
        select.innerHTML = '<option value="">Selecione um familiar...</option>';

        familiaresDisponiveis.forEach(familiar => {
            const option = document.createElement('option');
            let descricao = familiar.nome;

            if (familiar.cpf)
                descricao += ` - ${familiar.cpf}`;
            else
                descricao += ' - CPF nao informado';

            option.value = familiar.idComposicaoFamiliar;
            option.textContent = descricao;
            select.appendChild(option);
        });
    }
}

function alternarModoFamiliar() {
    const modoExistente = document.getElementById('modoFamiliarExistente').checked;
    const blocoExistente = document.getElementById('familiaresExistenteFields');
    const blocoNovo = document.getElementById('familiaresNovoFields');

    if (modoExistente) {
        blocoExistente.hidden = false;
        blocoNovo.hidden = true;
        blocoExistente.style.display = 'flex';
        blocoNovo.style.display = 'none';
    }
    else {
        blocoExistente.hidden = true;
        blocoNovo.hidden = false;
        blocoExistente.style.display = 'none';
        blocoNovo.style.display = 'block';
    }
}

function limparIndicadoresOrdenacaoMoradores() {
    document.getElementById('sort-id').textContent = '';
    document.getElementById('sort-nome').textContent = '';
    document.getElementById('sort-cpf').textContent = '';
    document.getElementById('sort-dtNascimento').textContent = '';
    document.getElementById('sort-endereco').textContent = '';
    document.getElementById('sort-cidade').textContent = '';

    document.getElementById('th-id').classList.remove('is-active');
    document.getElementById('th-nome').classList.remove('is-active');
    document.getElementById('th-cpf').classList.remove('is-active');
    document.getElementById('th-dtNascimento').classList.remove('is-active');
    document.getElementById('th-endereco').classList.remove('is-active');
    document.getElementById('th-cidade').classList.remove('is-active');
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
    const filtroDtNascimento = document.getElementById('filtroDtNascimento');
    const filtroEndereco = document.getElementById('filtroEndereco');
    const filtroCidade = document.getElementById('filtroCidade');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroTelefone = document.getElementById('filtroTelefone');
    let url;

    if (filtroNome != null) {
        const params = new URLSearchParams();

        if (filtroNome.value.trim() !== '')
            params.append('nome', filtroNome.value.trim());

        if (filtroCpf.value.trim() !== '')
            params.append('cpf', filtroCpf.value.trim());

        if (filtroDtNascimento.value !== '')
            params.append('dtNascimento', filtroDtNascimento.value);

        if (filtroEndereco.value.trim() !== '')
            params.append('endereco', filtroEndereco.value.trim());

        if (filtroCidade.value.trim() !== '')
            params.append('cidade', filtroCidade.value.trim());

        if (filtroEstado.value !== '')
            params.append('estado', filtroEstado.value);

        if (filtroTelefone.value.trim() !== '')
            params.append('telefone', filtroTelefone.value.trim());

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
    carregarFamiliaresDisponiveis();
    carregarQuartosDisponiveis();
    alternarModoFamiliar();

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

function carregarFamiliaresDoMorador(idMorador) {
    fetch(`${URL_FAMILIAR}/listar?moradorId=${idMorador}`)
        .then(response => {
            if (!response.ok)
                throw new Error('Nao foi possivel carregar os familiares do morador.');

            return response.json();
        })
        .then(lista => {
            familiaresDoFormulario = [];

            if (Array.isArray(lista))
                lista.forEach(item => {
                familiaresDoFormulario.push({
                    vinculo: item.vinculo,
                    composicaoFamiliar: {
                        idComposicaoFamiliar: item.composicaoFamiliar.idComposicaoFamiliar,
                        nome: item.composicaoFamiliar.nome,
                        telefone: item.composicaoFamiliar.telefone,
                        cpf: item.composicaoFamiliar.cpf
                    }
                });
                });

            renderizarFamiliaresDoFormulario();
        })
        .catch(error => {
            console.error('Erro ao carregar familiares do morador:', error);
            exibirMensagem('error', 'Nao foi possivel carregar os familiares do morador.');
        });
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

    listaMoradores.forEach(m => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = m.idMorador;
        row.insertCell(1).textContent = m.nome;
        row.insertCell(2).textContent = formatarGenero(m.genero);
        row.insertCell(3).textContent = m.cpf;
        row.insertCell(4).textContent = formatarData(m.dtNascimento);
        row.insertCell(5).textContent = formatarAlaQuarto(m);
        row.insertCell(6).textContent = `${m.endereco}, ${m.numero}`;
        row.insertCell(7).textContent = `${m.cidade}/${m.estado}`;
        row.insertCell(8).textContent = m.telefone;

        const acoes = row.insertCell(9);

        const btnEditar = document.createElement('button');
        btnEditar.type = 'button';
        btnEditar.classList.add('morador-row-btn');
        btnEditar.setAttribute('aria-label', 'Editar');
        btnEditar.innerHTML = '<span class="material-symbols-outlined">edit</span>';
        btnEditar.onclick = () => editarMorador(m);

        const btnDeletar = document.createElement('button');
        btnDeletar.type = 'button';
        btnDeletar.classList.add('morador-row-btn', 'danger');
        btnDeletar.setAttribute('aria-label', 'Excluir');
        btnDeletar.innerHTML = '<span class="material-symbols-outlined">delete</span>';
        btnDeletar.onclick = () => deletarMorador(m.idMorador);

        acoes.classList.add('morador-actions-cell');
        acoes.appendChild(btnEditar);
        acoes.appendChild(btnDeletar);
    });
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
    document.getElementById('filtroDtNascimento').value = '';
    document.getElementById('filtroEndereco').value = '';
    document.getElementById('filtroCidade').value = '';
    document.getElementById('filtroEstado').value = '';
    document.getElementById('filtroTelefone').value = '';

    carregarMoradores();
}

function renderizarFamiliaresDoFormulario() {
    const tbody = document.getElementById('listaFamiliaresMorador');

    if (!tbody)
        return;

    tbody.innerHTML = '';

    familiaresDoFormulario.forEach(function (item, indice) {
        const row = tbody.insertRow();
        const nome = item.composicaoFamiliar.nome || '-';
        const vinculo = item.vinculo || '-';
        const telefone = item.composicaoFamiliar.telefone || '-';
        const cpf = item.composicaoFamiliar.cpf || '-';

        row.insertCell(0).textContent = nome;
        row.insertCell(1).textContent = vinculo;
        row.insertCell(2).textContent = telefone;
        row.insertCell(3).textContent = cpf;

        const acoes = row.insertCell(4);

        const btnExcluir = document.createElement('button');
        btnExcluir.type = 'button';
        btnExcluir.classList.add('morador-row-btn', 'danger');
        btnExcluir.innerHTML = '<span class="material-symbols-outlined">delete</span>';
        btnExcluir.onclick = () => {
            familiaresDoFormulario.splice(indice, 1);
            renderizarFamiliaresDoFormulario();
        };

        acoes.classList.add('morador-actions-cell');
        acoes.appendChild(btnExcluir);
    });
}

function adicionarFamiliarAoFormulario() {
    const modoExistente = document.getElementById('modoFamiliarExistente').checked;
    const vinculo = document.getElementById('familiarVinculo').value.trim();
    let familiar = null;

    if (vinculo === '')
        exibirMensagem('error', 'Informe o vinculo do familiar.');
    else {
        if (modoExistente) {
            const familiarId = Number(document.getElementById('familiarExistente').value);

            familiaresDisponiveis.forEach(function (item) {
                if (item.idComposicaoFamiliar === familiarId)
                    familiar = item;
            });

            if (familiar == null)
                exibirMensagem('error', 'Selecione um familiar existente.');
        }
        else {
            const nome = document.getElementById('familiarNome').value.trim();
            const telefone = formatarTelefone(document.getElementById('familiarTelefone').value);
            const cpf = formatarCpf(document.getElementById('familiarCpf').value);

            document.getElementById('familiarTelefone').value = telefone;
            document.getElementById('familiarCpf').value = cpf;

            if (nome === '')
                exibirMensagem('error', 'Informe o nome do familiar.');
            else if (telefone !== '' && !validarTelefone(telefone))
                exibirMensagem('error', 'Telefone do familiar invalido.');
            else if (cpf !== '' && !validarCpf(cpf))
                exibirMensagem('error', 'CPF do familiar invalido.');
            else
                familiar = {
                    idComposicaoFamiliar: 0,
                    nome: nome,
                    telefone: telefone,
                    cpf: cpf
                };
        }

        if (familiar != null) {
            const duplicado = verificarFamiliarDuplicado(familiar);

            if (duplicado)
                exibirMensagem('error', 'Este familiar ja foi adicionado ao morador.');
            else {
                familiaresDoFormulario.push({
                    vinculo: vinculo,
                    composicaoFamiliar: familiar
                });

                limparFormularioFamiliar();
                renderizarFamiliaresDoFormulario();
            }
        }
    }
}

function verificarFamiliarDuplicado(familiar) {
    const idFamiliar = Number(familiar.idComposicaoFamiliar || 0);
    let duplicado = false;

    familiaresDoFormulario.forEach(function (item) {
        const idAtual = Number(item.composicaoFamiliar.idComposicaoFamiliar || 0);
        const cpfAtual = item.composicaoFamiliar.cpf || '';
        const cpfNovo = familiar.cpf || '';

        if (idFamiliar > 0 && idAtual === idFamiliar)
            duplicado = true;
        else if (cpfNovo !== '' && cpfAtual !== '' && cpfAtual === cpfNovo)
            duplicado = true;
    });

    return duplicado;
}

function limparFormularioFamiliar() {
    document.getElementById('familiarExistente').value = '';
    document.getElementById('familiarNome').value = '';
    document.getElementById('familiarTelefone').value = '';
    document.getElementById('familiarCpf').value = '';
    document.getElementById('familiarVinculo').value = '';
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
    const telefone = formatarTelefone(document.getElementById('telefone').value);
    const quartoId = document.getElementById('quartoId').value;

    document.getElementById('cpf').value = cpf;
    document.getElementById('cep').value = cep;
    document.getElementById('telefone').value = telefone;

    if (genero === '')
        exibirMensagem('error', 'Selecione o genero do morador.');
    else if (quartoId === '')
        exibirMensagem('error', 'Selecione um quarto disponivel.');
    else if (!validarCpf(cpf))
        exibirMensagem('error', 'CPF invalido. Use o formato xxx.xxx.xxx-xx.');
    else if (!validarTelefone(telefone))
        exibirMensagem('error', 'Telefone invalido. Use o formato (xx) xxxxx-xxxx.');
    else if (!validarCep(cep))
        exibirMensagem('error', 'CEP invalido. Use o formato xxxxx-xxx.');
    else if (!validarIdadeMinima(dtNascimento))
        exibirMensagem('error', 'Data de nascimento invalida. O morador precisa ter 60 anos ou mais.');
    else {
        let url;
        let method;
        let familiares = '';

        familiaresDoFormulario.forEach(function (item, indice) {
            const familiar = item.composicaoFamiliar;
            const idComposicaoFamiliar = familiar.idComposicaoFamiliar || 0;
            const nomeFamiliar = familiar.nome || '';
            const telefoneFamiliar = familiar.telefone || '';
            const cpfFamiliar = familiar.cpf || '';
            const vinculoFamiliar = item.vinculo || '';

            if (indice > 0)
                familiares += '||';

            familiares += `${idComposicaoFamiliar};;${nomeFamiliar};;${telefoneFamiliar};;${cpfFamiliar};;${vinculoFamiliar}`;
        });

        if (id) {
            url = `${URL}/editarCompleto/${id}?nome=${encodeURIComponent(nome)}&cpf=${encodeURIComponent(cpf)}&genero=${encodeURIComponent(genero)}&dtNascimento=${dtNascimento}&endereco=${encodeURIComponent(endereco)}&numero=${numero}&cidade=${encodeURIComponent(cidade)}&estado=${estado}&cep=${encodeURIComponent(cep)}&telefone=${encodeURIComponent(telefone)}&quartoId=${quartoId}`;
            method = 'PUT';
        } else {
            url = `${URL}/cadastrarCompleto?nome=${encodeURIComponent(nome)}&cpf=${encodeURIComponent(cpf)}&genero=${encodeURIComponent(genero)}&dtNascimento=${dtNascimento}&endereco=${encodeURIComponent(endereco)}&numero=${numero}&cidade=${encodeURIComponent(cidade)}&estado=${estado}&cep=${encodeURIComponent(cep)}&telefone=${encodeURIComponent(telefone)}&quartoId=${quartoId}`;
            method = 'POST';
        }

        if (familiares !== '')
            url += `&familiares=${encodeURIComponent(familiares)}`;

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
                    carregarFamiliaresDisponiveis();
                    carregarQuartosDisponiveis();
                    esconderFormulario();
                }
            })
            .catch(error => console.error('Erro ao salvar morador:', error));
    }
}

function editarMorador(morador) {
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
    document.getElementById('telefone').value = morador.telefone;
    carregarQuartosDisponiveis(morador.quartoId || '');
    familiaresDoFormulario = [];
    renderizarFamiliaresDoFormulario();

    mostrarFormulario('Editar Morador');
    carregarFamiliaresDoMorador(morador.idMorador);
}

function deletarMorador(id) {
    if (confirm('Tem certeza que deseja excluir este morador?')) {
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
                    carregarMoradores();
                    carregarQuartosDisponiveis();
                }
            })
            .catch(error => console.error('Erro ao deletar:', error));
    }
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
    familiaresDoFormulario = [];
    renderizarFamiliaresDoFormulario();
    limparFormularioFamiliar();
    document.getElementById('modoFamiliarExistente').checked = true;
    alternarModoFamiliar();
    carregarQuartosDisponiveis();
}

document.addEventListener('DOMContentLoaded', async function () {
    await carregarFuncionarioSessao();
    preencherPerfilTopo();
    inicializarPaginaMorador();
});
