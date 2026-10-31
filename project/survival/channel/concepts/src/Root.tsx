import React from "react";
import { Composition } from "remotion";
import { Concepts } from "./Concepts";
import { One } from "./One";
import { Compare, Sheet2Dog, Sheet2Lev, Sheet2Sanya, Sheet2Timur } from "./Sheets2";
import { FrameDay, FrameNight, KaraokeTest, SheetDog, SheetLev, SheetSanya, SheetTimur, WalkTest } from "./Sheets";
const C = (id: string, c: React.FC, d = 60) => <Composition key={id} id={id} component={c} durationInFrames={d} fps={30} width={1080} height={1920} />;
export const Root: React.FC = () => (<>
  {C("Concepts", Concepts, 120)}
  {C("SheetTimur", SheetTimur)}{C("SheetLev", SheetLev)}{C("SheetSanya", SheetSanya)}{C("SheetDog", SheetDog)}
  {C("WalkTest", WalkTest, 150)}{C("FrameDay", FrameDay)}{C("FrameNight", FrameNight)}{C("KaraokeTest", KaraokeTest, 150)}
  {C("Compare", Compare)}{C("Sheet2Timur", Sheet2Timur)}{C("Sheet2Lev", Sheet2Lev)}{C("Sheet2Sanya", Sheet2Sanya)}{C("Sheet2Dog", Sheet2Dog)}
  {C("One", One)}
</>);
