# Análise Pré — módulo isolado

Este diretório contém a implementação experimental da Análise Pré. Não altera a interface principal nem a lógica de Dashboard/Backtest.

## Regras de isolamento

- A branch `feature/analise-pre-isolada` parte do commit estável `a49c0724a9e3f007025bfb1df54ff10e8414f83d`.
- Nenhuma mudança é publicada na branch `main` durante desenvolvimento.
- Os jogos preliminares pertencem exclusivamente a `public.pre_analysis_games`; nunca inserir, atualizar ou excluir linhas de `public.jogos`.
- A exclusão por campeonato deve exigir confirmação e usar igualdade exata do nome.
- Os filtros salvos são lidos de `public.filtros`, sem editar nem ativar/desativar filtros por efeito colateral.
- Não considerar um jogo aprovado sem calcular de verdade as métricas históricas requeridas pelo filtro.
- Não executar migrações destrutivas, limpar tabelas nem alterar os dados históricos.
- Integrar à aplicação principal apenas por uma rota dedicada e após validar os testes de regressão.

## Estado

A branch experimental agora contém uma página dedicada em `/analise-pre`, rotas de API isoladas, importação para `pre_analysis_games` e avaliação sem persistir aprovações. Ainda não está implantada no Render nem mesclada em `main`.

A pipeline verifica a sintaxe do servidor e executa os testes automatizados do módulo. Antes de habilitar na versão principal, ainda é obrigatório fazer teste ponta a ponta em ambiente controlado, validar permissões/credenciais do endpoint e confirmar o comportamento da tabela temporária no ambiente de implantação.

## Resolver histórico experimental

O módulo `simple-historical-metric-resolver.js` calcula somente médias históricas de métricas simples em contexto CASA/FORA, com janela, data estritamente anterior e amostra mínima. A fonte de dados deve ser injetada como leitura somente de `public.jogos`; o módulo não grava dados. Contexto GERAL, CV, métricas compostas e custo por ponto permanecem bloqueados até validação contra o motor SQL oficial. O resolver está ligado à API experimental por `historical-filter-evaluator.js` e `supabase-historical-provider.js`. A API falha de forma segura quando a métrica não é suportada e nunca persiste uma aprovação. O servidor experimental ainda não está implantado no Render.


## Validação comparativa com o motor SQL

Em consultas somente leitura no Banco B, a média calculada de forma independente coincidiu com `calcular_metrica_jogo` para 10 configurações ativas CASA/FORA, em 30 partidas recentes por configuração (300 comparações, 0 divergências após respeitar o mínimo de amostra). Para o filtro ativo `Novo over`, a avaliação manual de suas duas condições coincidiu com `avaliar_filtro` em 100 partidas recentes (100/100, 0 divergências). Isso é evidência de validação para esses casos, não prova de todas as métricas/contextos. GERAL, CV, compostas e custo por ponto continuam bloqueados.
