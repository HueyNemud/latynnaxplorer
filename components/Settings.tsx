"use client";

// Réglages de l'application (docs/DESIGN.md) : hors de l'URL, mémorisés dans le navigateur. Le
// menu a une section générale, puis une par vue.

import { GearIcon } from "@radix-ui/react-icons";
import { DropdownMenu, IconButton } from "@radix-ui/themes";
import { useState } from "react";

/** Un réglage oui / non, lu puis écrit dans localStorage sous `key` (inaccessible, par exemple si
 * le navigateur refuse le stockage : `initial`, et le choix n'est pas gardé). À n'appeler que dans
 * le navigateur. */
export function useSetting(key: string, initial: boolean): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? initial : stored === "on";
    } catch {
      return initial;
    }
  });
  const set = (on: boolean) => {
    setOn(on);
    try {
      localStorage.setItem(key, on ? "on" : "off");
    } catch {}
  };
  return [on, set];
}

export function Settings({
  outOfScope,
  onOutOfScope,
  spanColors,
  onSpanColors,
}: {
  outOfScope: boolean;
  onOutOfScope: (on: boolean) => void;
  spanColors: boolean;
  onSpanColors: (on: boolean) => void;
}) {
  // le menu reste ouvert : l'effet se voit aussitôt
  const keepOpen = (event: Event) => event.preventDefault();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton size="3" variant="surface" title="Settings" aria-label="Settings">
          <GearIcon aria-hidden="true" />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <DropdownMenu.Label>General</DropdownMenu.Label>
        <DropdownMenu.CheckboxItem
          checked={outOfScope}
          onCheckedChange={onOutOfScope}
          onSelect={keepOpen}
        >
          Show out-of-scope elements
        </DropdownMenu.CheckboxItem>
        <DropdownMenu.Separator />
        <DropdownMenu.Label>List</DropdownMenu.Label>
        <DropdownMenu.CheckboxItem
          checked={spanColors}
          onCheckedChange={onSpanColors}
          onSelect={keepOpen}
        >
          Span colors
        </DropdownMenu.CheckboxItem>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
