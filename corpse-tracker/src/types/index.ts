export type UserRole = 'member' | 'editor' | 'reviewer';

export type WebsiteStatus = 'normal' | 'redirect' | 'shutdown';

export type Credibility = 'high' | 'medium' | 'low';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type Industry = 
  | 'e-commerce'
  | 'social'
  | 'finance'
  | 'education'
  | 'healthcare'
  | 'travel'
  | 'food'
  | 'entertainment'
  | 'technology'
  | 'real-estate'
  | 'automotive'
  | 'other';

export type LeadStatus = 
  | 'new'
  | 'pending_verification'
  | 'in_progress'
  | 'in_review'
  | 'returned'
  | 'approved'
  | 'published'
  | 'rejected';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type PublicScope = 'team' | 'partner' | 'public';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface FundingInfo {
  round: string;
  amount: string;
  date?: string;
}

export interface Lead {
  id: string;
  project_name: string;
  website_status: WebsiteStatus;
  screenshots: string[];
  news_sources: string[];
  funding_info?: FundingInfo;
  shutdown_evidence: string;
  industry: Industry;
  credibility: Credibility;
  priority: Priority;
  assignee?: string;
  status: LeadStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  failure_nodes?: FailureNode[];
  disputes?: string[];
  similar_projects?: string[];
  interviews?: string[];
  public_scope?: PublicScope;
  review_comments?: string;
  required_fields?: string[];
  publish_type?: 'now' | 'scheduled' | 'manual';
  scheduled_date?: string;
}

export interface Task {
  id: string;
  lead_id: string;
  title: string;
  description: string;
  assignee: string;
  due_date: string;
  status: TaskStatus;
  created_at: string;
}

export interface Interview {
  id: string;
  lead_id: string;
  interviewee: string;
  interview_date: string;
  content: string;
  key_findings: string[];
  created_at: string;
}

export interface FailureNode {
  id: string;
  type: 'funding' | 'market_mismatch' | 'team_issue' | 'policy' | 'competition' | 'other';
  description: string;
  date?: string;
}

export interface FilterState {
  status?: LeadStatus[];
  industry?: Industry[];
  credibility?: Credibility[];
  priority?: Priority[];
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface ReviewAction {
  id: string;
  lead_id: string;
  action: 'approve' | 'return' | 'reject';
  comment: string;
  reviewer_id: string;
  created_at: string;
}

export interface Stats {
  weeklyNew: number;
  pendingVerification: number;
  approvalRate: number;
  sourceQuality: {
    source: string;
    count: number;
    quality: number;
  }[];
  editorProgress: {
    editor: string;
    completed: number;
    total: number;
  }[];
  trend: {
    date: string;
    count: number;
  }[];
}
