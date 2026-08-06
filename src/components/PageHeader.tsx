import type { Crumb } from "@/components/Breadcrumb";
import { Breadcrumb } from "@/components/Breadcrumb";

export function PageHeader({
  eyebrow,
  titulo,
  descricao,
  crumbs,
}: {
  eyebrow?: string;
  titulo: string;
  descricao?: string;
  crumbs?: Crumb[];
}) {
  return (
    <section className="surface-ink">
      <div className="mx-auto max-w-6xl px-4 py-14">
        {crumbs ? (
          <div className="[&_a]:text-ink-muted [&_li]:text-ink-muted [&_span]:text-ink-foreground">
            <Breadcrumb items={crumbs} />
          </div>
        ) : null}
        {eyebrow ? <p className="eyebrow text-gold">{eyebrow}</p> : null}
        <h1 className="mt-2 text-4xl font-bold uppercase text-ink-foreground sm:text-5xl">
          {titulo}
        </h1>
        {descricao ? (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
            {descricao}
          </p>
        ) : null}
      </div>
    </section>
  );
}
