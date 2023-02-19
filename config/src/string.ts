import * as t from "zod";

export const validateFromMaybeStringifiedJSON = <TValidation extends t.ZodType>(
  validation: TValidation,
  maybeJsonString: unknown,
): t.SafeParseReturnType<unknown, t.TypeOf<TValidation>> => {
  if (typeof maybeJsonString !== "string") {
    throw new Error("Given value must be string.");
  }
  return validateFromStringifiedJSON(validation, maybeJsonString);
};

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
