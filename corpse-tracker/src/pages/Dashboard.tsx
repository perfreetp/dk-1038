import React from 'react';
import { Card, CardHeader, CardBody, Select } from '../components/common';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  Activity,
  BarChart3,
  Users,
  Download,
  Filter,
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
import { startOfWeek, startOfMonth, startOfYear, isWithinInterval, subDays, format, subMonths } from 'date-fns';

const COLORS = ['#d4a574', '#1a2332', '#28a745', '#dc3545', '#007bff'];

const timeRanges = [
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'quarter', label: '近三月' },
  { value: 'year', label: '本年' },
  { value: 'all', label: '全部' },
];

export function Dashboard() {
  const { state } = useApp();
  const { leads, tasks } = state;

  const [timeRange, setTimeRange] = React.useState('week');
  const [industryFilter, setIndustryFilter] = React.useState('');
  const [assigneeFilter, setAssigneeFilter] = React.useState('');

  const now = new Date();
  
  const getDateRange = () => {
    switch (timeRange) {
      case 'week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: now };
      case 'month':
        return { start: startOfMonth(now), end: now };
      case 'quarter':
        return { start: subMonths(now, 3), end: now };
      case 'year':
        return { start: startOfYear(now), end: now };
      default:
        return { start: new Date(0), end: now };
    }
  };

  const dateRange = getDateRange();

  const filteredLeads = leads.filter(l => {
    const createdAt = new Date(l.created_at);
    const matchesDate = isWithinInterval(createdAt, { start: dateRange.start, end: dateRange.end });
    const matchesIndustry = !industryFilter || l.industry === industryFilter;
    const matchesAssignee = !assigneeFilter || l.assignee === assigneeFilter;
    return matchesDate && matchesIndustry && matchesAssignee;
  });

  const weeklyNew = filteredLeads.length;

  const pendingVerification = filteredLeads.filter(l => 
    l.status === 'pending_verification' || l.status === 'new'
  ).length;

  const approved = filteredLeads.filter(l => l.status === 'approved' || l.status === 'published').length;
  const totalReviewed = filteredLeads.filter(l => 
    ['approved', 'published', 'rejected'].includes(l.status)
  ).length;
  const approvalRate = totalReviewed > 0 ? Math.round((approved / totalReviewed) * 100) : 0;

  const leadsByStatus = Object.entries(
    filteredLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  );

  const leadsByIndustry = Object.entries(
    filteredLeads.reduce<Record<string, number>>((acc, lead) => {
      const label = industryLabels[lead.industry] || '其他';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const filteredTasks = tasks.filter(t => {
    const lead = leads.find(l => l.id === t.lead_id);
    if (!lead) return false;
    const leadCreatedAt = new Date(lead.created_at);
    const matchesDate = isWithinInterval(leadCreatedAt, { start: dateRange.start, end: dateRange.end });
    const matchesIndustry = !industryFilter || lead.industry === industryFilter;
    const matchesAssignee = !assigneeFilter || lead.assignee === assigneeFilter;
    return matchesDate && matchesIndustry && matchesAssignee;
  });

  const editorProgress = users
    .filter(u => u.role === 'editor')
    .map(user => {
      const userTasks = filteredTasks.filter(t => t.assignee === user.id);
      const completed = userTasks.filter(t => t.status === 'done').length;
      return {
        editor: user.name,
        completed,
        total: userTasks.length,
      };
    });

  const dayCount = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === 'quarter' ? 90 : timeRange === 'year' ? 365 : 30;
  const trend = Array.from({ length: Math.min(dayCount, 30) }, (_, i) => {
    const date = subDays(now, Math.min(dayCount, 30) - 1 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = filteredLeads.filter(l => {
      const createdAt = format(new Date(l.created_at), 'yyyy-MM-dd');
      return createdAt === dateStr;
    }).length;
    return { date: dateStr, count };
  });

  const handleExport = () => {
    const exportData = {
      exportTime: format(now, 'yyyy-MM-dd HH:mm'),
      filters: {
        timeRange,
        industry: industryFilter,
        assignee: assigneeFilter,
      },
      summary: {
        totalLeads: filteredLeads.length,
        weeklyNew,
        pendingVerification,
        approvalRate,
      },
      byStatus: leadsByStatus.map(([status, count]) => ({
        status: statusLabels[status] || status,
        count,
      })),
      byIndustry: leadsByIndustry,
      editorProgress,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corpse-tracker-export-${format(now, 'yyyyMMdd-HHmm')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = ['项目名称', '行业', '官网状态', '可信度', '优先级', '状态', '负责人', '创建时间'];
    const rows = filteredLeads.map(lead => {
      const assignee = users.find(u => u.id === lead.assignee);
      return [
        lead.project_name,
        industryLabels[lead.industry],
        lead.website_status,
        lead.credibility,
        lead.priority,
        statusLabels[lead.status],
        assignee?.name || '',
        format(new Date(lead.created_at), 'yyyy-MM-dd HH:mm'),
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corpse-tracker-leads-${format(now, 'yyyyMMdd-HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">数据概览</h1>
          <p className="text-gray-500 mt-1">实时掌握创业尸体库运营状态</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {timeRanges.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>

            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">全部行业</option>
              {Object.entries(industryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">全部负责人</option>
              {users.filter(u => u.role === 'editor').map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-accent hover:bg-accent/10 rounded-lg transition-colors"
          >
            <Download size={16} />
            导出 JSON
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-accent hover:bg-accent/10 rounded-lg transition-colors"
          >
            <Download size={16} />
            导出 CSV
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        当前筛选: 共 {filteredLeads.length} 条线索
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="!p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-accent to-accent-dark p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">本周新增</p>
                <p className="text-4xl font-bold mt-2">{weeklyNew}</p>
                <p className="text-white/60 text-sm mt-1">筛选范围内</p>
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
                <p className="text-white/60 text-sm mt-1">已审核 {totalReviewed} 条</p>
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
                <p className="text-4xl font-bold mt-2">{filteredLeads.length}</p>
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
              <AreaChart data={trend}>
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
              {[
                { source: '财经媒体', count: 45, quality: 92 },
                { source: '社交媒体', count: 28, quality: 65 },
                { source: '用户爆料', count: 15, quality: 72 },
                { source: '企业公告', count: 8, quality: 95 },
              ].map((item, index) => (
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
