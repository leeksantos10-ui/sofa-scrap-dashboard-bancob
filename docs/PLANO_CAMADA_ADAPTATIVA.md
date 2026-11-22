# Plano: camada adaptativa isolada do Banco B

## Objetivo
Permitir ajustar critérios à medida que a amostra de jogos cresce, sem alterar por padrão os cálculos, filtros, métricas, importação, campeonatos ou resultados existentes.

## Estado atual observado
- A aplicação é um serviço Node em `server.js`; a interface e a API estão concentradas nesse arquivo.
- O backtest lê configurações de `backtest_config` e calcula resultados diretamente sobre `jogos`.
- O Banco B tem aproximadamente 15.633 jogos na tabela `public.jogos`.
- Existem tabelas de configuração de métricas/filtros e uma tabela `metricas_cache`; elas já são usadas pelo funcionamento atual e não devem ser reaproveitadas para armazenar parâmetros adaptativos.
- O backtest atual limita algumas consultas a 5.000 jogos e, quando usa filtro, avalia os jogos elegíveis em blocos de 20 chamadas à função oficial de avaliação. Isso deve ser considerado em qualquer melhoria futura de desempenho, sem alterar a regra do filtro nesta primeira etapa.

## Princípios de segurança
1. Não alterar o comportamento atual por padrão.
2. Não editar nem recalcular dados históricos existentes.
3. Não alterar as tabelas atuais de jogos, métricas, filtros ou backtests.
4. Implementar em branch separada e publicar somente após revisão e testes.
5. Toda regulagem deve ter valor padrão explícito, validação de limites e opção de desativar.
6. Nunca aplicar uma nova configuração automaticamente apenas porque a amostra ficou maior.
7. Guardar histórico de configurações, data da alteração, motivo e resultados de comparação.
8. Permitir voltar imediatamente à última configuração estável.

## Arquitetura proposta

### Fase 1 — observação, sem impacto nos resultados
- Criar um módulo independente de diagnóstico.
- Medir tamanho da amostra, período coberto, dados ausentes, distribuição por campeonato/temporada e estabilidade dos resultados por janelas.
- Exibir a quantidade de jogos e avisar quando a amostra é insuficiente.
- Não mudar entradas, filtros ou métricas atuais.

### Fase 2 — laboratório de regulagem
- Criar um perfil experimental separado do backtest atual.
- Parâmetros candidatos: tamanho mínimo de amostra, janela recente, janela histórica, pesos e limites de critérios.
- Restringir valores a intervalos seguros e registrar cada versão.
- Comparar a configuração atual com a candidata usando os mesmos jogos e as mesmas regras de liquidação.
- Usar validação temporal: calibrar no período anterior e avaliar em período posterior, evitando usar jogos futuros na configuração do passado.
- Mostrar resultados lado a lado, quantidade de entradas e incerteza; não declarar melhora só por ROI pontual.

### Fase 3 — ativação opcional
- Manter o perfil atual como padrão.
- Permitir ativar o perfil experimental explicitamente.
- Guardar qual versão gerou cada resultado.
- Ter botão/flag de desativação e retorno ao perfil estável.
- Não alterar o perfil padrão automaticamente.

## Armazenamento sugerido
Somente após aprovação da implementação, criar tabelas novas e independentes para:
- perfis e parâmetros adaptativos;
- histórico/versionamento das alterações;
- resultados das comparações e avaliações.

Não usar as tabelas existentes `metricas_config`, `metricas_cache`, `filtros` ou `backtest_config` para esse fim. Não executar migrações de banco durante a fase de estudo.

## Critérios mínimos de validação
- Comparar a saída atual antes/depois com os mesmos dados: deve ser idêntica quando o modo adaptativo estiver desligado.
- Testar amostra pequena, média e grande, dados ausentes, diferentes campeonatos e temporadas.
- Verificar que nenhuma configuração experimental altera os filtros ou os resultados históricos existentes.
- Validar a reversão para a configuração estável.
- Publicar apenas após aprovação e testes; nunca usar a produção como ambiente inicial de experimentação.

## Próximo passo
Implementar apenas a Fase 1 em branch separada: diagnóstico somente de leitura e sem efeito nos resultados. A criação de tabelas novas, controles de interface e ativação experimental ficam para etapas posteriores, após validar essa base.
