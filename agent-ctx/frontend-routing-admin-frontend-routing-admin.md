# Task ID: frontend-routing-admin
# Agent: frontend-routing-admin

## Work Summary

Implemented Next.js file-based routing and admin panel for the CatCare UTM project.

### What was already in place (verified)
The project had already been partially migrated from Zustand-based navigation to Next.js App Router:
- Root `page.tsx` already redirects to `/dashboard`
- Auth layout and pages (`/login`, `/register`) already existed
- Main layout with sidebar+header already used `useRouter` from `next/navigation`
- All page files under `(main)/` (dashboard, cats, emergencies, donations, profile) already existed
- All components (cat-card, cat-list, cat-detail, emergency-card, etc.) already used `useRouter` and `router.push()`
- Zustand store already had navigation state removed (`currentView`, etc. were gone)

### Changes Made

1. **`src/lib/types.ts`** - Removed `AppView` type and `viewToRoute()` function. These were marked "for backward compatibility" but are no longer needed since the sidebar now uses plain route strings.

2. **`src/components/layout/sidebar.tsx`** - Major updates:
   - Removed `AppView` type import and `viewToRoute` import from types
   - Changed `NavItem.id` from `AppView` to `string`
   - Reorganized nav items: moved emergencies and donations to "Main" section
   - Added "Campus Map" (`/map`) and "Volunteers" (`/volunteers`) nav items with `Map` and `HandHeart` icons
   - Changed admin section from "Reports" to "Admin"
   - Updated `sections` array from `['Main', 'Reports', 'Actions', 'Account']` to `['Main', 'Actions', 'Admin', 'Account']`
   - Updated `isActive()` to include `/map` and `/volunteers` route matching

3. **`src/app/(main)/admin/layout.tsx`** - Created new admin layout:
   - Redirects non-admin users to `/dashboard`
   - Shows "Admin Panel" heading with description
   - Wraps all admin child pages

4. **`src/app/(main)/map/page.tsx`** - Created map placeholder page

5. **`src/app/(main)/volunteers/page.tsx`** - Created volunteers placeholder page

6. **`src/app/(main)/admin/page.tsx`** - Rewrote admin dashboard:
   - Was just a redirect to `/admin/users`
   - Now shows quick-link cards to all admin sub-pages (Users, Donations, Emergencies, Cats)
   - Fetches live stats from API for each section
   - Cards are clickable and navigate to the respective admin pages

7. **`src/components/layout/header.tsx`** - Updated `getPageTitle()` and `getPageDescription()`:
   - Added `/map`, `/volunteers`, and `/admin` route mappings

### Verification
- TypeScript compilation passes with zero errors (`npx tsc --noEmit`)
- No references to `AppView` or `viewToRoute` remain in the codebase (except the comment in types.ts)
- Existing lint errors are all pre-existing `set-state-in-effect` warnings (not introduced by this task)
