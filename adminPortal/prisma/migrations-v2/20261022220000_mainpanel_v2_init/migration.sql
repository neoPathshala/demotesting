-- Initial migration for the isolated mainPanel/adminPortal database.
-- No legacy public-schema tables or data are modified.
BEGIN;
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "mainpanel_v2";

-- CreateEnum
CREATE TYPE "mainpanel_v2"."ResourceType" AS ENUM ('books', 'notes', 'papers', 'practical', 'questions', 'syllabus', 'videos');

-- CreateEnum
CREATE TYPE "mainpanel_v2"."UserRole" AS ENUM ('STUDENT', 'ADMIN', 'SUPERADMIN', 'TEACHER', 'CONTENT_MANAGER');

-- CreateEnum
CREATE TYPE "mainpanel_v2"."ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "mainpanel_v2"."ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "mainpanel_v2"."AdminRole" AS ENUM ('OWNER', 'EDITOR', 'SUPPORT');

-- CreateTable
CREATE TABLE "mainpanel_v2"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "mainpanel_v2"."UserRole" NOT NULL DEFAULT 'STUDENT',
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "semester" INTEGER,
    "site" TEXT NOT NULL DEFAULT 'neocsit',
    "avatarUrl" TEXT,
    "phone" TEXT,
    "jobTitle" TEXT DEFAULT 'Student',
    "emergencyLockdown" BOOLEAN NOT NULL DEFAULT false,
    "college" TEXT,
    "studentId" TEXT,
    "bio" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "devicePolicy" TEXT NOT NULL DEFAULT '1_web_1_app',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mainpanel_v2"."SuperAdminAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "ipAddress" TEXT NOT NULL DEFAULT 'Not collected',
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuperAdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mainpanel_v2"."Semester" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mainpanel_v2"."Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isElective" BOOLEAN NOT NULL DEFAULT false,
    "electiveGroup" TEXT,
    "semesterId" INTEGER,
    "courseId" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "creditHours" INTEGER NOT NULL DEFAULT 3,
    "lectureHours" INTEGER NOT NULL DEFAULT 0,
    "status" "mainpanel_v2"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mainpanel_v2"."Resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "mainpanel_v2"."ResourceType" NOT NULL,
    "author" TEXT,
    "subjectId" TEXT NOT NULL,
    "status" "mainpanel_v2"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mainpanel_v2"."SiteConfig" (
    "id" TEXT NOT NULL,
    "site" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "allowRegistration" BOOLEAN NOT NULL DEFAULT true,
    "announcement" TEXT,
    "logoUrl" TEXT DEFAULT '/logo.png',
    "domainUrl" TEXT,

    CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mainpanel_v2"."Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Guides',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "author" TEXT NOT NULL DEFAULT 'Aashish Adhikari',
    "authorAvatar" TEXT,
    "status" "mainpanel_v2"."ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "site" TEXT NOT NULL DEFAULT 'all',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "readTime" INTEGER NOT NULL DEFAULT 3,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "canonicalUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mainpanel_v2"."AcademicSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mainpanel_v2"."AcademicOtp" (
    "email" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "challengeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "course" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "AcademicOtp_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "mainpanel_v2"."AcademicRateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "mainpanel_v2"."PlatformObject" (
    "key" TEXT NOT NULL,
    "body" BYTEA NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformObject_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "mainpanel_v2"."University" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mainpanel_v2"."Course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "faculty" TEXT NOT NULL DEFAULT '',
    "totalSemesters" INTEGER NOT NULL DEFAULT 8,
    "totalCredits" INTEGER NOT NULL DEFAULT 0,
    "universityId" TEXT NOT NULL,
    "status" "mainpanel_v2"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mainpanel_v2"."Unit" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "hours" INTEGER NOT NULL DEFAULT 0,
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "mainpanel_v2"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mainpanel_v2"."Question" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "answer" TEXT NOT NULL DEFAULT '',
    "year" INTEGER,
    "marks" INTEGER NOT NULL DEFAULT 0,
    "status" "mainpanel_v2"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mainpanel_v2"."Notice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "targetSemesters" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "status" "mainpanel_v2"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "showInTicker" BOOLEAN NOT NULL DEFAULT false,
    "externalLink" TEXT,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mainpanel_v2"."AdminAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "totpSecretEncrypted" TEXT NOT NULL,
    "lastTotpStep" INTEGER NOT NULL DEFAULT 0,
    "role" "mainpanel_v2"."AdminRole" NOT NULL DEFAULT 'EDITOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mainpanel_v2"."AdminSession" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mainpanel_v2"."AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mainpanel_v2"."StudentEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mainpanel_v2"."StudentElective" (
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentElective_pkey" PRIMARY KEY ("userId","subjectId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_site_key" ON "mainpanel_v2"."User"("email", "site");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_slug_key" ON "mainpanel_v2"."Subject"("slug");

