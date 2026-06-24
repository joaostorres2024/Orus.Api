const { getPool, sql } = require('../config/database');

async function listarChamados({ usuario_id, role, estabelecimento_id, status, prioridade } = {}) {
  const pool = await getPool();
  const req  = pool.request();
  let where  = 'WHERE 1=1';

  if (role !== 'adm') {
    req.input('uid', sql.Int, usuario_id); where += ' AND c.usuario_id = @uid';
  } else if (estabelecimento_id) {
    // adm pode filtrar por estabelecimento se quiser, mas não é obrigatório
    req.input('estab', sql.Int, estabelecimento_id); where += ' AND c.estabelecimento_id = @estab';
  }
  // se adm e sem estabelecimento_id → sem filtro, vê todos
  if (status)    { req.input('status',    sql.VarChar, status);    where += ' AND c.status = @status'; }
  if (prioridade){ req.input('prio',      sql.VarChar, prioridade);where += ' AND c.prioridade = @prio'; }

  const result = await req.query(`
    SELECT
      c.id, c.titulo, c.descricao, c.prioridade, c.status, c.created_at, c.updated_at,
      c.usuario_id,         u.nome  AS nome_usuario,
      c.estabelecimento_id, e.nome  AS nome_estabelecimento,
      c.atribuido_a,        adm.nome AS nome_atribuido,
      (SELECT COUNT(*) FROM dbo.chamado_comentarios WHERE chamado_id = c.id) AS total_comentarios,
      (SELECT COUNT(*) FROM dbo.chamado_anexos       WHERE chamado_id = c.id) AS total_anexos
    FROM dbo.chamados c
    LEFT JOIN dbo.usuarios u          ON u.id   = c.usuario_id
    LEFT JOIN dbo.usuarios adm        ON adm.id = c.atribuido_a
    LEFT JOIN dbo.estabelecimentos e  ON e.id   = c.estabelecimento_id
    ${where}
    ORDER BY CASE c.prioridade WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END, c.created_at DESC
  `);
  return result.recordset;
}

