const db = require("@data/db");
const validarEmail = require("@data/validacoes/ValidarUsuarios/validarEmail");
const { Usuario_ID } = require("../../../Types/Usuarios/consultar/usuarioID");
const { criarHash } = require("../../../../autenticacao/hash");
const perfilDefault = 3;
const statuDefault = 'ATIVO';
const Token = require("../../../../autenticacao/token");

module.exports = {
    async novoUsuario(user, req) {
        try {
            // Verifica se o e-mail já está cadastrado
            const emailExistente = await validarEmail(user.email);
            if (emailExistente) {
                throw new Error(`Usuário já cadastrado com esse email: ${user.email}`);
            }

            // Cria o hash da senha
            const senhaHash = await criarHash(user.senha);

            // Cria um novo objeto de usuário
            let UsuarioEnviado = {
                nome: user.nome,
                email: user.email,
                senha: senhaHash,
                perfil: user.perfil || perfilDefault, // Usa perfil padrão se não fornecido
                status: user.status || statuDefault // Usa status padrão se não fornecido
            };

            // Insere o usuário no banco de dados
            const usuarioInserido = await db('usuarios').insert(UsuarioEnviado);


            if (!usuarioInserido) throw new Error("Erro ao inserir usuario");

            const usuario = await Usuario_ID(...usuarioInserido);

            // Associa o perfil ao usuário na tabela de relacionamento
            let UsuarioPerfil = {
                usuario_id: usuario.id,
                perfil_id: user.perfil || perfilDefault
            };
            await db("usuario-perfis").insert(UsuarioPerfil);

            console.log(`Usuário com ID: ${usuario.id} e Nome: ${user.nome} cadastrado com sucesso!`);


            const token = Token.gerarToken(usuario);
            if (!token) throw new Error("Token Invalido");

            req.headers = {
                authorization: `Bearer ${token}`
            }
            console.log(req.headers);

            return Usuario_ID(usuarioInserido);
        } catch (error) {
            throw new Error(`Erro ao criar usuário: ${error.message}`);
        }
    }
};
