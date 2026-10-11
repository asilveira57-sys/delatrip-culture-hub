import { useEffect, useMemo, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CalendarPlus, ExternalLink, RotateCcw, Share2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { FaqSecao } from "@/components/FaqSecao";
import { PageHeader } from "@/components/PageHeader";
import { SHOW_PRICES } from "@/config/site";
import { BOVEDA_MARCA_SLUG } from "@/config/boveda";
import { formatPrice, imageFor, productsByBrand, type Product } from "@/lib/catalog";
import {
  RECIPIENTES,
  casarEstoque,
  gerarIcs,
  ideal,
  lerSku,
  precisaCapacidade,
  rotuloOpcao,
  type Clima,
  type Consumo,
  type Entrada,
  type ItemEstoque,
  type Local,
  type Preferencia,
} from "@/lib/boveda";
import { lerConsentimento } from "@/lib/consentimento";
import { absoluteUrl, canonical, jsonLd } from "@/lib/seo";

type Busca = {
  tipo?: "flores" | "charutos";
  g?: number;
  consumo?: Consumo;
  clima?: Clima;
  local?: Local;
  cap?: number;
  novo?: "sim" | "nao";
  pref?: Preferencia;
};

const um = <T extends string>(v: unknown, ok: readonly T[]) => (ok.includes(v as T) ? (v as T) : undefined);
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), 100000) : undefined;
};

const FAQ = [
  {
    pergunta: "O que é Boveda?",
    resposta:
      "É um pack de controle de umidade nos dois sentidos: ele libera ou absorve água para manter o recipiente sempre na mesma umidade relativa. Não é só um umidificador.",
  },
  {
    pergunta: "58% ou 62% para ervas e flores?",
    resposta:
      "58% deixa a flor um pouco mais seca, bom para quem enrola. 62% deixa mais macia, bom para clima seco, altitude ou quem não tem preferência.",
  },
  {
    pergunta: "Qual % usar em humidor de madeira?",
    resposta:
      "O padrão é 72%, porque a madeira absorve parte da umidade. Quem prefere mais seco usa 65%; em clima muito seco, 75%.",
  },
  {
    pergunta: "O que é temperar o humidor?",
    resposta:
      "É preparar um humidor de madeira novo com packs de 84% por cerca de 14 dias, para a madeira absorver umidade. Depois troque pelos packs de guarda. O 84% nunca deve ser usado para guardar charutos.",
  },
  {
    pergunta: "Quando trocar o Boveda?",
    resposta:
      "Dura de 2 a 6 meses, conforme o recipiente e o ambiente. Se o pack estiver duro por inteiro, troque; se ainda estiver como gel firme, segue funcionando. Não molhe nem tente reidratar.",
  },
];

const TITULO = "Calculadora Boveda: qual umidificador usar para flores e charutos | Delatrip";
const DESCRICAO =
  "Descubra o tamanho, a quantidade e a % de umidade do Boveda ideal para ervas e flores, charutos, humidores e tabaco de cachimbo.";

export const Route = createFileRoute("/calculadora-boveda")({
  validateSearch: (s: Record<string, unknown>): Busca => ({
    tipo: um(s.tipo, ["flores", "charutos"] as const),
    g: num(s.g),
    consumo: um(s.consumo, ["enrolo", "outro"] as const),
    clima: um(s.clima, ["umido", "seco", "nao-sei"] as const),
    local: um(s.local, ["tubo", "hermetica", "madeira", "cooler", "cachimbo"] as const),
    cap: num(s.cap),
    novo: um(s.novo, ["sim", "nao"] as const),
    pref: um(s.pref, ["normal", "seco", "umido"] as const),
  }),
  head: () => ({
    meta: [
      { title: TITULO },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absoluteUrl("/calculadora-boveda") },
      { name: "twitter:card", content: "summary" },
    ],
    links: [canonical("/calculadora-boveda")],
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({
          "@type": "Question",
          name: f.pergunta,
          acceptedAnswer: { "@type": "Answer", text: f.resposta },
        })),
      }),
    ],
  }),
  component: CalculadoraBoveda,
});

/** Usa a camada de analytics já existente (GA4/dataLayer), só com consentimento. */
function evento(nome: string, dados: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !lerConsentimento()?.categorias.analise) return;
  const camada = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(camada)) camada.push({ event: `boveda_${nome}`, ...dados });
}

