<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const VALUES_BEFORE = ['DRAFT', 'OPEN', 'CANCELLED', 'EXPIRED', 'MATCHED'];

    private const VALUES_AFTER = ['DRAFT', 'OPEN', 'CANCELLED', 'EXPIRED', 'MATCHED', 'COMPLETED'];

    public function up(): void
    {
        $this->swapConstraint(self::VALUES_AFTER);
    }

    public function down(): void
    {
        DB::table('delivery_requests')->where('status', 'COMPLETED')->update(['status' => 'MATCHED']);

        $this->swapConstraint(self::VALUES_BEFORE);
    }

    private function swapConstraint(array $values): void
    {
        $list = implode(', ', array_map(fn ($v) => "'{$v}'", $values));

        DB::statement("ALTER TABLE delivery_requests DROP CONSTRAINT IF EXISTS delivery_requests_status_check");
        DB::statement("ALTER TABLE delivery_requests ADD CONSTRAINT delivery_requests_status_check CHECK (status IN ({$list}))");
    }
};
