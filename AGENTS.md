<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Mobile-first web app: every page renders inside `MobileShell` (phone-width column, bottom nav, `© salma` footer) so it behaves like a native Android/iOS app.
- Order prices are computed in the database function `place_order` from `menu_items`; the client only sends item ids, quantities and topping names, so prices cannot be tampered with.
- Points are awarded by the `orders` update trigger when status becomes `selesai`; never add points from client code.
- Roles live in `user_roles` and are checked with `has_role`; the admin page gates in `beforeLoad` via `isAdminQuery`.
- Menu photos uploaded by admins are compressed in the browser and stored as data URLs in `menu_items.image_url` because public storage buckets are blocked; seeded photos live in `public/images/menu/`.
- Cart lives in localStorage (`src/lib/cart.tsx`); orders, menu and profiles live in Lovable Cloud.
