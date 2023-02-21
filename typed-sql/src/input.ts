/* eslint-disable @typescript-eslint/ban-types */
import * as t from "zod";
import * as parameters from "./parameters";
import * as errors from "./errors";

export function prepareSQL(
  template: TemplateStringsArray,
): SQLQueryInformation<void>;
export function prepareSQL<
  TArgs extends [
    parameters.SQLTemplateParameter,
    ...Array<parameters.SQLTemplateParameter>,
  ],
>(
  template: TemplateStringsArray,
  ...args: TArgs
): SQLQueryInformation<
  TArgs[number] extends parameters.SQLRaw ? void : SQLParameterReducer<TArgs>
>;
export function prepareSQL<
  TArgs extends Array<parameters.SQLTemplateParameter>,
>(
  template: TemplateStringsArray,
  ...args: TArgs
): SQLQueryInformation<void | SQLParameterReducer<TArgs>> {
  const {
    parameterValidation,
    parameterNames,
    templateIndicesToParameterIndices,
  } = getParameterValidationAndNames(args);

  return ({ constructParameterReference, executeQuery }) => {
    const queryString = constructTemplateString(template, args, (argIdx) => {
      let thisFragment: string;
      const arg = args[argIdx];
      if (parameters.isSQLParameter(arg)) {
        const parameterIndex = templateIndicesToParameterIndices[argIdx];
        if (parameterIndex === undefined) {
          throw new Error(
            `Internal error: parameter index for template arg at ${argIdx} was not defined when it should've been.`,
          );
        }
        thisFragment = constructParameterReference(parameterIndex, arg);
      } else {
        thisFragment = arg.rawSQL;
      }
      return thisFragment;
    });

    // It is possible to do this also via Object.assign
    // https://stackoverflow.com/questions/12766528/build-a-function-object-with-properties-in-typescript
    // However, I think this way is nicer.
    // It is from https://bobbyhadz.com/blog/typescript-assign-property-to-function
    async function executor(
      client: Parameters<typeof executeQuery>[0],
      queryParameters: void | SQLParameterReducer<TArgs>,
    ) {
      const maybeParameters = parameterValidation.safeParse(queryParameters);
      if (!maybeParameters.success) {
        throw new errors.SQLQueryInputValidationError(maybeParameters.error);
      }
      const validatedParameters = maybeParameters.data;
      return await executeQuery(
        client,
        queryString,
        parameterNames.map(
          (parameterName) =>
            validatedParameters[
              parameterName as keyof typeof validatedParameters
            ],
        ),
      );
    }
    executor.sqlString = queryString;
    return executor;
  };
}

// Tuple reducer spotted from https://stackoverflow.com/questions/69085499/typescript-convert-tuple-type-to-object
export type SQLParameterReducer<
  Arr extends Array<unknown>,
  Result extends Record<string, unknown> = {},
> = Arr extends []
  ? Result
  : Arr extends [infer Head, ...infer Tail]
  ? SQLParameterReducer<
      [...Tail],
      Result &
        (Head extends parameters.SQLParameter<infer TName, infer TValidation>
          ? Record<TName, t.TypeOf<TValidation>>
          : {})
    >
  : Readonly<Result>;

export type SQLQueryInformation<TParameters> = <TClient>(
  clientInformation: SQLClientInformation<TClient>,
) => SQLQueryExecutor<TClient, TParameters, Array<unknown>>;

export interface SQLClientInformation<TClient> {
  constructParameterReference: (
    parameterIndex: number,
    parameter: parameters.SQLParameter<string, t.ZodType>,
  ) => string;
  executeQuery: (
    client: TClient,
    sqlString: string,
    parameters: Array<unknown>,
  ) => Promise<Array<unknown>>;
}

export type SQLQueryExecutor<TClient, TParameters, TReturnType> =
  SQLQueryExecutorFunction<TClient, TParameters, TReturnType> & WithSQLString;

export interface WithSQLString {
  readonly sqlString: string;
}

export type SQLQueryExecutorFunction<TClient, TParameters, TReturnType> = (
  client: TClient,
  parameters: TParameters,
) => Promise<TReturnType>;

const constructTemplateString = <T>(
  fragments: TemplateStringsArray,
  args: ReadonlyArray<T>,
  transformArg: (idx: number, fragment: string) => string,
) =>
  fragments.reduce(
    (curString, fragment, idx) =>
      `${curString}${fragment}${
        idx >= args.length ? "" : transformArg(idx, fragment)
      }`,
    "",
  );

const getParameterValidationAndNames = (
  args: ReadonlyArray<parameters.SQLTemplateParameter>,
) => {
  const { parameterInstances, props, templateIndicesToParameterIndices } =
    args.reduce<{
      parameterInstances: Array<parameters.SQLParameter<string, t.ZodType>>;
      props: t.ZodRawShape;
      templateIndicesToParameterIndices: Array<number | undefined>;
      namesToIndices: Record<string, number>;
    }>(
      (state, arg, idx) => {
        let paramIdx: number | undefined;
        if (parameters.isSQLParameter(arg)) {
          const parameterName = arg.parameterName;
          const existing = state.props[parameterName];
          if (existing) {
            if (arg.validation === existing) {
              paramIdx = state.namesToIndices[parameterName];
            } else {
              throw new errors.DuplicateSQLParameterNameError(parameterName);
            }
          } else {
            paramIdx = state.parameterInstances.length;
            state.parameterInstances.push(arg);
            state.namesToIndices[parameterName] = paramIdx;
            state.props[parameterName] = arg.validation;
          }
        } else if (!parameters.isRawSQL(arg)) {
          throw new errors.InvalidSQLTemplateArgumentError(idx);
        }
        state.templateIndicesToParameterIndices.push(paramIdx);
        return state;
      },
      {
        parameterInstances: [],
        props: {},
        templateIndicesToParameterIndices: [],
        namesToIndices: {},
      },
    );
  const parameterValidation =
    parameterInstances.length > 0
      ? t.object(props).describe("SQLParameters")
      : t.void();
  return {
    parameterValidation,
    parameterNames: parameterInstances.map((p) => p.parameterName),
    templateIndicesToParameterIndices,
  };
};
