# Design

## Context

Les deux pages sont des fichiers HTML statiques, copiés tels quels dans `_site/` par `scripts/build-site.ts` et servis par GitHub Pages, qui n'accepte pas d'en-têtes HTTP personnalisés. Chacune charge un seul module, `dist/tracks.js` ou `dist/page.js`, et contient un bloc `<style>`. Des attributs `style` existent aussi : dans le SVG de `tracks.html` et dans la grille (`step-grid.ts`). Au premier clic, Transformers.js est importé depuis `cdn.jsdelivr.net`. Il y va aussi chercher le moteur ONNX en WebAssembly (`onnxruntime-web/dist/`), puis il télécharge le modèle depuis `huggingface.co`, qui redirige vers `*.hf.co`. Un essai précédent a montré une requête `blob:` au chargement du modèle.

## Goals / Non-Goals

**Goals :**
- Qu'aucune requête ne puisse partir vers un hôte hors des quatre autorisés, même si le code qui la lance est altéré.
- Ne rien changer à ce que voit le lecteur.

**Non-Goals :**
- Vérifier l'intégrité du module tiers (SRI). Un `import()` dynamique ne la permet pas, et une carte d'import avec `integrity` est un autre changement.
- Empêcher l'envoi vers les hôtes autorisés eux-mêmes : c'est le risque résiduel (voir plus bas).
- `frame-ancestors`, qu'une balise `<meta>` ne peut pas porter.

## Decisions

### 1. Une balise `<meta>` dans chaque page (pages)

GitHub Pages ne sert pas d'en-têtes personnalisés. La balise est placée en tête de `<head>`, avant toute ressource. La politique est identique dans les deux pages ; un test le garantit.

*Pourquoi pas un en-tête par Cloudflare :* le domaine n'est pas proxifié, pour que GitHub émette son certificat (`design.md` de la mise en ligne, décision 3).

### 2. La politique

```
default-src 'self';
script-src 'self' https://cdn.jsdelivr.net 'wasm-unsafe-eval' blob:;
connect-src 'self' https://cdn.jsdelivr.net https://huggingface.co https://*.hf.co;
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
object-src 'none';
base-uri 'none';
form-action 'none'
```

- `connect-src` porte la promesse : c'est lui qui borne `fetch`.
- `'wasm-unsafe-eval'` est requis pour compiler le moteur ONNX ; il ne permet pas `eval`.
- `'unsafe-inline'` n'est accordé qu'aux styles. Hacher le bloc `<style>` serait possible, mais pas les attributs `style` sans `'unsafe-hashes'`, et un style ne peut rien envoyer qui ne soit déjà permis par `img-src` et `font-src`.
- `blob:` est ajouté à `script-src` après l'essai de la tâche 2.1 : le moteur ONNX copie son module dans une URL `blob:` avant de l'importer, et la politique sans `blob:` bloquait le chargement. Cela n'ouvre rien vers l'extérieur : seul un code déjà présent dans la page peut créer un tel script, et `connect-src` borne toujours ses requêtes. `worker-src` n'a pas été nécessaire.

*Pourquoi pas `default-src 'none'` :* plus strict sur le papier, mais il oblige à énumérer chaque type de ressource pour un gain nul sur la seule promesse en jeu, qui relève de `connect-src`.

### Couches et ports

Aucun module de code nouveau : ce sont les pages (`tracks.html`, `index.html`). Le test qui vérifie la politique vit dans `test/` et lit les fichiers ; il ne touche ni port ni adaptateur.

## Risks / Trade-offs

- **[Envoi vers un hôte autorisé]** Un module altéré pourrait encore viser `cdn.jsdelivr.net` ou `huggingface.co`. → Ce sont des distributeurs en lecture, pas des boîtes de dépôt ouvertes à un attaquant anonyme. Le risque résiduel est noté dans RISK-02, qui reste ouvert tant qu'il n'y a pas de SRI.
- **[Une mise à jour de Transformers.js qui change ses hôtes]** La politique bloquerait le chargement. → La version est épinglée (4.3.0). Changer de version oblige à refaire l'essai de la tâche 2.
- **[La politique casse la page]** → Elle est vérifiée dans le navigateur sur le parcours complet, sur les deux pages, avant la fusion.

## Migration Plan

Publié à la fusion sur `main`. Retour arrière : retirer la balise.
