"use client";

declare global {
  // eslint-disable-next-line no-var
  var __vapiClient__: any | undefined;
  // eslint-disable-next-line no-var
  var __vapiLoading__: Promise<any> | undefined;
}

export function getVapi(): any {
  return globalThis.__vapiClient__;
}

export async function getVapiAsync(): Promise<any> {
  if (globalThis.__vapiClient__) return globalThis.__vapiClient__;
  if (globalThis.__vapiLoading__) return globalThis.__vapiLoading__;

  globalThis.__vapiLoading__ = (async () => {
    const mod = await import("@vapi-ai/web");
    const Vapi = mod.default as any;
    const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!;
    const client = new Vapi(token);
    globalThis.__vapiClient__ = client;
    return client;
  })();

  return globalThis.__vapiLoading__;
}