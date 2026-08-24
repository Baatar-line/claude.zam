-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "titleMn" TEXT NOT NULL,
    "descriptionMn" TEXT NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Block_key_key" ON "Block"("key");

-- CreateIndex
CREATE INDEX "Block_order_idx" ON "Block"("order");
