import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zlfvrqridezqbqdxzzji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZnZycXJpZGV6cWJxZHh6emppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTg3OTAsImV4cCI6MjA5NTg5NDc5MH0.Mcqn-kfOK7XY8biWm9oncc9Oqr1oQOJQb6Fnc8MmZW8';

export const supabase = createClient(supabaseUrl, supabaseKey);
