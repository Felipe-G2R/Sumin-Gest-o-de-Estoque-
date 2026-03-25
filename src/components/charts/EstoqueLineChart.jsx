import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function EstoqueLineChart({ data = [] }) {
  if (data.length === 0) {
    return (
      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="body-s text-muted">Sem dados de evolucao</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <defs>
          <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--brand-500)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--brand-500)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-100)" />
        <XAxis dataKey="data" tick={{ fontSize: 12, fill: 'var(--neutral-500)' }} />
        <YAxis
          tick={{ fontSize: 12, fill: 'var(--neutral-500)' }}
          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Valor']}
          contentStyle={{
            background: '#fff',
            border: '1px solid var(--neutral-200)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            fontSize: 13
          }}
        />
        <Area
          type="monotone"
          dataKey="valor"
          stroke="var(--brand-500)"
          strokeWidth={2}
          fill="url(#colorValor)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
