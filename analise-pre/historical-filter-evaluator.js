/**
 * Liga árvore de filtros, configurações de métricas e histórico somente leitura.
 * O cliente request fornecido deve ser GET-only; nenhum status é persistido aqui.
 */
import {evaluateFilterTree} from './evaluator.js';
import {createSimpleHistoricalMetricResolver} from './simple-historical-metric-resolver.js';
import {createSupabaseHistoricalProvider} from './supabase-historical-provider.js';

export function createHistoricalFilterEvaluator({request}) {
  if(typeof request!=='function') throw new TypeError('Cliente de leitura do Banco B obrigatório.');
  const fetchHistory=createSupabaseHistoricalProvider({request});
  const resolveMetric=createSimpleHistoricalMetricResolver({
    getMetricConfig:async id=>{
      const rows=await request('metricas_config?id=eq.'+encodeURIComponent(id)+
        '&select=id,campo,contexto,janela_jogos,minimo_jogos,operacao,ativa,formula&limit=1');
      if(!Array.isArray(rows)) throw new Error('Configuração da métrica retornou resposta inválida.');
      return rows[0]||null;
    },
    fetchHistory
  });
  return async ({game,filter,readOnlyRequest})=>{
    if(typeof readOnlyRequest!=='function') throw new Error('Avaliação bloqueada: cliente somente leitura ausente.');
    if(readOnlyRequest!==request) throw new Error('Avaliação bloqueada: origem de leitura inconsistente.');
    const result=await evaluateFilterTree({game,filter,resolveMetric});
    return {...result,engine:'historical-read-only-v1',persisted:false};
  };
}
