<?php

namespace App\Filament\Resources\DriverProfileResource\RelationManagers;

use App\Enums\DocumentType;
use App\Enums\DriverProfileStatus;
use App\Services\DriverVerificationService;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Forms\Components\Textarea;
use Filament\Notifications\Notification;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class DocumentsRelationManager extends RelationManager
{
    protected static string $relationship = 'documents';

    protected static ?string $title = 'Documents du chauffeur';

    public function form(Schema $schema): Schema
    {
        return $schema->schema([]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('type')
            ->columns([
                TextColumn::make('id')
                    ->label('ID')
                    ->sortable(),
                TextColumn::make('type')
                    ->label('Type')
                    ->badge()
                    ->color(fn (DocumentType $state): string => match ($state) {
                        DocumentType::Cin => 'info',
                        DocumentType::Registration => 'primary',
                        DocumentType::Insurance => 'warning',
                        DocumentType::DrivingLicense => 'success',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (DocumentType $state): string => $state->value),
                TextColumn::make('file')
                    ->label('Fichier')
                    ->formatStateUsing(fn (string $state): string => basename($state)),
                TextColumn::make('status')
                    ->label('Statut')
                    ->badge()
                    ->color(fn (DriverProfileStatus $state): string => match ($state) {
                        DriverProfileStatus::Pending => 'warning',
                        DriverProfileStatus::Approved => 'success',
                        DriverProfileStatus::Rejected => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (DriverProfileStatus $state): string => $state->value),
                TextColumn::make('rejection_reason')
                    ->label('Raison rejet')
                    ->limit(30)
                    ->placeholder('—'),
                TextColumn::make('expires_at')
                    ->label('Expire le')
                    ->dateTime('d/m/Y')
                    ->placeholder('Pas de limite'),
                TextColumn::make('created_at')
                    ->label('Uploadé le')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->headerActions([
            ])
            ->recordActions([
                Action::make('view_file')
                    ->label('Voir')
                    ->icon('heroicon-o-eye')
                    ->color('info')
                    ->url(fn ($record): string => route('documents.view', $record))
                    ->openUrlInNewTab(),

                Action::make('approve')
                    ->label('Approuver')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->visible(fn ($record): bool => $record->status !== DriverProfileStatus::Approved)
                    ->requiresConfirmation()
                    ->modalHeading('Approuver ce document ?')
                    ->action(function ($record) {
                        app(DriverVerificationService::class)
                            ->approveDocument($record, auth()->id());

                        Notification::make()
                            ->title('Document approuvé')
                            ->success()
                            ->send();
                    }),

                Action::make('reject')
                    ->label('Rejeter')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->visible(fn ($record): bool => $record->status !== DriverProfileStatus::Approved)
                    ->requiresConfirmation()
                    ->modalHeading('Rejeter ce document')
                    ->form([
                        Textarea::make('rejection_reason')
                            ->label('Raison du rejet')
                            ->required()
                            ->maxLength(500),
                    ])
                    ->action(function ($record, array $data) {
                        app(DriverVerificationService::class)
                            ->rejectDocument($record, auth()->id(), $data['rejection_reason']);

                        Notification::make()
                            ->title('Document rejeté')
                            ->success()
                            ->send();
                    }),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                ]),
            ]);
    }
}
