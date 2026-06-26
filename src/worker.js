// Edge Routing & Gateway Proxy Framework
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Enforce global environment CORS contracts
    if (request.method === "OPTIONS") return handleCorsPreflight();

    // Verify presence of internal master passport credentials
    const passportToken = request.headers.get("Authorization");
    if (!passportToken) {
      return new Response("Missing security boundary token.", { status: 401 });
    }

    // Proxy endpoint routing to the primary AXiM data spine
    if (url.pathname === "/api/agentview/sync" && request.method === "POST") {
      const payload = await request.json();
      
      // Perform fast-path formatting on the edge before updating core ledger
      const standardizedPayload = {
        ...payload,
        synchronized_at: new Date().toISOString(),
        node_origin: "CLOUDFLARE_EDGE_PLANE"
      };

      // Dispatch to main API via fetch with keepalive optimization
      const coreResponse = await fetch("https://api.axim.us.com/v1/internal/orchestration/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": passportToken
        },
        body: JSON.stringify(standardizedPayload)
      });

      return new Response(coreResponse.body, {
        status: coreResponse.status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    return new Response("Route unrecognized by AgentView proxy plane.", { status: 404 });
  }
};

function handleCorsPreflight() {
  return new Response("CORS_OK", {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}