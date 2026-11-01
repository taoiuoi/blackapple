# Security Specification for BLACK APPLE

## Data Invariants
1. Characters, Genres, Quotes, Creator Profile, Website Settings, and Music Tracks are public read-only for general visitors, and exclusively manageable by authenticated administrators (`anhitoo8@gmail.com` or verified admin doc).
2. Image URLs must be validated HTTPS strings, preventing arbitrary script injection, data: URIs, or unsafe protocols.
3. Confessions can be created by visitors in pending state (`approved == false`), and only approved confessions or administrators can read all confessions.
4. Comments can be created by visitors with length boundaries (<= 1000 characters). Only admins can moderate, reply, or delete comments.
5. All document IDs must conform to alphanumeric formatting via `isValidId()`.

## Evaluation & RBAC
- Admin identity verification uses `request.auth.token.email == 'anhitoo8@gmail.com'` or membership in the `/admins/` collection.
- Catch-all rule `match /{document=**} { allow read, write: if false; }` guarantees default-deny.
