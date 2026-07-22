import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Lazy: reads env only when called at request time, so `next build`
// succeeds without any Supabase env vars set.
export async function createClient() {
  // cookies() first: during `next build` it marks the route dynamic and
  // bails out of prerendering before the env check can throw.
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — session refresh is handled
          // by the proxy, so setting cookies here can be safely ignored.
        }
      },
    },
  });
}
