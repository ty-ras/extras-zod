/**
 * @file This file contains function to create callback which takes description about needed BE endpoint state/context, and produces {@link tyrasEP.EndpointStateInformation} which will be then used by TyRAS framework to perform the state/context extraction and validation process, before passing it to BE endpoint.
 */

import * as t from "zod";
import type * as tyrasEP from "@ty-ras/endpoint";
import * as tyras from "@ty-ras/data-zod";
import type * as tyrasBE from "@ty-ras/data-backend";
import type * as validation from "./validation";
import type * as state from "./state.types";
import type * as stateInfo from "./state-info.types";
import type * as spec from "./spec.types";
import * as consts from "./consts";

/**
 * Creates {@link CreateStateValidatorFactory} which can be used to create {@link tyrasEP.EndpointStateInformation} objects from given BE endpoint state/context description.
 * @param validation The object, keys being state/context names, and values being {@link validation.StatePropertyValidation}.
 * @returns The {@link CreateStateValidatorFactory} which can be used to create {@link tyrasEP.EndpointStateInformation} objects from given BE endpoint state/context description.
 */
export const createStateValidatorFactory =
  <TStateValidation extends validation.TStateValidationBase>(
    validation: TStateValidation,
  ): CreateStateValidatorFactory<TStateValidation> =>
  (specObject) => {
    const entries = Object.entries(specObject) as Array<
      [
        keyof typeof specObject & keyof TStateValidation,
        spec.StatePropertySpec<TStateValidation>,
      ]
    >;
    const getValidator = (
      ...[propName, propSpec]: (typeof entries)[number]
    ): t.ZodType => {
      const statePropValidation =
        validation[propName]?.validation ??
        // String(...) call is because:
        // Implicit conversion of a 'symbol' to a 'string' will fail at runtime. Consider wrapping this expression in 'String(...)'.
        doThrow(`State does not contain "${String(propName)}".`);

      if (typeof propSpec === "boolean") {
        // For booleans, simply return the property validator.
        // It will be part of 'type' or 'partial'.
        return statePropValidation;
      } else {
        // For more complex spec, see what is being specified and return validation based on that.
        switch (propSpec.match) {
          case consts.MATCH_EXACT: {
            const matched = propSpec.value;
            return statePropValidation.refine((v) => v === matched);
          }
          case consts.MATCH_ONE_OF: {
            const oneOf = propSpec.values;
            return statePropValidation.refine((val) =>
              oneOf.some((one) => val === one),
            );
          }
          case consts.MATCH_ALL_OF: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const allOf = propSpec.values as Array<any>;
            return statePropValidation.refine(
              (arr) =>
                Array.isArray(arr) &&
                allOf.every((one) => arr.some((v) => v === one)),
            );
          }
        }
      }
    };
    const validator = t.object({
      // Mandatory properties
      ...Object.fromEntries(
        entries
          .filter(([, propSpec]) => propSpec !== false)
          .map(
            ([propName, propSpec]) =>
              [propName, getValidator(propName, propSpec)] as const,
          ),
      ),
      // Optional properties
      ...Object.fromEntries(
        entries
          .filter(([, propSpec]) => propSpec === false)
          .map(([propName]) => [
            propName,
            validation[propName]?.validation?.optional() ??
              doThrow(`State does not contain "${String(propName)}".`),
          ]),
      ),
    });
    return {
      stateInfo: entries.map(([propName]) => propName),
      validator: makeValidator(validation, specObject, validator),
    };
  };

/**
 * This is the return type of {@link createStateValidatorFactory}, describing the callback used to produce {@link tyrasEP.EndpointStateInformation} objects from given description of state/context needed by BE endpoint.
 */
export type CreateStateValidatorFactory<
  TStateValidation extends validation.TStateValidationBase,
> = <TStateSpec extends spec.StateSpec<TStateValidation>>(
  spec: TStateSpec,
) => tyrasEP.EndpointStateInformation<
  stateInfo.StateInfoOfKeys<keyof TStateSpec>,
  state.GetState<TStateValidation, TStateSpec>
>;

/**
 * Helper type to extract generic parameter of given {@link CreateStateValidatorFactory} type.
 */
export type GetStateValidationInfo<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TFactory extends CreateStateValidatorFactory<any>,
> = TFactory extends CreateStateValidatorFactory<infer TStateValidation>
  ? TStateValidation
  : never;

const errorsHaveKey = (
  error: t.ZodError,
  predicate: (key: string) => boolean,
) =>
  error.issues.some(
    // We are only interested in top-level property
    ({ path: { 0: path } }) => typeof path === "string" && predicate(path),
  );

const doThrow = (msg: string) => {
  throw new Error(msg);
};

const makeValidator =
  <
    TStateValidation extends validation.TStateValidationBase,
    TStateSpec extends spec.StateSpec<TStateValidation>,
  >(
    validation: TStateValidation,
    specObject: TStateSpec,
    validator: t.ZodType,
  ): tyrasBE.StateValidator<state.GetState<TStateValidation, TStateSpec>> =>
  (input) => {
    const parseResult = validator.safeParse(input);
    if (!parseResult.success) {
      return errorsHaveKey(
        parseResult.error,
        (key) => validation[key]?.isAuthenticationProperty ?? false,
      ) // This was authentication related error -> return 401
        ? {
            error: "protocol-error" as const,
            statusCode: 401, // 401 is "no authentication", while 403 is "no permission even with authentication"
            body: undefined,
          }
        : // This was other error - perhaps DB pool creation failed? Will return 500
          tyras.createErrorObject([parseResult.error]);
    } else {
      // In case of success, transform it into DataValidationResponseSuccess
      return {
        error: "none" as const,
        data: parseResult.data as state.GetState<
          TStateValidation,
          typeof specObject
        >,
      };
    }
  };
