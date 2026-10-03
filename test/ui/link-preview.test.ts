import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

// L'aperçu de lien (spec mise-en-ligne) : les robots d'aperçu lisent le <head> statique sans
// exécuter de script, donc on lit les pages sources comme du texte.
const root = new URL('../../', import.meta.url);
const SITE = 'https://oulipao.incongru.org/';
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');
const head = (html: string) => html.slice(0, html.indexOf('</head>'));

/** Le contenu d'une balise <meta> repérée par son attribut property ou name. */
const meta = (html: string, key: string) =>
  new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)">`).exec(head(html))?.[1];

/** Largeur et hauteur d'un PNG, lues dans son en-tête IHDR. */
const pngSize = (bytes: Buffer) => {
  assert.equal(bytes.subarray(1, 4).toString('ascii'), 'PNG');
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
};

/** Un fichier publié à la racine du site, d'après son adresse absolue. */
const published = (url: string) => {
  assert.ok(url.startsWith(SITE), `${url} n'est pas sous ${SITE}`);
  return new URL(url.slice(SITE.length), root);
};

test('la page d’accueil déclare titre, description, Open Graph et Twitter Card', () => {
  const html = read('tracks.html');
  const title = /<title>([^<]*)<\/title>/.exec(head(html))?.[1];
  const description = meta(html, 'description');
  assert.ok(title?.startsWith('Oulipao'));
  assert.ok(description && description.length > 50);
  assert.equal(meta(html, 'og:title'), title);
  assert.equal(meta(html, 'og:description'), description);
  assert.equal(meta(html, 'og:type'), 'website');
  assert.equal(meta(html, 'og:url'), SITE);
  assert.equal(meta(html, 'og:locale'), 'fr_FR');
  assert.ok(meta(html, 'og:image:alt'));
  assert.equal(meta(html, 'twitter:card'), 'summary_large_image');
});

test('l’image d’aperçu est un PNG publié de 1200×630', () => {
  const html = read('tracks.html');
  const file = published(meta(html, 'og:image')!);
  assert.ok(existsSync(file), `image d'aperçu absente : ${file.pathname}`);
  assert.deepEqual(pngSize(readFileSync(file)), [1200, 630]);
  assert.equal(meta(html, 'og:image:width'), '1200');
  assert.equal(meta(html, 'og:image:height'), '630');
});

test('les deux pages déclarent l’icône SVG publiée', () => {
  for (const page of ['tracks.html', 'index.html']) {
    const href = /<link rel="icon" type="image\/svg\+xml" href="([^"]+)">/.exec(head(read(page)))?.[1];
    assert.ok(href, `${page} : pas d'icône SVG`);
    assert.ok(existsSync(new URL(href, root)), `${page} : ${href} absent`);
  }
});

test('la page d’essai demande à ne pas être indexée, la page d’accueil non', () => {
  assert.equal(meta(read('index.html'), 'robots'), 'noindex');
  assert.equal(meta(read('tracks.html'), 'robots'), undefined);
});
