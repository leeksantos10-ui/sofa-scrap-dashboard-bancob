/**
 * Contrato de segurança para persistência da Análise Pré.
 * Este módulo só recebe um cliente PostgREST injetado; não lê variáveis de ambiente,
 * não inicializa cliente global e não importa a lógica do Dashboard.
 */
const TABLE='pre_analysis_games';
const MAX_BATCH=250;
const MAX_TOTAL=5000;
const safeText=(value,max=300)=>String(value??'').trim().slice(0,max);

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
          rodada:row.rodada?safeText(row.rodada,80):null,
          odds:row.odds&&typeof row.odds==='object'&&!Array.isArray(row.odds)?row.odds:{},
          dados_importados:row.dados_importados&&typeof row.dados_importados==='object'&&!Array.isArray(row.dados_importados)?row.dados_importados:{},
          status:'pendente'
        };
      });
      let inserted=0;
      for(let i=0;i<payload.length;i+=MAX_BATCH) {
        const batch=payload.slice(i,i+MAX_BATCH);
        const data=await call(TABLE,{method:'POST',body:batch,prefer:'return=representation'});
        inserted+=Array.isArray(data)?data.length:batch.length;
      }
      return {inserted};
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
