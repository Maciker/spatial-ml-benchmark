export class BenchmarkValidationError extends Error {
  override readonly name = "BenchmarkValidationError";

  constructor(message: string) {
    super(message);
  }
}

export class BenchmarkReplayError extends Error {
  override readonly name = "BenchmarkReplayError";

  constructor(message: string) {
    super(message);
  }
}
