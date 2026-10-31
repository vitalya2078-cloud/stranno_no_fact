import React from "react";
import { Composition } from "remotion";
import { Concepts } from "./Concepts";
import { FrameDay, FrameNight, KaraokeTest, SheetDog, SheetLev, SheetSanya, SheetTimur, WalkTest } from "./Sheets";
const C = (id: string, c: React.FC, d = 60) => <Composition key={id} id={id} component={c} durationInFrames={d} fps={30} width={1080} height={1920} />;
export const Root: React.FC = () => (<>
  {C("Concepts", Concepts, 120)}
  {C("SheetTimur", SheetTimur)}{C("SheetLev", SheetLev)}{C("SheetSanya", SheetSanya)}{C("SheetDog", SheetDog)}
  {C("WalkTest", WalkTest, 150)}{C("FrameDay", FrameDay)}{C("FrameNight", FrameNight)}{C("KaraokeTest", KaraokeTest, 150)}
</>);
