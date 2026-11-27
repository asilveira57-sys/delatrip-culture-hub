/**
 * Guias de compra das categorias raiz do catálogo.
 *
 * Cada guia vira um bloco de conteúdo no fim da página da categoria (com FAQ e
 * JSON-LD de FAQPage) e substitui o título e a meta description genéricos.
 * O objetivo é dar à página de categoria texto próprio, útil e citável por
 * buscadores e assistentes de IA, em vez de só uma lista de produtos.
 *
 * Regras de escrita: linguagem neutra ("ervas", "tabaco"), sem promessa de
 * saúde ("menos prejudicial" etc.) e sem números que não dê para sustentar.
 */

export type SecaoGuia = {
  titulo: string;
  /** Parágrafos corridos. */
  paragrafos?: string[];
  /** Lista de termo + explicação (vira <dl>). */
  itens?: { termo: string; descricao: string }[];
};

export type GuiaCategoria = {
  /** <title> da página da categoria. */
  tituloSeo: string;
  /** Meta description (até ~155 caracteres). */
  metaDescricao: string;
  /** Título do bloco de guia (H2). */
  titulo: string;
  /** Parágrafo de abertura: responde direto à dúvida principal. */
  resumo: string;
  secoes: SecaoGuia[];
  faq: { pergunta: string; resposta: string }[];
  /** Links internos de aprofundamento. */
  leiaTambem?: { rotulo: string; href: string }[];
};

