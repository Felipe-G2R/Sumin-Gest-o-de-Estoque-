import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#0D9488', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316'];

function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export default function CategoriasPieChart({ data = [] }) {
  if (data.length === 0) {
    return (
      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="body-s text-muted">Sem dados de categorias</p>
      </div>
    );
  }

  const chartData = data
    .map(d => ({
      name: d.categoria || 'Sem categoria',
      value: Math.max(0, Math.round((d.valor || 0) * 100) / 100),
    }))
    .filter(d => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="body-s text-muted">Sem valor por categoria</p>
      </div>
    );
  }

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="cat-pie-wrap">
      <div className="cat-pie-chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="90%"
              paddingAngle={2}
              dataKey="value"
              isAnimationActive={false}
              stroke="var(--bg-elevated, #fff)"
              strokeWidth={2}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name) => [formatBRL(value), 'Valor']}
              contentStyle={{
                background: 'var(--bg-elevated, #fff)',
                border: '1px solid var(--border-color, #e5e7eb)',
                borderRadius: 'var(--radius-md, 8px)',
                boxShadow: 'var(--shadow-md)',
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="cat-pie-legend">
        {chartData.map((d, i) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <li key={d.name} className="cat-pie-legend-item">
              <span className="cat-pie-dot" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="cat-pie-name" title={d.name}>{d.name}</span>
              <span className="cat-pie-pct">{pct.toFixed(1)}%</span>
            </li>
          );
        })}
      </ul>

      <style>{`
        .cat-pie-wrap {
          display: grid;
          grid-template-columns: minmax(180px, 260px) minmax(160px, 1fr);
          gap: 20px;
          align-items: center;
          min-height: 260px;
        }
        .cat-pie-chart { height: 260px; min-width: 0; }
        .cat-pie-legend {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 260px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .cat-pie-legend-item {
          display: grid;
          grid-template-columns: 12px 1fr auto;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--neutral-700, #374151);
        }
        .cat-pie-dot {
          width: 12px; height: 12px;
          border-radius: 3px;
          flex-shrink: 0;
        }
        .cat-pie-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .cat-pie-pct {
          font-variant-numeric: tabular-nums;
          font-weight: 500;
          color: var(--neutral-600, #4b5563);
        }
        @media (max-width: 640px) {
          .cat-pie-wrap {
            grid-template-columns: 1fr;
          }
          .cat-pie-chart { height: 220px; }
          .cat-pie-legend {
            max-height: none;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
