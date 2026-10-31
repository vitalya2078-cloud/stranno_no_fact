// ОБЛОЖКА ролика (1080×1920): улица с паровозом под биркой «МАШИНА» + вопрос рубрики. Рендерить кадр 160 (паровоз приехал).
import React from "react";
import { AbsoluteFill } from "remotion";
import { D, G } from "./brand";
import { S1 } from "./Video";

export const Thumb: React.FC = () => (
  <AbsoluteFill style={{ background: D.bg, overflow: "hidden" }}>
    <AbsoluteFill style={{ transform: "translateY(520px) scale(1.2)" }}><S1 /></AbsoluteFill>
    <AbsoluteFill style={{ background: "linear-gradient(#0d2a31 0%, rgba(13,42,49,0.9) 26%, rgba(13,42,49,0) 46%)" }} />
    <div style={{ position: "absolute", left: 70, right: 60, top: 150, fontFamily: G }}>
      <div style={{ display: "inline-block", background: D.mustard, color: D.ink, fontWeight: 800, fontSize: 36, letterSpacing: 7, padding: "14px 28px",
        transform: "rotate(-2deg)", boxShadow: "-6px 10px 0 rgba(0,0,0,0.25)" }}>А ЧТО ЕСЛИ…</div>
      <div style={{ color: D.cream, fontWeight: 800, fontSize: 100, lineHeight: 1.02, marginTop: 30, textShadow: "-6px 10px 0 rgba(0,0,0,0.25)" }}>
        ты сказал это<br /><span style={{ color: D.mustard }}>100 лет назад?</span></div>
    </div>
  </AbsoluteFill>
);
