import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ETAPAS, LINHAS, NIVEIS, ROTULO } from "@/config/guia-perfis";
import { classificarPerfis } from "@/lib/guia.functions";
import { definirGuiaEmLote, obterOverlayAdmin, type PatchGuia } from "@/lib/produtos-admin";

const NENHUM = "__nenhum";

export function GuiaPerfilEditor({ slug }: { slug: string }) {
  const qc = useQueryClient();
  const classificar = useServerFn(classificarPerfis);
  const { data: ov } = useQuery({
    queryKey: ["admin", "guia-perfil", slug],
    queryFn: () => obterOverlayAdmin(slug),
  });
  const atualizar = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "guia-perfil", slug] });
    void qc.invalidateQueries({ queryKey: ["admin", "overlays"] });
  };

  const salvar = useMutation({
    mutationFn: (patch: PatchGuia) => definirGuiaEmLote([slug], patch),
    onSuccess: atualizar,
    onError: () => toast.error("Não foi possível salvar o perfil."),
  });

  const automatico = useMutation({
    mutationFn: async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase
        .from("produto_overlay")
        .upsert({ slug, linha_manual: false, perfil_manual: false }, { onConflict: "slug" });
      if (error) throw error;
      await classificar({ data: { slugs: [slug] } });
    },
    onSuccess: () => {
      toast.success("Perfil reclassificado automaticamente.");
      atualizar();
    },
    onError: () => toast.error("Não foi possível reclassificar."),
  });

  const campo = (
    rotulo: string,
    chave: "nivel" | "linha" | "etapa",
    opcoes: string[],
  ) => (
    <div className="space-y-1">
      <Label className="text-xs">{rotulo}</Label>
      <Select
        value={ov?.[chave] ?? NENHUM}
        onValueChange={(v) => salvar.mutate({ [chave]: v === NENHUM ? null : v })}
      >
        <SelectTrigger className="h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NENHUM}>Sem classificação</SelectItem>
          {opcoes.map((o) => (
            <SelectItem key={o} value={o}>
              {ROTULO[o] ?? o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="rounded-lg border border-border bg-card p-4 text-sm">
      <h2 className="text-sm font-semibold">Perfil no guia</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {ov?.linha_manual || ov?.perfil_manual
          ? `Manual: ${[ov?.linha_manual && "linha", ov?.perfil_manual && "nível/etapa"].filter(Boolean).join(" e ")}`
          : "Automático"}
      </p>
      <div className="mt-3 space-y-3">
        {campo("Nível", "nivel", NIVEIS)}
        {campo("Linha", "linha", LINHAS)}
        {campo("Etapa", "etapa", ETAPAS)}
        <div className="flex items-center justify-between">
          <Label htmlFor="fora-guia" className="text-xs">
            Fora do guia
          </Label>
          <Switch
            id="fora-guia"
            checked={!!ov?.fora_do_guia}
            onCheckedChange={(v) => salvar.mutate({ fora_do_guia: v })}
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          disabled={automatico.isPending}
          onClick={() => automatico.mutate()}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          {automatico.isPending ? "Reclassificando…" : "Voltar ao automático"}
        </Button>
      </div>
    </div>
  );
}
