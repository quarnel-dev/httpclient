export function createTimeoutSignal(timeoutMs: number, userSignal?: AbortSignal | null): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  return userSignal ? AbortSignal.any([userSignal, timeoutSignal]) : timeoutSignal
}
