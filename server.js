require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
 
const authRoutes          = require('./routes/authRoutes');
const usuarioRoutes       = require('./routes/usuarioRoutes');
const chamadoRoutes       = require('./routes/chamadoRoutes');
const configRoutes        = require('./routes/configRoutes');
const estabelecimentoRoutes = require('./routes/estabelecimentoRoutes');
 
const app = express();

app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  next()
}, express.static(path.join(__dirname, '..', 'uploads')))
 
app.use(cors());
app.use(express.json());
app.use('./uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));
 
// Rotas
app.use('/api/auth',            authRoutes);
app.use('/api/usuarios',        usuarioRoutes);
app.use('/api/chamados',        chamadoRoutes);
app.use('/api/config',          configRoutes);
app.use('/api/estabelecimentos', estabelecimentoRoutes);
 
// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('');
  console.log('┌─────────────────────────────────────────┐');
  console.log('│         ORUS API - SERVER STARTED       │');
  console.log('├─────────────────────────────────────────┤');
  console.log(`│  Port     : ${PORT}                        │`);
  console.log(`│  Mode     : ${process.env.NODE_ENV || 'development'}                 │`);
  console.log(`│  Base URL : http://localhost:${PORT}/api   │`);
  console.log('└─────────────────────────────────────────┘');
  console.log('');
});