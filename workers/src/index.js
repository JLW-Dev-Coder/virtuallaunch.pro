/**
 * Cloudflare Worker — Virtual Launch API
 *
 * Purpose:
 * - Provide a health endpoint to verify routing + deployment
 * - Provide a read-only directory endpoint backed by R2
 *
 * Architecture:
 * - Domain: https://api.virtuallaunch.pro
 * - Storage authority: R2_VIRTUAL_LAUNCH
 * - Read model key: va/directory/index.json
 *
 * This file currently supports:
 *   GET /health
 *   GET /directory
 *
 * All other routes return 404 (deny-by-default).
 */

export default {
  async fetch(request, env) {
    // Parse the incoming request URL
    const url = new URL(request.url);

    /**
     * ------------------------------------------------------------
     * GET /health
     * ------------------------------------------------------------
     * Simple liveness check.
     * Used to confirm:
     * - DNS is working
     * - Worker route is attached
     * - Deployment succeeded
     */
    if (request.method === "GET" && url.pathname === "/health") {
      return json(
        {
          ok: true,
          route: "health"
        },
        200
      );
    }

    /**
     * ------------------------------------------------------------
     * GET /directory
     * ------------------------------------------------------------
     * Read-only endpoint.
     *
     * Reads the directory index from R2:
     *   R2 bucket: R2_VIRTUAL_LAUNCH
     *   Object key: va/directory/index.json
     *
     * If the object does not exist, returns an empty directory.
     */
    if (request.method === "GET" && url.pathname === "/directory") {
      const key = "va/directory/index.json";

      // Attempt to read the object from R2
      const obj = await env.R2_VIRTUAL_LAUNCH.get(key);

      // If no object exists yet, return default structure
      if (!obj) {
        return json({ directory: [] }, 200);
      }

      // Return the exact JSON stored in R2
      return new Response(await obj.text(), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8"
        }
      });
    }

    /**
     * ------------------------------------------------------------
     * Default: 404
     * ------------------------------------------------------------
     * Deny-by-default architecture.
     * Any undefined route returns a 404 JSON response.
     */
    return json(
      {
        error: "Not found",
        path: url.pathname
      },
      404
    );
  }
};

/**
 * Helper: JSON Response Wrapper
 *
 * Standardizes JSON responses with correct headers.
 */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

/**
 * ------------------------------------------------------------
 * Method Guard (Read-Only Phase)
 * ------------------------------------------------------------
 * This Worker is currently in read-only mode.
 *
 * - Only GET requests are allowed.
 * - All non-GET methods (POST, PUT, DELETE, etc.) are rejected.
 *
 * Purpose:
 * - Prevent accidental state mutations.
 * - Prevent form submissions from hitting unimplemented routes.
 * - Enforce deny-by-default API design.
 *
 * This guard will be relaxed once explicit POST contract endpoints
 * are implemented (receipt → canonical → projection order).
 */
if (request.method !== "GET") {
  return json(
    {
      error: "Method not allowed",
      method: request.method
    },
    405
  );
}
