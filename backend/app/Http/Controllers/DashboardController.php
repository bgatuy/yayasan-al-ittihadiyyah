<?php

namespace App\Http\Controllers;

use App\Models\Ppdb;
use App\Models\PpdbPage;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Menghasilkan statistik untuk halaman dashboard admin.
     * Semua data difilter berdasarkan tahun ajaran aktif.
     */
    public function index()
    {
        // 1. Ambil tahun ajaran yang aktif dari pengaturan halaman PPDB.
        $activeYear = PpdbPage::first()->tahun_ajaran ?? null;

        // 2. Siapkan struktur data default.
        $stats = [
            'total_pendaftar' => 0,
            'pendaftar_tk' => 0,
            'pendaftar_mi' => 0,
        ];
        $statusPenerimaan = [
            'diterima' => 0,
            'menunggu' => 0,
        ];
        $pendaftarTerbaru = [];

        // 3. Hanya hitung statistik jika ada tahun ajaran yang aktif.
        if ($activeYear) {
            // Buat query dasar yang sudah difilter berdasarkan tahun ajaran aktif.
            $baseQuery = Ppdb::where('tahun_ajaran', $activeYear);

            // Hitung statistik utama
            $stats['total_pendaftar'] = (clone $baseQuery)->count();
            $stats['pendaftar_tk'] = (clone $baseQuery)->where('jenjang', 'TK')->count();
            $stats['pendaftar_mi'] = (clone $baseQuery)->where('jenjang', 'MI')->count();

            // Hitung persentase status penerimaan
            if ($stats['total_pendaftar'] > 0) {
                $diterimaCount = (clone $baseQuery)->where('status', 'Diterima')->count();
                $menungguCount = (clone $baseQuery)->whereIn('status', ['Menunggu Pembayaran', 'Menunggu Verifikasi'])->count();
                
                $statusPenerimaan['diterima'] = round(($diterimaCount / $stats['total_pendaftar']) * 100);
                $statusPenerimaan['menunggu'] = round(($menungguCount / $stats['total_pendaftar']) * 100);
            }

            // Ambil 5 pendaftar terbaru dari tahun ajaran aktif
            $pendaftarTerbaru = (clone $baseQuery)->latest()->take(5)->get();
        }

        // 4. Kembalikan data dalam format JSON yang konsisten.
        return response()->json([
            'statistik' => $stats,
            'status_penerimaan' => $statusPenerimaan,
            'pendaftar_terbaru' => $pendaftarTerbaru,
        ]);
    }
}