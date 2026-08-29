<?php

namespace App\Http\Controllers;

use App\Models\DriverDocument;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    use AuthorizesRequests;

    public function show(DriverDocument $document): StreamedResponse
    {
        $this->authorize('view', $document->driverProfile);

        $path = $document->file;

        if (! Storage::exists($path)) {
            abort(404, 'Fichier introuvable.');
        }

        $mime = Storage::mimeType($path);
        $name = basename($path);

        return Storage::response($path, 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="'.$name.'"',
        ]);
    }
}
