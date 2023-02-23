import type * as t from "zod";
import * as tyras from "@ty-ras/data";

export const getFullStateValidationInfo = <
  TAuthenticated extends Record<string, t.ZodType>,
  TOther extends Record<string, t.ZodType>,
>(
  authenticated: TAuthenticated,
  other: TOther,
) =>
  ({
    ...tyras.transformEntries(authenticated, (validation) => ({
      validation,
      isAuthenticationProperty: true,
    })),
    ...tyras.transformEntries(other, (validation) => ({
      validation,
      isAuthenticationProperty: false,
    })),
  } as {
    readonly [P in keyof TAuthenticated]: StatePropertyValidation<
      TAuthenticated[P],
      true
    >;
  } & {
    readonly [P in keyof TOther]: StatePropertyValidation<TOther[P], false>;
  });

export type TStateValidationBase = Record<
  string,
  StatePropertyValidation<t.ZodType, boolean>
>;

export interface StatePropertyValidation<
  TValidation extends t.ZodType,
  TIsAuthentication extends boolean,
> {
  validation: TValidation;
  isAuthenticationProperty: TIsAuthentication;
}
