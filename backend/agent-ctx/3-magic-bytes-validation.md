# Task 3 — CRIT-3: Add magic bytes file validation for cat photo uploads

## Summary

Added post-upload magic byte validation to prevent MIME-type spoofing on cat photo uploads. A malicious user could previously upload a non-image file with a spoofed `Content-Type` header (e.g., `image/jpeg`), which would pass the existing `fileFilter` check but store arbitrary content on disk.

## Changes Made

**File:** `src/Loai_Rafaat-CCU-S1-02-Cats/cats.routes.ts`

### 1. Updated import (line 1)
- Added `type Request`, `type Response`, `type NextFunction` to the express import.

### 2. Added `checkMagicBytes` function (lines 72–99)
- Reads the first 12 bytes of the uploaded file from disk.
- Validates against known image magic byte signatures:
  - **JPEG**: `FF D8 FF`
  - **PNG**: `89 50 4E 47` (first 4 bytes of the 8-byte PNG signature)
  - **WebP**: `RIFF` at offset 0 + `WEBP` at offset 8
- Returns `true` if the file matches any valid image format, `false` otherwise.

### 3. Added `validateImageFile` middleware (lines 104–119)
- Async Express middleware that runs **after** `upload.single('photo')` and **before** `validate()`.
- If no file was uploaded (`req.file` is undefined), calls `next()` immediately (photo is optional).
- Calls `checkMagicBytes` on the saved file path.
- If validation fails:
  - Deletes the uploaded file from disk via `fs.promises.unlink` (with `.catch(() => {})` to avoid double-error).
  - Passes a `ValidationError` to `next()` with message: *"Invalid image file. Only real JPG, PNG, or WebP images are allowed."*
- If validation passes, calls `next()`.

### 4. Inserted middleware into POST `/` route (line 127)
- `validateImageFile` placed between `upload.single('photo')` and `validate({ body: createCatSchema })`.

## Defense-in-Depth Layers (unchanged + new)

| Layer | Mechanism | Location |
|-------|-----------|----------|
| 1 | Multer `fileFilter` — rejects disallowed MIME types | `fileFilter` callback (unchanged) |
| 2 | Multer `storage.filename` — refuses unknown MIME→ext mappings | `storage.filename` callback (unchanged) |
| 3 | **NEW** `validateImageFile` — checks actual file magic bytes after save | Middleware in route chain |
| 4 | `ValidationError` cleanup — deletes invalid files from disk | Inside `validateImageFile` |

## No Package Install Needed

The `file-type` package was considered but rejected because recent versions are ESM-only and would cause import issues in a CJS TypeScript project. Instead, a manual `checkMagicBytes` function was implemented directly in the routes file using `fs.promises.open` and `Buffer` comparisons — zero new dependencies.
