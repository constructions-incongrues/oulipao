import { z } from 'zod';

// Vérification de la palette de DESIGN.md : contrastes WCAG 2.2 et distinction des pistes en
// daltonisme. Calcul pur : le script `scripts/check-palette.ts` lit les couleurs et appelle ceci.

const HexSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'couleur attendue au format #rrggbb');

/** Un thème : les fonds, ce qui s'écrit dessus, et les couleurs des pistes (qui s'écrivent aussi dessus). */
export const ThemeSchema = z.object({
  backgrounds: z.record(z.string(), HexSchema),
  foregrounds: z.record(z.string(), HexSchema),
  tracks: z.record(z.string(), HexSchema),
});
export type Theme = z.infer<typeof ThemeSchema>;

export const PaletteSchema = z.record(z.string(), ThemeSchema);
export type Palette = z.infer<typeof PaletteSchema>;

type Rgb = [number, number, number];

const toLinear = (channel: number) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
const fromLinear = (channel: number) => (channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055);

/** Les trois canaux d'une couleur, linéarisés, entre 0 et 1. */
function linear(hex: string): Rgb {
  const value = HexSchema.parse(hex);
  return [1, 3, 5].map((start) => toLinear(parseInt(value.slice(start, start + 2), 16) / 255)) as Rgb;
}

const luminance = ([r, g, b]: Rgb) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Le contraste WCAG entre deux couleurs : de 1 (identiques) à 21 (noir sur blanc). */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(linear(a)), luminance(linear(b))].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

export const VISIONS = ['normale', 'deutéranopie', 'protanopie', 'tritanopie'] as const;
export type Vision = (typeof VISIONS)[number];

/** Matrices de Machado, Oliveira et Fernandes (2009), sévérité 1, en RVB linéaire. */
const MACHADO: Record<Exclude<Vision, 'normale'>, number[][]> = {
  protanopie: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutéranopie: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopie: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** La couleur telle que la voit une personne de cette vision, en RVB linéaire. */
function simulate(hex: string, vision: Vision): Rgb {
  const rgb = linear(hex);
  if (vision === 'normale') return rgb;
  return MACHADO[vision].map((row) => clamp(row[0]! * rgb[0] + row[1]! * rgb[1] + row[2]! * rgb[2])) as Rgb;
}

/** RVB linéaire vers CIELAB, illuminant D65. */
function lab([r, g, b]: Rgb): Rgb {
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** L'écart CIE76 entre deux couleurs vues par une même vision. */
export function deltaE(a: string, b: string, vision: Vision = 'normale'): number {
  const [la, lb] = [lab(simulate(a, vision)), lab(simulate(b, vision))];
  return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2]);
}

/** La couleur simulée, en #rrggbb : pour les messages et les tests. */
export function simulatedHex(hex: string, vision: Vision): string {
  return `#${simulate(hex, vision)
    .map((channel) => Math.round(clamp(fromLinear(channel)) * 255).toString(16).padStart(2, '0'))
    .join('')}`;
}

/** Le rôle d'une couleur du front matter de DESIGN.md, d'après son nom ; `undefined` si elle n'est pas vérifiée (filets). */
function roleOf(name: string): keyof Theme | undefined {
  if (name === 'surface' || name === 'paper') return 'backgrounds';
  if (name === 'text' || name === 'text-muted' || name === 'error') return 'foregrounds';
  if (name.startsWith('track-')) return 'tracks';
  return undefined;
}

/**
 * Lit les couleurs du front matter de DESIGN.md (bloc `colors:`, une couleur par ligne) : les
 * noms préfixés `dark-` vont au thème sombre, les autres au clair.
 */
export function paletteFromDesign(markdown: string): Palette {
  const front = /^---\n([\s\S]*?)\n---/.exec(markdown)?.[1];
  if (front === undefined) throw new Error('DESIGN.md : front matter introuvable');
  const block = /^colors:\n((?:[ \t]+.*\n?)*)/m.exec(front)?.[1];
  if (block === undefined) throw new Error('DESIGN.md : bloc colors introuvable');
  const palette: Record<'clair' | 'sombre', Theme> = {
    clair: { backgrounds: {}, foregrounds: {}, tracks: {} },
    sombre: { backgrounds: {}, foregrounds: {}, tracks: {} },
  };
  for (const line of block.split('\n')) {
    const match = /^\s+([\w-]+):\s*"?(#[0-9a-fA-F]{6})"?/.exec(line);
    if (!match) continue;
    const dark = match[1]!.startsWith('dark-');
    const name = dark ? match[1]!.slice(5) : match[1]!;
    const role = roleOf(name);
    if (role) palette[dark ? 'sombre' : 'clair'][role][name.replace(/^track-/, '')] = match[2]!;
  }
  return PaletteSchema.parse(palette);
}

export interface PaletteProblem {
  theme: string;
  message: string;
}

export interface PaletteThresholds {
  minContrast: number;
  minDeltaE: number;
}

/** Ce qui ne va pas dans une palette ; vide si tout passe. */
export function checkPalette(input: Palette, thresholds: PaletteThresholds = { minContrast: 4.5, minDeltaE: 20 }): PaletteProblem[] {
  const palette = PaletteSchema.parse(input);
  const problems: PaletteProblem[] = [];
  for (const [theme, { backgrounds, foregrounds, tracks }] of Object.entries(palette)) {
    for (const [inkName, ink] of Object.entries({ ...foregrounds, ...tracks })) {
      for (const [groundName, ground] of Object.entries(backgrounds)) {
        const ratio = contrastRatio(ink, ground);
        if (ratio < thresholds.minContrast) {
          problems.push({ theme, message: `${inkName} (${ink}) sur ${groundName} (${ground}) : contraste ${ratio.toFixed(2)}, il faut ${thresholds.minContrast}` });
        }
      }
    }
    const names = Object.keys(tracks);
    for (const vision of VISIONS) {
      for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
          const [a, b] = [names[i]!, names[j]!];
          const gap = deltaE(tracks[a]!, tracks[b]!, vision);
          if (gap < thresholds.minDeltaE) {
            problems.push({ theme, message: `${a} et ${b} en ${vision} : écart ΔE ${gap.toFixed(1)}, il faut ${thresholds.minDeltaE}` });
          }
        }
      }
    }
  }
  return problems;
}
