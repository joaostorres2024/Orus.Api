const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { getPool, sql } = require('../config/database');

async function login(email, senha) {
  const pool = await getPool();

  const result = await pool.request()
    .input('email', sql.VarChar, email)
    .query(`
      SELECT u.id, u.nome, u.email, u.senha, u.role, u.status, u.estabelecimento_id,
             e.nome AS nome_estabelecimento
      FROM   dbo.usuarios u
      LEFT JOIN dbo.estabelecimentos e ON e.id = u.estabelecimento_id
      WHERE  u.email = @email
    `);

  const u = result.recordset[0];
  if (!u) throw new Error('E-mail ou senha inválidos.');
  if (u.status !== 'ativo') throw new Error('Usuário inativo. Contate o administrador.');

  const ok = await bcrypt.compare(senha, u.senha);
  if (!ok) throw new Error('E-mail ou senha inválidos.');

  const token = jwt.sign(
    { id: u.id, nome: u.nome, email: u.email, role: u.role, estabelecimento_id: u.estabelecimento_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return {
    token,
    usuario: {
      id: u.id, nome: u.nome, email: u.email,
      role: u.role, estabelecimento_id: u.estabelecimento_id,
      nome_estabelecimento: u.nome_estabelecimento,
    },
  };
}

module.exports = { login };