import React from 'react';
import { Card, CardHeader, CardBody } from '../components/common';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  Activity,
  BarChart3,
  Users,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useApp } from '../contexts/AppContext';
import { industryLabels, statusLabels, users } from '../data/mockData';
import { startOfWeek, isWithinInterval, subDays, format } from 'date-fns';

const COLORS = ['#d4a574', '#1a2332', '#28a745', '#dc3545', '#007bff'];

export function Dashboard() {
  const { state } = useApp();
  const { leads, tasks } = state;

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  
  const weeklyNew = leads.filter(l => {
    const createdAt = new Date(l.created_at);
    return isWithinInterval(createdAt, { start: weekStart, end: now });
  }).length;

  const pendingVerification = leads.filter(l => 
    l.status === 'pending_verification' || l.status === 'new'
  ).length;

  const approved = leads.filter(l => l.status === 'approved' || l.status === 'published').length;
  const totalReviewed = leads.filter(l => 
    ['approved', 'published', 'rejected'].includes(l.status)
  ).length;
  const approvalRate = totalReviewed > 0 ? Math.round((approved / totalReviewed) * 100) : 0;

  const leadsByStatus = Object.entries(
    leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  );

  const leadsByIndustry = Object.entries(
    leads.reduce<Record<string, number>>((acc, lead) => {
      const label = industryLabels[lead.industry] || '其他';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const editorProgress = users
    .filter(u => u.role === 'editor')
    .map(user => {
      const userTasks = tasks.filter(t => t.assignee === user.id);
      const completed = userTasks.filter(t => t.status === 'done').length;
      return {
        editor: user.name,
        completed,
        total: userTasks.length,
      };
    });

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(now, 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = leads.filter(l => {
      const createdAt = format(new Date(l.created_at), 'yyyy-MM-dd');
      return createdAt === dateStr;
    }).length;
    return { date: dateStr, count };
  });

  const sourceQuality = [
    { source: '财经媒体', count: 45, quality: 92 },
    { source: '社交媒体', count: 28, quality: 65 },
    { source: '用户爆料', count: 15, quality: 72 },
    { source: '企业公告', count: 8, quality: 95 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">数据概览</h1>
          <p className="text-gray-500 mt-1">实时掌握创业尸体库运营状态</p>
        </div>
        <div className="text-sm text-gray-500">
          最后更新: {format(now, 'yyyy年MM月dd日 HH:mm')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="!p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-accent to-accent-dark p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">本周新增</p>
                <p className="text-4xl font-bold mt-2">{weeklyNew}</p>
                <p className="text-white/60 text-sm mt-1">较上周 +12%</p>
              </div>
              <TrendingUp size={48} className="opacity-20" />
            </div>
          </div>
        </Card>

        <Card className="!p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">待核实</p>
                <p className="text-4xl font-bold mt-2">{pendingVerification}</p>
                <p className="text-white/60 text-sm mt-1">需要处理</p>
              </div>
              <Clock size={48} className="opacity-20" />
            </div>
          </div>
        </Card>

        <Card className="!p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">审核通过率</p>
                <p className="text-4xl font-bold mt-2">{approvalRate}%</p>
                <p className="text-white/60 text-sm mt-1">较上月 +5%</p>
              </div>
              <CheckCircle size={48} className="opacity-20" />
            </div>
          </div>
        </Card>

        <Card className="!p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-primary to-primary-light p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">线索总数</p>
                <p className="text-4xl font-bold mt-2">{leads.length}</p>
                <p className="text-white/60 text-sm mt-1">全部记录</p>
              </div>
              <Activity size={48} className="opacity-20" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">线索增长趋势</h3>
            <BarChart3 size={20} className="text-gray-400" />
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4a574" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d4a574" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), 'MM/dd')} />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#d4a574"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">线索来源质量</h3>
            <Users size={20} className="text-gray-400" />
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {sourceQuality.map((item, index) => (
                <div key={item.source}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.source}</span>
                    <span className="text-sm text-gray-500">
                      {item.count} 条 · 质量 {item.quality}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.quality}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">编辑完成进度</h3>
            <Users size={20} className="text-gray-400" />
          </CardHeader>
          <CardBody>
            {editorProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={editorProgress} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" />
                  <YAxis dataKey="editor" type="category" width={60} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="completed" fill="#d4a574" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-500">
                暂无编辑任务数据
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">状态分布</h3>
            <BarChart3 size={20} className="text-gray-400" />
          </CardHeader>
          <CardBody>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={leadsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="1"
                  >
                    {leadsByStatus.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {leadsByStatus.map(([status, count], index) => (
                  <div key={status} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600">
                      {statusLabels[status] || status}
                    </span>
                    <span className="text-sm font-medium ml-auto">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">行业分布 TOP5</h3>
          <BarChart3 size={20} className="text-gray-400" />
        </CardHeader>
        <CardBody>
          {leadsByIndustry.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={leadsByIndustry}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="0" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="1" fill="#1a2332" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500">
              暂无行业数据
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
