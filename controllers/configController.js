const svc = require('../services/configService');

async function listar(req, res) {
  try { res.json(await svc.listarConfigs()); }
  catch (err) { res.status(500).json({ message: err.message }); }
}

async function atualizar(req, res) {
  try {
    if (!req.body || !Object.keys(req.body).length)
      return res.status(400).json({ message: 'Nenhuma configuração enviada.' });
    res.json(await svc.atualizarConfigs(req.body));
  } catch (err) { res.status(400).json({ message: err.message }); }
}

module.exports = { listar, atualizar };