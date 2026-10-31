// ОБЛОЖКА ролика (1080×1920): сцена-хук «дом в разрезе» (неон A) + «КТО ВОРУЕТ ТВОЙ WI-FI?». Рендерить кадр 150 (луч уже дотянулся).
import React from "react";
import { AbsoluteFill } from "remotion";
import { A, D, M, U } from "./brand";
import { House } from "./Video";

export const Thumb: React.FC = () => (
  <AbsoluteFill style={{ background: A.bg, overflow: "hidden" }}>
    <AbsoluteFill style={{ transform: "translateY(300px) scale(1.18)" }}><House strong /></AbsoluteFill>
    <AbsoluteFill style={{ background: "linear-gradient(#04060f 0%, rgba(4,6,15,0.85) 22%, rgba(4,6,15,0) 42%)" }} />
    <div style={{ position: "absolute", left: 70, right: 70, top: 150 }}>
      <div style={{ fontFamily: M, fontWeight: 800, fontSize: 34, letterSpacing: 10, color: A.glow }}>А ЧТО ЕСЛИ…</div>
      <div style={{ fontFamily: U, fontWeight: 800, fontSize: 112, lineHeight: 1.02, color: "#fff", marginTop: 24 }}>
        КТО<br />ВОРУЕТ<br />ТВОЙ <span style={{ color: A.glow2, textShadow: `0 0 40px ${A.glow2}` }}>WI-FI?</span></div>
    </div>
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 55%, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
  </AbsoluteFill>
);
