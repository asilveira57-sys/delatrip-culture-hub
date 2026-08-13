import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AVISO_SANITARIO } from "@/config/site";
import { absoluteUrl, canonical } from "@/lib/seo";

export const Route = createFileRoute("/conteudo/tabaco")({
  head: () => ({
    meta: [
      { title: "Tabaco: guia informativo sobre a planta e seus processos | DeLaTrip" },
      {
        name: "description",
        content:
          "Conteúdo informativo sobre Nicotiana tabacum: tipos de folha, processos de cura, formatos no mercado brasileiro, classificação legal e glossário. Sem venda de produtos derivados do tabaco.",
      },
      {
        property: "og:title",
        content: "Tabaco: guia informativo sobre a planta e seus processos | DeLaTrip",
      },
      {
        property: "og:description",
        content:
          "Página-pilar informativa sobre tabaco: folhas, curas, formatos, classificação legal e glossário.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: absoluteUrl("/conteudo/tabaco") },
    ],
    links: [canonical("/conteudo/tabaco")],
  }),
  component: ConteudoTabacoPage,
});

const secoes = [
  { id: "o-que-e", label: "1. O que é tabaco" },
  { id: "tipos-de-folha", label: "2. Tipos de folha" },
  { id: "curas", label: "3. Processos de cura" },
  { id: "formatos", label: "4. Formatos no mercado brasileiro" },
  { id: "classificacao", label: "5. Classificação no Brasil" },
  { id: "glossario", label: "6. Glossário" },
];

const folhas = [
  {
    nome: "Virginia",
    texto:
      "Também chamada de bright leaf. Curada em estufa com ar quente (flue-cured), preserva boa parte do açúcar convertido a partir do amido durante o processo. Folha amarelo-alaranjada, de acidez mais alta e perfil descrito como leve e levemente adocicado. É a variedade mais cultivada no mundo e a base da produção do sul do Brasil.",
  },
  {
    nome: "Burley",
    texto:
      "Mutação de folha clara estabilizada nos Estados Unidos no século XIX. Curada ao ar por semanas, consome quase todo o açúcar próprio e resulta em folha marrom-clara, seca, de perfil terroso e amadeirado. Estrutura porosa: absorve aromatizantes e umectantes em quantidade muito maior que a Virginia.",
  },
  {
    nome: "Oriental",
    texto:
      "Grupo de variedades de folha pequena cultivadas em solos pobres da Turquia, Grécia, Bulgária e região. Curadas ao sol, concentram óleos essenciais e apresentam perfil condimentado e resinoso. Entram em blends em proporções pequenas. Izmir, Samsun, Basma e Katerini são denominações comuns.",
  },
  {
    nome: "Kentucky",
    texto:
      "Folha curada por defumação (fire-cured), com fogueiras de madeira dura queimando lentamente no galpão durante parte do ciclo. Absorve compostos fenólicos da fumaça e resulta em folha escura, de aroma intenso e notas descritas como defumadas e resinosas.",
  },
  {
    nome: "Perique",
    texto:
      "Produzido em área restrita da Louisiana. Folhas curadas ao ar são prensadas em barris sob pressão contínua e fermentam no próprio suco, em ambiente anaeróbico, por cerca de um ano. Folha quase preta, muito concentrada, usada historicamente como condimento em proporções mínimas.",
  },
  {
    nome: "Cavendish",
    texto:
      "Não é uma varietal. É um processo de prensagem com calor e vapor aplicado a folhas já curadas — normalmente Virginia ou Burley —, às vezes com umectantes. Escurece a folha e suaviza o perfil. Um Black Cavendish pode ter origem em qualquer dessas folhas.",
  },
];

const curas = [
  {
    nome: "Flue-cured (estufa)",
    texto:
      "Ar aquecido circula por dutos metálicos em estufa fechada, sem contato entre folha e fumaça. O ciclo dura de cinco a sete dias, com temperatura crescente de cerca de 35 °C a mais de 70 °C. Muda: cor amarela a laranja, açúcar residual alto, pH mais ácido, aroma limpo.",
  },
  {
    nome: "Air-cured (ao ar)",
    texto:
      "Sem fonte de calor. Folhas secam em galpões ventilados por quatro a oito semanas, com o produtor regulando janelas conforme a umidade. As enzimas seguem ativas e consomem o açúcar. Muda: cor marrom-clara, açúcar próximo de zero, pH mais alcalino, maior porosidade e absorção.",
  },
  {
    nome: "Fire-cured (defumação)",
    texto:
      "Variação da cura ao ar com fogueiras de madeira dura no piso do galpão por três a dez semanas. A folha absorve compostos fenólicos da fumaça. Muda: cor bem escura, aroma defumado marcante, açúcar baixo.",
  },
  {
    nome: "Sun-cured (ao sol)",
    texto:
      "Folhas enfileiradas ao ar livre secam sob radiação solar direta em cinco a quinze dias. Rápido o bastante para reter parte do açúcar, sem o controle preciso de uma estufa. Muda: cor dourada, açúcar moderado, alta concentração de óleos aromáticos.",
  },
  {
    nome: "Fermentação",
    texto:
      "Etapa posterior à cura. Folhas úmidas empilhadas em pilones elevam a temperatura interna acima de 50 °C; reações prolongadas degradam amônia, nitratos e compostos ásperos. A pilha é desmanchada e remontada várias vezes. Em folhas de charuto pode durar meses ou anos. Muda: cor mais escura, acidez reduzida, aspereza menor.",
  },
];

const formatos = [
  {
    nome: "RYO (roll your own)",
    texto:
      "Fumo picado destinado a ser enrolado manualmente em papel. Contém nicotina e é produto derivado do tabaco.",
  },
  {
    nome: "Tabaco natural",
    texto:
      "Designação comercial para fumo com pouco ou nenhum aditivo aromatizante declarado. Continua sendo folha de Nicotiana tabacum, com nicotina, e continua sendo produto derivado do tabaco. A palavra natural não indica menor risco.",
  },
  {
    nome: "Tabaco orgânico",
    texto:
      "Refere-se ao sistema agrícola de cultivo da folha, sem insumos sintéticos. Diz respeito à lavoura, não ao produto final: o teor de nicotina e a natureza fumígena permanecem.",
  },
  {
    nome: "Cigarro de palha",
    texto:
      "Formato tradicional brasileiro em que o fumo é envolto em palha de milho tratada em vez de papel. Produto derivado do tabaco.",
  },
  {
    nome: "Fumo para cachimbo",
    texto:
      "Blends de folhas curadas por métodos distintos, frequentemente combinando Virginia, Burley, Orientais e folhas prensadas. Produto derivado do tabaco.",
  },
  {
    nome: "Charuto",
    texto:
      "Folha inteira fermentada, dividida em capa, capote e tripa. Produzido sem papel. Produto derivado do tabaco.",
  },
  {
    nome: "Blend de ervas sem tabaco",
    texto:
      "Mistura de material vegetal seco — camomila, hortelã, hibisco, lavanda, verbasco, pétalas de rosa — sem folha de tabaco e, portanto, sem nicotina. Não é produto derivado do tabaco e responde a outra moldura regulatória. Ausência de nicotina não significa ausência de risco: a combustão de qualquer material vegetal gera monóxido de carbono e material particulado.",
  },
];

const glossario = [
  {
    termo: "Blend",
    texto:
      "Mistura de folhas de origens ou curas diferentes, combinadas em proporções definidas para obter um perfil consistente entre lotes. O termo também é usado, em outro sentido, para misturas de ervas sem tabaco.",
  },
  {
    termo: "RYO",
    texto:
      "Sigla de roll your own. Designa o fumo picado vendido a granel para ser enrolado manualmente, por oposição ao cigarro industrializado pronto.",
  },
  {
    termo: "Cura",
    texto:
      "Conjunto de processos aplicados à folha recém-colhida para desidratá-la de forma controlada e estabilizar sua composição química. Determina cor, teor de açúcar, pH e perfil aromático.",
  },
  {
    termo: "Corte",
    texto:
      "Formato em que a folha é fatiada. Ribbon cut é o corte em tiras finas; flake é a folha prensada e fatiada em lâminas; shag é o corte extrafino; plug é o bloco prensado inteiro, fatiado pelo usuário. O corte altera a densidade e a velocidade de queima.",
  },
  {
    termo: "Umidificação",
    texto:
      "Controle do teor de água do material armazenado. Umidade excessiva favorece mofo; umidade insuficiente torna a folha quebradiça. Umidificadores e recipientes hermeticamente fechados são usados para manter faixas estáveis.",
  },
  {
    termo: "Palha de milho",
    texto:
      "Folha externa seca da espiga de milho, tratada e cortada em retângulos. É o invólucro tradicional do cigarro de palha brasileiro, alternativa ao papel.",
  },
  {
    termo: "Filtro de acetato",
    texto:
      "Feito de fibras de acetato de celulose prensadas. É o tipo mais comum na indústria. Retém parte do material particulado, mas não elimina os compostos nocivos da fumaça nem reduz o risco associado ao consumo.",
  },
  {
    termo: "Filtro de carvão",
    texto:
      "Combina fibras com grânulos de carvão ativado. O carvão adsorve parte de compostos voláteis. Também não torna o consumo seguro nem de menor risco.",
  },
  {
    termo: "Filtro de celulose",
    texto:
      "Tira de papel ou cartão enrolada, também chamada de piteira de papel. Funciona sobretudo como suporte estrutural na ponta, sem função de filtragem relevante.",
  },
];

const postsRelacionados = [
  {
    slug: "virginia-burley-oriental-o-que-muda",
    titulo: "Virginia, Burley e Oriental: o que muda entre as folhas",
  },
  {
    slug: "cura-do-tabaco-processos",
    titulo: "Cura do tabaco: por que a mesma folha vira produtos diferentes",
  },
  {
    slug: "blends-de-ervas-sem-nicotina",
    titulo: "Blends de ervas sem nicotina: o que são e o que não são",
  },
  {
    slug: "legislacao-brasileira-produtos-fumigenos",
    titulo: "O que a legislação brasileira diz sobre produtos fumígenos",
  },
];

function ConteudoTabacoPage() {
  return (
    <>
      <PageHeader
        eyebrow="Conteúdo informativo"
        titulo="Tabaco"
        descricao="Guia enciclopédico sobre a planta, suas folhas, seus processos e sua classificação legal no Brasil. Esta página não oferece produtos à venda."
        crumbs={[{ label: "Conteúdo" }, { label: "Tabaco" }]}
      />

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-lg border border-gold/50 bg-gold/10 p-6">
          <h2 className="eyebrow text-gold-foreground">Advertência sanitária</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {AVISO_SANITARIO}
          </p>
        </div>

        <div className="mt-10 gap-10 lg:flex">
          <aside className="lg:w-60 lg:shrink-0">
            <nav
              aria-label="Índice da página"
              className="rounded-lg border border-border bg-card p-5 lg:sticky lg:top-24"
            >
              <h2 className="eyebrow text-muted-foreground">Nesta página</h2>
              <ul className="mt-3 space-y-2">
                {secoes.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div className="mt-10 min-w-0 flex-1 lg:mt-0">
            <section id="o-que-e" className="scroll-mt-24">
              <h2 className="text-2xl font-bold uppercase">1. O que é tabaco</h2>
              <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
                <p>
                  Tabaco é o nome dado à folha processada de plantas do gênero
                  Nicotiana, da família das solanáceas — a mesma do tomate, da batata
                  e da berinjela. A espécie de importância comercial é a Nicotiana
                  tabacum; a Nicotiana rustica, mais rústica e de teor de nicotina
                  bem mais alto, tem uso restrito e regional.
                </p>
                <p>
                  A planta é originária das Américas. Registros arqueológicos e
                  botânicos situam sua domesticação na região andina, provavelmente
                  entre a Bolívia e o norte da Argentina, há milhares de anos, com
                  posterior difusão por povos indígenas de quase todo o continente.
                  Entre esses povos, o uso estava associado a contextos rituais,
                  medicinais e cerimoniais, e não a consumo cotidiano em larga escala.
                </p>
                <p>
                  A partir do século XVI, a planta foi levada à Europa e, em poucas
                  décadas, difundiu-se pela Ásia e África. No Brasil colonial, o
                  cultivo se estabeleceu cedo, sobretudo no Recôncavo Baiano, onde o
                  fumo em rolo — folha torcida em corda e recoberta com melaço — se
                  tornou mercadoria de exportação e moeda de troca no comércio
                  atlântico. A partir do século XX, a produção deslocou-se para o sul
                  do país. Rio Grande do Sul, Santa Catarina e Paraná concentram hoje
                  a maior parte da lavoura brasileira, organizada em sistema de
                  produção integrada com pequenas propriedades familiares.
                </p>
                <p>
                  A folha contém nicotina, um alcaloide produzido nas raízes e
                  transportado para as folhas, onde funciona como defesa natural
                  contra insetos. A nicotina é a substância responsável pela
                  dependência associada ao consumo de produtos derivados do tabaco.
                </p>
              </div>
            </section>

            <section id="tipos-de-folha" className="mt-14 scroll-mt-24">
              <h2 className="text-2xl font-bold uppercase">2. Tipos de folha</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                As designações comerciais abaixo não correspondem a espécies
                distintas. Todas partem da Nicotiana tabacum: o que as diferencia é a
                variedade cultivada, o ambiente de cultivo e, principalmente, o
                método de cura aplicado após a colheita.
              </p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {folhas.map((f) => (
                  <article
                    key={f.nome}
                    className="rounded-lg border border-border bg-card p-6"
                  >
                    <h3 className="text-lg font-semibold uppercase">{f.nome}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {f.texto}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section id="curas" className="mt-14 scroll-mt-24">
              <h2 className="text-2xl font-bold uppercase">3. Processos de cura</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Curar é conduzir de forma controlada dois processos que competem
                entre si: a desidratação da folha e a atividade enzimática que ainda
                ocorre dentro dela. Secagem rápida fixa o açúcar formado a partir do
                amido; secagem lenta permite que as enzimas consumam esse açúcar. Daí
                as diferenças de cor, doçura, pH e aroma.
              </p>
              <dl className="mt-6 space-y-4">
                {curas.map((c) => (
                  <div
                    key={c.nome}
                    className="rounded-lg border border-border bg-card p-6"
                  >
                    <dt className="text-lg font-semibold uppercase">{c.nome}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {c.texto}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section id="formatos" className="mt-14 scroll-mt-24">
              <h2 className="text-2xl font-bold uppercase">
                4. Formatos no mercado brasileiro
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Os formatos abaixo são descritos apenas para fins informativos. Com
                exceção dos blends de ervas sem tabaco, todos são produtos fumígenos
                derivados do tabaco, contêm nicotina e não são comercializados pela
                DeLaTrip.
              </p>
              <dl className="mt-6 space-y-4">
                {formatos.map((f) => (
                  <div
                    key={f.nome}
                    className="rounded-lg border border-border bg-card p-6"
                  >
                    <dt className="text-lg font-semibold uppercase">{f.nome}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {f.texto}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section id="classificacao" className="mt-14 scroll-mt-24">
              <h2 className="text-2xl font-bold uppercase">
                5. Como o tabaco é classificado no Brasil
              </h2>
              <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
                <p>
                  No arcabouço regulatório brasileiro, o tabaco destinado ao consumo
                  humano é tratado como produto fumígeno derivado do tabaco: aquele
                  elaborado total ou parcialmente com folha de tabaco como
                  matéria-prima, destinado a ser fumado, sugado, mascado, aspirado ou
                  utilizado por via oral ou nasal.
                </p>
                <p>
                  A definição é ampla em três sentidos. A proporção de tabaco não
                  importa: um produto majoritariamente composto de melaço e
                  umectantes, como o fumo para narguilé, continua sendo derivado do
                  tabaco. A via de consumo não se limita à combustão: produtos orais
                  e nasais estão incluídos. E a designação comercial não altera o
                  enquadramento: natural e orgânico descrevem cultivo ou aditivos, não
                  a natureza do produto.
                </p>
                <p>
                  A norma de base é a Lei nº 9.294/1996, que restringe severamente a
                  propaganda desses produtos, veda seu uso em recintos coletivos
                  fechados, proíbe a venda a menores de 18 anos e determina
                  advertências sanitárias nas embalagens. A Agência Nacional de
                  Vigilância Sanitária detalha esses requisitos por resolução —
                  composição, aditivos, rotulagem e teores.
                </p>
                <p>
                  Para o comércio eletrônico, a norma decisiva é a RDC ANVISA nº
                  558/2021, que proíbe a comercialização de produtos derivados do
                  tabaco pela internet. É por essa razão que o catálogo on-line da
                  DeLaTrip reúne apenas produtos que não contêm tabaco — acessórios,
                  papéis, artigos de vidro, dichavadores, bandejas, isqueiros,
                  vestuário e blends de ervas sem nicotina — e trata o tema tabaco
                  exclusivamente como conteúdo informativo, sem oferta, preço ou
                  disponibilidade.
                </p>
                <p>
                  Dispositivos eletrônicos para fumar seguem regra ainda mais
                  restritiva: a RDC ANVISA nº 855/2024 mantém proibidas sua
                  comercialização, importação e propaganda no país.
                </p>
              </div>
            </section>

            <section id="glossario" className="mt-14 scroll-mt-24">
              <h2 className="text-2xl font-bold uppercase">6. Glossário</h2>
              <Accordion type="single" collapsible className="mt-4">
                {glossario.map((g) => (
                  <AccordionItem key={g.termo} value={g.termo}>
                    <AccordionTrigger className="text-left">{g.termo}</AccordionTrigger>
                    <AccordionContent className="leading-relaxed text-muted-foreground">
                      {g.texto}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            <section className="mt-14">
              <h2 className="text-2xl font-bold uppercase">Leia também</h2>
              <ul className="mt-4 space-y-3">
                {postsRelacionados.map((p) => (
                  <li key={p.slug}>
                    <Link
                      to="/blog/$slug"
                      params={{ slug: p.slug }}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {p.titulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
