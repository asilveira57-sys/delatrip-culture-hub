import { ProductCard } from "@/components/ProductCard";
import { ROTULO_PAPEL, registrarEventoGuia, type ItemKit } from "@/lib/guia-publico";

/** Grade de itens de um kit, com o papel de cada produto. */
export function ConjuntoGuia({
  itens,
  nivel,
  linha,
}: {
  itens: ItemKit[];
  nivel?: string;
  linha?: string;
}) {
  if (!itens.length)
    return <p className="text-sm text-muted-foreground">Ainda não há itens disponíveis para esta combinação.</p>;
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {itens.map((i) => (
        <div
          key={i.produto.slug}
          className="flex flex-col"
          onClickCapture={() => registrarEventoGuia("clique_produto_kit", { nivel, linha, produto: i.produto.slug })}
        >
          <p className="eyebrow mb-2 text-primary">{ROTULO_PAPEL[i.papel]}</p>
          <div className="flex-1">
            <ProductCard produto={i.produto} />
          </div>
        </div>
      ))}
    </div>
  );
}
