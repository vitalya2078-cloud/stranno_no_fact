import React from "react";
import { Composition } from "remotion";
import { Concepts } from "./Concepts";
export const Root: React.FC = () => <Composition id="Concepts" component={Concepts} durationInFrames={120} fps={30} width={1080} height={1920} />;
