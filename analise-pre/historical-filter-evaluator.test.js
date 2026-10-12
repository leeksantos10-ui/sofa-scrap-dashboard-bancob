import test from 'node:test';
import assert from 'node:assert/strict';
import {createHistoricalFilterEvaluator} from './historical-filter-evaluator.js';

test('integra filtro salvo com métricas CASA sem gravar resultado',async()=>{
 const calls=[];
 const request=async path=>{
  calls.push(path);
  if(path.startsWith('metricas_config?')) return [{id:1,campo:'GOLS_CASA_FT',contexto:'CASA',janela_jogos:3,minimo_jogos:2,operacao:'MEDIA',ativa:true,formula:{tipo:'NORMAL',campo:'GOLS_CASA_FT'}}];
  if(path.startsWith('jogos?')) return [
   {id:20,DATA:'2026-10-09',CONFRONTO:'Time A x Time X',GOLS_CASA_FT:3},
   {id:19,DATA:'2026-10-08',CONFRONTO:'Time A x Time Y',GOLS_CASA_FT:2}
  ];
  throw new Error('Endpoint não permitido no teste: '+path);
 };
 const evaluate=createHistoricalFilterEvaluator({request});
 const filter={id:1,ativo:true,nos:[{id:10,tipo:'GRUPO',operador_logico:'E',ordem:0},{id:11,tipo:'CONDICAO',ordem:1}],condicoes:[{id:5,no_id:11,metrica_id:1,operador:'>=',valor:2.4}],relacoes:[{no_pai_id:10,no_filho_id:11,ordem:0}]};
 const result=await evaluate({game:{data:'2026-10-10',confronto:'Time A x Time Z'},filter,readOnlyRequest:request});
 assert.equal(result.passed,true);
 assert.equal(result.persisted,false);
 assert.equal(result.engine,'historical-read-only-v1');
 assert.equal(calls.some(x=>x.startsWith('pre_analysis_games')),false);
 assert.equal(calls.some(x=>x.startsWith('jogos?')),true);
});

test('falha fechado para métricas que ainda não foram validadas',async()=>{
 const request=async path=>{
  if(path.startsWith('metricas_config?')) return [{id:2,campo:'RATING_CASA',contexto:'GERAL',janela_jogos:5,minimo_jogos:3,operacao:'MEDIA',ativa:true,formula:{tipo:'NORMAL',campo:'RATING_CASA'}}];
  throw new Error('Não deveria consultar histórico para GERAL');
 };
 const evaluate=createHistoricalFilterEvaluator({request});
 const filter={id:1,ativo:true,nos:[{id:10,tipo:'CONDICAO'}],condicoes:[{id:1,no_id:10,metrica_id:2,operador:'>',valor:5}],relacoes:[]};
 await assert.rejects(()=>evaluate({game:{data:'2026-10-10',confronto:'A x B'},filter,readOnlyRequest:request}),/não suportado/);
});
