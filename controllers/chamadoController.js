const svc    = require('../services/chamadoService');
const upload = require('../config/upload');
const path   = require('path');

async function listar(req, res) {
  try {
    const { status, prioridade, estabelecimento_id } = req.query;
    const isAdm = req.user.role === 'adm';
    res.json(await svc.listarChamados({
      usuario_id: req.user.id,
      role: req.user.role,
      // adm só filtra por estabelecimento se vier explicitamente na query
      // usuário normal usa o próprio estabelecimento_id
      estabelecimento_id: isAdm
        ? (estabelecimento_id ? +estabelecimento_id : null)
        : req.user.estabelecimento_id,
      status,
      prioridade,
    }));
  } catch (err) { res.status(500).json({ message: err.message }); }
}

async function buscar(req, res) {
  try {
    const c = await svc.buscarPorId(+req.params.id);
    if (!c) return res.status(404).json({ message: 'Chamado não encontrado.' });
    res.json(c);
  } catch (err) { res.status(500).json({ message: err.message }); }
}

async function criar(req, res) {
  try {
    const { titulo, descricao, prioridade } = req.body;
    if (!titulo || !descricao)
      return res.status(400).json({ message: 'Campos obrigatórios: titulo, descricao.' });
    res.status(201).json(await svc.criarChamado({
      titulo, descricao, prioridade,
      usuario_id: req.user.id,
      estabelecimento_id: req.user.estabelecimento_id,
    }));
  } catch (err) { res.status(400).json({ message: err.message }); }
}

async function atualizar(req, res) {
  try {
    res.json(await svc.atualizarChamado(+req.params.id, req.body));
  } catch (err) { res.status(400).json({ message: err.message }); }
}

async function comentar(req, res) {
  try {
    const { texto } = req.body;
    if (!texto) return res.status(400).json({ message: 'Texto é obrigatório.' });
    res.json(await svc.adicionarComentario({ chamado_id: +req.params.id, usuario_id: req.user.id, texto }));
  } catch (err) { res.status(400).json({ message: err.message }); }
}

async function anexar(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    res.json(await svc.adicionarAnexo({
      chamado_id:    +req.params.id,
      usuario_id:    req.user.id,
      nome_arquivo:  req.file.originalname,
      caminho:       req.file.filename,
      tamanho_bytes: req.file.size,
      mime_type:     req.file.mimetype,
    }));
  } catch (err) { res.status(400).json({ message: err.message }); }
}

async function dashboard(req, res) {
  try {
    res.json(await svc.dashboardStats({
      role: req.user.role,
      usuario_id: req.user.id,
    }));
  } catch (err) { res.status(500).json({ message: err.message }); }
}

module.exports = { listar, buscar, criar, atualizar, comentar, anexar, dashboard };