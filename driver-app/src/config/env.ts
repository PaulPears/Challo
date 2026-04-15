// src/config/env.ts
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra;

if (!extra) {
  throw new Error("Missing `extra` config in app.json");
}

export const WIDGET_ID: string = extra.WIDGET_ID;
export const TOKEN_AUTH: string = extra.TOKEN_AUTH;
