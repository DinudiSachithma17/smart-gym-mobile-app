# Database Schema

# Database Schema

## Smart Gym Management Mobile Application

This document defines the proposed MongoDB database schema for the Smart Gym Management mobile application.

The schema is based on the existing gym website data design and adapted for the mobile app. The mobile app will use MongoDB with a Node.js and Express.js backend. The system uses a role-based `Users` collection and separate collections for payments, memberships, classes, attendance, notifications, complaints, feedback, and audit logs.

---

## 1. Database Overview

**Database Name:** `smart_gym_main`

### Main Collections
- Users
- payment_records
- AttendanceRecords
- Complaints
- Feedback
- FitnessClasses
- memberships
- Notifications
- AuditLogs

---

## 2. Collection: Users

This collection stores all user accounts in a single collection.

### User Roles
- MEMBER
- TRAINER
- ADMIN

### Fields

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Auto-generated MongoDB ID |
| `name` | String | Full name of the user |
| `email` | String | Unique email address used for login |
| `password` | String | Hashed password |
| `gender` | String | User gender |
| `age` | Number | User age |
| `city` | String | City |
| `phone` | String | Contact phone number |
| `address` | String | Home address |
| `role` | String | MEMBER / TRAINER / ADMIN |
| `deleteRequestStatus` | String | NONE / PENDING |
| `passwordChanged` | Boolean | Whether password was changed after first login |
| `memberNo` | String | Unique member number for members only |
| `membershipPackage` | String | Selected package name |
| `packageStatus` | String | PENDING / PAID / ACTIVE |
| `membershipActivationDate` | Date | Membership activation date |
| `membershipExpiryDate` | Date | Membership expiry date |
| `membershipId` | String | Unique gym membership ID |
| `profilePhotoUrl` | String | URL of profile photo stored in cloud storage |
| `landingPagePhotoUrl` | String | URL of landing page photo |
| `specialization` | String | Trainer specialization |
| `certifications` | String | Trainer certifications |
| `hourlyRate` | Number | Trainer hourly rate |
| `fcmToken` | String | Firebase push notification token for mobile app |
| `lastSeen` | Date | Last activity timestamp in app |
| `createdAt` | Date | Account creation timestamp |
| `updatedAt` | Date | Last update timestamp |

### Notes
- All users are stored in one collection.
- Trainers and admins are identified using the `role` field.
- Mobile app image fields use **URLs**, not Base64 image strings.
- Complaint-related legacy fields are not stored in this collection because complaints have a separate collection.

---

## 3. Collection: payment_records

This collection stores all payment submissions made by members.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Auto-generated MongoDB ID |
| `userId` | ObjectId | Reference to Users collection |
| `userEmail` | String | Member email |
| `userName` | String | Member name |
| `packageType` | String | monthly / quarterly / annually |
| `amount` | Number | Payment amount |
| `paymentGateway` | String | Stripe / PayHere / PayPal / Manual |
| `gatewaySessionId` | String | Payment session ID from gateway |
| `gatewayPaymentIntent` | String | Payment intent or transaction ID |
| `status` | String | PENDING_VALIDATION / VALIDATED / REJECTED |
| `receiptUrl` | String | Optional payment receipt URL |
| `submittedAt` | Date | Submission timestamp |
| `validatedAt` | Date | Validation timestamp by admin |
| `adminNote` | String | Approval or rejection note |

### Notes
- This collection belongs mainly to the User Registration, Login & Payment module.
- Payment status can later be used by the Membership module.

---

## 4. Collection: memberships

This collection stores gym membership records.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Auto-generated MongoDB ID |
| `userId` | ObjectId | Reference to Users collection |
| `memberName` | String | Member name |
| `membershipId` | String | Unique gym membership ID |
| `planType` | String | monthly / quarterly / annually / custom |
| `startDate` | Date | Membership start date |
| `endDate` | Date | Membership end date |
| `amount` | Number | Membership fee |
| `paymentStatus` | String | paid / pending |
| `status` | String | ACTIVE / PENDING / SUSPENDED / EXPIRED |
| `approvedBy` | String | Admin who approved membership |
| `createdAt` | Date | Record creation timestamp |

### Notes
- This replaces the earlier `pt_memberships` idea with a more general gym membership collection.
- This collection is mainly used by the Membership Management module.

---

## 5. Collection: FitnessClasses

This collection stores all gym classes.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Auto-generated MongoDB ID |
| `className` | String | Name of the class |
| `classDate` | String | Scheduled date |
| `classTime` | String | Scheduled time |
| `trainerId` | ObjectId | Reference to trainer in Users collection |
| `trainerName` | String | Trainer name |
| `maxCapacity` | Number | Maximum class capacity |
| `memberIds` | Array<ObjectId> | List of enrolled member IDs |
| `description` | String | Class description |
| `createdAt` | Date | Record creation timestamp |

### Notes
- `currentCapacity` can be calculated using the number of `memberIds`.
- This collection is mainly used by the Trainer & Class Management module.

