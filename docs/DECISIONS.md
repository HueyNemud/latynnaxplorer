# Décisions structurantes

Les décisions en vigueur, une ligne chacune, avec un renvoi vers le détail.
Une décision remplacée est réécrite, pas empilée : l'historique est dans
`git log` et les PR. Une alternative écartée n'est notée que si elle risque
de revenir.

## Projet et outillage

- Un sprint = une branche ; `main` protégée (check `verification`, ni
  force-push ni suppression) ne reçoit que des PR fusionnées par
  l'utilisateur, par merge commit (`CLAUDE.md`). Dépôt public.
- CI GitHub Actions : lint, typecheck, tests, build ; Renovate le lundi,
  sans fusion automatique (`.github/`, `renovate.json`).
- Node 26, pnpm 12, dépendances en versions exactes ; Next.js (App Router),
  imports avec extension `.ts` (`tsconfig.json`, `biome.json`).
- Site entièrement statique (`output: "export"`), tout résolu dans le
  navigateur ; volumes hébergés à part ou avec le site, index fixé au build
  (README, « Mise en ligne »). Un besoin de serveur serait un service à côté.
- Publication sur GitHub Pages à chaque arrivée sur `main`, sous le
  sous-chemin `/latynnaxplorer` ; les volumes, hors Git (7 Mo chacun,
  réécrits à chaque export), sont pris dans la release `volumes`.
- Requêtes et règles des cases en fonctions pures de `lib/`, testées sur la
  fixture (`scripts/fixture.ts`).
- Interface en anglais ; le texte des annuaires n'est jamais traduit.

## Données et modèle (`docs/MODELE_DONNEES.md`)

- numrev fait foi : export tel quel, validé contre ses JSON Schema, sans
  rattrapage ; un défaut se demande à numrev (`docs/demandes/`).
- Un fichier JSON par volume et un index des volumes ; JSON plutôt que
  Parquet ou YAML (lu nativement, sans dépendance) ; le fichier omet ce qui
  se déduit.
- Un seul type de nœud (rubrique, entrée, élément hors champ), un seul
  ordre de lecture ; un groupe à accolade est un seul nœud.
- Arcs jamais stockés : `member_of`, `child_of`, `follows` se déduisent
  des nœuds, et ne seront calculés que pour une vue qui les montre.
- Rien ne suppose qu'une rubrique soit d'un seul tenant tant que numrev ne
  le garantit pas.

## Requête (`docs/SCENARIOS.md`, `lib/query/`)

- La requête vit dans l'URL et s'y réécrit à l'identique ; critères
  `subtree`, `text`, `in`, combinés en conjonction ; un critère absent ne
  filtre rien (modèle standard des facettes) : sans critère, tous les
  volumes sont sélectionnés ; sous-graphe toujours induit strict.
- Requête mal formée ou uuid inconnu : un message à la place de la vue.
- Recherche exacte, sans accents ni casse (`lib/query/fold.ts`) ; écartée
  après mesure : la similarité par trigrammes (`docs/IDEES.md`, « Recherche
  tolérante »).
- Zones de la recherche : aucune ou toutes = tout le texte, comme sans
  rubrique cochée = tous les volumes.
- Volumes chargés à la demande : celui au focus, ou tous si la requête ne
  dit pas où chercher ; une requête parcourt tout le volume, sans index.
- Le contexte n'est jamais compté dans la sélection.
- Export de la sélection en CSV, fabriqué dans le navigateur : une ligne
  par nœud, une colonne par niveau de rubrique et par libellé d'empan
  (`docs/DESIGN.md`, « Export »).
- API publique : les fichiers des volumes ; pas d'API JSON pour l'instant.
  Si elle vient, ses réponses suivront une pratique standard (OpenAPI ou
  plus récent).

## Interface (`docs/DESIGN.md`)

- Explorer, sélectionner, exporter ; mesurer et relier reviennent aux
  historiens, à partir de l'export (`docs/IDEES.md`).
- Sélection (dans l'URL) et focus (hors de l'URL) distingués partout.
- Réglages d'affichage hors de l'URL, mémorisés dans le navigateur
  (`localStorage`, une clé par réglage) ; ils ne changent pas la sélection.
- Une barre de la sélection (critères, export) commune à toutes les vues ;
  chaque vue fournit ses outils (ses réglages), séparés par un trait
  (`docs/DESIGN.md`, « Barre de la sélection et outils de la vue »).
- Radix Themes pour toute l'interface (iris sur gris mauve), feuille
  importée entière, et ses icônes (`@radix-ui/react-icons`) ;
  `app/globals.css` ne garde que ce que Radix n'a pas. Écartés sur maquette : Primer React, shadcn/ui (Tailwind obligatoire).
- Police Fira Sans (vraies petites capitales), servie par `next/font`.
- Une seule navigation : seules les facettes et la recherche changent la
  sélection. Pas de `nuqs`.
- Script assumé : sans lui, rien ne s'affiche.
- Sélection et décomptes calculés une fois, communs à toutes les vues
  (`lib/query/explore.ts`) ; chaque vue n'en montre qu'une part, et aucune
  ne crée un élément par nœud sélectionné.

## Vue Liste (`docs/composants/noeud-liste.md`)

- Liste à plat : guides de niveau et intitulés fixés, plutôt que des
  cartes emboîtées.
- Un seul élément pour tout nœud, deux états (survol, ouvert) ; les types
  ne se distinguent que par leur texte.
- Fiche rendue au premier dépliage.
- Correspondances surlignées là où elles sélectionnent (texte plié, zones
  fouillées), contexte compris, sur le jaune opaque d'un surligneur,
  qu'aucun empan ne porte ; un empan reste un seul élément.
- Sélection montrée par tranches de 200 nœuds ; écartées : la pagination
  (lecture coupée) et la virtualisation (dépendance, mal accordée aux
  rubriques emboîtées et aux intitulés fixés).

## Facettes (`docs/composants/facettes.md`)

- Colonnes de Miller repliables, liées par niveau.
- Une rubrique cochée prend tout son sous-arbre ; « A sauf B » ne
  s'exprime pas en union de sous-arbres.
- Chaque case s'applique aussitôt ; l'URL suit les cases sans les
  synchroniser.
- Contents est local au volume au focus : Clear ne touche que lui. Pas de
  bouton All : tout cocher revient à ne rien cocher, et restreindre à un
  volume est le rôle de sa case ronde.
