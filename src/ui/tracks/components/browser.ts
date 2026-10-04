import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { ConstraintPlugin } from '../../../domain/plugin.ts';
import type { Recipe } from '../recipes.ts';
import type { MixerAction } from '../types.ts';

export interface BrowserProps {
  recipes: readonly Recipe[];
  /** Les types qu'on peut ajouter nus : la section « Moteurs ». */
  plugins: readonly ConstraintPlugin[];
  dispatch: (action: MixerAction) => void;
  /** Le jour du branchement (Juliennes) ; aujourd'hui, sauf en test. */
  now?: () => Date;
}

/** « 2026-10-03 », dans le fuseau du navigateur. */
const isoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Déplie ou replie le choix d'une recette, depuis un élément de sa ligne ; replié, le focus revient à sa touche. */
function toggleChoice(from: Element, open: boolean) {
  const row = from.closest('.recipe')!;
  const form = row.querySelector('form')!;
  const key = row.querySelector<HTMLButtonElement>('.add-recipe')!;
  form.hidden = !open;
  key.setAttribute('aria-expanded', String(open));
  if (open) form.querySelector('select')?.focus();
  else key.focus();
}

/**
 * Après un ajout : replie le navigateur et amène l'œil sur la première contrainte ajoutée, au
 * milieu de l'écran (la bande collée couvre le haut). La chaîne se redessine d'abord.
 */
function added(from: Element | undefined, add: () => void) {
  const browser = from?.closest('details');
  const chain = browser?.closest('.chain');
  const before = chain?.querySelectorAll('.slot').length ?? 0;
  add();
  if (browser) browser.open = false;
  setTimeout(() => {
    const slot = chain?.querySelectorAll<HTMLElement>('.slot')[before];
    slot?.scrollIntoView({ block: 'center' });
    slot?.querySelector<HTMLElement>('input, select, button')?.focus({ preventScroll: true });
  });
}

/** Une recette : sa touche, sa règle, sa fiche ; si elle demande un réglage, le choix se déplie sous elle. */
function RecipeRow({ recipe, dispatch, now }: { recipe: Recipe; dispatch: BrowserProps['dispatch']; now: () => Date }): VNode {
  const add = (choice?: string) => dispatch({ type: 'add-recipe', recipe: recipe.id, choice, today: isoDay(now()) });
  const formId = `recipe-${recipe.id}`;
  const onSubmit = (event: Event) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    toggleChoice(form, false);
    added(form, () => add((form.elements.namedItem('choice') as HTMLSelectElement).value));
  };
  return html`
    <li class="recipe">
      ${recipe.choice
        ? html`<button type="button" class="add-recipe" aria-expanded="false" aria-controls=${formId}
            onClick=${(event: Event) => toggleChoice(event.currentTarget as Element, true)}>+ ${recipe.name}</button>`
        : html`<button type="button" class="add-recipe" onClick=${(event?: Event) => added(event?.currentTarget as Element | undefined, () => add())}>+ ${recipe.name}</button>`}
      <span class="rule">${recipe.rule}</span>
      <a class="sheet" href=${recipe.url} target="_blank" rel="noopener">fiche<span aria-hidden="true"> ↗</span><span class="sr-only"> ${recipe.name} sur oulipo.net, nouvel onglet</span></a>
      ${recipe.choice &&
      html`<form class="choice" id=${formId} hidden onSubmit=${onSubmit}
          onKeyDown=${(event: KeyboardEvent) => event.key === 'Escape' && toggleChoice(event.currentTarget as Element, false)}>
          <label class="silk">${recipe.choice.label}
            <select name="choice">${recipe.choice.options.map((option) => html`<option value=${option.value}>${option.label}</option>`)}</select>
          </label>
          <button type="submit">Brancher</button>
          <button type="button" class="cancel" onClick=${(event: Event) => toggleChoice(event.currentTarget as Element, false)}>Annuler</button>
        </form>`}
    </li>
  ` as VNode;
}

/**
 * Le navigateur de contraintes, sous la chaîne, replié par défaut : les recettes par leur nom de
 * l'Oulipo, puis les moteurs nus. Tout ajout va en fin de chaîne, et le navigateur se replie.
 */
export function Browser({ recipes, plugins, dispatch, now = () => new Date() }: BrowserProps): VNode {
  return html`
    <details class="browser">
      <summary>Ajouter une contrainte</summary>
      <section aria-labelledby="recipes-title">
        <h3 class="silk" id="recipes-title">Recettes</h3>
        <p class="section-hint">Les contraintes de l'Oulipo, par leur nom : chacune branche un ou plusieurs moteurs déjà réglés.</p>
        <ul class="recipes">
          ${recipes.map((recipe) => html`<${RecipeRow} key=${recipe.id} recipe=${recipe} dispatch=${dispatch} now=${now} />`)}
        </ul>
      </section>
      <section aria-labelledby="engines-title">
        <h3 class="silk" id="engines-title">Moteurs</h3>
        <p class="section-hint">Les opérations de base qui font tourner les recettes : on les branche nues, puis on les règle soi-même dans la chaîne.</p>
        <div class="engines">
          ${plugins.map(
            (plugin) => html`<button type="button" class="add-instance" onClick=${(event?: Event) => added(event?.currentTarget as Element | undefined, () => dispatch({ type: 'add-instance', plugin: plugin.id }))}>+ ${plugin.name}</button>`,
          )}
        </div>
      </section>
    </details>
  ` as VNode;
}
