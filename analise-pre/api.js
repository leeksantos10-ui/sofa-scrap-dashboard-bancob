/**
 * API de domínio isolada para Análise Pré.
 * Integrada apenas ao servidor da branch experimental; ainda não implantada no Render.
 * O avaliador de filtros é obrigatório; sem ele, a operação falha fechada.
 */
const safeId = value => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('ID inválido.');
  return id;
};

export function createPreAnalysisApi({ store, request, evaluateFilter }) {
  if (!store || typeof store.list !== 'function' ||
      typeof store.importRows !== 'function' ||
      typeof store.deleteChampionship !== 'function') {
    throw new TypeError('Store temporário inválido.');
  }
  if (typeof request !== 'function') throw new TypeError('Cliente de leitura do Banco B obrigatório.');
  return Object.freeze({
    async listGames() {
      const games = await store.list();
      return { games, source: 'pre_analysis_games' };
    },
    async importGames(rows, confirmed) {
      if (confirmed !== true) throw new Error('Importação cancelada: confirme a operação explicitamente.');
      const result = await store.importRows(rows);
      return { ...result, status: 'pendente', source: 'pre_analysis_games' };
    },
    async deleteChampionship(name, confirmed) {
      return store.deleteChampionship(name, confirmed === true);
    },
    async deleteDay(day, confirmed) { return store.deleteDay(day, confirmed === true); },
    async removeDuplicates(confirmed) { return store.removeDuplicates(confirmed === true); },
    async listSavedFilters() {
      // Busca primeiro os filtros e depois apenas os registros relacionados a eles.
      // Evita varrer milhares de nós/condições de todos os filtros em cada abertura.
      const filters = await request('filtros?select=id,nome,ativo,campeonatos&order=id.asc&limit=500');
      if (!Array.isArray(filters)) throw new Error('Resposta inválida ao consultar filtros salvos.');
      if (!filters.length) return [];
      const ids = filters.map(filter => Number(filter.id)).filter(id => Number.isSafeInteger(id) && id > 0);
      if (!ids.length) return filters.map(filter => ({ ...filter, nos: [], condicoes: [], relacoes: [] }));
      const idList = '(' + ids.join(',') + ')';
      const [nodes, relations] = await Promise.all([
        request('filtro_nos?select=id,filtro_id,no_pai_id,tipo,operador_logico,ordem,metrica_id,comparador,valor,percentual&filtro_id=in.' + encodeURIComponent(idList) + '&order=ordem.asc,id.asc&limit=10000'),
        request('filtro_nos_relacoes?select=id,filtro_id,no_pai_id,no_filho_id,ordem&filtro_id=in.' + encodeURIComponent(idList) + '&order=ordem.asc,id.asc&limit=10000')
      ]);
      if (!Array.isArray(nodes) || !Array.isArray(relations)) {
        throw new Error('Resposta inválida ao consultar nós ou relações dos filtros.');
      }
      const nodeIds = [...new Set(nodes.map(node => Number(node.id)).filter(id => Number.isSafeInteger(id) && id > 0))];
      let conditions = [];
      if (nodeIds.length) {
        const conditionIds = '(' + nodeIds.join(',') + ')';
        conditions = await request('filtro_condicoes?select=*&no_id=in.' + encodeURIComponent(conditionIds) + '&limit=10000');
        if (!Array.isArray(conditions)) throw new Error('Resposta inválida ao consultar condições dos filtros.');
      }
      return filters.map(filter => {
        const filterNodes = nodes.filter(node => Number(node.filtro_id) === Number(filter.id));
        const idsForFilter = new Set(filterNodes.map(node => Number(node.id)));
        return {
          ...filter,
          nos: filterNodes,
          condicoes: conditions.filter(condition => idsForFilter.has(Number(condition.no_id))),
          relacoes: relations.filter(relation =>
            Number(relation.filtro_id) === Number(filter.id) &&
            idsForFilter.has(Number(relation.no_pai_id)) &&
            idsForFilter.has(Number(relation.no_filho_id))
          )
        };
      });
    },
    async applySavedFilter(gameId, filterId) {
      safeId(gameId);
      const fid = safeId(filterId);
      if (typeof evaluateFilter !== 'function') {
        throw new Error('Avaliação bloqueada: o motor real de métricas históricas ainda não foi conectado e validado. Nenhum jogo foi aprovado.');
      }
      const games = await store.list();
      const game = games.find(item => Number(item.id) === Number(gameId));
      if (!game) throw new Error('Jogo preliminar não encontrado.');
      const filters = await this.listSavedFilters();
      const filter = filters.find(item => Number(item.id) === fid);
      if (!filter) throw new Error('Filtro salvo não encontrado.');
      if (filter.ativo === false) throw new Error('Filtro salvo está inativo; a avaliação foi bloqueada.');
      // Assinatura estável: reutiliza somente a avaliação feita com a mesma versão do filtro.
      const stable = value => JSON.stringify(value, (key, item) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          return Object.keys(item).sort().reduce((out, k) => (out[k] = item[k], out), {});
        }
        return item;
      });
      const filterSignature = stable({
        filtro: { id: filter.id, ativo: filter.ativo, campeonatos: filter.campeonatos },
        nos: [...filter.nos].sort((x,y)=>Number(x.id)-Number(y.id)),
        condicoes: [...filter.condicoes].sort((x,y)=>Number(x.id)-Number(y.id)),
        relacoes: [...filter.relacoes].sort((x,y)=>Number(x.id)-Number(y.id))
      });
      const imported = game.dados_importados && typeof game.dados_importados === 'object' ? game.dados_importados : {};
      const cached = imported._pre_analysis_evaluations && imported._pre_analysis_evaluations[String(fid)];
      if (cached && cached.filterSignature === filterSignature && typeof cached.passed === 'boolean' && Array.isArray(cached.reasons)) {
        return { gameId: Number(gameId), filterId: fid, passed: cached.passed, reasons: cached.reasons, persisted: true, cached: true, savedAt: cached.savedAt };
      }
      // Se a configuração do filtro mudou, recalcula; se não mudou, usa o resultado persistido.
      const result = await evaluateFilter({ game, filter, readOnlyRequest: request });
      if (!result || typeof result.passed !== 'boolean' || !Array.isArray(result.reasons)) {
        throw new Error('O avaliador retornou um resultado inválido; jogo mantido como pendente.');
      }
      // Guarda apenas o resultado da Análise Pré dentro do JSON já existente da tabela temporária.
      // Os dados importados originais são preservados; a tabela definitiva jogos nunca é escrita.
      await store.saveEvaluation(game, fid, { ...result, filterSignature });
      return { gameId: Number(gameId), filterId: fid, passed: result.passed, reasons: result.reasons, persisted: true };
    }
  });
}
