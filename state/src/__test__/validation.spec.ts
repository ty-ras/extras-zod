import test from "ava";
import * as spec from "../validation";
import * as t from "zod";

test("Validate that getFullStateValidationInfo works", (c) => {
  c.plan(1);
  const stringValidator = t.string();
  const numberValidator = t.number();
  c.deepEqual(
    spec.getFullStateValidationInfo(
      {
        userId: stringValidator,
      },
      {
        database: numberValidator,
      },
    ),
    {
      userId: {
        isAuthenticationProperty: true,
        validation: stringValidator,
      },
      database: {
        isAuthenticationProperty: false,
        validation: numberValidator,
      },
    },
  );
});
