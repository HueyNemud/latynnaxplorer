-- Exécuté par l'image PostgreSQL à la création de la base (volume vide).
-- Les extensions et fonctions ne sont pas gérées par drizzle-kit push.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- unaccent() n'est que STABLE : cette enveloppe IMMUTABLE permet de l'indexer.
-- Le dictionnaire est nommé explicitement pour que le résultat ne dépende pas du search_path.
CREATE OR REPLACE FUNCTION immutable_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  RETURN public.unaccent('public.unaccent'::regdictionary, $1);
