/**
 * Resolver experimental de métricas históricas simples.
 *
 * Só implementa MEDIA para contextos CASA/FORA com campos numéricos explícitos.
 * A fonte de histórico é injetada; deve retornar jogos da mesma equipe e mesmo
 * contexto, estritamente anteriores à data da partida preliminar, em ordem
 * DATA DESC. Não consulta nem grava a tabela de jogos preliminares.
 * GERAL, CV, COMPOSTA e CUSTO_PONTO falham de forma fechada.
 */
const SAFE_FIELD = /^[A-Z][A-Z0-9_]*$/;
const asDate = value => {
  const date = String(value ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    throw new Error('Data inválida para cálculo histórico.');
  }
  return date;
};
const splitTeams = confrontation => {
  const parts = String(confrontation ?? '').split(' x ');
  if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
    throw new Error('Confronto inválido; esperado formato “Casa x Visitante”.');
  }
  return { home: parts[0].trim(), away: parts[1].trim() };
};
const idOf = value => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('ID de métrica inválido.');
  return id;
};

export function createSimpleHistoricalMetricResolver({ getMetricConfig, fetchHistory }) {
  if (typeof getMetricConfig !== 'function' || typeof fetchHistory !== 'function') {
    throw new TypeError('Configuração de métrica e fonte histórica somente leitura são obrigatórias.');
  }
  return async ({ metricId, game }) => {
    const id = idOf(metricId);
    const config = await getMetricConfig(id);
    if (!config || config.ativa === false) throw new Error('Métrica inexistente ou inativa: ' + id);
    const formulaType = String(config.formula?.tipo ?? '').toUpperCase();
    if (formulaType === 'COMPOSTA' || String(config.campo).toUpperCase() === 'CUSTO_PONTO') {
      throw new Error('Métrica composta/custo por ponto ainda não validada; avaliação bloqueada.');
    }
    const context = String(config.contexto ?? '').toUpperCase();
    const operation = String(config.operacao ?? '').toUpperCase();
    if (!['CASA', 'FORA'].includes(context) || operation !== 'MEDIA') {
      throw new Error('Contexto/operação não suportado com segurança: ' + context + '/' + operation);
    }
    const windowSize = Number(config.janela_jogos);
    const minimum = Number(config.minimo_jogos);
    if (!Number.isSafeInteger(windowSize) || windowSize < 1 || windowSize > 100 ||
        !Number.isSafeInteger(minimum) || minimum < 1 || minimum > windowSize) {
      throw new Error('Janela histórica ou amostra mínima inválida.');
    }
    const field = String(config.formula?.campo ?? config.campo ?? '').toUpperCase();
    if (!SAFE_FIELD.test(field) || !/_CASA$|_VISITANTE$/.test(field)) {
      throw new Error('Campo de métrica não permitido para cálculo histórico: ' + field);
    }
    const date = asDate(game.data ?? game.DATA);
    const teams = splitTeams(game.confronto ?? game.CONFRONTO);
    const team = context === 'CASA' ? teams.home : teams.away;
    const historicalField = context === 'CASA'
      ? field.replace(/_VISITANTE$/, '_CASA')
      : field.replace(/_CASA$/, '_VISITANTE');
    const rows = await fetchHistory({
      team, context, beforeDate: date, field: historicalField,
      limit: windowSize, select: ['DATA', 'CONFRONTO', historicalField],
      readOnly: true
    });
    if (!Array.isArray(rows)) throw new Error('Fonte histórica retornou resposta inválida.');
    const eligible = rows.filter(row => {
      const rowDate = String(row.DATA ?? row.data ?? '').slice(0, 10);
      const parts = String(row.CONFRONTO ?? row.confronto ?? '').split(' x ');
      const sideTeam = context === 'CASA' ? parts[0]?.trim() : parts[1]?.trim();
      const raw = row[historicalField] ?? row[historicalField.toLowerCase()];
      return /^\d{4}-\d{2}-\d{2}$/.test(rowDate) && rowDate < date &&
        sideTeam === team && raw != null && Number.isFinite(Number(raw));
    }).sort((a,b) => String(b.DATA ?? b.data).localeCompare(String(a.DATA ?? a.data)))
      .slice(0, windowSize);
    if (eligible.length < minimum) return null;
    const values = eligible.map(row => Number(row[historicalField] ?? row[historicalField.toLowerCase()]));
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };
}
