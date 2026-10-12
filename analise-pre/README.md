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

Estrutura inicial do módulo isolado. A importação e o adaptador de filtros precisam ser implementados e testados antes da integração.
