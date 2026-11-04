/** Preserve independent search/sort controls while changing a status/category tab. */
export function filterHref(href:string,current:URLSearchParams) {
  const target=new URL(href,"https://safarinexa.invalid");
  for(const key of ["q","sort"])if(!target.searchParams.has(key)&&current.has(key))target.searchParams.set(key,current.get(key)!);
  target.searchParams.delete("page");
  return `${target.pathname}${target.searchParams.size?`?${target.searchParams}`:""}${target.hash}`;
}
