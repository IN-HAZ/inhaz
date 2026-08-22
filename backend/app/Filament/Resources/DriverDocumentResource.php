<?php

namespace App\Filament\Resources;

use App\Filament\Resources\DriverDocumentResource\Pages;
use App\Models\DriverDocument;
use Filament\Actions;
use Filament\Infolists\Components\TextEntry;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

class DriverDocumentResource extends Resource
{
    protected static ?string $model = DriverDocument::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-document-text';

    protected static ?string $navigationLabel = 'Documents';

    protected static ?string $modelLabel = 'Document';

    protected static ?string $modelLabelPlural = 'Documents';

    protected static ?string $slug = 'driver-documents';

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('ID')
                    ->sortable(),
                Tables\Columns\TextColumn::make('driverProfile.user.phone')
                    ->label('Chauffeur')
                    ->searchable(),
                Tables\Columns\TextColumn::make('type')
                    ->label('Type')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'CIN' => 'info',
                        'REGISTRATION' => 'primary',
                        'INSURANCE' => 'warning',
                        'DRIVING_LICENSE' => 'success',
                    }),
                Tables\Columns\TextColumn::make('status')
                    ->label('Statut')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'PENDING' => 'warning',
                        'APPROVED' => 'success',
                        'REJECTED' => 'danger',
                    }),
                Tables\Columns\TextColumn::make('expires_at')
                    ->label('Expire le')
                    ->dateTime('d/m/Y')
                    ->placeholder('Pas de limite'),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Uploadé le')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Statut')
                    ->options([
                        'PENDING' => 'En attente',
                        'APPROVED' => 'Approuvé',
                        'REJECTED' => 'Rejeté',
                    ]),
                Tables\Filters\SelectFilter::make('type')
                    ->label('Type')
                    ->options([
                        'CIN' => 'CIN',
                        'REGISTRATION' => 'Carte grise',
                        'INSURANCE' => 'Assurance',
                        'DRIVING_LICENSE' => 'Permis',
                    ]),
            ])
            ->actions([
                Actions\ViewAction::make(),
            ]);
    }

    public static function infolist(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Informations')
                ->components([
                    TextEntry::make('type')
                        ->label('Type')
                        ->badge()
                        ->color(fn (string $state): string => match ($state) {
                            'CIN' => 'info',
                            'REGISTRATION' => 'primary',
                            'INSURANCE' => 'warning',
                            'DRIVING_LICENSE' => 'success',
                        }),
                    TextEntry::make('status')
                        ->label('Statut')
                        ->badge()
                        ->color(fn (string $state): string => match ($state) {
                            'PENDING' => 'warning',
                            'APPROVED' => 'success',
                            'REJECTED' => 'danger',
                        }),
                    TextEntry::make('driverProfile.user.phone')
                        ->label('Chauffeur'),
                    TextEntry::make('expires_at')
                        ->label('Expire le')
                        ->dateTime('d/m/Y')
                        ->placeholder('Pas de limite'),
                    TextEntry::make('rejection_reason')
                        ->label('Raison du rejet')
                        ->placeholder('Aucune'),
                    TextEntry::make('created_at')
                        ->label('Uploadé le')
                        ->dateTime('d/m/Y H:i'),
                ]),
        ]);
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->schema([]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListDriverDocuments::route('/'),
            'view' => Pages\ViewDriverDocument::route('/{record}'),
        ];
    }
}
