<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_filter(explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:8081,http://localhost:19006'))),
    'allowed_origins_patterns' => array_map('strval', array_filter(explode(',', env('CORS_ALLOWED_ORIGINS_PATTERNS', '')))),
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
