// Catch any module-load crash and surface it as JSON instead of FUNCTION_INVOCATION_FAILED
let handler;
try {
  const mod = await import("../artifacts/api-server/dist/handler.mjs");
  handler = mod.default;
} catch (err) {
  const msg = err?.message ?? String(err);
  handler = (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Server startup failed", detail: msg }));
  };
}

export default handler;
