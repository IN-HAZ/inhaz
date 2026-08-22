<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delivery_requests', function (Blueprint $table) {
            $table->string('status')->default('DRAFT')->change();
        });
    }

    public function down(): void
    {
        Schema::table('delivery_requests', function (Blueprint $table) {
            $table->enum('status', ['DRAFT', 'OPEN', 'CANCELLED', 'EXPIRED', 'MATCHED'])->default('DRAFT')->change();
        });
    }
};
