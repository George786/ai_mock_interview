"use client";

import Vapi from "@vapi-ai/web";

declare global {
  // eslint-disable-next-line no-var
  var __vapiClient__: Vapi | undefined;
}

const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!;

const vapiClient = globalThis.__vapiClient__ ?? new Vapi(token);
globalThis.__vapiClient__ = vapiClient;

export const vapi = vapiClient;