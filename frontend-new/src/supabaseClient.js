import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lqwtdijzuqxhasyziapw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxd3RkaWp6dXF4aGFzeXppYXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTM2NzksImV4cCI6MjA4NTE4OTY3OX0.3e-W5egFx3M78z8ntpJDpMraGFjaRbNilVzbbzqZD8w'

export const supabase = createClient(supabaseUrl, supabaseKey)