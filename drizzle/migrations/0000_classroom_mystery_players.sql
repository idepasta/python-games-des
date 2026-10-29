CREATE TABLE public.mystery_players (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), token_hash text NOT NULL UNIQUE, state jsonb NOT NULL, revision integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.mystery_players TO service_role;
ALTER TABLE public.mystery_players ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.mystery_rankings (id uuid PRIMARY KEY REFERENCES public.mystery_players(id) ON DELETE CASCADE, name text NOT NULL, score integer NOT NULL DEFAULT 0, completed integer NOT NULL DEFAULT 0, correct integer NOT NULL DEFAULT 0, attempts integer NOT NULL DEFAULT 0, streak integer NOT NULL DEFAULT 0, bonuses integer NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.mystery_rankings TO anon, authenticated;
GRANT ALL ON public.mystery_rankings TO service_role;
ALTER TABLE public.mystery_rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public classroom scores only" ON public.mystery_rankings FOR SELECT TO anon, authenticated USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.mystery_rankings;
CREATE FUNCTION public.commit_mystery_action(p_id uuid, p_revision integer, p_state jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 UPDATE public.mystery_players SET state=p_state, revision=revision+1 WHERE id=p_id AND revision=p_revision;
 IF NOT FOUND THEN RETURN false; END IF;
 INSERT INTO public.mystery_rankings(id,name,score,completed,correct,attempts,streak,bonuses) VALUES(p_id,p_state->>'name',(p_state->>'score')::integer,jsonb_array_length(p_state->'done'),(p_state->>'correct')::integer,(p_state->>'attempts')::integer,(p_state->>'streak')::integer,(p_state->>'bonuses')::integer)
 ON CONFLICT(id) DO UPDATE SET score=excluded.score,completed=excluded.completed,correct=excluded.correct,attempts=excluded.attempts,streak=excluded.streak,bonuses=excluded.bonuses,updated_at=now();
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.commit_mystery_action(uuid,integer,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.commit_mystery_action(uuid,integer,jsonb) TO service_role;