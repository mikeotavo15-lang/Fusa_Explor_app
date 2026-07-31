# Security Specification - FUSA EXPLORER

## Data Invariants
1. A user can only edit their own profile.
2. Only admins can create, update, or delete categories.
3. Only admins or the creator (propietarioId) of a 'lugar' can update its details.
4. Ratings must be between 1 and 5.
5. `createdAt` and `updatedAt` must be validated against `request.time`.
6. A review cannot be posted to a non-existent place.

## The Dirty Dozen Payloads

1. **Identity Theft**: User A tries to update User B's profile.
2. **Privilege Escalation**: User A (regular user) tries to set their `rol` to 'admin'.
3. **Ghost Categories**: User A tries to create a new category.
4. **Rating Poisoning**: User A tries to post a rating of 99 or -1.
5. **Unauthorized Place Creation**: Unauthenticated user tries to register a place.
6. **Shadow Field Injection**: User A tries to add a `verified: true` field to a place that isn't in the schema.
7. **Timestamp Spoofing**: User A tries to set a future `createdAt` date.
8. **Orphaned Review**: User A tries to post a review for a non-existent `lugarId`.
9. **Coordinate Poisoning**: User A tries to set `lat` or `lng` to something that isn't a number.
10. **ID Poisoning**: User A tries to use a 2MB long string as a document ID.
11. **PII Leak**: Unauthenticated user tries to read all user emails.
12. **Review Hijacking**: User A tries to edit or delete User B's review.

## The Test Runner
See `firestore.rules.test.ts` (conceptual, will be implemented if requested, otherwise focusing on the rules themselves).
