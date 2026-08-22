<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['DRAFT', 'OPEN', 'CANCELLED', 'EXPIRED', 'MATCHED'])->default('DRAFT');
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->decimal('package_weight', 8, 2)->nullable();
            $table->string('package_dimensions')->nullable();
            $table->decimal('proposed_price', 10, 2)->nullable();
            $table->decimal('budget_min', 10, 2)->nullable();
            $table->decimal('budget_max', 10, 2)->nullable();
            $table->timestamp('preferred_date')->nullable();
            $table->string('preferred_time_slot')->nullable();
            $table->text('instructions')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_requests');
    }
};
