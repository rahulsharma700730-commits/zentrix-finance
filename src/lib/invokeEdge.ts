import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Invoke an edge function and always surface the server's real error message
 * instead of the generic "Edge Function returned a non-2xx status code".
 */
export async function invokeEdge<T = Record<string, unknown>>(
  fn: string,
  body: Record<string, unknown>
): Promise<{ data: T | null; errorMessage: string | null }> {
  const { data, error } = await supabase.functions.invoke(fn, { body });

  if (!error) {
    // Server may return 200 with an { error } payload — respect that too.
    const payloadError = (data as Record<string, unknown> | null)?.error;
    return {
      data: data as T,
      errorMessage: typeof payloadError === 'string' ? payloadError : null,
    };
  }

  let msg = error.message;
  if (error instanceof FunctionsHttpError) {
    try {
      const ctx = await error.context.json();
      if (ctx && typeof ctx === 'object') {
        const e = (ctx as Record<string, unknown>).error;
        if (typeof e === 'string' && e) {
          msg = e;
        } else if (ctx && typeof ctx === 'object' && 'msg' in ctx) {
          msg = String((ctx as Record<string, unknown>).msg);
        } else {
          // Validation-style payloads like { fieldErrors: { email: [...] } }
          const flat = Object.values(ctx as Record<string, unknown>)
            .flatMap((v) => (Array.isArray(v) ? v.map(String) : typeof v === 'string' ? [v] : []))
            .filter(Boolean);
          if (flat.length) msg = flat.join(', ');
        }
      }
    } catch {
      // Non-JSON body — keep the original message.
    }
  }

  return { data: data as T, errorMessage: msg };
}
