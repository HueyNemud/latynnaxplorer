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
| Entretien | #7, #8, #11 | `postgres` v4, TypeScript 7 |
| 3, concept de design | #12, #13 | `docs/DESIGN.md`, dépendances de Next.js |
| 4, fiche d'un nœud | #14 | Next.js, fiche en clés / valeurs |
| 5 et 6, vue Liste | #15, #16 | liste à plat, guides de niveau, titres fixés |
| 7, sélectionner par le contenu | #17 | recherche par texte, champ de recherche |
| 8, facettes de structure | #18 | panneaux Volumes et Contents, `subtree` répétable |
| 9, nettoyage du code | #19 | code et feuille de style remis au propre |
| 10, facettes et Liste d'accord | #20 | sélection vide sans entrée par défaut |
| 11, passage à Radix Themes | #21 | interface Radix, fiche au dépliage, filtre à la coche |

## Sprint 12 : exporter

But : récupérer la sélection dans un format de données ; trancher en même
temps le format de l'API JSON (ci-dessous). Contenu à proposer et valider au
début du sprint.

## À décider au moment voulu : format de l'API JSON

Dès qu'une API HTTP publique exposera les sous-graphes : décrire ses
réponses selon une pratique standard plutôt qu'un formalisme ad hoc
(OpenAPI ou plus récent, à comparer alors). La route interne de la fiche
(`/api/detail/<uuid>`) n'en fait pas partie.

## Hors sprint : demandes à numrev

À transmettre par l'utilisateur ; rien n'est contourné ici.

- `docs/demandes/numrev_intitules_titres.md` : deux intitulés de titres
  gardent des marques Markdown (`##` au milieu, `\` final).
- `docs/demandes/numrev_noeud_racine.md` : un vrai nœud racine par volume.
  Sans lui, 1807 a 133 racines, et ses 90 éléments hors champ à la racine ne
  se sélectionnent que par la recherche.

## Plus tard (non planifié)

Recherche par champ (sujet, activité, adresse) ; surlignage des
correspondances ; pagination de la Liste. Vues Page (IIIF), Carte et Frise,
avec leurs critères (page, zone, période) ; géocodage ; liens temporels,
autres annuaires et « suivre » ; deux vues côte à côte. Pistes détaillées
dans `docs/IDEES.md`. Chacun aura son sprint, proposé le moment venu.
