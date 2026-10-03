# Proposition : une politique de sécurité du contenu (CSP)

## Why

La promesse « le texte reste dans le navigateur » repose aujourd'hui sur la bonne conduite de tout le code de la page, y compris Transformers.js, chargé depuis jsDelivr sans vérification d'intégrité. Un module altéré chez le distributeur pourrait envoyer le texte n'importe où (RISK-02). Le scénario de qualité QS-02 (« un code tiers altéré ne peut pas envoyer le texte ») n'est pas tenu. Une CSP qui limite les connexions aux trois fournisseurs déjà déclarés le ferait tenir pour toute destination hors de ces hôtes, sans héberger le modèle soi-même, ce qui reste bloqué par RISK-03.

## What Changes

- La page à pistes et la page d'essai déclarent une politique de sécurité du contenu, dans une balise `<meta http-equiv="Content-Security-Policy">`, puisque GitHub Pages ne permet pas d'envoyer d'en-têtes HTTP.
- Les connexions ne sont permises que vers le site lui-même, `cdn.jsdelivr.net`, `huggingface.co` et `*.hf.co` : exactement les fournisseurs que la spec `mise-en-ligne` autorise déjà.
- Les scripts ne viennent que du site et de jsDelivr ; WebAssembly est permis ; aucun script en ligne, aucun `eval`.
- Les styles en ligne restent permis : les pages ont un bloc `<style>` et quelques attributs `style`.
- Rien d'autre ne change dans le comportement visible.

## Capabilities

### New Capabilities
<!-- Aucune. -->

### Modified Capabilities
- `mise-en-ligne` : ajout d'une exigence, la politique de sécurité du contenu qui borne les connexions des deux pages.

## Impact

- **Pages :** `tracks.html` et `index.html` (une balise `<meta>` chacune).
- **Tests :** un test qui lit les deux pages et vérifie qu'elles déclarent la même politique.
- **Documentation :** arc42, sections 7.1, 8.2, 10 (QS-02 et 10.3) et 11 (RISK-02).
- **Rien d'autre :** ni le domaine, ni les ports, ni les adaptateurs, ni la publication.
