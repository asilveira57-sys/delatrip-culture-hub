import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { BrandChip } from "@/components/BrandCard";
import { Button } from "@/components/ui/button";
import type { Brand } from "@/lib/catalog";

export function BrandCarousel({ marcas }: { marcas: Brand[] }) {
  const trilhoRef = useRef<HTMLDivElement>(null);
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);

  const atualizarSetas = useCallback(() => {
    const trilho = trilhoRef.current;
    if (!trilho) return;
    const limite = trilho.scrollWidth - trilho.clientWidth;
    setPodeVoltar(trilho.scrollLeft > 4);
    setPodeAvancar(limite > 4 && trilho.scrollLeft < limite - 4);
  }, []);

  useEffect(() => {
    const trilho = trilhoRef.current;
    if (!trilho) return;
    atualizarSetas();
    trilho.addEventListener("scroll", atualizarSetas, { passive: true });
    const observer = new ResizeObserver(atualizarSetas);
    observer.observe(trilho);
    return () => {
      trilho.removeEventListener("scroll", atualizarSetas);
      observer.disconnect();
    };
  }, [atualizarSetas, marcas.length]);

  const mover = (direcao: -1 | 1) => {
    const trilho = trilhoRef.current;
    if (!trilho) return;
    trilho.scrollBy({
      left: direcao * Math.max(184, trilho.clientWidth * 0.75),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  return (
    <div className="relative mx-auto max-w-[78rem] px-12 sm:px-16">
      <Button
        type="button"
        variant="onInk"
        size="icon"
        aria-label="Ver marcas anteriores"
        disabled={!podeVoltar}
        onClick={() => mover(-1)}
        className="absolute left-1 top-1/2 z-10 size-11 -translate-y-1/2 rounded-full bg-ink shadow-lg sm:left-2"
      >
        <ChevronLeft aria-hidden="true" />
      </Button>

      <div
        ref={trilhoRef}
        tabIndex={0}
        aria-label="Marcas que trabalhamos"
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {marcas.map((marca) => (
          <BrandChip key={marca.slug} marca={marca} />
        ))}
      </div>

      <Button
        type="button"
        variant="onInk"
        size="icon"
        aria-label="Ver próximas marcas"
        disabled={!podeAvancar}
        onClick={() => mover(1)}
        className="absolute right-1 top-1/2 z-10 size-11 -translate-y-1/2 rounded-full bg-ink shadow-lg sm:right-2"
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  );
}