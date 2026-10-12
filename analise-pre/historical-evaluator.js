import {evaluateFilterTree} from './evaluator.js';

/**
 * Cria o avaliador de domínio apenas quando um resolvedor histórico foi
 * explicitamente fornecido. Não executa RPCs mutáveis e não inventa métricas.
 */
export function createHistoricalFilterEvaluator({resolveMetric}) {
  if (typeof resolveMetric !== 'function') {
    throw new TypeError('É obrigatório conectar um resolvedor de métricas históricas validado.');
  }
  return async ({game, filter}) => {
    if (!game?.data || !game?.confronto) {
      throw new Error('Jogo preliminar precisa ter data e confronto para calcular métricas históricas.');
    }
    const result = await evaluateFilterTree({game,filter,resolveMetric});
    return {passed:result.passed,reasons:result.reasons,evaluatedRoots:result.evaluatedRoots};
  };
}
