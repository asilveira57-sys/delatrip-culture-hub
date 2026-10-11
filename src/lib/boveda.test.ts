import { describe, expect, it } from "vitest";

import { casarEstoque, ideal, lerSku, type Entrada } from "./boveda";

const estoque = [lerSku({ slug: "umidificador-boveda-62-sache-8g", nome: "Umidificador Boveda 62% Sache 8g com 5 Unidades" })!];

function rodar(e: Entrada) {
  const i = ideal(e);
  return { i, c: casarEstoque(e, i, estoque) };
}

describe("calculadora boveda", () => {
  it("1. flores 10 g, joints, úmido → Size 4 58%; alternativa Size 8 62%", () => {
    const { i, c } = rodar({ tipo: "flores", gramas: 10, consumo: "enrolo", clima: "umido" });
    expect(i.opcoes[0]).toMatchObject({ tamanho: 4, packs: 1, ur: 58 });
    expect(c).toMatchObject({ tipo: "alternativa", embalagens: 1, urEquivalente: true, opcao: { tamanho: 8, packs: 1, ur: 62 } });
  });
  it("2. flores 100 g padrão → Size 67 62%; alternativa 4× Size 8 = 1 embalagem", () => {
    const { i, c } = rodar({ tipo: "flores", gramas: 100, consumo: "outro", clima: "nao-sei" });
    expect(i.opcoes[0]).toMatchObject({ tamanho: 67, packs: 1, ur: 62 });
    expect(c).toMatchObject({ tipo: "alternativa", embalagens: 1, urEquivalente: false, opcao: { packs: 4 } });
  });
  it("3. flores 3000 g → 2× Size 320; indisponível", () => {
    const { i, c } = rodar({ tipo: "flores", gramas: 3000, consumo: "outro", clima: "seco" });
    expect(i.opcoes[0]).toMatchObject({ tamanho: 320, packs: 2, ur: 62 });
    expect(c.tipo).toBe("indisponivel");
  });
  it("4. humidor madeira novo 75 → temperar 3× 84%, depois 3× 60 ou 1× 320 a 72%", () => {
    const { i } = rodar({ tipo: "charutos", local: "madeira", capacidade: 75, novo: true, preferencia: "normal" });
    expect(i.temperagem).toMatchObject({ tamanho: 60, packs: 3, ur: 84 });
    expect(i.opcoes).toMatchObject([{ tamanho: 60, packs: 3, ur: 72 }, { tamanho: 320, packs: 1, ur: 72 }]);
  });
  it("5. cooler 150 → 6× 60 ou 2× 320 a 69%, 320 em destaque", () => {
    const { i } = rodar({ tipo: "charutos", local: "cooler", capacidade: 150, preferencia: "normal" });
    expect(i.opcoes).toMatchObject([{ packs: 6, ur: 69 }, { packs: 2, ur: 69, destaque: true }]);
  });
  it("6. madeira 125, mais úmido → 5× 60 ou 1× 320 a 75%", () => {
    const { i } = rodar({ tipo: "charutos", local: "madeira", capacidade: 125, preferencia: "umido" });
    expect(i.opcoes).toMatchObject([{ packs: 5, ur: 75 }, { packs: 1, ur: 75 }]);
  });
  it("7. tubo → 1× Size 8 69%, sem oferecer o 62%", () => {
    const { i, c } = rodar({ tipo: "charutos", local: "tubo", preferencia: "normal" });
    expect(i.opcoes[0]).toMatchObject({ tamanho: 8, packs: 1, ur: 69 });
    expect(c.tipo).toBe("indisponivel");
  });
});
