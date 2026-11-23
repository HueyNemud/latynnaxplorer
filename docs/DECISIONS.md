# Décisions structurantes

Les décisions en vigueur, par thème. Une décision remplacée est réécrite, pas
empilée : l'historique est dans `git log` et les PR. Une alternative écartée
n'est notée que si elle risque de revenir sur la table.

## Projet et outillage

- Un sprint = une branche ; `main` ne reçoit que des PR relues et fusionnées
  par l'utilisateur, par merge commit (les hashes cités restent valides).
  Dépôt GitHub privé `hueynemud/latynnaxplorer` ; `main` protégée (check
  `verification` exigé, ni force-push ni suppression).
- CI GitHub Actions (job `verification`) : lint, typecheck, tests, build. Renovate le lundi matin : mineures groupées,
  majeures à part, aucune fusion automatique.
- Node 26, pnpm 12, dépendances en versions exactes. Next.js (App Router),
  `module: esnext` et `moduleResolution: bundler` ; la règle Biome
  `useImportExtensions` garde les extensions `.ts` dont Node a besoin.
- Site entièrement statique (`output: "export"`) : `next build` écrit dans
  `out/` des fichiers à héberger tels quels, sans serveur d'application ;
  tout se résout dans le navigateur. Les volumes sont hébergés en ligne, à
  part ou avec le site ; l'adresse de leur index est fixée au build
  (`NEXT_PUBLIC_VOLUMES_INDEX`). Un besoin de serveur (comptes, index de
  recherche trop gros pour le navigateur) serait un service à côté.
- Requêtes et règles d'état (coches des facettes) en fonctions pures de
  `lib/`, testées sans navigateur sur la fixture (`scripts/fixture.ts`).
- Interface en anglais ; le texte des annuaires n'est jamais traduit.

## Données et modèle (`docs/MODELE_DONNEES.md`)

- numrev fait foi : exporté tel quel, validé contre ses JSON Schema (ajv),
  aucun rattrapage ; un défaut se demande à numrev (`docs/demandes/`).
  `data/` hors Git ; un volume par dossier `data/<volume>/`, ses
  métadonnées Dublin Core dans `volume.json`.
- Un fichier JSON par volume, et un index des volumes (métadonnées, adresse
  de chaque fichier, relative ou absolue). JSON plutôt que Parquet ou YAML :
  lu nativement par le navigateur, sans dépendance. Le fichier omet ce qui
  se déduit (ordre de lecture, `normalized` égal au texte de l'empan, listes
  vides) ; les empans n'ont pas d'identifiant (nœud et rang suffisent).
- Tous les nœuds sont du même type, `section`, `entry` ou `out_of_scope` ;
  un groupe à accolade est un seul nœud. Ordre de lecture commun à tous.
- Arcs déduits au chargement, jamais stockés : `member_of` et `child_of`
  du parent, `follows` de l'ordre de lecture (entrée suivante du volume, à
  travers les sections).
- Rien ne suppose des « rubriques d'un seul tenant » tant que numrev ne le
  garantit pas.

## Requête (`docs/SCENARIOS.md`, `lib/query/`)

- La requête se lit dans l'URL et s'y réécrit à l'identique ; paramètres en
  anglais : `subtree` (répétable : union des sous-arbres), `text` et `in`
  (répétable : zones où chercher le texte). Tous facultatifs, combinés en
  conjonction ; sans critère, rien n'est sélectionné. Sous-graphe toujours
  induit strict ; `lib/query/` ne juge pas de la pertinence.
- Requête mal formée ou uuid inconnu : un message à la place de la vue.
- Recherche par texte : phrase entière, exacte, sans accents ni casse, sur
  tous les nœuds ; dans les rubriques cochées, sinon tout l'annuaire. Texte
  plié par décomposition NFKD et une table des ligatures, tirets et
  guillemets de l'imprimé (`lib/query/fold.ts`). Écartée après mesure : la
  similarité par trigrammes (trop de bruit ; `docs/IDEES.md`, « Recherche
  tolérante »).
