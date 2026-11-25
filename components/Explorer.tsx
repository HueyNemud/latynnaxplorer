"use client";

// Page d'exploration (docs/DESIGN.md) : les facettes, puis la barre et la vue. L'index des volumes
// est lu à l'arrivée, le volume de la requête téléchargé quand on le demande, puis la requête de
// l'URL résolue dessus (explore). Facettes et recherche changent
// l'URL par l'API History, sans recharger la page ; Next garde useSearchParams à jour.

import { Flex, Spinner, Text } from "@radix-ui/themes";
import { useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { type Exploration, explore } from "../lib/query/explore.ts";
import { parseQuery, type Query, QueryError } from "../lib/query/query.ts";
import { NodeNotFoundError } from "../lib/query/resolve.ts";
import {
  type IndexedVolume,
  indexVolume,
  type LoadedVolume,
  type VolumeFile,
  type VolumeIndex,
  volumeName,
} from "../lib/query/volume.ts";
import { plainText } from "../lib/text/segments.ts";
import { ExportButton } from "./ExportButton.tsx";
import { Facets } from "./Facets.tsx";
import { NodeList } from "./NodeList.tsx";
import { SearchForm } from "./SearchForm.tsx";
import { Settings, useSetting } from "./Settings.tsx";

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

/** Le volume de la requête, chargé à la demande, et la requête résolue dessus. */
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

  // volume au focus : celui de la requête, sinon le premier de l'index
  const focused =
    query === "bad-request"
      ? undefined
      : volumes.find((v) => v.id === (query.volume ?? volumes[0]?.id));
  useEffect(() => {
    if (focused) document.title = volumeName(focused);
  }, [focused]);

  // volumes chargés, gardés pour un retour immédiat ; téléchargés une fois chacun
  const [loaded, setLoaded] = useState<ReadonlyMap<string, LoadedVolume>>(new Map());
  const [failed, setFailed] = useState(false);
  const requested = useRef(new Set<string>());
  useEffect(() => {
    if (focused === undefined || requested.current.has(focused.id)) return;
    const { id, url } = focused;
    requested.current.add(id);
    fetchJson<VolumeFile>(url)
      .then((file) => setLoaded((loaded) => new Map(loaded).set(id, indexVolume(file))))
      .catch(() => setFailed(true));
  }, [focused]);
  const volume = focused && loaded.get(focused.id);

  // résultat montré : seulement une fois le volume chargé ; le dernier prêt reste affiché pendant
  // le chargement d'un autre
  const [shown, setShown] = useState<
    { query: Query; volume: LoadedVolume; exploration: Exploration } | "not-found"
  >();
  // éléments hors champ écartés de la sélection, sauf si le réglage les montre
  const [outOfScope, setOutOfScope] = useSetting("latynnaxplorer:out-of-scope", false);
  const result = useMemo(() => {
    if (query === "bad-request" || volume === undefined) return undefined;
    try {
      const exploration = explore(volume, query);
      if (!outOfScope)
        exploration.selection = exploration.selection.filter((n) => n.kind !== "out_of_scope");
      return { query, volume, exploration };
    } catch (error) {
      if (error instanceof NodeNotFoundError) return "not-found" as const;
      throw error;
    }
  }, [query, volume, outOfScope]);
  if (result !== undefined && result !== shown) setShown(result);
  const [spanColors, setSpanColors] = useSetting("latynnaxplorer:span-colors", true);

  if (query === "bad-request") return <Message>Invalid query.</Message>;
  if (focused === undefined) return <Message>No volume has this identifier.</Message>;
  if (failed) return <Message>The volume could not be loaded.</Message>;
  if (shown === undefined) return <Waiting />;
  if (shown === "not-found") return <Message>No node has this identifier.</Message>;

  const { selection, sections } = shown.exploration;
  const { text } = shown.query;
  const designated = shown.query.subtree?.length === 1 ? shown.query.subtree[0] : undefined;
  const root = designated === undefined ? undefined : shown.volume.byId.get(designated);
  return (
    <div className="explorer">
      {/* titre pour les lecteurs d'écran : le texte du nœud désigné, sinon le texte cherché,
          sinon « Selection » (plusieurs rubriques) */}
      <h1 className="visually-hidden" lang={root || text ? "fr" : undefined}>
        {root ? plainText(root.text) : (text ?? "Selection")}
      </h1>
      {/* remontées à chaque volume : ses rubriques cochées lues dans l'URL */}
      <Facets
        key={focused.id}
        volumes={volumes}
        sections={sections}
        query={shown.query}
        focus={focused.id}
        ready={shown.volume === volume}
      />
      <div className={spanColors ? "view" : "view no-span-colors"}>
        {/* la barre de la sélection, puis les réglages de l'application */}
        <Flex align="center" gap="3" pt="4" pb="2">
          <Flex align="center" gap="2" flexGrow="1" wrap="wrap">
            <SearchForm query={shown.query} />
            <ExportButton selection={selection} volume={shown.volume} />
          </Flex>
          <Settings
            outOfScope={outOfScope}
            onOutOfScope={setOutOfScope}
            spanColors={spanColors}
            onSpanColors={setSpanColors}
          />
        </Flex>
        <div className="view-scroll">
          {selection.length > 0 ? (
            <NodeList selection={selection} volume={shown.volume} search={shown.query} />
          ) : (
            // vue vide : les critères ne trouvent rien (sans critère, tout est sélectionné)
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
                No match
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
