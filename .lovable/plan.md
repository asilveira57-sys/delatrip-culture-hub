# Aprovação de produto mais rápida, em 3 fases

Todas as mudanças ficam na página de edição de produto do admin. Cada fase é aplicada e testada antes da próxima.

## Fase 1 — Nível "Todos" e marca pré-preenchida (sem IA)

**Nível "Todos os perfis"**
- Nova opção "Todos os perfis" no seletor de Nível, ao lado de "Sem classificação".
- Ao escolher, a opção fica travada como manual: a classificação automática não a muda.
- Ela também aparece na edição em lote da lista de Produtos e no filtro por nível.
- No site público, um produto em "Todos" entra no quiz, nos kits sugeridos e no bloco "Depois, explore" de qualquer perfil, e aparece nas 4 páginas de perfil.
- Na página Guia do admin, a sugestão de kit também considera esses produtos para qualquer nível.

**Marca já sugerida**
- O campo de marca já vem preenchido com a marca do catálogo, convertida para a marca ativa quando houve mesclagem.
- Um selo "Sugerida pelo catálogo" aparece com o botão "Aprovar marca". Para trocar, continua valendo buscar outra marca ou clicar em "Sem marca".
- Nada é gravado até você salvar o produto.

## Fase 2 — Posts relacionados: busca + sugestão por IA

- Campo de busca acima da lista de posts, por título, aceitando palavras com ou sem acento. A lista é filtrada na hora.
- Botão "Sugerir com IA": a IA lê o nome, a categoria, a marca e a descrição do produto e escolhe até 3 posts que realmente tratam do mesmo assunto.
  - Os 3 já vêm marcados, mas só são gravados quando você salva.
  - Cada sugestão traz uma linha curta explicando o motivo.
  - Se nenhum post tiver relação, a IA não marca nada e avisa.
- A IA só pode escolher entre os posts publicados e não inventa títulos.

## Fase 3 — Produtos relacionados sugeridos por IA

- Botão "Sugerir com IA" no bloco de produtos relacionados, que preenche até 8 produtos. Você pode remover, trocar ou adicionar antes de salvar.
- Para não depender só da IA e economizar créditos, a lista de candidatos é montada antes, sem IA. Ela junta produtos da mesma categoria, de categorias que se complementam e da mesma marca, só os visíveis e disponíveis.
- A IA escolhe os 8 dessa lista curta, priorizando itens complementares e não 8 variações do mesmo item. Exemplo: para um gás, sugere isqueiros e maçaricos, e não 8 gases.
- Os textos seguem as regras de conformidade do projeto: sem citar substâncias nem fazer alegações de saúde.

## Detalhes técnicos

- Fase 1: o valor `todos` é aceito em `produto_overlay.nivel`. A migração ajusta a validação da coluna, se houver. `PatchGuia`, `GuiaPerfilEditor`, os filtros de `produtos.index` e o lote aceitam esse valor.
  - `classificarPerfis` respeita o bloqueio manual, então não sobrescreve.
  - Em `guia-publico.ts` (`montarConjunto` e `depoisExplore`), na página de perfil e na sugestão do admin, a comparação de nível passa a ser `nivel === alvo || nivel === "todos"`.
  - Marca sugerida vem de `marcasEfetivas` mais o slug da marca do produto, com estado local `marcaSugerida`.
- Fases 2 e 3: nova server function autenticada `sugerirRelacionadosIa` em `src/lib/relacionados-ia.functions.ts`, com `requireSupabaseAuth`.
  - Usa o modelo padrão do gateway de IA e retorna JSON validado. IDs fora da lista de candidatos são descartados.
  - Recebe o slug do produto e o tipo (`posts` ou `produtos`).
  - Para posts, envia no máximo cerca de 150 candidatos (título e resumo), pré-filtrados por palavras do produto quando houver muitos. Para produtos, cerca de 60 candidatos.
  - Erros 429 e 402 aparecem como aviso claro, sem nova tentativa automática.
- A busca de posts é só no navegador, sem custo de IA.
- Cada fase é verificada no admin com login antes de seguir para a próxima.
