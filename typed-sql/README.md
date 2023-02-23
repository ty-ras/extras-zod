# Typesafe REST API Specification Extras - Typed SQL Query Execution With Zod

[![Coverage](https://codecov.io/gh/ty-ras/extras-zod/branch/main/graph/badge.svg?flag=typed-sql)](https://codecov.io/gh/ty-ras/extras-zod)

This folder contains `@ty-ras-extras/typed-sql-zod` library which exposes API to create callbacks which will execute SQL queries against a parametrizable client.
These callbacks will expose the input signature at compile-time utilizing custom template functions, as well as compile-time types for query result.
In addition to that, the callbacks will perform runtime validation using [`zod`](https://github.com/colinhacks/zod) library on inputs to the query, as well as output of the query execution rows returned by client.

# Usage
## Input and Output Validation
The goal of this library is to capture executing SQL query as a callback with typed input and output, in a most feasible way from the point of typesafety and ease of usage.
The runtime validation library `zod` is used as a tool to ensure that both the input and the output will be adhered to the types they claim to represent, at runtime.

Start by defining a SQL query using [tagged template](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) function provided by this library:
```ts
import * as t from "zod";
import * as sql from "@ty-ras-extras/typed-sql-zod";

// The parameter signifying the placeholder in the final SQL query string
const columnParameter = sql.parameter(
  // The name of the parameter -> will be directly mapped to input object property name
  "idParameter",
  // The Zod validation object for the parameter.
  // The type of the input object property value will be extracted from this using "t.TypeOf<>".
  t.string(),
);

// Construct object has typed callback response.
// The "prepareSQL" is the tagged template provided by this library.
const preparedQuery = sql.prepareSQL`
SELECT column
FROM table
WHERE id = ${columnParameter}
`;
```

The `preparedQuery` now acts as a factory to actually create a callback with typed input and output.
The last missing piece in the puzzle is how the `columnParameter` should be transformed when building the final SQL string.

In PostgreSQL, the parameters are expressed as `$1`, `$2`, and so on, placeholders within SQL string.
Let's build the callback from `preparedQuery` using this PostgreSQL provider:
```ts
import type * as pg from "pg";

// Declare reusable client information encapsulating the logic needed to create the callback we want
const postgreSQLClientInfo: sql.SQLClientInformation<pg.Client> = {
  // The SQL parameter at given index is transformed to SQL string placeholder using this callback.
  constructParameterReference: (index) => `$${index + 1}`,
  // When the SQL is executed, this callback will be called.
  executeQuery: async (client, sqlString, parameters) =>
    (
      await client.query(sqlString, parameters)
    ).rows,
};

// Create the callack bound to executing queries against PostgreSQL client
const preparedQueryPostgreSQL = preparedQuery(postgreSQLClientInfo);

type ExecutePostgreSQLQuery = typeof preparedQueryPostgreSQL;
//  The function signature "ExecutePostgreSQLQuery" is
//                         ⬇️
//  (client: pg.Client, parameters: { idParameter: string }) => Promise<Array<unknown>>
```

Notice how the `"idParameter"` string literal defined in first code sample is now transformed into a propery name of an input object.
Furthermore, its type is `string` as that is the output type of `zod` library `t.string()` validator.

Notice that `preparedQueryPostgreSQL`, in addition of being a callback, also exposes `sqlString` property, so that it could be used in e.g. unit tests or other scenarios:
```ts
const preparedSQLString = preparedQueryPostgreSQL.sqlString;
// The value of "preparedSQLString" will be the following multiline string:
// SELECT column
// FROM table
// WHERE id = $1
```

Now we can use the runtime-validated callback with static auto-complete:
```ts
const executeQueryWithClient = async (client: pg.Client) =>
  await preparedQueryPostgreSQL(client, { idParameter: "my-id" });
//                                        ⬆️            ⬆️
//                   auto-complete property name     validate property value both at compile- and runtime
```

The input looks good now!
However, the output of the `executeQueryWithClient` is still `Promise<Array<unknown>>`.
This can be fixed with functions `validateRows` and `many` exposed by this library:
```ts
const executeQuery = sql.validateRows(
  preparedQueryPostgreSQL,
  sql.many(t.object({
    column: t.string()
  }))
);

type ExecuteQuery = typeof executeQuery:
//  The function signature "ExecutePostgreSQLQuery" is
//                          ⬇️
//  (client: pg.Client, parameters: { idParameter: string }) => Promise<Array<{ column: string }>>
```

The return value of the callback has now changed from `Promise<Array<unknown>>` to `Promise<Array<{ column: string }>>`.
Notice also that the `sqlString` property exposing the same SQL string is still available for `executeQuery` as well.
Now we can modify our `executeQueryWithClient` to be properly typed:
```ts
// The type of executeQueryWithClient is now
//                  ⬇️
// (client: pg.Client) => Promise<Array<{ column: string }>> ⬅️ Return value is validated both at compile- and runtime
const executeQueryWithClient = async (client: pg.Client) =>
  await preparedQueryPostgreSQL(client, { idParameter: "my-id" });
//                                        ⬆️            ⬆️
//                   auto-complete property name     validate property value both at compile- and runtime
```

So now the `executeQueryWithClient` has both **compile-** and **runtime** validation for both **input** and **output** of SQL execution.

## Helper for One Row Query
One common pattern is to expect exactly 1 row from the query.
In such cases, the `one` function of this library can also be used - it validates that array has only one element, and then validates that one element using given `zod` validation object:
```ts
const executeQuery = sql.validateRows(
  preparedQueryPostgreSQL,
  sql.one(t.object({
    column: t.string()
  }))
);
type ExecuteQuery = typeof executeQuery:
//  The function signature "ExecutePostgreSQLQuery" is
//                          ⬇️
//  (client: pg.Client, parameters: { idParameter: string }) => Promise<{ column: string }>

// The type of executeQueryWithClient is now
//                  ⬇️
// (client: pg.Client) => Promise<{ column: string }> ⬅️ Return value is validated both at compile- and runtime
const executeQueryWithClient = async (client: pg.Client) =>
  await preparedQueryPostgreSQL(client, { idParameter: "my-id" });
//                                        ⬆️            ⬆️
//                   auto-complete property name     validate property value both at compile- and runtime

```

## Full code sample
For completeness sake, here is full code sample (with untyped return value part cut off):
```ts
import * as t from "zod";
import * as sql from "@ty-ras-extras/typed-sql-zod";
import type * as pg from "pg";

// The parameter signifying the placeholder in the final SQL query string
const columnParameter = sql.parameter(
  // The name of the parameter -> will be directly mapped to input object property name
  "idParameter",
  // The Zod validation object for the parameter.
  // The type of the input object property value will be extracted from this using "t.TypeOf<>".
  t.string(),
);

// Construct object has typed callback response.
// The "prepareSQL" is the tagged template provided by this library.
const preparedQuery = sql.prepareSQL`
SELECT column
FROM table
WHERE id = ${columnParameter}
`;

// Declare reusable client information encapsulating the logic needed to create the callback we want
const postgreSQLClientInfo: sql.SQLClientInformation<pg.Client> = {
  // The SQL parameter at given index is transformed to SQL string placeholder using this callback.
  constructParameterReference: (index) => `$${index + 1}`,
  // When the SQL is executed, this callback will be called.
  executeQuery: async (client, sqlString, parameters) =>
    (
      await client.query(sqlString, parameters)
    ).rows,
};

// Create the callack bound to executing queries against PostgreSQL client
const preparedQueryPostgreSQL = sql.validateRows(
  preparedQuery(postgreSQLClientInfo),
  sql.many(t.object({
    column: t.string()
  }))
);

type ExecutePostgreSQLQuery = typeof preparedQueryPostgreSQL;
//  The function signature "ExecutePostgreSQLQuery" is
//                         ⬇️
//  (client: pg.Client, parameters: { idParameter: string }) => Promise<Array<{ column: string }>>

// The type of executeQueryWithClient is now
//                  ⬇️
// (client: pg.Client) => Promise<Array<{ column: string }>> ⬅️ Return value is validated both at compile- and runtime
const executeQueryWithClient = async (client: pg.Client) =>
  await preparedQueryPostgreSQL(client, { idParameter: "my-id" });
//                                        ⬆️            ⬆️
//                   auto-complete property name     validate property value both at compile- and runtime
```
