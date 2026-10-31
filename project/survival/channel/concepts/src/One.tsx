import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { TIMUR } from "./rig";
import { Hero2, POSES } from "./rig2";
export const One: React.FC = () => { const t = useCurrentFrame() / 30;
  return <AbsoluteFill style={{ background: "#F6F2E7" }}><svg width={1080} height={1920}>
    <Hero2 look={TIMUR} pose={POSES.crouch} x={360} y={900} s={1.3} t={t} />
    <Hero2 look={TIMUR} pose={{ ...POSES.crouch, view: "q34" }} x={420} y={1800} s={1.3} t={t} /></svg></AbsoluteFill>; };
