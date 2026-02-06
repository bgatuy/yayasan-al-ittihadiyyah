<?php

namespace App\Http\Controllers;

use App\Models\PpdbPage;
use App\Models\Ppdb;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PpdbController extends Controller
{
    // Menampilkan data pendaftar PPDB (untuk Admin) dengan filter dan paginasi
    public function index(Request $request)
    {
        $query = Ppdb::latest();

        $requestedTahunAjaran = $request->input('tahun_ajaran');

        if ($requestedTahunAjaran === 'all') {
            // Jika 'all' diminta, tidak ada filter tahun_ajaran
        } elseif ($requestedTahunAjaran) {
            // Filter berdasarkan tahun_ajaran yang spesifik jika disediakan
            $query->where('tahun_ajaran', $requestedTahunAjaran);
        } else {
            // Jika tidak ada tahun_ajaran yang ditentukan, default ke tahun ajaran aktif dari PpdbPage
            $ppdbPageSettings = PpdbPage::first();
            if ($ppdbPageSettings && $ppdbPageSettings->tahun_ajaran) {
                $query->where('tahun_ajaran', $ppdbPageSettings->tahun_ajaran);
            }
        }

        // Filter by search term
        if ($request->has('search') && !empty($request->input('search'))) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('nama_lengkap', 'like', "%{$searchTerm}%")
                  ->orWhere('id', 'like', "%{$searchTerm}%")
                  ->orWhere('nomor_wa', 'like', "%{$searchTerm}%");
            });
        }

        // Filter by jenjang
        if ($request->has('jenjang') && !empty($request->input('jenjang'))) {
            $query->where('jenjang', $request->input('jenjang'));
        }

        // Filter by status
        if ($request->has('status') && !empty($request->input('status'))) {
            $query->where('status', $request->input('status'));
        }

        // Filter by gelombang
        if ($request->has('gelombang') && !empty($request->input('gelombang'))) {
            $query->where('gelombang', $request->input('gelombang'));
        }

        // Pagination
        $perPage = $request->input('per_page', 10); // Default 10 items per page
        $data = $query->paginate($perPage)->withQueryString();

        return response()->json($data)
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    // Cek status pendaftaran (Public)
    // Hanya mengembalikan data yang relevan untuk publik.
    public function checkStatus($id)
    {
        // Use `where()->first()` for robustness with custom string IDs,
        // as `find()` assumes an integer primary key by default.
        $ppdb = Ppdb::where('id', $id)->first();
        if (!$ppdb) return response()->json(['message' => 'Data tidak ditemukan'], 404);
        
        return response()->json([
            'id' => $ppdb->id,
            'nama_lengkap' => $ppdb->nama_lengkap,
            'jenjang' => $ppdb->jenjang,
            'status' => $ppdb->status,
            'gelombang' => $ppdb->gelombang,
            'tahun_ajaran' => $ppdb->tahun_ajaran, // Tambahkan tahun_ajaran
            'created_at' => $ppdb->created_at,
        ])
        ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
        ->header('Pragma', 'no-cache')
        ->header('Expires', '0');
    }

    // Form Pendaftaran (Public)
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'nama_lengkap'   => 'required|string|max:255',
            'nama_panggilan' => 'required|string|max:100',
            'jenis_kelamin'  => 'required|in:L,P',
            'jenjang'        => 'required|in:TK,MI',
            'tempat_lahir'   => 'required|string',
            'tanggal_lahir'  => 'required|date',
            'nama_orang_tua' => 'required|string',
            'nomor_wa'       => 'required|string',
            'email'          => 'required|email',
            'asal_sekolah'   => 'required_if:jenjang,MI|nullable|string', // Hanya wajib jika jenjang MI
            'gelombang'      => 'required|string',
            'alamat'         => 'required|string',
            'tahun_ajaran'   => 'required|string|max:9', // Tambahkan validasi untuk tahun_ajaran
        ]);

        // Generate Custom ID yang lebih unik untuk menghindari kolisi: REG-20240116-A1B2C
        // Menggunakan 5 karakter dari uniqid() untuk probabilitas kolisi yang sangat rendah.
        $validatedData['id'] = 'REG-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5));
        
        // Status awal sesuai aturan: "Menunggu Pembayaran"
        $validatedData['status'] = 'Menunggu Pembayaran';

        // Bukti bayar tidak di-handle saat pendaftaran awal.
        unset($validatedData['bukti_bayar']);
        
        $ppdb = Ppdb::create($validatedData);

        return response()->json([
            'message' => 'Pendaftaran berhasil! Silakan lanjutkan ke tahap pembayaran.',
            'data'    => $ppdb
        ], 201);
    }

    // Detail Pendaftar
    public function show($id)
    {
        $ppdb = Ppdb::where('id', $id)->first();
        if (!$ppdb) return response()->json(['message' => 'Data tidak ditemukan'], 404);
        return response()->json($ppdb)
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    // Upload bukti pembayaran (Public)
    public function uploadPaymentProof(Request $request, $id)
    {
        $ppdb = Ppdb::where('id', $id)->first();
        if (!$ppdb) return response()->json(['message' => 'Data pendaftaran tidak ditemukan'], 404);

        // Aturan: Hanya boleh upload jika status 'Menunggu Pembayaran'
        if ($ppdb->status !== 'Menunggu Pembayaran') {
            return response()->json(['message' => 'Tidak dapat mengupload bukti pembayaran untuk status saat ini.'], 403);
        }

        $request->validate([
            'bukti_bayar' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        if ($request->hasFile('bukti_bayar')) {
            $path = $request->file('bukti_bayar')->store('ppdb_proofs', 'public');
            $ppdb->bukti_bayar = $path;
            // Aturan: Setelah upload, status berubah menjadi 'Menunggu Verifikasi'
            $ppdb->status = 'Menunggu Verifikasi'; 
            $ppdb->save();
        }

        return response()->json(['message' => 'Bukti pembayaran berhasil diupload.', 'data' => $ppdb]);
    }

    // Update Data / Status (Admin)
    public function update(Request $request, $id)
    {
        $ppdb = Ppdb::where('id', $id)->first();
        if (!$ppdb) return response()->json(['message' => 'Data tidak ditemukan'], 404);

        // Validasi semua field yang boleh diubah oleh admin untuk keamanan.
        // 'sometimes' berarti validasi hanya berjalan jika field ada di request.
        $validatedData = $request->validate([
            'nama_lengkap'   => 'sometimes|required|string|max:255',
            'nama_panggilan' => 'sometimes|required|string|max:100',
            'jenis_kelamin'  => 'sometimes|required|in:L,P',
            'jenjang'        => 'sometimes|required|in:TK,MI',
            'tempat_lahir'   => 'sometimes|required|string',
            'tanggal_lahir'  => 'sometimes|required|date',
            'nama_orang_tua' => 'sometimes|required|string',
            'nomor_wa'       => 'sometimes|required|string',
            'email'          => 'sometimes|nullable|email',
            'asal_sekolah'   => 'required_if:jenjang,MI|nullable|string',
            'alamat'         => 'sometimes|required|string',
            'gelombang'      => 'sometimes|required|string',
            'tahun_ajaran'   => 'sometimes|nullable|string|max:9', // Tambahkan validasi untuk tahun_ajaran
            'status'         => 'sometimes|required|in:Menunggu Pembayaran,Menunggu Verifikasi,Terverifikasi,Diterima,Tidak Diterima',
            'bukti_bayar'    => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        // Jika ada update bukti bayar baru (jarang terjadi, tapi fitur disiapkan)
        if ($request->hasFile('bukti_bayar')) {
            if ($ppdb->bukti_bayar && Storage::disk('public')->exists($ppdb->bukti_bayar)) {
                Storage::disk('public')->delete($ppdb->bukti_bayar);
            }
            $validatedData['bukti_bayar'] = $request->file('bukti_bayar')->store('ppdb_proofs', 'public');
        }

        $ppdb->update($validatedData);

        return response()->json([
            'message' => 'Data pendaftar berhasil diperbarui',
            'data'    => $ppdb
        ]);
    }

    // Hapus Data
    public function destroy($id)
    {
        $ppdb = Ppdb::where('id', $id)->first();
        if (!$ppdb) return response()->json(['message' => 'Data tidak ditemukan'], 404);

        if ($ppdb->bukti_bayar && Storage::disk('public')->exists($ppdb->bukti_bayar)) {
            Storage::disk('public')->delete($ppdb->bukti_bayar);
        }

        $ppdb->delete();
        return response()->json(['message' => 'Data berhasil dihapus']);
    }

    // Mengambil daftar tahun ajaran unik yang ada di database
    public function getAcademicYears()
    {
        $years = Ppdb::select('tahun_ajaran')
                     ->distinct()
                     ->orderBy('tahun_ajaran', 'desc')
                     ->pluck('tahun_ajaran');

        return response()->json($years);
    }
}