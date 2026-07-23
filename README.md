# Vow Atelier

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

## Turning it into the full product

1. Save the form data in a database and give each invitation a unique public URL.
2. Send the submitted details and a chosen design/theme to an AI service that returns a structured invitation configuration (not arbitrary HTML).
3. Render that configuration with secure, reusable invitation templates such as this one.
4. Add photo uploads, RSVP collection, an admin dashboard, custom domains, and share cards.

# wedding
