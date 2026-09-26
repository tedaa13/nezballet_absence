-- CreateTable
CREATE TABLE "_AdminBranches" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AdminBranches_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AdminBranches_B_index" ON "_AdminBranches"("B");

-- AddForeignKey
ALTER TABLE "_AdminBranches" ADD CONSTRAINT "_AdminBranches_A_fkey" FOREIGN KEY ("A") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdminBranches" ADD CONSTRAINT "_AdminBranches_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

