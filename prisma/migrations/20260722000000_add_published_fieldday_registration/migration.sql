-- AlterTable: episódios de podcast passam a ter status de publicação
ALTER TABLE "PodcastEpisode" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable: inscrição de aluno em Dia de Campo
CREATE TABLE "FieldDayRegistration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fieldDayId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldDayRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FieldDayRegistration_userId_fieldDayId_key" ON "FieldDayRegistration"("userId", "fieldDayId");

-- AddForeignKey
ALTER TABLE "FieldDayRegistration" ADD CONSTRAINT "FieldDayRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldDayRegistration" ADD CONSTRAINT "FieldDayRegistration_fieldDayId_fkey" FOREIGN KEY ("fieldDayId") REFERENCES "FieldDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
