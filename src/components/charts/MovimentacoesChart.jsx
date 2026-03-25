import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function MovimentacoesChart({ data = [] }) {
  if (data.length === 0) {
    return (
      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="body-s text-muted">Sem dados de movimentacoes</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-100)" />
        <XAxis dataKey="data" tick={{ fontSize: 12, fill: 'var(--neutral-500)' }} />
        <YAxis tick={{ fontSize: 12, fill: 'var(--neutral-500)' }} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: '#fff',
            border: '1px solid var(--neutral-200)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            fontSize: 13
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="entradas" name="Entradas" fill="var(--success-500)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="saidas" name="Saidas" fill="var(--destructive-500)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
