# ACBL Unit 112 website

A fast, large-print website for ACBL Unit 112 with a built-in webmaster panel.
Everything on the site (text, tournaments, clubs, board, documents, photos, colors, logo,
menu order, home page layout) is edited from the browser at **/#admin**. No coding needed.

## Features at a glance

* Large print, A/A/A text-size buttons, high-contrast switch, big menu buttons
* **Urgent notice** bar across every page (cancellations, snow days), with an automatic end date
* **Where can I play today?** on the home page, and a day-of-the-week filter on the Clubs page
* **Tournament pages**: schedule of events, venue with directions, hotels, food, parking, partnerships, daily bulletins
* **Automatic ACBL links** for sectional flyers/results and club results
* **Learn to Play** page (teachers, classes, learn-at-home links) and a **Photos** gallery
* **Site search**, news that expires on its own, board documents, player recognition
* **Editor accounts**: club managers edit only their club; tournament chairs only their tournaments
* **Website suggestions** form on the Contact page, emailed to an address the webmaster sets (starts as noahbellbridge@gmail.com)
* **More typefaces**: 18 text and heading fonts chosen for readability, with a live sample in the admin panel
* **Email reminders**: public sign-up box, subscriber list, one-click reminder built from a tournament

## What's in this folder

| Path | What it is |
|---|---|
| `public/index.html` | The whole website: pages, styles and admin panel in one file. |
| `functions/api/*.js` | The small "backend": login, save, uploads, backups, passwords, editor accounts, email sign-ups and sending. |
| `functions/files/[[path]].js` | Serves uploaded logos and documents. |
| `lib/auth.js` | Password and login-token helpers used by the functions. |
| `src/` + `build.py` | Editable source. Run `python3 build.py` to rebuild `public/index.html`. |

The site works in two modes:

* **Live mode**: when `/api/site` exists (Cloudflare Pages below), saves go to the server and everyone sees them.
* **Demo mode**: open `public/index.html` anywhere else and it still works; saves stay in that browser only.
  Demo logins: `webmaster` / `unit112`, plus example helpers `ithaca` / `club112` and `rochester` / `chair112`. Email sending is off in demo mode.

## How automatic results work

