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
| 5 et 6, vue Liste | #15, #16 | liste à plat, guides de niveau, intitulés fixés |
| 7, sélectionner par le contenu | #17 | recherche par texte, champ de recherche |
| 8, facettes de structure | #18 | panneaux Volumes et Contents, `subtree` répétable |
| 9, nettoyage du code | #19 | code et feuille de style remis au propre |
| 10, facettes et Liste d'accord | #20 | sélection vide sans entrée par défaut |
| 11, passage à Radix Themes | #21 | interface Radix, fiche au dépliage, application à chaque case |
| 12, données en local | #22, #23 | site statique, un fichier par volume, volumes à la demande |
| 13, audit du code | #24 | code mort retiré, une sélection par volume, commentaires et CSS resserrés |
| Barre de la vue fixée | #25 | recherche toujours visible, la liste défile dessous |
| Recherche par zone | #28 | `in` (sujet, description, adresse, reste), boutons des zones, bouton Search |
| 14, sélection et vues | #29 | sélection commune aux vues, Liste par tranches, facettes rendues seulement si elles changent, guides d'un seul gris |
| Vocabulaire et docs | #30 | un terme par objet, une ligne par décision, fiches resserrées |
| Mise en ligne | #31 | GitHub Pages, volumes dans une release |
| 15, export | #32 | CSV de la sélection, une colonne par niveau de rubrique et par libellé d'empan |
| 16, surlignage | #33 | correspondances sur fond iris opaque, là où elles sélectionnent ; un empan = un élément |
| 17, réglages | #34 | bouton « ⚙ », fonds des empans montrés ou cachés, mémorisé dans le navigateur |
| 18, requête vide | #35 | un critère absent ne filtre rien, requête vide = tous les volumes, bouton All retiré |

## Sprint 19 : barre de la sélection

Branche `refactor/barre-selection`. La barre au-dessus de la vue sépare ce
qui est commun à toutes les vues de ce qui est propre à chacune :

- **Barre de la sélection** : zones, champ de recherche, Export ; une seule,
  au-dessus de toutes les vues.
- **Outils de la vue** : ce que la vue fournit, pour la Liste son menu
  « ⚙ ». Tant qu'il n'y a qu'une vue, au bout de la même ligne, après un
  trait vertical discret ; une ligne d'en-tête par vue viendra avec la
  deuxième vue.
- `docs/DESIGN.md` réécrit en conséquence ; aucune dépendance, aucun
  changement de comportement.

## Hors sprint : demandes à numrev

À transmettre par l'utilisateur ; rien n'est contourné ici.

- `docs/demandes/numrev_intitules_titres.md` : deux intitulés de titres
  gardent des marques Markdown (`##` au milieu, `\` final).
- `docs/demandes/numrev_noeud_racine.md` : un vrai nœud racine par volume.
  Sans lui, 1807 a 133 racines, et ses 90 éléments hors champ à la racine ne
  se sélectionnent que par la recherche.

## Plus tard (non planifié)

Vues Page (IIIF), Carte et Frise, avec leurs critères (page, zone,
période) ; géocodage ; liens temporels, autres annuaires et « suivre » ;
deux vues côte à côte. Pistes détaillées dans `docs/IDEES.md`. Chacun aura
son sprint, proposé le moment venu.
