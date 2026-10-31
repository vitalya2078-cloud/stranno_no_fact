import React from "react";
import { Composition } from "remotion";
import { Avatar, Cover, LiveCover } from "./Vk";
import { AvatarDoor, CoverDoor } from "./Door";
import { AvatarQ, CoverStickers } from "./Sticker";
export const Root: React.FC = () => (<>
  <Composition id="Avatar" component={Avatar} durationInFrames={1} fps={30} width={1500} height={1500} />
  <Composition id="Cover" component={Cover} durationInFrames={1} fps={30} width={1920} height={768} />
  <Composition id="LiveCover" component={LiveCover} durationInFrames={300} fps={30} width={1080} height={1920} />
  <Composition id="AvatarDoor" component={AvatarDoor} durationInFrames={1} fps={30} width={1500} height={1500} />
  <Composition id="CoverDoor" component={CoverDoor} durationInFrames={1} fps={30} width={1920} height={768} />
  <Composition id="AvatarQ" component={AvatarQ} durationInFrames={1} fps={30} width={1500} height={1500} />
  <Composition id="CoverStickers" component={CoverStickers} durationInFrames={1} fps={30} width={1920} height={768} />
</>);