function entradaDe(b: Busca): Entrada | null {
  if (b.tipo === "flores") {
    if (!b.g || !b.consumo || !b.clima) return null;
    return { tipo: "flores", gramas: b.g, consumo: b.consumo, clima: b.clima };
  }
  if (b.tipo === "charutos" && b.local) {
    if (precisaCapacidade(b.local) && !b.cap) return null;
    if (b.local === "madeira" && !b.novo) return null;
    if (b.local !== "cachimbo" && !b.pref) return null;
    return {
      tipo: "charutos",
      local: b.local,
      capacidade: b.cap,
      gramas: b.local === "cachimbo" ? (b.g ?? 450) : undefined,
      novo: b.novo === "sim",
      preferencia: b.pref ?? "normal",
    };
  }
  return null;
}

type Passo =
  | { chave: "tipo" | "consumo" | "clima" | "local" | "novo" | "pref"; pergunta: string; opcoes: { valor: string; rotulo: string }[] }
  | { chave: "g" | "cap"; pergunta: string; numero: true };

function passosDe(b: Busca): Passo[] {
  const lista: Passo[] = [
    {
      chave: "tipo",
      pergunta: "O que você quer guardar?",
      opcoes: [
        { valor: "flores", rotulo: "Ervas e flores" },
        { valor: "charutos", rotulo: "Charutos e tabaco" },
      ],
    },
  ];
  if (b.tipo === "flores") {
    lista.push(
      { chave: "g", pergunta: "Quanto você vai guardar?", numero: true },
      {
        chave: "consumo",
        pergunta: "Como você costuma consumir?",
        opcoes: [
          { valor: "enrolo", rotulo: "Enrolo (joints / pré-rolls)" },
          { valor: "outro", rotulo: "Outro / não sei" },
        ],
      },
      {
        chave: "clima",
        pergunta: "Como é o clima onde você mora?",
        opcoes: [
          { valor: "umido", rotulo: "Úmido" },
          { valor: "seco", rotulo: "Seco ou altitude" },
          { valor: "nao-sei", rotulo: "Não sei" },
        ],
      },
    );
  }
  if (b.tipo === "charutos") {
    lista.push({
      chave: "local",
      pergunta: "Onde você guarda?",
      opcoes: [
        { valor: "tubo", rotulo: "Tubo / bolsa / estojo de viagem" },
        { valor: "hermetica", rotulo: "Bolsa umidora ou caixa hermética (acrílico, polímero)" },
        { valor: "madeira", rotulo: "Humidor de madeira" },
        { valor: "cooler", rotulo: "Cooler / tupperdor / wineador" },
        { valor: "cachimbo", rotulo: "Tabaco de cachimbo (pote)" },
      ],
    });
    if (b.local && precisaCapacidade(b.local))
      lista.push({ chave: "cap", pergunta: "Quantos charutos ele comporta?", numero: true });
    if (b.local === "cachimbo") lista.push({ chave: "g", pergunta: "Quantos gramas de tabaco?", numero: true });
    if (b.local === "madeira")
      lista.push({
        chave: "novo",
        pergunta: "O humidor é novo, nunca usado?",
        opcoes: [
          { valor: "sim", rotulo: "Sim, é novo" },
          { valor: "nao", rotulo: "Não, já está em uso" },
        ],
      });
    if (b.local && b.local !== "cachimbo")
      lista.push({
        chave: "pref",
        pergunta: "Qual a sua preferência?",
        opcoes: [
          { valor: "normal", rotulo: "Normal" },
          { valor: "seco", rotulo: "Mais seco" },
          { valor: "umido", rotulo: "Mais úmido / moro em clima muito seco" },
        ],
      });
  }
  return lista;
}

