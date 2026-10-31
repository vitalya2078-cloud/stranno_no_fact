import React from "react";
import { Composition } from "remotion";
import { Avatar, Cover, LiveCover } from "./Vk";
export const Root: React.FC = () => (<>
  <Composition id="Avatar" component={Avatar} durationInFrames={1} fps={30} width={1500} height={1500} />
  <Composition id="Cover" component={Cover} durationInFrames={1} fps={30} width={1920} height={768} />
  <Composition id="LiveCover" component={LiveCover} durationInFrames={300} fps={30} width={1080} height={1920} />
</>);
