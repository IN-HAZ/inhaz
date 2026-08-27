<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'type',
    'brand',
    'model',
    'registration_number',
    'photos',
])]
class Vehicle extends Model
{
    protected function casts(): array
    {
        return [
            'photos' => 'array',
        ];
    }

    public function driverProfile(): BelongsTo
    {
        return $this->belongsTo(DriverProfile::class);
    }
}
