<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('driver_profiles', function (Blueprint $table) {
            $table->boolean('is_online')->default(false)->after('status');
            $table->timestamp('last_online_at')->nullable()->after('is_online');
            $table->decimal('current_latitude', 10, 7)->nullable()->after('last_online_at');
            $table->decimal('current_longitude', 10, 7)->nullable()->after('current_latitude');
            $table->decimal('wallet_balance', 10, 2)->default(0.00)->after('current_longitude');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('driver_profiles', function (Blueprint $table) {
            $columns = [];
            foreach (['is_online', 'last_online_at', 'current_latitude', 'current_longitude', 'wallet_balance'] as $col) {
                if (Schema::hasColumn('driver_profiles', $col)) {
                    $columns[] = $col;
                }
            }
            if (! empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
