import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardBody, Button, Input, Textarea, Select } from '../components/common';
import { useLeads, useApp } from '../contexts/AppContext';
import { ArrowLeft, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { users } from '../data/mockData';

export function NewLead() {
  const navigate = useNavigate();
  const { addLead } = useLeads();
  const { state } = useApp();
  
  const [formData, setFormData] = React.useState({
    project_name: '',
    website_status: '',
    industry: '',
    credibility: '',
    priority: '',
    shutdown_evidence: '',
    assignee: '',
  });

  const [screenshots, setScreenshots] = React.useState<string[]>([]);
  const [newsSources, setNewsSources] = React.useState<string[]>(['']);
  const [fundingRound, setFundingRound] = React.useState('');
  const [fundingAmount, setFundingAmount] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.project_name.trim()) newErrors.project_name = '请输入项目名称';
    if (!formData.website_status) newErrors.website_status = '请选择官网状态';
    if (!formData.industry) newErrors.industry = '请选择行业';
    if (!formData.credibility) newErrors.credibility = '请选择可信度';
    if (!formData.priority) newErrors.priority = '请选择优先级';
    if (!formData.shutdown_evidence.trim()) newErrors.shutdown_evidence = '请详细描述停运证据';
    if (formData.shutdown_evidence.length < 10) newErrors.shutdown_evidence = '请详细描述停运证据（至少10个字符）';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setScreenshots(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    addLead({
      project_name: formData.project_name,
      website_status: formData.website_status as any,
      screenshots: screenshots,
      news_sources: newsSources.filter(s => s.trim() !== ''),
      funding_info: fundingRound && fundingAmount 
        ? { round: fundingRound, amount: fundingAmount }
        : undefined,
      shutdown_evidence: formData.shutdown_evidence,
      industry: formData.industry as any,
      credibility: formData.credibility as any,
      priority: formData.priority as any,
      assignee: formData.assignee || undefined,
      status: 'new',
      created_by: state.currentUser.id,
    });
    navigate('/leads');
  };

  const addNewsSource = () => {
    setNewsSources([...newsSources, '']);
  };

  const removeNewsSource = (index: number) => {
    setNewsSources(newsSources.filter((_, i) => i !== index));
  };

  const updateNewsSource = (index: number, value: string) => {
    const updated = [...newsSources];
    updated[index] = value;
    setNewsSources(updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/leads" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary">新建线索</h1>
          <p className="text-gray-500 mt-1">录入创业项目停运线索信息</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h3 className="font-semibold">基本信息</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="项目名称 *"
              placeholder="请输入项目名称"
              error={errors.project_name}
              value={formData.project_name}
              onChange={(e) => updateForm('project_name', e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="官网状态 *"
                options={[
                  { value: '', label: '请选择' },
                  { value: 'normal', label: '正常访问' },
                  { value: 'redirect', label: '已跳转' },
                  { value: 'shutdown', label: '已关闭' },
                ]}
                value={formData.website_status}
                onChange={(v) => updateForm('website_status', v)}
              />

              <Select
                label="行业分类 *"
                options={[
                  { value: '', label: '请选择' },
                  { value: 'e-commerce', label: '电商' },
                  { value: 'social', label: '社交' },
                  { value: 'finance', label: '金融' },
                  { value: 'education', label: '教育' },
                  { value: 'healthcare', label: '医疗健康' },
                  { value: 'travel', label: '出行旅游' },
                  { value: 'food', label: '餐饮美食' },
                  { value: 'entertainment', label: '文娱传媒' },
                  { value: 'technology', label: '科技' },
                  { value: 'real-estate', label: '房地产' },
                  { value: 'automotive', label: '汽车出行' },
                  { value: 'other', label: '其他' },
                ]}
                value={formData.industry}
                onChange={(v) => updateForm('industry', v)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="可信度 *"
                options={[
                  { value: '', label: '请选择' },
                  { value: 'high', label: '高 - 有官方公告或权威媒体报道' },
                  { value: 'medium', label: '中 - 有多个独立来源证实' },
                  { value: 'low', label: '低 - 单一来源或用户爆料' },
                ]}
                value={formData.credibility}
                onChange={(v) => updateForm('credibility', v)}
              />

              <Select
                label="优先级 *"
                options={[
                  { value: '', label: '请选择' },
                  { value: 'urgent', label: '紧急 - 热点事件，需立即处理' },
                  { value: 'high', label: '高 - 知名项目或重大事件' },
                  { value: 'medium', label: '中 - 一般项目' },
                  { value: 'low', label: '低 - 补充性线索' },
                ]}
                value={formData.priority}
                onChange={(v) => updateForm('priority', v)}
              />
            </div>

            <Select
              label="负责人"
              options={[
                { value: '', label: '暂不分配' },
                ...users.filter(u => u.role === 'editor').map(u => ({
                  value: u.id,
                  label: u.name,
                })),
              ]}
              value={formData.assignee}
              onChange={(v) => updateForm('assignee', v)}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold">产品截图</h3>
            <p className="text-sm text-gray-500 font-normal">上传产品页面截图</p>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-4 gap-4">
              {screenshots.map((screenshot, index) => (
                <div key={index} className="relative group">
                  <img
                    src={screenshot}
                    alt={`截图 ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeScreenshot(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-accent hover:bg-gray-50 transition-colors">
                <Upload size={24} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">上传截图</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                />
              </label>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold">融资信息</h3>
            <p className="text-sm text-gray-500 font-normal">如有融资记录请填写</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="融资轮次"
                placeholder="如：A轮、B轮、天使轮"
                value={fundingRound}
                onChange={(e) => setFundingRound(e.target.value)}
              />
              <Input
                label="融资金额"
                placeholder="如：1000万、1亿"
                value={fundingAmount}
                onChange={(e) => setFundingAmount(e.target.value)}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold">新闻来源</h3>
            <p className="text-sm text-gray-500 font-normal">添加相关的新闻报道链接</p>
          </CardHeader>
          <CardBody className="space-y-3">
            {newsSources.map((source, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="请输入新闻来源链接"
                  value={source}
                  onChange={(e) => updateNewsSource(index, e.target.value)}
                  className="flex-1"
                />
                {newsSources.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeNewsSource(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addNewsSource}
              className="flex items-center gap-2 text-accent hover:text-accent-dark transition-colors"
            >
              <Plus size={18} />
              添加来源
            </button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold">停运证据 *</h3>
          </CardHeader>
          <CardBody>
            <Textarea
              placeholder="请详细描述项目停运的证据，包括但不限于：
- 官方公告或声明
- 用户反馈和投诉
- 社交媒体上的相关信息
- 工商信息变更
- 其他能证明项目已停止运营的信息"
              rows={6}
              error={errors.shutdown_evidence}
              value={formData.shutdown_evidence}
              onChange={(e) => updateForm('shutdown_evidence', e.target.value)}
            />
          </CardBody>
        </Card>

        <div className="flex justify-end gap-4">
          <Link to="/leads">
            <Button type="button" variant="outline">
              取消
            </Button>
          </Link>
          <Button type="submit">
            提交线索
          </Button>
        </div>
      </form>
    </div>
  );
}
