import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { User, Lead, Task, Interview, FilterState, Stats, LeadStatus, TaskStatus, HistoryRecord, PublicScope } from '../types';
import { initialLeads, initialTasks, initialInterviews, initialStats, currentUser, users } from '../data/mockData';

const STORAGE_KEY = 'corpse-tracker-data';

interface HistoryRecord {
  id: string;
  lead_id: string;
  action_type: 'create' | 'update' | 'status_change' | 'task_change' | 'analysis_add';
  field?: string;
  old_value?: any;
  new_value?: any;
  user_id: string;
  user_name: string;
  timestamp: string;
  description: string;
}

interface AppState {
  currentUser: User;
  leads: Lead[];
  tasks: Task[];
  interviews: Interview[];
  filters: FilterState;
  stats: Stats;
  history: HistoryRecord[];
}

type AppAction =
  | { type: 'LOAD_DATA'; payload: AppState }
  | { type: 'ADD_LEAD'; payload: Omit<Lead, 'id' | 'created_at' | 'updated_at'> }
  | { type: 'UPDATE_LEAD'; payload: Lead }
  | { type: 'DELETE_LEAD'; payload: string }
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id' | 'created_at'> }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'ADD_INTERVIEW'; payload: Omit<Interview, 'id' | 'created_at'> }
  | { type: 'SET_FILTERS'; payload: FilterState }
  | { type: 'SUBMIT_FOR_REVIEW'; payload: string }
  | { type: 'APPROVE_LEAD'; payload: { id: string; scope: PublicScope; publish_type: 'now' | 'scheduled' | 'manual'; scheduled_date?: string } }
  | { type: 'RETURN_LEAD'; payload: { id: string; comment: string; required_fields: string[] } }
  | { type: 'REJECT_LEAD'; payload: { id: string; comment: string } }
  | { type: 'PUBLISH_LEAD'; payload: string }
  | { type: 'ADD_HISTORY'; payload: Omit<HistoryRecord, 'id' | 'timestamp'> }
  | { type: 'BATCH_IMPORT'; payload: Omit<Lead, 'id' | 'created_at' | 'updated_at'>[] };

