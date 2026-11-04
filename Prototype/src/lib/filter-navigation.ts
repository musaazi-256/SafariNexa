/** Change one facet without losing independent facets, repeated values, or search. */
export function updateFilterParams(current: URLSearchParams, name: string, value?: string) {
  const next = new URLSearchParams(current.toString());
  if (value === undefined) next.delete(name);
  else next.set(name, value);
  next.delete("page");
  return next;
}
