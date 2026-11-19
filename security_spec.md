# Security Specification for BLACK APPLE

## Data Invariants
1. Characters, Genres, Quotes, Creator Profile, Website Settings, and Music Tracks are public read-only for general visitors, and exclusively manageable by authenticated administrators (`anhitoo8@gmail.com` or verified admin doc).
2. Image URLs must be validated HTTPS strings, preventing arbitrary script injection, data: URIs, or unsafe protocols.
3. Confessions are publicly readable and can be submitted anonymously by visitors with auto-publish (`approved == true`), strict field allowlist, and bounded sizes (`sender <= 100`, `content <= 2000`, `characterTarget <= 100`). Visitors cannot forge `reply` or `repliedAt` fields during creation. Only verified administrators can reply to, update, or delete confessions.
4. Comments can be created by visitors with length boundaries (<= 1000 characters). Only admins can moderate, reply, or delete comments.
5. All document IDs must conform to alphanumeric/dash/underscore formatting via `isValidId()`.

## Evaluation & RBAC
- Admin identity verification enforces `request.auth.token.email_verified == true && request.auth.token.email.lower() == 'anhitoo8@gmail.com'` or membership in `/admins/{uid}`.
- Catch-all rule `match /{document=**} { allow read, write: if false; }` guarantees default-deny.
- Red Team checks verified: shadow fields rejected by `hasOnly`, reply forgery blocked (`reply == ''`), oversized payloads rejected via `.size()`, email spoofing blocked via `email_verified == true`.
