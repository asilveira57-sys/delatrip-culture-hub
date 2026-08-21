import { useRef, useState } from "react";
import { toast } from "sonner";

import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CampoEditavel } from "@/config/paginas-editaveis";
import { ACCEPT_IMAGENS, enviarImagem, validarImagem } from "@/lib/media";
import type { Blocos, JsonValor } from "@/lib/paginas-core";

function CampoImagem({
  campo,
  valor,
  onChange,
  baseArquivo,
}: {
  campo: CampoEditavel;
  valor: string;
  onChange: (v: string) => void;
  baseArquivo: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function selecionar(file: File | undefined) {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    const invalido = validarImagem(file);
    if (invalido) {
      setErro(invalido);
      toast.error(invalido);
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const { url } = await enviarImagem(file, `${baseArquivo}-capa`);
      onChange(url);
      toast.success("Imagem enviada.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao enviar imagem.";
      setErro(msg);
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <Label>{campo.label}</Label>
      {campo.ajuda ? (
        <p className="mb-1 text-xs text-muted-foreground">{campo.ajuda}</p>
      ) : null}
      {valor ? (
        <img
          src={valor}
          alt="Pré-visualização da imagem de capa"
          className="mt-2 h-40 w-full rounded-md border border-border object-cover"
        />
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_IMAGENS}
        className="hidden"
        onChange={(e) => void selecionar(e.target.files?.[0])}
      />
      <div className="mt-2 flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={enviando}
          onClick={() => inputRef.current?.click()}
        >
          {enviando ? "Enviando…" : valor ? "Trocar imagem" : "Anexar imagem"}
        </Button>
        {valor ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Remover
          </Button>
        ) : null}
      </div>
      {erro ? (
        <p role="alert" className="mt-2 text-xs font-medium text-destructive">
          {erro}
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Formatos aceitos: JPG, PNG, WebP, GIF ou AVIF. Tamanho máximo: 8MB.
        </p>
      )}
    </div>
  );
}

type Props = {
  campos: CampoEditavel[];
  blocos: Blocos;
  onChange: (chave: string, valor: JsonValor) => void;
  /** Prefixo usado no caminho dos uploads de imagem do editor. */
  baseArquivo: string;
};

/** Renderiza os campos editáveis de uma página (texto, textarea, rich, lista). */
export function CamposBlocos({ campos, blocos, onChange, baseArquivo }: Props) {
  function itensLista(chave: string, quantidade: number, subCampos: { chave: string }[]) {
    const bruto = blocos[chave];
    const atual = Array.isArray(bruto) ? (bruto as Record<string, JsonValor>[]) : [];
    return Array.from({ length: quantidade }, (_, i) => {
      const item = atual[i] ?? {};
      const preenchido: Record<string, string> = {};
      for (const sub of subCampos) preenchido[sub.chave] = String(item[sub.chave] ?? "");
      return preenchido;
    });
  }

  return (
    <>
      {campos.map((campo) => {
        const valor = blocos[campo.chave];

        if (campo.tipo === "lista") {
          const subCampos = campo.itens ?? [];
          const itens = itensLista(campo.chave, campo.quantidade ?? 3, subCampos);
          return (
            <section key={campo.chave} className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-semibold uppercase">{campo.label}</h2>
              {campo.ajuda ? (
                <p className="mt-1 text-xs text-muted-foreground">{campo.ajuda}</p>
              ) : null}
              <div className="mt-3 space-y-3">
                {itens.map((item, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-2">
                    {subCampos.map((sub) => (
                      <div key={sub.chave}>
                        <Label>{`${sub.label} ${i + 1}`}</Label>
                        <Input
                          value={item[sub.chave] ?? ""}
                          onChange={(e) => {
                            const copia = itens.map((x) => ({ ...x }));
                            copia[i]![sub.chave] = e.target.value;
                            onChange(campo.chave, copia as unknown as JsonValor);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (campo.tipo === "imagem") {
          return (
            <CampoImagem
              key={campo.chave}
              campo={campo}
              valor={typeof valor === "string" ? valor : ""}
              onChange={(v) => onChange(campo.chave, v)}
              baseArquivo={baseArquivo}
            />
          );
        }

        if (campo.tipo === "rich") {
          return (
            <div key={campo.chave}>
              <Label>{campo.label}</Label>
              {campo.ajuda ? (
                <p className="mb-1 text-xs text-muted-foreground">{campo.ajuda}</p>
              ) : null}
              <RichTextEditor
                valor={typeof valor === "string" ? valor : ""}
                onChange={(html) => onChange(campo.chave, html)}
                baseArquivo={baseArquivo}
                minAltura="16rem"
              />
            </div>
          );
        }

        if (campo.tipo === "textarea") {
          return (
            <div key={campo.chave}>
              <Label htmlFor={campo.chave}>{campo.label}</Label>
              <Textarea
                id={campo.chave}
                rows={3}
                value={typeof valor === "string" ? valor : ""}
                onChange={(e) => onChange(campo.chave, e.target.value)}
              />
            </div>
          );
        }

        return (
          <div key={campo.chave}>
            <Label htmlFor={campo.chave}>{campo.label}</Label>
            <Input
              id={campo.chave}
              value={typeof valor === "string" ? valor : ""}
              onChange={(e) => onChange(campo.chave, e.target.value)}
            />
          </div>
        );
      })}
    </>
  );
}
