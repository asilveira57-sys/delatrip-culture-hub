import { describe, expect, it } from "vitest";

import { extrairFaqDoHtml } from "./faq-html";

const html = `<p>Texto</p><div><h2><strong>FAQ - D&Uacute;VIDAS FREQUENTES SOBRE A RAW</strong></h2></div><div><details><summary> Como identificar uma RAW original? <img alt="" src="https://x/icone.png" /> </summary><div>Possui a <strong>marca d&rsquo;&aacute;gua</strong>.</div></details></div>`;

describe("FAQ importada em <details>", () => {
  it("vira item de FAQ sem o ícone e sai da descrição", () => {
    const r = extrairFaqDoHtml(html);
    expect(r.itens).toEqual([
      { pergunta: "Como identificar uma RAW original?", resposta: "Possui a <strong>marca d&rsquo;&aacute;gua</strong>." },
    ]);
    expect(r.html).toBe("<p>Texto</p>");
  });
  it("não mexe em descrição sem FAQ", () => {
    expect(extrairFaqDoHtml("<p>Oi</p>")).toEqual({ html: "<p>Oi</p>", itens: [] });
  });
});
