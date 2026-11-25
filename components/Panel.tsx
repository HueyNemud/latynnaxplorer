// Panneau repliable des facettes (docs/composants/facettes.md) : son contenu, et à sa droite une
// bande qui le replie ou le déplie. Replié, il ne reste que la bande.

import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import type { ReactNode } from "react";

export function Panel({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="panel" aria-label={title}>
      <div id={`panel-${id}`} className={`panel-body panel-${id}`} hidden={!open}>
        {children}
      </div>
      <button
        type="button"
        className="panel-strip"
        aria-expanded={open}
        aria-controls={`panel-${id}`}
        title={open ? `Collapse ${title}` : `Expand ${title}`}
        onClick={onToggle}
      >
        {/* ouvert : pointe vers la gauche, où le panneau se replie */}
        {open ? <ChevronLeftIcon aria-hidden="true" /> : <ChevronRightIcon aria-hidden="true" />}
        <span className="panel-strip-title">{title}</span>
      </button>
    </section>
  );
}
