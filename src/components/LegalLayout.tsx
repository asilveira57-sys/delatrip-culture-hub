import type { ReactNode } from "react";

import { PageHeader } from "@/components/PageHeader";
import type { DocumentoLegal } from "@/lib/portal-core";

/**
 * Página legal com identidade editorial do portal: usa o texto publicado no
 * admin quando existir e cai para o conteúdo padrão do código.
 */
export function LegalLayout({
  titulo,
  descricao,
  documento,
  children,
}: {
  titulo: string;
  descricao?: string;
  documento?: DocumentoLegal | null;
  children: ReactNode;
}) {
  const html = documento?.conteudo_html?.trim();
  const atualizado = documento?.updated_at ?? documento?.publicado_em ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Legal"
        titulo={titulo}
        {...(descricao ? { descricao } : {})}
        crumbs={[{ label: titulo }]}
      />
      <div className="mx-auto max-w-3xl px-4 py-14">
        <div className="prose-editor max-w-none text-base leading-relaxed [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:uppercase [&_h3]:mt-6 [&_h3]:font-semibold [&_li]:mt-1 [&_p]:mt-4 [&_p]:text-muted-foreground [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-muted-foreground">
          {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : children}
        </div>
        <p className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          {documento?.versao ? `Versão ${documento.versao} · ` : null}
          Última atualização:{" "}
          {atualizado ? new Date(atualizado).toLocaleDateString("pt-BR") : "—"}
        </p>
      </div>
    </>
  );
}
