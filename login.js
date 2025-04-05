// login.js
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Initialize Supabase client
const SUPABASE_URL = 'https://qvjuxusvepjufcxdxswd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2anV4dXN2ZXBqdWZjeGR4c3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNDEyNDAsImV4cCI6MjA1ODgxNzI0MH0.l2wqRPEW3y34_e3t2lpcTN-tyYS1kXFCSrw9n9CzC08';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for user input
function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Login function
async function login() {
  try {
    // Check if already logged in
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    
    if (user) {
      console.log('Already logged in as:', user.email);
      rl.close();
      return;
    }
    
    // Get email and password from user
    const email = await promptUser('Email: ');
    const password = await promptUser('Password: ');
    
    console.log('Logging in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Login error:', error.message);
    } else {
      console.log('Login successful!');
      console.log('User:', data.user);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  } finally {
    rl.close();
  }
}

// Run the login function
login(); 