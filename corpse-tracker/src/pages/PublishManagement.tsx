import React from 'react';
import { Card, CardHeader, CardBody, Badge, Button } from '../components/common';
import { useLeads } from '../contexts/AppContext';
import { industryLabels, users } from '../data/mockData';
import { 
  Globe,
  Clock,
  Calendar,
  Edit,
  X,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function PublishManagement() {
  const { leads, updateLead, publishLead } = useLeads();
  const [editingDate, setEditingDate] = React.useState<string | null>(null);
  const [newDate, setNewDate] = React.useState('');

  const publishedLeads = leads.filter(l => l.status === 'published');
  const scheduledLeads = leads.filter(l => 
    l.status === 'approved' && l.publish_type === 'scheduled'
  );
  const manualLeads = leads.filter(l => 
    l.status === 'approved' && l.publish_type === 'manual'
  );

  const handlePublishNow = (leadId: string) => {
    if (confirm('确认立即发布？')) {
      publishLead(leadId);
    }
  };

  const handleCancelSchedule = (leadId: string) => {
    if (confirm('确认取消定时发布？将改为待手动发布')) {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        updateLead({
          ...lead,
          publish_type: 'manual',
          scheduled_date: undefined,
        });
      }
    }
  };

  const handleChangeDate = (leadId: string) => {
    if (newDate) {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        updateLead({
          ...lead,
          scheduled_date: newDate,
        });
      }
      setEditingDate(null);
      setNewDate('');
    }
  };

  const startEditDate = (leadId: string, currentDate?: string) => {
    setEditingDate(leadId);
    setNewDate(currentDate || format(new Date(), 'yyyy-MM-dd'));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">发布管理</h1>
          <p className="text-gray-500 mt-1">统一管理所有发布计划</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Globe size={20} className="text-green-500" />
            <h3 className="font-semibold">已发布</h3>
            <Badge variant="published" className="ml-auto">
              {publishedLeads.length}
            </Badge>
          </CardHeader>
          <CardBody className="p-0">
            {publishedLeads.length > 0 ? (
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {publishedLeads.map(lead => {
                  const creator = users.find(u => u.id === lead.created_by);
                  return (
                    <div key={lead.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-primary">{lead.project_name}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {industryLabels[lead.industry]}
                          </p>
                          {creator && (
                            <div className="flex items-center gap-2 mt-2">
                              <img src={creator.avatar} alt={creator.name} className="w-5 h-5 rounded-full" />
                              <span className="text-xs text-gray-500">{creator.name}</span>
                            </div>
                          )}
                        </div>
                        <Badge variant="published">已发布</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-500 opacity-50" />
                <p>暂无已发布内容</p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <Clock size={20} className="text-blue-500" />
            <h3 className="font-semibold">定时发布</h3>
            <Badge variant="in_review" className="ml-auto">
              {scheduledLeads.length}
            </Badge>
          </CardHeader>
          <CardBody className="p-0">
            {scheduledLeads.length > 0 ? (
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {scheduledLeads.map(lead => {
                  const creator = users.find(u => u.id === lead.created_by);
                  const isEditing = editingDate === lead.id;
                  
                  return (
                    <div key={lead.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-primary">{lead.project_name}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {industryLabels[lead.industry]}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar size={14} className="text-gray-400" />
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="date"
                                  value={newDate}
                                  onChange={(e) => setNewDate(e.target.value)}
                                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                                <Button size="sm" onClick={() => handleChangeDate(lead.id)}>
                                  保存
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingDate(null)}>
                                  取消
                                </Button>
                              </div>
                            ) : (
                              <span className="text-sm text-blue-600 font-medium">
                                {lead.scheduled_date ? format(new Date(lead.scheduled_date), 'yyyy-MM-dd', { locale: zhCN }) : '未设置'}
                              </span>
                            )}
                          </div>
                          {creator && (
                            <div className="flex items-center gap-2 mt-2">
                              <img src={creator.avatar} alt={creator.name} className="w-5 h-5 rounded-full" />
                              <span className="text-xs text-gray-500">{creator.name}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {!isEditing && (
                            <>
                              <button
                                onClick={() => startEditDate(lead.id, lead.scheduled_date)}
                                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                title="修改日期"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleCancelSchedule(lead.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                title="取消定时"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Clock size={48} className="mx-auto mb-4 text-blue-500 opacity-50" />
                <p>暂无定时发布内容</p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" />
            <h3 className="font-semibold">待手动发布</h3>
            <Badge variant="warning" className="ml-auto">
              {manualLeads.length}
            </Badge>
          </CardHeader>
          <CardBody className="p-0">
            {manualLeads.length > 0 ? (
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {manualLeads.map(lead => {
                  const creator = users.find(u => u.id === lead.created_by);
                  return (
                    <div key={lead.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-primary">{lead.project_name}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {industryLabels[lead.industry]}
                          </p>
                          {creator && (
                            <div className="flex items-center gap-2 mt-2">
                              <img src={creator.avatar} alt={creator.name} className="w-5 h-5 rounded-full" />
                              <span className="text-xs text-gray-500">{creator.name}</span>
                            </div>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="success"
                          onClick={() => handlePublishNow(lead.id)}
                        >
                          <Globe size={14} className="mr-1" />
                          立即发布
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <AlertTriangle size={48} className="mx-auto mb-4 text-orange-500 opacity-50" />
                <p>暂无待手动发布内容</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
