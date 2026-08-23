import { useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ACCEPT_IMAGENS, enviarImagem, formatarTamanho } from "@/lib/media";
import { SITE_URL } from "@/lib/seo";

export type ValoresSociais = {
  og_titulo?: string | null;
  og_descricao?: string | null;
  og_imagem_url?: string | null;
  og_imagem_alt?: string | null;
  twitter_card?: string;
};

type Props = {
  valores: ValoresSociais;
  onChange: (parcial: ValoresSociais) => void;
  /** Fallbacks vindos do conteúdo (título/descrição/capa). */
  tituloFallback: string;
  descricaoFallback: string;
  imagemFallback?: string | null;
  /** Caminho público exibido na pré-visualização. */
  caminho: string;
  baseArquivo: string;
};

function dominio() {
  return SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function Contador({ texto, limite }: { texto: string; limite: number }) {
  return (
    <span
      className={
        texto.length > limite
          ? "text-xs font-medium text-destructive"
          : "text-xs text-muted-foreground"
      }
    >
      {texto.length}/{limite}
    </span>
  );
}

export function SocialCardsEditor({
  valores,
  onChange,
  tituloFallback,
  descricaoFallback,
  imagemFallback,
  caminho,
  baseArquivo,
}: Props) {
  const [enviando, setEnviando] = useState(false);

  const titulo = valores.og_titulo?.trim() || tituloFallback || "Título da publicação";
  const descricao =
    valores.og_descricao?.trim() || descricaoFallback || "Descrição exibida ao compartilhar.";
  const imagem = valores.og_imagem_url || imagemFallback || null;
  const card = valores.twitter_card || "summary_large_image";

  async function enviar(file: File) {
    setEnviando(true);
    try {
      const { url, tamanho } = await enviarImagem(file, `${baseArquivo || "social"}-og`);
      onChange({ og_imagem_url: url });
      toast.success(`Imagem social enviada (${formatarTamanho(tamanho)}).`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no envio.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-base font-semibold">Compartilhamento (Open Graph e Twitter)</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Como o link aparece no WhatsApp, Facebook, LinkedIn e X. Campos em branco usam o
        título, a descrição e a capa da publicação.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="og-titulo">Título social</Label>
              <Contador texto={valores.og_titulo ?? ""} limite={70} />
            </div>
            <Input
              id="og-titulo"
              value={valores.og_titulo ?? ""}
              placeholder={tituloFallback}
              onChange={(e) => onChange({ og_titulo: e.target.value })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="og-descricao">Descrição social</Label>
              <Contador texto={valores.og_descricao ?? ""} limite={200} />
            </div>
            <Textarea
              id="og-descricao"
              rows={3}
              value={valores.og_descricao ?? ""}
              placeholder={descricaoFallback}
              onChange={(e) => onChange({ og_descricao: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="og-imagem">Imagem social (recomendado 1200×630)</Label>
            <Input
              id="og-imagem"
              type="file"
              accept={ACCEPT_IMAGENS}
              disabled={enviando}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void enviar(f);
              }}
            />
            {valores.og_imagem_url ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 h-7 px-2 text-xs"
                onClick={() => onChange({ og_imagem_url: null, og_imagem_alt: "" })}
              >
                Remover imagem e usar a capa
              </Button>
            ) : null}
          </div>

          <div>
            <Label htmlFor="og-alt">Texto alternativo da imagem</Label>
            <Input
              id="og-alt"
              value={valores.og_imagem_alt ?? ""}
              onChange={(e) => onChange({ og_imagem_alt: e.target.value })}
            />
          </div>

          <div>
            <Label>Formato do card no X (Twitter)</Label>
            <Select value={card} onValueChange={(v) => onChange({ twitter_card: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary_large_image">Imagem grande</SelectItem>
                <SelectItem value="summary">Miniatura</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Facebook / WhatsApp / LinkedIn
            </p>
            <div className="overflow-hidden rounded-lg border border-border bg-background">
              {imagem ? (
                <img
                  src={imagem}
                  alt={valores.og_imagem_alt ?? ""}
                  className="aspect-[1.91/1] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[1.91/1] w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                  sem imagem
                </div>
              )}
              <div className="space-y-1 p-3">
                <p className="text-[11px] uppercase text-muted-foreground">{dominio()}</p>
                <p className="line-clamp-2 text-sm font-semibold">{titulo}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{descricao}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              X (Twitter) — {card === "summary" ? "miniatura" : "imagem grande"}
            </p>
            {card === "summary" ? (
              <div className="flex gap-3 overflow-hidden rounded-xl border border-border bg-background p-3">
                {imagem ? (
                  <img
                    src={imagem}
                    alt={valores.og_imagem_alt ?? ""}
                    className="size-20 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="size-20 shrink-0 rounded bg-muted" />
                )}
                <div className="min-w-0 space-y-1">
                  <p className="line-clamp-1 text-sm font-semibold">{titulo}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{descricao}</p>
                  <p className="text-[11px] text-muted-foreground">{dominio()}</p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-background">
                {imagem ? (
                  <img
                    src={imagem}
                    alt={valores.og_imagem_alt ?? ""}
                    className="aspect-[2/1] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[2/1] w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                    sem imagem
                  </div>
                )}
                <div className="space-y-1 p-3">
                  <p className="line-clamp-1 text-sm font-semibold">{titulo}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{descricao}</p>
                  <p className="text-[11px] text-muted-foreground">{dominio()}</p>
                </div>
              </div>
            )}
          </div>

          <p className="truncate text-[11px] text-muted-foreground">
            {SITE_URL}
            {caminho}
          </p>
        </div>
      </div>
    </section>
  );
}
