"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ViewsChart({ data }: { data: { name: string; views: number }[] }) {
  if (!data?.length) return <div className="tag">No data yet.</div>;
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#23272f" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8b9099" }} interval={0} angle={-25} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 11, fill: "#8b9099" }} />
          <Tooltip contentStyle={{ background: "#121419", border: "1px solid #23272f", borderRadius: 10, fontFamily: "monospace", fontSize: 12 }} />
          <Bar dataKey="views" fill="#ffb02e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
