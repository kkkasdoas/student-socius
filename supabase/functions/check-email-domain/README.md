# Email Domain Verification Edge Function

This Supabase Edge Function verifies if an email's domain is in the `verified_domains` table.

## Overview

The function accepts a POST request with an email address in the request body, extracts the domain, and checks if it exists in the `verified_domains` table in Supabase.

## Deployment

To deploy this function:

1. Make sure you have the Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Navigate to the project root directory

4. Deploy the function:
   ```bash
   supabase functions deploy check-email-domain --project-ref qvjuxusvepjufcxdxswd
   ```

## Database Setup

Make sure you have a `verified_domains` table in your Supabase database with the following structure:

```sql
CREATE TABLE public.verified_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add some example domains
INSERT INTO public.verified_domains (domain, is_active) 
VALUES 
('student.tdtu.edu.vn', true),
('university.edu', true);

-- Add RLS policies
ALTER TABLE public.verified_domains ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" 
ON public.verified_domains 
FOR SELECT 
USING (is_active = true);
```

## Usage Example

```javascript
const checkEmailDomain = async (email) => {
  try {
    const response = await fetch('https://qvjuxusvepjufcxdxswd.supabase.co/functions/v1/check-email-domain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking domain:', error);
    return { isVerified: false, message: 'Error checking domain' };
  }
};
```

## Response Format

The function returns a JSON response with the following structure:

```json
{
  "isVerified": boolean,
  "message": string
}
```

Where:
- `isVerified` is `true` if the domain exists in the `verified_domains` table, otherwise `false`
- `message` is a descriptive message about the verification result 