<?php

namespace Tests\Feature;

use App\Models\DeliveryRequest;
use App\Models\RequestPhoto;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RequestPhotoApiTest extends TestCase
{
    use RefreshDatabase;

    private User $client;

    private DeliveryRequest $request;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client = User::factory()->create(['role' => 'client']);
        $this->request = DeliveryRequest::factory()->create([
            'user_id' => $this->client->id,
            'status' => 'DRAFT',
        ]);
        Storage::fake('private');
    }

    public function test_unauthenticated_user_cannot_upload_photo(): void
    {
        $file = UploadedFile::fake()->image('photo.jpg');

        $response = $this->postJson("/api/v1/requests/{$this->request->id}/photos", [
            'file' => $file,
        ]);

        $response->assertStatus(401);
    }

    public function test_client_can_upload_photo(): void
    {
        $file = UploadedFile::fake()->image('photo.jpg');

        $response = $this->actingAs($this->client)->postJson("/api/v1/requests/{$this->request->id}/photos", [
            'file' => $file,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'photo' => ['id', 'file_name', 'file_type', 'file_size', 'url'],
            ]);

        $this->assertDatabaseHas('request_photos', [
            'delivery_request_id' => $this->request->id,
            'file_name' => 'photo.jpg',
            'file_type' => 'image/jpeg',
        ]);
    }

    public function test_client_can_upload_pdf(): void
    {
        $file = UploadedFile::fake()->create('document.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->client)->postJson("/api/v1/requests/{$this->request->id}/photos", [
            'file' => $file,
        ]);

        $response->assertStatus(201);
    }

    public function test_rejects_invalid_file_type(): void
    {
        $file = UploadedFile::fake()->create('file.exe', 100, 'application/exe');

        $response = $this->actingAs($this->client)->postJson("/api/v1/requests/{$this->request->id}/photos", [
            'file' => $file,
        ]);

        $response->assertStatus(422);
    }

    public function test_rejects_oversized_file(): void
    {
        $file = UploadedFile::fake()->create('large.jpg', 15000, 'image/jpeg');

        $response = $this->actingAs($this->client)->postJson("/api/v1/requests/{$this->request->id}/photos", [
            'file' => $file,
        ]);

        $response->assertStatus(422);
    }

    public function test_cannot_upload_to_other_users_request(): void
    {
        $otherUser = User::factory()->create(['role' => 'client']);
        $otherRequest = DeliveryRequest::factory()->create(['user_id' => $otherUser->id]);
        $file = UploadedFile::fake()->image('photo.jpg');

        $response = $this->actingAs($this->client)->postJson("/api/v1/requests/{$otherRequest->id}/photos", [
            'file' => $file,
        ]);

        $response->assertStatus(403);
    }

    public function test_cannot_upload_to_matched_request(): void
    {
        $this->request->update(['status' => 'MATCHED']);
        $file = UploadedFile::fake()->image('photo.jpg');

        $response = $this->actingAs($this->client)->postJson("/api/v1/requests/{$this->request->id}/photos", [
            'file' => $file,
        ]);

        $response->assertStatus(422);
    }

    public function test_client_can_list_photos(): void
    {
        RequestPhoto::factory()->count(3)->create([
            'delivery_request_id' => $this->request->id,
        ]);

        $response = $this->actingAs($this->client)->getJson("/api/v1/requests/{$this->request->id}/photos");

        $response->assertOk()
            ->assertJsonCount(3, 'photos');
    }

    public function test_client_cannot_list_other_users_photos(): void
    {
        $otherUser = User::factory()->create(['role' => 'client']);
        $otherRequest = DeliveryRequest::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($this->client)->getJson("/api/v1/requests/{$otherRequest->id}/photos");

        $response->assertStatus(403);
    }

    public function test_client_can_delete_photo(): void
    {
        $photo = RequestPhoto::factory()->create([
            'delivery_request_id' => $this->request->id,
            'file_path' => 'request-photos/'.$this->request->id.'/test.jpg',
        ]);

        $response = $this->actingAs($this->client)->deleteJson("/api/v1/request-photos/{$photo->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('request_photos', ['id' => $photo->id]);
    }

    public function test_cannot_delete_other_users_photo(): void
    {
        $otherUser = User::factory()->create(['role' => 'client']);
        $otherRequest = DeliveryRequest::factory()->create(['user_id' => $otherUser->id]);
        $photo = RequestPhoto::factory()->create([
            'delivery_request_id' => $otherRequest->id,
        ]);

        $response = $this->actingAs($this->client)->deleteJson("/api/v1/request-photos/{$photo->id}");

        $response->assertStatus(403);
    }

    public function test_cannot_delete_photo_from_matched_request(): void
    {
        $this->request->update(['status' => 'MATCHED']);
        $photo = RequestPhoto::factory()->create([
            'delivery_request_id' => $this->request->id,
        ]);

        $response = $this->actingAs($this->client)->deleteJson("/api/v1/request-photos/{$photo->id}");

        $response->assertStatus(422);
    }
}
