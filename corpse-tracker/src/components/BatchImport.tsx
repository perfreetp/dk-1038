import React from 'react';
import { Card, CardHeader, CardBody, Button, Modal } from '../components/common';
import { useLeads } from '../contexts/AppContext';
import { Upload, FileText, AlertTriangle, Check, X, Download } from 'lucide-react';

interface ParsedLead {
  project_name: string;
  website_status: 'normal' | 'redirect' | 'shutdown';
  industry: string;
  shutdown_evidence: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  funding_info?: { round: string; amount: string };
  isDuplicate: boolean;
  duplicateWith?: string;
}

export function BatchImport() {
  const { leads, batchImport } = useLeads();
  const [isOpen, setIsOpen] = React.useState(false);
  const [parsedData, setParsedData] = React.useState<ParsedLead[]>([]);
  const [selectedRows, setSelectedRows] = React.useState<Set<number>>(new Set());
  const [importMode, setImportMode] = React.useState<'paste' | 'file'>('paste');
  const [pasteContent, setPasteContent] = React.useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseContent(content);
    };
    reader.readAsText(file);
  };

  const handlePaste = () => {
    if (pasteContent.trim()) {
      parseContent(pasteContent);
    }
  };

  const parseContent = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    const parsed: ParsedLead[] = [];
    const existingNames = new Set(leads.map(l => l.project_name.toLowerCase()));

    lines.forEach((line, index) => {
      const parts = line.split(/[,\t]/).map(p => p.trim());
      if (parts.length >= 4) {
        const name = parts[0];
        const isDuplicate = existingNames.has(name.toLowerCase());
        
        parsed.push({
          project_name: name,
          website_status: (parts[1] === '关闭' || parts[1] === 'shutdown' ? 'shutdown' : 
                          parts[1] === '跳转' || parts[1] === 'redirect' ? 'redirect' : 'normal') as any,
          industry: mapIndustry(parts[2]),
          shutdown_evidence: parts[3] || '待补充',
          priority: mapPriority(parts[4] || ''),
          funding_info: parts[5] ? parseFunding(parts[5]) : undefined,
          isDuplicate,
          duplicateWith: isDuplicate ? name : undefined,
        });
      }
    });

    setParsedData(parsed);
    setSelectedRows(new Set(parsed.map((_, i) => i)));
  };

  const mapIndustry = (value: string): any => {
    const map: Record<string, any> = {
      '电商': 'e-commerce', '电子商务': 'e-commerce',
      '社交': 'social',
      '金融': 'finance', 'Fintech': 'finance',
      '教育': 'education', '在线教育': 'education',
      '医疗': 'healthcare', '健康': 'healthcare',
      '旅游': 'travel', '出行': 'travel',
      '餐饮': 'food', '美食': 'food',
      '文娱': 'entertainment', '娱乐': 'entertainment',
      '科技': 'technology',
      '汽车': 'automotive',
    };
    return map[value] || 'other';
  };

  const mapPriority = (value: string): any => {
    const map: Record<string, any> = {
      '紧急': 'urgent', '高': 'high', '中': 'medium', '低': 'low',
    };
    return map[value] || 'medium';
  };

  const parseFunding = (value: string) => {
    const match = value.match(/(.+?)\s*[:：]\s*(.+)/);
    if (match) {
      return { round: match[1].trim(), amount: match[2].trim() };
    }
    return { round: '未知', amount: value };
  };

  const toggleRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const toggleAll = () => {
    if (selectedRows.size === parsedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(parsedData.map((_, i) => i)));
    }
  };

  const handleImport = () => {
    const toImport = parsedData
      .filter((_, i) => selectedRows.has(i) && !_.isDuplicate)
      .map(item => ({
        project_name: item.project_name,
        website_status: item.website_status,
        screenshots: [],
        news_sources: [],
        funding_info: item.funding_info,
        shutdown_evidence: item.shutdown_evidence,
        industry: item.industry,
        credibility: 'medium' as any,
        priority: item.priority,
        status: 'new' as any,
        created_by: 'current-user',
      }));

    if (toImport.length > 0) {
      batchImport(toImport);
      setIsOpen(false);
      setParsedData([]);
      setSelectedRows(new Set());
      setPasteContent('');
    }
  };

  const downloadTemplate = () => {
    const template = `项目名称\t官网状态\t行业\t停运证据\t优先级\t融资信息
小蓝单车\t关闭\t出行\t官方宣布停止运营\t高\tB轮:1亿
闪电购\t关闭\t电商\t平台倒闭，供应商欠款\t高\t天使轮:500万
美味到家\t关闭\t餐饮\t停止运营，员工欠薪\t中\tA轮:2000万`;
    
    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '批量导入模板.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const duplicateCount = parsedData.filter(d => d.isDuplicate).length;

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Upload size={18} className="mr-2" />
        批量导入
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="批量导入线索">
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setImportMode('paste')}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                importMode === 'paste' ? 'border-accent bg-accent/5' : 'border-gray-200'
              }`}
            >
              <FileText size={24} className="mx-auto mb-1" />
              <p className="text-sm font-medium">粘贴内容</p>
            </button>
            <button
              onClick={() => setImportMode('file')}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                importMode === 'file' ? 'border-accent bg-accent/5' : 'border-gray-200'
              }`}
            >
              <Upload size={24} className="mx-auto mb-1" />
              <p className="text-sm font-medium">上传文件</p>
            </button>
          </div>

          {importMode === 'paste' ? (
            <div>
              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="粘贴项目信息，每行一条，格式：项目名称,官网状态,行业,停运证据,优先级,融资信息
示例：
小蓝单车,关闭,出行,官方宣布停止运营,高,B轮:1亿
闪电购,关闭,电商,平台倒闭,高,天使轮:500万"
                className="w-full h-40 p-3 border border-gray-300 rounded-lg resize-none font-mono text-sm"
              />
              <Button onClick={handlePaste} className="mt-2">
                解析内容
              </Button>
            </div>
          ) : (
            <div>
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-accent">
                <Upload size={32} className="text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">点击上传文件</p>
                <p className="text-xs text-gray-400 mt-1">支持 TXT, CSV, XLSX</p>
                <input
                  type="file"
                  accept=".txt,.csv,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {parsedData.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleAll}
                    className="text-sm text-accent hover:underline"
                  >
                    {selectedRows.size === parsedData.length ? '取消全选' : '全选'}
                  </button>
                  <span className="text-sm text-gray-500">
                    已选择 {selectedRows.size} 项
                    {duplicateCount > 0 && (
                      <span className="text-orange-500 ml-2">
                        ({duplicateCount} 项重复将跳过)
                      </span>
                    )}
                  </span>
                </div>
                <button onClick={downloadTemplate} className="text-sm text-accent hover:underline">
                  <Download size={14} className="inline mr-1" />
                  下载模板
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left w-8"></th>
                      <th className="p-2 text-left">项目名称</th>
                      <th className="p-2 text-left">状态</th>
                      <th className="p-2 text-left">行业</th>
                      <th className="p-2 text-left">优先级</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((item, index) => (
                      <tr
                        key={index}
                        className={`border-t border-gray-100 ${
                          item.isDuplicate ? 'bg-orange-50' : selectedRows.has(index) ? 'bg-accent/5' : ''
                        }`}
                      >
                        <td className="p-2">
                          {item.isDuplicate ? (
                            <AlertTriangle size={16} className="text-orange-500" />
                          ) : (
                            <input
                              type="checkbox"
                              checked={selectedRows.has(index)}
                              onChange={() => toggleRow(index)}
                              className="rounded"
                            />
                          )}
                        </td>
                        <td className="p-2 font-medium">
                          {item.project_name}
                          {item.isDuplicate && (
                            <span className="ml-2 text-xs text-orange-500">(与现有重复)</span>
                          )}
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            item.website_status === 'shutdown' ? 'bg-red-100 text-red-700' :
                            item.website_status === 'redirect' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {item.website_status === 'shutdown' ? '关闭' :
                             item.website_status === 'redirect' ? '跳转' : '正常'}
                          </span>
                        </td>
                        <td className="p-2">{item.industry}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            item.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {item.priority === 'urgent' ? '紧急' :
                             item.priority === 'high' ? '高' :
                             item.priority === 'medium' ? '中' : '低'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleImport} disabled={selectedRows.size === 0}>
                  导入 {selectedRows.size} 条线索
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
