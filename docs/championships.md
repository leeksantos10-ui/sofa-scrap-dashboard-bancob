# Campeonatos — especificação da integração

## Escopo e proteção de dados
Configuração separada por campeonato e temporada. Não altera, exclui nem reescreve registros da tabela `jogos`. Rodadas excluídas afetam somente elegibilidade para entrada no backtest, não o histórico utilizado pelas métricas.

## Tela
Adicionar navegação `Campeonatos` imediatamente abaixo de `Cache`. A página deve listar configurações por campeonato/temporada, permitir pesquisar, criar, editar e salvar, e indicar quando a configuração não existe (defaults).

## Campos de configuração
- Total de rodadas (obrigatório para excluir últimas rodadas; não inferir de máximo importado).
- Pontuação: vitória, empate, derrota.
- Desempates em ordem configurável: pontos, saldo, gols pró, vitórias e confronto direto quando implementado/validado.
- Contexto padrão: Geral, Casa, Visitante.
- Janela histórica: temporada inteira (default) ou últimos N jogos por time e contexto.
- Entrada a partir da rodada.
- Rodadas excluídas individuais, intervalo de rodadas, e últimas N rodadas.

## Classificação sem look-ahead
Para cada partida avaliada, a classificação é calculada apenas com resultados anteriores à partida. Jogos da própria rodada só entram quando sua data/hora comprovadamente antecede a partida-alvo; sem horário confiável, aplicar corte conservador por rodada. Nunca usar placar da partida-alvo nem partidas futuras.

## Contextos
- Geral: partidas anteriores do time como mandante ou visitante.
- Casa: somente partidas anteriores em que o time foi mandante.
- Visitante: somente partidas anteriores em que o time foi visitante.
A janela N é aplicada após filtrar pelo contexto e ordenar cronologicamente do mais recente para o mais antigo.

## Métricas planejadas
Pontos, posição, vitórias, empates, derrotas, jogos, gols pró, gols contra, saldo, aproveitamento, pontos por jogo, diferença de pontos entre mandante e visitante, diferença de posição, Top N/G4/Z4 e operadores/limiares.

## Backtest
As rodadas anteriores ao início de entradas continuam disponíveis para formação do histórico. A partir da rodada configurada, os jogos podem gerar entradas, exceto rodadas explicitamente excluídas. A exclusão de entradas nunca remove partidas da base.

## Persistência
A migration proposta cria `championship_configs`, chave única campeonato+temporada. Antes de executar no projeto Supabase, confirmar acesso, revisar permissões/RLS e testar leitura/escrita. A migration no branch é apenas arquivo; ainda não foi aplicada no banco.
