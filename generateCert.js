const fs = require("fs");
const selfsigned = require("selfsigned");

const attrs = [{ name: "commonName", value: "localhost" }];
const pems = selfsigned.generate(attrs, { days: 365 });

fs.mkdirSync("certs", { recursive: true });
fs.writeFileSync("certs/cert.pem", pems.cert);
fs.writeFileSync("certs/key.pem", pems.private);

console.log("✅ Certificados autofirmados generados correctamente en /certs");
