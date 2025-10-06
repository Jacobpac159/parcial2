# parcial2

##Crear el entorno para la api
```
mkdir api-protegida
cd api-protegida
npm init -y
npm install express express-jwt jwks-rsa
```

##Crear el server.js en vsc
```
const express = require("express");
const { expressjwt: jwt } = require("express-jwt");
const jwksRsa = require("jwks-rsa");

const app = express();

// --- Configuración para validar tokens emitidos por tu Keycloak ---
const jwtCheck = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksUri: "http://localhost:8080/realms/mi-realm/protocol/openid-connect/certs" // Realm del grupo
  }),
  issuer: "http://localhost:8080/realms/mi-realm",
  algorithms: ["RS256"]
});

// --- Middleware que valida el token en todas las rutas ---
app.use(jwtCheck);

// --- Función para verificar scopes específicos ---
function requireScope(scope) {
  return (req, res, next) => {
    const scopes = req.auth?.scope?.split(" ") || [];
    if (scopes.includes(scope)) return next();
    return res.status(403).json({ message: "Falta el scope requerido: " + scope });
  };
}

// --- Rutas protegidas ---
app.get("/api/data", requireScope("service.read"), (req, res) => {
  res.json({
    message: "✅ Acceso concedido con scope service.read",
    tokenInfo: req.auth
  });
});

app.post("/api/data", requireScope("service.write"), (req, res) => {
  res.json({ message: "✅ Acceso concedido con scope service.write" });
});

app.listen(3000, () => console.log("API protegida corriendo en http://localhost:3000"));
```

##Ejecutar:
node server.js

##prueba con postman:
Este paso obtiene el access_token desde Keycloak usando el cliente service-client.

Método: POST

URL:

http://localhost:8080/realms/mi-realm/protocol/openid-connect/token


Pestaña Body → selecciona x-www-form-urlencoded

Agrega estos parámetros (en forma de pares clave-valor):

Key	Value
grant_type	client_credentials
client_id	service-client
client_secret	(pídele a tu compañero el secreto de ese cliente)
scope	service.read

Presiona Send

👉 Si todo está bien, Postman te devolverá un JSON con este formato:

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6...",
  "expires_in": 300,
  "token_type": "Bearer",
  "scope": "service.read"
}

🧩 3️⃣ Copia el access_token

Ese es el token que vas a usar para autenticarte en tu API.

🧩 4️⃣ Crea otra request para llamar tu API

Método: GET

URL:

http://localhost:3000/api/data


Pestaña Authorization → selecciona tipo Bearer Token

En el campo del token pega el access_token que copiaste.

Presiona Send

👉 Si el token es válido y tiene el scope correcto, verás algo como:

{
  "message": "✅ Acceso concedido con scope service.read",
  "tokenInfo": {
    "iss": "http://localhost:8080/realms/mi-realm",
    "client_id": "service-client",
    "scope": "service.read",
    ...
  }
}


🎯 ¡Eso confirma que tu API está validando el token emitido por Keycloak!

🧩 5️⃣ Prueba un caso fallido (para mostrar seguridad)

Borra el token o pon uno inventado.

Presiona Send de nuevo.
→ Debe responder:

{
  "message": "Unauthorized"
}


o 401 Unauthorized (según cómo esté firmado el token).

Así demuestras que la validación funciona.

