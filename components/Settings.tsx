"use client";

// Réglages d'affichage de la Liste, parmi les outils de la vue (docs/DESIGN.md) : hors de l'URL,
// mémorisés dans le navigateur. Pour l'instant, les fonds colorés des empans.

import { DropdownMenu, IconButton } from "@radix-ui/themes";
import { useState } from "react";

/** Clé du réglage dans localStorage : « off » quand les fonds des empans sont cachés. */
const SPAN_COLORS = "latynnaxplorer:span-colors";

/** Fonds colorés des empans montrés ou non, lu puis écrit dans localStorage (inaccessible, par
 * exemple si le navigateur refuse le stockage : montrés, et le choix n'est pas gardé). À n'appeler
 * que dans le navigateur. */
export function useSpanColors(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(() => {
    try {
      return localStorage.getItem(SPAN_COLORS) !== "off";
    } catch {
      return true;
    }
  });
  const set = (on: boolean) => {
    setOn(on);
    try {
      if (on) localStorage.removeItem(SPAN_COLORS);
      else localStorage.setItem(SPAN_COLORS, "off");
    } catch {}
  };
  return [on, set];
}

export function Settings({
  spanColors,
  onSpanColors,
}: {
  spanColors: boolean;
  onSpanColors: (on: boolean) => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton size="3" variant="surface" title="Settings" aria-label="Settings">
          {/* engrenage en texte, pas en emoji (sélecteur de variante U+FE0E) */}
          <span aria-hidden="true">{"⚙︎"}</span>
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <DropdownMenu.CheckboxItem
          checked={spanColors}
          onCheckedChange={onSpanColors}
          // le menu reste ouvert : l'effet se voit aussitôt
          onSelect={(event) => event.preventDefault()}
        >
          Span colors
        </DropdownMenu.CheckboxItem>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
