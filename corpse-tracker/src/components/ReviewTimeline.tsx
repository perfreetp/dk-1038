import React from 'react';
import { useApp } from '../contexts/AppContext';
import { users } from '../data/mockData';
import { 
  Clock,
  Send,
  XCircle,
  CheckCircle,
  Calendar,
  Globe,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ReviewTimelineProps {
  leadId: string;
}

interface TimelineEvent {
  id: string;
  type: 'submit' | 'return' | 'approve' | 'publish' | 'schedule';
  user_id: string;
  user_name: string;
  timestamp: string;
  description: string;
  details?: {
    comment?: string;
    required_fields?: string[];
    scope?: string;
    publish_type?: string;
    scheduled_date?: string;
  };
}

export function ReviewTimeline({ leadId }: ReviewTimelineProps) {
  const { state } = useApp();
  
  const lead = state.leads.find(l => l.id === leadId);
  const leadHistory = state.history.filter(h => h.lead_id === leadId);

  const events: TimelineEvent[] = leadHistory
    .filter(h => 
      h.action_type === 'status_change' || 
      h.description?.includes('提交') ||
      h.description?.includes('审核') ||
      h.description?.includes('发布') ||
      h.description?.includes('批准') ||
      h.description?.includes('退回')
    )
    .map(h => {
      let type: TimelineEvent['type'] = 'submit';
      if (h.description?.includes('提交')) type = 'submit';
      else if (h.description?.includes('退回')) type = 'return';
      else if (h.description?.includes('批准') || h.description?.includes('入库')) type = 'approve';
      else if (h.description?.includes('发布') && !h.description?.includes('定时')) type = 'publish';
      else if (h.description?.includes('定时')) type = 'schedule';
      
      return {
        id: h.id,
        type,
        user_id: h.user_id,
        user_name: h.user_name,
        timestamp: h.timestamp,
        description: h.description,
      };
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'submit':
        return <Send size={16} className="text-blue-500" />;
      case 'return':
        return <XCircle size={16} className="text-red-500" />;
      case 'approve':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'publish':
        return <Globe size={16} className="text-accent" />;
      case 'schedule':
        return <Calendar size={16} className="text-purple-500" />;
    }
  };

  const getEventLabel = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'submit':
        return '提交审核';
      case 'return':
        return '退回修改';
      case 'approve':
        return '批准入库';
      case 'publish':
        return '正式发布';
      case 'schedule':
        return '定时发布';
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'submit':
        return 'border-l-blue-500 bg-blue-50';
      case 'return':
        return 'border-l-red-500 bg-red-50';
      case 'approve':
        return 'border-l-green-500 bg-green-50';
      case 'publish':
        return 'border-l-accent bg-accent/5';
      case 'schedule':
        return 'border-l-purple-500 bg-purple-50';
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock size={32} className="mx-auto mb-2 opacity-50" />
        <p>暂无审核记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const user = users.find(u => u.id === event.user_id);
        return (
          <div 
            key={event.id} 
            className={`relative pl-6 pb-6 border-l-2 ${getEventColor(event.type)} last:border-l-transparent last:pb-0`}
          >
            <div className="absolute left-0 top-0 transform -translate-x-1/2 -translate-y-1 w-8 h-8 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center">
              {getEventIcon(event.type)}
            </div>
            
            <div className="ml-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{getEventLabel(event.type)}</span>
                <span className="text-xs text-gray-500">
                  {format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{event.description}</p>
              
              <div className="flex items-center gap-2">
                {user && (
                  <div className="flex items-center gap-1">
                    <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full" />
                    <span className="text-xs text-gray-500">{user.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
