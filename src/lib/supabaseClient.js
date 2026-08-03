import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config";

// null tant que le projet Supabase n'est pas configuré — le reste de l'app
// (useAuth, AuthModal...) doit tolérer ce cas pour ne jamais casser la carte.
export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