---

## 6. Collection: AttendanceRecords

This collection stores attendance check-in and check-out records.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Auto-generated MongoDB ID |
| `userId` | ObjectId | Reference to Users collection |
| `memberName` | String | Member name |
| `membershipId` | String | Member gym membership ID |
| `memberEmail` | String | Member email |
| `attendanceDate` | Date | Date of attendance |
| `checkInTime` | Date | Check-in timestamp |
| `checkOutTime` | Date | Check-out timestamp |
| `status` | String | ACTIVE / CHECKED_OUT |
| `createdAt` | Date | Record creation timestamp |

### Notes
- This collection is mainly used by the Attendance Monitoring & Notification Management module.

---

## 7. Collection: Notifications

This collection stores system notifications and member-specific notifications.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Auto-generated MongoDB ID |
| `title` | String | Notification title |
| `message` | String | Notification message |
| `type` | String | INFO / ALERT / WARNING |
| `senderName` | String | Sender name or System |
| `targetGroup` | String | ADMIN / MEMBER / TRAINER |
| `memberId` | String | Specific member ID if targeted |
| `memberName` | String | Target member name |
| `status` | String | UNREAD / READ |
| `createdAt` | Date | Notification creation timestamp |

### Notes
- Push notification support is handled using `fcmToken` stored in the Users collection.

---

## 8. Collection: Complaints

This collection stores complaints submitted by members.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Auto-generated MongoDB ID |
| `memberId` | ObjectId | Reference to Users collection |
| `memberName` | String | Member name |
| `memberEmail` | String | Member email |
| `category` | String | Complaint category |
| `description` | String | Complaint description |
| `status` | String | Pending / In Progress / Resolved |
| `priority` | String | Low / Medium / High |
| `photoUrl` | String | Optional complaint image URL |
| `submittedAt` | Date | Complaint submission timestamp |
| `messages` | Array<Object> | Conversation thread between member and admin |

### Embedded messages[] object

| Field | Type | Description |
|---|---|---|
| `senderRole` | String | MEMBER / ADMIN |
| `message` | String | Message content |
| `timestamp` | Date | Message timestamp |

### Notes
- Complaint data is stored separately and not duplicated inside Users.
- This collection is mainly used by the Feedback & Complaint Management module.

---

## 9. Collection: Feedback

This collection stores gym or trainer feedback submitted by members.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Auto-generated MongoDB ID |
| `memberId` | ObjectId | Reference to Users collection |
| `memberName` | String | Member name |
| `memberProfilePhotoUrl` | String | Member profile photo URL |
| `isAnonymous` | Boolean | Whether feedback is anonymous |
| `targetType` | String | GYM / TRAINER |
| `trainerId` | ObjectId | Reference to trainer if target type is TRAINER |
| `trainerName` | String | Trainer name |
| `rating` | Number | Rating from 1 to 5 |
| `comment` | String | Feedback comment |
| `isApproved` | Boolean | Whether feedback is approved for display |
| `createdAt` | Date | Feedback submission timestamp |

### Notes
- This collection is also part of the Feedback & Complaint Management module.

---

## 10. Collection: AuditLogs

This collection stores important admin actions for tracking and history.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Auto-generated MongoDB ID |
| `action` | String | Action name |
| `memberId` | String | Affected member ID |
| `memberName` | String | Affected member name |
| `memberEmail` | String | Affected member email |
| `membershipId` | String | Related membership ID |
| `membershipStatus` | String | Membership status at that time |
| `membershipAmount` | Number | Membership amount |
| `actionTime` | Date | Timestamp of action |
| `performedBy` | String | Admin who performed action |
| `reason` | String | Reason for action |
| `details` | String | Additional details |

### Notes
- This collection is useful for admin accountability and history tracking.

---

## 11. Relationships Between Collections

### Main Relationships
- `Users` → `payment_records` using `userId`
- `Users` → `memberships` using `userId`
- `Users` → `AttendanceRecords` using `userId`
- `Users` → `Complaints` using `memberId`
- `Users` → `Feedback` using `memberId`
- `Users` (TRAINER role) → `FitnessClasses` using `trainerId`
- `FitnessClasses` → enrolled members using `memberIds`

---

## 12. Mobile App Specific Improvements

The following mobile-specific changes are included in this schema:

1. **Added `fcmToken` to Users**
   - used for Firebase push notifications

2. **Replaced Base64 image storage with cloud image URLs**
   - improves performance on mobile networks

3. **Added `lastSeen` to Users**
   - useful for session and activity tracking

---

## 13. Summary

This schema supports all main modules of the Smart Gym Management mobile application:

- User Registration, Login & Payment
- Membership Management
- Trainer & Class Management
- Attendance Monitoring & Notification Management
- Reports & Dashboard
- Feedback & Complaint Management

The database is designed to be flexible, mobile-friendly, and suitable for MongoDB.
