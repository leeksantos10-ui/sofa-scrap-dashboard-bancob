import test from 'node:test';
import assert from 'node:assert/strict';
import {createSimpleHistoricalMetricResolver} from './simple-historical-metric-resolver.js';

const game={data:'2026-10-10',confronto:'Time A x Time B'};
const baseConfig={id:1,ativa:true,campo:'GOLS_CASA_FT',contexto:'CASA',janela_jogos:5,minimo_jogos:3,operacao:'MEDIA',formula:{tipo:'NORMAL',campo:'GOLS_CASA_FT'}};
const rows=[
 {DATA:'2026-10-09',CONFRONTO:'Time A x Time C',GOLS_CASA_FT:2},
 {DATA:'2026-10-08',CONFRONTO:'Time A x Time D',GOLS_CASA_FT:1},
 {DATA:'2026-10-07',CONFRONTO:'Time A x Time E',GOLS_CASA_FT:3},
 {DATA:'2026-10-06',CONFRONTO:'Time A x Time F',GOLS_CASA_FT:4},
 {DATA:'2026-10-10',CONFRONTO:'Time A x Time G',GOLS_CASA_FT:100}
];

test('calcula média somente com jogos anteriores e respeita janela',async()=>{
 let args;
 const resolve=createSimpleHistoricalMetricResolver({
  getMetricConfig:async id=>({...baseConfig,id}),
  fetchHistory:async input=>(args=input,rows)
 });
 assert.equal(await resolve({metricId:1,game}),2.5);
 assert.equal(args.team,'Time A');
 assert.equal(args.context,'CASA');
 assert.equal(args.beforeDate,'2026-10-10');
 assert.equal(args.field,'GOLS_CASA_FT');
 assert.equal(args.readOnly,true);
});

test('mapeia campo casa para visitante no contexto FORA',async()=>{
 const config={...baseConfig,campo:'RATING_CASA',contexto:'FORA',formula:{tipo:'NORMAL',campo:'RATING_CASA'}};
 let args;
 const resolve=createSimpleHistoricalMetricResolver({
  getMetricConfig:async()=>config,
  fetchHistory:async input=>(args=input,[
   {DATA:'2026-10-09',CONFRONTO:'Time C x Time B',RATING_VISITANTE:6},
   {DATA:'2026-10-08',CONFRONTO:'Time D x Time B',RATING_VISITANTE:8},
   {DATA:'2026-10-07',CONFRONTO:'Time E x Time B',RATING_VISITANTE:7}
  ])
 });
 assert.equal(await resolve({metricId:1,game}),7);
 assert.equal(args.team,'Time B');
 assert.equal(args.field,'RATING_VISITANTE');
});

test('retorna null quando não atinge amostra mínima',async()=>{
 const resolve=createSimpleHistoricalMetricResolver({
  getMetricConfig:async()=>baseConfig,
  fetchHistory:async()=>rows.slice(0,2)
 });
 assert.equal(await resolve({metricId:1,game}),null);
});

test('bloqueia GERAL, CV, compostas e custo por ponto',async()=>{
 for(const config of [
  {...baseConfig,contexto:'GERAL'},
  {...baseConfig,operacao:'CV'},
  {...baseConfig,campo:'CUSTO_PONTO',formula:{tipo:'CUSTO_PONTO'}},
  {...baseConfig,formula:{tipo:'COMPOSTA'}}
 ]) {
  const resolve=createSimpleHistoricalMetricResolver({getMetricConfig:async()=>config,fetchHistory:async()=>rows});
  await assert.rejects(()=>resolve({metricId:1,game}),/não validada|não suportado|não permitido/i);
 }
});

test('bloqueia campo inválido e data inválida',async()=>{
 const invalidField=createSimpleHistoricalMetricResolver({getMetricConfig:async()=>({...baseConfig,campo:'DATA;delete',formula:{tipo:'NORMAL',campo:'DATA;delete'}}),fetchHistory:async()=>rows});
 await assert.rejects(()=>invalidField({metricId:1,game}),/Campo de métrica/);
 const valid=createSimpleHistoricalMetricResolver({getMetricConfig:async()=>baseConfig,fetchHistory:async()=>rows});
 await assert.rejects(()=>valid({metricId:1,game:{...game,data:'ontem'}}),/Data inválida/);
});
