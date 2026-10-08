export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = string;

export interface BoardCategoryItem {
  id: string;
  name: string;
  order: number;
  color?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: TaskPriority;
  category: string;
  imageUrl?: string | null;
  deadline: string | null;
  order: number;
  isArchived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface UserItem {
  id: string;
  username: string;
}
