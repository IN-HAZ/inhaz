<?php

namespace App\Services;

use App\Models\DeliveryRequest;
use App\Models\RequestPhoto;
use Illuminate\Http\UploadedFile;

class RequestPhotoService
{
    public function store(DeliveryRequest $deliveryRequest, UploadedFile $file): RequestPhoto
    {
        if (! $deliveryRequest->canBeModified()) {
            throw new \DomainException('Cette demande ne peut plus être modifiée');
        }

        $path = $file->store('request-photos/'.$deliveryRequest->id, 'private');

        return $deliveryRequest->photos()->create([
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);
    }

    public function delete(RequestPhoto $photo): void
    {
        if (! $photo->deliveryRequest->canBeModified()) {
            throw new \DomainException('Cette demande ne peut plus être modifiée');
        }

        $photo->deleteFile();
        $photo->delete();
    }
}
