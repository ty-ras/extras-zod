/* eslint-disable @typescript-eslint/ban-types */
import * as t from "zod";
import type * as query from "./input";
import * as errors from "./errors";

export const one = <TValidation extends t.ZodType>(
  singleRow: TValidation,
): t.ZodType<t.TypeOf<TValidation>> =>
  many(singleRow).transform((array, ctx) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    array.length == 1
      ? array[0]
      : (ctx.addIssue({
          code: t.ZodIssueCode.custom,
          message: `Expected exactly 1 row, but got ${array.length}.`,
        }),
        t.NEVER),
  );

export const many = <TValidation extends t.ZodType>(
  singleRow: TValidation,
): t.ZodType<Array<t.TypeOf<TValidation>>> =>
  t.array(singleRow).describe("Rows");

export const validateRows = <
  TClient,
  TParameters,
  TValidation extends t.ZodType,
>(
  executor: query.SQLQueryExecutor<TClient, TParameters, Array<unknown>>,
  validation: TValidation,
): query.SQLQueryExecutor<TClient, TParameters, t.TypeOf<TValidation>> => {
  async function retVal(
    client: ClientOf<typeof executor>,
    parameters: ParametersOf<typeof executor>,
  ) {
    const maybeResult = validation.safeParse(
      await executor(client, parameters),
    );
    if (!maybeResult.success) {
      throw new errors.SQLQueryOutputValidationError(maybeResult.error);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return maybeResult.data;
  }
  retVal.sqlString = executor.sqlString;
  return retVal;
};

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
type ParametersOf<TExecutor extends query.SQLQueryExecutor<any, any, any>> =
  TExecutor extends query.SQLQueryExecutor<
    infer _1,
    infer TParameters,
    infer _2
  >
    ? TParameters
    : never;

type ClientOf<TExecutor extends query.SQLQueryExecutor<any, any, any>> =
  TExecutor extends query.SQLQueryExecutor<infer TClient, infer _1, infer _2>
    ? TClient
    : never;
