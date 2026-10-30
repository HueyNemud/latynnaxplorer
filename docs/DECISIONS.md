# Décisions structurantes

Une ligne par décision, la plus récente en haut.

- 2026-10-30 — Données d'un volume dans `data/<volume>/` (les JSON de 1807 déplacés dans `data/1807/`).
- 2026-10-30 — Géocodage hors modèle pour l'instant : sprint dédié, rattaché aux uuid des empans ADDR.

- 2026-10-30 — Métadonnées d'un volume dans `data/<volume>/volume.json` : éléments Dublin Core + `temporal` {start, end} en AAAA-MM-JJ.
- 2026-10-30 — Aucune donnée versionnée pour l'instant (`data/` entièrement hors Git).
- 2026-10-30 — Pas de table de liens temporels : extension future, sprint dédié.
- 2026-10-30 — Sections et entrées traitées de la même manière ; schéma minimal et commun.
- 2026-10-30 — numrev fait foi : import tel quel, aucun rattrapage des données dans l'application.
- 2026-10-30 — Nœud = entrée numrev (un groupe à accolade est un seul nœud, comme dans l'export).

- 2026-10-30 — Recherche insensible aux accents : extension PostgreSQL `unaccent` en plus de `pg_trgm`.
- 2026-10-30 — Succession (`follows`) entre entrées seulement, dans l'ordre de lecture de tout l'annuaire, à travers les sections.
- 2026-10-30 — Sous-graphe toujours induit strict : aucun nœud ajouté implicitement.
- 2026-10-30 — Nœuds = entités typées `entry` et `section` ; volume, page et empan restent des attributs.
- 2026-10-30 — Arcs documentaires `member_of` (entrée → section) et `child_of` (section → section) portés par des colonnes, sans table d'arcs générique.
- 2026-10-30 — Un seul annuaire pour commencer : pas de liens temporels dans le modèle pour l'instant.
- 2026-10-30 — IIIF reporté : le PDF sera servi plus tard par un serveur IIIF.
- 2026-10-30 — `data/` exclu du dépôt Git.
