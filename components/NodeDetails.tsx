"use client";

// Fiches de la vue Liste, rendues au premier dépliage de leur ligne : une ligne repliée n'a qu'une
// case vide (`.detail`, marquée de l'identifiant du nœud) ; à son premier dépliage, sa fiche est
// demandée au serveur (app/api/detail/[id]/route.ts), puis rendue dans la case et gardée. Un seul
// composant pour toute la Liste, à l'écoute des dépliages (l'événement toggle ne remonte pas :
// écouté à la capture). Sans script, une ligne dépliée ne montre pas sa fiche.

import { Spinner, Text } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { SubgraphNode } from "../lib/query/types.ts";
import { NodeDetail } from "./NodeDetail.tsx";

/** Case d'une fiche à demander, juste sous la ligne d'un nœud (`.item`). */
const BOX = ".detail[data-node]";

export function NodeDetails() {
  const [boxes, setBoxes] = useState<ReadonlyMap<string, HTMLElement>>(new Map());
  useEffect(() => {
    const add = (box: Element | null) => {
      const id = box instanceof HTMLElement ? box.dataset.node : undefined;
      if (box instanceof HTMLElement && id)
        setBoxes((boxes) => (boxes.has(id) ? boxes : new Map(boxes).set(id, box)));
    };
    // dépliées avant que le script soit prêt
    for (const box of document.querySelectorAll(`.item[open] > ${BOX}`)) add(box);
    const onToggle = (event: Event) => {
      const item = event.target;
      if (item instanceof HTMLDetailsElement && item.open)
        add(item.querySelector(`:scope > ${BOX}`));
    };
    document.addEventListener("toggle", onToggle, true);
    return () => document.removeEventListener("toggle", onToggle, true);
  }, []);
  return [...boxes].map(([id, box]) => createPortal(<Fetched id={id} />, box, id));
}

interface Detail {
  node: SubgraphNode;
  path: Pick<SubgraphNode, "id" | "text">[];
}

/** Fiches demandées, par nœud : une seule demande par fiche, même si le composant est monté de
 * nouveau (deux fois en développement) ; une demande échouée n'est pas gardée. */
const requests = new Map<string, Promise<Detail>>();

function load(id: string): Promise<Detail> {
  let request = requests.get(id);
  if (request === undefined) {
    request = fetch(`/api/detail/${id}`).then((response) => {
      if (!response.ok) throw new Error(`fiche ${id} : ${response.status}`);
      return response.json() as Promise<Detail>;
    });
    request.catch(() => requests.delete(id));
    requests.set(id, request);
  }
  return request;
}

/** La fiche d'un nœud ; un indicateur en attendant. */
function Fetched({ id }: { id: string }) {
  const [detail, setDetail] = useState<Detail | "error">();
  useEffect(() => {
    let live = true;
    load(id).then(
      (d) => live && setDetail(d),
      () => live && setDetail("error"),
    );
    return () => {
      live = false;
    };
  }, [id]);
  if (detail === undefined) return <Spinner />;
  if (detail === "error")
    return (
      <Text as="p" color="gray" mb="4">
        This node could not be loaded.
      </Text>
    );
  return <NodeDetail node={detail.node} context={detail.path} />;
}
