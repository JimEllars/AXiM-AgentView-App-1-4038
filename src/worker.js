/* global WebSocketPair */
// Edge Routing & Gateway Proxy Framework
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Enforce global environment CORS contracts
    if (request.method === "OPTIONS") return handleCorsPreflight();

    // Handle WebSocket Upgrades
    if (request.headers.get("Upgrade") === "websocket") {
      const token = url.searchParams.get("token");
      if (!token) {
        return new Response(JSON.stringify({ error: "Missing security boundary token." }), { status: 401, headers: getCorsHeaders() });
      }

      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);
      server.accept();

      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }

    // Verify presence of internal master passport credentials
    const passportToken = request.headers.get("Authorization");
    if (!passportToken) {
      return new Response(JSON.stringify({ error: "Missing security boundary token." }), {
        status: 401,
        headers: getCorsHeaders()
      });
    }

    // Securely inject the internal AXiM key
    const internalAximKey = env.AXIM_INTERNAL_KEY || 'development_mock_key';

    // Route /api/v1/contracts for smart contract generation
    if (request.method === "POST" && url.pathname === "/api/v1/contracts") {
      try {
        const bodyText = await request.text();
        const payload = JSON.parse(bodyText);
        const { agentId, scope, compensation } = payload;

        // Mocking the contract creation
        const contractId = crypto.randomUUID();

        const responsePayload = {
          contract_id: contractId,
          agent_id: agentId,
          scope,
          compensation_limit: compensation,
          status: 'ACTIVE',
          created_at: new Date().toISOString()
        };

        return new Response(JSON.stringify(responsePayload), {
          status: 201,
          headers: getCorsHeaders()
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Invalid payload for contract generation." }), {
          status: 400,
          headers: getCorsHeaders()
        });
      }
    }

    // Route /api/agentview/* to AXiM Core API
    if (url.pathname.startsWith("/api/agentview/")) {
      const corePath = url.pathname.replace("/api/agentview", "/v1/internal/orchestration");
      
      const coreHeaders = new Headers(request.headers);
      coreHeaders.set("Authorization", `Bearer ${internalAximKey}`);
      coreHeaders.set("X-Original-Token", passportToken); // Forward original user token for context

      try {
        const coreResponse = await fetch(`https://api.axim.us.com${corePath}${url.search}`, {
          method: request.method,
          headers: coreHeaders,
          body: request.method !== 'GET' && request.method !== 'HEAD' ? request.clone().body : undefined,
        });

        // We copy the response but replace CORS headers
        const responseHeaders = new Headers(coreResponse.headers);
        if (request.method === 'GET') {
          responseHeaders.set("Cache-Control", "public, max-age=5, s-maxage=5");
        }
        setCorsHeaders(responseHeaders);

        return new Response(coreResponse.body, {
          status: coreResponse.status,
          statusText: coreResponse.statusText,
          headers: responseHeaders
        });
      } catch (error) {
         return new Response(JSON.stringify({ error: "Upstream AXiM Core API failure." }), {
          status: 502,
          headers: getCorsHeaders()
        });
      }
    }

    return new Response(JSON.stringify({ error: "Route unrecognized by AgentView proxy plane." }), {
      status: 404,
      headers: getCorsHeaders()
    });
  }
};

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Content-Type": "application/json"
  };
}

function setCorsHeaders(headers) {
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
}

function handleCorsPreflight() {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders()
  });
}
