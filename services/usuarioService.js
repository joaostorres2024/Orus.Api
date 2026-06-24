const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/database');

async function listarUsuarios({ role, status, estabelecimento_id } = {}) {
  const pool = await getPool();
  const req  = pool.request();
  let where  = 'WHERE 1=1';

  if (role)              { req.input('role',   sql.VarChar, role);              where += ' AND u.role = @role'; }
  if (status)            { req.input('status', sql.VarChar, status);            where += ' AND u.status = @status'; }
  if (estabelecimento_id){ req.input('estab',  sql.Int,     estabelecimento_id); where += ' AND u.estabelecimento_id = @estab'; }

  const result = await req.query(`
    SELECT u.id, u.nome, u.email, u.role, u.status, u.estabelecimento_id, u.created_at,
           e.nome AS nome_estabelecimento
    FROM   dbo.usuarios u
    LEFT JOIN dbo.estabelecimentos e ON e.id = u.estabelecimento_id
    ${where}
    ORDER BY u.nome
  `);
  return result.recordset;
}

async function buscarPorId(id) {
  const pool   = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT u.id, u.nome, u.email, u.role, u.status, u.estabelecimento_id, u.created_at,
             e.nome AS nome_estabelecimento
      FROM   dbo.usuarios u
      LEFT JOIN dbo.estabelecimentos e ON e.id = u.estabelecimento_id
      WHERE  u.id = @id
    `);
  return result.recordset[0] || null;
}

async function criarUsuario({ nome, email, senha, role = 'usuario', estabelecimento_id, status = 'ativo' }) {
  const pool = await getPool();

  const dup = await pool.request()
    .input('email', sql.VarChar, email)
    .query('SELECT id FROM dbo.usuarios WHERE email = @email');
  if (dup.recordset.length) throw new Error('E-mail já cadastrado.');

  const hash   = await bcrypt.hash(senha, 10);
  const result = await pool.request()
    .input('nome',              sql.VarChar, nome)
    .input('email',             sql.VarChar, email)
    .input('senha',             sql.VarChar, hash)
    .input('role',              sql.VarChar, role)
    .input('estabelecimento_id',sql.Int,     estabelecimento_id)
    .input('status',            sql.VarChar, status)
    .query(`
      INSERT INTO dbo.usuarios (nome, email, senha, role, estabelecimento_id, status, created_at, updated_at)
      OUTPUT INSERTED.id
      VALUES (@nome, @email, @senha, @role, @estabelecimento_id, @status, GETDATE(), GETDATE())
    `);

  return buscarPorId(result.recordset[0].id);
}

async function atualizarUsuario(id, dados) {
  const pool   = await getPool();
  const campos = [];
  const req    = pool.request().input('id', sql.Int, id);

  if (dados.email) {
    const dup = await pool.request()
      .input('email', sql.VarChar, dados.email)
      .input('id',    sql.Int,     id)
      .query('SELECT id FROM dbo.usuarios WHERE email = @email AND id <> @id');
    if (dup.recordset.length) throw new Error('E-mail já está em uso por outro usuário.');
    req.input('email', sql.VarChar, dados.email); campos.push('email = @email');
  }
  if (dados.nome)              { req.input('nome',   sql.VarChar, dados.nome);              campos.push('nome = @nome'); }
  if (dados.role)              { req.input('role',   sql.VarChar, dados.role);              campos.push('role = @role'); }
  if (dados.status)            { req.input('status', sql.VarChar, dados.status);            campos.push('status = @status'); }
  if (dados.estabelecimento_id){ req.input('estab',  sql.Int,     dados.estabelecimento_id); campos.push('estabelecimento_id = @estab'); }
  if (dados.senha) {
    req.input('senha', sql.VarChar, await bcrypt.hash(dados.senha, 10));
    campos.push('senha = @senha');
  }

  if (!campos.length) throw new Error('Nenhum campo para atualizar.');
  campos.push('updated_at = GETDATE()');

  await req.query(`UPDATE dbo.usuarios SET ${campos.join(', ')} WHERE id = @id`);
  return buscarPorId(id);
}

async function excluirUsuario(id) {
  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, id)
    .query(`UPDATE dbo.usuarios SET status = 'inativo', updated_at = GETDATE() WHERE id = @id`);
  return { message: 'Usuário desativado com sucesso.' };
}


module.exports = { listarUsuarios, buscarPorId, criarUsuario, atualizarUsuario, excluirUsuario };