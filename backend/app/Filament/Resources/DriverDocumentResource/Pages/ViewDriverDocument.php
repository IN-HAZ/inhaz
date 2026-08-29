<?php

namespace App\Filament\Resources\DriverDocumentResource\Pages;

use App\Enums\DriverProfileStatus;
use App\Filament\Resources\DriverDocumentResource;
use App\Services\DriverVerificationService;
use Filament\Actions\Action;
use Filament\Forms\Components\Textarea;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ViewRecord;

class ViewDriverDocument extends ViewRecord
{
    protected static string $resource = DriverDocumentResource::class;

    protected static ?string $title = 'Détails du Document';

    protected function getHeaderActions(): array
    {
        return [
            Action::make('approve')
                ->label('Approuver')
                ->color('success')
                ->icon('heroicon-o-check-circle')
                ->requiresConfirmation()
                ->modalHeading('Approuver ce document ?')
                ->visible(fn (): bool => $this->record->status !== DriverProfileStatus::Approved)
                ->action(function () {
                    app(DriverVerificationService::class)
                        ->approveDocument($this->record, auth()->id());

                    Notification::make()
                        ->title('Document approuvé')
                        ->success()
                        ->send();
                }),

            Action::make('reject')
                ->label('Rejeter')
                ->color('danger')
                ->icon('heroicon-o-x-circle')
                ->requiresConfirmation()
                ->modalHeading('Rejeter ce document')
                ->form([
                    Textarea::make('rejection_reason')
                        ->label('Raison du rejet')
                        ->required()
                        ->maxLength(500),
                ])
                ->visible(fn (): bool => $this->record->status !== DriverProfileStatus::Approved)
                ->action(function (array $data) {
                    app(DriverVerificationService::class)
                        ->rejectDocument($this->record, auth()->id(), $data['rejection_reason']);

                    Notification::make()
                        ->title('Document rejeté')
                        ->success()
                        ->send();
                }),
        ];
    }
}
