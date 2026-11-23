// Page d'exploration (components/Explorer.tsx), entièrement résolue dans le navigateur.
// L'adresse de l'index des volumes est fixée au build : NEXT_PUBLIC_VOLUMES_INDEX, sinon l'index
// servi avec le site (public/volumes/index.json, écrit par scripts/export-volume.ts), sous son
// sous-chemin (next.config.ts).

import { Suspense } from "react";
import { Explorer } from "../components/Explorer.tsx";

const INDEX =
  process.env.NEXT_PUBLIC_VOLUMES_INDEX ??
  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/volumes/index.json`;

export default function Page() {
  // useSearchParams : la page est rendue sans requête au build, la vue au navigateur
  return (
    <Suspense>
      <Explorer index={INDEX} />
    </Suspense>
  );
}
