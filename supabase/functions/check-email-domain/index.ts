import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface RequestBody {
  email: string;
}

interface ResponseBody {
  isVerified: boolean;
  message: string;
}

// CORS headers to use for all responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, {
      headers: CORS_HEADERS,
      status: 204,
    })
  }

  // Check if the request method is valid
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ 
        isVerified: false, 
        message: 'Method not allowed' 
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        },
        status: 405,
      }
    )
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse the request body
    let email = ''
    try {
      const body = await req.json() as RequestBody
      email = body.email
    } catch (error) {
      console.error('Error parsing request body:', error)
      return new Response(
        JSON.stringify({ 
          isVerified: false, 
          message: 'Invalid request body' 
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
          status: 400,
        }
      )
    }

    if (!email) {
      return new Response(
        JSON.stringify({ 
          isVerified: false, 
          message: 'Email is required' 
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
          status: 400,
        }
      )
    }

    // Extract domain from email
    const domain = email.split('@')[1]?.toLowerCase()

    if (!domain) {
      return new Response(
        JSON.stringify({ 
          isVerified: false, 
          message: 'Invalid email format' 
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
          status: 400,
        }
      )
    }

    // Query the verified_domains table
    const { data, error } = await supabaseClient
      .from('verified_domains')
      .select('*')
      .eq('domain', domain)
      .limit(1)

    if (error) {
      console.error('Error checking domain:', error)
      return new Response(
        JSON.stringify({ 
          isVerified: false, 
          message: 'Error checking domain verification' 
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
          status: 500,
        }
      )
    }

    // Check if the domain exists in the verified_domains table
    const isVerified = data && data.length > 0

    // Prepare response
    const responseBody: ResponseBody = {
      isVerified,
      message: isVerified ? 'Email domain is verified' : 'Email domain is not verified',
    }

    // Return the response
    return new Response(
      JSON.stringify(responseBody),
      {
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ 
        isVerified: false, 
        message: 'Internal server error' 
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        },
        status: 500,
      }
    )
  }
}) 