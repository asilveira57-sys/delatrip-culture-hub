import { Link } from "@tanstack/react-router";

import { FaqSecao } from "@/components/FaqSecao";
import type { GuiaCategoria } from "@/config/category-guides";

/** Bloco de guia de compra exibido no fim da página de uma categoria raiz. */
export function GuiaCategoriaSecao({ guia }: { guia: GuiaCategoria }) {
  return (
    <section aria-labelledby="guia-categoria" className="mt-16 border-t border-border pt-12">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Guia de compra</p>
        <h2 id="guia-categoria" className="mt-2 text-2xl font-semibold uppercase">
          {guia.titulo}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-foreground">{guia.resumo}</p>

        {guia.secoes.map((secao) => (
          <div key={secao.titulo} className="mt-10">
            <h3 className="text-lg font-semibold">{secao.titulo}</h3>
            {secao.paragrafos?.map((p, i) => (
              <p key={i} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
            {secao.itens?.length ? (
              <dl className="mt-4 space-y-4">
                {secao.itens.map((item) => (
                  <div key={item.termo}>
                    <dt className="text-sm font-semibold text-foreground">{item.termo}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.descricao}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        ))}

        <FaqSecao itens={guia.faq} className="mt-12" />

        {guia.leiaTambem?.length ? (
          <div className="mt-10">
            <h3 className="text-sm font-semibold uppercase">Leia também</h3>
            <ul className="mt-3 space-y-2">
              {guia.leiaTambem.map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="text-sm font-semibold text-primary hover:underline">
                    {l.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
