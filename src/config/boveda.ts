/**
 * Correções manuais para SKUs Boveda cujo nome não permite extrair
 * tamanho (Size), % de umidade ou unidades por embalagem. Tem prioridade
 * sobre a leitura automática do nome do produto.
 */
export const BOVEDA_OVERRIDES: Record<string, { tamanho: number; ur: number; unidades: number }> = {
  "umidificador-boveda-62-sache-8g": { tamanho: 8, ur: 62, unidades: 5 },
};

export const BOVEDA_MARCA_SLUG = "boveda";
