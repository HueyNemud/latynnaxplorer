# Concept de design

Principes d'UX et d'UI du site : comment un nœud et un sous-graphe se
représentent. Document de travail, complété au fil des décisions ; les
choix arrêtés sont aussi résumés dans `docs/DECISIONS.md`.

## Objectif : explorer, pas analyser

Le site donne accès aux sorties de numrev et les rend récupérables ; il ne
fait pas les analyses à la place des historiens. Une fonction qui mesure,
agrège ou interprète n'a pas sa place ici ; une fonction qui aide à
trouver, parcourir, vérifier ou récupérer les données, si.

## Profils

- Historien de Paris, plutôt quantitatif : histoire sociale ou économique.
- Historien aux approches microhistoriques : une petite zone ou un réseau
  d'individus.
- Historien de l'art ou de l'architecture : une zone précise ou une
  activité professionnelle.
- Généalogiste qui suit une personne ou une maison de commerce.
- L'équipe numrev, qui vérifie l'extraction contre la source.

## Tâches

| Tâche | Ce qu'elle demande |
|---|---|
| **Retrouver** une entrée | recherche tolérante (nom, adresse) |
| **Parcourir** une rubrique ou une activité | aspect Structure |
| **Situer** dans l'espace (rue, îlot, quartier) | aspect Espace |
| **Suivre** dans le temps, d'un annuaire à l'autre | aspect Temps |
| **Vérifier** contre la page source | aspect Document ; concerne tous les profils |
| **Exporter** la sélection | le sous-graphe de l'URL, sous une forme lisible par une machine |

L'export n'est pas une vue : c'est le même sous-graphe dans un format de
données (formats à choisir, voir « format de l'API JSON » dans
`docs/SPRINTS.md`).

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

## Propositions à valider

- **Contexte hors sous-graphe** : oui. Rubrique parente, entrées voisines
  sur la page, autres occupants d'une adresse aident à s'orienter et à
  vérifier ; affichés distinctement, jamais comptés dans la sélection.
- **Densité** : automatique par défaut (un nœud → fiche, plusieurs →
  compacte).
- **Vues** : une à la fois pour commencer, mais avec un focus (survol,
  sélection) pensé dès le départ comme partagé ; à terme, deux vues côte à
  côte (Liste + Page pour vérifier, Liste + Carte pour situer).
- **La source à un clic** : depuis tout nœud, dans toute vue, la page
  d'origine est accessible.