function appReducer(state: AppState, action: AppAction): AppState {
  const now = new Date().toISOString();
  const user = state.currentUser;
  const userName = user.name;

  switch (action.type) {
    case 'LOAD_DATA':
      return action.payload;

    case 'ADD_LEAD': {
      const newLead = {
        ...action.payload,
        id: uuidv4(),
        created_at: now,
        updated_at: now,
      };
      const historyRecord: HistoryRecord = {
        id: uuidv4(),
        lead_id: newLead.id,
        action_type: 'create',
        new_value: newLead.project_name,
        user_id: user.id,
        user_name: userName,
        timestamp: now,
        description: `${userName} 创建了线索 "${newLead.project_name}"`,
      };
      return {
        ...state,
        leads: [...state.leads, newLead],
        history: [historyRecord, ...state.history],
      };
    }

    case 'UPDATE_LEAD': {
      const oldLead = state.leads.find(l => l.id === action.payload.id);
      const updatedLead = { ...action.payload, updated_at: now };
      
      let historyRecord: HistoryRecord | null = null;
      if (oldLead) {
        const changedFields = Object.keys(action.payload).filter(
          key => JSON.stringify(oldLead[key as keyof Lead]) !== JSON.stringify(action.payload[key as keyof Lead])
        );
        
        if (changedFields.length > 0) {
          historyRecord = {
            id: uuidv4(),
            lead_id: action.payload.id,
            action_type: 'update',
            field: changedFields.join(', '),
            old_value: changedFields.reduce((acc, field) => ({ ...acc, [field]: oldLead[field as keyof Lead] }), {}),
            new_value: changedFields.reduce((acc, field) => ({ ...acc, [field]: action.payload[field as keyof Lead] }), {}),
            user_id: user.id,
            user_name: userName,
            timestamp: now,
            description: `${userName} 更新了 ${changedFields.map(f => getFieldLabel(f)).join(', ')}`,
          };
        }
      }
      
      return {
        ...state,
        leads: state.leads.map(l => l.id === action.payload.id ? updatedLead : l),
        history: historyRecord ? [historyRecord, ...state.history] : state.history,
      };
    }

    case 'DELETE_LEAD':
      return {
        ...state,
        leads: state.leads.filter(l => l.id !== action.payload),
        tasks: state.tasks.filter(t => t.lead_id !== action.payload),
        interviews: state.interviews.filter(i => i.lead_id !== action.payload),
      };

    case 'ADD_TASK': {
      const newTask = {
        ...action.payload,
        id: uuidv4(),
        created_at: now,
      };
      const lead = state.leads.find(l => l.id === action.payload.lead_id);
      const historyRecord: HistoryRecord = {
        id: uuidv4(),
        lead_id: action.payload.lead_id,
        action_type: 'task_change',
        field: 'add_task',
        new_value: newTask.title,
        user_id: user.id,
        user_name: userName,
        timestamp: now,
        description: `${userName} 为"${lead?.project_name}"添加了任务 "${newTask.title}"`,
      };
      return {
        ...state,
        tasks: [...state.tasks, newTask],
        history: [historyRecord, ...state.history],
      };
    }

    case 'UPDATE_TASK': {
      const oldTask = state.tasks.find(t => t.id === action.payload.id);
      const lead = state.leads.find(l => l.id === action.payload.lead_id);
      
      let historyRecord: HistoryRecord | null = null;
      if (oldTask && oldTask.status !== action.payload.status) {
        historyRecord = {
          id: uuidv4(),
          lead_id: action.payload.lead_id,
          action_type: 'task_change',
          field: 'status',
          old_value: oldTask.status,
          new_value: action.payload.status,
          user_id: user.id,
          user_name: userName,
          timestamp: now,
          description: `${userName} 将"${lead?.project_name}"的任务 "${action.payload.title}"状态改为 ${getTaskStatusLabel(action.payload.status)}`,
        };
      }
      
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t),
        history: historyRecord ? [historyRecord, ...state.history] : state.history,
      };
    }

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.payload),
      };

    case 'ADD_INTERVIEW': {
      const newInterview = {
        ...action.payload,
        id: uuidv4(),
        created_at: now,
      };
      const lead = state.leads.find(l => l.id === action.payload.lead_id);
      const historyRecord: HistoryRecord = {
        id: uuidv4(),
        lead_id: action.payload.lead_id,
        action_type: 'create',
        field: 'interview',
        new_value: newInterview.interviewee,
        user_id: user.id,
        user_name: userName,
        timestamp: now,
        description: `${userName} 为"${lead?.project_name}"添加了采访记录 "${newInterview.interviewee}"`,
      };
      return {
        ...state,
        interviews: [...state.interviews, newInterview],
        history: [historyRecord, ...state.history],
      };
    }

    case 'SET_FILTERS':
      return { ...state, filters: action.payload };

    case 'SUBMIT_FOR_REVIEW': {
      const lead = state.leads.find(l => l.id === action.payload);
      const historyRecord: HistoryRecord = {
        id: uuidv4(),
        lead_id: action.payload,
        action_type: 'status_change',
        old_value: lead?.status,
        new_value: 'in_review',
        user_id: user.id,
        user_name: userName,
        timestamp: now,
        description: `${userName} 提交"${lead?.project_name}"进行审核`,
      };
      return {
        ...state,
        leads: state.leads.map(l =>
          l.id === action.payload ? { ...l, status: 'in_review' as LeadStatus, updated_at: now } : l
        ),
        history: [historyRecord, ...state.history],
      };
    }

    case 'APPROVE_LEAD': {
      const lead = state.leads.find(l => l.id === action.payload.id);
      const publishDesc = action.payload.publish_type === 'now' ? '立即公开' 
        : action.payload.publish_type === 'scheduled' ? `定时 ${action.payload.scheduled_date} 公开`
        : '手动公开';
      const historyRecord: HistoryRecord = {
        id: uuidv4(),
        lead_id: action.payload.id,
        action_type: 'status_change',
        old_value: 'in_review',
        new_value: 'approved',
        user_id: user.id,
        user_name: userName,
        timestamp: now,
        description: `${userName} 批准"${lead?.project_name}"，设置为 ${publishDesc}`,
      };
      return {
        ...state,
        leads: state.leads.map(l =>
          l.id === action.payload.id ? { 
            ...l, 
            status: 'approved' as LeadStatus, 
            public_scope: action.payload.scope,
            updated_at: now 
          } : l
        ),
        history: [historyRecord, ...state.history],
      };
    }

    case 'RETURN_LEAD': {
      const lead = state.leads.find(l => l.id === action.payload.id);
      const historyRecord: HistoryRecord = {
        id: uuidv4(),
        lead_id: action.payload.id,
        action_type: 'status_change',
        old_value: 'in_review',
        new_value: 'returned',
        user_id: user.id,
        user_name: userName,
        timestamp: now,
        description: `${userName} 退回"${lead?.project_name}"，需补充: ${action.payload.required_fields.join(', ')}`,
      };
      return {
        ...state,
        leads: state.leads.map(l =>
          l.id === action.payload.id ? { 
            ...l, 
            status: 'returned' as LeadStatus, 
            review_comments: action.payload.comment,
            required_fields: action.payload.required_fields,
            updated_at: now 
          } : l
        ),
        history: [historyRecord, ...state.history],
      };
    }

    case 'REJECT_LEAD': {
      const lead = state.leads.find(l => l.id === action.payload.id);
      const historyRecord: HistoryRecord = {
        id: uuidv4(),
        lead_id: action.payload.id,
        action_type: 'status_change',
        old_value: 'in_review',
        new_value: 'rejected',
        user_id: user.id,
        user_name: userName,
        timestamp: now,
        description: `${userName} 拒绝"${lead?.project_name}": ${action.payload.comment}`,
      };
      return {
        ...state,
        leads: state.leads.map(l =>
          l.id === action.payload.id ? { 
            ...l, 
            status: 'rejected' as LeadStatus, 
            review_comments: action.payload.comment,
            updated_at: now 
          } : l
        ),
        history: [historyRecord, ...state.history],
      };
    }

    case 'PUBLISH_LEAD': {
      const lead = state.leads.find(l => l.id === action.payload);
      const historyRecord: HistoryRecord = {
        id: uuidv4(),
        lead_id: action.payload,
        action_type: 'status_change',
        old_value: 'approved',
        new_value: 'published',
        user_id: user.id,
        user_name: userName,
        timestamp: now,
        description: `${userName} 将"${lead?.project_name}"正式发布`,
      };
      return {
        ...state,
        leads: state.leads.map(l =>
          l.id === action.payload ? { ...l, status: 'published' as LeadStatus, updated_at: now } : l
        ),
        history: [historyRecord, ...state.history],
      };
    }

    case 'ADD_HISTORY':
      return {
        ...state,
        history: [{ ...action.payload, id: uuidv4(), timestamp: now }, ...state.history],
      };

    case 'BATCH_IMPORT': {
      const newLeads = action.payload.map(item => ({
        ...item,
        id: uuidv4(),
        created_at: now,
        updated_at: now,
      }));
      const historyRecord: HistoryRecord = {
        id: uuidv4(),
        lead_id: 'batch',
        action_type: 'create',
        new_value: newLeads.length,
        user_id: user.id,
        user_name: userName,
        timestamp: now,
        description: `${userName} 批量导入了 ${newLeads.length} 条线索`,
      };
      return {
        ...state,
        leads: [...state.leads, ...newLeads],
        history: [historyRecord, ...state.history],
      };
    }

    default:
      return state;
  }
}

