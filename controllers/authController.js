const authService = require('../services/authService');

async function login(req, res) {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    const data = await authService.login(email, senha);
    res.json(data);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
}

function me(req, res) {
  res.json({ usuario: req.user });
}

module.exports = { login, me };