# Context
# nanopm uses this to challenge your product thinking. Edit freely.
# Lines marked [auto] were pre-filled — verify they're accurate.
# Mis à jour par /pm-challenge-me le 2026-10-04, après le pari de l'instrument.

1. What are you building? (one sentence, no jargon)
   [auto from product.md] Un instrument pour jouer de la littérature potentielle : on charge un texte français, on branche et règle en direct une chaîne de contraintes oulipiennes sur ses pistes, on garde les prises au carnet. En ligne sur https://oulipao.incongru.org (v0.6.2).

2. Who is the primary user? (job title, company size, situation)
   [auto from personas.md] Le fondateur, qui joue de l'instrument et le construit ; les textes sont le sous-produit. Secondaire : le proche qui reçoit un lien ou un puzzle (Proche A, Proche B), pour le lien et le puzzle seulement. Anti-persona : celui qui veut que l'IA écrive à sa place.

3. What is the single most important thing users do with it today?
   [auto from feedback.md] Coller un texte, enchaîner des contraintes, copier le résultat et l'envoyer dans une messagerie ou par mail.

4. What did you ship in the last 30 days?
   [auto from git log] 3-4 octobre, 157 commits, v0.6.2 : moteur S+7 accordé, pistes, 15 moteurs, 15 recettes, carnet, écoute vocale et discrépance, modulateur et porte, verrous, itérer et figer, V+n, lien partageable, lettrisme (Ciselure, Alphabet augmenté), mise en vers par syllabes, temps linéaire, file de fusion. PRD du mode puzzle sur une branche (#89).

5. What are your top 1-2 goals for this quarter?
   [auto from objectives.md] O1 « Un instrument dont on joue » : une prise par semaine hors débogage, défauts corrigés sous 7 jours, 70 % du catalogue joué. O2 « D'autres en jouent sans relance » : lien nu à 7 personnes, retour spontané, puzzle renvoyé résolu.

6. What are your users doing RIGHT NOW when your product doesn't cover their need?
   [auto from feedback.md + code] Ils copient le résultat dans une messagerie ; « Copier » sous le résultat n'emporte pas l'original (`controller.ts:571`), et Proche B demande si on retrouve le texte initial. Quand le sens disparaît : « ça veut plus rien dire après 😅 ».

7. What have you explicitly decided NOT to build, and why?
   [auto from roadmap.md] Pas d'IA générative, pas de comptes ni de serveur, pas d'autres langues, pas de chaîne par piste, pas de format de plugin publié, pas de partage en un clic hors puzzles.

8. Who are your 3 most important users/customers right now?
   [auto from personas.md + feedback.md] Le fondateur ; Proche B (critique et demande d'usage) ; Proche A (silencieux depuis le 3 octobre).

9. What is the one metric that matters most to you right now?
   [auto from objectives.md] Prises de jeu par semaine hors débogage (O1 KR1) ; personnes qui ouvrent Oulipao d'elles-mêmes (O2, 0 sur 3).

10. What's the biggest thing you're uncertain or worried about?
    [auto from personas.md + strategy.md] Construire et corriger au lieu de jouer : personne, fondateur compris, n'a de prise documentée hors débogage.

11. What development methodology does your team use?
    [auto from org.md] Aucune ; NOW / NEXT / LATER sans dates.

12. How does this project ship?
    [auto from org.md] a) Solo + AI agents

Réponses aux défis précédents (historique) :
- 2026-10-03 matin : je construis d'abord un prototype à pistes, puis je le montre.
- 2026-10-03 soir : je reviens autant pour construire que pour écrire.
- 2026-10-04 : pari de l'instrument : le plaisir vient de l'instrument, les textes sont le sous-produit.
