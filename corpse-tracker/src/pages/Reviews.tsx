import React from 'react';
import { Card, CardHeader, CardBody, Badge, Button, Textarea, Select } from '../components/common';
import { useLeads } from '../contexts/AppContext';
import { industryLabels, users } from '../data/mockData';
import { 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  ArrowRight,
  Globe,
  Users,
  Building,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import type { PublicScope } from '../types';

export function Reviews() {
  const { leads, approveLead, returnLead, publishLead } = useLeads();

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [comment, setComment] = React.useState('');
  const [publicScope, setPublicScope] = React.useState<PublicScope>('team');

  const reviewLeads = leads.filter(l => l.status === 'in_review');
  const selectedLead = selectedId ? leads.find(l => l.id === selectedId) : reviewLeads[0];

  const handleApprove = () => {
    if (selectedLead) {
      approveLead(selectedLead.id, publicScope);
      setSelectedId(null);
    }
  };

  const handleReturn = () => {
    if (selectedLead && comment.trim()) {
      returnLead(selectedLead.id, comment);
      setComment('');
      setSelectedId(null);
    }
  };

  const handlePublish = () => {
    if (selectedLead) {
      publishLead(selectedLead.id);
    }
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

                <div>
                  <h4 className="font-medium mb-2">审核意见</h4>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="请输入审核意见（退回时必填）"
                    rows={3}
                  />
                </div>

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
                  <Button variant="danger" onClick={handleReturn} disabled={!comment.trim()}>
                    <XCircle size={16} className="mr-1" />
                    退回修改
                  </Button>
                </div>
                <div className="flex gap-3">
                  <Button variant="success" onClick={handleApprove}>
                    <CheckCircle size={16} className="mr-1" />
                    批准入库
                  </Button>
                  {selectedLead.status === 'approved' && (
                    <Button onClick={handlePublish}>
                      <Globe size={16} className="mr-1" />
                      发布
                    </Button>
                  )}
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
    </div>
  );
}
