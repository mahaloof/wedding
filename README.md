# Wedly

A responsive, front-end prototype for an AI wedding invitation generator.

## Run it

Open `index.html` in a browser, or serve this folder with any static web server. No packages or build step are required.

## What the prototype demonstrates

- A proper creation flow: choose a template, add wedding details, then create the invitation.
- Four distinct invitation styles: Blush Nikah (Muslim), Classic Vows, Midnight Story, and Botanical Story.
- An editable demo-data shortcut, plus an “Edit details” path after generation.
- A live countdown and map links that update with the selected venue.
- Optional Google Maps URLs for each event, a four-photo story gallery, and selectable ambient music with a guest-facing play/pause control.
- Privacy-safe fictional demo names and venues throughout the default experience.
- Generated local artwork at `public/assets/couple-illustration.png` and `public/assets/botanical-story-background.png`.

## Publish public invitation links

The app now includes a **Publish & share** action. It saves the generated invitation and returns a unique URL such as `your-domain.vercel.app/invite/mira-arjun-7fd12a9b`. Guests can open that link without seeing the editor.

The project uses a Vercel serverless endpoint and Supabase for this feature. The source contains no secret keys.

Vercel is configured explicitly as a static HTML/CSS/JavaScript project in `vercel.json`. This matters because the project also has a `public/` assets folder: without the explicit root output directory, Vercel can mistakenly look for the site inside that folder instead of serving `index.html` from the repository root.

### One-time setup

1. Create a [Supabase](https://supabase.com) project and open its SQL Editor.
2. Run the SQL in `supabase/migrations/20260723_create_invitations.sql`. This creates the invitation table and the public photo bucket.
3. In the Supabase project settings, copy the project URL and the **service role** API key.
4. Import this GitHub repository into [Vercel](https://vercel.com), then add these environment variables in the Vercel project settings:

   ```text
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

5. Deploy. Vercel will serve the site and its `/api/invitations` endpoint automatically.

After that, use the app normally: generate a preview, select **Publish & share**, and copy the unique public link. Uploaded gallery photos are stored in Supabase Storage and displayed on the guest page.

## Next product steps

1. Connect an AI service that converts free-form wedding details into this safe structured invitation configuration.
2. Add RSVP collection, an owner dashboard, invitation editing, and custom domains.
3. Add email verification or accounts before allowing users to edit or remove published invitations.

# wedding
