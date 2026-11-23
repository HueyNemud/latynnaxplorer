# Sprints

Feuille de route courte, revue à la fin de chaque sprint : on ne planifie que
les prochaines étapes. Chaque sprint est petit, se fait sur sa propre branche
et arrive dans `main` par une PR relue et fusionnée par l'utilisateur. Son
contenu exact est proposé puis validé avant d'écrire du code (périmètre,
dépendances, choix discutables).

## Faits

| Sprint | PR | Résultat |
|---|---|---|
| Modèle de données | #1 | schéma, validation et import d'un volume numrev |
| 1, intégration continue | #2 | CI, `main` protégée, Renovate |
| 2, requête → sous-graphe | #10 | `?subtree=`, sous-graphe induit, base de test |
| Entretien | #7, #8, #11, #26, #27 | `postgres` v4, TypeScript 7, hooks sur tout ce que Biome vérifie |
| 3, concept de design | #12, #13 | `docs/DESIGN.md`, dépendances de Next.js |
| 4, fiche d'un nœud | #14 | Next.js, fiche en clés / valeurs |
| 5 et 6, vue Liste | #15, #16 | liste à plat, guides de niveau, titres fixés |
| 7, sélectionner par le contenu | #17 | recherche par texte, champ de recherche |
| 8, facettes de structure | #18 | panneaux Volumes et Contents, `subtree` répétable |
| 9, nettoyage du code | #19 | code et feuille de style remis au propre |
| 10, facettes et Liste d'accord | #20 | sélection vide sans entrée par défaut |
| 11, passage à Radix Themes | #21 | interface Radix, fiche au dépliage, filtre à la coche |
| 12, données en local | #22, #23 | site statique, un fichier par volume, volumes à la demande |
| 13, audit du code | #24 | code mort retiré, une sélection par volume, commentaires et CSS resserrés |
| Barre de la vue fixée | #25 | recherche toujours visible, la liste défile dessous |
| Recherche par zone | #28 | `in` (sujet, description, adresse, reste), boutons des zones, bouton Search |

## Sprint 14 : sélection et vues

But : afficher vite une grande sélection (« Listes particulières »,
13 737 lignes : environ 3 s, presque tout pour créer et mettre en page la
Liste), et préparer les autres vues (Carte, Frise…), qui partagent la même
requête et la même sélection.

Principe : la sélection est calculée une fois, commune à toutes les vues ;
chaque vue n'en montre qu'une part (tranche, agrégats), avec son propre
état, à part de la requête. Aucune vue ne crée un élément par nœud de la
sélection.

1. Mesure de référence, sur un build de production : « Listes
   particulières » et All (22 068 lignes) ; temps jusqu'aux premières
   lignes, part du script et part du style et de la mise en page.
2. Sélection commune et part propre à chaque vue : `view()` ne rend plus
   que la sélection et les facettes ; la Liste calcule le contexte
   (rubriques ancêtres) de ce qu'elle montre ; `Explorer` passe la
   sélection à la vue.
3. Liste par tranches : la première tranche de la sélection et son
   contexte, la suite ajoutée automatiquement au défilement ; retour à la
   première tranche à chaque requête ; une sélection d'un seul nœud reste
   dépliée d'emblée. Taille de tranche fixée d'après la mesure (premier
   affichage sous 100 ms). Ni décompte affiché, ni URL changée ; Ctrl+F ne
   trouve que les lignes montrées (la recherche couvre le reste).
4. Nouvelle mesure ; selon elle, alléger la ligne (23 éléments du DOM),
   voire essayer `content-visibility: auto`.
5. Docs : `docs/DECISIONS.md` (principe ci-dessus),
   `docs/composants/noeud-liste.md`, `docs/IDEES.md` (pagination retirée ;
   virtualisation et `content-visibility` gardées en pistes),
   `docs/JOURNAL.md`.

## Sprint 15 : exporter

But : récupérer la sélection dans un format de données ; trancher en même
temps le format de l'API JSON (ci-dessous). Contenu à proposer et valider au
début du sprint.

## À décider au moment voulu : format de l'API JSON

Dès qu'une API publique exposera les sous-graphes : décrire ses réponses
selon une pratique standard plutôt qu'un formalisme ad hoc (OpenAPI ou plus
récent, à comparer alors).

## Hors sprint : demandes à numrev

À transmettre par l'utilisateur ; rien n'est contourné ici.

- `docs/demandes/numrev_intitules_titres.md` : deux intitulés de titres
  gardent des marques Markdown (`##` au milieu, `\` final).
- `docs/demandes/numrev_noeud_racine.md` : un vrai nœud racine par volume.
  Sans lui, 1807 a 133 racines, et ses 90 éléments hors champ à la racine ne
  se sélectionnent que par la recherche.

## Plus tard (non planifié)

Surlignage des correspondances. Vues Page (IIIF),
Carte et Frise, avec leurs critères (page, zone, période) ; géocodage ;
liens temporels, autres annuaires et « suivre » ; deux vues côte à côte.
Pistes détaillées dans `docs/IDEES.md`. Chacun aura son sprint, proposé le
moment venu.
