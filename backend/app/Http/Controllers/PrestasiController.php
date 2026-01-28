<?php

namespace App\Http\Controllers;

use App\Models\Prestasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PrestasiController extends Controller
{
    public function index(Request $request)
    {
        $query = Prestasi::latest();

        // Filter opsional berdasarkan jenjang (misal: ?jenjang=TK)
        if ($request->has('jenjang')) {
            $query->where('jenjang', $request->jenjang);
        }

        // Tambahkan header untuk mencegah browser caching data ini
        return response()->json($query->get())
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    public function store(Request $request)
    {
        $request->validate([
            'jenjang'     => 'required|in:TK,MI',
            'judul'       => 'required|string|max:255',
            'nama_siswa'  => 'nullable|string|max:255',
            'peringkat'   => 'nullable|string|max:100',
            'deskripsi'   => 'nullable|string',
            'tanggal'     => 'nullable|date',
            'gambar'      => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $data = $request->all();

        if ($request->hasFile('gambar')) {
            $data['gambar'] = $request->file('gambar')->store('prestasi', 'public');
        }

        $prestasi = Prestasi::create($data);

        return response()->json([
            'message' => 'Prestasi berhasil ditambahkan',
            'data'    => $prestasi
        ], 201);
    }

    public function show($id)
    {
        $prestasi = Prestasi::find($id);
        if (!$prestasi) return response()->json(['message' => 'Data tidak ditemukan'], 404);
        return response()->json($prestasi);
    }

    public function update(Request $request, $id)
    {
        $prestasi = Prestasi::find($id);
        if (!$prestasi) return response()->json(['message' => 'Data tidak ditemukan'], 404);

        $request->validate([
            'jenjang'     => 'required|in:TK,MI',
            'judul'       => 'required|string|max:255',
            'nama_siswa'  => 'nullable|string|max:255',
            'peringkat'   => 'nullable|string|max:100',
            'deskripsi'   => 'nullable|string',
            'tanggal'     => 'nullable|date',
            'gambar'      => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $data = $request->all();

        // Handle update gambar
        if ($request->hasFile('gambar')) {
            if ($prestasi->gambar && Storage::disk('public')->exists($prestasi->gambar)) {
                Storage::disk('public')->delete($prestasi->gambar);
            }
            $data['gambar'] = $request->file('gambar')->store('prestasi', 'public');
        } else {
            unset($data['gambar']);
        }

        $prestasi->update($data);

        return response()->json([
            'message' => 'Data prestasi berhasil diperbarui',
            'data'    => $prestasi
        ]);
    }

    public function destroy($id)
    {
        $prestasi = Prestasi::find($id);
        if (!$prestasi) return response()->json(['message' => 'Data tidak ditemukan'], 404);

        if ($prestasi->gambar && Storage::disk('public')->exists($prestasi->gambar)) {
            Storage::disk('public')->delete($prestasi->gambar);
        }

        $prestasi->delete();
        return response()->json(['message' => 'Data berhasil dihapus']);
    }
}
