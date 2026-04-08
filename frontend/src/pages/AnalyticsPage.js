import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { analyticsAPI } from '../services/api';

const COLORS = {
  open: '#6c5ce7',
  in_progress: '#fdcb6e',
  resolved: '#00cec9',
  closed: '#636882',
  low: '#00cec9',
  medium: '#6c5ce7',
  high: '#fdcb6e',
  urgent: '#e17055',
};

const tooltipStyle = {
  backgroundColor: '#1e2130',
  border: '1px solid #2a2d3e',
  borderRadius: 8,
  fontSize: 13,
};

export default function AnalyticsPage() {
  const [trends, setTrends] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [resolution, setResolution] = useState(null);

  useEffect(() => {
    analyticsAPI.trends({ period: 'daily', days: 30 })
      .then(r => {
        const d = r.data.map(item => ({
          ...item,
          period: new Date(item.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        }));
        setTrends(d);
      }).catch(() => {});

    analyticsAPI.statusBreakdown()
      .then(r => setStatusData(r.data))
      .catch(() => {});

    analyticsAPI.priorityBreakdown()
      .then(r => setPriorityData(r.data))
      .catch(() => {});

    analyticsAPI.resolutionTime({ days: 30 })
      .then(r => setResolution(r.data))
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Ticket trends and performance metrics</p>
      </div>

      {/* Resolution time summary */}
      {resolution && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="label">Avg Resolution Time</div>
            <div className="value accent">
              {resolution.average_hours ? `${resolution.average_hours}h` : '—'}
            </div>
          </div>
          <div className="stat-card">
            <div className="label">Resolved (30d)</div>
            <div className="value success">{resolution.total_resolved}</div>
          </div>
          {resolution.by_priority?.map(p => (
            <div className="stat-card" key={p.priority}>
              <div className="label">{p.priority} avg</div>
              <div className="value" style={{ color: COLORS[p.priority] || 'var(--text-primary)' }}>
                {p.avg_hours ? `${p.avg_hours}h` : '—'}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="charts-grid">
        {/* Ticket trends line chart */}
        <div className="chart-card">
          <h3>Ticket Trends (Last 30 days)</h3>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="period" stroke="#636882" fontSize={11} />
                <YAxis stroke="#636882" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="count" stroke="#6c5ce7" strokeWidth={2} dot={{ r: 3 }} name="Tickets" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>No trend data available</p></div>
          )}
        </div>

        {/* Status breakdown pie */}
        <div className="chart-card">
          <h3>By Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ status, count }) => `${status.replace('_', ' ')} (${count})`}
                  fontSize={12}
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.status} fill={COLORS[entry.status] || '#6c5ce7'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>No status data</p></div>
          )}
        </div>

        {/* Priority breakdown bar */}
        <div className="chart-card">
          <h3>By Priority</h3>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="priority" stroke="#636882" fontSize={12} />
                <YAxis stroke="#636882" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Tickets">
                  {priorityData.map((entry) => (
                    <Cell key={entry.priority} fill={COLORS[entry.priority] || '#6c5ce7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>No priority data</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
