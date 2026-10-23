/**
 * Contrato de segurança para persistência da Análise Pré.
 * Este módulo só recebe um cliente PostgREST injetado; não lê variáveis de ambiente,
 * não inicializa cliente global e não importa a lógica do Dashboard.
 */
const TABLE='pre_analysis_games';
const MAX_BATCH=500;
const MAX_TOTAL=5000;
const safeText=(value,max=300)=>String(value??'').trim().slice(0,max);
const normalizePart=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ').replace(/\s*(?:vs?\.?|x|–|—)\s*/g,' x ');
const gameKey=g=>[g.data,g.campeonato,g.temporada,g.rodada,normalizePart(g.confronto)].map(v=>String(v??'').trim().toLowerCase()).join('|');

export function createPreAnalysisStore({request}) {
  if(typeof request!=='function') throw new TypeError('É necessário injetar uma função request para o banco.');
  async function call(path,options={}) {
    const response=await request(path,options);
    if(!response || response.ok!==true) {
      const detail=response?.error?String(response.error):'Falha ao acessar armazenamento temporário.';
      throw new Error(detail);
    }
    return response.data;
  }
  return Object.freeze({
    async list() {
      const data=await call(TABLE+'?select=id,data,confronto,campeonato,temporada,rodada,odds,dados_importados,status,criado_em&order=campeonato.asc,data.asc,id.asc');
      if(!Array.isArray(data)) throw new Error('Resposta inválida ao listar jogos preliminares.');
      return data;
    },
    async importRows(rows) {
      if(!Array.isArray(rows)||!rows.length) throw new Error('Nenhum jogo válido para importar.');
      if(rows.length>MAX_TOTAL) throw new Error('Importe no máximo 5.000 jogos por arquivo.');
      const payload=rows.map((row,i)=>{
        const confronto=safeText(row?.confronto);
        if(!confronto) throw new Error('Jogo '+(i+1)+': confronto obrigatório.');
        return {
          data:row.data||null, confronto,
          campeonato:safeText(row.campeonato||'Sem campeonato')||'Sem campeonato',
          temporada:row.temporada?safeText(row.temporada,80):null,
          rodada:row.rodada!==null&&row.rodada!==undefined&&String(row.rodada).trim()!==''&&Number.isSafeInteger(Number(row.rodada))?Number(row.rodada):null,
          odds:row.odds&&typeof row.odds==='object'&&!Array.isArray(row.odds)?row.odds:{},
          dados_importados:row.dados_importados&&typeof row.dados_importados==='object'&&!Array.isArray(row.dados_importados)?row.dados_importados:{},
          status:'pendente'
        };
      });
      const existing=await this.list();
      const seen=new Set(existing.map(gameKey));
      const unique=[];let skipped=0;
      for(const row of payload){const key=gameKey(row);if(seen.has(key)){skipped++;continue}seen.add(key);unique.push(row)}
      let inserted=0;
      for(let i=0;i<unique.length;i+=MAX_BATCH) {
        const batch=unique.slice(i,i+MAX_BATCH);
        const data=await call(TABLE,{method:'POST',body:batch,prefer:'return=representation'});
        inserted+=Array.isArray(data)?data.length:batch.length;
      }
      return {inserted,skipped,received:payload.length};
    },
    async deleteDay(day,confirmed) {
      const exact=safeText(day,20);
      if(!confirmed) throw new Error('Exclusão cancelada: confirme a operação explicitamente.');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(exact)) throw new Error('Informe uma data válida (AAAA-MM-DD).');
      const data=await call(TABLE+'?data=eq.'+encodeURIComponent(exact),{method:'DELETE',prefer:'return=representation'});
      return {deleted:Array.isArray(data)?data.length:0,data:exact};
    },
    async removeDuplicates(confirmed) {
      if(!confirmed) throw new Error('Remoção cancelada: confirme a operação explicitamente.');
      const games=await this.list(),seen=new Set(),ids=[];
      for(const g of games.slice().sort((a,b)=>Number(a.id)-Number(b.id))){const key=gameKey(g);if(seen.has(key))ids.push(Number(g.id));else seen.add(key)}
      for(const id of ids) await call(TABLE+'?id=eq.'+encodeURIComponent(id),{method:'DELETE',prefer:'return=minimal'});
      return {deleted:ids.length,remaining:games.length-ids.length};
    },
    async clearEvaluationsForDay(day, filterId, confirmed) {
      const exact=safeText(day,20), fid=Number(filterId);
      if(!confirmed) throw new Error('Limpeza cancelada: confirme a operação explicitamente.');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(exact)) throw new Error('Informe uma data válida (AAAA-MM-DD).');
      if(!Number.isSafeInteger(fid)||fid<=0) throw new Error('Selecione um filtro válido.');
      const games=await this.list();
      const matches=games.filter(game=>String(game.data||'').slice(0,10)===exact);
      let cleared=0;
      for(const game of matches){
        const imported=game.dados_importados&&typeof game.dados_importados==='object'&&!Array.isArray(game.dados_importados)?game.dados_importados:{};
        const previous=imported._pre_analysis_evaluations&&typeof imported._pre_analysis_evaluations==='object'?imported._pre_analysis_evaluations:{};
        if(!Object.prototype.hasOwnProperty.call(previous,String(fid))) continue;
        const evaluations={...previous}; delete evaluations[String(fid)];
        const nextImported={...imported};
        if(Object.keys(evaluations).length) nextImported._pre_analysis_evaluations=evaluations; else delete nextImported._pre_analysis_evaluations;
        await call(TABLE+'?id=eq.'+encodeURIComponent(game.id),{method:'PATCH',body:{dados_importados:nextImported},prefer:'return=minimal'});
        cleared++;
      }
      return {cleared,data:exact,filterId:fid,matchedGames:matches.length};
    },
    async saveEvaluation(game, filterId, result) {
      const id=Number(game?.id), fid=Number(filterId);
      if(!Number.isSafeInteger(id)||id<=0||!Number.isSafeInteger(fid)||fid<=0) throw new Error('ID inválido ao salvar avaliação.');
      // Always merge with the latest persisted JSON, not the possibly stale game object
      // loaded before another filter's evaluation was saved.
      const latest=await call(TABLE+'?select=id,dados_importados&id=eq.'+encodeURIComponent(id)+'&limit=1');
      if(!Array.isArray(latest)||!latest.length) throw new Error('A partida temporária não foi encontrada para salvar a avaliação.');
      const imported=latest[0].dados_importados&&typeof latest[0].dados_importados==='object'&&!Array.isArray(latest[0].dados_importados)?latest[0].dados_importados:{};
      const previous=imported._pre_analysis_evaluations&&typeof imported._pre_analysis_evaluations==='object'?imported._pre_analysis_evaluations:{};
      const evaluations={...previous,[String(fid)]:{filterId:fid,passed:result.passed,evaluatable:result.evaluatable!==false,filterSignature:result.filterSignature||null,reasons:result.reasons,savedAt:new Date().toISOString()}};
      await call(TABLE+'?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:{dados_importados:{...imported,_pre_analysis_evaluations:evaluations}},prefer:'return=minimal'});
      return {persisted:true};
    },
    async deleteChampionship(championship,confirmed) {
      const exact=safeText(championship,300);
      if(!confirmed) throw new Error('Exclusão cancelada: confirmação explícita obrigatória.');
      if(!exact) throw new Error('Informe um campeonato válido.');
      // Nome passado como filtro PostgREST escapado como valor, nunca como trecho de query.
      const value=encodeURIComponent(exact).replace(/%20/g,'%20');
      const data=await call(TABLE+'?campeonato=eq.'+value,{method:'DELETE',prefer:'return=representation'});
      return {deleted:Array.isArray(data)?data.length:0,campeonato:exact};
    }
  });
}

export const preAnalysisStorageContract=Object.freeze({
  table:TABLE,
  maxBatch:MAX_BATCH,
  maxTotal:MAX_TOTAL,
  mayWriteDefinitiveGames:false,
  filterEvaluationImplemented:false
});
