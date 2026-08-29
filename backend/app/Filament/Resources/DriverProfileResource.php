<?php

namespace App\Filament\Resources;

use App\Filament\Resources\DriverProfileResource\Pages;
use App\Filament\Resources\DriverProfileResource\RelationManagers\DocumentsRelationManager;
use App\Models\DriverProfile;
use Filament\Actions;
use Filament\Infolists\Components\TextEntry;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables;

class DriverProfileResource extends Resource
{
    protected static ?string $model = DriverProfile::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-user-group';

    protected static ?string $navigationLabel = 'Chauffeurs';

    protected static ?string $modelLabel = 'Chauffeur';

    protected static ?string $modelLabelPlural = 'Chauffeurs';

    protected static ?string $slug = 'drivers';

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('ID')
                    ->sortable(),
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Nom')
                    ->searchable()
                    ->placeholder('—'),
                Tables\Columns\TextColumn::make('user.phone')
                    ->label('Téléphone')
                    ->searchable(),
                Tables\Columns\TextColumn::make('status')
                    ->label('Statut')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'PENDING' => 'warning',
                        'APPROVED' => 'success',
                        'REJECTED' => 'danger',
                    }),
                Tables\Columns\TextColumn::make('vehicle.brand')
                    ->label('Véhicule')
                    ->formatStateUsing(fn ($state, DriverProfile $record): string => $record->vehicle ? "{$record->vehicle->brand} {$record->vehicle->model}" : '—'
                    ),
                Tables\Columns\TextColumn::make('documents_count')
                    ->counts('documents')
                    ->label('Documents'),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Créé le')
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
            ])
            ->actions([
                Actions\ViewAction::make(),
            ]);
    }

    public static function infolist(Schema $schema): Schema
    {
        $requiredDocs = [
            'CIN' => 'Carte Nationale d\'Identité',
            'REGISTRATION' => 'Carte grise du véhicule',
            'INSURANCE' => 'Assurance auto',
            'DRIVING_LICENSE' => 'Permis de conduire',
        ];

        return $schema->components([
            Section::make('Informations')
                ->components([
                    TextEntry::make('user.name')
                        ->label('Nom')
                        ->placeholder('—'),
                    TextEntry::make('user.phone')
                        ->label('Téléphone'),
                    TextEntry::make('status')
                        ->label('Statut')
                        ->badge()
                        ->color(fn (string $state): string => match ($state) {
                            'PENDING' => 'warning',
                            'APPROVED' => 'success',
                            'REJECTED' => 'danger',
                        }),
                    TextEntry::make('rejection_reason')
                        ->label('Raison du rejet')
                        ->placeholder('Aucune'),
                    TextEntry::make('created_at')
                        ->label('Créé le')
                        ->dateTime('d/m/Y H:i'),
                ]),
            Section::make('Véhicule')
                ->components([
                    TextEntry::make('vehicle.brand')
                        ->label('Marque')
                        ->placeholder('Non renseigné'),
                    TextEntry::make('vehicle.model')
                        ->label('Modèle')
                        ->placeholder('Non renseigné'),
                    TextEntry::make('vehicle.registration_number')
                        ->label('Immatriculation')
                        ->placeholder('Non renseigné'),
                ]),
            Section::make('Documents requis')
                ->description('4 documents requis pour l\'approbation du chauffeur. Cliquez pour voir le fichier.')
                ->components(array_map(function (string $type, string $label) {
                    return TextEntry::make("document_{$type}")
                        ->label($label)
                        ->state(function (DriverProfile $record) use ($type): string {
                            $doc = $record->documents->firstWhere('type', $type);
                            if (! $doc) {
                                return 'NON UPLOADÉ';
                            }

                            return $doc->status;
                        })
                        ->badge()
                        ->color(fn (string $state): string => match ($state) {
                            'APPROVED' => 'success',
                            'PENDING' => 'warning',
                            'REJECTED' => 'danger',
                            default => 'gray',
                        })
                        ->url(function (DriverProfile $record) use ($type): ?string {
                            $doc = $record->documents->firstWhere('type', $type);
                            if (! $doc) {
                                return null;
                            }

                            return route('documents.view', $doc);
                        })
                        ->openUrlInNewTab()
                        ->visible(function (DriverProfile $record) use ($type): bool {
                            return $record->documents->firstWhere('type', $type) !== null;
                        });
                }, array_keys($requiredDocs), array_values($requiredDocs))),
        ]);
    }

    public static function getRelations(): array
    {
        return [
            DocumentsRelationManager::class,
        ];
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->schema([]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListDriverProfiles::route('/'),
            'view' => Pages\ViewDriverProfile::route('/{record}'),
        ];
    }
}
