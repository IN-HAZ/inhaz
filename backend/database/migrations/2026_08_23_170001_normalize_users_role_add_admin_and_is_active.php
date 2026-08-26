<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('role');
        });

        // Laravel's enum() created a native Postgres enum type; flatten to varchar + CHECK.
        DB::statement('ALTER TABLE users ALTER COLUMN role TYPE varchar(255) USING role::text');
        DB::statement('DROP TYPE IF EXISTS users_role_check');
        // Converting away from a native enum leaves behind an implicit CHECK; drop it.
        DB::statement(<<<'SQL'
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'users_role_check' AND conrelid = 'users'::regclass
                ) THEN
                    ALTER TABLE users DROP CONSTRAINT users_role_check;
                END IF;
            END
            $$;
            SQL);
        DB::table('users')->update([
            'role' => DB::raw('LOWER(role)'),
        ]);
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('client', 'driver', 'admin'))");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users DROP CONSTRAINT users_role_check");
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('client', 'driver'))");
        DB::table('users')->where('role', 'admin')->update(['role' => 'client']);

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }
};
