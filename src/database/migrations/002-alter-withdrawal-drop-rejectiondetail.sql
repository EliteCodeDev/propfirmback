-- Migración: Eliminar columna rejectionDetail y ampliar observation a 500
ALTER TABLE "Withdrawal" DROP COLUMN IF EXISTS "rejectionDetail";
ALTER TABLE "Withdrawal" ALTER COLUMN "observation" TYPE varchar(500);
