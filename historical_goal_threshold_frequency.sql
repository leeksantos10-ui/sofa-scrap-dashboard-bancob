-- Historical goal metrics: return threshold-hit count or frequency, not goal averages.
CREATE OR REPLACE FUNCTION public.calcular_metrica_jogo_historica_filtro_v60(
  p_config_id bigint,
  p_jogo_id bigint,
  p_contexto text
)
RETURNS numeric
LANGUAGE plpgsql
AS $function$
DECLARE
  cfg record;
  current_game record;
  target_team text;
  ctx text;
  window_size int;
  minimum int;
  indicator text;
  line numeric;
  output_mode text;
  team_side text;
  goal_threshold int;
  hit_count int;
  total_count int;
BEGIN
  SELECT * INTO cfg
  FROM public.metricas_config
  WHERE id=p_config_id AND coalesce(ativa,true)=true;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT * INTO current_game
  FROM public.jogos
  WHERE id=p_jogo_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  ctx:=upper(coalesce(nullif(trim(p_contexto),''),cfg.contexto,'GERAL'));
  window_size:=coalesce(cfg.janela_jogos,10);
  minimum:=coalesce(cfg.minimo_jogos,5);
  indicator:=upper(coalesce(cfg.formula->>'indicador','OVER'));
  line:=coalesce(nullif(cfg.formula->>'linha','')::numeric,2.5);
  output_mode:=upper(coalesce(cfg.formula->>'saida','PERCENTUAL'));
  team_side:=upper(coalesce(cfg.formula->>'equipe_alvo','MANDANTE'));
  goal_threshold:=coalesce(nullif(cfg.formula->>'gols_minimo','')::int,1);

  IF team_side NOT IN ('MANDANTE','VISITANTE')
     OR ctx NOT IN ('GERAL','CASA','FORA')
     OR window_size<1 OR window_size>100
     OR minimum<1 OR minimum>window_size THEN
    RAISE EXCEPTION 'Configuração de indicador histórico inválida.';
  END IF;
  IF indicator IN ('GOLS_MARCADOS','GOLS_SOFRIDOS')
     AND (goal_threshold<1 OR goal_threshold>4) THEN
    RAISE EXCEPTION 'O limite mínimo de gols deve ser de 1 a 4.';
  END IF;
  IF indicator NOT IN ('OVER','UNDER','BTTS_SIM','BTTS_NAO','VITORIA','EMPATE','DERROTA','GOLS_MARCADOS','GOLS_SOFRIDOS') THEN
    RAISE EXCEPTION 'Indicador histórico não reconhecido: %',indicator;
  END IF;
  IF output_mode NOT IN ('CONTAGEM','PERCENTUAL') THEN
    RAISE EXCEPTION 'Saída histórica inválida: %',output_mode;
  END IF;

  target_team:=CASE
    WHEN team_side='VISITANTE' THEN split_part(current_game."CONFRONTO",' x ',2)
    ELSE split_part(current_game."CONFRONTO",' x ',1)
  END;

  WITH history AS (
    SELECT g."DATA",g."CONFRONTO",
      g."GOLS_CASA_FT"::numeric AS gh,
      g."GOLS_VISITANTE_FT"::numeric AS ga,
      CASE WHEN split_part(g."CONFRONTO",' x ',1)=target_team THEN 'home' ELSE 'away' END AS actual_side
    FROM public.jogos g
    WHERE g."DATA"<current_game."DATA"
      AND (ctx='GERAL'
        OR (ctx='CASA' AND split_part(g."CONFRONTO",' x ',1)=target_team)
        OR (ctx='FORA' AND split_part(g."CONFRONTO",' x ',2)=target_team))
      AND (split_part(g."CONFRONTO",' x ',1)=target_team
        OR split_part(g."CONFRONTO",' x ',2)=target_team)
    ORDER BY g."DATA" DESC,g.id DESC
    LIMIT window_size
  ), vals AS (
    SELECT *,
      CASE WHEN actual_side='home' THEN gh ELSE ga END AS scored,
      CASE WHEN actual_side='home' THEN ga ELSE gh END AS conceded,
      gh+ga AS total_goals
    FROM history
  )
  SELECT
    CASE
      WHEN indicator IN ('GOLS_MARCADOS','GOLS_SOFRIDOS')
        THEN count(*) FILTER (WHERE scored IS NOT NULL AND conceded IS NOT NULL)
      ELSE count(*)
    END,
    count(*) FILTER (WHERE CASE
      WHEN indicator='OVER' THEN total_goals>line
      WHEN indicator='UNDER' THEN total_goals<line
      WHEN indicator='BTTS_SIM' THEN gh>0 AND ga>0
      WHEN indicator='BTTS_NAO' THEN gh=0 OR ga=0
      WHEN indicator='VITORIA' THEN (actual_side='home' AND gh>ga) OR (actual_side='away' AND ga>gh)
      WHEN indicator='EMPATE' THEN gh=ga
      WHEN indicator='DERROTA' THEN (actual_side='home' AND gh<ga) OR (actual_side='away' AND ga<gh)
      WHEN indicator='GOLS_MARCADOS' THEN scored>=goal_threshold
      WHEN indicator='GOLS_SOFRIDOS' THEN conceded>=goal_threshold
      ELSE false
    END)
  INTO total_count,hit_count
  FROM vals;

  IF total_count<minimum THEN RETURN NULL; END IF;
  IF output_mode='CONTAGEM' THEN RETURN hit_count; END IF;
  IF output_mode='PERCENTUAL' THEN RETURN hit_count::numeric*100/NULLIF(total_count,0); END IF;
  RAISE EXCEPTION 'Saída histórica inválida: %',output_mode;
END;
$function$;

-- Give existing goal-threshold metrics the legacy default of at least one goal.
-- Only those historical configs missing the threshold are touched.
UPDATE public.metricas_config
SET formula=jsonb_set(coalesce(formula,'{}'::jsonb),'{gols_minimo}','1'::jsonb,true),
    atualizado_em=now()
WHERE campo='HISTORICA'
  AND formula->>'indicador' IN ('GOLS_MARCADOS','GOLS_SOFRIDOS')
  AND NOT (coalesce(formula,'{}'::jsonb) ? 'gols_minimo');
