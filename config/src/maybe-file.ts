
//import * as t from "zod";
//import * as fs from "fs/promises";

// /**
//  * Notice that in order for `stringValue` to be recognized as file path, it must start with either `"."` or `"/"` character.
//  * @param stringValue String value which will be interpreted as inline JSON or path to file containing JSON.
//  * @returns A task which either contains error, or string.
//  */
// export const getJSONStringValueFromMaybeStringWhichIsJSONOrFilename = (
//   stringValue: string,
// ): TE.TaskEither<Error, string> =>
//   F.pipe(
//     stringValue,
//     // Check the string contents - should we treat it as JSON string or path to file?
//     // We use chainW instead of map because we return Either, and chainW = map + flatten (+ 'W'iden types)
//     extractConfigStringType,
//     // We may need to use async now (in case of file path), so lift Either into TaskEither (Promisified version of Either)
//     TE.fromEither,
//     // Invoke async callback
//     TE.chainW(({ type, str }) =>
//       TE.tryCatch(
//         async () =>
//           // eslint-disable-next-line @typescript-eslint/no-unsafe-return
//           type === "JSON" ? str : await fs.readFile(str, "utf8"),
//         E.toError,
//       ),
//     ),
//   );

// export const getJSONStringValueFromMaybeStringWhichIsJSONOrFilenameFromEnvVar =
//   (envVarName: string) =>
//   (maybeString: unknown): TE.TaskEither<Error, string> =>
//     F.pipe(
//       // Check that it is actually non-empty string.
//       nonEmptyString.decode(maybeString),
//       E.mapLeft(
//         () =>
//           new Error(
//             `The "${envVarName}" env variable must contain non-empty string.`,
//           ),
//       ),
//       E.map(getJSONStringValueFromMaybeStringWhichIsJSONOrFilename),
//       TE.fromEither,
//       TE.flatten,
//     );

// type ConfigStringType = { type: "JSON" | "file"; str: string };

// const JSON_STARTS_REGEX = /^\s*(\{|\[|"|t|f|\d|-|n)/;

// const FILE_STARTS = [".", "/"];

// const extractConfigStringType = (
//   configString: string,
// ): E.Either<Error, ConfigStringType> =>
//   JSON_STARTS_REGEX.test(configString)
//     ? E.right({
//         type: "JSON",
//         str: configString,
//       })
//     : FILE_STARTS.some((s) => configString.startsWith(s))
//     ? E.right({
//         type: "file",
//         str: configString,
//       })
//     : E.left(
//         new Error(
//           `The env variable string must start with one of the following: ${[
//             JSON_STARTS_REGEX.source,
//             ...FILE_STARTS,
//           ]
//             .map((s) => `"${s}"`)
//             .join(",")}.`,
//         ),
//       );

// const nonEmptyString = t.string()
// .refine((str) => str.length > 0)
// .describe("JSONOrFilenameString");


export const lel = "";