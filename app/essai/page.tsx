// Essai des données en local : la page d'exploration, résolue dans le navigateur sur le fichier
// du volume (components/LocalExplorer.tsx), sans base ni rendu serveur de la sélection. À côté
// de la page `/`, à comparer avec elle ; le premier volume exporté (scripts/export-volume.ts).

import { existsSync, readdirSync } from "node:fs";
import { Suspense } from "react";
import { LocalExplorer } from "../../components/LocalExplorer.tsx";

export default function Page() {
  // hors Git : absent tant qu'aucun volume n'est exporté (en CI notamment)
  const dir = "public/volumes";
  const volumeId = (existsSync(dir) ? readdirSync(dir) : [])
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.slice(0, -".json".length))
    .sort()[0];
  if (volumeId === undefined) return <p>No volume exported.</p>;
  // useSearchParams : la page statique est rendue sans requête, la vue ne l'est qu'au navigateur
  return (
    <Suspense>
      <LocalExplorer volumeId={volumeId} />
    </Suspense>
  );
}
