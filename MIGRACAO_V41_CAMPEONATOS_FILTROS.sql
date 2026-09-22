-- Sofa Scrap V41: escopo de campeonatos nos filtros
-- Execute uma vez no Supabase SQL Editor (Banco B).
-- Nao apaga filtros existentes. NULL significa todos os campeonatos.

ALTER TABLE public.filtros
  ADD COLUMN IF NOT EXISTS campeonatos text[];

COMMENT ON COLUMN public.filtros.campeonatos IS
  'Lista opcional de campeonatos permitidos pelo filtro. NULL ou array vazio = todos.';

SELECT id, nome, ativo, campeonatos
FROM public.filtros
ORDER BY id DESC
LIMIT 10;
