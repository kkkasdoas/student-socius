// test-uid.js
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client directly for testing
const SUPABASE_URL = 'https://qvjuxusvepjufcxdxswd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2anV4dXN2ZXBqdWZjeGR4c3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNDEyNDAsImV4cCI6MjA1ODgxNzI0MH0.l2wqRPEW3y34_e3t2lpcTN-tyYS1kXFCSrw9n9CzC08';

console.log('Initializing Supabase client...');
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
console.log('Supabase client initialized.');

// Function to test if the Supabase RPC returns auth.uid() as a UUID
async function testAuthUid() {
  console.log('Testing if auth.uid() returns a UUID...');
  
  try {
    // Check if user is signed in
    console.log('Checking if user is signed in...');
    const { data, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Authentication error:', authError.message);
      return;
    }
    
    console.log('Auth response:', data);
    
    if (!data.user) {
      console.log('No user is signed in. Please sign in before running this test.');
      
      // Let's try the RPC call anyway to see what it returns when not signed in
      console.log('Trying RPC call without being signed in...');
      const { data: rpcData, error: rpcError } = await supabase.rpc('test_uid');
      
      if (rpcError) {
        console.error('Error calling test_uid RPC function:', rpcError.message);
      } else {
        console.log('Result from test_uid RPC function when not signed in:', rpcData);
      }
      
      return;
    }
    
    console.log('Current user ID from auth:', data.user.id);
    
    // Call the RPC function
    console.log('Calling test_uid RPC function...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('test_uid');
    
    if (rpcError) {
      console.error('Error calling test_uid RPC function:', rpcError.message);
      return;
    }
    
    console.log('Result from test_uid RPC function:', rpcData);
    
    // Check if the result is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(rpcData)) {
      console.log('✅ Success: The returned value is a valid UUID');
      
      // Check if it matches the current user's ID
      if (rpcData === data.user.id) {
        console.log('✅ Success: The UUID matches the current user ID');
      } else {
        console.log('❌ Warning: The UUID does not match the current user ID');
      }
    } else {
      console.log('❌ Error: The returned value is not a valid UUID');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the test and log when it's done
console.log('Starting the test...');
testAuthUid().then(() => console.log('Test completed.')); 