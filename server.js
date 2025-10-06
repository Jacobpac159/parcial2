const express = require("express");
const https = require("https");
const fs = require("fs");
const { expressjwt: jwt } = require("express-jwt");
const jwksRsa = require("jwks-rsa");

const app = express();

// --- Middleware: rechaza conexiones HTTP ---
app.use((req, res, next) => {
  if (!req.secure && req.get("x-forwarded-proto") !== "https") {
    return res.status(403).json({
      message: "❌ Conexión insegura. Usa HTTPS para acceder a la API."
    });
  }
  next();
});

// --- Validación del token JWT (Keycloak) ---
const jwtCheck = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksUri: "http://localhost:8080/realms/mi-realm/protocol/openid-connect/certs"
  }),
  issuer: "http://localhost:8080/realms/mi-realm",
  algorithms: ["RS256"]
});
app.use(jwtCheck);

// --- Middleware para validar scopes ---
function requireScope(scope) {
  return (req, res, next) => {
    const scopes = [];

    if (req.auth?.scope) scopes.push(...req.auth.scope.split(" "));
    if (req.auth?.resource_access) {
      Object.values(req.auth.resource_access).forEach(resource => {
        if (resource.roles) scopes.push(...resource.roles);
      });
    }

    if (scopes.includes(scope)) return next();
    return res.status(403).json({
      message: "Falta el scope requerido: " + scope,
      encontrado: scopes
    });
  };
}

// --- Endpoints protegidos ---
app.get("/api/data", requireScope("service.read"), (req, res) => {
  res.json({
    message: "✅ Acceso concedido con scope service.read",
    tokenInfo: req.auth
  });
});

app.post("/api/data", requireScope("service.write"), (req, res) => {
  res.json({
    message: "✅ Acceso concedido con scope service.write"
  });
});

// --- Cargar certificados ---
const sslOptions = {
  key: fs.readFileSync("./certs/key.pem"),
  cert: fs.readFileSync("./certs/cert.pem")
};

// --- Iniciar servidor HTTPS ---
https.createServer(sslOptions, app).listen(3000, () => {
  console.log("🔒 API protegida corriendo en https://localhost:3000");
  console.log("🚫 Las conexiones HTTP serán rechazadas automáticamente");
});
