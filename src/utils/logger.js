// Log application errors without exposing sensitive data.
export function logError(context, error) {
    console.error(`[${context}]`, {
        name: error?.name,
        status: error?.status ?? null
    });
}