export const CATEGORY_GUIDES: Record<string, GuiaCategoria> = {
  sedas: {
    tituloSeo: "Sedas: tamanhos, materiais e marcas | DeLaTrip",
    metaDescricao:
      "Guia de sedas: diferença entre king size, 1¼ e slim, papel branco, brown, arroz e cânhamo, cones e blunts. Compare marcas como RAW, OCB e Bem Bolado.",
    titulo: "Como escolher a seda certa",
    resumo:
      "A escolha da seda passa por três decisões: o tamanho (quanto material cabe), o material do papel (sabor e velocidade da queima) e o formato (folha, rolo, cone ou blunt). Para quem está começando, uma seda 1¼ ou king size slim de papel não branqueado é o ponto de partida mais fácil.",
    secoes: [
      {
        titulo: "Tamanhos",
        itens: [
          {
            termo: "Single wide",
            descricao:
              "A folha mais curta e estreita, com cerca de 70 mm. Boa para quem enrola pouco material ou quer algo discreto.",
          },
          {
            termo: "1¼ (um e um quarto)",
            descricao:
              "Um pouco maior que a single wide, por volta de 78 mm. É o tamanho mais versátil e o mais fácil de aprender a enrolar.",
          },
          {
            termo: "King size",
            descricao:
              "A folha longa, com cerca de 110 mm. Comporta mais material e é a mais vendida no Brasil. A versão slim é mais estreita, gasta menos papel e queima de forma mais uniforme.",
          },
          {
            termo: "Rolos",
            descricao:
              "Papel contínuo que você corta no comprimento que quiser. Útil para quem gosta de controlar o tamanho de cada enrolado.",
          },
        ],
      },
      {
        titulo: "Materiais do papel",
        itens: [
          {
            termo: "Branca (branqueada)",
            descricao:
              "Papel clareado no processo industrial. Costuma ser a opção mais barata e mais fácil de manusear, mas pode deixar gosto de papel.",
          },
          {
            termo: "Brown (não branqueada)",
            descricao:
              "Papel sem clareamento, de cor marrom. Tem sabor mais neutro e é a escolha de quem quer sentir só o que está enrolando.",
          },
          {
            termo: "Arroz",
            descricao:
              "Papel muito fino e leve, que queima devagar e quase não interfere no sabor. Exige um pouco mais de prática para enrolar.",
          },
          {
            termo: "Cânhamo",
            descricao:
              "Fibra vegetal resistente, com boa aderência e queima estável. Muito usada pelas linhas não branqueadas de marcas como a RAW.",
          },
          {
            termo: "Celulose transparente",
            descricao:
              "Feita de celulose vegetal, é transparente e queima bem devagar. Por ser lisa, desliza mais na hora de enrolar.",
          },
        ],
      },
      {
        titulo: "Formatos prontos: cone, blunt e seda com piteira",
        paragrafos: [
          "Cones já vêm enrolados: basta preencher e fechar. São a opção mais rápida e a que dá resultado mais uniforme para quem ainda não tem prática.",
          "Blunts são folhas mais grossas e geralmente aromatizadas, que queimam devagar. Sedas com piteira trazem o papel e o filtro de cartão juntos no mesmo livreto, o que facilita para levar na rua.",
        ],
      },
    ],
    faq: [
      {
        pergunta: "Qual a diferença entre seda king size e 1¼?",
        resposta:
          "O comprimento. A king size tem cerca de 110 mm e a 1¼ tem cerca de 78 mm. A king size comporta mais material; a 1¼ é mais fácil de enrolar e rende mais por livreto.",
      },
      {
        pergunta: "O que significa king size slim?",
        resposta:
          "É a seda king size com largura menor. Usa menos papel, deixa o enrolado mais fino e costuma queimar de forma mais uniforme do que a king size larga.",
      },
      {
        pergunta: "Seda brown é melhor que a branca?",
        resposta:
          "Não existe melhor em geral. A brown não passa por clareamento e interfere menos no sabor; a branca costuma ser mais barata e mais fácil de manusear. A escolha depende do que você prioriza.",
      },
      {
        pergunta: "Qual seda é mais fácil para iniciante?",
        resposta:
          "Uma 1¼ ou uma king size slim de papel não branqueado, de gramatura média. Papéis muito finos, como os de arroz, exigem mais prática. Se quiser pular a etapa de enrolar, use cones.",
      },
      {
        pergunta: "Por que minha seda queima torto?",
        resposta:
          "Normalmente por material mal distribuído ou enrolado frouxo. Distribua o conteúdo de forma uniforme, enrole firme e acenda girando a ponta para a chama pegar por igual.",
      },
    ],
    leiaTambem: [
      { rotulo: "Como escolher sua seda: tamanho, material e queima", href: "/blog/como-escolher-sua-seda" },
      { rotulo: "Guia para iniciantes", href: "/comece-aqui" },
    ],
  },

  piteirasfiltros: {
    tituloSeo: "Piteiras e filtros: papel, vidro e carvão ativado | DeLaTrip",
    metaDescricao:
      "Entenda a diferença entre piteira de papel, de vidro e filtro de carvão ativado, os diâmetros slim e regular e como escolher. Marcas Gizeh, RAW, Bem Bolado.",
    titulo: "Piteira ou filtro: qual usar",
    resumo:
      "A piteira dá firmeza à ponta do enrolado e evita que o material chegue à boca. O filtro, além disso, retém parte das partículas. Piteiras de papel são descartáveis e baratas, as de vidro são reutilizáveis, e os filtros de carvão ativado são os que mais filtram.",
    secoes: [
      {
        titulo: "Tipos",
        itens: [
          {
            termo: "Piteira de papel (tips)",
            descricao:
              "Tiras de cartão que você dobra e enrola, ou piteiras já enroladas. É a mais comum e a mais barata. Existem versões não branqueadas e perfuradas para facilitar a dobra.",
          },
          {
            termo: "Piteira de vidro",
            descricao:
              "Reutilizável, não altera o sabor e é fácil de lavar. Pede cuidado no transporte; guarde em um estojo.",
          },
          {
            termo: "Filtro de acetato ou espuma",
            descricao:
              "O filtro tradicional de cigarro, em versões slim e extra slim. Deixa a tragada mais suave.",
          },
          {
            termo: "Filtro de carvão ativado",
            descricao:
              "Tem um núcleo de carvão que retém mais partículas e resíduos. A tragada fica mais leve; quem quer sabor mais presente pode estranhar no começo.",
          },
        ],
      },
      {
        titulo: "Diâmetro: confira antes de comprar",
        paragrafos: [
          "Filtros e piteiras prontas vêm em diâmetros diferentes. O slim, de cerca de 6 mm, combina com sedas slim e enrolados mais finos. Os modelos regulares, mais largos, combinam com king size larga e cones.",
          "Um filtro largo demais rasga a seda; um estreito demais fica solto e deixa o enrolado frouxo.",
        ],
      },
    ],
    faq: [
      {
        pergunta: "Qual a diferença entre piteira e filtro?",
        resposta:
          "A piteira dá estrutura à ponta e impede que o material vá para a boca. O filtro faz isso e também retém parte das partículas. Toda piteira de vidro ou de papel é aberta; o filtro tem um material filtrante por dentro.",
      },
      {
        pergunta: "Filtro de carvão ativado vale a pena?",
        resposta:
          "Para quem quer uma tragada mais leve, sim: é o tipo que mais retém resíduos. Ele custa mais por unidade e suaviza o sabor, então quem prioriza sabor costuma preferir piteira de papel ou de vidro.",
      },
      {
        pergunta: "Como limpar piteira de vidro?",
        resposta:
          "Deixe de molho em álcool isopropílico por alguns minutos, passe um limpador de cachimbo ou escova fina e enxágue com água quente. Seque bem antes de usar.",
      },
      {
        pergunta: "Qual filtro usar com seda slim?",
        resposta:
          "Um filtro ou piteira de diâmetro slim, em torno de 6 mm. Filtros regulares são largos demais para a seda slim.",
      },
    ],
    leiaTambem: [
      { rotulo: "Limpeza e cuidados com peças de vidro", href: "/blog/limpeza-e-cuidados-com-vidro" },
    ],
  },

  dichavadores: {
    tituloSeo: "Dichavadores: 2, 3 ou 4 partes e materiais | DeLaTrip",
    metaDescricao:
      "Como escolher dichavador: diferença entre 2, 3 e 4 partes, alumínio, zinco, acrílico e policarbonato, tamanho e limpeza. Compare modelos e marcas.",
    titulo: "Como escolher um dichavador",
    resumo:
      "Escolha o dichavador por três critérios: número de partes (o que ele faz além de triturar), material (durabilidade e peso) e diâmetro (quanto cabe de uma vez). Para uso diário, um modelo de alumínio de 3 ou 4 partes com cerca de 50 mm atende a maioria das pessoas.",
    secoes: [
      {
        titulo: "2, 3 ou 4 partes",
        itens: [
          {
            termo: "2 partes",
            descricao:
              "Tampa e base com dentes. Tritura e o material fica ali mesmo. É o mais compacto e o mais fácil de limpar.",
          },
          {
            termo: "3 partes",
            descricao:
              "Tem uma câmara abaixo dos dentes: o material triturado cai pelos furos e fica separado. Mais prático para guardar e transportar.",
          },
          {
            termo: "4 partes",
            descricao:
              "Acrescenta uma tela fina e um compartimento no fundo que acumula o pólen, a parte mais fina que se solta. É o mais completo, e também o maior e mais caro.",
          },
        ],
      },
      {
        titulo: "Materiais",
        itens: [
          {
            termo: "Alumínio",
            descricao:
              "Leve, resistente e com dentes que duram. É o melhor equilíbrio entre preço e vida útil.",
          },
          {
            termo: "Zinco e outras ligas metálicas",
            descricao:
              "Mais pesado e geralmente mais barato que o alumínio. O peso ajuda a triturar, mas as peças podem lascar com o tempo.",
          },
          {
            termo: "Acrílico, policarbonato e plástico",
            descricao:
              "Baratos, leves e com muitas opções de cor. Os dentes se desgastam mais rápido; bom como primeiro dichavador ou reserva.",
          },
          {
            termo: "Fibra e madeira",
            descricao:
              "Visual diferenciado e toque mais natural. Pedem cuidado com umidade e na limpeza.",
          },
        ],
      },
      {
        titulo: "Tamanho e detalhes que fazem diferença",
        paragrafos: [
          "Diâmetros de 40 a 45 mm cabem no bolso; de 50 a 63 mm trituram mais material de uma vez. Dentes em formato de losango cortam melhor do que pinos redondos.",
          "Tampa com ímã evita que o dichavador abra na bolsa. Rosca bem usinada impede que as partes travem com o uso.",
        ],
      },
    ],
    faq: [
      {
        pergunta: "Qual a diferença entre dichavador de 3 e 4 partes?",
        resposta:
          "O de 4 partes tem uma tela e um compartimento extra no fundo que separa o pólen. O de 3 partes só separa o material triturado. Se você não pretende juntar pólen, o de 3 partes é suficiente e mais compacto.",
      },
      {
        pergunta: "Dichavador de alumínio ou de acrílico?",
        resposta:
          "Alumínio dura mais e corta melhor, mas custa mais. Acrílico é barato e leve, mas os dentes desgastam mais rápido. Para uso frequente, alumínio compensa.",
      },
      {
        pergunta: "Como limpar o dichavador?",
        resposta:
          "Desmonte, deixe as peças de molho em álcool isopropílico por 20 a 30 minutos, escove os dentes e a tela, enxágue e seque completamente antes de montar. Congelar o dichavador por alguns minutos antes ajuda a soltar resíduos.",
      },
      {
        pergunta: "Meu dichavador travou. O que fazer?",
        resposta:
          "Geralmente é resíduo acumulado na rosca. Coloque no congelador por 15 minutos e tente abrir. Depois, faça uma limpeza completa com álcool isopropílico.",
      },
    ],
    leiaTambem: [
      { rotulo: "Dichavador de alumínio ou acrílico: qual vale mais a pena", href: "/blog/dichavador-aluminio-ou-acrilico" },
    ],
  },

  "bong-pipes": {
    tituloSeo: "Bongs e pipes: vidro, silicone, percolador e juntas | DeLaTrip",
    metaDescricao:
      "Guia de bongs e pipes: vidro borossilicato ou silicone, tipos (beaker, reto, mini), percolador, ice catcher, juntas de 14 e 18 mm e limpeza.",
    titulo: "Como escolher um bong ou pipe",
    resumo:
      "A água do bong resfria e filtra a fumaça antes de chegar à boca. Para escolher, defina o material (vidro borossilicato ou silicone), o formato (base larga, tubo reto ou mini) e confira o diâmetro da junta, que define quais peças de reposição servem.",
    secoes: [
      {
        titulo: "Material",
        itens: [
          {
            termo: "Vidro borossilicato",
            descricao:
              "O mesmo vidro de laboratório: aguenta calor e variação de temperatura, não altera o sabor e é fácil de limpar. Quanto mais grossa a parede, mais resistente a quedas.",
          },
          {
            termo: "Silicone",
            descricao:
              "Praticamente inquebrável, dobrável e fácil de levar. Bom para viagem e para quem tem medo de quebrar. Prefira silicone de grau alimentício.",
          },
          {
            termo: "Acrílico",
            descricao:
              "Barato e leve, mas pode reter cheiro e riscar. Bom como opção de entrada.",
          },
        ],
      },
      {
        titulo: "Formatos e recursos",
        itens: [
          {
            termo: "Beaker (base larga)",
            descricao:
              "A base em forma de béquer é estável e comporta mais água. É o formato mais comum.",
          },
          {
            termo: "Tubo reto",
            descricao: "Fumaça mais direta e limpeza mais fácil.",
          },
          {
            termo: "Mini bong e bubbler",
            descricao: "Compactos, usam pouca água e cabem em qualquer canto.",
          },
          {
            termo: "Percolador",
            descricao:
              "Uma peça interna que divide a fumaça em bolhas menores, aumentando a filtragem e o resfriamento.",
          },
          {
            termo: "Ice catcher",
            descricao: "Pinos no tubo que seguram cubos de gelo para resfriar ainda mais a fumaça.",
          },
        ],
      },
      {
        titulo: "Juntas de 14 mm e 18 mm",
        paragrafos: [
          "O bowl (onde vai o material) e o downstem (tubo que leva a fumaça para a água) se encaixam por uma junta de vidro com diâmetro padrão, quase sempre de 14 mm ou 18 mm. Confira essa medida antes de comprar uma peça de reposição; adaptadores convertem uma medida na outra.",
        ],
      },
    ],
    faq: [
      {
        pergunta: "Bong de vidro ou de silicone?",
        resposta:
          "Vidro borossilicato preserva melhor o sabor e é mais fácil de limpar. Silicone é praticamente inquebrável e melhor para levar na mochila. Muita gente tem um de cada.",
      },
      {
        pergunta: "O que é percolador?",
        resposta:
          "É uma peça de vidro dentro do bong que quebra a fumaça em bolhas menores ao passar pela água, aumentando a filtragem e deixando a tragada mais suave.",
      },
      {
        pergunta: "Como saber a medida da junta do meu bong?",
        resposta:
          "A maioria usa 14 mm ou 18 mm. Meça o diâmetro interno da boca onde o bowl encaixa: perto de 1,4 cm é 14 mm e perto de 1,8 cm é 18 mm.",
      },
      {
        pergunta: "Como limpar bong de vidro?",
        resposta:
          "Coloque álcool isopropílico e sal grosso, tampe as aberturas e agite por alguns minutos. Enxágue com água quente até sair todo o cheiro. Troque a água a cada uso para evitar acúmulo.",
      },
    ],
    leiaTambem: [
      { rotulo: "Limpeza e cuidados com peças de vidro", href: "/blog/limpeza-e-cuidados-com-vidro" },
    ],
  },

  bandejas: {
    tituloSeo: "Bandejas para enrolar: tamanhos e materiais | DeLaTrip",
    metaDescricao:
      "Como escolher bandeja de enrolar: metal, madeira, bambu ou plástico, tamanho pequeno, médio e grande, bandeja com tampa e marcas como RAW e G-Rollz.",
    titulo: "Como escolher uma bandeja",
    resumo:
      "A bandeja organiza o preparo e evita desperdício: tudo fica numa superfície só, com bordas que seguram o material. Escolha pelo tamanho (onde você vai usar) e pelo material (durabilidade e facilidade de limpar). Metal é o mais prático para o dia a dia.",
    secoes: [
      {
        titulo: "Tamanhos",
        itens: [
          {
            termo: "Pequena",
            descricao: "Cabe na mochila e serve para preparar um enrolado por vez. Boa para levar.",
          },
          {
            termo: "Média",
            descricao:
              "O tamanho mais versátil: espaço para seda, dichavador e piteiras ao mesmo tempo, sem ocupar a mesa toda.",
          },
          {
            termo: "Grande",
            descricao: "Para preparar com calma ou para mais de uma pessoa. Fica melhor em casa.",
          },
        ],
      },
      {
        titulo: "Materiais",
        itens: [
          {
            termo: "Metal",
            descricao:
              "Leve, resistente e fácil de limpar com um pano. É a maioria das bandejas estampadas de marcas como RAW e G-Rollz.",
          },
          {
            termo: "Madeira e bambu",
            descricao: "Visual natural e mais robusto. Evite molhar; limpe com pano seco ou levemente úmido.",
          },
          {
            termo: "Plástico e silicone",
            descricao: "Baratos e inquebráveis, bons para levar. Podem riscar com o tempo.",
          },
        ],
      },
      {
        titulo: "Recursos extras",
        paragrafos: [
          "Tampas magnéticas transformam a bandeja em estojo e mantêm tudo no lugar no transporte. Bandejas com divisórias ou canaleta facilitam colocar o material na seda sem derramar.",
        ],
      },
    ],
    faq: [
      {
        pergunta: "Qual o melhor tamanho de bandeja?",
        resposta:
          "A média atende a maioria das pessoas: cabe seda, dichavador e piteiras sem ocupar muito espaço. Escolha a pequena se você vai levar na bolsa e a grande se for usar só em casa.",
      },
      {
        pergunta: "Como limpar bandeja de metal?",
        resposta:
          "Passe um pano úmido com um pouco de álcool e seque em seguida. Evite esponja abrasiva, que risca a estampa.",
      },
      {
        pergunta: "Para que serve a tampa da bandeja?",
        resposta:
          "Para guardar e transportar o que está em cima dela sem derrubar nada. As tampas magnéticas encaixam sozinhas.",
      },
    ],
  },

  "gas-isqueiro-macarico": {
    tituloSeo: "Isqueiros, maçaricos e gás butano: guia de escolha | DeLaTrip",
    metaDescricao:
      "Diferença entre isqueiro comum, recarregável e maçarico (chama jet), gás butano refinado e como recarregar sem estragar o isqueiro. Clipper, Zengaz, Volcano.",
    titulo: "Isqueiro, maçarico e gás: como escolher",
    resumo:
      "Isqueiros de chama amarela são bons para o dia a dia e recarregáveis em muitos modelos. Maçaricos (chama jet, azul) resistem ao vento e acendem por igual. Para recarregar qualquer um deles, use gás butano refinado: menos impurezas significa menos bico entupido.",
    secoes: [
      {
        titulo: "Tipos de isqueiro",
        itens: [
          {
            termo: "Descartável",
            descricao: "Barato e prático, mas sem recarga. Quando o gás acaba, vai para o lixo.",
          },
          {
            termo: "Recarregável",
            descricao:
              "Isqueiros como o Clipper permitem trocar a pedra e recarregar o gás. Duram anos e reduzem o descarte.",
          },
          {
            termo: "Maçarico ou chama jet",
            descricao:
              "Chama azul concentrada, que não apaga com vento. Marcas como Zengaz e Volcano têm modelos de bolso e de mesa. Consome gás mais rápido.",
          },
          {
            termo: "Fluido",
            descricao:
              "Isqueiros de pavio, que usam fluido em vez de gás. Têm chama mais alta e cheiro característico.",
          },
        ],
      },
      {
        titulo: "Gás butano refinado",
        paragrafos: [
          "O gás usado para recarga é butano. A indicação de refinado, ou o número de refinamentos na lata, diz quanto o gás foi purificado. Gás com impurezas deixa resíduo no bico e faz o isqueiro falhar com o tempo, principalmente os maçaricos, que têm bico mais fino.",
          "Confira se a lata acompanha adaptadores: cada isqueiro tem uma válvula de encaixe diferente.",
        ],
      },
      {
        titulo: "Como recarregar sem estragar",
        paragrafos: [
          "Com o isqueiro apagado e frio, esvazie o gás que sobrou pressionando a válvula com uma ponta fina, longe de chamas. Vire o isqueiro de cabeça para baixo, encaixe a lata na vertical e aperte por alguns segundos. Espere uns minutos para o gás voltar à temperatura ambiente antes de acender.",
        ],
      },
    ],
    faq: [
      {
        pergunta: "Qual a diferença entre isqueiro e maçarico?",
        resposta:
          "O isqueiro comum tem chama amarela e mais suave, que balança com vento. O maçarico tem chama azul concentrada e mais quente, que não apaga com vento e acende de forma mais uniforme.",
      },
      {
        pergunta: "O que é gás refinado?",
        resposta:
          "É gás butano com menos impurezas. Ele deixa menos resíduo no bico, o que evita entupimento e falhas, principalmente em maçaricos.",
      },
      {
        pergunta: "Por que meu isqueiro não acende depois de recarregar?",
        resposta:
          "O gás recém-colocado fica gelado e com pressão baixa. Espere alguns minutos. Se continuar falhando, esvazie e recarregue de novo: pode ter entrado ar junto com o gás.",
      },
      {
        pergunta: "Qualquer gás serve para qualquer isqueiro?",
        resposta:
          "Os isqueiros recarregáveis comuns e os maçaricos usam gás butano, mas a válvula de encaixe varia. Use o adaptador certo que vem com a lata.",
      },
    ],
  },

  acessorios: {
    tituloSeo: "Acessórios: cases, boladores, potes e Boveda | DeLaTrip",
    metaDescricao:
      "Tudo o que complementa o kit: tesoura, cuia, bolador, case, lata, potes, saquinhos zip e umidificadores Boveda para manter ervas e tabaco no ponto.",
    titulo: "Acessórios que fazem diferença",
    resumo:
      "Os acessórios resolvem três coisas: preparar (tesoura, cuia, bolador), guardar (potes, cases, latas, zip) e conservar (umidificadores como o Boveda). Um bom pote com controle de umidade é o acessório que mais preserva aroma e textura do que você guarda.",
    secoes: [
      {
        titulo: "Para preparar",
        itens: [
          {
            termo: "Tesoura",
            descricao: "Alternativa rápida ao dichavador. Use em uma cuia para não perder material.",
          },
          {
            termo: "Cuia",
            descricao: "Recipiente de silicone ou metal para cortar e misturar sem espalhar.",
          },
          {
            termo: "Bolador (máquina de enrolar)",
            descricao:
              "Enrola de forma uniforme em segundos. Bom para iniciantes e para quem quer padronizar o tamanho. Confira se o modelo é para 1¼ ou king size.",
          },
        ],
      },
      {
        titulo: "Para guardar e levar",
        itens: [
          {
            termo: "Case e moco",
            descricao: "Estojos que reúnem seda, piteiras, isqueiro e dichavador num lugar só.",
          },
          {
            termo: "Lata e pote hermético",
            descricao: "Vedam o cheiro e protegem da luz e do ar, que ressecam o conteúdo.",
          },
          {
            termo: "Saquinho zip",
            descricao: "Prático e barato para porções pequenas. Não é hermético por muito tempo.",
          },
        ],
      },
      {
        titulo: "Para conservar: controle de umidade",
        paragrafos: [
          "Umidificadores bidirecionais, como os da Boveda, liberam ou absorvem umidade até manter o ambiente na porcentagem certa. Para ervas e flores usa-se 58% ou 62%; para charutos, de 65% a 75%. Use a nossa calculadora para saber o tamanho e a quantidade certos.",
        ],
      },
    ],
    faq: [
      {
        pergunta: "Como guardar ervas e tabaco sem ressecar?",
        resposta:
          "Em pote hermético, longe da luz e do calor, com um umidificador bidirecional na umidade certa (58% ou 62% para ervas). Evite saquinhos plásticos por longos períodos.",
      },
      {
        pergunta: "Bolador funciona com qualquer seda?",
        resposta:
          "Não. Cada bolador é feito para um tamanho de seda, como 1¼ ou king size. Confira o tamanho no produto antes de comprar.",
      },
      {
        pergunta: "Qual umidade do Boveda usar?",
        resposta:
          "Para ervas e flores, 58% (mais seco, bom para enrolar) ou 62% (mais macio). Para charutos, 69% a 72% na maioria dos casos. A calculadora Boveda indica o tamanho e a quantidade.",
      },
    ],
    leiaTambem: [
      { rotulo: "Calculadora Boveda", href: "/calculadora-boveda" },
      { rotulo: "Guia para iniciantes", href: "/comece-aqui" },
    ],
  },
};

/** Guia da categoria (só para categorias raiz). */
export function guiaDaCategoria(slugRaiz: string): GuiaCategoria | undefined {
  return CATEGORY_GUIDES[slugRaiz];
}
