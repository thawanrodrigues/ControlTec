'use strict';

/**
 * redeploy_controltec.js
 * Re-deploy rápido do ControlTec — apenas envia e atualiza o código,
 * sem recriar nginx ou certbot (já configurados no primeiro deploy).
 * Usa prisma db push para manter o banco existente seguro.
 */

const { NodeSSH } = require('node-ssh');
const { execSync }  = require('child_process');
const path          = require('path');
const fs            = require('fs');
const os            = require('os');

const ssh = new NodeSSH();

// ── VPS ────────────────────────────────────────────────────────────────────
const VPS = {
  host:     '2.25.109.173',
  username: 'root',
  password: 'Conecta211895@',
};

// ── Config ─────────────────────────────────────────────────────────────────
const DOMAIN      = 'app1.conectasistemas.sbs';
const API_PORT    = 3000;
const REMOTE_DIR  = '/var/www/controltec';
const PM2_NAME    = 'controltec-api';
const DB_URL      = 'postgresql://controltec:controltec_pass@localhost:5432/controltecdb?schema=public';

// ── Paths ──────────────────────────────────────────────────────────────────
const CONTROLTEC_DIR = __dirname;
const ARCHIVE_NAME   = 'controltec_deploy.tar.gz';
const ARCHIVE_LOCAL  = path.join(CONTROLTEC_DIR, ARCHIVE_NAME);

async function exec(cmd, cwd = '/root') {
  console.log(`\n> Executing in ${cwd}: ${cmd}`);
  const r = await ssh.execCommand(cmd, { cwd });
  if (r.stdout && r.stdout.trim()) process.stdout.write(r.stdout.trim() + '\n');
  if (r.stderr && r.stderr.trim()) process.stderr.write(r.stderr.trim() + '\n');
  if (r.code !== 0 && r.code !== null) console.error(`Command failed with code ${r.code}`);
  return r;
}

function step(msg) { console.log(`\n${'─'.repeat(55)}\n${msg}\n${'─'.repeat(55)}`); }

function packProject() {
  step('📦 EMPACOTANDO PROJETO');
  if (fs.existsSync(ARCHIVE_LOCAL)) fs.unlinkSync(ARCHIVE_LOCAL);
  execSync(
    `tar -czf "${ARCHIVE_NAME}" --exclude="node_modules" --exclude=".git" --exclude=".expo" --exclude="dist" --exclude="*.tar.gz" --exclude="*.zip" .`,
    { cwd: CONTROLTEC_DIR, stdio: 'inherit', shell: true }
  );
  const sizeMB = (fs.statSync(ARCHIVE_LOCAL).size / 1024 / 1024).toFixed(1);
  console.log(`✅ ${ARCHIVE_LOCAL} (${sizeMB} MB)`);
}

async function run() {
  const t0 = Date.now();
  try {
    packProject();

    step('🔌 CONECTANDO AO VPS');
    await ssh.connect(VPS);
    console.log('✅ Conectado!');

    step('📤 UPLOAD');
    await ssh.putFile(ARCHIVE_LOCAL, `/tmp/${ARCHIVE_NAME}`);
    console.log('✅ Upload concluído!');

    step('📂 EXTRAINDO');
    // Save .env just in case, but we will recreate it anyway
    await exec(`rm -rf ${REMOTE_DIR}_old`);
    await exec(`cp -r ${REMOTE_DIR} ${REMOTE_DIR}_old || true`); // Backup
    
    // Clear everything except node_modules maybe? No, let's just clear safely
    await exec(`rm -rf ${REMOTE_DIR}/src ${REMOTE_DIR}/server/src ${REMOTE_DIR}/dist`);
    await exec(`tar -xzf /tmp/${ARCHIVE_NAME} -C ${REMOTE_DIR}/`);
    await exec(`rm -f /tmp/${ARCHIVE_NAME}`);
    
    // Corrige permissões para o Nginx (www-data) acessar os arquivos da PWA e evitar 403 Forbidden
    await exec(`chown -R www-data:www-data ${REMOTE_DIR}`);
    await exec(`chmod -R 755 ${REMOTE_DIR}`);

    step('⚙️  CONFIGURANDO .ENV DO BACKEND');
    await exec(`echo "DATABASE_URL=${DB_URL}" > .env`, `${REMOTE_DIR}/server`);
    await exec(`echo "PORT=${API_PORT}" >> .env`, `${REMOTE_DIR}/server`);
    await exec(`echo "JWT_SECRET=supersecret123" >> .env`, `${REMOTE_DIR}/server`);

    step('📦 INSTALANDO DEPENDÊNCIAS DO BACKEND');
    await exec('npm install', `${REMOTE_DIR}/server`);
    
    // Replace sqlite with postgresql in schema.prisma safely
    await exec(`sed -i 's/provider = "sqlite"/provider = "postgresql"/g' prisma/schema.prisma`, `${REMOTE_DIR}/server`);

    step('🔄 PRISMA: GENERATE + DB PUSH (sem perda de dados)');
    await exec(`npx prisma generate`, `${REMOTE_DIR}/server`);
    await exec(`npx prisma db push --accept-data-loss=false`, `${REMOTE_DIR}/server`);

    step('🔨 BUILD DO BACKEND');
    await exec('npm run build', `${REMOTE_DIR}/server`);

    step('📦 INSTALANDO DEPENDÊNCIAS DO FRONTEND');
    await exec('npm install', REMOTE_DIR);

    step('🌐 BUILD DO FRONTEND');
    await exec(`echo "EXPO_PUBLIC_API_URL=https://${DOMAIN}/api" > .env`, REMOTE_DIR);
    await exec(`npm run build:web`, REMOTE_DIR);

    step('⚡ REINICIANDO PM2');
    await exec(`pm2 restart ${PM2_NAME} || pm2 start dist/index.js --name "${PM2_NAME}"`, `${REMOTE_DIR}/server`);
    await exec('pm2 save');
    console.log('✅ PM2 reiniciado!');

    step('📊 STATUS FINAL');
    await exec('pm2 list');

    const elapsed = ((Date.now() - t0) / 1000 / 60).toFixed(1);
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║      ✅  RE-DEPLOY CONTROLTEC CONCLUÍDO! (${elapsed} min)      ║
╠═══════════════════════════════════════════════════════════╣
║  🚀 https://${DOMAIN}        ║
╚═══════════════════════════════════════════════════════════╝
`);
  } catch (err) {
    console.error('\n❌ FALHOU:', err.message || err);
    process.exit(1);
  } finally {
    ssh.dispose();
    if (fs.existsSync(ARCHIVE_LOCAL)) fs.unlinkSync(ARCHIVE_LOCAL);
  }
}

run();
