<?php

namespace App\Http\Controllers;

use App\Models\News;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class NewsController extends Controller
{
    // GET /api/news
    public function index(Request $request)
    {
        $query = News::query();

        // Handle pencarian server-side
        if ($request->has('search') && !empty($request->input('search'))) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'like', "%{$searchTerm}%")
                  ->orWhere('content', 'like', "%{$searchTerm}%");
            });
        }

        // Menggunakan paginate(). Angka 6 sesuai dengan itemsPerPage di frontend.
        // withQueryString() untuk menjaga parameter lain (seperti 'search') saat pindah halaman.
        $news = $query->latest()->paginate(6)->withQueryString();
        return response()->json($news);
    }

    // GET /api/news/{id} - Endpoint baru untuk detail berita
    public function show($id)
    {
        $news = News::findOrFail($id);
        return response()->json($news);
    }

    // POST /api/admin/news
    public function store(Request $request)
    {
        $data = $request->validate([
            'title'   => 'required|string',
            'content' => 'required|string',
            'date'    => 'nullable|date',
            'gambar'  => 'nullable|image|max:200' // Terima key 'gambar' dari frontend (200KB)
        ]);

        // Map 'gambar' dari form ke 'image' di database
        unset($data['gambar']);

        if ($request->hasFile('gambar')) {
            // Simpan file dari 'gambar' ke kolom 'image' di database
            $data['image'] = $request->file('gambar')->store('news', 'public_direct');
        }

        $news = News::create($data);
        return response()->json([
            'message' => 'Berita berhasil ditambahkan',
            'data' => $news
        ], 201);
    }

    // POST /api/admin/news/{id}
    public function update(Request $request, $id)
    {
        $news = News::findOrFail($id);

        $data = $request->validate([
            'title'   => 'required|string',
            'content' => 'required|string',
            'date'    => 'nullable|date',
            'gambar'  => 'nullable|image|max:200' // Terima key 'gambar' dari frontend (200KB)
        ]);

        // Map 'gambar' dari form ke 'image' di database
        unset($data['gambar']);

        if ($request->hasFile('gambar')) {
            if ($news->image) {
                Storage::disk('public_direct')->delete($news->image);
            }
            // Simpan file dari 'gambar' ke kolom 'image' di database
            $data['image'] = $request->file('gambar')->store('news', 'public_direct');
        }

        $news->update($data);
        return response()->json([
            'message' => 'Berita berhasil diperbarui',
            'data' => $news
        ]);
    }

    // DELETE /api/admin/news/{id}
    public function destroy($id)
    {
        $news = News::findOrFail($id);

        if ($news->image) {
            Storage::disk('public_direct')->delete($news->image);
        }

        $news->delete();
        return response()->json(['message' => 'Berita berhasil dihapus']);
    }
}

