export type ApiResponse = {
  message: string;
  success: true;
  timestamp: string;
};

export type EchoRequest = {
  message: string;
};

export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = {
  success: false;
  code: string;
  message: string;
  details?: unknown;
};

export type Pagination = { page: number; limit: number };
export type SortOrder = "asc" | "desc";

export type Habit = {
  id: string;
  name: string;
  color?: string;
  schedule: { days: number[] };
  createdAt: string;
  updatedAt: string;
};

export type HabitCheckin = {
  id: string;
  habitId: string;
  date: string;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};
