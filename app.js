const express = require('express');
const app = express();
const port = 3000 // Porta que a aplicação irá escutar

const path = require('path');

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
    res.redirect('/usuarios'); // ou res.redirect('/users');
});

// Middleware para permitir o uso do req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar o EJS como view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Simulação de uma lista de usuários (pode ser substituída por um banco de dados)
let users = [
    { id: 1, nome: 'Usuário 1', email: 'usuario1@gmail.com', dataNascimento: '1990-01-01', sexo: 'Masculino' },
    { id: 2, nome: 'Usuário 2', email: 'usuario2@gmail.com', dataNascimento: '1995-05-05', sexo: 'Feminino' },
    
];

function validarCPF(cpf) {
    // Remove todos os caracteres que não são dígitos
    cpf = cpf.replace(/\D/g, '');

    // Verifica se o CPF tem 11 dígitos
    if (cpf.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    // Calcula o primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;

    // Calcula o segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;

    // CPF válido
    return true;
}

// Função para validar a data de nascimento
function validarDataNascimento(dataNascimento) {
    const dataAtual = new Date();
    const dataNascimentoObj = new Date(dataNascimento);
    return dataNascimentoObj < dataAtual;
}

// Rota para renderizar a página de listagem de usuários
app.get('/usuarios', (req, res) => {
    res.render('users', { users });
});
// Rota para processar a exclusão de usuários
app.delete('/usuarios/:id', (req, res) => {
    const userId = parseInt(req.params.id); // Convertendo o ID para inteiro
    users = users.filter(user => user.id !== userId); // Filtrando os usuários para remover o usuário com o ID fornecido
    // Reatribuindo IDs aos usuários restantes
    users.forEach((user, index) => {
        user.id = index + 1;
    });
    res.redirect('/usuarios'); // Redireciona de volta para a página de usuários após a exclusão
});

// Função para validar a renda mensal (apenas valores numéricos e com até duas casas decimais)
function validarRendaMensal(rendaMensal) {
    // Verifica se é um número válido com até duas casas decimais
    return /^\d+(\.\d{1,2})?$/.test(rendaMensal);
}

// Função para validar o número
function validarNumero(numero) {
    return /^[0-9]+$/.test(numero);
}

// Função para validar o complemento (aceita texto livre)
function validarComplemento(complemento) {
    // Não é necessário validação específica, pois aceita texto livre
    return true;
}

// Rota para renderizar a página de cadastro de usuário
app.get('/cadastro', (req, res) => {
    res.render('cadastro', { mensagemErro: '', dadosFormulario: {} }); // Inicializa a variável dadosFormulario
});

// Rota para processar os dados do formulário de cadastro
app.post('/usuarios', (req, res) => {
    const { nome, cpf, dataNascimento, sexo, estadoCivil, rendaMensal, logradouro, estado, cidade, numero, complemento } = req.body;

    if (!nome || nome.trim() === '') {
        return res.render('cadastro', { mensagemErro: 'Nome é um campo obrigatório.', dadosFormulario: req.body });
    } else if (nome.trim().length < 3) {
        return res.render('cadastro', { mensagemErro: 'O nome deve conter mais de 3 caracteres.', dadosFormulario: req.body });
    }

    // Validação do CPF
    if (!cpf || cpf.trim() === '' || !validarCPF(cpf)) {
        return res.render('cadastro', { mensagemErro: 'CPF inválido. O CPF deve estar no formato XXX.XXX.XXX-XX.', dadosFormulario: req.body });
    }

    // Validação da data de nascimento
    if (!dataNascimento || dataNascimento.trim() === '' || !validarDataNascimento(dataNascimento)) {
        return res.render('cadastro', { mensagemErro: 'Data de nascimento inválida.', dadosFormulario: req.body });
    }

    // Validação do estado civil
    const estadosCivisValidos = ['Solteiro(a)', 'Casado(a)', 'Separado(a)', 'Divorciado(a)', 'Viúvo(a)'];
    if (!estadoCivil || estadoCivil.trim() === '' || !estadosCivisValidos.includes(estadoCivil)) {
        return res.render('cadastro', { mensagemErro: 'Estado civil inválido.', dadosFormulario: req.body });
    }

    // Validação da renda mensal
    if (!rendaMensal || rendaMensal.trim() === '' || !validarRendaMensal(rendaMensal)) {
        return res.render('cadastro', { mensagemErro: 'Renda mensal inválida. Insira apenas valores numéricos com até duas casas decimais.', dadosFormulario: req.body });
    }

    // Validação do logradouro
    if (!logradouro || logradouro.trim() === '' || logradouro.length < 3) {
        return res.render('cadastro', { mensagemErro: 'Logradouro inválido. O logradouro deve conter mais de 3 caracteres.', dadosFormulario: req.body });
    }

    // Validação do número
    if (!numero || numero.trim() === '' || !validarNumero(numero)) {
        return res.render('cadastro', { mensagemErro: 'Número inválido. Insira apenas números inteiros.', dadosFormulario: req.body });
    }

    // Validação do complemento
    if (!validarComplemento(complemento)) {
        return res.render('cadastro', { mensagemErro: 'Complemento inválido.', dadosFormulario: req.body });
    }

    // Se todas as validações passarem, adiciona o usuário à lista de usuários
    const newUser = {
        id: users.length + 1,
        nome,
        email: `${nome.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        dataNascimento,
        sexo,
        estadoCivil,
        rendaMensal,
        logradouro,
        estado,
        cidade,
        numero,
        complemento
    };
    users.push(newUser);

    res.redirect('/usuarios'); // Redireciona para a página de listagem de usuários após o cadastro
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
