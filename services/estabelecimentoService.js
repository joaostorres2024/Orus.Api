const { getPool, sql } = require('../config/database');

async function listarEstabelecimentos() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT id, nome, nome_fantasia, cnpj, email, telefone, cidade, uf, responsavel
    FROM dbo.estabelecimentos ORDER BY nome
  `);
  return result.recordset;
}

async function buscarPorId(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT id, nome, nome_fantasia, cnpj, inscricao_estadual, inscricao_municipal,
             regime_tributario, email, telefone, site, cep, endereco, numero,
             complemento, bairro, cidade, uf, responsavel, cargo, logo
      FROM dbo.estabelecimentos WHERE id = @id
    `);
  return result.recordset[0] || null;
}

async function criarEstabelecimento(dados) {
  const pool = await getPool();
  const result = await pool.request()
    .input('nome',                sql.VarChar, dados.nome)
    .input('nome_fantasia',       sql.VarChar, dados.nome_fantasia       || null)
    .input('cnpj',                sql.VarChar, dados.cnpj                || null)
    .input('inscricao_estadual',  sql.VarChar, dados.inscricao_estadual  || null)
    .input('inscricao_municipal', sql.VarChar, dados.inscricao_municipal || null)
    .input('regime_tributario',   sql.VarChar, dados.regime_tributario   || null)
    .input('email',               sql.VarChar, dados.email               || null)
    .input('telefone',            sql.VarChar, dados.telefone            || null)
    .input('site',                sql.VarChar, dados.site                || null)
    .input('cep',                 sql.VarChar, dados.cep                 || null)
    .input('endereco',            sql.VarChar, dados.endereco            || null)
    .input('numero',              sql.VarChar, dados.numero              || null)
    .input('complemento',         sql.VarChar, dados.complemento         || null)
    .input('bairro',              sql.VarChar, dados.bairro              || null)
    .input('cidade',              sql.VarChar, dados.cidade              || null)
    .input('uf',                  sql.VarChar, dados.uf                  || null)
    .input('responsavel',         sql.VarChar, dados.responsavel         || null)
    .input('cargo',               sql.VarChar, dados.cargo               || null)
    .input('logo',                sql.VarChar, dados.logo                || null)
    .query(`
      INSERT INTO dbo.estabelecimentos
        (nome, nome_fantasia, cnpj, inscricao_estadual, inscricao_municipal,
         regime_tributario, email, telefone, site, cep, endereco, numero,
         complemento, bairro, cidade, uf, responsavel, cargo, logo)
      OUTPUT INSERTED.id
      VALUES
        (@nome, @nome_fantasia, @cnpj, @inscricao_estadual, @inscricao_municipal,
         @regime_tributario, @email, @telefone, @site, @cep, @endereco, @numero,
         @complemento, @bairro, @cidade, @uf, @responsavel, @cargo, @logo)
    `);
  return buscarPorId(result.recordset[0].id);
}

async function atualizarEstabelecimento(id, dados) {
  const pool   = await getPool();
  const campos = [];
  const req    = pool.request().input('id', sql.Int, id);

  const mapa = {
    nome: sql.VarChar, nome_fantasia: sql.VarChar, cnpj: sql.VarChar,
    inscricao_estadual: sql.VarChar, inscricao_municipal: sql.VarChar,
    regime_tributario: sql.VarChar, email: sql.VarChar, telefone: sql.VarChar,
    site: sql.VarChar, cep: sql.VarChar, endereco: sql.VarChar,
    numero: sql.VarChar, complemento: sql.VarChar, bairro: sql.VarChar,
    cidade: sql.VarChar, uf: sql.VarChar, responsavel: sql.VarChar,
    cargo: sql.VarChar, logo: sql.VarChar,
  };

  for (const [campo, tipo] of Object.entries(mapa)) {
    if (dados[campo] !== undefined) {
      req.input(campo, tipo, dados[campo] || null);
      campos.push(`${campo} = @${campo}`);
    }
  }

  if (!campos.length) throw new Error('Nenhum campo para atualizar.');
  await req.query(`UPDATE dbo.estabelecimentos SET ${campos.join(', ')} WHERE id = @id`);
  return buscarPorId(id);
}

module.exports = { listarEstabelecimentos, buscarPorId, criarEstabelecimento, atualizarEstabelecimento };