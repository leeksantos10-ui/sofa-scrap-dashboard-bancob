-- SOFA SCRAP V42 — MÉTRICAS COMPOSTAS + COMPARAÇÃO ENTRE MÉTRICAS
-- Execute uma vez no SQL Editor do Banco B.
-- Não apaga métricas, filtros ou jogos existentes.

BEGIN;

-- Garante que formula possa armazenar a composição em JSONB.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='metricas_config' AND column_name='formula'
  ) THEN
    ALTER TABLE public.metricas_config ADD COLUMN formula jsonb;
  END IF;
END $$;

-- Calcula uma métrica composta recursivamente.
CREATE OR REPLACE FUNCTION public.calcular_metrica_composta_v42(p_metrica_id bigint, p_jogo_id bigint, p_nivel integer DEFAULT 0)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  cfg jsonb;
  tipo text;
  op text;
  arr jsonb;
  vals numeric[] := ARRAY[]::numeric[];
  item jsonb;
  v numeric;
  resultado numeric;
BEGIN
  IF p_nivel > 10 THEN RAISE EXCEPTION 'Ciclo/profundidade excessiva na métrica composta %', p_metrica_id; END IF;
  SELECT formula INTO cfg FROM public.metricas_config WHERE id=p_metrica_id AND COALESCE(ativa,true)=true;
  IF cfg IS NULL OR COALESCE(cfg->>'tipo','') <> 'COMPOSTA' THEN RETURN NULL; END IF;
  op:=upper(COALESCE(cfg->>'operacao','MEDIA'));
  arr:=COALESCE(cfg->'componentes','[]'::jsonb);
  FOR item IN SELECT * FROM jsonb_array_elements(arr) LOOP
    v:=public.calcular_metrica_composta_v42((item->>'metrica_id')::bigint,p_jogo_id,p_nivel+1);
    IF v IS NULL THEN
      BEGIN
        v:=public.calcular_metrica_jogo((item->>'metrica_id')::bigint,p_jogo_id);
      EXCEPTION WHEN undefined_function THEN
        v:=NULL;
      END;
    END IF;
    IF v IS NOT NULL THEN vals:=array_append(vals,v); END IF;
  END LOOP;
  IF cardinality(vals)=0 THEN RETURN NULL; END IF;
  IF op='MEDIA' THEN SELECT avg(x) INTO resultado FROM unnest(vals) x;
  ELSIF op='SOMA' THEN SELECT sum(x) INTO resultado FROM unnest(vals) x;
  ELSIF op IN ('SUBTRACAO','DIFERENCA') THEN resultado:=vals[1]; FOR i IN 2..cardinality(vals) LOOP resultado:=resultado-vals[i]; END LOOP;
  ELSIF op IN ('MULTIPLICACAO','PRODUTO') THEN resultado:=vals[1]; FOR i IN 2..cardinality(vals) LOOP resultado:=resultado*vals[i]; END LOOP;
  ELSIF op='DIVISAO' THEN resultado:=vals[1]; FOR i IN 2..cardinality(vals) LOOP IF vals[i]=0 THEN RETURN NULL; END IF; resultado:=resultado/vals[i]; END LOOP;
  ELSE RAISE EXCEPTION 'Operação composta não suportada: %',op; END IF;
  RETURN resultado;
END $$;

-- Avalia um nó de filtro, incluindo comparação contra outra métrica.
CREATE OR REPLACE FUNCTION public.avaliar_no_filtro_v42(p_no_id bigint, p_jogo_id bigint)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  n record; c record; child record; ok boolean; a numeric; b numeric; target numeric; op text; any_true boolean:=false; all_true boolean:=true; has_child boolean:=false;
BEGIN
  SELECT * INTO n FROM public.filtro_nos WHERE id=p_no_id;
  IF NOT FOUND THEN RETURN false; END IF;
  IF upper(COALESCE(n.tipo,''))='CONDICAO' THEN
    SELECT * INTO c FROM public.filtro_condicoes WHERE no_id=p_no_id ORDER BY id DESC LIMIT 1;
    IF NOT FOUND THEN RETURN false; END IF;
    IF EXISTS(SELECT 1 FROM public.metricas_config mc WHERE mc.id=c.metrica_id AND upper(COALESCE(mc.formula->>'tipo',''))='COMPOSTA') THEN
      a:=public.calcular_metrica_composta_v42(c.metrica_id,p_jogo_id);
    ELSE a:=public.calcular_metrica_jogo(c.metrica_id,p_jogo_id); END IF;
    IF a IS NULL THEN RETURN false; END IF;
    IF c.metrica_comparada_id IS NOT NULL THEN
      IF EXISTS(SELECT 1 FROM public.metricas_config mc WHERE mc.id=c.metrica_comparada_id AND upper(COALESCE(mc.formula->>'tipo',''))='COMPOSTA') THEN b:=public.calcular_metrica_composta_v42(c.metrica_comparada_id,p_jogo_id);
      ELSE b:=public.calcular_metrica_jogo(c.metrica_comparada_id,p_jogo_id); END IF;
      IF b IS NULL THEN RETURN false; END IF;
      target:=b*(1+COALESCE(c.percentual,0)/100.0);
    ELSE target:=c.valor; END IF;
    op:=COALESCE(c.operador,'>');
    IF op='>' THEN RETURN a>target; ELSIF op='>=' THEN RETURN a>=target; ELSIF op='<' THEN RETURN a<target; ELSIF op='<=' THEN RETURN a<=target; ELSIF op='=' THEN RETURN a=target; ELSIF op='<>' THEN RETURN a<>target; END IF;
    RETURN false;
  END IF;
  FOR child IN SELECT no_filho_id FROM public.filtro_nos_relacoes WHERE no_pai_id=p_no_id ORDER BY ordem,id LOOP
    has_child:=true; ok:=public.avaliar_no_filtro_v42(child.no_filho_id,p_jogo_id); IF ok THEN any_true:=true; ELSE all_true:=false; END IF;
  END LOOP;
  IF NOT has_child THEN RETURN false; END IF;
  IF upper(COALESCE(n.operador_logico,'E'))='OU' THEN RETURN any_true; ELSE RETURN all_true; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.avaliar_filtro_v42(p_filtro_id bigint, p_jogo_id bigint)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE r record; ok boolean:=true; found boolean:=false;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.filtros WHERE id=p_filtro_id AND COALESCE(ativo,true)=true) THEN RETURN false; END IF;
  FOR r IN SELECT n.id FROM public.filtro_nos n WHERE n.filtro_id=p_filtro_id AND NOT EXISTS(SELECT 1 FROM public.filtro_nos_relacoes rr WHERE rr.no_filho_id=n.id) ORDER BY n.ordem,n.id LOOP
    found:=true; IF NOT public.avaliar_no_filtro_v42(r.id,p_jogo_id) THEN ok:=false; END IF;
  END LOOP;
  RETURN found AND ok;
END $$;

GRANT EXECUTE ON FUNCTION public.calcular_metrica_composta_v42(bigint,bigint,integer) TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.avaliar_no_filtro_v42(bigint,bigint) TO anon,authenticated,service_role;

COMMIT;

SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema='public' AND routine_name IN ('calcular_metrica_composta_v42','avaliar_no_filtro_v42','avaliar_filtro_v42');
