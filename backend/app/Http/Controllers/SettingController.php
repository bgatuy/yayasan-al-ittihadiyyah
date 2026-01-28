<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    // Ambil Pengaturan (Hanya ada 1 row)
    public function index()
    {
        $setting = Setting::first();

        // Jika belum ada setting sama sekali, kembalikan object kosong atau default
        if (!$setting) {
            return response()->json([
                'tahun_ajaran' => '',
                'nama_gelombang' => '',
                'periode_pendaftaran' => '',
                'status_ppdb' => 'ditutup',
                'brosur' => null
            ]);
        }

        return response()->json($setting);
    }

    // Update Pengaturan (Singleton Logic)
    public function update(Request $request)
    {
        $request->validate([
            'tahun_ajaran'        => 'required|string',
            'nama_gelombang'      => 'required|string',
            'periode_pendaftaran' => 'required|string',
            'status_ppdb'         => 'required|in:dibuka,ditutup',
            'brosur'              => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120', // Max 5MB
        ]);

        // Ambil setting yang ada, atau buat baru jika belum ada
        $setting = Setting::first();
        if (!$setting) {
            $setting = new Setting();
        }

        $data = $request->all();

        // Handle Upload Brosur
        if ($request->hasFile('brosur')) {
            // Hapus brosur lama jika ada
            if ($setting->brosur && Storage::disk('public')->exists($setting->brosur)) {
                Storage::disk('public')->delete($setting->brosur);
            }
            $data['brosur'] = $request->file('brosur')->store('settings', 'public');
        } else {
            unset($data['brosur']);
        }

        $setting->fill($data);
        $setting->save();

        return response()->json(['message' => 'Pengaturan berhasil disimpan', 'data' => $setting]);
    }
}