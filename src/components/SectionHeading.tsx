export function SectionHeading({
  eyebrow,
  titulo,
  descricao,
  onInk = false,
  acao,
}: {
  eyebrow?: string;
  titulo: string;
  descricao?: string;
  onInk?: boolean;
  acao?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className={onInk ? "eyebrow text-gold" : "eyebrow text-primary"}>
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={`mt-2 text-3xl font-semibold uppercase sm:text-4xl ${
            onInk ? "text-ink-foreground" : "text-foreground"
          }`}
        >
          {titulo}
        </h2>
        {descricao ? (
          <p
            className={`mt-3 text-sm leading-relaxed sm:text-base ${
              onInk ? "text-ink-muted" : "text-muted-foreground"
            }`}
          >
            {descricao}
          </p>
        ) : null}
      </div>
      {acao ? <div className="shrink-0">{acao}</div> : null}
    </div>
  );
}
