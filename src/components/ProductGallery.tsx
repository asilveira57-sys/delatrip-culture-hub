import { useEffect, useState } from "react";

/**
 * Galeria do produto: a imagem principal vem do índice do catálogo e as
 * adicionais chegam sob demanda pelo loader da rota (fatia de detalhes).
 */
export function ProductGallery({
  nome,
  principal,
  imagens = [],
}: {
  nome: string;
  principal: string;
  imagens?: string[];
}) {
  const lista = Array.from(new Set([principal, ...imagens])).filter(Boolean);
  const [ativa, setAtiva] = useState(0);

  // Ao trocar de produto (ou quando os detalhes carregam), volta para a 1ª.
  useEffect(() => setAtiva(0), [principal]);

  const atual = lista[ativa] ?? principal;

  return (
    <div>
      <img
        src={atual}
        alt={nome}
        width={1024}
        height={1024}
        decoding="async"
        className="aspect-square w-full rounded-lg border border-border bg-ink object-cover"
      />

      {lista.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-3" aria-label="Imagens do produto">
          {lista.map((url, i) => (
            <li key={url}>
              <button
                type="button"
                onClick={() => setAtiva(i)}
                aria-label={`Ver imagem ${i + 1} de ${lista.length}`}
                aria-current={i === ativa}
                className={`block w-full overflow-hidden rounded-md border transition-colors ${
                  i === ativa
                    ? "border-primary ring-1 ring-primary"
                    : "border-border hover:border-primary/60"
                }`}
              >
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
