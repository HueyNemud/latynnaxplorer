"use client";

// Bouton d'export de la barre de la sélection (docs/DESIGN.md, « Export ») : il ouvre le menu des
// formats, pour l'instant CSV seul. Le fichier est fabriqué dans le navigateur au choix du format,
// puis téléchargé ; inactif quand rien n'est sélectionné.

import { DownloadIcon } from "@radix-ui/react-icons";
import { Button, DropdownMenu } from "@radix-ui/themes";
import { selectionCsv } from "../lib/export/csv.ts";
import type { SubgraphNode } from "../lib/query/types.ts";
import type { LoadedVolume } from "../lib/query/volume.ts";

export function ExportButton({
  selection,
  volume,
}: {
  selection: readonly SubgraphNode[];
  volume: LoadedVolume;
}) {
  return (
    <DropdownMenu.Root>
      {/* inactif par le déclencheur, qui impose son `disabled` au bouton */}
      <DropdownMenu.Trigger disabled={selection.length === 0}>
        <Button size="3" variant="surface" ml="auto">
          <DownloadIcon aria-hidden="true" />
          Export
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <DropdownMenu.Item
          onSelect={() => download(selectionCsv(volume, selection), "latynnaxplorer-selection.csv")}
        >
          Export to CSV
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
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
