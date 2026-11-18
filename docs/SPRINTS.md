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

## En cours : sprint d'entretien, mises à jour majeures

Branche `docs/mises-a-jour-majeures` (journal et feuille de route
seulement : les mises à jour arrivent par les PR Renovate).

PR Renovate examinées une à une, après rebasage sur `main` pour que la CI
passe les tests du sprint 2 : #7 (`postgres` v4), puis #8 (TypeScript 7).

**Fin** : #7 et #8 tranchées par l'utilisateur, PR de la branche fusionnée.

## Sprint 3 : première page, vue Liste

But : voir un sous-graphe dans un navigateur.

- Next.js (App Router) minimal, requête dans l'URL avec `nuqs`.
- Vue Liste seulement, dans l'ordre du document, sans style travaillé.

**À discuter** : liste exacte des dépendances ; ce que montre une ligne de
la liste.

## À décider au moment voulu : format de l'API JSON

Dès qu'une API HTTP exposera les sous-graphes (pas tant que les pages
appellent `lib/query/` côté serveur) : décrire ses réponses selon une
pratique standard plutôt qu'un formalisme ad hoc (OpenAPI ou plus récent,
à comparer alors).

## Plus tard (non planifié)

Vues Document (IIIF), Carte et Temps ; géocodage ; liens temporels et
autres annuaires ; idées de performance (`docs/IDEES.md`). Chacun aura son
sprint, proposé le moment venu.
