<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DeliveryRequestController;
use App\Http\Controllers\Api\V1\DriverController;
use App\Http\Controllers\Api\V1\DriverVerificationController;
use App\Http\Controllers\Api\V1\OfferController;
use App\Http\Controllers\Api\V1\RequestPhotoController;
use App\Http\Controllers\Api\V1\TripController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
        ]);
    });

    Route::prefix('auth')->middleware('auth-api')->group(function () {
        Route::post('/send-otp', [AuthController::class, 'sendOtp']);
        Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    Route::get('/me', [AuthController::class, 'me'])->middleware('auth-api');
    Route::put('/me', [AuthController::class, 'updateProfile'])->middleware('auth-api');

    Route::prefix('driver')->middleware('auth-api')->group(function () {
        Route::post('/apply', [DriverController::class, 'apply']);
        Route::get('/profile', [DriverController::class, 'profile']);
        Route::post('/documents', [DriverController::class, 'storeDocument']);
        Route::get('/documents', [DriverController::class, 'listDocuments']);
        Route::get('/documents/{document}/view', [\App\Http\Controllers\DocumentController::class, 'show']);
        Route::post('/vehicle', [DriverController::class, 'storeVehicle']);
    });

    Route::prefix('requests')->middleware('auth-api')->group(function () {
        Route::get('/browse', [DeliveryRequestController::class, 'browse']);

        Route::get('/', [DeliveryRequestController::class, 'index']);
        Route::post('/', [DeliveryRequestController::class, 'store']);
        Route::get('/{deliveryRequest}', [DeliveryRequestController::class, 'show']);
        Route::put('/{deliveryRequest}', [DeliveryRequestController::class, 'update']);
        Route::delete('/{deliveryRequest}', [DeliveryRequestController::class, 'destroy']);
        Route::post('/{deliveryRequest}/publish', [DeliveryRequestController::class, 'publish']);
        Route::post('/{deliveryRequest}/cancel', [DeliveryRequestController::class, 'cancel']);

        Route::post('/{deliveryRequest}/photos', [RequestPhotoController::class, 'store']);
        Route::get('/{deliveryRequest}/photos', [RequestPhotoController::class, 'index']);

        Route::post('/{deliveryRequest}/offers', [OfferController::class, 'store']);
        Route::get('/{deliveryRequest}/offers', [OfferController::class, 'index']);
    });

    Route::post('/offers/{offer}/accept', [OfferController::class, 'accept'])->middleware('auth-api');
    Route::post('/offers/{offer}/reject', [OfferController::class, 'reject'])->middleware('auth-api');
    Route::post('/offers/{offer}/withdraw', [OfferController::class, 'withdraw'])->middleware('auth-api');

    Route::middleware('auth-api')->group(function () {
        Route::get('/trips/{trip}', [TripController::class, 'show']);
        Route::post('/trips/{trip}/transition', [TripController::class, 'transition']);
        Route::post('/trips/{trip}/cancel', [TripController::class, 'cancel']);
        Route::get('/trips/{trip}/waypoints', [TripController::class, 'waypoints']);
        Route::post('/trips/{trip}/rate', [TripController::class, 'rate']);
        Route::get('/driver/trips', [TripController::class, 'driverTrips']);
        Route::get('/client/trips', [TripController::class, 'clientTrips']);
    });

    Route::get('/request-photos/{photo}/view', [RequestPhotoController::class, 'show'])
        ->middleware('auth-api')
        ->name('request-photos.view');

    Route::delete('/request-photos/{photo}', [RequestPhotoController::class, 'destroy'])
        ->middleware('auth-api');

    Route::prefix('admin/driver')->middleware('auth-api')->group(function () {
        Route::get('/pending', [DriverVerificationController::class, 'listPending']);
        Route::get('/documents/pending', [DriverVerificationController::class, 'listPendingDocuments']);
        Route::post('/documents/{document}/approve', [DriverVerificationController::class, 'approveDocument']);
        Route::post('/documents/{document}/reject', [DriverVerificationController::class, 'rejectDocument']);
        Route::post('/{driverProfile}/approve', [DriverVerificationController::class, 'approveDriver']);
        Route::post('/{driverProfile}/reject', [DriverVerificationController::class, 'rejectDriver']);
    });
});
