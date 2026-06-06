// Dummy env so modules that build clients at import time don't throw during tests.
process.env.SUPABASE_URL ||= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-key";
process.env.SUPABASE_ANON_KEY ||= "test-anon-key";
process.env.GEMINI_API_KEY ||= "test-gemini-key";
