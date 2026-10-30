import { Config } from "@remotion/cli/config";
Config.setChromiumOpenGlRenderer("swiftshader");   // в облачной среде нет GPU — программный WebGL
