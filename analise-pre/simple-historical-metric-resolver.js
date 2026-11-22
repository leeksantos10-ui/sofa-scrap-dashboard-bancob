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
const ALLOWED_FIELDS = new Set(['GOLS_CASA_FT', 'GOLS_VISITANTE_FT', 'PASSES_CERTOS_CASA', 'PASSES_CERTOS_VISITANTE']);
const oppositeField = field => field === 'GOLS_CASA_FT' ? 'GOLS_VISITANTE_FT' : field === 'GOLS_VISITANTE_FT' ? 'GOLS_CASA_FT' : field.replace(/_CASA(?=_|$)/, '_VISITANTE').replace(/_VISITANTE(?=_|$)/, '_CASA');
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
  async function resolveHistoricalIndicator(config, game, context, windowSize, minimum) {
    const formula = config.formula || {};
    const indicator = String(formula.indicador || '').toUpperCase();
    const line = Number(formula.linha ?? 2.5);
    const output = String(formula.saida || 'PERCENTUAL').toUpperCase();
    const date = asDate(game.data ?? game.DATA);
    const teams = splitTeams(game.confronto ?? game.CONFRONTO);
    const team = context === 'FORA' ? teams.away : teams.home;
    const fetchSide = async side => {
      const field = side === 'home' ? 'GOLS_CASA_FT' : 'GOLS_VISITANTE_FT';
      return fetchHistory({team, context: side === 'home' ? 'CASA' : 'FORA', beforeDate: date, field, limit: windowSize, select: ['DATA','CONFRONTO',field], readOnly: true});
    };
    const [homeRows, awayRows] = await Promise.all([context==='FORA'?Promise.resolve([]):fetchSide('home'),context==='CASA'?Promise.resolve([]):fetchSide('away')]);
    if (!Array.isArray(homeRows) || !Array.isArray(awayRows)) throw new Error('Fonte histórica retornou resposta inválida.');
    const rows=[...homeRows.map(row=>({row,side:'home'})),...awayRows.map(row=>({row,side:'away'})))]
      .filter(({row,side})=>{
        const d=String(row.DATA??row.data??'').slice(0,10), teamsRow=splitTeams(row.CONFRONTO??row.confronto);
        return d<date && (side==='home'?teamsRow?.home:teamsRow?.away)===team;
      })
      .sort((a,b)=>String(b.row.DATA??b.row.data).localeCompare(String(a.row.DATA??a.row.data)))
      .slice(0,windowSize);
    if(rows.length<minimum) return null;
    const vals=rows.map(({row,side})=>({home:Number(row.GOLS_CASA_FT),away:Number(row.GOLS_VISITANTE_FT),teamSide:side}));
    const valid=vals.filter(v=>Number.isFinite(v.home)&&Number.isFinite(v.away));
    if(valid.length<minimum) return null;
    let hit;
    switch(indicator){
      case 'OVER': hit=(v)=>v.home+v.away>line; break;
      case 'UNDER': hit=(v)=>v.home+v.away<line; break;
      case 'BTTS_SIM': hit=(v)=>v.home>0&&v.away>0; break;
      case 'BTTS_NAO': hit=(v)=>v.home===0||v.away===0; break;
      case 'VITORIA': hit=(v)=>v.teamSide==='away'?v.away>v.home:v.home>v.away; break;
      case 'EMPATE': hit=(v)=>v.home===v.away; break;
      case 'DERROTA': hit=(v)=>v.teamSide==='away'?v.away<v.home:v.home<v.away; break;
      case 'GOLS_MARCADOS': return valid.reduce((sum,v)=>sum+(v.teamSide==='away'?v.away:v.home),0)/valid.length;
      case 'GOLS_SOFRIDOS': return valid.reduce((sum,v)=>sum+(v.teamSide==='away'?v.home:v.away),0)/valid.length;
      default: throw new Error('Indicador histórico não reconhecido: '+indicator);
    }
    const count=valid.filter(hit).length;
    if(output==='CONTAGEM') return count;
    if(output==='PERCENTUAL') return count/valid.length*100;
    throw new Error('Saída de indicador deve ser PERCENTUAL ou CONTAGEM.');
  }
  async function resolveOne(metricId, game, stack = new Set()) {
    const id = idOf(metricId);
    if (stack.has(id)) throw new Error('Ciclo detectado na fórmula da métrica ' + id);
    const config = await getMetricConfig(id);
    if (!config || config.ativa === false) throw new Error('Métrica inexistente ou inativa: ' + id);
    const formulaType = String(config.formula?.tipo ?? '').toUpperCase();
    if (String(config.campo).toUpperCase() === 'CUSTO_PONTO') {
      throw new Error('Métrica custo por ponto ainda não validada; avaliação bloqueada.');
    }
    if (formulaType === 'COMPOSTA') {
      const components = Array.isArray(config.formula?.componentes) ? config.formula.componentes : [];
      if (!components.length || components.length > 20) throw new Error('Fórmula composta sem componentes válidos.');
      const values = [];
      for (const component of components) {
        const componentId = idOf(component.metrica_id ?? component.id);
        const value = await resolveOne(componentId, game, new Set([...stack, id]));
        if (value == null || !Number.isFinite(Number(value))) return null;
        values.push(Number(value));
      }
      const compoundOperation = String(config.formula?.operacao ?? config.operacao ?? 'MEDIA').toUpperCase();
      if (compoundOperation === 'MEDIA' || compoundOperation === 'AVG') return values.reduce((sum, value) => sum + value, 0) / values.length;
      if (compoundOperation === 'SOMA' || compoundOperation === 'SUM') return values.reduce((sum, value) => sum + value, 0);
      if (compoundOperation === 'SUBTRACAO') return values.slice(1).reduce((value, item) => value - item, values[0]);
      if (compoundOperation === 'MULTIPLICACAO') return values.reduce((value, item) => value * item, 1);
      throw new Error('Operação de métrica composta não suportada: ' + compoundOperation);
    }
    if (formulaType === 'HISTORICA') {
      const ctx=String(config.contexto||'GERAL').toUpperCase();
      const win=Number(config.janela_jogos||10), min=Number(config.minimo_jogos||5);
      if(!['CASA','FORA','GERAL'].includes(ctx)||!Number.isSafeInteger(win)||win<1||win>100||!Number.isSafeInteger(min)||min<1||min>win) throw new Error('Configuração de métrica histórica inválida.');
      return resolveHistoricalIndicator(config,game,ctx,win,min);
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
      if (field === 'GOLS_CASA_FT' || field === 'GOLS_VISITANTE_FT') return side === 'home' ? 'GOLS_CASA_FT' : 'GOLS_VISITANTE_FT';
      if (/_CASA(?:_|$)/.test(field)) return side === 'home' ? field : oppositeField(field);
      if (/_VISITANTE(?:_|$)/.test(field)) return side === 'away' ? field : oppositeField(field);
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
        return /^\d{4}-\d{2}-\d{2}$/.test(rowDate)&&rowDate<date&&actualTeam===team&&raw!=null&&Number.isFinite(Number(raw));
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
        return /^\d{4}-\d{2}-\d{2}$/.test(rowDate)&&rowDate<date&&sideTeam===team&&raw!=null&&Number.isFinite(Number(raw));
      }).sort((x,y)=>String(y.DATA??y.data).localeCompare(String(x.DATA??x.data))).slice(0,windowSize);
      values=eligible.map(row=>Number(row[historicalField]??row[historicalField.toLowerCase()]));
    }
    if (values.length < minimum) return null;
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    if (operation === 'MEDIA') return mean;
    if (mean === 0) throw new Error('CV histórico indefinido: média igual a zero.');
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance) / Math.abs(mean) * 100;
  }
  return ({ metricId, game }) => resolveOne(metricId, game);
}
