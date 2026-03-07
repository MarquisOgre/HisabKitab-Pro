# Welcome to your HisabKitab-Pro project

## Project info

**URL**: https://github.com/MarquisOgre/HisabKitab-Pro

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.  
Pushed changes will also be reflected in the GitHub repository.

Simply clone the repo https://github.com/MarquisOgre/HisabKitab-Pro and start editing.

Changes made can be committed to this HisabKitab-Pro repo.

The only requirement is having Node.js & npm installed –  
[install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone https://github.com/MarquisOgre/HisabKitab-Pro

# Step 2: Navigate to the project directory.
cd HisabKitab-Pro

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

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project to Vercel?

This project can be deployed and hosted on **Vercel**.

First, ensure that your latest code is pushed to GitHub:

```sh
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

Then follow these steps:

- Open https://vercel.com
- Sign in using your GitHub account
- Click on **New Project**
- Select the **HisabKitab-Pro** repository
- Allow Vercel to import the project

Vercel will automatically detect the project as a **Vite + React** application.

Verify the build settings before deploying:

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

Click **Deploy** to start the deployment.

The first deployment usually takes **1–2 minutes**.  
Once completed, Vercel will provide a **live production URL**.

## Can I connect a custom domain to Vercel?

Yes, you can connect a custom domain to your Vercel project.

- Go to the Vercel Dashboard
- Open your project
- Navigate to **Settings → Domains**
- Add your custom domain and follow the DNS instructions

Vercel automatically enables SSL for all connected domains.
