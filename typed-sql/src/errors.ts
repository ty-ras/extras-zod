import type * as t from "zod";

export class DuplicateSQLParameterNameError extends Error {
  public constructor(public readonly parameterName: string) {
    super(`Duplicate SQL parameter name: "${parameterName}".`);
  }
}

export class InvalidSQLTemplateArgumentError extends Error {
  public constructor(public readonly index: number) {
    super(`Invalid template argument passed at index ${index}.`);
  }
}

export class SQLQueryValidationError extends Error {}

export class SQLQueryInputValidationError extends SQLQueryValidationError {
  public constructor(public readonly validationError: t.ZodError) {
    super(validationError.message);
  }
}

export class SQLQueryOutputValidationError extends SQLQueryValidationError {
  public constructor(public readonly validationError: t.ZodError) {
    super(validationError.message);
  }
}

export const isDuplicateSQLParameterNameError = (
  error: Error,
): error is DuplicateSQLParameterNameError =>
  error instanceof DuplicateSQLParameterNameError;

export const isInvalidSQLTemplateArgumentError = (
  error: Error,
): error is InvalidSQLTemplateArgumentError =>
  error instanceof InvalidSQLTemplateArgumentError;

export const isSQLQueryInputValidationError = (
  error: unknown,
): error is SQLQueryInputValidationError =>
  error instanceof SQLQueryInputValidationError;

export const isSQLQueryOutputValidationError = (
  error: unknown,
): error is SQLQueryOutputValidationError =>
  error instanceof SQLQueryOutputValidationError;
