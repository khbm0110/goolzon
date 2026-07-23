// `catch` clauses receive `unknown` in strict TypeScript, not `any` —
// this is the one shared place that safely narrows it down to a
// displayable string, used by every route/service instead of each one
// writing its own `(e: any) => e?.message` inline.
export function getErrorMessage(error: unknown, fallback = 'حدث خطأ غير متوقع'): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}
