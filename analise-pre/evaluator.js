/**
 * Avaliador puro da árvore de filtros salvos.
 * Não consulta banco nem grava resultados. O resolver de métricas é injetado
 * e deve calcular valores históricos para as equipes/data do jogo preliminar.
 */
const idOf = value => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('ID inválido na árvore do filtro.');
  return id;
};

function compare(left, operator, right) {
  if (left == null || right == null || !Number.isFinite(Number(left)) || !Number.isFinite(Number(right))) {
    return { passed: false, reason: 'Métrica sem valor histórico suficiente para comparação.' };
  }
  const a = Number(left), b = Number(right);
  switch (String(operator || '>').trim()) {
    case '>': return { passed: a > b };
    case '>=': return { passed: a >= b };
    case '<': return { passed: a < b };
    case '<=': return { passed: a <= b };
    case '=': return { passed: a === b };
    case '<>': return { passed: a !== b };
    default: throw new Error('Operador de comparação não suportado: ' + operator);
  }
}

export async function evaluateFilterTree({ game, filter, resolveMetric }) {
  if (!game || !filter) throw new TypeError('Jogo preliminar e filtro são obrigatórios.');
  if (filter.ativo === false) throw new Error('Filtro inativo não pode ser avaliado.');
  if (typeof resolveMetric !== 'function') throw new Error('Resolver de métricas históricas não conectado.');
  const nodes = Array.isArray(filter.nos) ? filter.nos : [];
  const conditions = Array.isArray(filter.condicoes) ? filter.condicoes : [];
  const relations = Array.isArray(filter.relacoes) ? filter.relacoes : [];
  if (!nodes.length) throw new Error('Filtro sem nós; nenhuma avaliação foi realizada.');
  const nodeById = new Map(nodes.map(node => [idOf(node.id), node]));
  const children = new Map();
  const childIds = new Set();
  for (const relation of relations) {
    const parentId = idOf(relation.no_pai_id);
    const childId = idOf(relation.no_filho_id);
    if (!nodeById.has(parentId) || !nodeById.has(childId)) continue;
    if (parentId === childId) throw new Error('Árvore do filtro contém autorreferência.');
    if (!children.has(parentId)) children.set(parentId, []);
    children.get(parentId).push({ id: childId, order: Number(relation.ordem) || 0 });
    childIds.add(childId);
  }
  for (const entries of children.values()) entries.sort((a,b)=>a.order-b.order || a.id-b.id);
  const conditionByNode = new Map();
  // O motor oficial escolhe a condição de maior ID para cada nó (ORDER BY id DESC LIMIT 1).
  // Não confiar na ordem de retorno do PostgREST, que não é garantida sem order explícito.
  for (const condition of conditions) {
    const key = idOf(condition.no_id);
    if (!nodeById.has(key)) continue;
    const current = conditionByNode.get(key);
    const candidateId = Number(condition.id);
    const currentId = Number(current?.id);
    if (!current || (Number.isFinite(candidateId) && (!Number.isFinite(currentId) || candidateId > currentId))) {
      conditionByNode.set(key, condition);
    }
  }
  const memo = new Map();
  const visiting = new Set();
  const reasons = [];
  const evaluateNode = async nodeId => {
    if (memo.has(nodeId)) return memo.get(nodeId);
    if (visiting.has(nodeId)) throw new Error('Árvore do filtro contém ciclo.');
    const node = nodeById.get(nodeId);
    if (!node) return false;
    visiting.add(nodeId);
    let passed = false;
    if (String(node.tipo || '').toUpperCase() === 'CONDICAO') {
      const condition = conditionByNode.get(nodeId);
      if (!condition) {
        reasons.push('Nó ' + nodeId + ': condição ausente.');
      } else {
        const metricId = idOf(condition.metrica_id ?? node.metrica_id);
        const left = await resolveMetric({ metricId, game, filter, condition, side: 'left' });
        let target;
        if (condition.metrica_comparada_id != null) {
          const comparedId = idOf(condition.metrica_comparada_id);
          const right = await resolveMetric({ metricId: comparedId, game, filter, condition, side: 'right' });
          const base = Number(right);
          target = Number.isFinite(base) ? base * (1 + Number(condition.percentual || 0) / 100) : null;
        } else {
          target = condition.valor;
        }
        const result = compare(left, condition.operador ?? condition.comparador ?? '>', target);
        passed = result.passed;
        if (result.reason) reasons.push('Nó ' + nodeId + ': ' + result.reason);
        else reasons.push('Nó ' + nodeId + ': ' + (passed ? 'condição atendida' : 'condição não atendida') + ' (' + left + ' ' + (condition.operador ?? condition.comparador ?? '>') + ' ' + target + ').');
      }
    } else {
      const childList = children.get(nodeId) || [];
      if (!childList.length) {
        reasons.push('Nó ' + nodeId + ': grupo sem filhos.');
      } else {
        const results = [];
        for (const child of childList) results.push(await evaluateNode(child.id));
        passed = String(node.operador_logico || 'E').toUpperCase() === 'OU'
          ? results.some(Boolean) : results.every(Boolean);
      }
    }
    visiting.delete(nodeId);
    memo.set(nodeId, passed);
    return passed;
  };
  const roots = nodes.map(node => idOf(node.id)).filter(id => !childIds.has(id)).sort((a,b)=>{
    const na=nodeById.get(a), nb=nodeById.get(b);
    return (Number(na.ordem)||0)-(Number(nb.ordem)||0) || a-b;
  });
  if (!roots.length) throw new Error('Árvore do filtro sem nó raiz.');
  const rootResults = [];
  for (const rootId of roots) rootResults.push(await evaluateNode(rootId));
  return { passed: rootResults.every(Boolean), reasons, evaluatedRoots: roots.length };
}
