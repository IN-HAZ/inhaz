<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('otps', function (Blueprint $table) {
            $table->string('code_hash')->after('phone');
            $table->unsignedTinyInteger('attempts')->default(0)->after('used');
        });

        Schema::table('otps', function (Blueprint $table) {
            $table->dropIndex(['phone', 'code']);
            $table->dropColumn('code');
        });

        Schema::table('otps', function (Blueprint $table) {
            $table->index(['phone', 'used', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::table('otps', function (Blueprint $table) {
            $table->string('code', 6);
            $table->index(['phone', 'code']);
        });

        Schema::table('otps', function (Blueprint $table) {
            $table->dropIndex(['phone', 'used', 'expires_at']);
            $table->dropColumn(['code_hash', 'attempts']);
        });
    }
};
