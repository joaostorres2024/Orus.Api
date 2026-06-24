const svc = require('../services/estabelecimentoService');

async function listar(req, res) {
  try { res.json(await svc.listarEstabelecimentos()); }
  catch (err) { res.status(500).json({ message: err.message }); }
}

async function buscar(req, res) {
  try {
    const e = await svc.buscarPorId(+req.params.id);
    if (!e) return res.status(404).json({ message: 'Estabelecimento não encontrado.' });
    res.json(e);
  } catch (err) { res.status(500).json({ message: err.message }); }
}

async function criar(req, res) {
  try {
    if (!req.body.nome) return res.status(400).json({ message: 'Razão Social é obrigatória.' });
    res.status(201).json(await svc.criarEstabelecimento(req.body));
  } catch (err) { res.status(400).json({ message: err.message }); }
}

async function atualizar(req, res) {
  try {
    res.json(await svc.atualizarEstabelecimento(+req.params.id, req.body));
  } catch (err) { res.status(400).json({ message: err.message }); }
}

module.exports = { listar, buscar, criar, atualizar };