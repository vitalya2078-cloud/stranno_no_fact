// Montserrat Black локально (OFL; склеен из подмножеств @fontsource: latin + cyrillic) — браузер рендера не ходит в Google Fonts.
import { continueRender, delayRender, staticFile } from "remotion";
export const fontFamily = "MontserratBlack";
if (typeof document !== "undefined" && !(window as any).__montLoaded) {
  (window as any).__montLoaded = true;
  const h = delayRender("font");
  const ff = new FontFace(fontFamily, `url(${staticFile("Montserrat-Black.ttf")})`, { weight: "900" });
  ff.load().then((f) => { (document as any).fonts.add(f); continueRender(h); }).catch(() => continueRender(h));
}
