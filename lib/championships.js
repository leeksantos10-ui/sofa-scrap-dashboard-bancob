/**
 * Championship configuration and historical standings helpers.
 * Pure functions: no DB access and no mutation of Banco B records.
 */
const DEFAULT_POINTS = { win: 3, draw: 1, loss: 0 };
const CONTEXTS = new Set(['GERAL', 'CASA', 'VISITANTE']);

const aliases = {
  date: ['DATA', 'data', 'DATE', 'date', 'DATETIME', 'datetime'],
  home: ['MANDANTE', 'mandante', 'HOME', 'home', 'HOME_TEAM', 'home_team', 'homeTeam'],
  away: ['VISITANTE', 'visitante', 'AWAY', 'away', 'AWAY_TEAM', 'away_team', 'awayTeam'],
  homeGoals: ['GOLS_CASA_FT', 'gols_casa_ft', 'HOME_GOALS', 'home_goals', 'PLACAR_CASA', 'homeGoals', 'home_goals_ft'],
  awayGoals: ['GOLS_VISITANTE_FT', 'gols_visitante_ft', 'AWAY_GOALS', 'away_goals', 'PLACAR_VISITANTE', 'awayGoals', 'away_goals_ft'],
  round: ['RODADA', 'rodada', 'ROUND', 'round']
};
const read = (obj, keys) => { for (const k of keys) if (obj?.[k] != null && obj[k] !== '') return obj[k]; return null; };
const val = (obj, key) => read(obj, aliases[key]);
const asNumber = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };
const parseDate = (v) => { if (v == null) return null; const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; };
const matchDate = (m) => parseDate(val(m, 'date'));
const teamName = (v) => String(v ?? '').trim();

export function normalizeChampionshipConfig(config = {}) {
  const totalRounds = Number(config.totalRounds ?? config.total_rodadas);
  const windowSize = config.windowSize ?? config.janela_jogos ?? null;
  return {
    totalRounds: Number.isInteger(totalRounds) && totalRounds > 0 ? totalRounds : null,
    points: {
      win: Number(config.points?.win ?? config.pontos_vitoria ?? DEFAULT_POINTS.win),
      draw: Number(config.points?.draw ?? config.pontos_empate ?? DEFAULT_POINTS.draw),
      loss: Number(config.points?.loss ?? config.pontos_derrota ?? DEFAULT_POINTS.loss)
    },
    tieBreakers: Array.isArray(config.tieBreakers ?? config.desempates)
      ? [...(config.tieBreakers ?? config.desempates)] : ['goalDifference', 'goalsFor', 'wins'],
    context: CONTEXTS.has(String(config.context ?? config.contexto ?? 'GERAL').toUpperCase())
      ? String(config.context ?? config.contexto ?? 'GERAL').toUpperCase() : 'GERAL',
    windowSize: windowSize == null || windowSize === '' || Number(windowSize) <= 0
      ? null : Math.floor(Number(windowSize))
  };
}

