<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class RequestPhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'delivery_request_id',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
    ];

    public function deliveryRequest(): BelongsTo
    {
        return $this->belongsTo(DeliveryRequest::class);
    }

    public function getUrl(): string
    {
        return Storage::disk('private')->url($this->file_path);
    }

    public function getTemporaryUrl(int $expiration = 3600): string
    {
        return Storage::disk('private')->temporaryUrl($this->file_path, now()->addSeconds($expiration));
    }

    public function deleteFile(): bool
    {
        if ($this->file_path && Storage::disk('private')->exists($this->file_path)) {
            return Storage::disk('private')->delete($this->file_path);
        }

        return true;
    }
}
