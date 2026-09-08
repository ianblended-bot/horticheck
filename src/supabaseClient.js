import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://umacyvarctuwtazbnmgv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtYWN5dmFyY3R1d3RhemJubWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4OTM3OTUsImV4cCI6MjEwNDQ2OTc5NX0.tCZ2HHGH2dmx9q60zaT2cW1xdqkV4WyIopxDGDul8zY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
