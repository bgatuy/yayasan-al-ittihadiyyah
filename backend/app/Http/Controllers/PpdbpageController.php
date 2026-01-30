<?php

namespace App\Http\Controllers;

use App\Models\PpdbPage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PpdbPageController extends Controller
{
    // Ambil Pengaturan (Hanya ada 1 row)
    public function index()
    {
        $settings = PpdbPage::first();

        // Jika belum ada setting sama sekali, kembalikan object kosong atau default
        if (!$settings) {
            return response()->json([
                'tahun_ajaran' => '',
                'nama_gelombang' => '',
                'periode_pendaftaran' => '',
                'status_ppdb' => 'ditutup',
                'ppdb_notice' => '',
                'ppdb_hero_images' => [],
                'ppdb_schedule_closing' => '',
                'ppdb_schedule_announcement' => '',
                'ppdb_fee_tk' => '',
                'ppdb_fee_mi' => '',
                'ppdb_contact_wa' => '',
            ]);
        }

        return response()->json($settings);
    }

    // Menyimpan atau memperbarui pengaturan
    public function store(Request $request)
    {
        $validated = $request->validate([
            'tahun_ajaran' => 'nullable|string|max:255',
            'ppdb_contact_wa' => 'nullable|string|max:20',
            'ppdb_notice' => 'nullable|string',
            'nama_gelombang' => 'nullable|string|max:255',
            'status_ppdb' => 'nullable|in:dibuka,ditutup',
            'periode_pendaftaran' => 'nullable|string|max:255',
            'ppdb_schedule_closing' => 'nullable|string|max:255',
            'ppdb_schedule_announcement' => 'nullable|string|max:255',
            'ppdb_fee_tk' => 'nullable|string|max:255',
            'ppdb_fee_mi' => 'nullable|string|max:255',
            'ppdb_hero_images' => 'nullable|array', // Pastikan field ini adalah array jika ada
            'ppdb_hero_images.*' => 'image|mimes:jpeg,png,jpg,webp|max:200', // Hapus nullable, karena jika ada item, harus valid
            'deleted_hero_images' => 'nullable|array',
            'deleted_hero_images.*' => 'string',
        ]);

        $settings = PpdbPage::firstOrCreate(['id' => 1]);
        $currentImagePaths = $settings->ppdb_hero_images ?? [];

        // 1. Handle Deletion of existing images
        if ($request->has('deleted_hero_images')) {
            $imagesToDelete = $request->input('deleted_hero_images');
            foreach ($imagesToDelete as $path) {
                if (in_array($path, $currentImagePaths)) {
                    Storage::disk('public')->delete($path);
                }
            }
            // Filter out the deleted images from the current list
            $currentImagePaths = array_values(array_diff($currentImagePaths, $imagesToDelete));
        }

        // 2. Handle Addition of new images
        if ($request->hasFile('ppdb_hero_images')) {
            foreach ($request->file('ppdb_hero_images') as $file) {
                $path = $file->store('ppdb_hero', 'public');
                $currentImagePaths[] = $path; // Append new path
            }
        }

        // Update the validated data with the final list of images
        $validated['ppdb_hero_images'] = $currentImagePaths;

        // Unset the temporary fields from validated data so they are not passed to update()
        unset($validated['deleted_hero_images']);

        $settings->update($validated);

        return response()->json(['message' => 'Pengaturan berhasil disimpan', 'data' => $settings]);
    }
}