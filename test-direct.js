// test-direct.js
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const SUPABASE_URL = 'https://qvjuxusvepjufcxdxswd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2anV4dXN2ZXBqdWZjeGR4c3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNDEyNDAsImV4cCI6MjA1ODgxNzI0MH0.l2wqRPEW3y34_e3t2lpcTN-tyYS1kXFCSrw9n9CzC08';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testRPC() {
  try {
    console.log('Testing test_uid RPC function...');
    
    // Try to call the RPC function directly
    const { data, error } = await supabase.rpc('test_uid');
    
    if (error) {
      console.error('Error calling test_uid RPC function:', error.message);
    } else {
      console.log('Result from test_uid RPC function:', data);
      
      // Check if the result is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (data && uuidRegex.test(data)) {
        console.log('✅ Success: The returned value is a valid UUID');
      } else if (data === null) {
        console.log('👉 The function returned null, which is expected if you are not signed in');
      } else {
        console.log('❌ Error: The returned value is not a valid UUID');
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testRPC(); 