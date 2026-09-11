export async function apiFetch(url, options) {
    const response = await fetch(url, options);
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
        throw new Error(data?.error || "Something went wrong. Please try again.");
    }

    return data;
}
