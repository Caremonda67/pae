import { test } from "node:test";
import assert from "node:assert/strict";
import { firmarToken, verificarToken } from "../src/config/auth.js";

test("firmarToken genera un token con dos partes", () => {
  const token = firmarToken();
  assert.equal(token.split(".").length, 2);
});

test("verificarToken acepta un token recien firmado", () => {
  const token = firmarToken("admin");
  assert.equal(verificarToken(token), true);
});

test("verificarToken rechaza un token manipulado", () => {
  const token = firmarToken();
  const [base64, firma] = token.split(".");
  // Alteramos el payload y dejamos la firma original
  const manipulado = `${base64}x.${firma}`;
  assert.equal(verificarToken(manipulado), false);
});

test("verificarToken rechaza tokens vacios o mal formados", () => {
  assert.equal(verificarToken(""), false);
  assert.equal(verificarToken("sin-puntos"), false);
  assert.equal(verificarToken(undefined), false);
});

test("verificarToken rechaza un token expirado", () => {
  // Fabricamos un token con expiracion ya vencida
  const payload = Buffer.from(
    JSON.stringify({ sub: "admin", exp: Date.now() - 1000 })
  ).toString("base64url");
  const expirado = `${payload}.firma-invalida`;
  // La firma es invalida y ademas esta expirado: debe rechazarse
  assert.equal(verificarToken(expirado), false);
});
