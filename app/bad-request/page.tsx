// Atteinte par proxy.ts, avec le statut 400, quand la requête de l'URL est invalide.

export default function BadRequest() {
  return (
    <>
      <h1>Invalid query</h1>
      <p>
        The <code>text</code> parameter may be given once; each <code>subtree</code> parameter must
        be a node identifier (UUID).
      </p>
    </>
  );
}
