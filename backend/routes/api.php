<?php

use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NewsController;
use App\Http\Controllers\PpdbController;
use App\Http\Controllers\GaleriController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PrestasiController;
use App\Http\Controllers\GuruStaffController;
use App\Http\Controllers\AuthController; // Import AuthController
use App\Http\Controllers\PpdbPageController;
use App\Http\Controllers\AkademikController;

/*
 |--------------------------------------------------------------------------
 | PUBLIC ROUTES (Bisa diakses siapa saja)
 |--------------------------------------------------------------------------
 */

// AUTHENTICATION
// [KEAMANAN] Menambahkan Rate Limiting untuk mencegah serangan Brute Force.
// Membatasi 5 percobaan login dari 1 IP dalam 1 menit.
Route::post('/login', [AuthController::class, 'login']);

// 1. BERITA
Route::get('/news', [NewsController::class, 'index']);
Route::get('/news/{id}', [NewsController::class, 'show']);

// 2. PPDB (Pendaftaran)
Route::post('/ppdb', [PpdbController::class, 'store']); // Endpoint pendaftaran
Route::get('/ppdb/status/{id}', [PpdbController::class, 'checkStatus']); // Endpoint cek status publik
Route::post('/ppdb/{id}/payment', [PpdbController::class, 'uploadPaymentProof']); // Endpoint upload bukti bayar

// 3. GALERI
Route::get('/galeri', [GaleriController::class, 'index']);

// 4. GURU & STAFF
Route::get('/guru', [GuruStaffController::class, 'index']);
Route::get('/guru/{id}', [GuruStaffController::class, 'show']);

// 5. PRESTASI
Route::get('/prestasi', [PrestasiController::class, 'index']); // Filter jenjang via query string ?jenjang=TK
Route::get('/prestasi/{id}', [PrestasiController::class, 'show']); // Detail prestasi (URL disederhanakan)

// 6. PPDB PAGE SETTINGS
Route::get('/ppdb-page', [PpdbPageController::class, 'index']);

// 7. AKADEMIK (TK, MI - Info Kurikulum, Biaya, dll)
Route::get('/akademik/{jenjang}', [AkademikController::class, 'show']);


/*
 |--------------------------------------------------------------------------
 | ADMIN ROUTES (Wajib menggunakan middleware auth:sanctum)
 |--------------------------------------------------------------------------
 */
// ================= ADMIN ROUTES =================
Route::prefix('admin')->middleware('auth:sanctum')->group(function () {
    // DASHBOARD
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // MANAJEMEN BERITA
    Route::post('/news', [NewsController::class, 'store']);
    Route::post('/news/{id}', [NewsController::class, 'update']);
    Route::delete('/news/{id}', [NewsController::class, 'destroy']);

    // MANAJEMEN GALERI
    Route::post('/galeri', [GaleriController::class, 'store']);
    Route::delete('/galeri/{id}', [GaleriController::class, 'destroy']);

    // MANAJEMEN GURU
    Route::post('/guru', [GuruStaffController::class, 'store']);
    Route::post('/guru/{id}', [GuruStaffController::class, 'update']);
    Route::delete('/guru/{id}', [GuruStaffController::class, 'destroy']);

    // MANAJEMEN PRESTASI
    Route::post('/prestasi', [PrestasiController::class, 'store']);
    Route::post('/prestasi/{id}', [PrestasiController::class, 'update']);
    Route::delete('/prestasi/{id}', [PrestasiController::class, 'destroy']);

    // MANAJEMEN PPDB
    Route::get('/ppdb', [PpdbController::class, 'index']);
    Route::get('/ppdb/{id}', [PpdbController::class, 'show']); // Detail untuk admin
    Route::post('/ppdb/{id}', [PpdbController::class, 'update']);
    Route::delete('/ppdb/{id}', [PpdbController::class, 'destroy']);

    // MANAJEMEN HALAMAN PPDB
    Route::post('/ppdb-page', [PpdbPageController::class, 'store']);

    // MANAJEMEN AKADEMIK
    Route::post('/akademik/{jenjang}', [AkademikController::class, 'update']);
});
