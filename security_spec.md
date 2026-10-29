# Security Spec for PaySocial Firestore Rules

## 1. Data Invariants
- **Identity Invariant**: Users can only create or update their own user profile document where `userId == request.auth.uid`.
- **Transaction Invariant**: A transaction must be created by the authenticated sender (`senderId == request.auth.uid`).
- **Receiver Invariant**: Sender and receiver cannot be the same user ID (`senderId != receiverId`).
- **Visibility Enforced**: Transactions marked 'private' can only be read by the sender or receiver. Transactions marked 'public' or 'friends' can be read by authenticated users.
- **Reaction Guard**: Users can only update `likes` on transactions, or sender/receiver can update status or receipt ID.
- **Payment Request Invariant**: Only the requester (`requesterId == request.auth.uid`) can create a request. Only the payer can update status to 'paid' or 'declined'.
- **Temporal Invariant**: Creation timestamps must match `request.time`.

## 2. The Dirty Dozen Payloads (Rejection Matrix)
1. **Ghost Field User Update**: Attempt to inject `isAdmin: true` into `/users/{uid}`.
2. **Impersonated User Creation**: Attempt to create `/users/{victimUid}` with `request.auth.uid = attackerUid`.
3. **Sender Spoofing**: Attempt to create `/transactions/{txId}` with `senderId: victimUid`.
4. **Self-Transfer Abuse**: Attempt to create transaction with `senderId == receiverId`.
5. **Private Snoop**: Attempt to read private transaction of other users.
6. **Negative Amount Hack**: Attempt to send a negative amount `-500` to siphon funds.
7. **Excessive String Payload**: Attempt to write 2MB string in note (Denial of Wallet).
8. **Malicious ID Injection**: Document ID containing invalid characters `/transactions/../../../evil`.
9. **Tampered CreatedAt**: Providing client timestamp `2020-01-01` instead of `request.time`.
10. **Unauthorized Request Fulfillment**: Non-payer attempting to mark payment request as 'paid'.
11. **Blanket Query Scraping**: Attempting to query all private transactions without constraint.
12. **Unverified Email Bypass**: Write attempted by user with `email_verified == false`.
