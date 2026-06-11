import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { User, Lead, Task, Interview, FilterState, Stats, LeadStatus, TaskStatus } from '../types';
import { initialLeads, initialTasks, initialInterviews, initialStats, currentUser } from '../data/mockData';

interface AppState {
  currentUser: User;
  leads: Lead[];
  tasks: Task[];
  interviews: Interview[];
  filters: FilterState;
  stats: Stats;
}

type AppAction =
  | { type: 'ADD_LEAD'; payload: Omit<Lead, 'id' | 'created_at' | 'updated_at'> }
  | { type: 'UPDATE_LEAD'; payload: Lead }
  | { type: 'DELETE_LEAD'; payload: string }
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id' | 'created_at'> }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'ADD_INTERVIEW'; payload: Omit<Interview, 'id' | 'created_at'> }
  | { type: 'SET_FILTERS'; payload: FilterState }
  | { type: 'SUBMIT_FOR_REVIEW'; payload: string }
  | { type: 'APPROVE_LEAD'; payload: { id: string; scope: 'team' | 'partner' | 'public' } }
  | { type: 'RETURN_LEAD'; payload: { id: string; comment: string } }
  | { type: 'REJECT_LEAD'; payload: { id: string; comment: string } }
  | { type: 'PUBLISH_LEAD'; payload: string };

const initialState: AppState = {
  currentUser: currentUser,
  leads: initialLeads,
  tasks: initialTasks,
  interviews: initialInterviews,
  filters: {},
  stats: initialStats,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_LEAD':
      return {
        ...state,
        leads: [
          ...state.leads,
          {
            ...action.payload,
            id: uuidv4(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      };

    case 'UPDATE_LEAD':
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.payload.id
            ? { ...action.payload, updated_at: new Date().toISOString() }
            : lead
        ),
      };

    case 'DELETE_LEAD':
      return {
        ...state,
        leads: state.leads.filter((lead) => lead.id !== action.payload),
        tasks: state.tasks.filter((task) => task.lead_id !== action.payload),
        interviews: state.interviews.filter((interview) => interview.lead_id !== action.payload),
      };

    case 'ADD_TASK':
      return {
        ...state,
        tasks: [
          ...state.tasks,
          {
            ...action.payload,
            id: uuidv4(),
            created_at: new Date().toISOString(),
          },
        ],
      };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id ? action.payload : task
        ),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload),
      };

    case 'ADD_INTERVIEW':
      return {
        ...state,
        interviews: [
          ...state.interviews,
          {
            ...action.payload,
            id: uuidv4(),
            created_at: new Date().toISOString(),
          },
        ],
      };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: action.payload,
      };

    case 'SUBMIT_FOR_REVIEW':
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.payload
            ? { ...lead, status: 'in_review' as LeadStatus, updated_at: new Date().toISOString() }
            : lead
        ),
      };

    case 'APPROVE_LEAD':
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.payload.id
            ? { 
                ...lead, 
                status: 'approved' as LeadStatus, 
                public_scope: action.payload.scope,
                updated_at: new Date().toISOString() 
              }
            : lead
        ),
      };

    case 'RETURN_LEAD':
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.payload.id
            ? { 
                ...lead, 
                status: 'returned' as LeadStatus, 
                review_comments: action.payload.comment,
                updated_at: new Date().toISOString() 
              }
            : lead
        ),
      };

    case 'REJECT_LEAD':
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.payload.id
            ? { 
                ...lead, 
                status: 'rejected' as LeadStatus, 
                review_comments: action.payload.comment,
                updated_at: new Date().toISOString() 
              }
            : lead
        ),
      };

    case 'PUBLISH_LEAD':
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.payload
            ? { ...lead, status: 'published' as LeadStatus, updated_at: new Date().toISOString() }
            : lead
        ),
      };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

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
    approveLead: (id: string, scope: 'team' | 'partner' | 'public') =>
      dispatch({ type: 'APPROVE_LEAD', payload: { id, scope } }),
    returnLead: (id: string, comment: string) =>
      dispatch({ type: 'RETURN_LEAD', payload: { id, comment } }),
    rejectLead: (id: string, comment: string) =>
      dispatch({ type: 'REJECT_LEAD', payload: { id, comment } }),
    publishLead: (id: string) => dispatch({ type: 'PUBLISH_LEAD', payload: id }),
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
