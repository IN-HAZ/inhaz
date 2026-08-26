<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Spec 02 §2.1: name is nullable until profile completion.
        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->nullable()->change();
        });

        // Role column is varchar + CHECK (see 170001); fix the stale UPPERCASE default.
        DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'client'");
    }

    public function down(): void
    {
        DB::table('users')->whereNull('name')->update(['name' => '']);

        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->nullable(false)->change();
        });

        DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'client'");
    }
};
