const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, '..', 'dist');
const webDir = path.join(__dirname, '..', 'web');

// 1. Copiar os ícones PWA para o dist/
const iconFiles = ['pwa-icon-192.png', 'pwa-icon-512.png', 'manifest.json', 'service-worker.js'];
iconFiles.forEach(file => {
  const src = path.join(webDir, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copiado: ${file}`);
  }
});

// 1b. Redimensionar ícones para tamanhos corretos usando ImageMagick (se disponível)
function tryConvert(input, output, size) {
  try {
    execSync(`convert "${input}" -resize ${size}x${size} -quality 95 "${output}"`, { stdio: 'ignore' });
    console.log(`✅ Redimensionado: ${path.basename(output)} (${size}x${size})`);
    return true;
  } catch (e) {
    return false;
  }
}

const srcIcon = path.join(distDir, 'pwa-icon-512.png');
if (fs.existsSync(srcIcon)) {
  const converted512 = tryConvert(srcIcon, path.join(distDir, 'pwa-icon-512.png'), 512);
  const converted192 = tryConvert(srcIcon, path.join(distDir, 'pwa-icon-192.png'), 192);
  const convertedApple = tryConvert(srcIcon, path.join(distDir, 'apple-touch-icon.png'), 180);
  if (convertedApple) {
    fs.copyFileSync(path.join(distDir, 'apple-touch-icon.png'), path.join(distDir, 'apple-touch-icon-precomposed.png'));
    console.log('✅ Copiado: apple-touch-icon-precomposed.png');
  }
  if (!converted512) console.log('ℹ️ ImageMagick não disponível - ícones não redimensionados (instale com: apt-get install imagemagick)');
}

// 2. Injetar tags PWA no index.html gerado pelo Expo
const indexPath = path.join(distDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const pwaTags = `
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#0F2A5A" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="ControlTec" />
  <link rel="apple-touch-icon" sizes="192x192" href="/pwa-icon-192.png" />
  <link rel="apple-touch-icon" sizes="512x512" href="/pwa-icon-512.png" />
  <link rel="apple-touch-icon" href="/pwa-icon-512.png" />
  <link rel="icon" type="image/png" sizes="192x192" href="/pwa-icon-192.png" />
  <link rel="icon" type="image/png" sizes="512x512" href="/pwa-icon-512.png" />
  <script>(function(){var V='4';var s=localStorage.getItem('ct-sw-v');if(s!==V){if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(x){x.unregister();});})}if('caches' in window){caches.keys().then(function(k){k.forEach(function(c){caches.delete(c);});})}localStorage.setItem('ct-sw-v',V);if(s!==null){setTimeout(function(){window.location.reload(true);},200);}}})()</script>
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js')
          .then(function(reg) { console.log('SW registrado:', reg.scope); })
          .catch(function(err) { console.log('SW erro:', err); });
      });
    }
  </script>
`;

// Injeta antes do </head>
if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', pwaTags + '</head>');
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('✅ Tags PWA injetadas no index.html');
} else {
  console.log('ℹ️ Tags PWA já existem no index.html');
}

// 3. Copiar também para TODOS os outros HTMLs gerados (recursivo)
function injectPwaTagsRecursively(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Ignorar a pasta _expo por segurança
      if (file !== '_expo') {
        injectPwaTagsRecursively(filePath);
      }
    } else if (file.endsWith('.html')) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (!content.includes('rel="manifest"')) {
        content = content.replace('</head>', pwaTags + '</head>');
        fs.writeFileSync(filePath, content, 'utf8');
        const relativePath = path.relative(distDir, filePath);
        console.log(`✅ Tags PWA injetadas em: ${relativePath}`);
      } else {
        const relativePath = path.relative(distDir, filePath);
        console.log(`ℹ️ Tags PWA já existem em: ${relativePath}`);
      }
    }
  });
}

injectPwaTagsRecursively(distDir);

console.log('🚀 Pós-build PWA concluído!');
