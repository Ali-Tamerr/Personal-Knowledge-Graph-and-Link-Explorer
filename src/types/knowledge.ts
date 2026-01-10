export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  nodes?: Node[];
}

export interface Attachment {
  id: string;
  nodeId: string;
  fileName: string;
  fileUrl: string;
  contentType: string;
  fileSize: number;
  userId?: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  userId?: string;
  createdAt: string;
}

export interface Node {
  id: string;
  projectId?: string;
  title: string;
  content?: string;
  excerpt?: string;
  groupId: number;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  x?: number;
  y?: number;
  tags?: Tag[];
  attachments?: Attachment[];
}

export interface Link {
  id: string;
  sourceId: string;
  targetId: string;
  relationshipType: 'supports' | 'contradicts' | 'neutral' | string;
  userId?: string;
  createdAt?: string;
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export interface GraphSettings {
  freezeOthersOnDrag: boolean;
  lockAllMovement: boolean;
}

export interface PresenceState {
  sessionId: string;
  nodeId: string;
  userId: string;
  lastSeen: string;
}

export interface Profile {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  email: string;
  displayName?: string;
  avatarUrl?: string;
  password: string;
}

export type RelationshipType = Link['relationshipType'];

export const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  supports: '#10B981',
  contradicts: '#EF4444',
  neutral: '#6B7280',
};

export const GROUP_COLORS: Record<number, string> = {
  0: '#8B5CF6',
  1: '#3B82F6',
  2: '#10B981',
  3: '#F59E0B',
  4: '#EF4444',
  5: '#EC4899',
  6: '#06B6D4',
  7: '#84CC16',
};
