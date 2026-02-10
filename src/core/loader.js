export async function loadContent(url, fetchFn, signal) {
  const response = await fetchFn(url, { signal });
  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
    error.status = response.status;
    error.response = response;
    throw error;
  }
  return response.text();
}