function CalculadoraBoveda() {
  const busca = Route.useSearch();
  const navigate = useNavigate({ from: "/calculadora-boveda" });
  const entrada = entradaDe(busca);

  const [maior, setMaior] = useState(false);
  const [iniciado, setIniciado] = useState(false);
  const [resp, setResp] = useState<Busca>({});
  const [passo, setPasso] = useState(0);

  const passos = passosDe(resp);

  function escolher(chave: keyof Busca, valor: string | number) {
    let novo: Busca = { ...resp, [chave]: valor };
    if (chave === "tipo") {
      novo = { tipo: valor as Busca["tipo"] };
      evento("tipo", { tipo: valor });
    }
    if (chave === "local") novo = { tipo: "charutos", local: valor as Local };
    setResp(novo);
    const lista = passosDe(novo);
    if (passo < lista.length - 1) setPasso(passo + 1);
    else {
      void navigate({ search: novo, hash: "resultado" });
      setIniciado(false);
    }
  }

  function refazer() {
    setResp({});
    setPasso(0);
    setIniciado(maior);
    void navigate({ search: {} });
  }

  return (
    <>
      <PageHeader
        eyebrow="Ferramenta"
        titulo="Calculadora Boveda"
        descricao="Responda poucas perguntas e descubra o tamanho, a quantidade e a % de umidade do Boveda ideal para o que você guarda."
        crumbs={[{ label: "Início", to: "/" }, { label: "Calculadora Boveda" }]}
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        {entrada && !iniciado ? (
          <Resultado entrada={entrada} busca={busca} onRefazer={refazer} />
        ) : !iniciado ? (
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              Poucas perguntas para indicar o Boveda certo, com o que temos em estoque.
            </p>
            <label className="mt-4 flex items-start gap-3 text-sm">
              <Checkbox checked={maior} onCheckedChange={(v) => setMaior(v === true)} className="mt-0.5" />
              <span>
                Confirmo que tenho 18 anos ou mais.{" "}
                <Link to="/maiores-de-18" className="text-primary underline">
                  Saiba mais
                </Link>
              </span>
            </label>
            <Button
              className="mt-5 min-h-11 w-full sm:w-auto"
              disabled={!maior}
              onClick={() => {
                evento("inicio");
                setIniciado(true);
              }}
            >
              Começar
            </Button>
          </div>
        ) : (
          <PassoWizard
            passo={passos[passo]!}
            indice={passo}
            total={passos.length}
            resp={resp}
            onVoltar={() => (passo > 0 ? setPasso(passo - 1) : setIniciado(false))}
            onEscolher={escolher}
          />
        )}

        <FaqSecao itens={FAQ} className="mt-12" />
      </div>
    </>
  );
}