function applyContext(matches, team, context) {
  if (context === 'CASA') return matches.filter(m => teamName(val(m,'home')) === team);
  if (context === 'VISITANTE') return matches.filter(m => teamName(val(m,'away')) === team);
  return matches.filter(m => teamName(val(m,'home')) === team || teamName(val(m,'away')) === team);
}
function calculateTeamRow(matches, team, points) {
  const row = { team, played:0, wins:0, draws:0, losses:0, goalsFor:0, goalsAgainst:0, points:0 };
  for (const m of matches) {
    const h=teamName(val(m,'home')), a=teamName(val(m,'away'));
    const hg=asNumber(val(m,'homeGoals')), ag=asNumber(val(m,'awayGoals'));
    if (!h || !a || hg == null || ag == null) continue;
    const isHome=h===team; const isAway=a===team; if (!isHome && !isAway) continue;
    row.played++; row.goalsFor += isHome?hg:ag; row.goalsAgainst += isHome?ag:hg;
    if (hg===ag) { row.draws++; row.points+=points.draw; }
    else if ((isHome && hg>ag)||(isAway && ag>hg)) { row.wins++; row.points+=points.win; }
    else row.losses++;
  }
  row.goalDifference=row.goalsFor-row.goalsAgainst;
  row.winRate=row.played ? row.wins/row.played*100 : 0;
  row.pointsPerGame=row.played ? row.points/row.played : 0;
  return row;
}
const tieValue = (row, key) => ({
  points:row.points, wins:row.wins, goalDifference:row.goalDifference,
  goalsFor:row.goalsFor, goalsAgainst:row.goalsAgainst, losses:row.losses,
  winRate:row.winRate, pointsPerGame:row.pointsPerGame
}[key] ?? 0);
export function buildHistoricalStandings(allMatches, fixture, config = {}) {
  const cfg=normalizeChampionshipConfig(config);
  const context=String(config.context ?? config.contexto ?? cfg.context).toUpperCase();
  const date=matchDate(fixture), round=asNumber(val(fixture,'round'));
  const home=teamName(val(fixture,'home')), away=teamName(val(fixture,'away'));
  // A game is usable only if it is demonstrably earlier than the target fixture.
  let prior=allMatches.filter(m => {
    if (m===fixture) return false;
    const d=matchDate(m); if (!date || !d || d.getTime()>=date.getTime()) return false;
    return true;
  });
  if (round != null) prior=prior.filter(m => asNumber(val(m,'round'))==null || asNumber(val(m,'round'))<round);
  const points=cfg.points;
  const teamRows={};
  for (const team of new Set([home,away].filter(Boolean))) {
    let eligible=applyContext(prior,team,context);
    eligible.sort((a,b)=>(matchDate(b)?.getTime()??0)-(matchDate(a)?.getTime()??0));
    if (cfg.windowSize) eligible=eligible.slice(0,cfg.windowSize);
    teamRows[team]=calculateTeamRow(eligible,team,points);
  }
  const sorted=Object.values(teamRows).sort((a,b)=>{
    if (b.points!==a.points) return b.points-a.points;
    for (const criterion of cfg.tieBreakers) { const diff=tieValue(b,criterion)-tieValue(a,criterion); if (diff) return diff; }
    return a.team.localeCompare(b.team);
  });
  sorted.forEach((r,i)=>r.position=i+1);
  return { context, windowSize:cfg.windowSize, standings:sorted,
    home:teamRows[home]??null, away:teamRows[away]??null,
    pointsDifference:(teamRows[home]?.points??0)-(teamRows[away]?.points??0),
    positionDifference:(teamRows[home]?.position??0)-(teamRows[away]?.position??0) };
}
export function getExcludedFinalRounds(totalRounds, count) {
  const total=Number(totalRounds), n=Number(count);
  if (!Number.isInteger(total)||total<=0||!Number.isInteger(n)||n<=0) return [];
  const start=Math.max(1,total-n+1);
  return Array.from({length:total-start+1},(_,i)=>start+i);
}
export function isRoundEligible(round, config = {}) {
  const r=Number(round); if (!Number.isInteger(r)||r<=0) return false;
  const start=Number(config.entryFromRound ?? config.inicio_entrada ?? 1);
  const excluded=new Set((config.excludedRounds ?? config.rodadas_excluidas ?? []).map(Number));
  const ranges=config.excludedRanges ?? config.intervalos_excluidos ?? [];
  const finals=getExcludedFinalRounds(config.totalRounds ?? config.total_rodadas,config.excludeFinalRounds ?? config.excluir_ultimas ?? 0);
  return r>=start&&!excluded.has(r)&&!finals.includes(r)&&!ranges.some(x=>r>=Number(x.from??x.inicio)&&r<=Number(x.to??x.fim));
}

/**
 * Full historical table for a competition-season at a cutoff fixture.
 * Caller must supply matches scoped to the same competition and season.
 */
export function buildStandingsTable(allMatches, cutoffFixture, config = {}) {
  const cfg = normalizeChampionshipConfig(config);
  const cutoffDate = matchDate(cutoffFixture);
  const cutoffRound = asNumber(val(cutoffFixture, 'round'));
  if (!cutoffDate) return { context: cfg.context, standings: [], error: 'Data de corte inválida.' };
  let prior = allMatches.filter(m => {
    if (m === cutoffFixture) return false;
    const d = matchDate(m);
    if (!d || d.getTime() >= cutoffDate.getTime()) return false;
    if (cutoffRound != null) {
      const r = asNumber(val(m, 'round'));
      if (r != null && r >= cutoffRound) return false;
    }
    return asNumber(val(m, 'homeGoals')) != null && asNumber(val(m, 'awayGoals')) != null;
  });
  const teams = new Set();
  prior.forEach(m => { const h=teamName(val(m,'home')), a=teamName(val(m,'away')); if(h)teams.add(h); if(a)teams.add(a); });
  const table = [];
  for (const team of teams) {
    let matches = applyContext(prior, team, cfg.context);
    matches.sort((a,b)=>(matchDate(b)?.getTime()??0)-(matchDate(a)?.getTime()??0));
    if (cfg.windowSize) matches = matches.slice(0, cfg.windowSize);
    table.push(calculateTeamRow(matches, team, cfg.points));
  }
  table.sort((a,b)=>{
    if (b.points!==a.points) return b.points-a.points;
    for (const criterion of cfg.tieBreakers) {
      const d=tieValue(b,criterion)-tieValue(a,criterion);
      if (d) return d;
    }
    return a.team.localeCompare(b.team);
  });
  table.forEach((r,i)=>r.position=i+1);
  return { context: cfg.context, windowSize: cfg.windowSize, standings: table };
}
export function compareStandingsPoints(homeRow, awayRow, operator = '>=', threshold = 0) {
  const diff = (Number(homeRow?.points)||0) - (Number(awayRow?.points)||0);
  const limit = Number(threshold)||0;
  const valid = homeRow != null && awayRow != null;
  return { valid, homePoints:homeRow?.points??null, awayPoints:awayRow?.points??null,
    difference:valid?diff:null,
    passed:valid?({'>=':diff>=limit,'>':diff>limit,'<=':diff<=limit,'<':diff<limit,'==':diff===limit,'!=':diff!==limit}[operator.trim()]??false):false };
}
