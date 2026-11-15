import { createHash, randomUUID, type BinaryLike } from 'node:crypto';
import { createReadStream } from 'node:fs';

/** Lower-case hex SHA-256 of a string or of bytes. */
export const sha256 = (data: BinaryLike) => createHash('sha256').update(data).digest('hex');

/** SHA-256 of a value's JSON text. Key order matters: callers pass values they build themselves. */
export const sha256Json = (value: unknown) => sha256(JSON.stringify(value));

/** SHA-256 of a file's bytes, streamed so large media files are not held in memory. */
export async function sha256File(path: string) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

/** A random 32-character hex identifier (a UUID without dashes). */
export const hexId = () => randomUUID().replaceAll('-', '');
