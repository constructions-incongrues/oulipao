// Assemble le site publié dans _site/ : la page à pistes en page d'accueil, la page d'essai en
// essai.html, les scripts construits, les styles, les polices, les données et les licences.
// Échoue en nommant toute source manquante. Usage : npm run build:site
import { execSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const site = new URL('_site/', root);
const DOMAIN = 'oulipao.incongru.org';

execSync('npm run build', { cwd: root, stdio: 'inherit' });

/** Une source attendue ; lève en la nommant si elle n'existe pas. */
const source = (path: string) => {
  const url = new URL(path, root);
  if (!existsSync(url)) throw new Error(`build-site : source manquante, ${path}`);
  return url;
};
const listed = (dir: string, extension: RegExp) => readdirSync(source(dir)).filter((name) => extension.test(name));

rmSync(site, { recursive: true, force: true });
mkdirSync(new URL('dist/', site), { recursive: true });
mkdirSync(new URL('data/', site), { recursive: true });

copyFileSync(source('tracks.html'), new URL('index.html', site));
copyFileSync(source('index.html'), new URL('essai.html', site));
for (const name of listed('dist/', /\.js(\.map)?$/)) copyFileSync(source(`dist/${name}`), new URL(`dist/${name}`, site));
cpSync(source('styles/'), new URL('styles/', site), { recursive: true });
cpSync(source('fonts/'), new URL('fonts/', site), { recursive: true });
// Seulement les données dérivées : data/brut/ (le lexique d'origine, 700 Mo) reste hors du site.
for (const name of ['lexique-oulipao.tsv', 'morpho-oulipao.tsv', 'verbes-oulipao.tsv', 'phonetique-oulipao.tsv']) copyFileSync(source(`data/${name}`), new URL(`data/${name}`, site));
for (const name of ['LICENSE', 'THIRD_PARTY_LICENSES.md']) copyFileSync(source(name), new URL(name, site));
// Pages sert les fichiers tels quels (pas de Jekyll) et garde le domaine personnalisé à chaque déploiement.
writeFileSync(new URL('.nojekyll', site), '');
writeFileSync(new URL('CNAME', site), `${DOMAIN}\n`);

console.log(`Site assemblé dans _site/ pour https://${DOMAIN}`);
