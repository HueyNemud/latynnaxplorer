# Prochains sprints

Feuille de route courte, revue à la fin de chaque sprint : on ne planifie
que les prochaines étapes. Chaque sprint est petit, se fait sur sa propre
branche et arrive dans `main` par une PR relue et fusionnée par
l'utilisateur. Son contenu exact est proposé puis validé avant d'écrire du
code (périmètre, dépendances, choix discutables).

## Fait

- **Modèle de données** (PR #1) : schéma Drizzle, validation des fichiers
  numrev, import de `data/1807`, index mesurés.
- **Sprint 1, intégration continue** (PR #2) : CI GitHub Actions, `main`
  protégée, Renovate.
- **Sprint 2, requête → sous-graphe** (PR #10) : `?subtree=<uuid>`,
  sous-graphe induit résolu en une requête SQL, base de test en local et en
  CI.
- **Sprint d'entretien, mises à jour majeures** (PR #7, #8 et la PR de
  `docs/mises-a-jour-majeures`) : `postgres` v4, TypeScript 7.

## Sprint 3 : première page, vue Liste

But : voir un sous-graphe dans un navigateur.

- Next.js (App Router) minimal ; la page lit `?subtree=` côté serveur avec
  `lib/query/` (`nuqs` reporté).
- Vue Liste seulement, dans l'ordre du document, sans style travaillé.
- Dépendances et réglages tranchés (`docs/DECISIONS.md`, 18 novembre).

**À discuter** : ce que montre une ligne de la liste. Pistes déjà
relevées :
- disposition plate (une ligne par nœud, sections distinguées, hors champ
  marqué) ou indentée selon la profondeur (calculée depuis `parentId`) ;
- en plus du texte : lien de chaque ligne vers son sous-arbre (« ouvrir
  une entrée », sans toucher `lib/query/`) ; empans SUBJ/DESC/ADDR ou
  numéro de page (tous deux demandent d'étendre `resolve`).

## À décider au moment voulu : format de l'API JSON

Dès qu'une API HTTP exposera les sous-graphes (pas tant que les pages
appellent `lib/query/` côté serveur) : décrire ses réponses selon une
pratique standard plutôt qu'un formalisme ad hoc (OpenAPI ou plus récent,
à comparer alors).

## Plus tard (non planifié)

Vues Document (IIIF), Carte et Temps ; géocodage ; liens temporels et
autres annuaires ; idées de performance (`docs/IDEES.md`). Chacun aura son
sprint, proposé le moment venu.
