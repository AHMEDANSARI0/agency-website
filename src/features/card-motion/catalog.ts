/** Stable identifiers are assigned by the source card and CMS record, not DOM position or visible text. */
export interface CardDescriptor { id: string; label: string; element: HTMLElement; duplicate: boolean }
function hash(value: string): string {
  let a = 2166136261, b = 2246822519;
  for (let i = 0; i < value.length; i++) { const c=value.charCodeAt(i); a=Math.imul(a^c,16777619); b=Math.imul(b^c,3266489917); }
  return (a>>>0).toString(16).padStart(8,"0") + (b>>>0).toString(16).padStart(8,"0");
}
export function findPublicCards(doc: Document, pathname: string): CardDescriptor[] {
  const main=doc.getElementById("main-content"); if (!main) return [];
  const nodes=Array.from(main.querySelectorAll<HTMLElement>("[data-card-motion-id]"));
  const result=nodes.map((element,index) => {
    const sourceId=element.dataset.cardMotionId || "";
    const section=element.closest<HTMLElement>("[data-ve-section-id]")?.dataset.veSectionId || "";
    const id=`c-${hash(JSON.stringify([pathname,section,sourceId]))}`;
    const title=element.querySelector("h1,h2,h3,h4,summary")?.textContent?.trim() || element.querySelector("a")?.textContent?.trim() || element.textContent?.trim() || `Card ${index+1}`;
    return {id,label:title.replace(/\s+/g," ").slice(0,100),element,duplicate:false};
  });
  const counts=new Map<string,number>(); for(const card of result) counts.set(card.id,(counts.get(card.id)||0)+1);
  return result.map(c=>({...c,duplicate:(counts.get(c.id)||0)>1}));
}