function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    project_name: '项目名称',
    website_status: '官网状态',
    industry: '行业',
    credibility: '可信度',
    priority: '优先级',
    assignee: '负责人',
    screenshots: '截图',
    shutdown_evidence: '停运证据',
    failure_nodes: '失败节点',
    disputes: '争议点',
    similar_projects: '相似项目',
  };
  return labels[field] || field;
}

function getTaskStatusLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    todo: '待办',
    in_progress: '进行中',
    done: '已完成',
  };
  return labels[status];
}

function loadFromStorage(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        currentUser: currentUser,
      };
    }
  } catch (e) {
    console.error('Failed to load data from storage:', e);
  }
  
  return {
    currentUser: currentUser,
    leads: initialLeads,
    tasks: initialTasks,
    interviews: initialInterviews,
    filters: {},
    stats: initialStats,
    history: [],
  };
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, null, () => loadFromStorage());

  useEffect(() => {
    const dataToSave = {
      leads: state.leads,
      tasks: state.tasks,
      interviews: state.interviews,
      filters: state.filters,
      stats: state.stats,
      history: state.history,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export function useLeads() {
  const { state, dispatch } = useApp();
  return {
    leads: state.leads,
    filters: state.filters,
    addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) =>
      dispatch({ type: 'ADD_LEAD', payload: lead }),
    updateLead: (lead: Lead) => dispatch({ type: 'UPDATE_LEAD', payload: lead }),
    deleteLead: (id: string) => dispatch({ type: 'DELETE_LEAD', payload: id }),
    setFilters: (filters: FilterState) => dispatch({ type: 'SET_FILTERS', payload: filters }),
    submitForReview: (id: string) => dispatch({ type: 'SUBMIT_FOR_REVIEW', payload: id }),
    approveLead: (id: string, scope: PublicScope, publish_type: 'now' | 'scheduled' | 'manual', scheduled_date?: string) =>
      dispatch({ type: 'APPROVE_LEAD', payload: { id, scope, publish_type, scheduled_date } }),
    returnLead: (id: string, comment: string, required_fields: string[]) =>
      dispatch({ type: 'RETURN_LEAD', payload: { id, comment, required_fields } }),
    rejectLead: (id: string, comment: string) =>
      dispatch({ type: 'REJECT_LEAD', payload: { id, comment } }),
    publishLead: (id: string) => dispatch({ type: 'PUBLISH_LEAD', payload: id }),
    batchImport: (leads: Omit<Lead, 'id' | 'created_at' | 'updated_at'>[]) =>
      dispatch({ type: 'BATCH_IMPORT', payload: leads }),
    addHistory: (record: Omit<HistoryRecord, 'id' | 'timestamp'>) =>
      dispatch({ type: 'ADD_HISTORY', payload: record }),
  };
}

export function useTasks() {
  const { state, dispatch } = useApp();
  return {
    tasks: state.tasks,
    addTask: (task: Omit<Task, 'id' | 'created_at'>) =>
      dispatch({ type: 'ADD_TASK', payload: task }),
    updateTask: (task: Task) => dispatch({ type: 'UPDATE_TASK', payload: task }),
    deleteTask: (id: string) => dispatch({ type: 'DELETE_TASK', payload: id }),
  };
}

export function useInterviews() {
  const { state, dispatch } = useApp();
  return {
    interviews: state.interviews,
    addInterview: (interview: Omit<Interview, 'id' | 'created_at'>) =>
      dispatch({ type: 'ADD_INTERVIEW', payload: interview }),
  };
}

export function useHistory() {
  const { state } = useApp();
  return {
    history: state.history,
  };
}
