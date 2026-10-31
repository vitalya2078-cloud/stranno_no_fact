import React from "react";
import { Composition } from "remotion";
import { Video, TOTAL } from "./Video";
import { Flat, FLAT_TOTAL } from "./Flat";
export const Root: React.FC = () => (<>
  <Composition id="Video" component={Video} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
  <Composition id="Flat" component={Flat} durationInFrames={FLAT_TOTAL} fps={30} width={1080} height={1920} />
</>);
