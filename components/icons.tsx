// Icônes du site, chacune dessinée une fois : traits de 16 × 16, à la taille et la couleur du
// texte (.icon dans app/globals.css), décoratives (le nom est porté par l'élément qui les tient).

import type { ReactNode } from "react";

function Icon({ className, children }: { className?: string | undefined; children: ReactNode }) {
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Chevron : déplier (à droite, tourné d'un quart quand c'est ouvert), replier un panneau (à
 * gauche). */
export function ChevronIcon({
  direction = "right",
  className,
}: {
  direction?: "right" | "left";
  className?: string;
}) {
  return (
    <Icon className={className}>
      <path d={direction === "right" ? "M6 3.5 10.5 8 6 12.5" : "M10 3.5 5.5 8 10 12.5"} />
    </Icon>
  );
}

export function SearchIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3 3" />
    </Icon>
  );
}

export function ClearIcon() {
  return (
    <Icon>
      <path d="m4.5 4.5 7 7m0-7-7 7" />
    </Icon>
  );
}

/** Ouvrir à part (nouvelle sélection). */
export function OpenIcon() {
  return (
    <Icon>
      <path d="M9.5 2.5h4v4M13.5 2.5 7.5 8.5M11.5 9.5v3a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3" />
    </Icon>
  );
}
