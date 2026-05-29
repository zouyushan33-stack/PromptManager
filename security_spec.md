# Security Spec: Prompt Manager

## 1. Data Invariants
- A Prompt must belong to a valid `userId`.
- Users must be authenticated to create, update, or delete a prompt.
- Users can only update or delete prompts where `userId` matches their `request.auth.uid`.
- Anyone can read prompts.
- `title`, `content` are required strings with size limits.
- `tags` is required and must be an array of strings.
- `createdAt` is immutable.
- `updatedAt` must be updated on changes to match server time.

## 2. Dirty Dozen Payloads
1. Unauthorized Creation: Create prompt when not logged in.
2. Identity Spoofing: Logged in, creating a prompt with a different `userId`.
3. Unauthorized Deletion: Delete someone else's prompt.
4. Unauthorized Update: Change someone else's prompt content.
5. Immutability Breach: Try changing `createdAt` during an update.
6. Temporal Spoofer (Create): Try setting `createdAt` to a past timestamp rather than `request.time`.
7. Temporal Spoofer (Update): Try setting `updatedAt` to a future/past timestamp.
8. Invalid Structural Schema (Create): Missing `title` or `userId`.
9. Poisoned Value: `title` is a number instead of string.
10. Overflow Value: `content` is a 2MB string.
11. Ownership Spoofing Update: Updating the `userId` field (Transferring ownership without permission).
12. Tag Overload: An array of >20 tags or a tag that is not a string.

## 3. The Test Runner
A `firestore.rules.test.ts` will test these payloads.
