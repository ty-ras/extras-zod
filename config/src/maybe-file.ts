import * as t from "zod";
import * as fs from "fs/promises";

/**
 * Notice that in order for `stringValue` to be recognized as file path, it must start with either `"."` or `"/"` character.
 * @param stringValue String value which will be interpreted as inline JSON or path to file containing JSON.
 * @returns A task which either contains error, or string.
 */
export const getJSONStringValueFromStringWhichIsJSONOrFilename = async (
  stringValue: string,
): Promise<string> => {
  // Check the string contents - should we treat it as JSON string or path to file?
  const { type, str } = extractConfigStringType(stringValue);
  return type === "JSON" ? str : await fs.readFile(str, "utf8");
};

export const getJSONStringValueFromMaybeStringWhichIsJSONOrFilenameFromEnvVar =
  async (envVarName: string, maybeString: unknown): Promise<string> => {
    // Check that it is actually non-empty string.
    const maybeNonEmpty = nonEmptyString.safeParse(maybeString);
    if (!maybeNonEmpty.success) {
      throw new Error(
        `The "${envVarName}" env variable must contain non-empty string.`,
      );
    }
    return await getJSONStringValueFromStringWhichIsJSONOrFilename(
      maybeNonEmpty.data,
    );
  };

type ConfigStringType = { type: "JSON" | "file"; str: string };

const JSON_STARTS_REGEX = /^\s*(\{|\[|"|t|f|\d|-|n)/;

const FILE_STARTS = [".", "/"];

const extractConfigStringType = (configString: string): ConfigStringType =>
  JSON_STARTS_REGEX.test(configString)
    ? {
        type: "JSON",
        str: configString,
      }
    : FILE_STARTS.some((s) => configString.startsWith(s))
    ? {
        type: "file",
        str: configString,
      }
    : doThrow(
        `The env variable string must start with one of the following: ${[
          JSON_STARTS_REGEX.source,
          ...FILE_STARTS,
        ]
          .map((s) => `"${s}"`)
          .join(",")}.`,
      );

const doThrow = (message: string) => {
  throw new Error(message);
};

const nonEmptyString = t
  .string()
  .refine((str) => str.length > 0)
  .describe("JSONOrFilenameString");
