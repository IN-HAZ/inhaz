<?php

namespace Tests\Feature;

use App\Enums\DocumentType;
use App\Enums\DriverProfileStatus;
use App\Enums\UserRole;
use App\Filament\Resources\DriverDocumentResource\Pages\ListDriverDocuments;
use App\Filament\Resources\DriverDocumentResource\Pages\ViewDriverDocument;
use App\Filament\Resources\DriverProfileResource\Pages\ListDriverProfiles;
use App\Models\DriverDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class FilamentTableSmokeTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => UserRole::Admin, 'password' => bcrypt('x')]);
    }

    private function document(): DriverDocument
    {
        $driver = User::factory()->create(['role' => UserRole::Driver]);
        $profile = $driver->driverProfile()->create(['status' => DriverProfileStatus::Pending]);

        return $profile->documents()->create([
            'type' => DocumentType::Cin,
            'file' => 'dummy/path',
            'status' => DriverProfileStatus::Pending,
        ]);
    }

    public function test_driver_documents_list_page_renders_without_errors(): void
    {
        $this->document();

        Livewire::actingAs($this->admin())
            ->test(ListDriverDocuments::class)
            ->assertOk();
    }

    public function test_driver_documents_view_page_renders_without_errors(): void
    {
        $document = $this->document();

        Livewire::actingAs($this->admin())
            ->test(ViewDriverDocument::class, ['record' => $document->getKey()])
            ->assertOk();
    }

    public function test_driver_profiles_list_page_renders_without_errors(): void
    {
        $this->document();

        Livewire::actingAs($this->admin())
            ->test(ListDriverProfiles::class)
            ->assertOk();
    }
}
