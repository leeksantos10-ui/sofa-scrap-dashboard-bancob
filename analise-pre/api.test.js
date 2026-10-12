import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreAnalysisApi } from './api.js';

function fixture(overrides={}, filterActive=true) {
  const calls=[];
  const games=[{id:7,confronto:'A x B',campeonato:'Liga',status:'pendente'}];
  const store={
    list:async()=>games,
    importRows:async rows=>({inserted:rows.length}),
    deleteChampionship:async(name,confirmed)=>({deleted:confirmed?1:0,campeonato:name}),
    ...overrides.store
  };
  const request=async path=> {
    calls.push(path);
    if(path.startsWith('filtros?')) return [{id:3,nome:'Filtro teste',ativo:filterActive}];
    if(path.startsWith('filtro_nos?')) return [{id:4,filtro_id:3,tipo:'CONDICAO',metrica_id:9}];
    if(path.startsWith('filtro_condicoes?')) return [{no_id:4,metrica_id:9,operador:'>',valor:1}];
    if(path.startsWith('filtro_nos_relacoes?')) return [];
    throw new Error('Rota de leitura não autorizada no teste: '+path);
  };
  return {api:createPreAnalysisApi({store,request,...overrides.api}),calls,games};
}

test('consulta filtros sem executar mutações', async()=>{
  const {api,calls}=fixture();
  const filters=await api.listSavedFilters();
  assert.equal(filters[0].nome,'Filtro teste');
  assert.equal(filters[0].nos.length,1);
  assert.equal(filters[0].condicoes.length,1);
  assert.deepEqual(filters[0].relacoes,[]);
  assert.ok(calls.every(path=>!/(POST|PATCH|DELETE)/i.test(path)));
});

test('importação exige confirmação explícita e fica pendente',async()=>{
  const {api}=fixture();
  await assert.rejects(()=>api.importGames([{confronto:'C x D'}],false),/confirme/i);
  assert.deepEqual(await api.importGames([{confronto:'C x D'}],true),{inserted:1,status:'pendente',source:'pre_analysis_games'});
});

test('sem motor real, não aprova nem muda o jogo',async()=>{
  const {api,games}=fixture();
  await assert.rejects(()=>api.applySavedFilter(7,3),/motor real/i);
  assert.equal(games[0].status,'pendente');
});

test('avaliador só retorna resultado para revisão e não persiste status',async()=>{
  const {api,games}=fixture({api:{evaluateFilter:async({game,filter})=>({passed:true,reasons:['teste controlado']})}});
  const result=await api.applySavedFilter(7,3);
  assert.equal(result.passed,true);
  assert.equal(result.persisted,false);
  assert.equal(games[0].status,'pendente');
});

test('IDs inválidos são recusados',async()=>{
  const {api}=fixture();
  await assert.rejects(()=>api.applySavedFilter('7 OR 1=1',3),/ID inválido/i);
});

test('filtro inativo não pode ser avaliado',async()=>{
  const {api}=fixture({api:{evaluateFilter:async()=>({passed:true,reasons:[]})}},false);
  await assert.rejects(()=>api.applySavedFilter(7,3),/filtro salvo está inativo/i);
});
