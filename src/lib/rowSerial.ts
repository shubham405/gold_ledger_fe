/** 1-based display serial for table rows (API ids stay internal for routes/keys). */
export function rowSerialNumber(
  zeroBasedIndex: number,
  options?: { page?: number; pageSize?: number },
): number {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 0;
  const offset = pageSize > 0 ? (page - 1) * pageSize : 0;
  return offset + zeroBasedIndex + 1;
}
