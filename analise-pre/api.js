/**
 * API de domínio isolada para Análise Pré.
 * Não está conectada ao servidor principal nem ao Render.
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
    async listSavedFilters() {
      // Leitura apenas: filtros, nós e condições são consultados, nunca alterados.
      const [filters, nodes, conditions] = await Promise.all([
        request('filtros?select=id,nome,ativo,campeonatos&order=id.asc&limit=500'),
        request('filtro_nos?select=id,filtro_id,no_pai_id,tipo,operador_logico,ordem,metrica_id,comparador,valor,percentual&order=ordem.asc,id.asc&limit=4000'),
        request('filtro_condicoes?select=*&limit=4000')
      ]);
      for (const [name, value] of [['filtros', filters], ['nós', nodes], ['condições', conditions]]) {
        if (!Array.isArray(value)) throw new Error('Resposta inválida ao consultar ' + name + ' salvos.');
      }
      return filters.map(filter => ({
        ...filter,
        nos: nodes.filter(node => Number(node.filtro_id) === Number(filter.id)),
        condicoes: conditions.filter(condition =>
          nodes.some(node => Number(node.filtro_id) === Number(filter.id) && Number(node.id) === Number(condition.no_id))
        )
      }));
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
      // O avaliador recebe o jogo preliminar, o filtro e acesso explicitamente somente leitura.
      const result = await evaluateFilter({ game, filter, readOnlyRequest: request });
      if (!result || typeof result.passed !== 'boolean' || !Array.isArray(result.reasons)) {
        throw new Error('O avaliador retornou um resultado inválido; jogo mantido como pendente.');
      }
      // Esta camada não altera status no banco. Só devolve o resultado para revisão.
      return { gameId: Number(gameId), filterId: fid, passed: result.passed, reasons: result.reasons, persisted: false };
    }
  });
}
