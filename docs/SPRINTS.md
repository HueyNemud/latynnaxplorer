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

## Sprint 3 : concept de design (en cours)

Branche `docs/concept-design`, sans code. `docs/DESIGN.md` : objectif,
profils, domaines, sélection et vues orthogonales, fonctionnalités,
représentations d'un nœud, principes d'affichage. Remplace le sprint
« première page, vue Liste » prévu jusqu'ici.

## Sprint 4 : la fiche d'un nœud

But : voir un nœud dans un navigateur, en densité détaillée (vue Liste
seulement : les autres vues attendent leurs données).

- Avant le code : fiche de composant pour la représentation d'un nœud dans
  la vue Liste, par type (`entry`, `section`, `out_of_scope`) et par
  densité (skill `design:design-system`), validée avec l'utilisateur.
- Next.js (App Router) minimal ; dépendances et réglages déjà tranchés
  (`docs/DECISIONS.md`, 18 novembre). La page lit `?subtree=` côté
  serveur ; une sélection d'un seul nœud donne sa fiche.

**À discuter** : ce que `resolve` doit renvoyer en plus (champs
SUBJ/DESC/ADDR, page, chemin des rubriques comme contexte) ; ce que montre
une sélection de plusieurs nœuds en attendant le sprint 5.

## Sprint 5 : la vue Liste

But : une sélection de plusieurs nœuds, en densité compacte, dans son
contexte.

- Disposition dans l'ordre du document ; arcs `member_of` / `child_of`
  rendus par regroupement.
- Contexte : chemin des rubriques au-dessus de la sélection.
- Inspecter : le focus sur une ligne montre sa fiche à côté, sans changer
  la sélection ; ouvrir une entrée (nouvelle URL).

## Sprint 6 : sélectionner par le contenu

But : une porte d'entrée sans uuid.

- Recherche tolérante sur le texte et les champs (index trigrammes déjà
  en place) : nouveau scénario de `docs/SCENARIOS.md`, combinable avec
  `subtree`.
- Première modification de la requête dans le navigateur : trancher alors
  `nuqs` (`docs/IDEES.md`).

## Sprint 7 : exporter

But : récupérer la sélection dans un format de données ; trancher en même
temps le format de l'API JSON (section suivante).

## À décider au moment voulu : format de l'API JSON

Dès qu'une API HTTP exposera les sous-graphes (pas tant que les pages
appellent `lib/query/` côté serveur) : décrire ses réponses selon une
pratique standard plutôt qu'un formalisme ad hoc (OpenAPI ou plus récent,
à comparer alors).

## Plus tard (non planifié)

Vues Page (IIIF), Carte et Frise, avec leurs critères (page, zone,
période) ; géocodage ; liens temporels, autres annuaires et « suivre » ;
deux vues côte à côte ; idées de performance (`docs/IDEES.md`). Chacun
aura son sprint, proposé le moment venu.
