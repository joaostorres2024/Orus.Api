const svc = require('../services/usuarioService');

async function listar(req, res) {
  try {
    const { role, status, estabelecimento_id } = req.query;
    res.json(await svc.listarUsuarios({ role, status, estabelecimento_id: estabelecimento_id ? +estabelecimento_id : undefined }));
  } catch (err) { res.status(500).json({ message: err.message }); }
}

async function buscar(req, res) {
  try {
    const u = await svc.buscarPorId(+req.params.id);
    if (!u) return res.status(404).json({ message: 'Usuário não encontrado.' });
    res.json(u);
  } catch (err) { res.status(500).json({ message: err.message }); }
}

async function criar(req, res) {
  try {
    const { nome, email, senha, role, estabelecimento_id, status } = req.body;
    if (!nome || !email || !senha || !estabelecimento_id)
      return res.status(400).json({ message: 'Campos obrigatórios: nome, email, senha, estabelecimento_id.' });
    res.status(201).json(await svc.criarUsuario({ nome, email, senha, role, estabelecimento_id, status }));
  } catch (err) { res.status(400).json({ message: err.message }); }
}

async function atualizar(req, res) {
  try {
    res.json(await svc.atualizarUsuario(+req.params.id, req.body));
  } catch (err) { res.status(400).json({ message: err.message }); }
}

async function excluir(req, res) {
  try {
    res.json(await svc.excluirUsuario(+req.params.id));
  } catch (err) { res.status(500).json({ message: err.message }); }
}

module.exports = { listar, buscar, criar, atualizar, excluir };