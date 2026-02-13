<?php

// NOTE: Saat memakai cookie HttpOnly lintas origin, pastikan CORS mengizinkan origin frontend
// melalui env CORS_ALLOWED_ORIGINS (comma-separated).
return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],

    // Batasi metode hanya yang dibutuhkan
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    // Wajib diisi di .env untuk production (comma-separated)
    // Contoh: https://yayasanalittihadiyyah.com,https://www.yayasanalittihadiyyah.com
    'allowed_origins' => env('CORS_ALLOWED_ORIGINS')
        ? array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS')))
        : [env('APP_URL', 'http://localhost:8000')],

    'allowed_origins_patterns' => [],

    // Batasi header yang diizinkan
    'allowed_headers' => [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
    ],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
