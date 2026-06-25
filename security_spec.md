# Firebase Security Specification (UETronForge AI)

This document outlines the security architecture, invariants, threat model, and validation logic for our Firestore Database.

## 1. Data Invariants

### Portfolio Collection (`portfolio/data`)
- **Public Read Access**: Any user (authenticated or unauthenticated) can read the portfolio configuration.
- **Admin Write Access**: Only the verified admin account (`uetronforge.ai@gmail.com`) can write (create or update) the portfolio document.
- **Strict Fields Check**: The update payload must contain all necessary sections (`settings`, `team`, `projects`, `research`) and prevent injection of "Ghost Fields" (e.g., `isVerified`).

### Messages Collection (`messages/{messageId}`)
- **Public Create Access**: Any user can submit contact inquiry messages, but with size-constrained fields to prevent wallet-exhaustion attacks.
- **No Public Read**: General users or unauthenticated actors are strictly forbidden from reading, listing, updating, or deleting messages.
- **Admin Read/Write Access**: Only the verified admin account (`uetronforge.ai@gmail.com`) can read, list, update (mark as read), or delete messages.
- **Temporal Integrity**: Messages cannot have client-falsified timestamps; `createdAt` is validated when possible, or limited in size and string format.

---

## 2. The "Dirty Dozen" Payloads

The following payloads represent unauthorized or corrupted data inputs that our security rules are mathematically guaranteed to reject:

1. **Spoofed Admin Write (Portfolio)**: An unauthenticated attacker attempts to overwrite portfolio data.
2. **Standard User Write (Portfolio)**: A standard logged-in user who is not `uetronforge.ai@gmail.com` attempts to modify portfolio content.
3. **Ghost Field Injection (Portfolio)**: Admin update contains an unauthorized attribute `isFeaturedPremium: true` to bypass payment state.
4. **ID Poisoning (Messages)**: A submission where `messageId` contains 1MB of binary junk characters to inflate storage costs.
5. **Denial of Wallet String-Flooding (Messages)**: Message payload with a 10MB `message` body.
6. **PiI Harvesting (Messages)**: A malicious crawler attempts to list all contact entries (`messages`) to scrap emails and personal messages.
7. **Single Message Snipping (Messages)**: A user attempts to read another user's submitted message using its ID.
8. **Malicious Message Alteration (Messages)**: A user attempts to update a message, for instance changing `read` to `true` or altering the content of their inquiry after submission.
9. **Message Deletion Attack (Messages)**: An unauthenticated attacker attempts to delete a submitted message.
10. **Email Spoofing Admin Request**: A user signs in with an unverified email `uetronforge.ai@gmail.com` (e.g. `email_verified == false`) and attempts to write to `/portfolio/data`.
11. **Self-Assigned Admin Escalation**: A user tries to create an admin record or write to portfolio with self-asserted custom claims.
12. **Corrupted Data Type Write**: Admin tries to update portfolio team members, but sends a boolean instead of an array.

---

## 3. The Test Runner Spec

The Firestore Emulator-based security test runner ensures that these dirty payloads return `PERMISSION_DENIED`.

```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

describe('Firestore Security Rules', () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'gen-lang-client-0289410259',
      firestore: {
        rules: require('fs').readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  it('blocks unauthenticated portfolio writes (Spoofed Admin Write)', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(unauthedDb, 'portfolio/data'), { settings: {} }));
  });

  it('blocks non-admin users from writing to portfolio', async () => {
    const userDb = testEnv.authenticatedContext('user_123', { email: 'malicious@gmail.com', email_verified: true }).firestore();
    await assertFails(setDoc(doc(userDb, 'portfolio/data'), { settings: {} }));
  });

  it('blocks unverified admin emails (Email Spoofing)', async () => {
    const unverifiedDb = testEnv.authenticatedContext('admin_uid', { email: 'uetronforge.ai@gmail.com', email_verified: false }).firestore();
    await assertFails(setDoc(doc(unverifiedDb, 'portfolio/data'), { settings: {} }));
  });

  it('allows public read of portfolio', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(unauthedDb, 'portfolio/data')));
  });

  it('allows verified admin full write access to portfolio with valid schema', async () => {
    const adminDb = testEnv.authenticatedContext('admin_uid', { email: 'uetronforge.ai@gmail.com', email_verified: true }).firestore();
    await assertSucceeds(setDoc(doc(adminDb, 'portfolio/data'), {
      settings: {
        companyName: 'UETronForge AI',
        heroTitle: 'Forging',
        heroSubtitle: 'Future',
        aboutText: 'Formed at UET',
        contactEmail: 'uetronforge.ai@gmail.com',
        logoText: 'UETron'
      },
      team: [],
      projects: [],
      research: []
    }));
  });

  it('blocks public reading of messages (PII Harvesting)', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDocs(collection(unauthedDb, 'messages')));
  });
});
```
