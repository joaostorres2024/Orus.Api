const { getPool, sql } = require('../config/database');

async function listarConfigs() {
  const pool   = await getPool();
  const result = await pool.request().query('SELECT chave, valor, descricao FROM dbo.site_config ORDER BY chave');
  return result.recordset.reduce((acc, r) => { acc[r.chave] = { valor: r.valor, descricao: r.descricao }; return acc; }, {});
}

async function atualizarConfigs(configs) {
  const pool = await getPool();
  for (const [chave, valor] of Object.entries(configs)) {
    await pool.request()
      .input('chave', sql.VarChar, chave)
      .input('valor', sql.VarChar, valor)
      .query(`UPDATE dbo.site_config SET valor = @valor, updated_at = GETDATE() WHERE chave = @chave`);
  }
  return listarConfigs();
}

module.exports = { listarConfigs, atualizarConfigs };