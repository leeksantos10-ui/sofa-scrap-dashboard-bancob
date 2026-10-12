import test from 'node:test';
import assert from 'node:assert/strict';
import {createSupabaseHistoricalProvider} from './supabase-historical-provider.js';

test('consulta histórico CASA com GET, campo permitido e data estritamente anterior',async()=>{
 let requested='';
 const provider=createSupabaseHistoricalProvider({request:async path=>{
  requested=path;
  return [
   {id:3,DATA:'2026-10-09',CONFRONTO:'Time A x Time C',GOLS_CASA_FT:2},
   {id:2,DATA:'2026-10-10',CONFRONTO:'Time A x Time D',GOLS_CASA_FT:9},
   {id:1,DATA:'2026-10-08',CONFRONTO:'Outro x Time A',GOLS_CASA_FT:100}
  ].filter(x=>x.DATA<'2026-10-10');
 }});
 const rows=await provider({team:'Time A',context:'CASA',beforeDate:'2026-10-10',field:'GOLS_CASA_FT',limit:5,readOnly:true});
 assert.equal(rows.length,1);
 assert.equal(rows[0].id,3);
 assert.match(requested,/jogos\?/);
 assert.match(requested,/CONFRONTO/);
 assert.match(requested,/GOLS_CASA_FT/);
 assert.match(requested,/lt\./);
});

test('FORA só devolve jogos em que a equipe está fora',async()=>{
 const provider=createSupabaseHistoricalProvider({request:async()=>[
  {id:2,DATA:'2026-10-09',CONFRONTO:'Time C x Time B',RATING_VISITANTE:7},
  {id:1,DATA:'2026-10-09',CONFRONTO:'Time B x Time C',RATING_VISITANTE:100}
 ]});
 const rows=await provider({team:'Time B',context:'FORA',beforeDate:'2026-10-10',field:'RATING_VISITANTE',limit:5,readOnly:true});
 assert.deepEqual(rows.map(x=>x.id),[2]);
});

test('bloqueia escrita, campos arbitrários e limite inválido',async()=>{
 let called=0;
 const provider=createSupabaseHistoricalProvider({request:async()=>{called++;return []}});
 await assert.rejects(()=>provider({team:'A',context:'CASA',beforeDate:'2026-10-10',field:'DATA;delete',limit:5,readOnly:true}),/lista permitida/);
 await assert.rejects(()=>provider({team:'A',context:'CASA',beforeDate:'2026-10-10',field:'GOLS_CASA_FT',limit:5,readOnly:false}),/somente leitura/);
 await assert.rejects(()=>provider({team:'A',context:'CASA',beforeDate:'2026-10-10',field:'GOLS_CASA_FT',limit:500,readOnly:true}),/Limite/);
 assert.equal(called,0);
});
