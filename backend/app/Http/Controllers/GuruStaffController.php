<?php

namespace App\Http\Controllers;

use App\Models\GuruStaff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GuruStaffController extends Controller
{
    public function index()
    {
        // Urutkan berdasarkan nama atau jabatan sesuai kebutuhan
        $guru = GuruStaff::orderBy('nama', 'asc')->get();
        return response()->json($guru);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama'           => 'required|string|max:255',
            'jabatan'        => 'required|string|max:255',
            'pendidikan'     => 'required|string|max:255',
            'mata_pelajaran' => 'nullable|string|max:255',
            'masa_bakti'     => 'nullable|string|max:255',
            'quote'          => 'nullable|string|max:500',
            'image'          => 'nullable|image|mimes:jpeg,png,jpg|max:200', // Terima 'image' dari frontend (200KB)
        ]);

        // Map 'image' dari form ke 'foto' di database
        unset($data['image']);

        if ($request->hasFile('image')) {
            // Simpan file dari 'image' ke kolom 'foto' di database
            $data['foto'] = $request->file('image')->store('guru_staff', 'public');
        }

        $guru = GuruStaff::create($data);

        return response()->json([
            'message' => 'Data Guru/Staff berhasil ditambahkan',
            'data'    => $guru
        ], 201);
    }

    public function show($id)
    {
        $guru = GuruStaff::find($id);
        if (!$guru) return response()->json(['message' => 'Data tidak ditemukan'], 404);
        return response()->json($guru);
    }

    public function update(Request $request, $id)
    {
        $guru = GuruStaff::find($id);
        if (!$guru) return response()->json(['message' => 'Data tidak ditemukan'], 404);

        $data = $request->validate([
            'nama'           => 'required|string|max:255',
            'jabatan'        => 'required|string|max:255',
            'pendidikan'     => 'required|string|max:255',
            'mata_pelajaran' => 'nullable|string|max:255',
            'masa_bakti'     => 'nullable|string|max:255',
            'quote'          => 'nullable|string|max:500',
            'image'          => 'nullable|image|mimes:jpeg,png,jpg|max:200', // Terima 'image' dari frontend (200KB)
        ]);

        // Map 'image' dari form ke 'foto' di database
        unset($data['image']);

        // Cek apakah ada upload foto baru
        if ($request->hasFile('image')) {
            // Hapus foto lama jika ada
            if ($guru->foto && Storage::disk('public')->exists($guru->foto)) {
                Storage::disk('public')->delete($guru->foto);
            }
            // Simpan foto baru dari 'image' ke kolom 'foto'
            $data['foto'] = $request->file('image')->store('guru_staff', 'public');
        }

        $guru->update($data);

        return response()->json([
            'message' => 'Data berhasil diperbarui',
            'data'    => $guru
        ]);
    }

    public function destroy($id)
    {
        $guru = GuruStaff::find($id);
        if (!$guru) return response()->json(['message' => 'Data tidak ditemukan'], 404);

        if ($guru->foto && Storage::disk('public')->exists($guru->foto)) {
            Storage::disk('public')->delete($guru->foto);
        }

        $guru->delete();
        return response()->json(['message' => 'Data berhasil dihapus']);
    }
}
