import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RelacionadosGlobal } from "@/components/admin/RelacionadosGlobal";
import { carregarConfigAdmin, salvarConfigAdmin } from "@/lib/portal-admin";

import type { PortalConfig } from "@/lib/portal-core";
import { PORTAL_CONFIG_PADRAO } from "@/lib/portal-defaults";

export const Route = createFileRoute("/admin/_gate/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ConfiguracoesPage,
});

function Campo({
  label,
  valor,
  onChange,
  ajuda,
}: {
  label: string;
  valor: string;
  onChange: (v: string) => void;
  ajuda?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={valor} onChange={(e) => onChange(e.target.value)} />
      {ajuda ? <p className="text-xs text-muted-foreground">{ajuda}</p> : null}
    </div>
  );
}

function ConfiguracoesPage() {
  const [config, setConfig] = useState<PortalConfig>(PORTAL_CONFIG_PADRAO);
  const [salvando, setSalvando] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "portal-config"],
    queryFn: carregarConfigAdmin,
    retry: false,
  });

  useEffect(() => {
    if (data) setConfig(data);
  }, [data]);

  function atualizar<K extends keyof PortalConfig>(
    grupo: K,
    campo: keyof PortalConfig[K],
    valor: string,
  ) {
    setConfig((atual) => ({
      ...atual,
      [grupo]: { ...atual[grupo], [campo]: valor },
    }));
  }

  async function salvar() {
    setSalvando(true);
    try {
      await salvarConfigAdmin(config);
      toast.success("Configurações salvas.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Configurações do portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dados usados no rodapé, nas páginas legais e nos dados estruturados.
          </p>
        </div>
        <Button onClick={() => void salvar()} disabled={salvando}>
          <Save className="size-4" /> {salvando ? "Salvando…" : "Salvar"}
        </Button>
      </div>

      <Tabs defaultValue="empresa" className="mt-6">
        <TabsList>
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="redes">Redes sociais</TabsTrigger>
          <TabsTrigger value="seo">SEO padrão</TabsTrigger>
          <TabsTrigger value="lgpd">LGPD</TabsTrigger>
          <TabsTrigger value="relacionados">Relacionados</TabsTrigger>
        </TabsList>


        <TabsContent value="empresa" className="mt-4 space-y-4">
          <Campo
            label="Razão social"
            valor={config.empresa.razaoSocial}
            onChange={(v) => atualizar("empresa", "razaoSocial", v)}
          />
          <Campo
            label="CNPJ"
            valor={config.empresa.cnpj}
            onChange={(v) => atualizar("empresa", "cnpj", v)}
          />
          <Campo
            label="Telefone"
            valor={config.empresa.telefone}
            onChange={(v) => atualizar("empresa", "telefone", v)}
          />
          <Campo
            label="WhatsApp"
            valor={config.empresa.whatsapp}
            ajuda="Formato internacional, ex.: +5521972462459"
            onChange={(v) => atualizar("empresa", "whatsapp", v)}
          />
          <Campo
            label="E-mail"
            valor={config.empresa.email}
            onChange={(v) => atualizar("empresa", "email", v)}
          />
          <Campo
            label="Horário de atendimento"
            valor={config.empresa.horario}
            onChange={(v) => atualizar("empresa", "horario", v)}
          />
          <Campo
            label="Endereço"
            valor={config.empresa.endereco}
            onChange={(v) => atualizar("empresa", "endereco", v)}
          />
        </TabsContent>

        <TabsContent value="redes" className="mt-4 space-y-4">
          {(
            [
              ["instagram", "Instagram"],
              ["youtube", "YouTube"],
              ["spotify", "Spotify"],
              ["facebook", "Facebook"],
              ["tiktok", "TikTok"],
              ["outra", "Outra rede"],
            ] as const
          ).map(([chave, label]) => (
            <Campo
              key={chave}
              label={label}
              valor={config.redes[chave]}
              onChange={(v) => atualizar("redes", chave, v)}
            />
          ))}
        </TabsContent>

        <TabsContent value="seo" className="mt-4 space-y-4">
          <Campo
            label="Título padrão"
            valor={config.seoPadrao.titulo}
            onChange={(v) => atualizar("seoPadrao", "titulo", v)}
          />
          <div className="space-y-1.5">
            <Label>Descrição padrão</Label>
            <Textarea
              rows={3}
              value={config.seoPadrao.descricao}
              onChange={(e) => atualizar("seoPadrao", "descricao", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {config.seoPadrao.descricao.length} caracteres (ideal até 160)
            </p>
          </div>
          <Campo
            label="Imagem Open Graph padrão (URL)"
            valor={config.seoPadrao.ogImagem}
            onChange={(v) => atualizar("seoPadrao", "ogImagem", v)}
          />
        </TabsContent>

        <TabsContent value="lgpd" className="mt-4 space-y-4">
          <Campo
            label="E-mail do responsável pelos dados"
            valor={config.lgpd.emailResponsavel}
            onChange={(v) => atualizar("lgpd", "emailResponsavel", v)}
          />
          <Campo
            label="Versão da política"
            valor={config.lgpd.versaoPolitica}
            onChange={(v) => atualizar("lgpd", "versaoPolitica", v)}
          />
          <Campo
            label="Atualizada em"
            valor={config.lgpd.atualizadoEm}
            ajuda="Ex.: 22/08/2026"
            onChange={(v) => atualizar("lgpd", "atualizadoEm", v)}
          />
        </TabsContent>

        <TabsContent value="relacionados" className="mt-4">
          <RelacionadosGlobal />
        </TabsContent>
      </Tabs>

    </div>
  );
}
