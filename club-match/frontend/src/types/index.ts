export type UserRole = 'student' | 'club' | 'admin';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
  studentId?: string;
  major?: string;
  phone?: string;
  avatar?: string;
  assessmentTags?: AssessmentTags;
  assessmentDraft?: { answers: Record<number, string[]>; completedAt?: string };
  lastAssessmentDate?: string;
  favorites: string[];
  clubId?: string; // for club role
}

export interface AssessmentTags {
  interests: string[];
  skills: string[];
  time: string[];
  social: string[];
  goals: string[];
  all: string[];
}

export type ClubStatus = 'pending' | 'approved' | 'rejected' | 'offline';

export interface Club {
  id: string;
  name: string;
  category: string;
  categoryColor: string;
  tags: string[];
  interestTags: string[];
  timeTags: string[];
  skillTags: string[];
  description: string;
  detailDescription: string;
  presidentId: string;
  presidentName: string;
  phone: string;
  maxMembers: number;
  currentMembers: number;
  deadline: string;
  status: ClubStatus;
  rejectReason?: string;
  coverEmoji: string;
  coverColor: string;
  applicationCount: number;
  activities: string[];
  requirements: string;
  createdAt: string;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface Application {
  id: string;
  clubId: string;
  clubName: string;
  studentId: string;
  studentName: string;
  studentMajor?: string;
  phone: string;
  introduction: string;
  tags: string[];
  matchScore: number;
  status: ApplicationStatus;
  rejectReason?: string;
  createdAt: string;
}

export type NotificationType = 'official' | 'system';
export type NotificationTarget = 'all' | 'student' | 'club';

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  targetRole: NotificationTarget;
  targetUserId?: string; // 个人通知
  isPinned: boolean;
  readBy: string[]; // user ids
  createdAt: string;
  createdBy: string;
  isWithdrawn: boolean;
}

export interface AssessmentQuestion {
  id: number;
  dimension: string;
  question: string;
  options: AssessmentOption[];
  maxSelect?: number;
}

export interface AssessmentOption {
  value: string;
  label: string;
  emoji: string;
  tags: string[];
}
