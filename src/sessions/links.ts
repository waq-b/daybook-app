/**
 * Where a session opens. Session detail arrives in task 5 (0b.5); until then
 * a session opens on its edit screen.
 */
export function sessionHref(id: string): string {
  return `/sessions/${id}/edit`;
}
