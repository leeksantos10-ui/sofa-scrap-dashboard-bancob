import test from 'node:test';
import assert from 'node:assert/strict';
import {createHistoricalFilterEvaluator} from './historical-evaluator.js';

test('não cria avaliador sem resolvedor histórico real',()=>{
 assert.throws(()=>createHistoricalFilterEvaluator({}),/resolvedor de métricas históricas validado/i);
});

test('exige data e confronto para impedir contexto histórico ambíguo',async()=>{
 const evaluate=createHistoricalFilterEvaluator({resolveMetric:async()=>1});
 await assert.rejects(()=>evaluate({game:{confronto:'A x B'},filter:{ativo:true,nos:[],condicoes:[]}}),/data e confronto/i);
});

test('delega árvore ao resolvedor injetado e não persiste resultado',async()=>{
 const evaluate=createHistoricalFilterEvaluator({resolveMetric:async({metricId,game})=>{
  assert.equal(game.confronto,'A x B');
  return metricId===10?3:null;
 }});
 const result=await evaluate({
  game:{data:'2026-10-12',confronto:'A x B'},
  filter:{ativo:true,nos:[{id:1,tipo:'CONDICAO',metrica_id:10}],condicoes:[{no_id:1,metrica_id:10,operador:'>',valor:2}]}
 });
 assert.equal(result.passed,true);
 assert.equal(result.persisted,undefined);
});
