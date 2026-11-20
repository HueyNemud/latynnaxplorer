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

## Hors sprint : demandes à numrev

À transmettre par l'utilisateur ; rien n'est contourné ici.

- `docs/demandes/numrev_intitules_titres.md` : deux intitulés de titres
  gardent des marques Markdown (`##` au milieu, `\` final).
- `docs/demandes/numrev_noeud_racine.md` : un vrai nœud racine par volume.
  Sans lui, 1807 a 133 racines : on ne peut pas ouvrir le volume entier,
  et ses 90 éléments hors champ à la racine ne se sélectionnent que par la
  recherche (les facettes n'en ont plus besoin pour le reste).

## Sprint 7 : sélectionner par le contenu (PR #17)

Réalisé : recherche par texte dans tout l'annuaire (`?text=`, exacte,
sans accents ni casse), critères tous facultatifs et combinables,
résultats regroupés sous toutes leurs rubriques, champ de recherche
réutilisable (`components/SearchForm.tsx`) ; demande à numrev pour un vrai
nœud racine. Détail dans `docs/JOURNAL.md`.

But : une porte d'entrée sans uuid.

Étapes, validées une à une :

1. Requête (fait) : scénario 2 de `docs/SCENARIOS.md`, `?text=<texte>`,
   phrase entière sans accents ni casse, sur le texte de tous les nœuds
   (index trigrammes en place). Tous les critères sont facultatifs et se
   combinent (`subtree` + `text`). Tests.
2. Contexte de résultats dispersés (fait) : les rubriques ancêtres de tous
   les résultats ; la vue Liste regroupe les résultats sous leurs rubriques
   communes. Sans changer le modèle de données.
3. Champ de recherche (fait) : composant `SearchForm`, indépendant de la
   vue, au-dessus de la liste ; il cherche dans tout l'annuaire.
4. Journal, décisions, revue de ce fichier (fait).

Choix validés :

- Recherche sur le texte entier seulement ; par champ (sujet, activité,
  adresse) plus tard si le besoin se confirme.
- Recherche exacte, pas floue : mesurée sur 1807, la similarité par
  trigrammes ramenait trop de bruit (« paix » → « Paille ») ; plein texte
  de PostgreSQL écarté aussi (`docs/IDEES.md`).
- Tout rendre, même une sélection plus grosse que le plus gros sous-arbre
  (« rue » : 17 402 nœuds sur 22 158) ; pagination toujours reportée
  (`docs/IDEES.md`).
- Saisie par un formulaire natif (`<form method="get">`, sans script) :
  `nuqs` reporté de nouveau.
- La recherche porte sur tout l'annuaire, pas sur la rubrique ouverte
  (essayé, jugé déroutant) : chaque point d'entrée commence une nouvelle
  sélection. Choisir les rubriques où chercher viendra avec les facettes
  (sprint 8).
- Surlignage des correspondances hors sprint (`docs/IDEES.md`).

## Sprint 8 : facettes de structure (PR #18)

Réalisé : concept (`docs/DESIGN.md`, « Sélection et focus » et
« Facettes »), maquette revue à l'écran sous Chromium et Firefox, fiche de
composant (`docs/composants/facettes.md`) ; `subtree` répétable (union des
sous-arbres), volumes et rubriques avec leurs décomptes
(`lib/query/facets.ts`) ; panneaux Volumes et Contents
(`components/Facets.tsx`) ; le champ de recherche et les cases forment un
seul formulaire. Détail dans `docs/JOURNAL.md`.

But : restreindre la sélection par des facettes emboîtées, volumes puis
rubriques ; la recherche par texte s'applique dans ce périmètre.

Choix validés :

- Sélection et focus distingués dans toute l'application : une case pour
  sélectionner, un clic sur l'objet pour le regarder.
- Colonnes de Miller collées à gauche (Volumes | Contents | vue), chacune
  repliable par une bande sur son côté droit, liées par niveau ; vue
  centrée dans la place restante. Carrousel de volumes écarté.
- Carte de volume : coche ronde sur la vignette (tout le volume, ou rien),
  clic sur la vignette pour le focus (cernée, encoche vers Contents) ;
  année et nom dans la vignette, rien dessous. Contents : arbre du volume
  au focus, casse imprimée, retrait simple, décomptes.
- Rubrique cochée = tout son sous-arbre, descendants couverts (grisés) ;
  volume sélectionné si une rubrique au moins l'est ; pas de paramètre
  `volume`. Nœuds hors de toute rubrique : par la recherche seulement.
- Un seul formulaire GET : la recherche porte sur les rubriques cochées
  (remplace la décision du sprint 7) ; « Apply selection » en bas de
  Contents, seulement s'il y a des changements ; sans `nuqs`.
- Arrivée inchangée (l'entrée de démonstration) ; arbre déplié jusqu'aux
  rubriques cochées.
- Reportés (`docs/IDEES.md`) : écran étroit, poids de l'arbre.

## Sprint 9 : nettoyage du code (PR #19)

Réalisé : doublons retirés (texte sans emphase, icônes, regroupements),
règles des coches en fonctions pures testées (`lib/facets/selection.ts`),
types séparés du SQL (`lib/query/types.ts`), feuille de style rangée et
factorisée, README et modèle de données à jour ; 94 tests. Détail dans
`docs/JOURNAL.md`.

But : après huit sprints, remettre le code au propre avant d'ajouter des
fonctionnalités, sans rien changer à ce que l'on voit.

Choix validés :

- Tout l'état des lieux appliqué, plus un audit des styles : réutiliser
  autant que possible, surtout si la différence est faible. Différences
  faibles acceptées (lignes de l'arbre, anneau de la vignette, pages
  d'erreur), le reste identique sous Chromium et Firefox.
- `AGENTS.md` de `next dev` versionné ; arcs du sous-graphe gardés.
- Reporté (`docs/IDEES.md`) : tests de rendu des composants.

## Sprint 10 : facettes et Liste, toujours d'accord (PR #20)

Réalisé : facettes conformes à l'URL après toute navigation, entrée seule
située ; sélection vide sans entrée par défaut (« Nothing to show ») ;
Apply et Clear en haut de Contents (rendu provisoire). Maquette Radix
Themes / Primer React : Radix retenu pour toute l'interface. Détail dans
`docs/JOURNAL.md`.

But : que les facettes et la Liste disent toujours la même chose, et qu'une
sélection vide soit vraiment vide.

Étapes, validées une à une :

1. **Facettes conformes à l'URL** : l'URL est la seule source. À chaque
   navigation (lien « Open on its own page », fil d'Ariane, recherche,
   bouton Précédent), les cases reprennent les coches de l'URL ; le volume
   regardé et les rubriques dépliées restent, le chemin des nouvelles
   coches est déplié en plus. Exemple : B cochée sous A, puis A ouverte
   depuis la Liste : A est cochée, B couverte. Aujourd'hui, la navigation
   de Next garde le composant client, dont l'état n'est lu qu'au premier
   rendu.
2. **Sélection vide** : plus d'entrée par défaut. Sans critère, le
   sous-graphe est vide et la vue dit « Nothing to show » (grand aplat
   gris, petit caractère unicode) ; le proxy ne redirige plus.
3. **Apply et Clear en haut de Contents** : toujours affichés, inactifs
   quand ils ne servent pas (Apply : cases identiques à la sélection
   affichée ; Clear : rien de coché). Clear décoche tout et applique
   aussitôt, en gardant le texte cherché.
4. Fiche `docs/composants/facettes.md`, `docs/DESIGN.md`, journal,
   décisions, revue de ce fichier.

Choix validés :

- Un bouton pour appliquer, pas de filtre à la coche (`docs/IDEES.md`) ;
  formulaire GET natif inchangé, sans `nuqs`.
- Texte cherché sans rubrique cochée : tout l'annuaire, comme aujourd'hui ;
  « Nothing to show » seulement sans aucun critère.
- Sélection d'un nœud qui n'est pas une rubrique (une entrée ouverte à
  part) : rien n'est coché, mais les facettes la situent (focus sur son
  volume, chemin de sa rubrique déplié). Cocher puis Apply remplace la
  sélection.
- Vérifié sous Chromium et Firefox.

## Sprint 11 : passage à Radix Themes

But : une interface stylée et homogène, en s'appuyant sur Radix Themes
plutôt qu'en dessinant chaque contrôle (`docs/DECISIONS.md`, 20 novembre) ;
en cours de sprint, une Liste allégée : plus de navigation qui double les
facettes, fiche chargée au dépliage.

Étapes, validées une à une :

1. **Thème et planche** : `<Theme>` à la racine (`app/layout.tsx`), Fira
   Sans gardée ; planche sur la vraie page (Contents, Liste avec une fiche
   dépliée, recherche) pour choisir couleur d'accent, gris, rayon et
   densité.
2. **Jetons** : nos couleurs, espacements, rayons et ombres remplacés par
   ceux de Radix ; ne restent que les jetons de notre mise en page
   (largeurs des panneaux, colonnes de la Liste, guides).
3. **Contrôles** : Apply / Clear en Button ; « × » de la recherche, lien
   « Open », peut-être les bandes de repli, en IconButton ; cases de
   l'arbre et coche des volumes en Checkbox ; recherche en TextField.
4. **Une seule navigation, par les facettes** (ajouté en cours de sprint) :
   « Open on its own page » supprimé ; fil d'Ariane de la fiche en texte,
   sans liens ; la synchronisation du sprint 10 retirée (plus rien ne
   change l'URL sans recharger la page) ; une entrée désignée par l'URL
   n'est plus située dans les facettes.
5. **Fiche au dépliage** (ajouté en cours de sprint) : la fiche n'est plus
   rendue d'avance, mais demandée au serveur au premier dépliage (fonction
   serveur), puis gardée ; une sélection d'un seul nœud garde sa fiche
   rendue et dépliée. Mesuré : sur « LISTES PARTICULIÈRES », les fiches
   font la moitié des 26 Mo de HTML (81 Mo avec le flux RSC). Fiche en
   DataList.
6. **Vignettes** en Card.
7. **Vue Liste** : lignes en HTML léger avec les jetons Radix ; couleurs
   des champs rejouées dans les échelles Radix (planche).
8. Captures avant / après sous Chromium et Firefox ; poids mesuré en
   production (arrivée, « LISTES PARTICULIÈRES » : 13 737 nœuds), feuille
   de Radix par morceaux si son poids pèse (668 Ko, 80 Ko compressés) ;
   fiches de composant, `docs/DESIGN.md`, journal, décisions.

Choix validés :

- Une seule dépendance : `@radix-ui/themes` (3.3.0).
- Fiche : DataList, rendue seulement au dépliage. Sans script, une ligne
  dépliée ne montre pas sa fiche.
- Thème : accent iris sur gris mauve (planche de huit combinaisons) ;
  ombre `--shadow-4` pour le relief.
- Feuille complète de Radix d'abord ; import par morceaux si son poids
  pèse.
- Coche ronde des volumes : Checkbox Radix rendue ronde par ses variables
  CSS.
- Sans script, les facettes ne marchent plus (décidé au sprint 10).
- Hors sprint : mode sombre (`docs/IDEES.md`), pagination de la Liste,
  tout autre changement de mise en page.

## Sprint 12 : exporter

But : récupérer la sélection dans un format de données ; trancher en même
temps le format de l'API JSON (section suivante).

## À décider au moment voulu : format de l'API JSON

Dès qu'une API HTTP exposera les sous-graphes (pas tant que les pages
appellent `lib/query/` côté serveur) : décrire ses réponses selon une
pratique standard plutôt qu'un formalisme ad hoc (OpenAPI ou plus récent,
à comparer alors).

## Plus tard (non planifié)

Recherche par champ (sujet, activité, adresse) ; surlignage des
correspondances. Vues Page (IIIF), Carte et
Frise, avec leurs critères (page, zone, période) ; géocodage ; liens temporels, autres annuaires et « suivre » ;
deux vues côte à côte ; idées de performance (`docs/IDEES.md`). Chacun
aura son sprint, proposé le moment venu.
