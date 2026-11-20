"use client";

// Essai des données en local (app/essai) : la page d'exploration de `/` (app/page.tsx), mais
// résolue dans le navigateur. Le fichier du volume est téléchargé une fois et indexé
// (lib/local/engine.ts) ; la requête est lue dans l'URL, qui change sans redemander la page :
// les coches par history.replaceState (Facets, `navigate`), la recherche par history.pushState
// (formulaire et lien d'effacement interceptés). Next garde useSearchParams à jour.
// Mesures : marques `essai:*` de l'API Performance.

import { Flex, Spinner, Text } from "@radix-ui/themes";
import { usePathname, useSearchParams } from "next/navigation";
import {
  type MouseEvent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  contextLocal,
  detailLocal,
  facetsLocal,
  indexVolume,
  type LocalVolume,
  resolveLocal,
} from "../lib/local/engine.ts";
import type { VolumeFile } from "../lib/local/types.ts";
import { parseQuery, type Query, QueryError, serializeQuery } from "../lib/query/query.ts";
import { NodeNotFoundError } from "../lib/query/resolve.ts";
import { plainText } from "../lib/text/segments.ts";
import { Facets } from "./Facets.tsx";
import { NodeList } from "./NodeList.tsx";
import { QUERY_FORM, SearchForm } from "./SearchForm.tsx";

export function LocalExplorer({ volumeId }: { volumeId: string }) {
  const [volume, setVolume] = useState<LocalVolume | "error">();
  useEffect(() => {
    let live = true;
    performance.mark("essai:début");
    fetch(`/volumes/${volumeId}.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`volume ${volumeId} : ${response.status}`);
        return response.text();
      })
      .then((json) => {
        performance.mark("essai:téléchargé");
        const file = JSON.parse(json) as VolumeFile;
        performance.mark("essai:décodé");
        const indexed = indexVolume(file);
        performance.mark("essai:indexé");
        if (live) setVolume(indexed);
      })
      .catch(() => live && setVolume("error"));
    return () => {
      live = false;
    };
  }, [volumeId]);

  if (volume === undefined)
    return (
      <Flex align="center" justify="center" minHeight="60vh">
        <Spinner size="3" />
      </Flex>
    );
  if (volume === "error") return <Message>The volume could not be loaded.</Message>;
  return <Explorer volume={volume} />;
}

function Explorer({ volume }: { volume: LocalVolume }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const result = useMemo(() => {
    try {
      const query = parseQuery(new URLSearchParams(search));
      return {
        query,
        subgraph: resolveLocal(volume, query),
        sections: contextLocal(volume, query),
        structure: facetsLocal(volume, query),
      };
    } catch (error) {
      if (error instanceof QueryError) return "bad-request" as const;
      if (error instanceof NodeNotFoundError) return "not-found" as const;
      throw error;
    }
  }, [volume, search]);
  // vue rendue pour cette requête : marque pour les mesures
  useEffect(() => {
    performance.mark("essai:rendu", { detail: search });
  }, [search]);

  const load = useCallback(async (id: string) => detailLocal(volume, id), [volume]);
  const go = (query: Query, how: "push" | "replace") => {
    const params = serializeQuery(query);
    const url = params.size > 0 ? `${pathname}?${params}` : pathname;
    performance.mark("essai:requête", { detail: url });
    if (how === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  };
  // le formulaire de la requête, envoyé (Entrée), et le lien qui efface la recherche : sans
  // recharger la page
  const onSubmit = (event: SyntheticEvent) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== QUERY_FORM) return;
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [name, value] of new FormData(form))
      if (typeof value === "string") params.append(name, value);
    go(parseQuery(params), "push");
  };
  const onClick = (event: MouseEvent) => {
    const link = event.target instanceof Element && event.target.closest("a[href^='?']");
    if (!(link instanceof HTMLAnchorElement)) return;
    event.preventDefault();
    go(parseQuery(new URLSearchParams(link.search)), "push");
  };

  if (result === "bad-request") return <Message>Bad request.</Message>;
  if (result === "not-found") return <Message>This node does not exist.</Message>;
  const { query, subgraph, sections, structure } = result;
  const designated = query.subtree?.length === 1 ? query.subtree[0] : undefined;
  const root = [...subgraph.nodes, ...sections].find((n) => n.id === designated);
  return (
    <div className="explorer" onSubmitCapture={onSubmit} onClickCapture={onClick}>
      <h1 className="visually-hidden" lang={root || query.text ? "fr" : undefined}>
        {root ? plainText(root.text) : (query.text ?? "Selection")}
      </h1>
      <Facets
        volumes={structure.volumes}
        sections={structure.sections}
        checked={query.subtree ?? []}
        text={query.text}
        navigate={(url) => {
          performance.mark("essai:requête", { detail: url });
          window.history.replaceState(null, "", url);
        }}
      />
      <div className="view">
        <SearchForm text={query.text} subtree={query.subtree} />
        {subgraph.nodes.length > 0 ? (
          <NodeList context={sections} nodes={subgraph.nodes} load={load} />
        ) : (
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
              {query.subtree || query.text ? "No match" : "Nothing to show"}
            </Text>
          </Flex>
        )}
      </div>
    </div>
  );
}

function Message({ children }: { children: string }) {
  return (
    <Flex align="center" justify="center" minHeight="60vh">
      <Text size="2" color="gray">
        {children}
      </Text>
    </Flex>
  );
}