async function buscarPorId(id) {
  const pool = await getPool();

  const chamado = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT c.id, c.titulo, c.descricao, c.prioridade, c.status, c.created_at, c.updated_at,
             c.usuario_id, u.nome AS nome_usuario,
             c.estabelecimento_id, e.nome AS nome_estabelecimento,
             c.atribuido_a, adm.nome AS nome_atribuido
      FROM dbo.chamados c
      LEFT JOIN dbo.usuarios u         ON u.id   = c.usuario_id
      LEFT JOIN dbo.usuarios adm       ON adm.id = c.atribuido_a
      LEFT JOIN dbo.estabelecimentos e ON e.id   = c.estabelecimento_id
      WHERE c.id = @id
    `);
  if (!chamado.recordset[0]) return null;

  const comentarios = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT cc.id, cc.texto, cc.created_at, u.nome AS nome_usuario, u.role
      FROM dbo.chamado_comentarios cc
      JOIN dbo.usuarios u ON u.id = cc.usuario_id
      WHERE cc.chamado_id = @id ORDER BY cc.created_at
    `);

  const anexos = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT ca.id, ca.nome_arquivo, ca.caminho, ca.tamanho_bytes, ca.mime_type, ca.created_at,
             u.nome AS nome_usuario
      FROM dbo.chamado_anexos ca
      JOIN dbo.usuarios u ON u.id = ca.usuario_id
      WHERE ca.chamado_id = @id ORDER BY ca.created_at
    `);

  return { ...chamado.recordset[0], comentarios: comentarios.recordset, anexos: anexos.recordset };
}

async function criarChamado({ titulo, descricao, prioridade = 'media', usuario_id, estabelecimento_id }) {
  const pool   = await getPool();
  const result = await pool.request()
    .input('titulo',             sql.VarChar, titulo)
    .input('descricao',          sql.Text,    descricao)
    .input('prioridade',         sql.VarChar, prioridade)
    .input('usuario_id',         sql.Int,     usuario_id)
    .input('estabelecimento_id', sql.Int,     estabelecimento_id)
    .query(`
      INSERT INTO dbo.chamados (titulo, descricao, prioridade, status, usuario_id, estabelecimento_id, created_at, updated_at)
      OUTPUT INSERTED.id
      VALUES (@titulo, @descricao, @prioridade, 'aberto', @usuario_id, @estabelecimento_id, GETDATE(), GETDATE())
    `);
  return buscarPorId(result.recordset[0].id);
}

async function atualizarChamado(id, { status, prioridade, atribuido_a }) {
  const pool   = await getPool();
  const campos = [];
  const req    = pool.request().input('id', sql.Int, id);

  if (status)               { req.input('status', sql.VarChar, status);    campos.push('status = @status'); }
  if (prioridade)           { req.input('prio',   sql.VarChar, prioridade);campos.push('prioridade = @prio'); }
  if (atribuido_a !== undefined){ req.input('atrib', sql.Int, atribuido_a);campos.push('atribuido_a = @atrib'); }

  if (!campos.length) throw new Error('Nenhum campo para atualizar.');
  campos.push('updated_at = GETDATE()');
  await req.query(`UPDATE dbo.chamados SET ${campos.join(', ')} WHERE id = @id`);
  return buscarPorId(id);
}

async function adicionarComentario({ chamado_id, usuario_id, texto }) {
  const pool = await getPool();
  await pool.request()
    .input('chamado_id', sql.Int,  chamado_id)
    .input('usuario_id', sql.Int,  usuario_id)
    .input('texto',      sql.Text, texto)
    .query(`INSERT INTO dbo.chamado_comentarios (chamado_id, usuario_id, texto, created_at) VALUES (@chamado_id, @usuario_id, @texto, GETDATE())`);
  await pool.request()
    .input('id', sql.Int, chamado_id)
    .query(`UPDATE dbo.chamados SET updated_at = GETDATE() WHERE id = @id`);
  return { message: 'Comentário adicionado.' };
}

async function adicionarAnexo({ chamado_id, usuario_id, nome_arquivo, caminho, tamanho_bytes, mime_type }) {
  const pool = await getPool();
  await pool.request()
    .input('chamado_id',    sql.Int,     chamado_id)
    .input('usuario_id',    sql.Int,     usuario_id)
    .input('nome_arquivo',  sql.VarChar, nome_arquivo)
    .input('caminho',       sql.VarChar, caminho)
    .input('tamanho_bytes', sql.Int,     tamanho_bytes)
    .input('mime_type',     sql.VarChar, mime_type)
    .query(`INSERT INTO dbo.chamado_anexos (chamado_id, usuario_id, nome_arquivo, caminho, tamanho_bytes, mime_type, created_at) VALUES (@chamado_id, @usuario_id, @nome_arquivo, @caminho, @tamanho_bytes, @mime_type, GETDATE())`);
  return { message: 'Anexo salvo.' };
}

async function dashboardStats({ role, usuario_id } = {}) {
  const pool    = await getPool();
  const isAdm   = role === 'adm';
  const filtro  = isAdm ? '' : 'WHERE usuario_id = @uid';
  const filtroMes = isAdm ? 'WHERE created_at >= DATEADD(MONTH, -6, GETDATE())' : 'WHERE usuario_id = @uid AND created_at >= DATEADD(MONTH, -6, GETDATE())';

  const reqStats = pool.request();
  const reqMes   = pool.request();
  if (!isAdm) {
    reqStats.input('uid', sql.Int, usuario_id);
    reqMes.input('uid',   sql.Int, usuario_id);
  }

  const stats = await reqStats.query(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'aberto'       THEN 1 ELSE 0 END) AS abertos,
      SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END) AS em_andamento,
      SUM(CASE WHEN status = 'resolvido'    THEN 1 ELSE 0 END) AS resolvidos,
      SUM(CASE WHEN status = 'fechado'      THEN 1 ELSE 0 END) AS fechados,
      SUM(CASE WHEN prioridade = 'alta'     THEN 1 ELSE 0 END) AS alta_prioridade
    FROM dbo.chamados ${filtro}
  `);

  const porMes = await reqMes.query(`
    SELECT FORMAT(created_at, 'yyyy-MM') AS mes, COUNT(*) AS total
    FROM dbo.chamados
    ${filtroMes}
    GROUP BY FORMAT(created_at, 'yyyy-MM')
    ORDER BY mes
  `);

  const result = {
    chamados: stats.recordset[0],
    por_mes:  porMes.recordset,
  };

  // Total de usuários só aparece para adm
  if (isAdm) {
    const usuarios = await pool.request().query(
      `SELECT COUNT(*) AS total FROM dbo.usuarios WHERE status = 'ativo'`
    );
    result.total_usuarios = usuarios.recordset[0].total;
  }

  return result;
}

module.exports = { listarChamados, buscarPorId, criarChamado, atualizarChamado, adicionarComentario, adicionarAnexo, dashboardStats };