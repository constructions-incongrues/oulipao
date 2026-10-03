// Montage de la page des pistes sur le DOM. Exclu de la couverture de tests : tout ce qui se
// teste est dans controller.ts, view-model.ts et les composants.
import { html } from 'htm/preact';
import { render } from 'preact';
import { createMorphologyLoader, createNeuralTagging, createPhoneticsLoader, createVerbsLoader } from '../composition.ts';
import { App } from './app.ts';
import { createTracksController, type TracksState } from './controller.ts';
import { nextTheme, type Theme } from './components/theme-toggle.ts';

const root = document.getElementById('app')!;
const { tagger, preload } = createNeuralTagging();
// À l'ouverture de l'inspecteur, le focus y passe, pour que les flèches et Échap répondent.
let inspecting = false;
const page = document.documentElement;
const onTheme = () => {
  page.dataset['theme'] = nextTheme(page.dataset['theme'] as Theme | undefined, matchMedia('(prefers-color-scheme: dark)').matches);
};
const draw = (state: TracksState) => {
  render(html`<${App} state=${state} controller=${controller} onTheme=${onTheme} version=${__OULIPAO_VERSION__} />`, root);
  if (state.selected !== undefined && !inspecting) root.querySelector<HTMLElement>('.inspector')?.focus();
  inspecting = state.selected !== undefined;
};
const controller = createTracksController(
  {
    tagger,
    preload,
    loadMorphology: createMorphologyLoader(import.meta.url),
    loadVerbs: createVerbsLoader(import.meta.url),
    loadPhonetics: createPhoneticsLoader(import.meta.url),
    copy: (text) => navigator.clipboard.writeText(text),
  },
  draw,
);
draw(controller.state);

// Les raccourcis de l'inspecteur répondent où que soit le focus, sauf dans un champ de saisie.
document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const target = event.target as HTMLElement | null;
  const inField = !!target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable);
  if (controller.shortcut(event.key, inField)) event.preventDefault();
});

// La grille compte ses pas par page d'après sa largeur ; la bande du texte résultant se colle
// en haut de l'écran dès que le repère placé juste au-dessus d'elle en sort.
new ResizeObserver(([entry]) => controller.resize(entry!.contentRect.width)).observe(root.querySelector('.rack')!);
// La bande collée se fait compacte : sur une page courte, la place perdue la rendrait trop courte pour
// défiler, le défilement reviendrait à zéro et la bande se décollerait aussitôt. On rend cette place
// en bas de page tant qu'elle est collée.
new IntersectionObserver(([entry]) => {
  // Avant la première mise en pistes, pas de bloc résultat : rien à réserver.
  const height = () => root.querySelector<HTMLElement>('.result')?.offsetHeight ?? 0;
  const before = height();
  // Réservée avant le rendu compact, sinon le navigateur ramène le défilement à zéro avant qu'on l'ajuste.
  document.body.style.paddingBottom = entry!.isIntersecting ? '' : `${before}px`;
  controller.pin(!entry!.isIntersecting);
  if (!entry!.isIntersecting) document.body.style.paddingBottom = `${Math.max(0, before - height())}px`;
}).observe(root.querySelector('.pin-sentinel')!);
