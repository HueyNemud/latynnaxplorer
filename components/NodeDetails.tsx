"use client";

// Fiches de la vue Liste, rendues au premier dépliage de leur ligne : une ligne repliée n'a qu'une
// case vide (`.detail`, marquée de l'identifiant du nœud) ; à son premier dépliage, sa fiche y est
// rendue (lue dans les volumes chargés, par `detail`) et gardée. Un seul composant pour toute la
// Liste, à l'écoute des dépliages (l'événement toggle ne remonte pas : écouté à la capture).

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Detail } from "../lib/query/types.ts";
import { NodeDetail } from "./NodeDetail.tsx";

/** Case d'une fiche à remplir, juste sous la ligne d'un nœud (`.node`). */
const BOX = ".detail[data-node]";

export function NodeDetails({ detail }: { detail: (id: string) => Detail }) {
  const [boxes, setBoxes] = useState<ReadonlyMap<string, HTMLElement>>(new Map());
  useEffect(() => {
    const add = (box: Element | null) => {
      const id = box instanceof HTMLElement ? box.dataset.node : undefined;
      if (box instanceof HTMLElement && id)
        // une ligne rendue de nouveau (autre sélection) a une case neuve : elle remplace l'ancienne
        setBoxes((boxes) => (boxes.get(id) === box ? boxes : new Map(boxes).set(id, box)));
    };
    // dépliées avant que l'écoute commence
    for (const box of document.querySelectorAll(`.node[open] > ${BOX}`)) add(box);
    const onToggle = (event: Event) => {
      const node = event.target;
      if (node instanceof HTMLDetailsElement && node.open)
        add(node.querySelector(`:scope > ${BOX}`));
    };
    document.addEventListener("toggle", onToggle, true);
    return () => document.removeEventListener("toggle", onToggle, true);
  }, []);
  return [...boxes]
    .filter(([, box]) => box.isConnected) // une case retirée de la Liste n'a plus de fiche
    .map(([id, box]) => {
      const { node, path } = detail(id);
      return createPortal(<NodeDetail node={node} path={path} />, box, id);
    });
}
