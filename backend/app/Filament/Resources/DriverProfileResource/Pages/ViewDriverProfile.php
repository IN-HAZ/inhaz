<?php

namespace App\Filament\Resources\DriverProfileResource\Pages;

use App\Enums\DriverProfileStatus;
use App\Filament\Resources\DriverProfileResource;
use App\Services\DriverVerificationService;
use Filament\Actions\Action;
use Filament\Forms\Components\Textarea;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ViewRecord;

class ViewDriverProfile extends ViewRecord
{
    protected static string $resource = DriverProfileResource::class;

    protected static ?string $title = 'Détails du Chauffeur';

    protected function getHeaderActions(): array
    {
        return [
            Action::make('approve')
                ->label('Approuver')
                ->color('success')
                ->icon('heroicon-o-check-circle')
                ->requiresConfirmation()
                ->modalHeading('Approuver ce chauffeur ?')
                ->modalDescription('Le chauffeur pourra recevoir des courses.')
                ->visible(fn (): bool => $this->record->status !== DriverProfileStatus::Approved)
                ->action(function () {
                    app(DriverVerificationService::class)
                        ->approveDriver($this->record, auth()->id());

                    Notification::make()
                        ->title('Chauffeur approuvé')
                        ->success()
                        ->send();
                }),

            Action::make('reject')
                ->label('Rejeter')
                ->color('danger')
                ->icon('heroicon-o-x-circle')
                ->requiresConfirmation()
                ->modalHeading('Rejeter ce chauffeur')
                ->form([
                    Textarea::make('rejection_reason')
                        ->label('Raison du rejet')
                        ->required()
                        ->maxLength(500),
                ])
                ->visible(fn (): bool => $this->record->status !== DriverProfileStatus::Approved)
                ->action(function (array $data) {
                    app(DriverVerificationService::class)
                        ->rejectDriver($this->record, auth()->id(), $data['rejection_reason']);

                    Notification::make()
                        ->title('Chauffeur rejeté')
                        ->success()
                        ->send();
                }),
        ];
    }
}
