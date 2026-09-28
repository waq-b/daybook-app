/** Hierarchy routes, in one place. */
export const ladderHref = (practiceId: string) => `/practices/${practiceId}`;
export const newTaskHref = (practiceId: string) => `/practices/${practiceId}/tasks/new`;
export const taskHref = (practiceId: string, taskId: string) =>
  `/practices/${practiceId}/tasks/${taskId}`;
export const editTaskHref = (practiceId: string, taskId: string) =>
  `/practices/${practiceId}/tasks/${taskId}/edit`;
export const logRepHref = (practiceId: string, taskId: string) =>
  `/practices/${practiceId}/tasks/${taskId}/log`;

/** Navigation state after the rep that finished a rung (plan 0c D19). */
export interface JustCompleted {
  justCompleted: string;
}
