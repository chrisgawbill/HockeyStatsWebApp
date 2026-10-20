type ClassNameValue = string | false | null | undefined;

/** Joins the truthy class names with spaces, skipping falsy conditionals. */
export function joinClassNames(...classNames: ClassNameValue[]): string {
  return classNames.filter(Boolean).join(' ');
}
