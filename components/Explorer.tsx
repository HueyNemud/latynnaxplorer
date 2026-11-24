"use client";

// Page d'exploration : les facettes à gauche, la sélection dans la vue Liste sous la barre de la
// vue (la recherche, plus tard d'autres critères ; l'export). L'index des volumes est lu à
// l'arrivée, chaque volume téléchargé quand la requête en a besoin (neededVolumes), puis la requête
// de l'URL est résolue sur les volumes chargés (explore). Facettes et recherche changent l'URL sans
// recharger la page ; Next garde useSearchParams à jour.

import { Flex, Spinner, Text } from "@radix-ui/themes";
import { useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { type Exploration, explore, neededVolumes, volumeOf } from "../lib/query/explore.ts";
import { parseQuery, type Query, QueryError } from "../lib/query/query.ts";
import { NodeNotFoundError } from "../lib/query/resolve.ts";
import {
  type IndexedVolume,
  indexVolume,
  type LoadedVolume,
  type VolumeFile,
  type VolumeIndex,
} from "../lib/query/volume.ts";
import { plainText } from "../lib/text/segments.ts";
import { ExportButton } from "./ExportButton.tsx";
import { Facets } from "./Facets.tsx";
import { NodeList } from "./NodeList.tsx";
import { SearchForm } from "./SearchForm.tsx";

/** `index` : adresse de l'index des volumes, absolue ou relative à la page. */
export function Explorer({ index }: { index: string }) {
  const [volumes, setVolumes] = useState<IndexedVolume[] | "error">();
  useEffect(() => {
    let live = true;
    const base = new URL(index, window.location.href);
    fetchJson<VolumeIndex>(base.href)
      .then(({ volumes }) => {
        // adresses des volumes rendues absolues, relatives à celle de l'index
        const resolved = volumes.map((v) => ({ ...v, url: new URL(v.url, base).href }));
        if (live) setVolumes(resolved);
      })
      .catch(() => live && setVolumes("error"));
    return () => {
      live = false;
    };
  }, [index]);

  if (volumes === undefined) return <Waiting />;
  if (volumes === "error") return <Message>The list of volumes could not be loaded.</Message>;
  if (volumes.length === 0) return <Message>No volume.</Message>;
  return <Volumes volumes={volumes} />;
}

/** Les volumes chargés à la demande, et la requête de l'URL résolue dessus. */
function Volumes({ volumes }: { volumes: IndexedVolume[] }) {
  const search = useSearchParams().toString();
  const query = useMemo(() => {
    try {
      return parseQuery(new URLSearchParams(search));
    } catch (error) {
      if (error instanceof QueryError) return "bad-request" as const;
      throw error;
    }
  }, [search]);

  // volumes chargés, dans l'ordre de l'index ; erreurs de chargement
  const [loaded, setLoaded] = useState<ReadonlyMap<string, LoadedVolume>>(new Map());
  const [failed, setFailed] = useState(false);
  const list = useMemo(() => volumes.flatMap((v) => loaded.get(v.id) ?? []), [volumes, loaded]);
  // volume au focus : choisi dans Volumes ; sinon celui de la première rubrique cochée, sinon le
  // premier
  const [chosen, setChosen] = useState<string>();
  const subtree = query === "bad-request" ? undefined : query.subtree;
  const focus = chosen ?? volumeOf(list, subtree?.[0])?.meta.id ?? volumes[0]?.id;

  const needed = useMemo(
    () => (query === "bad-request" ? [] : neededVolumes(volumes, list, query, focus)),
    [volumes, list, query, focus],
  );
  // téléchargement des volumes demandés, une fois chacun
  const requested = useRef(new Set<string>());
  useEffect(() => {
    for (const { id, url } of needed) {
      if (requested.current.has(id)) continue;
      requested.current.add(id);
      fetchJson<VolumeFile>(url)
        .then((file) => setLoaded((loaded) => new Map(loaded).set(id, indexVolume(file))))
        .catch(() => setFailed(true));
    }
  }, [needed]);

  const ready = needed.every((v) => loaded.has(v.id));
  // résultat montré : seulement une fois les volumes demandés chargés ; le dernier prêt reste
  // affiché pendant le chargement d'un volume mis au focus
  const [shown, setShown] = useState<{ query: Query; exploration: Exploration } | "not-found">();
  const result = useMemo(() => {
    if (query === "bad-request" || !ready) return undefined;
    try {
      return { query, exploration: explore(list, query) };
    } catch (error) {
      if (error instanceof NodeNotFoundError) return "not-found" as const;
      throw error;
    }
  }, [query, ready, list]);
  if (result !== undefined && result !== shown) setShown(result);

  if (query === "bad-request") return <Message>Invalid query.</Message>;
  if (failed) return <Message>A volume could not be loaded.</Message>;
  if (shown === undefined) return <Waiting />;
  if (shown === "not-found") return <Message>No node has this identifier.</Message>;

  const { selection, sections } = shown.exploration;
  const { text } = shown.query;
  const designated = shown.query.subtree?.length === 1 ? shown.query.subtree[0] : undefined;
  const root =
    designated === undefined ? undefined : volumeOf(list, designated)?.byId.get(designated);
  return (
    <div className="explorer">
      {/* titre pour les lecteurs d'écran : le texte du nœud désigné, sinon le texte cherché,
          sinon « Selection » (plusieurs rubriques) */}
      <h1 className="visually-hidden" lang={root || text ? "fr" : undefined}>
        {root ? plainText(root.text) : (text ?? "Selection")}
      </h1>
      <Facets
        volumes={volumes}
        sections={sections}
        query={shown.query}
        focus={focus}
        onFocus={setChosen}
        loaded={loaded}
      />
      <div className="view">
        <div className="view-bar">
          <SearchForm query={shown.query} />
          <ExportButton selection={selection} volumes={list} />
        </div>
        <div className="view-scroll">
          {selection.length > 0 ? (
            <NodeList selection={selection} volumes={list} />
          ) : (
            // vue vide : sans critère, rien n'est sélectionné ; avec, rien ne correspond
            <Flex
              className="empty"
              direction="column"
              align="center"
              justify="center"
              gap="2"
              minHeight="60vh"
            >
              <Text size="6" color="gray" aria-hidden="true">
                ∅
              </Text>
              <Text size="2" color="gray">
                {shown.query.subtree || text ? "No match" : "Nothing to show"}
              </Text>
            </Flex>
          )}
        </div>
      </div>
    </div>
  );
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} : ${response.status}`);
  return response.json() as Promise<T>;
}

function Waiting() {
  return (
    <Flex align="center" justify="center" minHeight="60vh">
      <Spinner size="3" />
    </Flex>
  );
}

function Message({ children }: { children: ReactNode }) {
  return (
    <Flex align="center" justify="center" minHeight="60vh">
      <Text size="2" color="gray">
        {children}
      </Text>
    </Flex>
  );
}
