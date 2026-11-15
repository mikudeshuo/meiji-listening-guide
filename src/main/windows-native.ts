import koffi from 'koffi';
let cached: ReturnType<typeof createApi> | undefined;
function createApi() {
  if (process.platform !== 'win32' || process.arch !== 'x64')
    throw new Error('此系统组件需要 Windows x64');
  const kernel = koffi.load('kernel32.dll'),
    crypt = koffi.load('crypt32.dll'),
    pointer = koffi.pointer('void');
  const blob = koffi.struct({ size: 'uint32_t', data: pointer });
  const fn = (name: string, result: string, args: Parameters<typeof kernel.func>[3]) =>
    kernel.func('__stdcall', name, result, args);
  return {
    protect: crypt.func('__stdcall', 'CryptProtectData', 'int32_t', [
      koffi.pointer(blob),
      pointer,
      pointer,
      pointer,
      pointer,
      'uint32_t',
      koffi.out(koffi.pointer(blob)),
    ]),
    unprotect: crypt.func('__stdcall', 'CryptUnprotectData', 'int32_t', [
      koffi.pointer(blob),
      pointer,
      pointer,
      pointer,
      pointer,
      'uint32_t',
      koffi.out(koffi.pointer(blob)),
    ]),
    localFree: fn('LocalFree', 'void *', [pointer]),
    lastError: fn('GetLastError', 'uint32_t', []),
  };
}
function api() {
  return (cached ??= createApi());
}
function checked(value: unknown) {
  if (!value) throw new Error('Windows 系统调用失败：' + api().lastError());
  return value;
}
/** Same current-user DPAPI format as the retired backend; no intermediate key files. */
export function windowsProtect(raw: Buffer, decrypt = false) {
  if (!raw.length || raw.length > 16 * 1024 * 1024) throw new Error('系统加密输入大小无效');
  const a = api(),
    output: { size?: number; data?: bigint } = {};
  checked(
    (decrypt ? a.unprotect : a.protect)(
      { size: raw.length, data: raw },
      null,
      null,
      null,
      null,
      1,
      output,
    ),
  );
  try {
    if (
      !output.data ||
      !Number.isSafeInteger(output.size) ||
      output.size! < 0 ||
      output.size! > 16 * 1024 * 1024
    )
      throw new Error('系统加密输出无效');
    return Buffer.from(koffi.decode(output.data, 'uint8_t', output.size!));
  } finally {
    if (output.data) a.localFree(output.data);
  }
}
