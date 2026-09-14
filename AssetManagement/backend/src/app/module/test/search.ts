/*
asset_assignments.prisma
model AssetAssignment {
  id String @id @default(uuid()) @db.Uuid

  assetId      String @db.Uuid
  employeeId   String @db.Uuid
  assignedById String @db.Uuid

  assignedAt DateTime  @default(now())
  returnedAt DateTime?

  returnCondition AssetCondition?
  remarks         String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  asset      Asset @relation(fields: [assetId], references: [id], onDelete: Restrict)
  employee   User  @relation("EmployeeAssignments", fields: [employeeId], references: [id], onDelete: Restrict)
  assignedBy User  @relation("AssignedBy", fields: [assignedById], references: [id], onDelete: Restrict)

  @@index([assetId])
  @@index([employeeId])
  @@index([assignedById])
  @@index([assignedAt])
  @@index([returnedAt])
  @@map("asset_assignments")
}


asset_categories.prisma
model AssetCategory {
  id          String  @id @default(uuid()) @db.Uuid
  name        String  @unique
  description String?

  // Relations
  assets        Asset[]
  assetRequests AssetRequest[]

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("asset_categories")
}


asset_purchases.prisma
model AssetPurchase {
  id String @id @default(uuid()) @db.Uuid

  assetId     String @db.Uuid
  vendorId    String @db.Uuid
  createdById String @db.Uuid

  invoiceNumber String  @unique @map("invoice_number")
  quantity      Int     @default(1)
  unitPrice     Decimal @map("unit_price") @db.Decimal(12, 2)
  totalAmount   Decimal @map("total_amount") @db.Decimal(12, 2)

  purchaseDate  DateTime      @default(now()) @map("purchase_date")
  paymentStatus PaymentStatus @default(PENDING) @map("payment_status")

  invoiceUrl String? @map("invoice_url")
  remarks    String?

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  asset     Asset     @relation(fields: [assetId], references: [id], onDelete: Restrict)
  vendor    Vendor    @relation(fields: [vendorId], references: [id], onDelete: Restrict)
  createdBy User      @relation(fields: [createdById], references: [id], onDelete: Restrict)
  payments  Payment[]

  @@index([assetId])
  @@index([vendorId])
  @@index([createdById])
  @@index([purchaseDate])
  @@index([paymentStatus])
  @@map("asset_purchases")
}


asset_requests.prisma
model AssetRequest {
  id String @id @default(uuid()) @db.Uuid

  employeeId       String  @db.Uuid
  categoryId       String  @db.Uuid
  requestedAssetId String? @db.Uuid

  quantity Int                @default(1)
  reason   String
  status   AssetRequestStatus @default(PENDING)

  reviewedById    String?   @db.Uuid
  reviewedAt      DateTime?
  rejectionReason String?

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  employee   User  @relation("EmployeeRequests", fields: [employeeId], references: [id], onDelete: Restrict)
  reviewedBy User? @relation("RequestReviewer", fields: [reviewedById], references: [id], onDelete: SetNull)

  category AssetCategory @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  requestedAsset Asset? @relation(fields: [requestedAssetId], references: [id], onDelete: SetNull)

  @@index([employeeId])
  @@index([categoryId])
  @@index([requestedAssetId])
  @@index([reviewedById])
  @@index([status])
  @@index([createdAt])
  @@map("asset_requests")
}


assets.prisma
model Asset {
  id         String @id @default(uuid()) @db.Uuid
  assetTag   String @unique @map("asset_tag")
  name       String
  categoryId String @db.Uuid

  brand        String?
  model        String?
  serialNumber String? @unique @map("serial_number")

  description String?

  purchasePrice  Decimal   @map("purchase_price") @db.Decimal(12, 2)
  purchaseDate   DateTime  @map("purchase_date") @db.Date
  warrantyExpiry DateTime? @map("warranty_expiry") @db.Date

  condition AssetCondition @default(NEW)
  status    AssetStatus    @default(AVAILABLE)

  location String?
  imageUrl String? @map("image_url")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  category           AssetCategory       @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  assignments        AssetAssignment[]
  assetRequests      AssetRequest[]
  assetPurchases     AssetPurchase[]
  maintenanceRecords MaintenanceRecord[]
  vendor             Vendor?             @relation(fields: [vendorId], references: [id])
  vendorId           String?             @db.Uuid

  @@index([categoryId])
  @@index([status])
  @@index([condition])
  @@index([purchaseDate])
  @@index([location])
  @@map("assets")
}



audit_logs.prisma
model AuditLog {
  id String @id @default(uuid()) @db.Uuid

  userId   String? @db.Uuid
  action   String
  entity   String
  entityId String? @db.Uuid

  oldData Json? @map("old_data")
  newData Json? @map("new_data")

  ipAddress String? @map("ip_address")
  userAgent String? @map("user_agent")

  createdAt DateTime @default(now()) @map("created_at")

  // Relation
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([entity])
  @@index([entityId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}


enums.prisma
enum UserRole {
  SUPER_ADMIN
  ADMIN
  MANAGER
  EMPLOYEE
}

enum UserStatus {
  ACTIVE
  BLOCKED
  DELETED
}

enum AuthProvider {
  EMAIL
  GOOGLE
}

enum AssetCondition {
  NEW
  GOOD
  FAIR
  POOR
  DAMAGED
}

enum AssetStatus {
  AVAILABLE
  ASSIGNED
  UNDER_MAINTENANCE
  LOST
  DAMAGED
  RETIRED
  DISPOSED
}

enum AssetRequestStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
  FULFILLED
}

enum MaintenanceStatus {
  REPORTED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  PARTIAL
  FAILED
  REFUNDED
}

enum PaymentProvider {
  BKASH
  STRIPE
  SSLCOMMERZ
}

enum NotificationType {
  ASSET_ASSIGNED
  ASSET_RETURNED
  ASSET_REQUEST
  REQUEST_APPROVED
  REQUEST_REJECTED
  MAINTENANCE
  PAYMENT
  SYSTEM
}


maintenance_record.prisma
model MaintenanceRecord {
  id String @id @default(uuid()) @db.Uuid

  assetId      String  @db.Uuid
  reportedById String  @db.Uuid
  vendorId     String? @db.Uuid

  issue       String
  description String?
  serviceCost Decimal @default(0) @db.Decimal(12, 2)

  status MaintenanceStatus @default(REPORTED)

  startedAt   DateTime?
  completedAt DateTime?

  remarks String?

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  asset      Asset   @relation(fields: [assetId], references: [id], onDelete: Restrict)
  reportedBy User    @relation("MaintenanceReportedBy", fields: [reportedById], references: [id], onDelete: Restrict)
  vendor     Vendor? @relation(fields: [vendorId], references: [id], onDelete: SetNull)

  @@index([assetId])
  @@index([reportedById])
  @@index([vendorId])
  @@index([status])
  @@index([startedAt])
  @@map("maintenance_records")
}


notifications.prisma
model Notification {
  id String @id @default(uuid()) @db.Uuid

  userId  String           @db.Uuid
  title   String
  message String
  type    NotificationType

  isRead Boolean   @default(false) @map("is_read")
  readAt DateTime? @map("read_at")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relation
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
  @@index([type])
  @@index([createdAt])
  @@map("notifications")
}


payments.prisma
model Payment {
  id String @id @default(uuid()) @db.Uuid

  userId     String @db.Uuid
  purchaseId String @db.Uuid

  amount   Decimal @db.Decimal(12, 2)
  currency String  @default("BDT")

  provider      PaymentProvider
  transactionId String          @unique @map("transaction_id")
  paymentStatus PaymentStatus   @default(PENDING) @map("payment_status")

  paymentUrl String?   @map("payment_url")
  paidAt     DateTime? @map("paid_at")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  user     User          @relation(fields: [userId], references: [id], onDelete: Restrict)
  purchase AssetPurchase @relation(fields: [purchaseId], references: [id], onDelete: Restrict)

  @@index([userId])
  @@index([purchaseId])
  @@index([provider])
  @@index([paymentStatus])
  @@index([paidAt])
  @@map("payments")
}


refresh_tokens.prisma
model RefreshToken {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @db.Uuid
  token     String    @unique
  expiresAt DateTime  @map("expires_at")
  revokedAt DateTime? @map("revoked_at")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relation
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@index([revokedAt])
  @@map("refresh_tokens")
}


schema.prisma
generator client {
  provider = "prisma-client"
  output   = "../../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}



user_Profile.prisma
model UserProfile {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @unique @db.Uuid

  bio         String?
  address     String?
  city        String?
  postalCode   String?
  country     String?  @default("Bangladesh")
  dateOfBirth DateTime?

  emergencyContactName  String?
  emergencyContactPhone String?

  joiningDate DateTime?
  employeeId  String? @unique

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relation
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}


user.prisma
model User {
  id           String  @id @default(uuid()) @db.Uuid
  name         String
  email        String  @unique
  emailVerified Boolean @default(false)
  password     String?
  profileImage String?
  phone        String?
  department   String?
  designation  String?

  role         UserRole     @default(EMPLOYEE)
  status       UserStatus   @default(ACTIVE)
  
  authProvider AuthProvider @default(EMAIL)
  googleId     String?      @unique

  isActive Boolean @default(true)
  needPasswordChange Boolean @default(false)

  isDeleted Boolean   @default(false)
  deletedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

 // Profile
  profile UserProfile?

  // Relations
  assetAssignments AssetAssignment[] @relation("EmployeeAssignments")
  assignedAssets   AssetAssignment[] @relation("AssignedBy")

  assetRequests         AssetRequest[] @relation("EmployeeRequests")
  reviewedAssetRequests AssetRequest[] @relation("RequestReviewer")

  assetPurchases AssetPurchase[]
  payments       Payment[]

  maintenanceRecordsReported MaintenanceRecord[] @relation("MaintenanceReportedBy")

  notifications Notification[]
  auditLogs     AuditLog[]
  refreshTokens RefreshToken[]

  @@index([email])
  @@index([role])
  @@index([department])
  @@index([isActive])
  @@map("users")
}



vendors.prisma
model Vendor {
  id            String  @id @default(uuid()) @db.Uuid
  name          String
  companyName   String? @map("company_name")
  email         String? @unique
  phone         String?
  address       String?
  website       String?
  contactPerson String? @map("contact_person")

  isActive Boolean @default(true) @map("is_active")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  assets             Asset[]
  purchases          AssetPurchase[]
  maintenanceRecords MaintenanceRecord[]

  @@index([name])
  @@index([isActive])
  @@map("vendors")
}


make request module where include route, controller, service and interface and other module if needed
Note I use Typescript 
*/
