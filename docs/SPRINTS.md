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

## Sprint 4 : la fiche d'un nœud (en cours)

Branche `feat/fiche-noeud`, PR ouverte, en attente de relecture.

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

## Sprint 5 : la vue Liste

But : une sélection de plusieurs nœuds, en densité compacte, dans son
contexte.

- Densité compacte : le texte souligné du sprint 4 (champs soulignés de la
  couleur de leur libellé, nom `subj` / `desc` / `loc` sous le trait).
  Avant le code, maquette sur une vraie rubrique : garder les noms sous
  chaque trait (interligne plus grand) ou les montrer autrement (survol,
  légende) ; compléter `docs/composants/noeud-liste.md` (états, structure
  de liste accessible).
- Disposition dans l'ordre du document ; arcs `member_of` / `child_of`
  rendus par regroupement.
- Contexte : chemin des rubriques au-dessus de la sélection.
- Inspecter : le focus sur une ligne montre sa fiche (le composant du
  sprint 4) à côté, sans changer la sélection ; ouvrir une entrée (nouvelle
  URL).
- Performance à surveiller : le plus gros sous-arbre compte 13 737 nœuds
  (`resolve` : 90 ms) ; rendre des milliers de lignes d'un coup ou non.

## Hors sprint : demande à numrev

`docs/demandes/numrev_intitules_titres.md` : deux intitulés de titres
gardent des marques Markdown (`##` au milieu, `\` final). À transmettre
par l'utilisateur ; rien n'est contourné ici.

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
