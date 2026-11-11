import assert from "node:assert/strict";
import { test } from "node:test";
import { PLANTILLA_VIAJE, whatsappDesdeRedes } from "./whatsapp-empresa.ts";

const UA_FB_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0.0.40.97;FBBV/123]";
const UA_IG = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Mobile/15E148 Instagram 345.0.0.31.89";
const UA_CHROME = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36";

test("navegador normal: 302 a wa.me con el prefill del origen", () => {
  const r = whatsappDesdeRedes(UA_CHROME, "ig");
  assert.equal(r.status, 302);
  assert.equal(
    r.headers.get("location"),
    `https://wa.me/13467713647?text=${encodeURIComponent(`¡Hola! 😊 Los vi en el Instagram de Destino y Eventos Lotus 360 y quiero planear un viaje.${PLANTILLA_VIAJE}`)}`,
  );
});

test("webview de Facebook/Instagram: página con whatsapp:// y número legible", async () => {
  for (const ua of [UA_FB_IPHONE, UA_IG]) {
    const r = whatsappDesdeRedes(ua, "fb");
    assert.equal(r.status, 200);
    const html = await r.text();
    assert.ok(html.includes(`href="whatsapp://send?phone=13467713647&amp;text=`), "deep link en el botón");
    assert.ok(html.includes(encodeURIComponent("Los vi en el Facebook de Destino y Eventos Lotus 360")), "prefill de Facebook");
    assert.ok(html.includes("+1 (346) 771-3647"), "número legible de respaldo");
  }
});

test("código de puente válido: va en el prefill; inválido se ignora", () => {
  const r = whatsappDesdeRedes(UA_CHROME, "ig", "k7q2m9xp");
  assert.ok(r.headers.get("location")!.endsWith(encodeURIComponent("Vengo de escribirles por Instagram a Destino y Eventos Lotus 360 y quiero seguir con mi viaje por aquí. (ref k7q2m9xp)")));
  for (const malo of ["k7q2m9x", "k7q2m9xl", "<script>a"]) {
    const r2 = whatsappDesdeRedes(UA_CHROME, "ig", malo);
    assert.ok(r2.headers.get("location")!.endsWith(encodeURIComponent(PLANTILLA_VIAJE)));
  }
});

test("origen desconocido: prefill genérico", () => {
  const r = whatsappDesdeRedes(UA_CHROME, "x");
  assert.ok(r.headers.get("location")!.endsWith(encodeURIComponent(`Los vi en las redes de Destino y Eventos Lotus 360 y quiero planear un viaje.${PLANTILLA_VIAJE}`)));
});