-- CreateIndex
CREATE INDEX "Subject_courseId_semesterId_status_idx" ON "mainpanel_v2"."Subject"("courseId", "semesterId", "status");

-- CreateIndex
CREATE INDEX "Resource_subjectId_status_type_idx" ON "mainpanel_v2"."Resource"("subjectId", "status", "type");

-- CreateIndex
CREATE UNIQUE INDEX "SiteConfig_site_key" ON "mainpanel_v2"."SiteConfig"("site");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "mainpanel_v2"."Article"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicSession_tokenHash_key" ON "mainpanel_v2"."AcademicSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AcademicSession_userId_idx" ON "mainpanel_v2"."AcademicSession"("userId");

-- CreateIndex
CREATE INDEX "AcademicSession_expiresAt_idx" ON "mainpanel_v2"."AcademicSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AcademicRateLimit_expiresAt_idx" ON "mainpanel_v2"."AcademicRateLimit"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "University_slug_key" ON "mainpanel_v2"."University"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "mainpanel_v2"."Course"("slug");

-- CreateIndex
CREATE INDEX "Course_universityId_status_idx" ON "mainpanel_v2"."Course"("universityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_subjectId_number_key" ON "mainpanel_v2"."Unit"("subjectId", "number");

-- CreateIndex
CREATE INDEX "Question_subjectId_status_year_idx" ON "mainpanel_v2"."Question"("subjectId", "status", "year");

-- CreateIndex
CREATE INDEX "Notice_status_publishedAt_idx" ON "mainpanel_v2"."Notice"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminAccount_email_key" ON "mainpanel_v2"."AdminAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "mainpanel_v2"."AdminSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminSession_adminId_idx" ON "mainpanel_v2"."AdminSession"("adminId");

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "mainpanel_v2"."AdminSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "mainpanel_v2"."AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_entity_entityId_idx" ON "mainpanel_v2"."AdminAuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "StudentEnrollment_courseId_semester_idx" ON "mainpanel_v2"."StudentEnrollment"("courseId", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "StudentEnrollment_userId_courseId_key" ON "mainpanel_v2"."StudentEnrollment"("userId", "courseId");

-- CreateIndex
CREATE INDEX "StudentElective_subjectId_idx" ON "mainpanel_v2"."StudentElective"("subjectId");

-- AddForeignKey
ALTER TABLE "mainpanel_v2"."SuperAdminAuditLog" ADD CONSTRAINT "SuperAdminAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "mainpanel_v2"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mainpanel_v2"."Subject" ADD CONSTRAINT "Subject_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "mainpanel_v2"."Semester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mainpanel_v2"."Subject" ADD CONSTRAINT "Subject_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "mainpanel_v2"."Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mainpanel_v2"."Resource" ADD CONSTRAINT "Resource_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "mainpanel_v2"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mainpanel_v2"."AcademicSession" ADD CONSTRAINT "AcademicSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "mainpanel_v2"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mainpanel_v2"."Course" ADD CONSTRAINT "Course_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "mainpanel_v2"."University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mainpanel_v2"."Unit" ADD CONSTRAINT "Unit_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "mainpanel_v2"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mainpanel_v2"."Question" ADD CONSTRAINT "Question_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "mainpanel_v2"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mainpanel_v2"."AdminSession" ADD CONSTRAINT "AdminSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "mainpanel_v2"."AdminAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mainpanel_v2"."AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "mainpanel_v2"."AdminAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mainpanel_v2"."StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "mainpanel_v2"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mainpanel_v2"."StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "mainpanel_v2"."Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mainpanel_v2"."StudentElective" ADD CONSTRAINT "StudentElective_userId_fkey" FOREIGN KEY ("userId") REFERENCES "mainpanel_v2"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mainpanel_v2"."StudentElective" ADD CONSTRAINT "StudentElective_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "mainpanel_v2"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
