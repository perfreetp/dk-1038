import React from 'react';
import { Card, CardHeader, CardBody, Badge } from '../components/common';
import { useHistory } from '../contexts/AppContext';
import { Clock, User, FileText, CheckCircle, XCircle, Edit, Plus, Send, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const actionIcons: Record<string, any> = {
  create: Plus,
  update: Edit,
  status_change: Send,
  task_change: CheckCircle,
  analysis_add: FileText,
};

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  status_change: 'bg-purple-100 text-purple-700',
  task_change: 'bg-orange-100 text-orange-700',
  analysis_add: 'bg-teal-100 text-teal-700',
};

export function HistoryPanel({ leadId }: { leadId?: string }) {
  const { history } = useHistory();
  
  const filteredHistory = leadId 
    ? history.filter(h => h.lead_id === leadId)
    : history.slice(0, 50);

  if (filteredHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-semibold">协作历史</h3>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8 text-gray-500">
            暂无操作记录
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">协作历史</h3>
        <span className="text-sm text-gray-500">{filteredHistory.length} 条记录</span>
      </CardHeader>
      <CardBody className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {filteredHistory.map((record, index) => {
            const Icon = actionIcons[record.action_type] || Edit;
            const colorClass = actionColors[record.action_type] || 'bg-gray-100 text-gray-700';
            
            return (
              <div key={record.id} className="flex gap-4 p-4 border-b border-gray-100 hover:bg-gray-50">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{record.user_name}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-sm text-gray-600">{record.description}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {format(new Date(record.timestamp), 'MM/dd HH:mm', { locale: zhCN })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

export function HistoryTimeline({ leadId }: { leadId: string }) {
  const { history } = useHistory();
  
  const leadHistory = history.filter(h => h.lead_id === leadId);

  if (leadHistory.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        暂无操作记录
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leadHistory.map((record, index) => {
        const Icon = actionIcons[record.action_type] || Edit;
        const colorClass = actionColors[record.action_type] || 'bg-gray-100 text-gray-700';
        
        return (
          <div key={record.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                <Icon size={14} />
              </div>
              {index < leadHistory.length - 1 && (
                <div className="w-0.5 h-full bg-gray-200 my-1" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <p className="text-sm">
                <span className="font-medium">{record.user_name}</span>
                <span className="text-gray-600"> {record.description}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {format(new Date(record.timestamp), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
