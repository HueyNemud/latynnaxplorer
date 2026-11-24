# latynnaxplorer

Site d'exploration des annuaires commerciaux de Paris traités par le projet
voisin `../adresses_revolutionnaires` (numrev).

## À lire d'abord

- `docs/SPRINTS.md` : le sprint en cours et les suivants.
- `docs/DECISIONS.md` et `docs/JOURNAL.md` : décisions en vigueur et
  historique.

## Règles d'or

- Code simple et explicite : une abstraction n'est introduite que pour un
  problème présent, jamais par anticipation.
- **Toujours demander** avant de toucher à l'architecture, au modèle de
  données, aux fonctionnalités (même mineures) ou aux dépendances.
- Pas de rétro-compatibilité par défaut : le projet est en développement
  initial.
- `data/` et le projet numrev sont en lecture seule.
- Les hooks Git ne sont jamais contournés (`--no-verify` interdit).

## Façon de travailler

- **Itératif et simple** : de petites étapes, chacune présentée et validée
  avec l'utilisateur avant de passer à la suivante. Dans le doute, demander.
- **Un sprint = une branche** partant de `main`, nommée
  `<type>/<sujet>` (`feat/…`, `fix/…`, `docs/…`, `build/…`). Son contenu
  est proposé et validé avant d'écrire du code.
- **`main` ne reçoit que des PR** : pas de commit ni de push direct sur
  `main` sans demande explicite, jamais de force-push sur `main`.
- La PR est ouverte avec `gh` vers `main` ; **l'utilisateur relit et
  fusionne**, jamais Claude.
- Petits commits atomiques en Conventional Commits, en français.
- En fin de sprint ou d'étape : `docs/JOURNAL.md` (et `docs/DECISIONS.md`
  si une décision structurante a été prise) à jour dans la branche, puis
  `docs/SPRINTS.md` revu avec l'utilisateur.
- Une demande au projet numrev s'écrit dans `docs/demandes/`, sous forme de
  prompt que l'utilisateur transmet ; on n'y modifie rien.
- Une idée écartée ou reportée va dans `docs/IDEES.md`, sans être faite.

## Langue

Documentation, commentaires, messages de commit et de PR en français.
