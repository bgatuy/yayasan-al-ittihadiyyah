<?php

namespace App\Http\Controllers;

use App\Models\Akademik;
use App\Models\Prestasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AkademikController extends Controller
{
    // GET /api/akademik/{jenjang}
    public function show($jenjang)
    {
        // Eager load relasi 'prestasi'
        $data = Akademik::with('prestasi')->where('jenjang', $jenjang)->first();

        if (!$data) {
            // Jika belum ada, return struktur default agar frontend tidak error
            return response()->json([
                'jenjang' => $jenjang,
                'deskripsi_kurikulum' => '',
                'poin_unggulan' => '',
                'prestasi' => [],
            ]);
        }

        // Tambahkan header untuk mencegah browser caching data ini
        return response()->json($data)
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    // POST /api/admin/akademik/{jenjang}
    public function update(Request $request, $jenjang)
    {
        // Gunakan transaksi database untuk memastikan semua operasi berhasil atau gagal bersamaan
        return DB::transaction(function () use ($request, $jenjang) {
            $validated = $request->validate([
                'hero_desc' => 'nullable|string',
                'kurikulum' => 'nullable|string',
                'jadwal' => 'nullable|string',
                'ekskul' => 'nullable|string',
                'biaya_masuk' => 'nullable|string',
                'biaya_bulanan' => 'nullable|string',
                'hero_image' => 'nullable|image|max:2048',
                'delete_hero_image' => 'nullable|string',
                'prestasi' => 'nullable|array',
                'prestasi.*.id' => 'nullable|integer|exists:prestasi,id',
                'prestasi.*.nama' => 'required_with:prestasi|string',
                'prestasi.*.judul' => 'required_with:prestasi|string',
                'prestasi.*.tingkat' => 'nullable|string',
                'prestasi.*.image' => 'sometimes', // Bisa berupa file atau string (path lama)
                'deleted_achievements' => 'nullable|array',
                'deleted_achievements.*' => 'integer',
            ]);

            // 1. Update data utama Akademik
            $akademik = Akademik::firstOrNew(['jenjang' => $jenjang]);
            $akademik->fill([
                'deskripsi_kurikulum' => $validated['hero_desc'] ?? null,
                'poin_unggulan' => $validated['kurikulum'] ?? null,
                'jadwal_harian' => $validated['jadwal'] ?? null,
                'ekstrakurikuler' => $validated['ekskul'] ?? null,
                'biaya_masuk' => $validated['biaya_masuk'] ?? null,
                'biaya_bulanan' => $validated['biaya_bulanan'] ?? null,
            ]);

            // Handle image update/deletion
            if ($request->hasFile('hero_image')) {
                // Jika ada file baru, hapus yang lama (jika ada) dan simpan yang baru
                if ($akademik->gambar_utama && Storage::disk('public')->exists($akademik->gambar_utama)) {
                    Storage::disk('public')->delete($akademik->gambar_utama);
                }
                $akademik->gambar_utama = $request->file('hero_image')->store('akademik', 'public');
            } elseif ($request->input('delete_hero_image') === 'true') {
                // Jika ada flag untuk hapus, hapus file lama dan set null di DB
                if ($akademik->gambar_utama && Storage::disk('public')->exists($akademik->gambar_utama)) {
                    Storage::disk('public')->delete($akademik->gambar_utama);
                }
                $akademik->gambar_utama = null;
            }
            $akademik->save();

            // 2. Handle Prestasi (Create/Update)
            if (!empty($validated['prestasi'])) {
                foreach ($validated['prestasi'] as $index => $prestasiData) {
                    $prestasiFile = $request->file("prestasi.{$index}.image"); // Frontend mengirim 'image'

                    $dataToUpdate = [
                        'nama_siswa' => $prestasiData['nama'], // Peta ke kolom 'nama_siswa'
                        'judul' => $prestasiData['judul'],
                        'peringkat' => $prestasiData['tingkat'], // Peta ke kolom 'peringkat'
                        'jenjang' => $jenjang,
                    ];

                    // Jika ada file baru yang diupload
                    if ($prestasiFile) {
                        $dataToUpdate['gambar'] = $prestasiFile->store('prestasi', 'public'); // Peta ke kolom 'gambar'
                    }

                    $prestasi = Prestasi::updateOrCreate(['id' => $prestasiData['id'] ?? null], $dataToUpdate);

                    // Hapus gambar lama jika ada file baru dan ini adalah proses update
                    if ($prestasiFile && isset($prestasiData['id'])) {
                        $oldImagePath = Prestasi::find($prestasiData['id'])->getOriginal('gambar');
                        if ($oldImagePath && $oldImagePath !== $prestasi->gambar && Storage::disk('public')->exists($oldImagePath)) {
                            Storage::disk('public')->delete($oldImagePath);
                        }
                    }
                }
            }

            // 3. Handle Prestasi yang Dihapus
            if (!empty($validated['deleted_achievements'])) {
                $achievementsToDelete = Prestasi::whereIn('id', $validated['deleted_achievements'])->get();
                foreach ($achievementsToDelete as $achievement) {
                    if ($achievement->gambar && Storage::disk('public')->exists($achievement->gambar)) {
                        Storage::disk('public')->delete($achievement->gambar);
                    }
                    $achievement->delete();
                }
            }

            return response()->json(['message' => 'Halaman akademik berhasil diperbarui']);
        });
    }
}