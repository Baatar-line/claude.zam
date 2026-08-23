/**
 * The single result shape every server action returns (§2).
 *
 * A discriminated union rather than thrown errors, because the caller is a
 * React component that has to render something either way, and because an
 * exception crossing the server-action boundary in production is reduced to
 * an opaque digest — useless to both the student and the developer.
 */

export type ActionErrorCode =
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "UNEXPECTED";

export type ActionError = {
  code: ActionErrorCode;
  /**
   * One sentence in Mongolian Cyrillic, safe to render straight into the UI.
   * Says what happened and what to do — never a stack trace, never English.
   */
  messageMn: string;
  /** Field-level messages for forms, keyed by the input path. */
  fieldErrors?: Record<string, string[]>;
};

export type ActionResult<TData> =
  | { ok: true; data: TData }
  | { ok: false; error: ActionError };

export function ok<TData>(data: TData): ActionResult<TData> {
  return { ok: true, data };
}

export function fail<TData = never>(error: ActionError): ActionResult<TData> {
  return { ok: false, error };
}

/**
 * Thrown inside a handler to return a controlled failure. Anything else that
 * escapes a handler becomes UNEXPECTED with a generic message, so an internal
 * detail can never leak into a student's screen.
 */
export class ActionFailure extends Error {
  readonly code: ActionErrorCode;
  readonly messageMn: string;
  readonly fieldErrors: Record<string, string[]> | undefined;

  constructor(
    code: ActionErrorCode,
    messageMn: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(`${code}: ${messageMn}`);
    this.name = "ActionFailure";
    this.code = code;
    this.messageMn = messageMn;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Default user-facing copy. Sentence case, one sentence, tells the student
 * what to do next (§1 copy rules).
 */
export const DEFAULT_ERROR_MN: Record<ActionErrorCode, string> = {
  INVALID_INPUT: "Хариулт бүрэн ирсэнгүй, дахин нэг удаа сонгоод үзээрэй.",
  NOT_FOUND: "Ийм код олдсонгүй, кодоо шалгаад дахин оруулаарай.",
  FORBIDDEN: "Энэ хуудсыг үзэх эрх алга, өөрийн холбоосоороо орно уу.",
  RATE_LIMITED: "Хэт олон удаа оролдлоо, 10 минутын дараа дахин үзээрэй.",
  UNEXPECTED: "Ямар нэг зүйл буруу боллоо, хэсэг хүлээгээд дахин оролдоорой.",
};
