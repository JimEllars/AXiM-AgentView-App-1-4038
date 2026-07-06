/* global WebSocketPair */
// Edge Routing & Gateway Proxy Framework
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);


    // Handle WebSocket Upgrades
    if (request.headers.get("Upgrade") === "websocket") {
      const token = url.searchParams.get("token");
      if (!token) {
        return new Response(JSON.stringify({ error: "Missing security boundary token." }), { status: 401, headers: getCorsHeaders() });
      }

      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);
      server.accept();

      server.addEventListener('message', event => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'PING') {
            server.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          }
        } catch (e) {
          // Ignore parse errors on malformed ping
        }
      });


      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }

    // Enforce global environment CORS contracts
    if (request.method === "OPTIONS") return handleCorsPreflight();

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

    // Route /api/v1/telemetry for edge logging
    if (request.method === "POST" && url.pathname === "/api/v1/telemetry") {
      try {
        const bodyText = await request.text();
        const payload = JSON.parse(bodyText);
        if (payload.level === "CRITICAL" || payload.level === "SECURITY_ANOMALY") {
          console.error("[Edge Telemetry]", JSON.stringify(payload));
        }
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: getCorsHeaders()
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Invalid telemetry payload." }), {
          status: 400,
          headers: getCorsHeaders()
        });
      }
    }

    // Route /api/v1/contracts for smart contract generation
    if (request.method === "POST" && url.pathname === "/api/v1/contracts") {
      if (!verifyAdminRole(passportToken)) {
        return new Response(JSON.stringify({ error: "Insufficient ecosystem clearance for financial mutation." }), {
          status: 403,
          headers: getCorsHeaders()
        });
      }
      try {
        const bodyText = await request.text();
        const payload = JSON.parse(bodyText);
        if (!payload || typeof payload.agentId !== 'string' || payload.agentId.trim() === '') {
          return new Response(JSON.stringify({ error: "Malformed payload structure." }), {
            status: 400,
            headers: getCorsHeaders()
          });
        }

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

        if (env.AXIM_EDGE_KV) {
          try {
            await env.AXIM_EDGE_KV.put(contractId, JSON.stringify(responsePayload), { expirationTtl: 86400 });
          } catch (kvError) {
            console.error("KV put failed:", kvError);
          }
        }

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

    // Route /api/agentview/payroll/settle for edge settlement
    if (request.method === "POST" && url.pathname === "/api/agentview/payroll/settle") {
      if (!verifyAdminRole(passportToken)) {
        return new Response(JSON.stringify({ error: "Insufficient ecosystem clearance for financial mutation." }), {
          status: 403,
          headers: getCorsHeaders()
        });
      }
      try {
        const bodyText = await request.text();
        const payload = JSON.parse(bodyText);
        if (!payload || typeof payload.agentId !== 'string' || payload.agentId.trim() === '') {
          return new Response(JSON.stringify({ error: "Malformed payload structure." }), {
            status: 400,
            headers: getCorsHeaders()
          });
        }

        const { agentId } = payload;

        // Inject AXIM_INTERNAL_KEY internally
        const injectedKey = internalAximKey;

        return new Response(JSON.stringify({ success: true, payment_intent_id: "pi_mock_12345", status: "requires_capture" }), {
          status: 200,
          headers: getCorsHeaders()
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Invalid payload for payroll settlement." }), {
          status: 400,
          headers: getCorsHeaders()
        });
      }
    }


    // Route /api/v1/presence (POST) for KV write paths
    if (request.method === "POST" && url.pathname === "/api/v1/presence") {
      try {
        const bodyText = await request.text();
        const payload = JSON.parse(bodyText);
        if (!payload.agentId || !payload.status) {
          return new Response(JSON.stringify({ error: "Missing agentId or status" }), { status: 400, headers: getCorsHeaders() });
        }
        if (env.KV_BINDING) {
          await env.KV_BINDING.put(payload.agentId, payload.status, { expirationTtl: 300 });
        }
        return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: getCorsHeaders() });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400, headers: getCorsHeaders() });
      }
    }

    // Route /api/v1/presence to check agent presence state
    if (request.method === "GET" && url.pathname === "/api/v1/presence") {
      let presenceMap = {};
      if (env.KV_BINDING) {
        try {
          const listResult = await env.KV_BINDING.list();
          // Optimized concurrent KV gets
          const keys = listResult.keys.map(k => k.name);
          const values = await Promise.all(keys.map(key => env.KV_BINDING.get(key)));

          keys.forEach((key, index) => {
            presenceMap[key] = values[index] || "ONLINE";
          });
        } catch (error) {
          console.error("KV presence listing failed:", error);
          presenceMap = {}; // Safe empty object on error
        }
      }
      return new Response(JSON.stringify(presenceMap), {
        status: 200,
        headers: getCorsHeaders()
      });
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


function verifyAdminRole(token) {
  try {
    const parts = token.replace('Bearer ', '').split('.');
    if (parts.length !== 3) return false;

    // We decode the payload (part 1)
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    return payload.role === 'ADMIN';
  } catch (e) {
    return false;
  }
}
