# Carrossel de marcas e melhoria mobile do portal público

## Objetivo
Substituir a barra de rolagem visível da faixa de marcas por um carrossel controlado e melhorar a experiência em celular em todo o portal público, sem alterar a identidade visual, o conteúdo, o catálogo ou a área administrativa.

## 1. Carrossel de marcas
- Transformar a faixa atual em um carrossel horizontal com encaixe por item.
- Adicionar seta anterior no início e seta próxima no fim, posicionadas sem cobrir os nomes das marcas.
- Desabilitar ou ocultar cada seta quando não houver mais conteúdo naquela direção.
- Manter gesto de arrastar no celular, roda/trackpad no computador e navegação por teclado.
- Remover a barra de rolagem visível e atualizar corretamente as setas após rolagem e mudança de tamanho da tela.
- Preservar o botão “Ver todas” e os links individuais das marcas.

## 2. Base mobile compartilhada
- Ajustar cabeçalho, busca, menu, títulos de seção, cabeçalhos internos e rodapé para larguras pequenas, com áreas de toque confortáveis e textos sem corte.
- Tornar o aviso de cookies mais compacto no celular, com altura limitada e rolagem interna quando necessário, para não encobrir quase toda a primeira tela.
- Padronizar espaçamentos verticais e tamanhos de títulos no celular, mantendo os valores atuais em telas maiores.
- Garantir que ações lado a lado virem linhas ou ocupem a largura disponível quando não couberem.

## 3. Páginas públicas
- Revisar e ajustar página inicial, catálogo, busca, categorias, produto, marcas, blog, guia “Comece aqui”, contato, FAQ e páginas institucionais/legais.
- Corrigir grids muito densos, cards estreitos, filtros, galerias, tabelas, formulários e blocos relacionados quando prejudicarem leitura ou toque em 390 px.
- Manter duas colunas apenas onde o conteúdo continuar legível; usar uma coluna nos cards mais detalhados.
- Preservar todas as funções, links, SEO, dados e regras atuais.

## 4. Validação
- Testar os fluxos principais em celular: menu e busca, carrossel, catálogo e filtros, produto e galeria, blog, quiz, formulários e preferências de cookies.
- Conferir 390 px, tablet e desktop para evitar regressões, rolagem horizontal da página, sobreposição e texto cortado.
- Validar uso por toque, teclado, leitores de tela e preferência por movimento reduzido.

## Detalhes técnicos
- Criar um componente reutilizável de carrossel com referência de rolagem, `scroll-snap`, observação de tamanho/posição e botões do sistema visual existente.
- Aplicar as correções mobile principalmente nos componentes públicos compartilhados; fazer ajustes locais apenas onde cada página exigir.
- Não adicionar biblioteca de carrossel: a faixa é simples e pode usar a rolagem nativa do navegador com menos peso.
- Nenhuma mudança no banco, no admin, nos preços, no domínio ou no rastreamento.
