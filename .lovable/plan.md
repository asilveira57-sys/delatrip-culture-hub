# Portal institucional DelaTrip — páginas legais, SEO e LGPD

Entrega em 5 blocos, aproveitando ao máximo o que já existe (tabelas `pagina`, `seo_rota`, `config_site`, `faq_item`, editor rich text, admin CMS). Nada de e-commerce: sem carrinho, preço, checkout ou schema Product/Offer.

## 1. Rotas e conteúdo institucional

Novas rotas públicas com conteúdo editável pelo CMS:

- `/quem-somos` (AboutPage) — história, universo, cultura, design, propósito, dados da empresa
- `/politica-de-privacidade`, `/politica-de-cookies`, `/lgpd`, `/termos-de-uso`, `/maiores-de-18`
- `/podcast` e `/podcast/$slug` — estrutura pronta; o item só aparece no menu quando houver episódio publicado
- Página 404 personalizada (H1 "Essa página não está por aqui.", CTAs, `noindex, follow`), com header/footer

Rotas antigas equivalentes (`/sobre`, `/legal/privacidade`, `/legal/termos`, `/legal/aviso-legal`) passam a redirecionar 301 para as novas, preservando o que já está indexado.

Home ganha os blocos institucionais pedidos (história, cultura, lifestyle, acessórios, materiais e design, podcast, conteúdos em destaque, redes, contato) e os CTAs "Conheça a DelaTrip" e "Entre em contato", mantendo a identidade visual atual.

Rodapé reorganizado em 4 grupos (DelaTrip / Legal / Contato / Empresa), com "Preferências de Cookies", aviso 18+ e © com ano automático.

## 2. Formulários (contato + LGPD)

- Formulário de contato com nome, e-mail, telefone opcional, assunto, categoria (7 opções), mensagem e checkbox obrigatório de ciência da política.
- Formulário LGPD em `/lgpd` com nome, e-mail, tipo de solicitação e descrição — sem pedir documentos.
- Envio por server function: validação Zod no cliente e no servidor, limite de caracteres, sanitização, honeypot + desafio simples anti-bot e rate limit por IP. Nada de dado pessoal em log.
- Mensagens gravadas em banco (data, nome, e-mail, telefone, categoria, assunto, mensagem, status, origem, UTMs).
- Telas no Admin para listar, filtrar e mudar status (Recebida / Em análise / Respondida / Concluída), com leitura restrita a usuários autenticados.

## 3. Cookies, consentimento e integrações

- Banner CMP substituindo o atual: "Aceitar todos", "Rejeitar não essenciais" e "Personalizar" com peso visual igual; nenhuma categoria opcional pré-marcada.
- Categorias: necessários (sempre ativos), preferências, análise, marketing.
- Registro do consentimento (data, versão da política, categorias aceitas, identificador técnico) e link permanente "Preferências de Cookies" no rodapé para reabrir o painel.
- GA4/GTM/Meta Pixel só disparam conforme a categoria autorizada; Google Consent Mode v2 configurado antes do carregamento do GTM/GA4.
- Tabela de cookies da `/politica-de-cookies` montada a partir das integrações realmente ativas no Admin — sem cookies fictícios.

## 4. SEO técnico

- Editor SEO no Admin ampliado para todas as rotas novas: título, descrição, canonical, index/noindex, follow/nofollow, OG title/description/OG image e imagem do X.
- Canonical autorreferente e Open Graph em todas as páginas, com imagem institucional padrão quando a página não tiver a própria.
- JSON-LD: Organization + WebSite na Home; WebPage + BreadcrumbList nas internas; ContactPage; AboutPage; PodcastSeries/PodcastEpisode. Nenhum Product, Offer ou Review.
- `sitemap.xml` passa a incluir as novas páginas e episódios, excluindo admin, login e rotas noindex; `robots.txt` mantém o bloqueio de `/admin` e a referência ao sitemap.
- Um H1 por página, hierarquia de H2/H3, alt em imagens, labels e foco visível nos formulários, imagens com lazy loading e dimensões definidas.

## 5. Admin — Configurações e Central Legal

- `Admin > Configurações` com abas: Empresa (razão social, CNPJ, telefone, WhatsApp, e-mail, horário, logo, favicon), Redes Sociais, SEO padrão, Analytics, Marketing, LGPD (e-mail responsável, versão e data da política) e Cookies (categorias, fornecedores, finalidades, prazos). Todos os dados hoje fixos em `src/config/site.ts` passam a vir do banco, com o arquivo servindo apenas de fallback.
- `Admin > Legal` para editar Privacidade, Cookies, Termos, LGPD e Aviso 18+ com versão, data de publicação, última atualização, status rascunho/publicado e histórico de versões.
- `Admin > Podcast` para cadastrar episódios (título, slug, descrição, capa, data, participantes, resumo, players Spotify/YouTube, transcrição e SEO).

## Notas técnicas

- Banco: reutiliza `pagina`, `seo_rota` e `config_site`; cria apenas `contato_mensagem`, `lgpd_solicitacao`, `consentimento_cookie`, `documento_legal` (+ histórico) e `podcast_episodio`, todas com GRANTs e RLS (inserção pública controlada nos formulários, leitura só para autenticados; consentimento sem dado pessoal).
- `seo_rota` ganha colunas de canonical, follow/nofollow e OG/Twitter image.
- Aviso 18+ é gravado em localStorage, totalmente separado do consentimento de cookies.
- Catálogo, marcas, blog e enriquecimento por IA permanecem como estão.
