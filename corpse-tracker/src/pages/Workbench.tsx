import React from 'react';
import { Card, CardHeader, CardBody, Badge, Button, Input, Textarea, Select, Modal } from '../components/common';
import { useLeads, useTasks, useInterviews, useApp } from '../contexts/AppContext';
import { users, industryLabels, statusLabels } from '../data/mockData';
import { 
  Plus, 
  CheckCircle, 
  Clock, 
  Circle, 
  Trash2,
  MessageSquare,
  AlertTriangle,
  Send,
  User,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import type { Task, Interview, TaskStatus } from '../types';

export function Workbench() {
  const { leads, updateLead } = useLeads();
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const { interviews, addInterview } = useInterviews();
  const { state } = useApp();

  const [selectedLeadId, setSelectedLeadId] = React.useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = React.useState(false);
  const [showInterviewModal, setShowInterviewModal] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'tasks' | 'interviews' | 'analysis'>('tasks');

  const myTasks = tasks.filter(t => t.assignee === state.currentUser.id);
  const inProgressLeads = state.leads.filter(l => 
    l.status === 'in_progress' || l.status === 'returned'
  );

  const selectedLead = selectedLeadId 
    ? state.leads.find(l => l.id === selectedLeadId) 
    : inProgressLeads[0];

  const leadTasks = selectedLead 
    ? tasks.filter(t => t.lead_id === selectedLead.id) 
    : [];

  const leadInterviews = selectedLead 
    ? interviews.filter(i => i.lead_id === selectedLead.id) 
    : [];

  const [newTask, setNewTask] = React.useState({
    title: '',
    description: '',
    due_date: '',
    assignee: state.currentUser.id,
  });

  const [newInterview, setNewInterview] = React.useState({
    interviewee: '',
    interview_date: format(new Date(), 'yyyy-MM-dd'),
    content: '',
    key_findings: '',
  });

  const handleAddTask = () => {
    if (selectedLead && newTask.title) {
      addTask({
        lead_id: selectedLead.id,
        title: newTask.title,
        description: newTask.description,
        due_date: newTask.due_date,
        assignee: newTask.assignee,
        status: 'todo',
      });
      setNewTask({ title: '', description: '', due_date: '', assignee: state.currentUser.id });
      setShowTaskModal(false);
    }
  };

  const handleAddInterview = () => {
    if (selectedLead && newInterview.interviewee && newInterview.content) {
      addInterview({
        lead_id: selectedLead.id,
        interviewee: newInterview.interviewee,
        interview_date: newInterview.interview_date,
        content: newInterview.content,
        key_findings: newInterview.key_findings.split('\n').filter(s => s.trim()),
      });
      setNewInterview({ interviewee: '', interview_date: format(new Date(), 'yyyy-MM-dd'), content: '', key_findings: '' });
      setShowInterviewModal(false);
    }
  };

  const toggleTaskStatus = (task: Task) => {
    const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    updateTask({ ...task, status: newStatus });
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'done':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'in_progress':
        return <Clock size={18} className="text-yellow-500" />;
      default:
        return <Circle size={18} className="text-gray-400" />;
    }
  };

  const handleSubmitReview = () => {
    if (selectedLead) {
      updateLead({ ...selectedLead, status: 'in_review' as any });
    }
  };

  const todoTasks = leadTasks.filter(t => t.status === 'todo');
  const inProgressTasks = leadTasks.filter(t => t.status === 'in_progress');
  const doneTasks = leadTasks.filter(t => t.status === 'done');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">编辑工作台</h1>
          <p className="text-gray-500 mt-1">管理您的任务和采访记录</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">进行中的项目</h3>
            </CardHeader>
            <CardBody className="p-0">
              {inProgressLeads.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {inProgressLeads.map(lead => (
                    <button
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedLead?.id === lead.id ? 'bg-accent/10 border-l-4 border-accent' : ''
                      }`}
                    >
                      <h4 className="font-medium text-primary">{lead.project_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={lead.status === 'returned' ? 'returned' : 'in_progress'} className="text-xs">
                          {lead.status === 'returned' ? '已退回' : '编辑中'}
                        </Badge>
                        <span className="text-xs text-gray-500">{industryLabels[lead.industry]}</span>
                      </div>
                      {lead.status === 'returned' && lead.review_comments && (
                        <p className="text-xs text-red-600 mt-2 truncate">
                          审核意见: {lead.review_comments}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  暂无进行中的项目
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <h3 className="font-semibold">我的任务</h3>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {myTasks.length > 0 ? (
                  myTasks.slice(0, 10).map(task => {
                    const lead = state.leads.find(l => l.id === task.lead_id);
                    return (
                      <div key={task.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start gap-3">
                          <button onClick={() => toggleTaskStatus(task)}>
                            {getStatusIcon(task.status)}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                              {task.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {lead?.project_name}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    暂无任务
                  </div>
                )}
              </div>
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
                <div className="flex gap-2">
                  <Badge variant={selectedLead.status === 'returned' ? 'returned' : 'in_progress'}>
                    {selectedLead.status === 'returned' ? '已退回' : '编辑中'}
                  </Badge>
                </div>
              </CardHeader>
              
              {selectedLead.status === 'returned' && selectedLead.review_comments && (
                <div className="px-6 py-3 bg-red-50 border-b border-red-100">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">审核意见</p>
                      <p className="text-sm text-red-600 mt-1">{selectedLead.review_comments}</p>
                    </div>
                  </div>
                </div>
              )}

              <CardBody className="p-0">
                <div className="border-b border-gray-100">
                  <div className="flex">
                    <button
                      onClick={() => setActiveTab('tasks')}
                      className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'tasks' 
                          ? 'border-accent text-accent' 
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      任务 ({leadTasks.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('interviews')}
                      className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'interviews' 
                          ? 'border-accent text-accent' 
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      采访记录 ({leadInterviews.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('analysis')}
                      className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'analysis' 
                          ? 'border-accent text-accent' 
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      失败分析
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {activeTab === 'tasks' && (
                    <div className="space-y-6">
                      <div className="flex justify-end">
                        <Button size="sm" onClick={() => setShowTaskModal(true)}>
                          <Plus size={16} className="mr-1" />
                          添加任务
                        </Button>
                      </div>

                      {['todo', 'in_progress', 'done'].map(status => {
                        const statusTasks = {
                          todo: todoTasks,
                          in_progress: inProgressTasks,
                          done: doneTasks,
                        }[status];
                        
                        return (
                          <div key={status}>
                            <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                              {status === 'todo' && '待办'}
                              {status === 'in_progress' && '进行中'}
                              {status === 'done' && '已完成'}
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                                {statusTasks.length}
                              </span>
                            </h4>
                            <div className="space-y-2">
                              {statusTasks.map(task => {
                                const assignee = users.find(u => u.id === task.assignee);
                                return (
                                  <div
                                    key={task.id}
                                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                                  >
                                    <button onClick={() => toggleTaskStatus(task)}>
                                      {getStatusIcon(task.status)}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                                        {task.title}
                                      </p>
                                      {task.description && (
                                        <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                                      )}
                                      <div className="flex items-center gap-3 mt-2">
                                        {assignee && (
                                          <span className="flex items-center gap-1 text-xs text-gray-500">
                                            <User size={12} />
                                            {assignee.name}
                                          </span>
                                        )}
                                        {task.due_date && (
                                          <span className="flex items-center gap-1 text-xs text-gray-500">
                                            <Calendar size={12} />
                                            {format(new Date(task.due_date), 'MM/dd', { locale: zhCN })}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => deleteTask(task.id)}
                                      className="p-1 text-gray-400 hover:text-red-500"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                );
                              })}
                              {statusTasks.length === 0 && (
                                <p className="text-sm text-gray-400 italic py-2">暂无</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeTab === 'interviews' && (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Button size="sm" onClick={() => setShowInterviewModal(true)}>
                          <Plus size={16} className="mr-1" />
                          添加采访记录
                        </Button>
                      </div>

                      {leadInterviews.length > 0 ? (
                        leadInterviews.map(interview => (
                          <div key={interview.id} className="border-l-2 border-accent pl-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{interview.interviewee}</span>
                              <span className="text-sm text-gray-500">
                                {format(new Date(interview.interview_date), 'yyyy-MM-dd', { locale: zhCN })}
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
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          暂无采访记录
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'analysis' && (
                    <div className="space-y-4">
                      <h4 className="font-medium">失败节点</h4>
                      {selectedLead.failure_nodes && selectedLead.failure_nodes.length > 0 ? (
                        <div className="space-y-3">
                          {selectedLead.failure_nodes.map(node => (
                            <div key={node.id} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="default">
                                  {node.type === 'funding' && '资金链断裂'}
                                  {node.type === 'market_mismatch' && '市场失配'}
                                  {node.type === 'team_issue' && '团队问题'}
                                  {node.type === 'policy' && '政策因素'}
                                  {node.type === 'competition' && '竞争失利'}
                                  {node.type === 'other' && '其他'}
                                </Badge>
                                {node.date && (
                                  <span className="text-sm text-gray-500">{node.date}</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{node.description}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">暂无失败节点分析</p>
                      )}

                      <h4 className="font-medium mt-6">争议点</h4>
                      {selectedLead.disputes && selectedLead.disputes.length > 0 ? (
                        <ul className="space-y-2">
                          {selectedLead.disputes.map((dispute, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-700">
                              <span className="text-accent">•</span>
                              {dispute}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-400 italic">暂无争议点记录</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {leadTasks.length} 个任务 · {doneTasks.length} 已完成
                    </div>
                    <Button onClick={handleSubmitReview}>
                      <Send size={16} className="mr-2" />
                      提交审核
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody className="py-12 text-center text-gray-500">
                请从左侧选择一个项目进行编辑
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="添加任务">
        <div className="space-y-4">
          <Input
            label="任务标题"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            placeholder="请输入任务标题"
          />
          <Textarea
            label="任务描述"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            placeholder="请输入任务描述"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="截止日期"
              type="date"
              value={newTask.due_date}
              onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
            />
            <Select
              label="指派人"
              value={newTask.assignee}
              onChange={(v) => setNewTask({ ...newTask, assignee: v })}
              options={users.filter(u => u.role === 'editor').map(u => ({
                value: u.id,
                label: u.name,
              }))}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowTaskModal(false)}>取消</Button>
            <Button onClick={handleAddTask}>添加</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showInterviewModal} onClose={() => setShowInterviewModal(false)} title="添加采访记录">
        <div className="space-y-4">
          <Input
            label="采访对象"
            value={newInterview.interviewee}
            onChange={(e) => setNewInterview({ ...newInterview, interviewee: e.target.value })}
            placeholder="请输入采访对象姓名"
          />
          <Input
            label="采访日期"
            type="date"
            value={newInterview.interview_date}
            onChange={(e) => setNewInterview({ ...newInterview, interview_date: e.target.value })}
          />
          <Textarea
            label="采访内容"
            value={newInterview.content}
            onChange={(e) => setNewInterview({ ...newInterview, content: e.target.value })}
            placeholder="请记录采访内容"
            rows={4}
          />
          <Textarea
            label="关键发现（每行一条）"
            value={newInterview.key_findings}
            onChange={(e) => setNewInterview({ ...newInterview, key_findings: e.target.value })}
            placeholder="输入关键发现，每行一条"
            rows={3}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowInterviewModal(false)}>取消</Button>
            <Button onClick={handleAddInterview}>添加</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