* **Sectionals**: type the 7-digit ACBL sanction number (it's on every ACBL flyer, e.g. `2610314`).
  The site builds both links itself:
  * flyer: `https://web2.acbl.org/Tournaments/Ads/20YY/MM/<sanction>.pdf`
  * results: `https://live.acbl.org/events/<sanction>`
  Before the tournament it shows the flyer; from the first day it shows **Live results**; afterwards the event
  moves to **Past results** automatically. Either link can be overridden per tournament.
* **Clubs**: type the ACBL club number and the Live for Clubs and Common Game links are built automatically.

## Putting it online (Cloudflare Pages, free)

About 30 minutes, once. Use a **unit-owned email** (e.g. a Gmail created for the unit webmaster)
for every account, so the site never depends on one person's personal login.

1. **Unzip** `unit112-site.zip` on your computer. You'll get a folder named `unit112-site`.
2. **GitHub**: create a free account at github.com with the unit email. Click **+ → New repository**, name it
   `acbl-unit112`, choose **Private**, tick **Add a README file**, and click **Create repository**.
   Then **Add file → Upload files**, open the `unit112-site` folder, select *everything inside it*
   (`public`, `functions`, `lib`, `src`, `tools`, `build.py`, `README.md`, `.gitignore`) and drag it onto the page.
   Click **Commit changes**. The repository should now show `public` and `functions` at the top level.
3. **Cloudflare**: create a free account at dash.cloudflare.com with the unit email.
4. **Storage**: *Storage & Databases → KV → Create*, name it `unit112-site`.
5. **Site**: *Workers & Pages → Create application → Pages → Connect to Git*. Sign in to GitHub, pick
   `acbl-unit112`, then **Install & Authorize → Begin setup**.
   * Project name: `acbl-unit112` (this becomes the free address `acbl-unit112.pages.dev`)
   * Production branch: `main` · Framework preset: **None** · Build command: *(leave empty)* · Build output directory: `public`
   * Click **Save and Deploy**.
6. In the new project go to **Settings**:
   * **Bindings → Add → KV namespace**: variable name `SITE_KV`, namespace `unit112-site`.
   * **Variables and Secrets → Add** (type *Secret*):
     * `ADMIN_PASSWORD`: the first webmaster password
     * `SESSION_SECRET`: any long random text (40+ characters). Never share it.
   * **Deployments → … → Retry deployment** so the settings take effect.
7. **First login**: open `https://acbl-unit112.pages.dev/#admin`, log in as **webmaster**, press **Save changes** once,
   then set your own password under **Backup, password & handoff**.
8. **Domain** (about $10–12 a year): *Domain Registration → Register Domains*, search for a name
   (for example `acblunit112.org`), and buy it. Then in the Pages project: **Custom domains → Set up a domain**,
   enter it, and **Continue → Activate domain**. Add `www.` the same way so both spellings work.
   It usually works within a few minutes, and the security certificate (the padlock) is set up automatically.
9. **Email reminders and suggestion emails** (optional, needs the domain from step 8):
   * Create a free account at resend.com with the unit email, add your domain under *Domains*, and add the DNS records it shows
     (in Cloudflare: *your domain → DNS → Add record*). Wait for "Verified".
   * Create an API key in Resend (*API Keys → Create*, permission "Sending access").
   * In the Pages project add two more secrets: `RESEND_API_KEY` (the key) and `MAIL_FROM`, e.g. `ACBL Unit 112 <reminders@acblunit112.org>`. Redeploy.
   * In the admin panel, **Email reminders → Send test** to yourself first.
   * Resend's free plan sends 100 emails a day and 3,000 a month. With more than 100 subscribers the rest wait for
     **Continue sending** the next day, or upgrade to Resend Pro (about $20 a month) for one-click sends to everyone.
   * Every email has an unsubscribe link, and removals happen automatically.
10. **Visitor numbers** (optional): turn on Cloudflare Web Analytics for the Pages project (in the Cloudflare dashboard, search "Web Analytics" and add the site). Free, no cookies, no personal tracking.

11. **Tell people**: on the old BridgeWebs page, replace the content with a short notice and a link to the new address.
   Add the address to club emails, daily bulletins and tournament flyers.

Free-plan limits (1,000 saves a day, 100,000 page loads a day, 1 GB of files) are far more than a unit site uses.

## Site icon and link previews

* The browser-tab icon is a "112" badge in the site's main color. To use your own, upload a square image under
  **Look & logo → Site icon**. It then also appears in bookmarks and on phone home screens.
* When someone shares the site's address by email, text or Facebook, a preview card appears using `public/og-image.png`.
  The page and image addresses fill themselves in from whatever domain the site runs on.
* To redraw the default icons or preview image (for example after a color change): `python3 tools/make_icons.py`.

## Website suggestions

Visitors fill in the form at the bottom of the Contact page. Every suggestion is saved in the admin panel under
**Website suggestions** (kept for a year), and, once Resend is connected (step 9), emailed to the address set there.
The address starts as `noahbellbridge@gmail.com`; the webmaster can change it on that tab at any time. It is stored
privately on the server, never in the public page, so spammers can't collect it. Replies go straight to the visitor
if they left an email address.

## Editor accounts

Log in as webmaster → **Editor accounts → Add an account**. Choose what they can edit:

| Kind | Can change |
|---|---|
| Editor | All site content (not accounts) |
| Club manager | Only the club(s) you tick: game days/times, address, contact |
| Tournament chair | Only the tournament(s) you tick: schedule, hotels, bulletins, links |

The server enforces these limits on every save, not just the screen. Deleting an account takes effect immediately.

## Handing the site to someone else

1. In the admin panel: **Backup, password & handoff → Download backup file**, and give it to them.
2. Change the webmaster password there and send them the new one.
3. For full control of hosting: Cloudflare *Manage account → Members → Invite* (role: Super Administrator), and
   GitHub *Settings → Collaborators* (or *Transfer ownership*). If the accounts use a unit email, just hand over that email's login instead.

The server keeps every saved version for 90 days (**Show saved versions** in the admin panel), so mistakes can be undone.

## Changing the design beyond the admin panel

Colors, fonts, logo, text size, menu names and order, home-page blocks and new pages are all in the admin panel.
For deeper changes, edit `src/styles.css`, `src/app.js` (public pages) or `src/admin.js` (admin panel),
run `python3 build.py`, and upload the new `public/index.html` to GitHub. Cloudflare redeploys automatically.

## Testing locally (optional, for technical helpers)

```
printf 'ADMIN_PASSWORD=test-password-1\nSESSION_SECRET=dev-secret\n' > .dev.vars
# optional, to test email against a mock server instead of Resend: add RESEND_API_KEY, MAIL_FROM and RESEND_URL=http://localhost:PORT
npx wrangler pages dev public --kv SITE_KV
```
