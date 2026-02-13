<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Akademik extends Model
{
    use HasFactory;

    protected $table = 'akademik'; // Menyesuaikan nama tabel di migration

    protected $fillable = [
        'jenjang', // 'tk' atau 'mi'
        'gambar_utama',
        'jadwal_harian',
        'biaya_masuk',
        'biaya_bulanan',
        'ekstrakurikuler'
    ];

    /**
     * Mendefinisikan relasi one-to-many ke model Prestasi.
     * Relasi ini menggunakan 'jenjang' sebagai foreign dan local key.
     */
    public function prestasi()
    {
        return $this->hasMany(Prestasi::class, 'jenjang', 'jenjang');
    }
}
