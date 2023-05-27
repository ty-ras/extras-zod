/**
 * @file This file contains code using `zod` validators to parse JSON string and validate the resulting value.
 */

import * as t from "zod";

/**
 * Validates given `unknown` value by checking that the returned value is `string`s, parsing them as JSON, and then validating the value using given `zod` validator.
 * @param validation The `zod` validator object.
 * @param maybeJsonString Value which may be a string containing JSON data.
 * @returns The {@link t.SafeParseReturnType}.
 * @throws Error if the given `maybeJsonString` is not a `string`.
 */
export const validateFromMaybeStringifiedJSON = <TValidation extends t.ZodType>(
  validation: TValidation,
  maybeJsonString: unknown,
): t.SafeParseReturnType<unknown, t.TypeOf<TValidation>> => {
  if (typeof maybeJsonString !== "string") {
    throw new Error("Given value must be string.");
  }
  return validateFromStringifiedJSON(validation, maybeJsonString);
};

/**
 * Validates given `unknown` value by checking that the returned value is `string`s, parsing them as JSON, and then validating the value using given `zod` validator.
 * If validation is not passed, an error is thrown.
 * @param validation The `zod` validator object.
 * @param maybeJsonString Value which may be a string containing JSON data.
 * @returns The validated object.
 * @throws The {@link Error} if the given `maybeJsonString` is not a `string`, or if the parsed value does not pass validation of given `zod` validator object.
 */
export const validateFromMaybeStringifiedJSONOrThrow = <
  TValidation extends t.ZodType,
>(
  validation: TValidation,
  maybeJsonString: unknown,
): t.TypeOf<TValidation> => {
  const parseResult = validateFromMaybeStringifiedJSON(
    validation,
    maybeJsonString,
  );
  if (!parseResult.success) {
    throw new Error(`Configuration was invalid: ${parseResult.error}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return parseResult.data;
};

/**
 * Validates given optional `string` values by checking that they are non-empty `string`s, parsing them as JSON, and then validating the value using given `zod` validator.
 * @param validation The `zod` validator object.
 * @param jsonString Value which may be `string` with JSON data.
 * @returns The {@link t.SafeParseReturnType}
 * @throws The {@link Error} if given input is `undefined` or empty `string`.
 */
export const validateFromStringifiedJSON = <TValidation extends t.ZodType>(
  validation: TValidation,
  jsonString: string | undefined,
): t.SafeParseReturnType<unknown, t.TypeOf<TValidation>> => {
  if ((jsonString?.length ?? 0) <= 0) {
    throw new Error("Given string must not be undefined or empty.");
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return validation.safeParse(JSON.parse(jsonString!));
};

/**
 * Validates given optional `string` values by checking that they are non-empty `string`s, parsing them as JSON, and then validating the value using given `zod` validator.
 * If validation is not passed, an error is thrown.
 * @param validation The `zod` validator object.
 * @param jsonString Value which may be `string` with JSON data.
 * @returns The validated object.
 * @throws The {@link Error} if given input is `undefined` or empty `string`, or if the validation does not pass.
 */
export const validateFromStringifiedJSONOrThrow = <
  TValidation extends t.ZodType,
>(
  validation: TValidation,
  jsonString: string | undefined,
): t.TypeOf<TValidation> => {
  const parseResult = validateFromStringifiedJSON(validation, jsonString);
  if (!parseResult.success) {
    throw new Error(`Configuration was invalid: ${parseResult.error}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return parseResult.data;
};
