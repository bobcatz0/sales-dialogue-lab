
CREATE OR REPLACE FUNCTION public.get_percentile_rank_thresholds()
RETURNS TABLE(rank_name text, min_elo integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH user_elos AS (
    SELECT elo
    FROM profiles
    WHERE total_sessions >= 3
  ),
  total AS (
    SELECT COUNT(*) as cnt FROM user_elos
  ),
  thresholds AS (
    SELECT
      r.rank_name,
      r.percentile_threshold,
      r.fallback_min,
      (SELECT COALESCE(
        (SELECT elo FROM (
          SELECT elo, ROW_NUMBER() OVER (ORDER BY elo) as rn
          FROM user_elos
        ) ranked
        WHERE rn >= CEIL(r.percentile_threshold * t.cnt)
        ORDER BY rn
        LIMIT 1),
        r.fallback_min
      )::integer)
      as computed_min
    FROM (VALUES
      ('Rookie',          0.0,  0),
      ('Prospector',      0.20, 900),
      ('Closer',          0.50, 1100),
      ('Operator',        0.75, 1300),
      ('Rainmaker',       0.90, 1500),
      ('Sales Architect', 0.97, 1800)
    ) AS r(rank_name, percentile_threshold, fallback_min),
    total t
  )
  SELECT
    t.rank_name,
    CASE
      WHEN (SELECT cnt FROM total) < 20 THEN t.fallback_min::integer
      ELSE t.computed_min
    END as min_elo
  FROM thresholds t
  ORDER BY t.percentile_threshold;
$$;
