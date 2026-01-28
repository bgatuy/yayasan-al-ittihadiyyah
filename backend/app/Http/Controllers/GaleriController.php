<?php

namespace App\Http\Controllers;

use App\Models\Galeri;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GaleriController extends Controller
{
    public function index()
    {
        // Mengambil data terbaru
        $galeri = Galeri::latest()->get();
        return response()->json($galeri);
    }

    public function store(Request $request)
    {
        // Validasi input
        $request->validate([
            'judul'  => 'nullable|string|max:255',
            'gambar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // Max 2MB
        ]);

        // Upload gambar
        if ($request->hasFile('gambar')) {
            // Simpan ke folder 'public/galeri'
            $path = $request->file('gambar')->store('galeri', 'public');

            $galeri = Galeri::create([
                'judul'  => $request->judul,
                'gambar' => $path,
            ]);

            return response()->json([
                'message' => 'Gambar berhasil diupload',
                'data'    => $galeri
            ], 201);
        }

        return response()->json(['message' => 'Gagal upload gambar'], 400);
    }

    public function destroy($id)
    {
        $galeri = Galeri::find($id);

        if (!$galeri) {
            return response()->json(['message' => 'Data tidak ditemukan'], 404);
        }

        // Hapus file fisik dari storage
        if ($galeri->gambar && Storage::disk('public')->exists($galeri->gambar)) {
            Storage::disk('public')->delete($galeri->gambar);
        }

        // Hapus record database
        $galeri->delete();

        return response()->json(['message' => 'Gambar berhasil dihapus']);
    }
}