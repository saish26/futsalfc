import { notifications } from "@mantine/notifications";

/** Runs an API write, shows a toast either way, and reports whether it worked. */
export async function runAction<T>(
  fn: () => Promise<T>,
  { success, failure = "Something went wrong" }: { success: string; failure?: string }
): Promise<T | undefined> {
  try {
    const result = await fn();
    notifications.show({ color: "green", message: success });
    return result;
  } catch (err) {
    notifications.show({ color: "red", message: typeof err === "string" && err ? err : failure });
    return undefined;
  }
}
