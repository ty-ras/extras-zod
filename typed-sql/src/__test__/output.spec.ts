import test, { ExecutionContext } from "ava";
import * as spec from "../output";
import * as input from "../input";
import * as t from "zod";
import * as common from "./common";
import * as errors from "../errors";

const runValidationForOneValue = (
  c: ExecutionContext,
  validation: t.ZodType,
  input: unknown,
  shouldSucceed: boolean,
) => {
  c.plan(1);
  const result = validation.safeParse(input);
  c.deepEqual(result.success, shouldSucceed);
};

const rowValidation = t.object({ id: t.string() });
const manyRows = spec.many(rowValidation);
const oneRow = spec.one(rowValidation);

test(
  "Validate that validation for many rows works for empty array",
  runValidationForOneValue,
  manyRows,
  [],
  true,
);
test(
  "Validate that validation for many rows works for array of one element",
  runValidationForOneValue,
  manyRows,
  [{ id: "id" }],
  true,
);
test(
  "Validate that validation for many rows works for array of two elements",
  runValidationForOneValue,
  manyRows,
  [{ id: "id" }, { id: "another" }],
  true,
);
test(
  "Validate that validation for many rows doesn't work for non-array",
  runValidationForOneValue,
  manyRows,
  "garbage",
  false,
);

test(
  "Validate that validation for one row doesn't for empty array",
  runValidationForOneValue,
  oneRow,
  [],
  false,
);
test(
  "Validate that validation for one row works for array of one element",
  runValidationForOneValue,
  oneRow,
  [{ id: "id" }],
  true,
);
test(
  "Validate that validation for one row works for array of two elements",
  runValidationForOneValue,
  oneRow,
  [{ id: "id" }, { id: "another" }],
  false,
);
test(
  "Validate that validation for one row doesn't work for non-array",
  runValidationForOneValue,
  oneRow,
  "garbage",
  false,
);

test("Validate that validateRows invokes given validation", async (c) => {
  c.plan(2);
  const firstQueryResult = ["returnedRow"];
  const secondQueryResult = ["returnedRow", "anotherRow"];
  const { usingMockedClient } = common.createMockedClientProvider([
    firstQueryResult,
    secondQueryResult,
  ]);
  const executor = spec.validateRows(
    input.prepareSQL`SELECT 1`(usingMockedClient),
    spec.one(t.string()),
  );
  // First invocation passes, because first mocked query result only contains one row
  await c.notThrowsAsync(async () => await executor([]));
  // Second invocation should not pass, because second mocked query result contains two rows
  await c.throwsAsync(async () => await executor([]), {
    instanceOf: errors.SQLQueryOutputValidationError,
  });
});
