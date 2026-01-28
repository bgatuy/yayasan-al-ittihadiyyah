<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prestasi extends Model
{
    use HasFactory;

    protected $table = 'prestasi';

    protected $fillable = [
        'jenjang', // 'tk' atau 'mi'
        'nama_siswa',
        'judul',
        'peringkat',
        'deskripsi',
        'tanggal',
        'gambar',
    ];

    /**
     * Atribut virtual yang akan ditambahkan ke response JSON.
     * Ini menerjemahkan nama kolom database ke nama yang diharapkan frontend.
     */
    protected $appends = ['nama', 'tingkat', 'image'];

    // Accessor: Membuat atribut 'nama' dari 'nama_siswa'
    public function getNamaAttribute()
    {
        return $this->attributes['nama_siswa'];
    }

    // Accessor: Membuat atribut 'tingkat' dari 'peringkat'
    public function getTingkatAttribute()
    {
        return $this->attributes['peringkat'];
    }

    // Accessor: Membuat atribut 'image' (URL lengkap) dari 'gambar' (path)
    public function getImageAttribute()
    {
        return $this->gambar ? url('storage/' . $this->gambar) : null;
    }
}