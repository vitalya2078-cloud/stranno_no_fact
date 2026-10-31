import React from "react";
import { Composition } from "remotion";
import { Video, TOTAL } from "./Video";
import { Thumb } from "./Thumb";
import { SoftStreet } from "./SoftLab";
export const Root: React.FC = () => (<>
  <Composition id="Video" component={Video} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
  <Composition id="Thumb" component={Thumb} durationInFrames={200} fps={30} width={1080} height={1920} />
  <Composition id="SoftStreet" component={SoftStreet} durationInFrames={150} fps={30} width={1080} height={1920} />
</>);
