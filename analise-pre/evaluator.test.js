import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateFilterTree} from './evaluator.js';

const game={id:12,data:'2026-10-12',confronto:'Time A x Time B'};
const leaf=(id,metrica_id,operador,valor)=>({id,filtro_id:3,tipo:'CONDICAO',metrica_id,ordem:id});
const cond=(no_id,metrica_id,operador,valor,extra={})=>({no_id,metrica_id,operador,valor,...extra});

test('avalia condição numérica com métrica resolvida pelo adaptador',async()=>{
 const result=await evaluateFilterTree({
  game,filter:{ativo:true,nos:[leaf(1,10,'>=',2)],condicoes:[cond(1,10,'>=',2)]},
  resolveMetric:async({metricId})=>metricId===10?2.5:null
 });
 assert.equal(result.passed,true);
 assert.match(result.reasons[0],/condição atendida/);
});

test('avalia grupo E e OU seguindo as relações e ordem',async()=>{
 const filter={ativo:true,nos:[
  {id:1,tipo:'GRUPO',operador_logico:'E',ordem:1},
  {id:2,tipo:'CONDICAO',metrica_id:10,ordem:1},
  {id:3,tipo:'GRUPO',operador_logico:'OU',ordem:2},
  {id:4,tipo:'CONDICAO',metrica_id:11,ordem:1},
  {id:5,tipo:'CONDICAO',metrica_id:12,ordem:2}
 ],condicoes:[cond(2,10,'>',1),cond(4,11,'>',5),cond(5,12,'>',5)],
 relacoes:[{no_pai_id:1,no_filho_id:2,ordem:1},{no_pai_id:1,no_filho_id:3,ordem:2},{no_pai_id:3,no_filho_id:4,ordem:1},{no_pai_id:3,no_filho_id:5,ordem:2}]};
 const result=await evaluateFilterTree({game,filter,resolveMetric:async({metricId})=>({10:2,11:3,12:7})[metricId]});
 assert.equal(result.passed,true);
 assert.equal(result.evaluatedRoots,1);
});

test('comparação com outra métrica aplica percentual configurado',async()=>{
 const result=await evaluateFilterTree({
  game,filter:{ativo:true,nos:[leaf(1,10,'>',0)],condicoes:[cond(1,10,'>',0,{metrica_comparada_id:11,percentual:10})]},
  resolveMetric:async({metricId})=>({10:11,11:10})[metricId]
 });
 assert.equal(result.passed,false);
 assert.match(result.reasons[0],/11 > 11/);
});

test('valor histórico ausente reprova sem inventar valor',async()=>{
 const result=await evaluateFilterTree({
  game,filter:{ativo:true,nos:[leaf(1,10,'>',0)],condicoes:[cond(1,10,'>',0)]},
  resolveMetric:async()=>null
 });
 assert.equal(result.passed,false);
 assert.match(result.reasons[0],/sem valor histórico suficiente/);
});

test('bloqueia filtro inativo e árvore cíclica',async()=>{
 await assert.rejects(()=>evaluateFilterTree({game,filter:{ativo:false,nos:[leaf(1,10,'>',0)],condicoes:[]},resolveMetric:async()=>1}),/inativo/i);
 await assert.rejects(()=>evaluateFilterTree({game,filter:{ativo:true,nos:[{id:1,tipo:'GRUPO'}],condicoes:[],relacoes:[{no_pai_id:1,no_filho_id:1}]},resolveMetric:async()=>1}),/autorreferência|ciclo/i);
});
