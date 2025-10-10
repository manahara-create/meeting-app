import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ioycivgdrnalpcnguauz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlveWNpdmdkcm5hbHBjbmd1YXV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkyMTk4MSwiZXhwIjoyMDc1NDk3OTgxfQ.PTA2zoxeEs-v5pc1nrNpCTFmPn-ujvK5uGtgyyqA2Ts";

export const supabase = createClient(supabaseUrl, supabaseKey);