function PassoWizard({
  passo,
  indice,
  total,
  resp,
  onVoltar,
  onEscolher,
}: {
  passo: Passo;
  indice: number;
  total: number;
  resp: Busca;
  onVoltar: () => void;
  onEscolher: (chave: keyof Busca, valor: string | number) => void;
}) {
  const [valor, setValor] = useState("");
  const [porRecipiente, setPorRecipiente] = useState(false);
  useEffect(() => {
    setValor("");
    setPorRecipiente(false);
  }, [passo.chave]);

  const flores = resp.tipo === "flores" && passo.chave === "g";
  const atalhos = flores ? [14, 28, 100, 450] : passo.chave === "cap" ? [25, 50, 75, 100, 150] : [];

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Passo {indice + 1} de {total}
        </span>
        <button type="button" onClick={onVoltar} className="flex min-h-11 items-center gap-1 hover:text-primary">
          <ArrowLeft className="size-3" /> Voltar
        </button>
      </div>
      <Progress value={((indice + 1) / total) * 100} className="mt-2" aria-label="Progresso da calculadora" />
      <h2 className="mt-6 text-xl font-semibold">{passo.pergunta}</h2>

      {"opcoes" in passo ? (
        <div className="mt-4 grid gap-3">
          {passo.opcoes.map((o) => (
            <Button
              key={o.valor}
              variant={resp[passo.chave] === o.valor ? "default" : "outline"}
              className="h-auto min-h-11 justify-start whitespace-normal py-3 text-left"
              onClick={() => onEscolher(passo.chave, o.valor)}
            >
              {o.rotulo}
            </Button>
          ))}
        </div>
      ) : porRecipiente ? (
        <div className="mt-4 grid gap-3">
          {RECIPIENTES.map((r) => (
            <Button
              key={r.valor}
              variant="outline"
              className="h-auto min-h-11 justify-start whitespace-normal py-3 text-left"
              onClick={() => onEscolher("g", r.gramas)}
            >
              {r.rotulo} <span className="ml-auto text-muted-foreground">~{r.gramas} g</span>
            </Button>
          ))}
          <button type="button" className="min-h-11 text-left text-sm text-primary underline" onClick={() => setPorRecipiente(false)}>
            Prefiro informar o peso
          </button>
        </div>
      ) : (
        <form
          className="mt-4"
          onSubmit={(ev) => {
            ev.preventDefault();
            const n = Number(valor);
            if (n > 0) onEscolher(passo.chave, Math.round(n));
          }}
        >
          {passo.chave === "cap" ? (
            <p className="mb-3 text-sm text-muted-foreground">
              Dica: conte quantos charutos ele comporta, não quantos tem hoje.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {atalhos.map((a) => (
              <Button key={a} type="button" variant="outline" className="min-h-11" onClick={() => onEscolher(passo.chave, a)}>
                {a}
                {passo.chave === "g" ? " g" : ""}
              </Button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder={passo.chave === "cap" ? "Nº de charutos" : "Gramas"}
              aria-label={passo.pergunta}
              className="min-h-11"
            />
            <Button type="submit" className="min-h-11" disabled={!(Number(valor) > 0)}>
              Continuar
            </Button>
          </div>
          {flores ? (
            <button type="button" className="mt-3 min-h-11 text-sm text-primary underline" onClick={() => setPorRecipiente(true)}>
              Não sei o peso
            </button>
          ) : null}
        </form>
      )}
    </div>
  );
}

function estoqueBoveda(): ItemEstoque<Product>[] {
  return productsByBrand(BOVEDA_MARCA_SLUG)
    .map((p) => lerSku(p))
    .filter((x): x is ItemEstoque<Product> => x !== null);
}

function Resultado({ entrada, busca, onRefazer }: { entrada: Entrada; busca: Busca; onRefazer: () => void }) {
  const r = useMemo(() => ideal(entrada), [entrada]);
  const casamento = useMemo(() => casarEstoque(entrada, r, estoqueBoveda()), [entrada, r]);
  const principal = r.opcoes.find((o) => o.destaque) ?? r.opcoes[0]!;
  const [troca, setTroca] = useState<Date | null>(null);

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    setTroca(d);
    evento("resultado", { tipo: entrada.tipo, ur: r.ur, tamanho: principal.tamanho, estoque: casamento.tipo });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(busca)]);

  function baixarIcs() {
    if (!troca) return;
    const ics = gerarIcs(
      troca,
      "Trocar o Boveda",
      `Hora de conferir o Boveda (${rotuloOpcao(principal)}). Se estiver duro por inteiro, troque. ${absoluteUrl("/calculadora-boveda")}`,
    );
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "trocar-boveda.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function compartilhar() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: "Minha recomendação Boveda", url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado.");
      }
    } catch {
      /* cancelado */
    }
  }

  const assunto = `Disponibilidade: ${rotuloOpcao(principal)}`;

  return (
    <section id="resultado" className="rounded-lg border border-border bg-card p-6" aria-live="polite">
      <p className="eyebrow text-primary">Sua recomendação</p>
      {r.opcoes.length > 1 ? (
        <h2 className="mt-2 text-2xl font-bold">
          {rotuloOpcao(r.opcoes[0]!)} <span className="text-muted-foreground">ou</span> {rotuloOpcao(r.opcoes[1]!)}
        </h2>
      ) : (
        <h2 className="mt-2 text-2xl font-bold">{rotuloOpcao(principal)}</h2>
      )}
      <p className="mt-2 text-sm text-muted-foreground">{r.motivo}</p>
      {r.opcoes.length > 1 ? (
        <p className="mt-1 text-sm">
          Indicado: <strong>{rotuloOpcao(principal)}</strong>
          {principal.tamanho === 320 ? " — menos packs para trocar em recipientes maiores." : "."}
        </p>
      ) : null}

      {r.temperagem ? (
        <div className="mt-6 rounded-md border border-gold/60 bg-gold/10 p-4 text-sm">
          <h3 className="font-semibold">Antes: tempere o humidor</h3>
          <p className="mt-1">
            Use <strong>{rotuloOpcao(r.temperagem)}</strong> por cerca de 14 dias. Depois, troque pelos packs de
            guarda indicados acima. O 84% nunca serve para guardar charutos.
          </p>
        </div>
      ) : null}

      <div className="mt-6">
        {casamento.tipo === "indisponivel" ? (
          <div className="rounded-md border border-border p-4">
            <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
              Indisponível no momento
            </span>
            <p className="mt-2 text-sm text-muted-foreground">
              Não temos esse Boveda em estoque agora. Fale com a gente para saber quando chega.
            </p>
            <Button asChild className="mt-3 min-h-11 w-full sm:w-auto">
              <Link to="/contato" search={{ assunto } as never} onClick={() => evento("consultar", { ur: principal.ur })}>
                Consultar disponibilidade
              </Link>
            </Button>
          </div>
        ) : (
          <ProdutoEstoque casamento={casamento} />
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-md bg-muted/50 p-4 text-sm">
          <h3 className="font-semibold">Quando trocar</h3>
          <p className="mt-1">
            Estimativa: <strong>{troca ? troca.toLocaleDateString("pt-BR") : "em ~90 dias"}</strong>. Dura de 2 a 6
            meses, conforme recipiente e ambiente.
          </p>
          <p className="mt-1 text-muted-foreground">
            Teste do toque: duro por inteiro, troque; ainda como gel firme, segue funcionando. Não molhe nem tente
            reidratar.
          </p>
          <Button variant="outline" size="sm" className="mt-3 min-h-11" onClick={baixarIcs} disabled={!troca}>
            <CalendarPlus aria-hidden="true" /> Adicionar lembrete ao calendário
          </Button>
        </div>
        <div className="rounded-md bg-muted/50 p-4 text-sm">
          <h3 className="font-semibold">Dica de armazenamento</h3>
          <p className="mt-1 text-muted-foreground">
            Guarde em local fresco (~18–21 °C), longe do sol e de fontes de calor. Calor somado à umidade favorece mofo
            e, nos charutos, o besouro do tabaco. A temperatura não altera o funcionamento do pack.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" className="min-h-11" onClick={onRefazer}>
          <RotateCcw aria-hidden="true" /> Refazer
        </Button>
        <Button variant="outline" className="min-h-11" onClick={compartilhar}>
          <Share2 aria-hidden="true" /> Compartilhar
        </Button>
      </div>
    </section>
  );
}

function ProdutoEstoque({ casamento }: { casamento: Exclude<ReturnType<typeof casarEstoque<Product>>, { tipo: "indisponivel" }> }) {
  const p = casamento.item.produto;
  const preco = p.precoPromocional ?? p.preco;
  return (
    <div className="rounded-md border border-border p-4">
      {casamento.tipo === "alternativa" ? (
        <p className="mb-3 text-sm">
          <strong>Alternativa em estoque:</strong> {rotuloOpcao(casamento.opcao)}.{" "}
          {casamento.urEquivalente
            ? `É uma % próxima da ideal (${casamento.opcao.ur}%), que também funciona bem. `
            : ""}
          Usar mais packs que o necessário não faz mal — o Boveda só trabalha menos.
        </p>
      ) : (
        <p className="mb-3 text-sm font-semibold">Temos em estoque:</p>
      )}
      <div className="flex gap-4">
        <img
          src={imageFor(p)}
          alt={p.nome}
          width={96}
          height={96}
          loading="lazy"
          className="size-24 shrink-0 rounded-md border border-border object-cover"
        />
        <div className="min-w-0">
          <Link to="/produto/$slug" params={{ slug: p.slug }} className="font-semibold hover:text-primary">
            {p.nome}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            {casamento.embalagens} embalagem{casamento.embalagens > 1 ? "s" : ""} ({casamento.item.unidades} unidade
            {casamento.item.unidades > 1 ? "s" : ""} cada)
          </p>
          {SHOW_PRICES && preco !== null ? <p className="mt-1 font-semibold text-primary">{formatPrice(preco)}</p> : null}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button asChild className="min-h-11">
          <a
            href={p.urlLoja ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => evento("comprar", { produto: p.slug })}
          >
            <ExternalLink aria-hidden="true" /> Comprar
          </a>
        </Button>
        {p.urlMercadoLivre ? (
          <Button asChild variant="marketplace" className="min-h-11">
            <a href={p.urlMercadoLivre} target="_blank" rel="noopener noreferrer" onClick={() => evento("comprar_ml", { produto: p.slug })}>
              <ShoppingBag aria-hidden="true" /> Mercado Livre
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
