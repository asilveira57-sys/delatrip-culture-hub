import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import type {
  DocumentoLegal,
  PortalConfig,
} from "@/lib/portal-core";
import {
  gravarConsentimento,
  gravarContato,
  gravarLgpd,
  hashIp,
  ipDaRequisicao,
  lerConfigPortal,
  lerDocumento,
} from "@/lib/portal.server";

export const carregarConfigPortal = createServerFn({ method: "GET" }).handler(
  async (): Promise<PortalConfig> => lerConfigPortal(),
);

export const carregarDocumentoLegal = createServerFn({ method: "GET" })
  .inputValidator((entrada: { chave: string }) => entrada)
  .handler(async ({ data }): Promise<DocumentoLegal | null> => lerDocumento(data.chave));

export const enviarContato = createServerFn({ method: "POST" })
  .inputValidator((entrada: unknown) => entrada)
  .handler(async ({ data }) => {
    const ipHash = await hashIp(ipDaRequisicao(getRequest().headers));
    return gravarContato(data, ipHash);
  });

export const enviarSolicitacaoLgpd = createServerFn({ method: "POST" })
  .inputValidator((entrada: unknown) => entrada)
  .handler(async ({ data }) => {
    const ipHash = await hashIp(ipDaRequisicao(getRequest().headers));
    return gravarLgpd(data, ipHash);
  });

export const registrarConsentimento = createServerFn({ method: "POST" })
  .inputValidator(
    (entrada: { anonId: string; versao: string; categorias: Record<string, boolean> }) =>
      entrada,
  )
  .handler(async ({ data }) =>
    gravarConsentimento(data.anonId, data.versao, data.categorias),
  );
