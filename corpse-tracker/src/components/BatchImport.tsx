import React from 'react';
import { Card, CardHeader, CardBody, Button, Modal } from '../components/common';
import { useLeads } from '../contexts/AppContext';
import { Upload, FileText, AlertTriangle, Download, X, CheckCircle, Info } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ParsedLead {
  project_name: string;
  website_status: 'normal' | 'redirect' | 'shutdown';
  industry: string;
  shutdown_evidence: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  funding_round?: string;
  funding_amount?: string;
  isDuplicate: boolean;
  missingFields: string[];
  rowNumber: number;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === '\t') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  return lines.map(line => parseCSVLine(line));
}

export function BatchImport() {
  const { leads, batchImport } = useLeads();
  const [isOpen, setIsOpen] = React.useState(false);
  const [parsedData, setParsedData] = React.useState<ParsedLead[]>([]);
  const [selectedRows, setSelectedRows] = React.useState<Set<number>>(new Set());
  const [importMode, setImportMode] = React.useState<'paste' | 'file'>('paste');
  const [pasteContent, setPasteContent] = React.useState('');
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [errorMsg, setErrorMsg] = React.useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        parseAndPreviewFromArray(jsonData, file.name);
      };
      reader.readAsBinaryString(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        parseAndPreview(content, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handlePaste = () => {
    if (pasteContent.trim()) {
      parseAndPreview(pasteContent, 'pasted');
    }
  };

  const parseAndPreviewFromArray = (rows: string[][], filename: string) => {
    if (rows.length < 2) {
      setErrorMsg('数据格式不正确，至少需要表头和一行数据');
      return;
    }

    setErrorMsg('');
    setHeaders(rows[0]);
    const existingNames = new Set(leads.map(l => l.project_name.toLowerCase()));
    const parsed: ParsedLead[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 1 || !row[0] || !row[0].toString().trim()) continue;

      const name = row[0].toString().trim();
      const statusRaw = (row[1] || '').toString().toLowerCase();
      const industryRaw = (row[2] || '').toString();
      const evidence = (row[3] || '').toString();
      const priorityRaw = (row[4] || '').toString().toLowerCase();
      const fundingRaw = (row[5] || '').toString();

      const missingFields: string[] = [];
      if (!name) missingFields.push('项目名称');
      if (!statusRaw) missingFields.push('官网状态');
      if (!industryRaw) missingFields.push('行业');
      if (!evidence) missingFields.push('停运证据');
      if (!priorityRaw) missingFields.push('优先级');

      const isShutdown = statusRaw.includes('关闭') || statusRaw.includes('shutdown') || statusRaw.includes('已关闭');
      const isRedirect = statusRaw.includes('跳转') || statusRaw.includes('redirect') || statusRaw.includes('重定向');
      
      let fundingRound = '', fundingAmount = '';
      const fundingMatch = fundingRaw.match(/(.+?)[:：]\s*(.+)/);
      if (fundingMatch) {
        fundingRound = fundingMatch[1].trim();
        fundingAmount = fundingMatch[2].trim();
      }

      parsed.push({
        project_name: name,
        website_status: isShutdown ? 'shutdown' : isRedirect ? 'redirect' : 'normal',
        industry: mapIndustry(industryRaw),
        shutdown_evidence: evidence || '待补充',
        priority: mapPriority(priorityRaw),
        funding_round: fundingRound || undefined,
        funding_amount: fundingAmount || undefined,
        isDuplicate: existingNames.has(name.toLowerCase()),
        missingFields,
        rowNumber: i + 1,
      });
    }

    setParsedData(parsed);
    setSelectedRows(new Set(parsed.map((_, idx) => idx)));
    setImportMode(filename.endsWith('.csv') || filename === 'pasted' ? 'paste' : 'file');
  };

  const parseAndPreview = (content: string, filename: string) => {
    const rows = parseCSV(content);
    parseAndPreviewFromArray(rows, filename);
  };

  const mapIndustry = (value: string): string => {
    const map: Record<string, string> = {
      '电商': 'e-commerce', '电子商务': 'e-commerce', 'ecommerce': 'e-commerce',
      '社交': 'social',
      '金融': 'finance', 'fintech': 'finance',
      '教育': 'education', '在线教育': 'education',
      '医疗': 'healthcare', '健康': 'healthcare',
      '旅游': 'travel', '出行': 'travel',
      '餐饮': 'food', '美食': 'food',
      '文娱': 'entertainment', '娱乐': 'entertainment', '直播': 'entertainment',
      '科技': 'technology', '工具': 'technology',
      '汽车': 'automotive',
      '地产': 'real-estate', '房地产': 'real-estate',
    };
    const lower = value.toLowerCase();
    return map[lower] || map[value] || 'other';
  };

  const mapPriority = (value: string): any => {
    const map: Record<string, any> = {
      '紧急': 'urgent', 'urgent': 'urgent',
      '高': 'high', 'high': 'high',
      '中': 'medium', 'medium': 'medium',
      '低': 'low', 'low': 'low',
    };
    return map[value.toLowerCase()] || 'medium';
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
      .filter((_, i) => selectedRows.has(i) && !_.isDuplicate && _.missingFields.length === 0)
      .map(item => ({
        project_name: item.project_name,
        website_status: item.website_status as any,
        screenshots: [],
        news_sources: [],
        funding_info: item.funding_round && item.funding_amount 
          ? { round: item.funding_round, amount: item.funding_amount }
          : undefined,
        shutdown_evidence: item.shutdown_evidence,
        industry: item.industry as any,
        credibility: 'medium' as any,
        priority: item.priority,
        status: 'pending_verification' as any,
        created_by: 'current-user',
      }));

    if (toImport.length > 0) {
      batchImport(toImport);
      setIsOpen(false);
      setParsedData([]);
      setSelectedRows(new Set());
      setPasteContent('');
      setHeaders([]);
      setErrorMsg('');
    }
  };

  const downloadTemplate = () => {
    const template = `项目名称,官网状态,行业,停运证据,优先级,融资信息
小蓝单车,关闭,出行,官方宣布停止运营,高,B轮:1亿
闪电购,关闭,电商,平台倒闭供应商欠款,高,天使轮:500万
美味到家,关闭,餐饮,停止运营员工欠薪,中,A轮:2000万`;
    
    const blob = new Blob([template], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '批量导入模板.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const duplicateCount = parsedData.filter(d => d.isDuplicate).length;
  const missingCount = parsedData.filter(d => d.missingFields.length > 0).length;
  const validCount = parsedData.filter(d => 
    selectedRows.has(parsedData.indexOf(d)) && 
    !d.isDuplicate && 
    d.missingFields.length === 0
  ).length;

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
                placeholder={`粘贴项目信息，每行一条，格式：\n项目名称,官网状态,行业,停运证据,优先级,融资信息\n示例：\n小蓝单车,关闭,出行,官方宣布停止运营,高,B轮:1亿\n闪电购,关闭,电商,平台倒闭,高,天使轮:500万`}
                className="w-full h-40 p-3 border border-gray-300 rounded-lg resize-none font-mono text-sm"
              />
              <Button onClick={handlePaste} className="mt-2">
                解析内容
              </Button>
            </div>
          ) : (
            <div>
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-accent hover:bg-gray-50 transition-colors">
                <Upload size={32} className="text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">点击上传 CSV 或 Excel 文件</p>
                <p className="text-xs text-gray-400 mt-1">支持 .csv 和 .xlsx 格式（Excel 表格）</p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertTriangle size={16} />
              <span className="text-sm">{errorMsg}</span>
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
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    {duplicateCount > 0 && (
                      <span className="text-orange-500 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        {duplicateCount} 项重复
                      </span>
                    )}
                    {missingCount > 0 && (
                      <span className="text-blue-500 flex items-center gap-1">
                        <Info size={12} />
                        {missingCount} 项缺失字段
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={downloadTemplate} className="text-sm text-accent hover:underline">
                  <Download size={14} className="inline mr-1" />
                  下载模板
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left w-8"></th>
                      <th className="p-2 text-left">行号</th>
                      <th className="p-2 text-left">项目名称</th>
                      <th className="p-2 text-left">状态</th>
                      <th className="p-2 text-left">行业</th>
                      <th className="p-2 text-left">优先级</th>
                      <th className="p-2 text-left">问题</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((item, index) => (
                      <tr
                        key={index}
                        className={`border-t border-gray-100 ${
                          item.isDuplicate ? 'bg-orange-50' : 
                          item.missingFields.length > 0 ? 'bg-blue-50' :
                          selectedRows.has(index) ? 'bg-accent/5' : ''
                        }`}
                      >
                        <td className="p-2">
                          {item.isDuplicate ? (
                            <AlertTriangle size={16} className="text-orange-500" />
                          ) : item.missingFields.length > 0 ? (
                            <Info size={16} className="text-blue-500" />
                          ) : (
                            <input
                              type="checkbox"
                              checked={selectedRows.has(index)}
                              onChange={() => toggleRow(index)}
                              className="rounded"
                            />
                          )}
                        </td>
                        <td className="p-2 text-gray-400 text-xs">{item.rowNumber}</td>
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
                        <td className="p-2">{item.industry === 'e-commerce' ? '电商' : 
                          item.industry === 'social' ? '社交' :
                          item.industry === 'finance' ? '金融' :
                          item.industry === 'education' ? '教育' :
                          item.industry === 'healthcare' ? '医疗' :
                          item.industry === 'travel' ? '出行' :
                          item.industry === 'food' ? '餐饮' :
                          item.industry === 'entertainment' ? '文娱' :
                          item.industry === 'technology' ? '科技' :
                          item.industry === 'automotive' ? '汽车' : '其他'}</td>
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
                        <td className="p-2">
                          {item.isDuplicate && (
                            <span className="text-xs text-orange-600">重复项目</span>
                          )}
                          {item.missingFields.length > 0 && (
                            <span className="text-xs text-blue-600" title={item.missingFields.join(', ')}>
                              缺失: {item.missingFields.join(', ')}
                            </span>
                          )}
                          {!item.isDuplicate && item.missingFields.length === 0 && (
                            <CheckCircle size={16} className="text-green-500" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                <p>• 重复项目（橙色）将被自动跳过</p>
                <p>• 缺失必填字段的项目（蓝色）将无法导入</p>
                <p>• 导入的线索将进入「待核实」列表</p>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  取消
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={validCount === 0}
                >
                  导入 {validCount} 条有效线索
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
