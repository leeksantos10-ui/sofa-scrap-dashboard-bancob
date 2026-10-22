/**
 * Adaptador somente leitura para histórico da Análise Pré.
 * Usa apenas GET em public.jogos e campos numéricos explicitamente permitidos.
 * Não acessa nem modifica pre_analysis_games, filtros ou jogos por escrita.
 */
const FIELD_ALLOWLIST = new Set([
  'RATING_CASA','RATING_VISITANTE','GOLS_CASA_FT','GOLS_VISITANTE_FT',
  'XG_CASA','XG_VISITANTE','XG_NO_ALVO_CASA','XG_NO_ALVO_VISITANTE',
  'FINALIZACOES_TOTAIS_CASA','FINALIZACOES_TOTAIS_VISITANTE',
  'FINALIZACOES_NO_ALVO_CASA','FINALIZACOES_NO_ALVO_VISITANTE',
  'FINALIZACOES_FORA_ALVO_CASA','FINALIZACOES_FORA_ALVO_VISITANTE',
  'FINALIZACOES_BLOQUEADAS_CASA','FINALIZACOES_BLOQUEADAS_VISITANTE',
  'ESCANTEIOS_CASA','ESCANTEIOS_VISITANTE','POSSE_BOLA_CASA','POSSE_BOLA_VISITANTE',
  'PASSES_TOTAIS_CASA','PASSES_TOTAIS_VISITANTE','PASSES_CERTOS_CASA','PASSES_CERTOS_VISITANTE',
  'PASSES_LONGOS_CERTOS_CASA','PASSES_LONGOS_CERTOS_VISITANTE',
  'CRUZAMENTOS_CERTOS_CASA','CRUZAMENTOS_CERTOS_VISITANTE',
  'TOQUES_AREA_ADVERSARIA_CASA','TOQUES_AREA_ADVERSARIA_VISITANTE',
  'ENTRADAS_TERCO_FINAL_CASA','ENTRADAS_TERCO_FINAL_VISITANTE',
  'DESARMES_TOTAIS_CASA','DESARMES_TOTAIS_VISITANTE',
  'PCT_DESARMES_GANHOS_CASA','PCT_DESARMES_GANHOS_VISITANTE',
  'INTERCEPTACOES_CASA','INTERCEPTACOES_VISITANTE',
  'RECUPERACOES_BOLA_CASA','RECUPERACOES_BOLA_VISITANTE',
  'CORTES_CLEARANCES_CASA','CORTES_CLEARANCES_VISITANTE',
  'PCT_DUELOS_GANHOS_CASA','PCT_DUELOS_GANHOS_VISITANTE',
  'DESARMES_SOFRIDOS_CASA','DESARMES_SOFRIDOS_VISITANTE',
  'GOLS_SOFRIDOS_CASA','GOLS_SOFRIDOS_VISITANTE'
]);
const quote = value => encodeURIComponent(String(value));
const dateOnly = value => String(value ?? '').slice(0,10);
const split = value => {
  const p=String(value??'').split(' x ');
  return p.length===2?{home:p[0].trim(),away:p[1].trim()}:null;
};
export function createSupabaseHistoricalProvider({request}) {
  if(typeof request!=='function') throw new TypeError('É necessário injetar request de leitura.');
  return async function fetchHistory({team,context,beforeDate,field,limit,readOnly}) {
    if(readOnly!==true) throw new Error('Consulta histórica precisa ser explicitamente somente leitura.');
    if(!['CASA','FORA'].includes(String(context).toUpperCase())) throw new Error('Contexto histórico não suportado.');
    if(!FIELD_ALLOWLIST.has(String(field).toUpperCase())) throw new Error('Campo histórico fora da lista permitida.');
    if(!String(team??'').trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dateOnly(beforeDate))) throw new Error('Equipe ou data inválida para histórico.');
    const n=Number(limit);
    if(!Number.isSafeInteger(n)||n<1||n>100) throw new Error('Limite histórico inválido.');
    const pattern=String(context).toUpperCase()==='CASA' ? `%${team} x %` : `% x ${team}`;
    const path='jogos?select='+['id','"DATA"','"CONFRONTO"',`"${field}"`].map(quote).join(',')+
      '&%22DATA%22=lt.'+quote(dateOnly(beforeDate))+
      '&%22CONFRONTO%22=ilike.'+quote(pattern)+
      '&%22'+field+'%22=not.is.null&order='+quote('"DATA"')+'.desc,'+quote('id')+'.desc&limit='+n;
    const exactTeamRows = rows => rows.filter(row=>{
      const teams=split(row.CONFRONTO);
      const actual=String(context).toUpperCase()==='CASA'?teams?.home:teams?.away;
      return actual===String(team).trim() && dateOnly(row.DATA)<dateOnly(beforeDate) &&
        row[field]!=null && Number.isFinite(Number(row[field]));
    }).sort((a,b)=>dateOnly(b.DATA).localeCompare(dateOnly(a.DATA))||Number(b.id)-Number(a.id)).slice(0,n);
    const result=await request(path);
    if(!Array.isArray(result)) throw new Error('A consulta histórica retornou resposta inválida.');
    let matches=exactTeamRows(result);
    // If the exact ILIKE query returns too few matches, fall back to a broader
    // read-only query and match the team locally. This avoids false 'no history'
    // results caused by punctuation, whitespace, or URL pattern differences.
    if(matches.length<n){
      const fallbackPath='jogos?select='+['id','\"DATA\"','\"CONFRONTO\"', '\"'+field+'\"'].map(quote).join(',')+
        '&%22DATA%22=lt.'+quote(dateOnly(beforeDate))+
        '&%22'+field+'%22=not.is.null&order='+quote('\"DATA\"')+'.desc,'+quote('id')+'.desc&limit=5000';
      const fallback=await request(fallbackPath);
      if(!Array.isArray(fallback)) throw new Error('A consulta histórica alternativa retornou resposta inválida.');
      matches=exactTeamRows([...result,...fallback]);
    }
    return matches
  };
}
export const historicalProviderContract=Object.freeze({
  source:'public.jogos',
  methods:['GET'],
  writesToHistoricalGames:false,
  writesToPreAnalysisGames:false,
  fieldAllowlist:true
});
