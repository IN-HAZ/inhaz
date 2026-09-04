<?php

return [
    /*
    |--------------------------------------------------------------------------
    | inHAZ Platform Configuration Settings
    |--------------------------------------------------------------------------
    |
    | Configuration options for driver commission limits, pricing grids,
    | and operational thresholds across the inHAZ platform.
    |
    */

    'max_commission_debt_mad' => (float) env('MAX_COMMISSION_DEBT_MAD', 200.00),

    'default_commission_rate' => (float) env('DEFAULT_COMMISSION_RATE', 0.10),

    'location_update_interval_sec' => (int) env('LOCATION_UPDATE_INTERVAL_SEC', 10),
];
