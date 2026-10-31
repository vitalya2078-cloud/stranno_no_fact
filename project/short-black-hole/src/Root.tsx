import React from "react";
import { Composition } from "remotion";
import { Video, TOTAL } from "./Video";
import { Flat, FLAT_TOTAL } from "./Flat";
import { StyleA, StyleB, StyleC } from "./StyleLab";
export const Root: React.FC = () => (<>
  <Composition id="Video" component={Video} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
  <Composition id="Flat" component={Flat} durationInFrames={FLAT_TOTAL} fps={30} width={1080} height={1920} />
  <Composition id="StyleA" component={StyleA} durationInFrames={150} fps={30} width={1080} height={1920} />
  <Composition id="StyleB" component={StyleB} durationInFrames={150} fps={30} width={1080} height={1920} />
  <Composition id="StyleC" component={StyleC} durationInFrames={150} fps={30} width={1080} height={1920} />
</>);
