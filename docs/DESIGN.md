# Concept de design

Principes d'UX et d'UI du site : comment un nœud et un sous-graphe se
représentent. Document de travail, complété au fil des décisions ; les
choix arrêtés sont aussi résumés dans `docs/DECISIONS.md`.

## Vocabulaire

- **Aspect** : une dimension des données, commune aux nœuds et aux
  sous-graphes : Structure, Document, Espace, Temps.
- **Représentation** : la forme que prend un nœud dans un aspect.
- **Vue** : la forme que prend un sous-graphe dans un aspect.
- **Densité** : réglage commun à toutes les représentations, *compacte*
  (une brique parmi d'autres, dans une vue) ou *détaillée* (une fiche).
  Ce n'est pas un aspect.

Règle de composition : la vue d'un sous-graphe dans l'aspect X dispose
ses nœuds dans leur représentation X, en densité compacte.

## Niveau 1 : nœud

| Aspect | Représentation compacte | Représentation détaillée (fiche) | Disponible |
|---|---|---|---|
| Structure | une ligne de texte, champs SUBJ/DESC/ADDR distingués | champs étiquetés, chemin des rubriques | maintenant |
| Document | la boîte du nœud sur sa page (vignette) | la page, boîte surlignée | ancrages présents, images à venir (IIIF) |
| Espace | un point | le point dans son quartier | après le géocodage |
| Temps | un repère sur la frise | sa date ; plus tard, ses entrées liées | date du volume dès maintenant, liens plus tard |

La représentation dépend aussi du type de nœud (`entry`, `section`,
`out_of_scope`) : à détailler aspect par aspect.

## Niveau 2 : sous-graphe

| Aspect | Vue | Agencement | Arcs montrés |
|---|---|---|---|
| Structure | Liste | ordre du document (ou alphabétique) | `member_of` / `child_of` (regroupement), `follows` (contiguïté) |
| Document | Page | la page source | ordre de lecture |
| Espace | Carte | la géographie | à définir (déménagements, par les liens temporels ?) |
| Temps | Frise | la chronologie, une ligne par lignée | liens temporels |

## Les deux niveaux se rejoignent : la fiche

Un sous-graphe d'un seul nœud est ce nœud dans tous ses aspects
disponibles, en densité détaillée, côte à côte. Il n'y a pas de page
« fiche » à concevoir à part.

## Questions ouvertes

- **Contexte hors sous-graphe** : montrer, pour s'orienter, ce qui n'est
  pas dans le sous-graphe induit (rubriques ancêtres, entrées voisines),
  visuellement distinct de la sélection ?
- **Densité** : automatique selon le nombre de nœuds, ou choisie ?
- **Vues** : une à la fois, ou plusieurs côte à côte et synchronisées ?
- **Utilisateurs et tâches** : qui consulte le site, pour quoi faire ?
