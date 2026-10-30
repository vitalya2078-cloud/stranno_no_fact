import React from "react";
import { Composition } from "remotion";
import { Video, TOTAL } from "./Video";
import { BipSheet } from "./BipSheet";
export const Root: React.FC = () => (<>
  <Composition id="Video" component={Video} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
  <Composition id="BipSheet" component={BipSheet} durationInFrames={2} fps={30} width={1080} height={1920} />
</>)
