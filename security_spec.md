# Security Specification & Test Suite

## 1. Data Invariants

1. **User Identity & Profile**:
   - A user profile document `/users/{userId}` can only be created or modified by the user whose UID matches `{userId}`.
   - User email in the document must match `request.auth.token.email`.

2. **Project Governance**:
   - Projects can only be created by signed-in users. The creator is stored as `leaderId` matching `request.auth.uid`.
   - Only the project leader can update project metadata or add/remove members.
   - Only leader and members can read the project document.

3. **Subcollection Relational Security (Master Gate)**:
   - Access to `/projects/{projectId}/messages/{messageId}` and `/projects/{projectId}/tasks/{taskId}` requires verifying membership on `/projects/{projectId}`.

4. **Task Access & Tiered Permissions**:
   - Only the project leader can create or delete tasks.
   - The project leader can update all fields of any task in the project.
   - The assigned member (`assigneeId == request.auth.uid`) can only update task `status` and `updatedAt`.
   - Subtasks must reference a valid `parentTaskId` string or null.

5. **Chat Messages Integrity**:
   - Only project members can create chat messages.
   - The `senderId` must strictly equal `request.auth.uid`.
   - Chat messages are immutable once written (no update, no delete by regular users).

6. **Invites**:
   - An invite can only be created by the project leader.
   - Invites can be read by the recipient email or by the project leader.
   - Recipient can update status to 'accepted' when joining.

---

## 2. The "Dirty Dozen" Payloads (Adversarial Security Test Cases)

1. **Payload 1 - Identity Spoofing in User Profile**:
   - Attempt: Non-owner writes to `/users/victimUid` with `{ uid: 'victimUid', displayName: 'Hacker' }`.
   - Expectation: PERMISSION_DENIED.

2. **Payload 2 - Project Hijacking**:
   - Attempt: Non-leader member submits update on `/projects/p123` changing `leaderId` to their own UID.
   - Expectation: PERMISSION_DENIED.

3. **Payload 3 - Shadow Update on Project**:
   - Attempt: Leader updates project with extra injected field `{ isAdminGranted: true }`.
   - Expectation: PERMISSION_DENIED (strict key allowlist).

4. **Payload 4 - Non-Member Message Ingestion**:
   - Attempt: User who is not in `memberIds` posts to `/projects/p123/messages/m1`.
   - Expectation: PERMISSION_DENIED (Relational check fails).

5. **Payload 5 - Message Impersonation**:
   - Attempt: User A posts message to `/projects/p123/messages/m2` with `senderId: 'userB'`.
   - Expectation: PERMISSION_DENIED (Identity integrity mismatch).

6. **Payload 6 - Message Edit Attack**:
   - Attempt: Regular member attempts to update an existing chat message text.
   - Expectation: PERMISSION_DENIED (Messages are immutable).

7. **Payload 7 - Unauthorized Task Creation**:
   - Attempt: Non-leader project member tries to create a task in `/projects/p123/tasks/t1`.
   - Expectation: PERMISSION_DENIED (Only leader can create tasks).

8. **Payload 8 - Contributor Privilege Escalation (Overstepping Tier 2)**:
   - Attempt: Assignee attempts to change task `title`, `deadline`, or `assigneeId` instead of only `status`.
   - Expectation: PERMISSION_DENIED (`affectedKeys().hasOnly(['status', 'updatedAt'])`).

9. **Payload 9 - Task Deletion by Non-Leader**:
   - Attempt: Assignee or non-leader member attempts to delete a task.
   - Expectation: PERMISSION_DENIED.

10. **Payload 10 - ID Poisoning / Oversized ID Attack**:
    - Attempt: Writing to a path with 2000-character malicious document ID.
    - Expectation: PERMISSION_DENIED (`isValidId()` constraint).

11. **Payload 11 - Giant String Buffer Bomb (Denial of Wallet)**:
    - Attempt: Submitting a message with `text` length greater than 2000 characters.
    - Expectation: PERMISSION_DENIED (`.size() <= 2000` constraint).

12. **Payload 12 - Unauthorized Invite Creation**:
    - Attempt: A user who is not leader of the project tries to create an invite in `/invites/inv1`.
    - Expectation: PERMISSION_DENIED.
