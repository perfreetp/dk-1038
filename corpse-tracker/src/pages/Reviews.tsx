import React from 'react';
import { Card, CardHeader, CardBody, Badge, Button, Textarea, Modal } from '../components/common';
import { useLeads } from '../contexts/AppContext';
import { industryLabels, users } from '../data/mockData';
import { 
  CheckCircle, 
  XCircle, 
  Globe,
  Users,
  Building,
  Clock,
  FileText,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { PublicScope } from '../types';

const returnFields = [
  { value: 'failure_nodes', label: '失败节点分析' },
  { value: 'disputes', label: '争议点记录' },
  { value: 'similar_projects', label: '相似项目关联' },
  { value: 'interviews', label: '采访记录' },
  { value: 'screenshots', label: '产品截图' },
  { value: 'shutdown_evidence', label: '停运证据' },
];

export function Reviews() {
  const { leads, approveLead, returnLead, publishLead } = useLeads();

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [comment, setComment] = React.useState('');
  const [publicScope, setPublicScope] = React.useState<PublicScope>('team');
  const [publishType, setPublishType] = React.useState<'now' | 'scheduled' | 'manual'>('now');
  const [scheduledDate, setScheduledDate] = React.useState('');
  const [selectedFields, setSelectedFields] = React.useState<string[]>([]);
  const [showReturnModal, setShowReturnModal] = React.useState(false);
  const [showApproveModal, setShowApproveModal] = React.useState(false);

  const reviewLeads = leads.filter(l => l.status === 'in_review');
  const selectedLead = selectedId ? leads.find(l => l.id === selectedId) : reviewLeads[0];

  const handleApprove = () => {
    if (selectedLead) {
      approveLead(selectedLead.id, publicScope, publishType, scheduledDate || undefined);
      setShowApproveModal(false);
      setSelectedId(null);
    }
  };

  const handleReturn = () => {
    if (selectedLead && comment.trim() && selectedFields.length > 0) {
      returnLead(selectedLead.id, comment, selectedFields);
      setShowReturnModal(false);
      setComment('');
      setSelectedFields([]);
      setSelectedId(null);
    }
  };

  const toggleField = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const getScopeIcon = (scope: PublicScope) => {
    switch (scope) {
      case 'team':
        return <Users size={16} />;
      case 'partner':
        return <Building size={16} />;
      case 'public':
        return <Globe size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">发布审核</h1>
          <p className="text-gray-500 mt-1">共 {reviewLeads.length} 条内容待审核</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">审核队列</h3>
            </CardHeader>
            <CardBody className="p-0">
              {reviewLeads.length > 0 ? (
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {reviewLeads.map(lead => {
                    const creator = users.find(u => u.id === lead.created_by);
                    return (
                      <button
                        key={lead.id}
                        onClick={() => setSelectedId(lead.id)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          selectedLead?.id === lead.id ? 'bg-accent/10 border-l-4 border-accent' : ''
                        }`}
                      >
                        <h4 className="font-medium text-primary">{lead.project_name}</h4>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <span>{industryLabels[lead.industry]}</span>
                        </div>
                        {creator && (
                          <div className="flex items-center gap-2 mt-2">
                            <img src={creator.avatar} alt={creator.name} className="w-5 h-5 rounded-full" />
                            <span className="text-xs text-gray-500">{creator.name}</span>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          提交时间: {format(new Date(lead.updated_at), 'MM/dd HH:mm', { locale: zhCN })}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                  <p>暂无待审核内容</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedLead ? (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedLead.project_name}</h3>
                  <p className="text-sm text-gray-500">{industryLabels[selectedLead.industry]}</p>
                </div>
                <Badge variant="in_review">待审核</Badge>
              </CardHeader>
              
              <CardBody className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">可信度</p>
                    <p className="font-medium capitalize">{selectedLead.credibility}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">优先级</p>
                    <p className="font-medium capitalize">{selectedLead.priority}</p>
                  </div>
                  {selectedLead.funding_info && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">融资轮次</p>
                        <p className="font-medium text-accent">{selectedLead.funding_info.round}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">融资金额</p>
                        <p className="font-medium text-accent">{selectedLead.funding_info.amount}</p>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText size={16} />
                    停运证据
                  </h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {selectedLead.shutdown_evidence}
                  </p>
                </div>

                {selectedLead.failure_nodes && selectedLead.failure_nodes.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      失败节点分析
                    </h4>
                    <div className="space-y-2">
                      {selectedLead.failure_nodes.map(node => (
                        <div key={node.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                          <Badge variant="default" className="flex-shrink-0">
                            {node.type === 'funding' && '资金'}
                            {node.type === 'market_mismatch' && '市场'}
                            {node.type === 'team_issue' && '团队'}
                            {node.type === 'policy' && '政策'}
                            {node.type === 'competition' && '竞争'}
                            {node.type === 'other' && '其他'}
                          </Badge>
                          <p className="text-sm text-gray-600">{node.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedLead.screenshots.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">产品截图</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedLead.screenshots.map((screenshot, index) => (
                        <img
                          key={index}
                          src={screenshot}
                          alt={`截图 ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>

              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                <div className="flex gap-3">
                  <Button variant="danger" onClick={() => setShowReturnModal(true)}>
                    <XCircle size={16} className="mr-1" />
                    退回修改
                  </Button>
                </div>
                <div className="flex gap-3">
                  <Button variant="success" onClick={() => setShowApproveModal(true)}>
                    <CheckCircle size={16} className="mr-1" />
                    批准入库
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <CardBody className="py-12 text-center text-gray-500">
                请从左侧选择一个项目进行审核
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} title="退回修改">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">请选择需补充的字段</h4>
            <div className="grid grid-cols-2 gap-2">
              {returnFields.map(field => (
                <button
                  key={field.value}
                  onClick={() => toggleField(field.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    selectedFields.includes(field.value)
                      ? 'border-accent bg-accent/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-sm">{field.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <Textarea
            label="审核意见"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="请输入详细的审核意见"
            rows={4}
          />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowReturnModal(false)}>取消</Button>
            <Button 
              variant="danger" 
              onClick={handleReturn}
              disabled={!comment.trim() || selectedFields.length === 0}
            >
              确认退回
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showApproveModal} onClose={() => setShowApproveModal(false)} title="批准入库">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">公开范围</h4>
            <div className="flex gap-3">
              {[
                { value: 'team' as PublicScope, label: '团队内', icon: Users },
                { value: 'partner' as PublicScope, label: '合作伙伴', icon: Building },
                { value: 'public' as PublicScope, label: '公开', icon: Globe },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setPublicScope(option.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    publicScope === option.value
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <option.icon size={16} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">发布方式</h4>
            <div className="space-y-2">
              {[
                { value: 'now' as const, label: '立即公开', icon: Globe, desc: '审核通过后立即可见' },
                { value: 'scheduled' as const, label: '定时公开', icon: Clock, desc: '选择日期后自动公开' },
                { value: 'manual' as const, label: '手动公开', icon: Calendar, desc: '需要手动点击发布' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setPublishType(option.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                    publishType === option.value
                      ? 'border-accent bg-accent/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <option.icon size={20} className={publishType === option.value ? 'text-accent' : 'text-gray-400'} />
                  <div className="text-left">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-gray-500">{option.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {publishType === 'scheduled' && (
            <div>
              <label className="block text-sm font-medium mb-1">选择发布日期</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowApproveModal(false)}>取消</Button>
            <Button variant="success" onClick={handleApprove}>
              确认批准
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
