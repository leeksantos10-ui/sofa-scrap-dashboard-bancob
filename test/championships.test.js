import test from 'node:test';
import assert from 'node:assert/strict';
import {getExcludedFinalRounds,isRoundEligible,normalizeChampionshipConfig,buildStandingsTable,compareStandingsPoints} from '../lib/championships.js';
test('final rounds are derived from configured total, not imported maximum',()=>assert.deepEqual(getExcludedFinalRounds(38,4),[35,36,37,38]));
test('final rounds adapt for different competition lengths',()=>assert.deepEqual(getExcludedFinalRounds(46,4),[43,44,45,46]));
test('round eligibility separates entry rules',()=>{assert.equal(isRoundEligible(5,{entryFromRound:5,totalRounds:38,excludeFinalRounds:4}),true);assert.equal(isRoundEligible(35,{entryFromRound:5,totalRounds:38,excludeFinalRounds:4}),false);});
test('season window defaults to whole season',()=>assert.equal(normalizeChampionshipConfig({}).windowSize,null));

test('comparison helper supports numeric point-gap threshold',()=>{
  assert.equal(compareStandingsPoints({points:12},{points:7},'>=',5).passed,true);
  assert.equal(compareStandingsPoints({points:12},{points:7},'>',5).passed,false);
  assert.equal(compareStandingsPoints({points:12},{points:7},'>',4).passed,true);
});
test('historical table includes only earlier fixtures and ranks all teams',()=>{
  const matches=[
    {date:'2026-01-01',home_team:'A',away_team:'B',home_goals:2,away_goals:0,round:1},
    {date:'2026-01-02',home_team:'C',away_team:'A',home_goals:1,away_goals:1,round:1},
    {date:'2026-01-03',home_team:'B',away_team:'C',home_goals:0,away_goals:2,round:1},
    {date:'2026-01-10',home_team:'A',away_team:'C',home_goals:0,away_goals:0,round:2}
  ];
  const table=buildStandingsTable(matches,matches[3],{context:'GERAL'});
  assert.equal(table.standings.length,3);
  assert.equal(table.standings[0].team,'A');
  assert.equal(table.standings[0].points,4);
  assert.equal(table.standings[0].position,1);
});

test('context CASA counts only home matches for each team',()=>{
 const matches=[
  {date:'2026-01-01',home_team:'A',away_team:'B',home_goals:2,away_goals:0,round:1},
  {date:'2026-01-02',home_team:'C',away_team:'A',home_goals:1,away_goals:1,round:1},
  {date:'2026-01-03',home_team:'B',away_team:'C',home_goals:0,away_goals:2,round:1},
  {date:'2026-01-10',home_team:'A',away_team:'C',home_goals:0,away_goals:0,round:2}
 ];
 const table=buildStandingsTable(matches,matches[3],{context:'CASA'});
 const a=table.standings.find(x=>x.team==='A');
 assert.equal(a.played,1);
 assert.equal(a.points,3);
});
test('window size limits the historical sample',()=>{
 const matches=[
  {date:'2026-01-01',home_team:'A',away_team:'B',home_goals:3,away_goals:0,round:1},
  {date:'2026-01-02',home_team:'A',away_team:'C',home_goals:0,away_goals:2,round:2},
  {date:'2026-01-10',home_team:'A',away_team:'D',home_goals:1,away_goals:0,round:3}
 ];
 const table=buildStandingsTable(matches,matches[2],{context:'CASA',windowSize:1});
 const a=table.standings.find(x=>x.team==='A');
 assert.equal(a.played,1);
 assert.equal(a.points,0);
});
test('unknown and excluded rounds are not eligible for betting',()=>{
 assert.equal(isRoundEligible(0,{entryFromRound:1}),false);
 assert.equal(isRoundEligible(4,{entryFromRound:5}),false);
 assert.equal(isRoundEligible(6,{excludedRounds:[6]}),false);
 assert.equal(isRoundEligible(8,{excludedRanges:[{from:7,to:9}]}),false);
});
