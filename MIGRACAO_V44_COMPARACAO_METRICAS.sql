-- SOFA SCRAP V44 — COMPARAÇÃO ENTRE MÉTRICAS
-- Execute UMA vez no SQL Editor do Banco B.
-- Não apaga filtros, métricas, backtests ou jogos existentes.

BEGIN;

-- 1) A condição do filtro precisa guardar qual é a métrica do outro lado da comparação.
ALTER TABLE public.filtro_condicoes
  ADD COLUMN IF NOT EXISTS metrica_comparada_id bigint;

CREATE INDEX IF NOT EXISTS idx_filtro_condicoes_metrica_comparada
  ON public.filtro_condicoes (metrica_comparada_id);

-- 2) Mantém a função de métrica composta já criada na V42, caso exista.
-- Se a migração V42 já foi executada, esta parte apenas reutiliza a função existente.

-- 3) Motor oficial de avaliação: substitui a versão antiga e passa a entender
--    valor fixo E comparação com outra métrica.
CREATE OR REPLACE FUNCTION public.avaliar_no_filtro(
  p_no_id bigint,
  p_jogo_id bigint
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  n record;
  c record;
  child record;
  ok boolean;
  a numeric;
  b numeric;
  target numeric;
  op text;
  any_true boolean := false;
  all_true boolean := true;
  has_child boolean := false;
  formula_tipo text;
BEGIN
  SELECT * INTO n
  FROM public.filtro_nos
  WHERE id = p_no_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF upper(COALESCE(n.tipo,'')) = 'CONDICAO' THEN
    SELECT * INTO c
    FROM public.filtro_condicoes
    WHERE no_id = p_no_id
    ORDER BY id DESC
    LIMIT 1;

    IF NOT FOUND THEN
      RETURN false;
    END IF;

    -- Métrica principal
    SELECT upper(COALESCE(mc.formula->>'tipo',''))
      INTO formula_tipo
    FROM public.metricas_config mc
    WHERE mc.id = c.metrica_id;

    IF formula_tipo = 'COMPOSTA' THEN
      BEGIN
        a := public.calcular_metrica_composta_v42(c.metrica_id, p_jogo_id);
      EXCEPTION WHEN undefined_function THEN
        a := public.calcular_metrica_jogo(c.metrica_id, p_jogo_id);
      END;
    ELSE
      a := public.calcular_metrica_jogo(c.metrica_id, p_jogo_id);
    END IF;

    IF a IS NULL THEN
      RETURN false;
    END IF;

    -- Comparação com outra métrica
    IF c.metrica_comparada_id IS NOT NULL THEN
      SELECT upper(COALESCE(mc.formula->>'tipo',''))
        INTO formula_tipo
      FROM public.metricas_config mc
      WHERE mc.id = c.metrica_comparada_id;

      IF formula_tipo = 'COMPOSTA' THEN
        BEGIN
          b := public.calcular_metrica_composta_v42(c.metrica_comparada_id, p_jogo_id);
        EXCEPTION WHEN undefined_function THEN
          b := public.calcular_metrica_jogo(c.metrica_comparada_id, p_jogo_id);
        END;
      ELSE
        b := public.calcular_metrica_jogo(c.metrica_comparada_id, p_jogo_id);
      END IF;

      IF b IS NULL THEN
        RETURN false;
      END IF;

      target := b * (1 + COALESCE(c.percentual,0) / 100.0);
    ELSE
      target := c.valor;
    END IF;

    op := COALESCE(c.operador,'>');
    IF op = '>'  THEN RETURN a >  target;
    ELSIF op = '>=' THEN RETURN a >= target;
    ELSIF op = '<'  THEN RETURN a <  target;
    ELSIF op = '<=' THEN RETURN a <= target;
    ELSIF op = '='  THEN RETURN a =  target;
    ELSIF op = '<>' THEN RETURN a <> target;
    END IF;

    RETURN false;
  END IF;

  -- Grupos E / OU, inclusive aninhados.
  FOR child IN
    SELECT no_filho_id
    FROM public.filtro_nos_relacoes
    WHERE no_pai_id = p_no_id
    ORDER BY ordem, id
  LOOP
    has_child := true;
    ok := public.avaliar_no_filtro(child.no_filho_id, p_jogo_id);
    IF ok THEN
      any_true := true;
    ELSE
      all_true := false;
    END IF;
  END LOOP;

  IF NOT has_child THEN
    RETURN false;
  END IF;

  IF upper(COALESCE(n.operador_logico,'E')) = 'OU' THEN
    RETURN any_true;
  ELSE
    RETURN all_true;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.avaliar_filtro(
  p_filtro_id bigint,
  p_jogo_id bigint
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  r record;
  ok boolean := true;
  found boolean := false;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.filtros
    WHERE id = p_filtro_id
      AND COALESCE(ativo,true) = true
  ) THEN
    RETURN false;
  END IF;

  FOR r IN
    SELECT n.id
    FROM public.filtro_nos n
    WHERE n.filtro_id = p_filtro_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.filtro_nos_relacoes rr
        WHERE rr.no_filho_id = n.id
      )
    ORDER BY n.ordem, n.id
  LOOP
    found := true;
    IF NOT public.avaliar_no_filtro(r.id, p_jogo_id) THEN
      ok := false;
    END IF;
  END LOOP;

  RETURN found AND ok;
END $$;

GRANT EXECUTE ON FUNCTION public.avaliar_no_filtro(bigint,bigint)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.avaliar_filtro(bigint,bigint)
  TO anon, authenticated, service_role;

COMMIT;

-- VERIFICAÇÃO
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'filtro_condicoes'
  AND column_name IN ('metrica_id','metrica_comparada_id','operador','valor','percentual')
ORDER BY ordinal_position;
