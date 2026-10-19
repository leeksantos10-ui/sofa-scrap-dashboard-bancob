/**
 * Resolver experimental de métricas históricas simples.
 *
 * Implementa MEDIA e CV para contextos CASA/FORA com campos numéricos explícitos.
 * A fonte de histórico é injetada; deve retornar jogos da mesma equipe e mesmo
 * contexto, estritamente anteriores à data da partida preliminar, em ordem
 * DATA DESC. Não consulta nem grava a tabela de jogos preliminares.
 * GERAL, COMPOSTA e CUSTO_PONTO continuam bloqueados.
 */
const SAFE_FIELD = /^[A-Z][A-Z0-9_]*$/;
const ALLOWED_FIELDS = new Set(['GOLS_CASA_FT', 'GOLS_VISITANTE_FT']);
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
    if (!['CASA', 'FORA', 'GERAL'].includes(context) || !['MEDIA', 'CV'].includes(operation)) {
      throw new Error('Contexto/operação não suportado com segurança: ' + context + '/' + operation);
    }
    const windowSize = Number(config.janela_jogos);
    const minimum = Number(config.minimo_jogos);
    if (!Number.isSafeInteger(windowSize) || windowSize < 1 || windowSize > 100 ||
        !Number.isSafeInteger(minimum) || minimum < 1 || minimum > windowSize) {
      throw new Error('Janela histórica ou amostra mínima inválida.');
    }
    const field = String(config.formula?.campo ?? config.campo ?? '').toUpperCase();
    if (!SAFE_FIELD.test(field) || (!/_CASA$|_VISITANTE$/.test(field) && !ALLOWED_FIELDS.has(field))) {
      throw new Error('Campo de métrica não permitido para cálculo histórico: ' + field);
    }
    const date = asDate(game.data ?? game.DATA);
    const teams = splitTeams(game.confronto ?? game.CONFRONTO);
    // GERAL calcula a série histórica do time associado ao lado do campo,
    // somando jogos em casa e fora sem incluir partidas na mesma data/futuras.
    const team = context === 'FORA' || (context === 'GERAL' && /_VISITANTE$/.test(field)) ? teams.away : teams.home;
    const fieldForSide = side => {
      if (/_CASA$/.test(field)) return side === 'home' ? field : field.replace(/_CASA$/, '_VISITANTE');
      if (/_VISITANTE$/.test(field)) return side === 'away' ? field : field.replace(/_VISITANTE$/, '_CASA');
      return field;
    };
    let values;
    if (context === 'GERAL') {
      const homeField = fieldForSide('home');
      const awayField = fieldForSide('away');
      const [homeRows, awayRows] = await Promise.all([
        fetchHistory({team, context:'CASA', beforeDate:date, field:homeField, limit:windowSize, select:['DATA','CONFRONTO',homeField], readOnly:true}),
        fetchHistory({team, context:'FORA', beforeDate:date, field:awayField, limit:windowSize, select:['DATA','CONFRONTO',awayField], readOnly:true})
      ]);
      if (!Array.isArray(homeRows) || !Array.isArray(awayRows)) throw new Error('Fonte histórica retornou resposta inválida.');
      const combined = [
        ...homeRows.map(row=>({row, side:'home', metricField:homeField})),
        ...awayRows.map(row=>({row, side:'away', metricField:awayField}))
      ].filter(({row,side,metricField})=>{
        const rowDate=String(row.DATA??row.data??'').slice(0,10);
        const parts=String(row.CONFRONTO??row.confronto??'').split(' x ');
        const actualTeam=side==='home'?parts[0]?.trim():parts[1]?.trim();
        const raw=row[metricField]??row[metricField.toLowerCase()];
        return /^\\d{4}-\\d{2}-\\d{2}$/.test(rowDate)&&rowDate<date&&actualTeam===team&&raw!=null&&Number.isFinite(Number(raw));
      }).sort((x,y)=>String(y.row.DATA??y.row.data).localeCompare(String(x.row.DATA??x.row.data))||Number(y.row.id||0)-Number(x.row.id||0)).slice(0,windowSize);
      values=combined.map(({row,metricField})=>Number(row[metricField]??row[metricField.toLowerCase()]));
    } else {
      const historicalField = context === 'CASA' ? fieldForSide('home') : fieldForSide('away');
      const rows = await fetchHistory({team, context, beforeDate:date, field:historicalField, limit:windowSize, select:['DATA','CONFRONTO',historicalField], readOnly:true});
      if (!Array.isArray(rows)) throw new Error('Fonte histórica retornou resposta inválida.');
      const eligible = rows.filter(row=>{
        const rowDate=String(row.DATA??row.data??'').slice(0,10);
        const parts=String(row.CONFRONTO??row.confronto??'').split(' x ');
        const sideTeam=context==='CASA'?parts[0]?.trim():parts[1]?.trim();
        const raw=row[historicalField]??row[historicalField.toLowerCase()];
        return /^\\d{4}-\\d{2}-\\d{2}$/.test(rowDate)&&rowDate<date&&sideTeam===team&&raw!=null&&Number.isFinite(Number(raw));
      }).sort((x,y)=>String(y.DATA??y.data).localeCompare(String(x.DATA??x.data))).slice(0,windowSize);
      values=eligible.map(row=>Number(row[historicalField]??row[historicalField.toLowerCase()]));
    }
    if (values.length < minimum) return null;
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    if (operation === 'MEDIA') return mean;
    if (mean === 0) throw new Error('CV histórico indefinido: média igual a zero.');
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance) / Math.abs(mean) * 100;
  };
}
