/**
 * Mapa padrão do "Guia para iniciantes" (etapa + nível).
 * Chaves: "raiz/subcategoria" (casamento pela folha, subindo na hierarquia)
 * ou apenas "raiz" (vale para a categoria inteira).
 */
export type Etapa = "essencial" | "conveniencia" | "personalizacao" | "premium";
export type Nivel = "explorador" | "familiarizado" | "entusiasta" | "especialista";
export type Linha = "entrada" | "normal" | "premium";

export const NIVEIS: Nivel[] = ["explorador", "familiarizado", "entusiasta", "especialista"];

/** Valor especial do nível: o produto serve para qualquer perfil. */
export const NIVEL_TODOS = "todos";
export const NIVEIS_EDITAVEIS: string[] = [...NIVEIS, NIVEL_TODOS];
/** Verdadeiro quando o nível do produto atende ao perfil pedido. */
export const nivelAtende = (nivelProduto: string | null | undefined, alvo: string) =>
  nivelProduto === alvo || nivelProduto === NIVEL_TODOS;

export const NIVEL_DA_ETAPA: Record<Etapa, Nivel> = {
  essencial: "explorador",
  conveniencia: "familiarizado",
  personalizacao: "entusiasta",
  premium: "especialista",
};

const grupo = (etapa: Etapa, chaves: string[]) =>
  Object.fromEntries(chaves.map((k) => [k, etapa])) as Record<string, Etapa>;

export const GUIA_PERFIS: Record<string, Etapa> = {
  ...grupo("essencial", [
    "sedas/king-size",
    "sedas/1-14",
    "piteirasfiltros",
    "piteirasfiltros/piteiras",
    "piteirasfiltros/filtros",
    "gas-isqueiro-macarico/isqueiro",
    "bandejas/plastico",
    "bandejas/metal",
    "dichavadores/plastico",
    "dichavadores/policarbonato",
    "dichavadores/polipropileno",
  ]),
  ...grupo("conveniencia", [
    "acessorios/cases",
    "acessorios/carteiras",
    "acessorios/lata-estojo",
    "acessorios/potes-reservatorio",
    "acessorios/zip-lock",
    "acessorios/maquina-de-enrolar",
    "acessorios/limpeza",
    "acessorios/tesoura",
    "acessorios/cinzeiros",
    "gas-isqueiro-macarico/gas",
    "gas-isqueiro-macarico/fluido",
  ]),
  ...grupo("personalizacao", [
    "sedas/cone",
    "sedas/com-piteira",
    "sedas/blunt",
    "sedas/single-wide",
    "sedas/rolos",
    "sedas/tamanhos-especiais",
    "dichavadores/aluminio",
    "dichavadores/metal",
    "dichavadores/fibra",
    "bandejas/madeira",
    "bandejas/bamboo",
    "bandejas/cristal",
    "acessorios/moco",
    "acessorios/cuia",
    "acessorios/chaveiro",
    "acessorios/anel",
    "acessorios/incenso",
    "acessorios/guarda-sol",
  ]),
  ...grupo("premium", [
    "sedas/vidro",
    "gas-isqueiro-macarico/macarico",
    "bong-pipes",
    "bandejas/inflavel",
    "bandejas/tampa-de-bandeja",
  ]),
};

/** Raízes que ficam fora do guia. Categorias restritas também ficam fora. */
export const RAIZES_FORA_DO_GUIA = new Set(["vestuario"]);

export const LINHAS: Linha[] = ["entrada", "normal", "premium"];
export const ETAPAS: Etapa[] = ["essencial", "conveniencia", "personalizacao", "premium"];

export const ROTULO: Record<string, string> = {
  explorador: "Explorador",
  familiarizado: "Familiarizado",
  entusiasta: "Entusiasta",
  especialista: "Especialista",
  todos: "Todos os perfis",
  entrada: "Entrada",
  normal: "Normal",
  premium: "Premium",
  essencial: "Essencial",
  conveniencia: "Conveniência",
  personalizacao: "Personalização",
};