- Zones de la recherche : les libellés des empans en minuscules (`subj`,
  `desc`, `addr`) et `other` (hors empan). Aucune zone ou toutes = tout le
  texte, comme sans `in` : un formulaire sans bouton enfoncé n'envoie
  rien, et la règle est celle des facettes (sans rubrique cochée, tout
  l'annuaire). Le texte plié de chaque zone est préparé au chargement.
- Volumes chargés à la demande : celui que l'on regarde ; tous si la
  requête cherche un texte sans rubrique, ou désigne un nœud d'aucun volume
  chargé (l'URL ne nomme pas les volumes). Les volumes chargés sont mis
  bout à bout dans l'ordre de l'index.
- Une requête parcourt tout le volume, sans index : 13 ms au plus sur 1807.
- Contexte (`context`) : les rubriques ancêtres de la sélection qui n'en font
  pas partie, nœuds complets, jamais comptés dedans.
- API publique : les fichiers des volumes ; le format d'une API d'export
  suivra une pratique standard (OpenAPI ou plus récent), à trancher avec
  l'export.

## Interface (`docs/DESIGN.md`)

- Objectif : explorer, sélectionner et exporter le contenu des annuaires ;
  cinq domaines (Contenu, Structure, Document, Espace, Temps) servent
  indépendamment à sélectionner et à afficher. Mesurer et relier reviennent
  aux historiens, à partir de l'export.
- Sélection (ce que l'on retient, dans l'URL) et focus (ce que l'on regarde,
  hors de l'URL) distingués partout.
- Radix Themes pour toute l'interface, thème iris sur gris mauve : ses
  composants et ses jetons ; `app/globals.css` ne garde que ce que Radix n'a
  pas, et écrit sur place ce qui ne sert qu'une fois. Feuille de Radix
  importée entière (la découper ne gagnerait qu'environ 23 Ko compressés).
  Écartés sur maquette : Primer React (états mal distingués, identité de
  GitHub), shadcn/ui (Tailwind obligatoire). Police Fira Sans (vraies
  petites capitales), servie par `next/font`.
- Une seule navigation : seules les facettes et la recherche changent la
  sélection, aucun lien de la Liste. Pas de `nuqs`.
- Barre de recherche : les zones à gauche du champ (choisir la portée,
  taper, lancer), toujours visibles avec leur état ; le champ, plus grand
  qu'elles, soudé à un bouton Search.
- Script assumé : sans lui, rien ne s'affiche.

## Vue Liste (`docs/composants/noeud-liste.md`)

- Liste à plat : la hiérarchie se lit par des guides de niveau (seul celui
  de la section la plus proche est foncé) et des titres de section fixés et
  empilés ; le contexte est rendu comme la sélection.
- Un seul élément pour tout nœud : une ligne (chevron, texte | page) qui
  déplie sa fiche par `<details>` natif ; deux états, survol et ouvert (en
  relief) ; les types ne se distinguent que par leur texte.
- Champs sur fond teinté transparent : sujet (violet, petites capitales),
  description (sarcelle), adresse (jaune).
- Fiche en DataList (texte, champs, métadonnées, fil d'Ariane en texte),
  rendue au premier dépliage ; une sélection d'un seul nœud la montre
  dépliée d'emblée.
- Tout est rendu, sans pagination pour l'instant (« Listes particulières »,
  13 737 lignes : environ 3 s, dont 2,1 s de style et de mise en page ;
  `docs/IDEES.md`).
- Vue vide : un grand aplat, « Nothing to show » sans critère, « No match »
  sinon.

## Facettes (`docs/composants/facettes.md`)

- Colonnes de Miller collées à gauche (Volumes | Contents | vue), chacune
  repliable par une bande à droite, liées par niveau.
- Volume : coche ronde, pleine si tout le volume est coché, tiret s'il l'est
  en partie ; un clic le coche entier, ou le vide s'il l'était. Clic sur la
  vignette = focus, Contents montre son arbre. Rubrique cochée = tout son
  sous-arbre, descendants couverts (cochés en pâle) ; cliquer une case
  couverte ne garde qu'elle (la rubrique qui la couvre est décochée) : « A
  sauf B » ne s'exprime pas en union de sous-arbres. Une rubrique dont une
  descendante est cochée a un tiret (visible même branche repliée) ; un
  clic la coche entière. Les nœuds hors de toute rubrique ne se sélectionnent que par la
  recherche (racine demandée à numrev).
- Filtrer à la coche : chaque coche s'applique aussitôt, l'URL étant
  remplacée dans l'historique après 300 ms sans nouvelle coche ; la vue est
  estompée pendant son calcul. Les cases sont l'état
  du composant, lu une fois depuis l'URL, que l'URL suit : aucune
  synchronisation.
- Contents est local au volume regardé (facettes hiérarchiques) : All et
  Clear ne touchent que lui. Il attend que son volume soit chargé ; la coche
  ronde d'un volume pas encore chargé est inactive.
- Intitulés dans la casse imprimée, décompte des entrées filtré par le texte
  cherché ; à l'arrivée, l'arbre est déplié jusqu'aux coches.
