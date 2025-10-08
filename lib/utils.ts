type ClassValue = string | number | boolean | undefined | null | ClassValue[] | { [key: string]: any }

function clsx(...inputs: ClassValue[]): string {
  const classes: string[] = []

  for (const input of inputs) {
    if (!input) continue

    if (typeof input === "string" || typeof input === "number") {
      classes.push(String(input))
    } else if (Array.isArray(input)) {
      const nested = clsx(...input)
      if (nested) classes.push(nested)
    } else if (typeof input === "object") {
      for (const key in input) {
        if (input[key]) classes.push(key)
      }
    }
  }

  return classes.join(" ")
}

export function cn(...inputs: ClassValue[]) {
  return clsx(...inputs)
}
