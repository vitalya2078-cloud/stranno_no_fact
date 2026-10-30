import React from "react";
import { Composition } from "remotion";
import { Video, TOTAL } from "./Video";
import { BipSheet } from "./BipSheet";
import { InkySheet } from "./InkySheet";
import { E01, E01_TOTAL } from "./E01";
export const Root: React.FC = () => (<>
  <Composition id="Video" component={Video} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
  <Composition id="BipSheet" component={BipSheet} durationInFrames={2} fps={30} width={1080} height={1920} />
  <Composition id="InkySheet" component={InkySheet} durationInFrames={1} fps={30} width={1080} height={1920} />
  <Composition id="E01" component={E01} durationInFrames={E01_TOTAL} fps={30} width={1080} height={1920} />
</>)
