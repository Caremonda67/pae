import { test } from "node:test";
import assert from "node:assert/strict";
import { firmarToken, requiereRol } from "../src/config/auth.js";
import { armarMensajeEmailHtml } from "../src/routes/reservas.js";

test("armarMensajeEmailHtml escapa caracteres HTML en el nombre del estudiante", () => {
  const payloadMalicioso = "<script>alert('xss')</script> & \"prueba\" 'test'";
  const html = armarMensajeEmailHtml(payloadMalicioso, "2026-10-01", "Almuerzo", "Sede Central");
  
  // No debe contener etiquetas HTML inyectadas sin escapar
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"));
  assert.ok(html.includes("&amp;"));
  assert.ok(html.includes("&quot;prueba&quot;"));
});

test("PUT /api/reservas/:id permite a admin y cocina pero bloquea a profesor", () => {
  const tokenProfesor = firmarToken({ usuario: "profe1", rol: "profesor", nombre: "Profesor" });
  const tokenCocina = firmarToken({ usuario: "cocina1", rol: "cocina", nombre: "Cocina" });
  const tokenAdmin = firmarToken({ usuario: "admin", rol: "admin", nombre: "Admin" });

  const middleware = requiereRol("admin", "cocina");

  // Profesor debe recibir 403
  const resProfesor = { code: 0, status(c) { this.code = c; return this; }, json() { return this; } };
  middleware({ headers: { authorization: `Bearer ${tokenProfesor}` } }, resProfesor, () => {});
  assert.equal(resProfesor.code, 403);

  // Cocina y Admin deben pasar
  let pasoCocina = false;
  middleware({ headers: { authorization: `Bearer ${tokenCocina}` } }, {}, () => { pasoCocina = true; });
  assert.equal(pasoCocina, true);

  let pasoAdmin = false;
  middleware({ headers: { authorization: `Bearer ${tokenAdmin}` } }, {}, () => { pasoAdmin = true; });
  assert.equal(pasoAdmin, true);
});
