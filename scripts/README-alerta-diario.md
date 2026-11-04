# Alerta diário — Análise Pré (fase 1)

Workflow independente, somente leitura, para enviar por e-mail os jogos da tabela `pre_analysis_games` cuja data é hoje (America/Sao_Paulo). Não consulta nem altera `jogos`, filtros ou avaliações.

## Secrets necessários no repositório
- `SUPABASE_URL`: URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: chave de serviço (manter somente como secret; nunca imprimir)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- `ALERT_EMAIL_TO`: endereço de destino
- `ALERT_EMAIL_FROM`: remetente (opcional; padrão SMTP_USER)

## Teste
1. Execute os testes unitários na Actions.
2. Em `workflow_dispatch`, deixe `dry_run=true`: consulta a tabela e imprime o relatório sem enviar.
3. Para teste real de e-mail, execute manualmente com `dry_run=false`.
4. A agenda é 05:00 de Brasília; o GitHub pode atrasar alguns minutos.

## Fase 2
Correlacionar confronto + campeonato + data com uma fonte externa de fixtures para acrescentar horário local, fuso e link de origem. Não usar odds nesta primeira versão.
