import test from 'node:test';
import assert from 'node:assert/strict';
import {createPreAnalysisStore,preAnalysisStorageContract} from './store.js';

test('store usa somente tabela temporária',async()=>{
 const calls=[];
 const store=createPreAnalysisStore({request:async(path,options={})=>{calls.push({path,options});return {ok:true,data:[]}}});
 await store.list();
 assert.match(calls[0].path,/^pre_analysis_games\?/);
 assert.equal(calls.some(c=>/\bjogos\b/.test(c.path)),false);
 assert.equal(preAnalysisStorageContract.mayWriteDefinitiveGames,false);
});

test('importação valida e grava em lotes',async()=>{
 const calls=[];
 const store=createPreAnalysisStore({request:async(path,options={})=>{calls.push({path,options});return {ok:true,data:options.body||[]}}});
 const result=await store.importRows([{confronto:'A x B',campeonato:'Liga'}]);
 assert.equal(result.inserted,1);
 assert.equal(calls[0].path,'pre_analysis_games');
 assert.equal(calls[0].options.method,'POST');
 assert.equal(calls[0].options.body[0].status,'pendente');
});

test('exclusão exige confirmação e campeonato exato',async()=>{
 let callCount=0;
 const store=createPreAnalysisStore({request:async()=>{callCount++;return {ok:true,data:[]}}});
 await assert.rejects(store.deleteChampionship('Liga',false),/confirmação explícita/i);
 assert.equal(callCount,0);
 await store.deleteChampionship('Liga & Copa',true);
 assert.equal(callCount,1);
});
