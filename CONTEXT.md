# Context
# nanopm uses this to challenge your product thinking. Edit freely.
# Lines marked [auto] were pre-filled — verify they're accurate.
# Mis à jour par /pm-challenge-me le 2026-10-04.

1. What are you building? (one sentence, no jargon)
   [auto from product.md + code] Oulipao : un instrument dans le navigateur qui découpe un texte français en pistes grammaticales et lui applique une chaîne de contraintes oulipiennes (S+7, V+7, lipogramme, rimes, formes à refrain), sans compte et sans que le texte quitte la page. En ligne sur https://oulipao.incongru.org.

2. Who is the primary user? (job title, company size, situation)
   [auto from personas.md + feedback.md] Le fondateur, qui construit et écrit à parts égales. Publics non ciblés observés : miasmes (joue pour rire, montre le résultat) et Rozie (trouve ça rigolo mais « ça veut plus rien dire après » ; veut changer l'humeur d'un texte).

3. What is the single most important thing users do with it today?
   [auto from feedback.md] Coller un texte, enchaîner des contraintes, copier le bloc du carnet (résultat + ligne de chaîne) et l'envoyer dans une messagerie ou par mail.

4. What did you ship in the last 30 days?
   [auto from git log] 3 octobre : moteur S+7, pistes, filtres chaînables, V+7, lipogramme, rimes, formes à refrain, mise en ligne. 4 octobre (~100 PR fusionnées depuis le 3 au soir) : carnet de textes gardés, texte libre, recettes (tautogramme, abécédaire, éclipse, S+dé), monitoring vocal, modulateur, itérer et figer, V+n par valence, exemples en rotation, correctifs d'audit (interface, données, domaine), critique de design, file de fusion ; PRD du mode puzzle en cours (#89).

5. What are your top 1-2 goals for this quarter?
   [auto from objectives.md] O1 : un prototype à pistes avec un S+7 français correct (atteint). O2 : que le fondateur se serve d'Oulipao pour écrire : 5 textes gardés avant le 31 décembre, une séance par semaine pendant 6 semaines, 3 textes à plusieurs filtres.

6. What are your users doing RIGHT NOW when your product doesn't cover their need?
   [auto from feedback.md] Ils copient le bloc du carnet dans une messagerie ; l'original n'y figure pas, et Rozie demande si on retrouve le texte initial. Quand le sens disparaît, ils rient une fois puis décrochent.

7. What have you explicitly decided NOT to build, and why?
   [auto from roadmap.md] Pas de génération par IA, pas de comptes ni de sauvegarde serveur, pas d'autres langues, pas de chaîne par piste, pas de nouvelle fiche du séquenceur tant qu'aucun texte n'est gardé ; en LATER : format de plugin publié, partage en un clic, cinq testeurs.

8. Who are your 3 most important users/customers right now?
   [auto from feedback.md] Le fondateur ; Rozie (critique et demande d'usage, 4 octobre) ; miasmes (premier texte extérieur le 3 octobre, sans réponse aux deux messages du 4).

9. What is the one metric that matters most to you right now?
   [auto from objectives.md + feedback.md] Le nombre de textes gardés ou montrés : 1 de miasmes ; 3 du fondateur envoyés le 4 octobre (présence au carnet non vérifiée).

10. What's the biggest thing you're uncertain or worried about?
    [auto from strategy.md] Construire au lieu d'écrire. Garde : trois semaines sans texte gardé alors que les commits continuent.

11. What development methodology does your team use?
    [auto from org.md] Aucune ; NOW / NEXT / LATER sans dates.

12. How does this project ship?
    [auto from org.md] a) Solo + AI agents

Réponse aux contradictions (2026-10-03, matin) : je ne sais pas si le lecteur reviendra. Je construis d'abord un prototype à pistes (la métaphore de MAO est l'idée), puis je le montre à cinq personnes des deux profils.

Réponse aux contradictions (2026-10-03, soir) :
- Q10, question évitée : je reviens autant pour construire l'instrument que pour écrire, à parts égales. Un objectif pour chacun, avec une garde pour que la construction ne mange pas l'écriture.
- Q2 : un texte gardé ou montré par quelqu'un d'autre (comme celui de miasmes) compte pour les objectifs.
