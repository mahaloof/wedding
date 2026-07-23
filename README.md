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
2. Run all SQL files in `supabase/migrations/` in date order. This creates invitation, account ownership, storage, and payment-record tables.
3. In the Supabase project settings, copy the project URL, the **service role** API key, and the **anon** API key.
4. Import this GitHub repository into [Vercel](https://vercel.com), then add these environment variables in the Vercel project settings:

   ```text
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_ANON_KEY=your-anon-key
   ADMIN_EMAIL=your-admin-email@example.com
   RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=your-razorpay-key-secret
   ```

5. Deploy. Vercel will serve the site and its `/api/invitations` endpoint automatically.

After that, use the app normally: generate a preview, select **Publish & share**, and copy the unique public link. Uploaded gallery photos are stored in Supabase Storage and displayed on the guest page.

### Accounts and administrator access

- The Wedly creator is protected by email-and-password login. Public `/invite/...` links stay open for guests.
- Enable **Email** authentication in Supabase. Email confirmation is recommended; add your Vercel domain to Supabase Authentication → URL Configuration so confirmation links return to Wedly.
- The account whose email matches `ADMIN_EMAIL` sees the administrator overview of published invitations after signing in. Create that account through Wedly (or Supabase Auth) using exactly that email address.
- Each published invitation is linked to the signed-in creator. Music uploads are limited to 3 MB and are public so guests can play them.

### ₹10 early-user publishing payment

- Normal users must complete a one-time ₹10 Razorpay payment before Wedly creates a public invitation link. ₹10 is Razorpay's current minimum supported order amount.
- The browser opens Razorpay Checkout with an order created by the server. The server verifies the returned Razorpay signature, confirms the order is paid for exactly ₹10, records the payment, and only then publishes the invitation.
- A cancelled or failed payment leaves the generated invitation as an unpublished draft in the current editor. The configured administrator bypasses payment.
- Start with Razorpay **Test Mode** keys, test the complete checkout, then replace them with Live Mode keys when you are ready to accept real payments. Never expose the key secret in browser code.

## Next product steps

1. Connect an AI service that converts free-form wedding details into this safe structured invitation configuration.
2. Add RSVP collection, an owner dashboard, invitation editing, and custom domains.
3. Add email verification or accounts before allowing users to edit or remove published invitations.

# wedding
