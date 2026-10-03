// Aides pour tester les composants sans navigateur : on appelle le composant, on parcourt
// l'arbre qu'il rend, on actionne ses gestionnaires.
import type { ComponentChildren, VNode } from 'preact';

type Props = Record<string, unknown> & { children?: ComponentChildren };

/** Tous les éléments de l'arbre, composants développés. */
export function elements(node: ComponentChildren): VNode<Props>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (node === null || typeof node !== 'object' || !('type' in node)) return [];
  const vnode = node as VNode<Props>;
  if (typeof vnode.type === 'function') return elements((vnode.type as (props: Props) => ComponentChildren)(vnode.props));
  return [vnode, ...elements(vnode.props.children)];
}

/** Le premier élément qui répond au critère ; lève s'il n'y en a pas. */
export function find(node: ComponentChildren, predicate: (element: VNode<Props>) => boolean): VNode<Props> {
  const found = elements(node).find(predicate);
  if (!found) throw new Error('élément introuvable');
  return found;
}

export const byClass = (name: string) => (element: VNode<Props>) => String(element.props['class'] ?? '').split(' ').includes(name);
export const byLabel = (label: string) => (element: VNode<Props>) => element.props['aria-label'] === label;

/** Un faux événement de saisie portant une valeur. */
export const inputEvent = (value: string) => ({ currentTarget: { value } }) as unknown as Event;
