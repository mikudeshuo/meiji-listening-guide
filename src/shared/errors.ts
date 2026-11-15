/** Text to show for a caught value: an Error's message, otherwise the value as a string. */
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
