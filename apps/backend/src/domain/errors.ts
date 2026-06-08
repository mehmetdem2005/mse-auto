export type PlanLimitCode = "watch_limit" | "frequency_limit";

/** Plan limiti aşıldığında (HTTP 403'e eşlenir). */
export class PlanLimitError extends Error {
  readonly code: PlanLimitCode;
  constructor(code: PlanLimitCode, message: string) {
    super(message);
    this.name = "PlanLimitError";
    this.code = code;
  }
}
