// Atteinte par proxy.ts, avec le statut 400, quand la requête de l'URL est invalide.

export default function BadRequest() {
  return (
    <>
      <h1>Invalid query</h1>
      <p>
        The <code>subtree</code> and <code>text</code> parameters may each be given once;{" "}
        <code>subtree</code> must be a node identifier (UUID).
      </p>
    </>
  );
}
