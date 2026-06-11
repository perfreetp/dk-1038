import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardBody, CardFooter, Badge, Button } from '../components/common';
import { useLeads, useTasks, useInterviews } from '../contexts/AppContext';
import { HistoryTimeline } from '../components/HistoryPanel';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  ExternalLink, 
  FileText, 
  Clock,
  MessageSquare,
  Link as LinkIcon,
  AlertTriangle,
  CheckCircle,
  Send,
  Edit,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  industryLabels, 
  statusLabels, 
  credibilityLabels, 
  priorityLabels, 
  websiteStatusLabels,
  users 
} from '../data/mockData';
import type { LeadStatus } from '../types';

export function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { leads, updateLead, submitForReview, deleteLead } = useLeads();
  const { tasks } = useTasks();
  const { interviews } = useInterviews();

  const lead = leads.find(l => l.id === id);
  const leadTasks = tasks.filter(t => t.lead_id === id);
  const leadInterviews = interviews.filter(i => i.lead_id === id);

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">线索不存在</p>
        <Link to="/leads">
          <Button className="mt-4">返回列表</Button>
        </Link>
      </div>
    );
  }

  const assignee = users.find(u => u.id === lead.assignee);
  const creator = users.find(u => u.id === lead.created_by);

  const getStatusVariant = (status: string) => {
    const variants: Record<string, any> = {
      new: 'info',
      pending_verification: 'pending',
      in_progress: 'in_progress',
      in_review: 'in_review',
      returned: 'returned',
      approved: 'approved',
      published: 'published',
      rejected: 'danger',
    };
    return variants[status] || 'default';
  };

  const getDisplayStatus = () => {
    if (lead.status === 'approved') {
      if (lead.publish_type === 'now') {
        return { label: '已发布', variant: 'published' };
      } else if (lead.publish_type === 'scheduled') {
        return { label: `定时发布 (${lead.scheduled_date || ''})`, variant: 'in_review' };
      } else {
        return { label: '待手动发布', variant: 'warning' };
      }
    }
    return { 
      label: statusLabels[lead.status] || lead.status, 
      variant: getStatusVariant(lead.status) 
    };
  };

  const handleSubmitReview = () => {
    if (confirm('确认提交审核？')) {
      submitForReview(lead.id);
    }
  };

  const handleDelete = () => {
    if (confirm('确认删除此线索？此操作不可撤销')) {
      deleteLead(lead.id);
      navigate('/leads');
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'in_progress':
        return <Clock size={16} className="text-yellow-500" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/leads" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-primary">{lead.project_name}</h1>
              <Badge variant={getDisplayStatus().variant as any}>
                {getDisplayStatus().label}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              创建于 {format(new Date(lead.created_at), 'yyyy年MM月dd日', { locale: zhCN })}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {(lead.status === 'in_progress' || lead.status === 'returned') && (
            <Button onClick={handleSubmitReview}>
              <Send size={18} className="mr-2" />
              提交审核
            </Button>
          )}
          <Button variant="outline">
            <Edit size={18} className="mr-2" />
            编辑
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={18} className="mr-2" />
            删除
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {lead.screenshots.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold">产品截图</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 gap-4">
                  {lead.screenshots.map((screenshot, index) => (
                    <img
                      key={index}
                      src={screenshot}
                      alt={`截图 ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h3 className="font-semibold">停运证据</h3>
            </CardHeader>
            <CardBody>
              <p className="text-gray-700 whitespace-pre-wrap">{lead.shutdown_evidence}</p>
            </CardBody>
          </Card>

          {lead.failure_nodes && lead.failure_nodes.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold">失败节点分析</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {lead.failure_nodes.map((node) => (
                    <div key={node.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <AlertTriangle size={20} className="text-accent flex-shrink-0 mt-1" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {node.type === 'funding' && '资金链断裂'}
                            {node.type === 'market_mismatch' && '市场失配'}
                            {node.type === 'team_issue' && '团队问题'}
                            {node.type === 'policy' && '政策因素'}
                            {node.type === 'competition' && '竞争失利'}
                            {node.type === 'other' && '其他'}
                          </span>
                          {node.date && (
                            <span className="text-sm text-gray-500">
                              {format(new Date(node.date), 'yyyy-MM-dd')}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">{node.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {lead.disputes && lead.disputes.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold">争议点记录</h3>
              </CardHeader>
              <CardBody>
                <ul className="space-y-2">
                  {lead.disputes.map((dispute, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <span className="text-accent">•</span>
                      {dispute}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}

          {leadInterviews.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold">采访记录</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {leadInterviews.map((interview) => (
                    <div key={interview.id} className="border-l-2 border-accent pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{interview.interviewee}</span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(interview.interview_date), 'yyyy-MM-dd')}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{interview.content}</p>
                      {interview.key_findings.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {interview.key_findings.map((finding, idx) => (
                            <React.Fragment key={idx}>
                              <Badge variant="default">{finding}</Badge>
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {lead.review_comments && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold">审核意见</h3>
              </CardHeader>
              <CardBody>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-gray-700">{lead.review_comments}</p>
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h3 className="font-semibold">协作记录</h3>
            </CardHeader>
            <CardBody>
              <HistoryTimeline leadId={lead.id} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">基本信息</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">行业</p>
                <p className="font-medium">{industryLabels[lead.industry]}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">官网状态</p>
                <p className="font-medium">{websiteStatusLabels[lead.website_status]}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">可信度</p>
                <p className="font-medium">{credibilityLabels[lead.credibility]}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">优先级</p>
                <p className="font-medium">{priorityLabels[lead.priority]}</p>
              </div>
              {lead.funding_info && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">融资信息</p>
                  <p className="font-medium text-accent">
                    {lead.funding_info.round} · {lead.funding_info.amount}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold">负责人</h3>
            </CardHeader>
            <CardBody>
              {assignee ? (
                <div className="flex items-center gap-3">
                  <img
                    src={assignee.avatar}
                    alt={assignee.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{assignee.name}</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {assignee.role === 'editor' ? '编辑' : assignee.role === 'reviewer' ? '审核人' : '成员'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">未分配</p>
              )}
            </CardBody>
          </Card>

          {lead.news_sources.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold">新闻来源</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {lead.news_sources.map((source, index) => (
                    <a
                      key={index}
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-accent hover:text-accent-dark text-sm"
                    >
                      <ExternalLink size={14} />
                      来源 {index + 1}
                    </a>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {leadTasks.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold">待办任务 ({leadTasks.length})</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {leadTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3">
                      {getTaskStatusIcon(task.status)}
                      <div className="flex-1">
                        <p className={`text-sm ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          截止: {format(new Date(task.due_date), 'MM/dd')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {lead.similar_projects && lead.similar_projects.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold">相似项目</h3>
              </CardHeader>
              <CardBody>
                <div className="flex flex-wrap gap-2">
                  {lead.similar_projects.map((project, index) => (
                    <React.Fragment key={index}>
                      <Badge variant="default">{project}</Badge>
                    </React.Fragment>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
