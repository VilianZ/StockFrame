type CanonicalPrimitive = string | number | boolean | null;
type CanonicalValue =
  | CanonicalPrimitive
  | CanonicalValue[]
  | { [key: string]: CanonicalValue };

function normalize(value: unknown, path: string): CanonicalValue {
  if (value === null) {
    return null;
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(`Cannot serialize non-finite number at ${path}`);
    }
    return Object.is(value, -0) ? 0 : value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => normalize(item, `${path}[${index}]`));
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.keys(record)
      .sort()
      .reduce<Record<string, CanonicalValue>>((sorted, key) => {
        sorted[key] = normalize(record[key], `${path}.${key}`);
        return sorted;
      }, {});
  }

  throw new TypeError(`Cannot serialize ${typeof value} at ${path}`);
}

export function canonicalSerialize(value: unknown): string {
  return JSON.stringify(normalize(value, "$"));
}
