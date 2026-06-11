import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardBody, Badge, Button } from '../components/common';
import { useLeads } from '../contexts/AppContext';
import { BatchImport } from '../components/BatchImport';
import { industryLabels, statusLabels, credibilityLabels, priorityLabels, websiteStatusLabels, users } from '../data/mockData';
import { Calendar, Plus, Image as ImageIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Lead } from '../types';

function getDisplayStatus(lead: Lead): { label: string; variant: string } {
  if (lead.status === 'approved') {
    if (lead.publish_type === 'now') {
      return { label: '已发布', variant: 'published' };
    } else if (lead.publish_type === 'scheduled') {
      return { label: `待发布(${lead.scheduled_date ? format(new Date(lead.scheduled_date), 'MM/dd') : ''})`, variant: 'in_review' };
    } else {
      return { label: '待手动发布', variant: 'warning' };
    }
  }
  
  const variantMap: Record<string, string> = {
    new: 'info',
    pending_verification: 'pending',
    in_progress: 'in_progress',
    in_review: 'in_review',
    returned: 'returned',
    approved: 'approved',
    published: 'published',
    rejected: 'danger',
  };
  
  return { 
    label: statusLabels[lead.status] || lead.status, 
    variant: variantMap[lead.status] || 'default' 
  };
}

export function Leads() {
  const navigate = useNavigate();
  const { leads } = useLeads();
  const [selectedStatus, setSelectedStatus] = React.useState<string>('all');

  const filteredLeads = selectedStatus === 'all' 
    ? leads 
    : leads.filter(l => {
        if (selectedStatus === 'published') {
          return l.status === 'published' || (l.status === 'approved' && l.publish_type === 'now');
        }
        if (selectedStatus === 'scheduled') {
          return l.status === 'approved' && l.publish_type === 'scheduled';
        }
        if (selectedStatus === 'manual') {
          return l.status === 'approved' && l.publish_type === 'manual';
        }
        return l.status === selectedStatus;
      });

  const statusCounts = {
    all: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    pending_verification: leads.filter(l => l.status === 'pending_verification').length,
    in_progress: leads.filter(l => l.status === 'in_progress').length,
    in_review: leads.filter(l => l.status === 'in_review').length,
    published: leads.filter(l => 
      l.status === 'published' || 
      (l.status === 'approved' && l.publish_type === 'now')
    ).length,
    scheduled: leads.filter(l => 
      l.status === 'approved' && l.publish_type === 'scheduled'
    ).length,
    manual: leads.filter(l => 
      l.status === 'approved' && l.publish_type === 'manual'
    ).length,
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'text-red-600',
      high: 'text-orange-600',
      medium: 'text-yellow-600',
      low: 'text-gray-600',
    };
    return colors[priority] || 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">线索收集</h1>
          <p className="text-gray-500 mt-1">录入和管理创业项目停运线索</p>
        </div>
        <div className="flex gap-3">
          <BatchImport />
          <Link to="/leads/new">
            <Button>
              <Plus size={18} className="mr-2" />
              新建线索
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: `全部 (${statusCounts.all})` },
          { key: 'new', label: `新线索 (${statusCounts.new})` },
          { key: 'pending_verification', label: `待核实 (${statusCounts.pending_verification})` },
          { key: 'in_progress', label: `编辑中 (${statusCounts.in_progress})` },
          { key: 'in_review', label: `待审核 (${statusCounts.in_review})` },
          { key: 'published', label: `已发布 (${statusCounts.published})` },
          { key: 'scheduled', label: `待发布 (${statusCounts.scheduled})` },
          { key: 'manual', label: `待手动 (${statusCounts.manual})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedStatus(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedStatus === tab.key
                ? 'bg-accent text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLeads.map((lead) => {
          const assignee = users.find(u => u.id === lead.assignee);
          const displayStatus = getDisplayStatus(lead);
          
          return (
            <React.Fragment key={lead.id}>
              <Card 
                hover 
                onClick={() => navigate(`/leads/${lead.id}`)}
                className="group"
              >
                <CardBody className="p-0">
                  <div className="relative">
                    {lead.screenshots[0] ? (
                      <img
                        src={lead.screenshots[0]}
                        alt={lead.project_name}
                        className="w-full h-40 object-cover rounded-t-xl"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-100 rounded-t-xl flex items-center justify-center">
                        <ImageIcon size={48} className="text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge variant={displayStatus.variant as any}>
                        {displayStatus.label}
                      </Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`text-sm font-bold ${getPriorityColor(lead.priority)}`}>
                        {priorityLabels[lead.priority]}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-primary group-hover:text-accent transition-colors">
                      {lead.project_name}
                    </h3>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">行业</span>
                        <span className="font-medium">{industryLabels[lead.industry]}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">官网状态</span>
                        <span className="font-medium">{websiteStatusLabels[lead.website_status]}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">可信度</span>
                        <span className="font-medium">{credibilityLabels[lead.credibility]}</span>
                      </div>
                      {lead.funding_info && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">融资</span>
                          <span className="font-medium text-accent">
                            {lead.funding_info.round} · {lead.funding_info.amount}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={14} />
                        {format(new Date(lead.created_at), 'MM/dd', { locale: zhCN })}
                      </div>
                      {assignee && (
                        <div className="flex items-center gap-2">
                          <img
                            src={assignee.avatar}
                            alt={assignee.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm text-gray-600">{assignee.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </React.Fragment>
          );
        })}
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">暂无线索</p>
          <Link to="/leads/new">
            <Button variant="outline" className="mt-4">
              立即添加第一条线索
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
