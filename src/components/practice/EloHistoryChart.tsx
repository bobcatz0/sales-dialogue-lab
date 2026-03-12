import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface HistoryPoint {
  elo: number;
  delta: number;
  session_score: number;
  created_at: string;
}

export function EloHistoryChart() {
  const { user } = useAuth();
  const [data, setData] = useState<{ date: string; elo: number; delta: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const { data: history } = await supabase
        .from("elo_history")
        .select("elo, delta, session_score, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(100);

      if (history && history.length > 0) {
        setData(
          history.map((h: HistoryPoint) => ({
            date: new Date(h.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
            elo: h.elo,
            delta: h.delta,
          }))
        );
      }
      setLoading(false);
    };

    fetch();
  }, [user]);

  if (!user || loading) return null;
  if (data.length < 2) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card-elevated p-5 space-y-3"
      >
        <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          ELO History
        </h3>
        <p className="text-xs text-muted-foreground">
          Complete at least 2 sessions to see your rating progression.
        </p>
      </motion.div>
    );
  }

  const minElo = Math.min(...data.map((d) => d.elo));
  const maxElo = Math.max(...data.map((d) => d.elo));
  const yMin = Math.floor((minElo - 30) / 50) * 50;
  const yMax = Math.ceil((maxElo + 30) / 50) * 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="card-elevated p-5 space-y-3"
    >
      <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        ELO History
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="eloGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(145, 72%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(145, 72%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "hsl(215, 12%, 55%)" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 10, fill: "hsl(215, 12%, 55%)" }}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine y={1000} stroke="hsl(215, 12%, 25%)" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 10%)",
                border: "1px solid hsl(220, 14%, 18%)",
                borderRadius: "8px",
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(210, 20%, 95%)" }}
              formatter={(value: number, name: string) => {
                if (name === "elo") return [value, "ELO"];
                return [value, name];
              }}
            />
            <Area
              type="monotone"
              dataKey="elo"
              stroke="hsl(145, 72%, 50%)"
              strokeWidth={2}
              fill="url(#eloGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "hsl(145, 72%, 50%)", stroke: "hsl(220, 18%, 10%)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Started at 1000</span>
        <span>
          Last change:{" "}
          <span className={data[data.length - 1].delta >= 0 ? "text-primary" : "text-destructive"}>
            {data[data.length - 1].delta >= 0 ? "+" : ""}{data[data.length - 1].delta}
          </span>
        </span>
      </div>
    </motion.div>
  );
}
