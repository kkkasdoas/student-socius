# Cendy - The College Connection App

Connect with verified college students in a safe and private environment

## Project info

**URL**: https://lovable.dev/projects/9322316a-6f73-46f7-a20c-b266c8683d75

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/9322316a-6f73-46f7-a20c-b266c8683d75) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9322316a-6f73-46f7-a20c-b266c8683d75) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

## Production Setup Guide

This guide will help you set up and deploy the Cendy app to production.

### Prerequisites

- Node.js 18+ installed
- npm 9+ installed

### Environment Variables

Create the following environment files:

- `.env.development` - For development
- `.env.production` - For production

Both should contain:

```
VITE_SUPABASE_URL="your_supabase_url"
VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"
VITE_ALLOWED_EMAIL_DOMAINS="student.tdtu.edu.vn"
```

### Production Build

To build for production:

```bash
npm run build:prod
```

This will create optimized files in the `dist` directory.

### Deployment

#### Hosting Options

1. **Vercel**
   
   Deploy with Vercel for the easiest setup:
   
   ```bash
   vercel --prod
   ```

2. **Netlify**
   
   Create a `netlify.toml` file:
   
   ```toml
   [build]
     command = "npm run build:prod"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

3. **Traditional Hosting**
   
   Simply upload the contents of the `dist` directory to your web server.

### Post-Deployment Checks

After deploying to production, verify:

1. Authentication works with different providers (Google, Microsoft, Apple)
2. Email domain verification works as expected
3. All pages load correctly
4. API calls to Supabase are functioning properly
5. Responsive design works on all device sizes

## Development Setup

To set up for local development:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Features

- Authentication with multiple providers
- Student email verification
- User profiles
- Posting and content sharing
- Messaging system with both private and group conversations
- Mobile-responsive design

## Technology Stack

- React 18+
- TypeScript
- Vite
- Supabase for backend & authentication
- TailwindCSS + shadcn/ui for styling
- React Router for routing
- React Query for data fetching
