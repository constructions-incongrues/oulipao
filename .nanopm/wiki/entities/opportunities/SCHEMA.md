# Base d'opportunités — schéma et conventions

Source de vérité pour `.nanopm/wiki/entities/opportunities/`. `/pm-opportunities` lit ce fichier
à chaque passage et s'y conforme ; le modifier suffit à faire évoluer la base. Il décrit le format
que suivent les fiches existantes, pas le modèle par défaut de nanopm.

## Deux niveaux seulement
- **Thème** (L1) — un regroupement.
- **Opportunité** (L2) — un problème d'utilisateur, formulé à la première personne, sur lequel on
  pourrait chercher des solutions.
- Jamais plus profond. Les faits rangés sous « What we know » sont des facettes d'une même
  opportunité. Compléter ou fusionner une fiche existante plutôt que créer un quasi-doublon.

## Thèmes (L1)
<!-- Aucun pour l'instant : les fiches sont rangées sous « (untriaged) » dans INDEX.md.
     Un thème par ligne ; l'ajouter aussi au champ `theme:` des fiches concernées. -->

## Provenance — toujours explicite
- `nano-hypothesis` — déduite par Nano ou simple intuition, sans signal d'usage. Confiance faible.
- `user-stated` — affirmée par le fondateur, non vérifiée. Confiance moyenne.
- `evidence-backed` — appuyée sur des citations attribuées (messages, PR, carnet). La confiance
  croît avec le nombre de signaux.
Un rattachement incertain fait par un agent porte `⚠ low-confidence` jusqu'à confirmation.

## Priorité
`high | medium | low` (`medium` par défaut) : un jugement, proposé par Nano, corrigé par le
fondateur. Une hypothèse sans signal reste en `low`. Pas de score chiffré.

La **sévérité** (H, M, L) et le nombre de signaux se notent à la fin du résumé :
« Sévérité H, 2 signaux. »

## Statuts
`draft → defining → review → ready-for-solutions`, ou `archived` (avec la raison dans le résumé :
« Livré : … (#34) » ou « Abandonné : … »).

## Citations
`"<citation exacte>" — <source>, <date>`, par exemple
`"…" — description de la PR #28, 2026-10-03`. Une hypothèse se note en phrase simple, sans
guillemets.

## Modèle de fiche — `<slug>.md`
Le slug vient de `nanopm_opportunity_slug "<titre>"` ou d'un nom court choisi à la main
(`hasard-du-lexique`).

```markdown
---
id: <slug>
type: opportunity
title: "<problème à la première personne : « Je veux montrer ce que ça donne à quelqu'un »>"
status: draft
provenance: evidence-backed      # nano-hypothesis | user-stated | evidence-backed
priority: medium                 # high | medium | low ; facultatif, medium par défaut
theme: <thème L1>                # facultatif tant qu'aucun thème n'existe
sources: [feedback.md]           # pages du wiki ou séances d'où vient le signal
relates_to: []                   # liste de { page: opportunities/<slug>, rel: extends | supports }
last_updated: <AAAA-MM-JJ>
---

## Summary
<2 à 4 phrases : le problème, ce qui est livré ou non, puis « Sévérité X, n signaux. »>

## What we know
**<facette>**
<une phrase de contexte, facultative>
- "<citation>" — <source>, <date>

**Tension**
<ce qui tire dans l'autre sens, s'il y en a>

## Open / superseded
_(rien)_
```

## Relations
- `extends` — la fiche prolonge l'autre (un cas particulier, une suite).
- `supports` — la fiche apporte un fait en faveur de l'autre.

## INDEX.md
Généré par `nanopm_opportunities_reindex`, jamais édité à la main. Regroupé par thème ; dans un
thème, trié par priorité puis par `last_updated`, du plus récent au plus ancien.

## LOG.md
Journal en ajout seul, une ligne par changement :
`<date> | <action>: <slug> (<provenance>) | /pm-opportunities`.
