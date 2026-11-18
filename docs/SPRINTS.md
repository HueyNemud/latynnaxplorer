# Prochains sprints

Feuille de route courte, revue à la fin de chaque sprint : on ne planifie
que les prochaines étapes. Chaque sprint est petit, se fait sur sa propre
branche et arrive dans `main` par une PR relue et fusionnée par
l'utilisateur. Son contenu exact est proposé puis validé avant d'écrire du
code (périmètre, dépendances, choix discutables).

## Fait

- **Modèle de données** (PR #1) : schéma Drizzle, validation des fichiers
  numrev, import de `data/1807`, index mesurés.

## En cours : sprint 1, intégration continue

Branche `build/integration-continue`.

But : qu'aucune PR n'arrive dans `main` sans vérification automatique.

- GitHub Actions sur chaque PR et chaque push sur `main` : install, lint,
  typecheck, test (build quand l'application existera). Pas de base
  PostgreSQL tant que les tests n'en ont pas besoin.
- Protection de `main` : fusion par PR seulement, CI verte exigée, sans
  relecture obligatoire (mainteneur seul), force-push interdit.
- Renovate (demandé par le brief) : hebdomadaire, mineures et correctifs
  groupés, majeures à part, pas de fusion automatique.

**Fin** : PR relue et fusionnée, protection active.

## Sprint 2 : requête → sous-graphe (`lib/query/`)

But : le cœur du principe fonctionnel, sans interface.

- Une requête minimale : par exemple une rubrique et un texte flou sur un
  champ.
- Sérialisation ⇄ URL (format de chaîne seulement, sans `nuqs` à ce stade).
- Résolution en SQL : les nœuds, puis les arcs `member_of`, `child_of` et
  `follows` (formes de `docs/MODELE_DONNEES.md`, section 4).
- Tests sur la petite fixture, contre une vraie base PostgreSQL.

**À discuter** :
- les filtres du premier jet (le moins possible) ;
- le format de la requête dans l'URL ;
- la base de test : conteneur Docker local et en CI.

## Sprint 3 : première page, vue Liste

But : voir un sous-graphe dans un navigateur.

- Next.js (App Router) minimal, requête dans l'URL avec `nuqs`.
- Vue Liste seulement, dans l'ordre du document, sans style travaillé.

**À discuter** : liste exacte des dépendances ; ce que montre une ligne de
la liste.

## Plus tard (non planifié)

Vues Document (IIIF), Carte et Temps ; géocodage ; liens temporels et
autres annuaires ; idées de performance (`docs/IDEES.md`). Chacun aura son
sprint, proposé le moment venu.
