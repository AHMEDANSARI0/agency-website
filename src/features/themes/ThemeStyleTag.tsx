import type { ThemeConfiguration } from "@/types/theme";
import { buildThemeCssVariables } from "./color-utils";

interface ThemeStyleTagProps {
  themeConfig: ThemeConfiguration;
}

export function ThemeStyleTag({ themeConfig }: ThemeStyleTagProps) {
  const cssVariables = buildThemeCssVariables(themeConfig);
  const defaultMode = themeConfig.defaultMode ?? "light";

  // Tiny inline initializer prevents theme flash before hydration while respecting saved or system preference
  const initScript = `(function(){try{var k='omniflow-theme-mode';var s=localStorage.getItem(k);var d=${JSON.stringify(
    defaultMode
  )};var m=(s==='light'||s==='dark'||s==='system')?s:d;var r=m==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):m;var el=document.documentElement;el.setAttribute('data-theme',r);el.classList.toggle('dark',r==='dark');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

  return (
    <>
      <style id="omniflow-theme-tokens" dangerouslySetInnerHTML={{ __html: cssVariables }} />
      <script dangerouslySetInnerHTML={{ __html: initScript }} />
    </>
  );
}
