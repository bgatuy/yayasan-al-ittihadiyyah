<?php

namespace App\Http\Controllers;

use App\Models\Ppdb;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PpdbController extends Controller
{
    // Menampilkan semua data (untuk Admin)
    public function index()
    {
        $data = Ppdb::latest()->get();
        return response()->json($data); // Endpoint ini untuk admin, mengembalikan semua data.
    }

    // Cek status pendaftaran (Public)
    // Hanya mengembalikan data yang relevan untuk publik.
    public function checkStatus($id)
    {
        // Use `where()->first()` for robustness with custom string IDs,
        // as `find()` assumes an integer primary key by default.
        $ppdb = Ppdb::where('id', $id)->first();
        if (!$ppdb) return response()->json(['message' => 'Data tidak ditemukan'], 404);
        return response()->json($ppdb->only(['id', 'nama_lengkap', 'jenjang', 'status', 'gelombang', 'created_at']));
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
        return response()->json($ppdb);
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
}