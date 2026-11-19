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
- **Sprint 3, concept de design** (PR #13) : `docs/DESIGN.md` (objectif,
  profils, domaines, sélection et vues orthogonales, fonctionnalités,
  représentations d'un nœud, principes d'affichage), sans code.

## Sprint 4 : la fiche d'un nœud (PR #14)

Réalisé : fiche de composant (`docs/composants/noeud-liste.md`), `resolve`
avec empans et ancres, `context`, Next.js, fiche en clés / valeurs (Text,
champs, métadonnées), entrée par défaut, 400 et 404 (détail dans
`docs/JOURNAL.md`). Le texte souligné (`components/PrintedText.tsx`) est
prêt pour la compacte du sprint 5.

But : voir un nœud dans un navigateur, en densité détaillée (vue Liste
seulement : les autres vues attendent leurs données).

- Avant le code : fiche de composant pour la représentation d'un nœud dans
  la vue Liste, par type (`entry`, `section`, `out_of_scope`) et par
  densité (skill `design:design-system`), validée avec l'utilisateur.
- Next.js (App Router) minimal ; dépendances et réglages déjà tranchés
  (`docs/DECISIONS.md`, 18 novembre). La page lit `?subtree=` côté
  serveur ; une sélection d'un seul nœud donne sa fiche.

Choix validés au début du sprint :

- `resolve` renvoie en plus, pour chaque nœud, ses champs (empans) et ses
  ancres (page, boîte) ; le chemin des rubriques est renvoyé à part du
  sous-graphe, comme contexte ; rien de plus sur le volume pour l'instant.
- Une sélection de plusieurs nœuds affiche seulement leur nombre et
  signale que la vue Liste arrive au sprint 5.
- La page source s'affiche en texte (« p. 60 ») ; elle deviendra un lien
  avec les images IIIF.
- Requête mal formée : 400 ; uuid inconnu : 404.

## Sprint 5 : la vue Liste (PR #15)

Réalisé : maquette revue à l'écran, fiche de composant réécrite
(`docs/composants/noeud-liste.md`), vue Liste (`components/NodeList.tsx`) :
cartes emboîtées, contexte compris, un seul élément `<details>` pour tout
nœud, titres fixés et empilés, champs sur fond pastel, Open ; `context`
renvoie des nœuds complets ; vérifié sous Chromium et Firefox, arbre
d'accessibilité compris. Poids des très grosses rubriques mesuré et
accepté pour l'instant (`docs/IDEES.md`, « Pagination »). Détail dans
`docs/JOURNAL.md`.

But : une sélection de plusieurs nœuds, en densité compacte, dans son
contexte.

Choix validés :

- Tout rendre, même le plus gros sous-arbre (13 737 nœuds) : pagination
  reportée (`docs/IDEES.md`).
- La vue détaillée (la fiche du sprint 4, telle quelle) se déplie sous la
  ligne.
- Composition, états, couleurs, Open : `docs/composants/noeud-liste.md` et
  `docs/DECISIONS.md` (19 novembre).
- Aucune nouvelle dépendance ; `nuqs` reste au sprint 7.
- Sélection d'un seul nœud montrée comme toute sélection (ses cartes de
  contexte, sa ligne dépliée).

## Sprint 6 : la vue Liste à plat, guides de niveau (PR #16)

But : une liste plate, plus légère que les cartes emboîtées, où l'on voit
où l'on en est : la hiérarchie se lit par des filets verticaux à gauche
(guides de niveau, *indent guides*), rattachés aux titres fixés.

- Maquette d'abord (`app/maquette/`, non versionnée, supprimée à
  l'implémentation), sur les rubriques du sprint 5 : « III.e Mairie » et
  « Administration générale des Postes ». Revue à l'écran, Chromium et
  Firefox.
- Puis fiche de composant (`docs/composants/noeud-liste.md`) et décision
  (`docs/DECISIONS.md`) qui remplace les cartes emboîtées ; implémentation
  dans `NodeList.tsx` et `globals.css` ; mêmes vérifications qu'au
  sprint 5.

Choix validés :

- Une seule couleur pour tous les guides de niveau.
- Les cartes restent, mais seulement autour d'un élément (ligne et fiche) :
  invisibles au repos, fond au survol, en relief une fois dépliées.
- Maquette arrêtée (détail dans `docs/composants/noeud-liste.md` et
  `docs/DECISIONS.md`) : guides coudés terminés par une boule, chevron,
  lien en icône à la place d'Open, titres en capitales, sujet en petites
  capitales, Fira Sans. L'intitulé le long du guide a été essayé et écarté.
- Réglages après implémentation : seul le guide de la section la plus
  proche reste foncé, les autres sont estompés ; fil d'Ariane en fin de
  fiche, sur une ligne.
- Inchangés : un seul `<details>` par nœud, sans script ; fiche dépliée ;
  aucune nouvelle dépendance. Les colonnes passent à texte | page (le lien
  suit le texte). La couleur ne porte jamais seule l'information (retrait,
  régions nommées).

## Hors sprint : demande à numrev

`docs/demandes/numrev_intitules_titres.md` : deux intitulés de titres
gardent des marques Markdown (`##` au milieu, `\` final). À transmettre
par l'utilisateur ; rien n'est contourné ici.

## Sprint 7 : sélectionner par le contenu

But : une porte d'entrée sans uuid.

- Recherche tolérante sur le texte et les champs (index trigrammes déjà
  en place) : nouveau scénario de `docs/SCENARIOS.md`, combinable avec
  `subtree`.
- Première modification de la requête dans le navigateur : trancher alors
  `nuqs` (`docs/IDEES.md`).
- À discuter au début du sprint : une recherche peut renvoyer des milliers
  de nœuds ; la pagination de la vue Liste (`docs/IDEES.md`, mesures du
  sprint 5) pourrait devenir nécessaire.

## Sprint 8 : exporter

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
