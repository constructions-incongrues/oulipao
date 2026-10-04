import type { Category } from '../../domain/categories.ts';
import { isWordSource, type Gate, type GateTest, type Modulator, type Read, type Source } from '../../domain/modulation/schema.ts';
import type { ConstraintPlugin, ParameterValues } from '../../domain/plugin.ts';
import { TRACK_UNITS } from './types.ts';

// La règle d'un modulateur ou d'une porte, en une phrase, sans aucune valeur par mot : la mention
// du carnet doit dire comment le texte a été fait.

/** Le nom court d'une source, dans le libellé de l'instance : « S+lettres ». */
export function sourceName(source: Source): string {
  switch (source.kind) {
    case 'letters':
      return 'lettres';
    case 'syllables':
      return 'syllabes';
    case 'vowels':
      return 'voyelles';
    case 'letter':
      return `« ${source.letter} »`;
    case 'rank':
      return 'rang';
    case 'line':
      return 'ligne';
    case 'pattern':
      return 'motif';
    case 'ramp':
      return 'rampe';
  }
}

/** Ce qu'on compte dans un mot : « lettres », « « e » ». */
const counted = (source: Source) => sourceName(source);

/** Les mots que l'instance traite : « nom » et « noms » sur une piste, « mot » et « mots » sur plusieurs. */
function unitsOf(targets: readonly Category[]): [string, string] {
  return targets.length === 1 ? TRACK_UNITS[targets[0]!] : ['mot', 'mots'];
}

/** « l'adjectif suivant », « le nom précédent ». */
function neighbourName(read: Extract<Read, { kind: 'neighbour' }>): string {
  const [one] = TRACK_UNITS[read.track];
  const article = /^[aeiouyh]/.test(one) ? 'l’' : 'le ';
  return `${article}${one} ${read.side === 'after' ? 'suivant' : 'précédent'}`;
}

/** La quantité lue, en groupe nominal : « son nombre de lettres », « le nombre de lettres de l'adjectif suivant », « son rang ». */
function quantity(source: Source, read: Read): string {
  if (isWordSource(source)) return read.kind === 'self' ? `son nombre de ${counted(source)}` : `le nombre de ${counted(source)} de ${neighbourName(read as Extract<Read, { kind: 'neighbour' }>)}`;
  switch (source.kind) {
    case 'rank':
      return 'son rang';
    case 'line':
      return 'le numéro de sa ligne';
    case 'pattern':
      return `tour à tour ${source.values.join(', ')}`;
    default: {
      const { from, to } = source as Extract<Source, { kind: 'ramp' }>;
      return `de ${from} au premier à ${to} au dernier`;
    }
  }
}

/** Ce que précise la fin de phrase : le mot lu tel qu'il arrive, et le repli dans les bornes. */
export interface StatementContext {
  /** Une instance placée plus haut dans la chaîne peut changer le mot lu. */
  earlier: boolean;
  /** Une valeur a été repliée dans les bornes du paramètre. */
  folded: boolean;
}

/** La phrase d'un modulateur : « chaque nom avance d'autant de noms qu'il a de lettres ». */
export function modulatorStatement(plugin: ConstraintPlugin, key: string, modulator: Modulator, targets: readonly Category[], context: StatementContext): string {
  const parameter = plugin.parameters.find((candidate) => candidate.key === key);
  const max = parameter?.kind === 'integer' ? parameter.max : 0;
  const [one, many] = unitsOf(targets);
  const { source, read, base, depth } = modulator;
  const plain = base === 0 && depth === 1;
  let sentence: string;
  if (plain && plugin.id === 's7' && key === 'offset' && isWordSource(source)) {
    const holder = read.kind === 'self' ? 'qu’il a' : `que ${neighbourName(read)} a`;
    sentence = `chaque ${one} avance d’autant de ${many} ${holder} de ${counted(source)}`;
  } else {
    const label = parameter?.label.toLowerCase() ?? key;
    const sign = depth < 0 ? '−' : '+';
    const times = Math.abs(depth) === 1 ? '' : `${Math.abs(depth)} × `;
    const value = plain ? quantity(source, read) : `${base} ${sign} ${times}${quantity(source, read)}`;
    sentence = `${label} de chaque ${one} : ${value}`;
  }
  if (context.earlier && isWordSource(source)) sentence += ' en arrivant ici';
  if (context.folded) sentence += ` (modulo ${max})`;
  return sentence;
}

/** Ce qu'une porte exige d'un compte : « un nombre pair de lettres », « au moins 3 lettres ». */
function required(test: Exclude<GateTest, { kind: 'euclid' }>, noun: string): string {
  switch (test.kind) {
    case 'even':
      return `un nombre pair de ${noun}`;
    case 'odd':
      return `un nombre impair de ${noun}`;
    case 'at-least':
      return `au moins ${test.k} ${noun}`;
    case 'at-most':
      return `au plus ${test.k} ${noun}`;
  }
}

/** La phrase d'une porte : « seuls les noms d'un nombre pair de lettres sont traités ». */
export function gateStatement(gate: Gate, targets: readonly Category[], context: StatementContext): string {
  const [, many] = unitsOf(targets);
  const { source, read, test } = gate;
  let which: string;
  if (test.kind === 'euclid') {
    which = `aux frappes d’Euclide ${test.k} sur ${test.n}`;
  } else if (isWordSource(source)) {
    which = read.kind === 'self' ? `d’${required(test, counted(source))}` : `dont ${neighbourName(read)} a ${required(test, counted(source))}`;
  } else {
    // « le rang » est masculin, « la ligne » et « la valeur » féminins.
    const what = source.kind === 'rank' ? 'le rang' : source.kind === 'line' ? 'la ligne' : `la valeur (${quantity(source, read)})`;
    const e = source.kind === 'rank' ? '' : 'e';
    const verdict = test.kind === 'even' ? `est pair${e}` : test.kind === 'odd' ? `est impair${e}` : test.kind === 'at-least' ? `vaut au moins ${test.k}` : `vaut au plus ${test.k}`;
    which = `dont ${what} ${verdict}`;
  }
  const sentence = `seuls les ${many} ${which} sont traités`;
  return context.earlier && isWordSource(source) ? `${sentence} en arrivant ici` : sentence;
}

/** Le premier paramètre verrouillable d'un type : celui qui donne son nom à l'instance. */
const mainKey = (plugin: ConstraintPlugin) => plugin.parameters.find((parameter) => parameter.kind === 'integer' && parameter.lockable)?.key;

/**
 * Le libellé d'une instance dont le paramètre principal est modulé : « S+lettres », « R+rang,
 * rime suffisante », « homophonies, rang : lettres ». Sans modulateur, celui du type.
 */
export function modulatedLabel(plugin: ConstraintPlugin, params: ParameterValues, modulators: Readonly<Record<string, Modulator>> = {}): string {
  const label = plugin.label(params);
  const key = mainKey(plugin);
  const modulator = key && modulators[key];
  if (!modulator) return label;
  const title = plugin.title(params);
  const signed = /^(\p{Lu})[+−]\d+$/u.exec(title);
  if (signed) return label.replace(title, `${signed[1]}+${sourceName(modulator.source)}`);
  if (plugin.modulatedLabel) return plugin.modulatedLabel(params, sourceName(modulator.source));
  const parameter = plugin.parameters.find((candidate) => candidate.key === key)!;
  return `${plugin.label({ ...params, [key]: plugin.defaults[key]! })}, ${parameter.label.toLowerCase()} : ${sourceName(modulator.source)}`;
}
