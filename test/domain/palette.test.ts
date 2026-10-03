import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkPalette, contrastRatio, deltaE, paletteFromDesign, simulatedHex } from '../../src/domain/palette.ts';

test('contrastRatio : noir sur blanc = 21, une couleur sur elle-même = 1', () => {
  assert.equal(contrastRatio('#000000', '#ffffff'), 21);
  assert.equal(contrastRatio('#ffffff', '#000000'), 21);
  assert.equal(contrastRatio('#777777', '#777777'), 1);
});

test('deltaE : nul entre deux couleurs identiques, grand entre noir et blanc', () => {
  assert.equal(deltaE('#0b5e95', '#0b5e95'), 0);
  assert.ok(Math.abs(deltaE('#000000', '#ffffff') - 100) < 0.01);
});

test('simulation : un rouge et un vert purs se confondent presque en deutéranopie', () => {
  assert.ok(deltaE('#ff0000', '#00ff00') > 100);
  assert.ok(deltaE('#ff0000', '#00ff00', 'deutéranopie') < deltaE('#ff0000', '#00ff00') / 2);
  assert.equal(simulatedHex('#808080', 'deutéranopie').length, 7);
  assert.equal(simulatedHex('#123456', 'normale'), '#123456');
});

test('checkPalette : une palette saine passe', () => {
  assert.deepEqual(
    checkPalette({ clair: { backgrounds: { papier: '#ffffff' }, foregrounds: { encre: '#000000' }, tracks: { noms: '#0b5e95', verbes: '#983a08' } } }),
    [],
  );
});

test('checkPalette : nomme le contraste insuffisant et les pistes trop proches', () => {
  const problems = checkPalette({
    clair: { backgrounds: { façade: '#d6d5d0' }, foregrounds: { gris: '#a0a0a0' }, tracks: { noms: '#0b5e95', verbes: '#0c5f96' } },
  });
  assert.ok(problems.some((p) => p.theme === 'clair' && p.message.startsWith('gris (#a0a0a0) sur façade (#d6d5d0) : contraste')));
  for (const vision of ['normale', 'deutéranopie', 'protanopie', 'tritanopie']) {
    assert.ok(problems.some((p) => p.message.startsWith(`noms et verbes en ${vision} : écart ΔE`)), vision);
  }
});

test('paletteFromDesign : range les couleurs du front matter par thème et par rôle', () => {
  const design = [
    '---',
    'name: Oulipao',
    'colors:',
    '  surface: "#d6d5d0"',
    '  paper: "#fbfbf8"',
    '  text: "#17171a"',
    '  rule: "#b4b3ad"',
    '  track-noun: "#0b5e95"',
    '  dark-surface: "#1c1c1f"',
    '  dark-track-noun: "#56b4e9"',
    'typography:',
    '  body:',
    '    fontSize: 22px',
    '---',
    '# Oulipao',
  ].join('\n');
  assert.deepEqual(paletteFromDesign(design), {
    clair: { backgrounds: { surface: '#d6d5d0', paper: '#fbfbf8' }, foregrounds: { text: '#17171a' }, tracks: { noun: '#0b5e95' } },
    sombre: { backgrounds: { surface: '#1c1c1f' }, foregrounds: {}, tracks: { noun: '#56b4e9' } },
  });
});

test('paletteFromDesign : signale un front matter ou un bloc absent', () => {
  assert.throws(() => paletteFromDesign('# sans front matter'), /front matter/);
  assert.throws(() => paletteFromDesign('---\nname: x\n---\n'), /colors/);
});

test('checkPalette : refuse une couleur mal écrite', () => {
  assert.throws(() => checkPalette({ clair: { backgrounds: { papier: 'blanc' }, foregrounds: {}, tracks: {} } }));
});
