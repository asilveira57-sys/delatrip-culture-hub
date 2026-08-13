# DeLaTrip Hub

Crie um portal institucional e catálogo (NÃO é e-commerce nesta fase — sem carrinho,

sem checkout) para a DeLaTrip, uma tabacaria / head shop brasileira.

Site de origem: www.delatrip.com.br

## Stack e regras técnicas

- React + TypeScript + Tailwind + shadcn/ui + React Router.

- Todo o catálogo vem de arquivos JSON estáticos em /src/data/ (products.json,

  categories.json, brands.json). Sem backend, sem Supabase nesta fase.

- Textos 100% em português do Brasil.

- Mobile-first. A maioria do tráfego é celular.

- Acessibilidade: contraste AA, foco visível, alt em todas as imagens.

## Identidade visual

Herdar a identidade do site atual:

- Roxo profundo como cor primária (#5B1A6B a #7B2D8E), quase-preto (#120A14) como

  fundo das seções hero, branco/off-white (#FAF7FB) para o corpo.

- Acento dourado (#D4A544) para selos, destaques e CTAs secundários.

- Visual "urbano premium": fundos escuros, tipografia forte, muito espaço em branco

  nas listagens. Nada de clipart ou vibe genérica de e-commerce.

- Tipografia: display condensada e pesada para títulos; sans-serif limpa (Inter) para texto.

- Cantos levemente arredondados (8px), sombras suaves, hover com leve elevação.

## Estrutura de rotas (criar todas já, mesmo que vazias)

/                         Home

/catalogo                 Catálogo com filtros

/catalogo/:categoria      Categoria (aceita subníveis: /catalogo/sedas/king-size)

/produto/:slug            Página de produto

/marcas                   Índice de marcas

/marcas/:slug             Página da marca

/acessorios               Hub editorial de acessórios

/tabacos                  Hub educativo sobre tipos de tabaco

/blog                     Listagem do blog

/blog/:slug               Post

/sobre                    Sobre a DeLaTrip

/contato                  Contato

/legal/aviso-legal        Avisos legais e legislação

/legal/privacidade        Política de privacidade

/legal/termos             Termos de uso

## Header

- Logo DeLaTrip à esquerda (usar o arquivo enviado).

- Menu horizontal: Catálogo, Marcas, Acessórios, Tabacos, Blog, Sobre.

- Busca com ícone de lupa que abre um overlay de busca (busca por nome de produto e marca).

- Sem ícone de carrinho — não é loja.

- Botão destacado "Comprar na loja oficial" que leva a www.delatrip.com.br.

- No mobile: menu hambúrguer com drawer.

## Home

1. Hero escuro em tela cheia: logo, headline "A cultura, os produtos e o conhecimento

   da tabacaria brasileira", subtítulo curto, dois CTAs — "Ver catálogo" e "Conhecer as marcas".

2. Faixa de categorias: 8 cards com ícone/imagem — Sedas, Piteiras & Filtros,

   Dichavadores, Bongs & Pipes, Bandejas, Gás/Isqueiro/Maçarico, Tabacos, Acessórios.

3. Seção "Marcas que trabalhamos": carrossel horizontal de logos, link para /marcas.

4. Seção "Destaques do catálogo": grid de 8 produtos (usar campo destaque do JSON).

5. Seção editorial "Aprenda sobre o segmento": 3 cards puxando os posts mais recentes do blog.

6. Faixa de confiança: 4 itens com ícone — "Produtos originais", "Atendimento especializado",

   "Envio para todo o Brasil", "Venda proibida para menores de 18 anos".

7. Footer completo: colunas de navegação, endereço/contato, redes sociais,

   CNPJ, links legais, e o bloco de advertência sanitária (ver Prompt 5).

## Componentes reutilizáveis a criar já

- ProductCard: imagem, nome, marca, categoria, e dois botões — "Ver no site oficial"

  e "Comprar no Mercado Livre". NÃO exibir preço (ver observação abaixo).

- CategoryCard, BrandCard, PostCard, SectionHeading, Breadcrumb, EmptyState.

## Observação importante sobre preço

Preço fica DESLIGADO por padrão via uma flag de configuração em /src/config/site.ts

(`SHOW_PRICES = false`). O card e a página de produto devem já ter o layout pronto para

exibir preço quando a flag virar true. Motivo: o preço muda na loja e no marketplace,

e mostrar preço desatualizado gera problema com o consumidor.

Comece construindo o design system, o layout base (header/footer), a home e os

componentes. As outras páginas podem ficar como placeholders por enquanto.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://delatrip-culture-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1102e9f7-6cc4-4f39-946e-ddbb58bf582b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
