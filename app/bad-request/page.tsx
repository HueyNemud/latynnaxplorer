// Atteinte par proxy.ts, avec le statut 400, quand la requête de l'URL est invalide.

export default function BadRequest() {
  return (
    <>
      <h1>Invalid query</h1>
      <p>
        The <code>subtree</code> parameter must be given once, as a node identifier (UUID).
      </p>
    </>
  );
}
