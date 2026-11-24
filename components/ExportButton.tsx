"use client";

// Bouton d'export de la barre de la vue (docs/DESIGN.md, « Export ») : toute la sélection en CSV,
// fabriqué dans le navigateur au clic et téléchargé ; inactif quand rien n'est sélectionné.

import { Button } from "@radix-ui/themes";
import { selectionCsv } from "../lib/export/csv.ts";
import type { SubgraphNode } from "../lib/query/types.ts";
import type { LoadedVolume } from "../lib/query/volume.ts";
import { DownloadIcon } from "./icons.tsx";

export function ExportButton({
  selection,
  volumes,
}: {
  selection: readonly SubgraphNode[];
  volumes: readonly LoadedVolume[];
}) {
  return (
    <Button
      type="button"
      size="3"
      variant="surface"
      className="export"
      disabled={selection.length === 0}
      onClick={() => download(selectionCsv(volumes, selection), "latynnaxplorer-selection.csv")}
    >
      <DownloadIcon />
      Export CSV
    </Button>
  );
}

function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  // libérée après le départ du téléchargement
  setTimeout(() => URL.revokeObjectURL(url));
}
