<?php

namespace App\Http\Controllers;

use App\Models\Ppdb;

class DashboardController extends Controller
{
    public function index()
    {
        // Mengambil semua statistik dalam satu query untuk efisiensi (Conditional Aggregation)
        $stats = Ppdb::selectRaw("count(*) as total")
            ->selectRaw("count(case when jenjang = 'TK' then 1 end) as total_tk")
            ->selectRaw("count(case when jenjang = 'MI' then 1 end) as total_mi")
            ->selectRaw("count(case when status = 'Diterima' then 1 end) as diterima")
            ->selectRaw("count(case when status IN ('Menunggu Pembayaran', 'Menunggu Verifikasi', 'Terverifikasi') then 1 end) as pending")
            ->first();

        // hitung persentase (hindari bagi 0)
        $persenDiterima = $stats->total > 0 ? round(($stats->diterima / $stats->total) * 100) : 0;
        $persenPending  = $stats->total > 0 ? round(($stats->pending / $stats->total) * 100) : 0;

        // pendaftar terbaru (5)
        // [REVERT] Mengembalikan data lengkap untuk 5 pendaftar terbaru.
        // Panel admin membutuhkan ini untuk menampilkan modal detail.
        $terbaru = Ppdb::latest()
            ->limit(5)
            ->get();

        return response()->json([
            'statistik' => [
                'total_pendaftar' => $stats->total,
                'pendaftar_tk'    => $stats->total_tk,
                'pendaftar_mi'    => $stats->total_mi,
            ],
            'status_penerimaan' => [
                'diterima' => $persenDiterima,
                'menunggu' => $persenPending,
            ],
            'pendaftar_terbaru' => $terbaru
        ])
        ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
        ->header('Pragma', 'no-cache')
        ->header('Expires', '0');
    }
}
