/** Reads a response body as UTF-8 text, refusing anything larger than `max` bytes. */
export async function boundedPublicText(response: Response, max = 262144) {
  if (!response.body) return '';
  if (Number(response.headers.get('content-length') || 0) > max) {
    await response.body.cancel();
    throw new Error('外部服务响应超过大小上限');
  }
  const reader = response.body.getReader(),
    chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      length += item.value.length;
      if (length > max) throw new Error('外部服务响应超过大小上限');
      chunks.push(item.value);
    }
    return Buffer.concat(chunks, length).toString('utf8');
  } finally {
    await reader.cancel().catch(() => {});
  }
}
