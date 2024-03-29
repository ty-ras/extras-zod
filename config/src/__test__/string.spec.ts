/**
 * @file This file contains unit tests for functionality in file `../string.ts`.
 */

import test from "ava";
import * as t from "zod";
import * as spec from "../string";

test("Validate that validateFromStringifiedJSON works correctly", (c) => {
  c.plan(2);
  c.like(spec.validateFromStringifiedJSON(t.void(), "{}"), {
    success: false,
  });
  c.deepEqual(
    spec.validateFromStringifiedJSON(
      t.object({ property: t.string() }),
      '{"property": "hello"}',
    ),
    {
      success: true,
      data: {
        property: "hello",
      },
    },
  );
});

test("Validate that validateFromStringifiedJSONOrThrow works correctly", (c) => {
  c.plan(2);
  c.throws(() => spec.validateFromStringifiedJSONOrThrow(t.string(), "null"));
  c.deepEqual(
    spec.validateFromStringifiedJSONOrThrow(t.string(), '"hello"'),
    "hello",
  );
});

test("Validate that readJSONStringToValueOrThrow works correctly", (c) => {
  c.plan(5);
  const validator = (input: unknown) =>
    spec.validateFromMaybeStringifiedJSONOrThrow(t.string(), input);
  // When not non-empty string, error gets returned
  c.throws(() => validator(12), { instanceOf: Error });
  c.throws(() => validator(""), { instanceOf: Error });
  // If string but not parseable to JSON, the JSON.parse will throw
  c.throws(() => validator("  "), { instanceOf: Error });
  // When JSON string but doesn't pass validation, Zod error is thrown
  c.throws(() => validator("123"), { instanceOf: Error });
  // Otherwise, is success
  c.deepEqual(validator('"hello"'), "hello");
});

test("Validate that validateFromStringifiedJSON detects undefined value", (c) => {
  c.plan(1);
  c.throws(() => spec.validateFromStringifiedJSON(t.string(), undefined), {
    message: "Given string must not be undefined or empty.",
  });
});
