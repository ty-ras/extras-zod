/* eslint-disable @typescript-eslint/ban-types */
import type * as t from "zod";

export type SQLTemplateParameter = AnySQLParameter | SQLRaw;

export type AnySQLParameter = SQLParameter<string, t.ZodType>;

export class SQLRaw {
  public constructor(public readonly rawSQL: string) {}
}

export class SQLParameter<TName extends string, TValidation extends t.ZodType> {
  public constructor(
    public readonly parameterName: TName,
    public readonly validation: TValidation,
  ) {}
}

export const raw = (str: string) => new SQLRaw(str);

export const parameter = <TName extends string, TValidation extends t.ZodType>(
  name: TName,
  validation: TValidation,
) => new SQLParameter(name, validation);

export const isSQLParameter = (
  templateParameter: SQLTemplateParameter,
): templateParameter is AnySQLParameter =>
  templateParameter instanceof SQLParameter;

export const isRawSQL = (
  templateParameter: SQLTemplateParameter,
): templateParameter is SQLRaw => templateParameter instanceof SQLRaw;
