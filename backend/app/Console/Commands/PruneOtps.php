<?php

namespace App\Console\Commands;

use App\Models\Otp;
use Illuminate\Console\Command;

class PruneOtps extends Command
{
    protected $signature = 'otp:purge {--days=1 : Purge OTPs older than this many days}';

    protected $description = 'Delete expired and used OTP records older than the retention window';

    public function handle(): int
    {
        $count = Otp::where('expires_at', '<', now()->subDays((int) $this->option('days')))
            ->orWhere(fn ($query) => $query->where('used', true)->where('updated_at', '<', now()->subDays((int) $this->option('days'))))
            ->delete();

        $this->info("Purged {$count} OTP record(s).");

        return self::SUCCESS;
    }
}
