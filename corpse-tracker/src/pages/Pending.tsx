import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, Badge, Button, Input, Select } from '../components/common';
import { useLeads } from '../contexts/AppContext';
import { 
  industryLabels, 
  statusLabels, 
  credibilityLabels, 
  priorityLabels,
  users 
} from '../data/mockData';
import { Search, Filter, CheckCircle, XCircle, Clock, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function Pending() {
  const navigate = useNavigate();
  const { leads, updateLead } = useLeads();
  
  const [search, setSearch] = React.useState('');
  const [industryFilter, setIndustryFilter] = React.useState('');
  const [credibilityFilter, setCredibilityFilter] = React.useState('');
  const [priorityFilter, setPriorityFilter] = React.useState('');

  const pendingLeads = leads.filter(l => 
    l.status === 'pending_verification' || l.status === 'new'
  );

  const filteredLeads = pendingLeads.filter(lead => {
    const matchesSearch = lead.project_name.toLowerCase().includes(search.toLowerCase()) ||
      lead.shutdown_evidence.toLowerCase().includes(search.toLowerCase());
    const matchesIndustry = !industryFilter || lead.industry === industryFilter;
    const matchesCredibility = !credibilityFilter || lead.credibility === credibilityFilter;
    const matchesPriority = !priorityFilter || lead.priority === priorityFilter;
    return matchesSearch && matchesIndustry && matchesCredibility && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[priority] || colors.low;
  };

  const handleAssign = (leadId: string, userId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      updateLead({ ...lead, assignee: userId || undefined });
    }
  };

  const handleVerify = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      updateLead({ ...lead, status: 'in_progress' as any });
    }
  };

  const handleReject = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      updateLead({ ...lead, status: 'rejected' as any });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">待核实列表</h1>
          <p className="text-gray-500 mt-1">共 {filteredLeads.length} 条线索等待核实</p>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="搜索项目名称或内容..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>
        
        <Select
          options={[
            { value: '', label: '全部行业' },
            { value: 'e-commerce', label: '电商' },
            { value: 'social', label: '社交' },
            { value: 'finance', label: '金融' },
            { value: 'education', label: '教育' },
            { value: 'healthcare', label: '医疗健康' },
            { value: 'travel', label: '出行旅游' },
            { value: 'food', label: '餐饮美食' },
            { value: 'entertainment', label: '文娱传媒' },
            { value: 'technology', label: '科技' },
            { value: 'automotive', label: '汽车出行' },
            { value: 'other', label: '其他' },
          ]}
          value={industryFilter}
          onChange={setIndustryFilter}
          className="w-40"
        />

        <Select
          options={[
            { value: '', label: '全部可信度' },
            { value: 'high', label: '高' },
            { value: 'medium', label: '中' },
            { value: 'low', label: '低' },
          ]}
          value={credibilityFilter}
          onChange={setCredibilityFilter}
          className="w-36"
        />

        <Select
          options={[
            { value: '', label: '全部优先级' },
            { value: 'urgent', label: '紧急' },
            { value: 'high', label: '高' },
            { value: 'medium', label: '中' },
            { value: 'low', label: '低' },
          ]}
          value={priorityFilter}
          onChange={setPriorityFilter}
          className="w-36"
        />
      </div>

      <div className="space-y-4">
        {filteredLeads.map((lead) => {
          const assignee = users.find(u => u.id === lead.assignee);
          return (
            <React.Fragment key={lead.id}>
              <Card hover onClick={() => navigate(`/leads/${lead.id}`)}>
                <CardBody className="p-6">
                  <div className="flex items-start gap-6">
                    {lead.screenshots[0] ? (
                      <img
                        src={lead.screenshots[0]}
                        alt={lead.project_name}
                        className="w-32 h-24 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-32 h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <ImageIcon size={32} className="text-gray-300" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-primary">{lead.project_name}</h3>
                        <Badge className={getPriorityColor(lead.priority)}>
                          {priorityLabels[lead.priority]}
                        </Badge>
                        <Badge variant={lead.credibility === 'high' ? 'success' : lead.credibility === 'medium' ? 'warning' : 'danger'}>
                          可信度: {credibilityLabels[lead.credibility]}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {lead.shutdown_evidence}
                      </p>

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <span>行业:</span>
                          <span className="font-medium text-gray-700">{industryLabels[lead.industry]}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {format(new Date(lead.created_at), 'MM/dd HH:mm', { locale: zhCN })}
                        </span>
                        {assignee ? (
                          <span className="flex items-center gap-2">
                            <img src={assignee.avatar} alt={assignee.name} className="w-5 h-5 rounded-full" />
                            {assignee.name}
                          </span>
                        ) : (
                          <span className="text-accent">待分配</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.assignee || ''}
                        onChange={(e) => handleAssign(lead.id, e.target.value)}
                        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="">分配给</option>
                        {users.filter(u => u.role === 'editor').map(user => (
                          <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                      </select>
                      <Button 
                        size="sm" 
                        variant="success"
                        onClick={() => handleVerify(lead.id)}
                      >
                        <CheckCircle size={14} className="mr-1" />
                        核实通过
                      </Button>
                      <Button 
                        size="sm" 
                        variant="danger"
                        onClick={() => handleReject(lead.id)}
                      >
                        <XCircle size={14} className="mr-1" />
                        拒绝
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </React.Fragment>
          );
        })}
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl">
          <p className="text-gray-500">暂无待核实的线索</p>
        </div>
      )}
    </div>
  );
}
