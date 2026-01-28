<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ppdb extends Model
{
    use HasFactory;

    protected $table = 'ppdb';

    // Karena ID kita string (REG-XXX) dan bukan auto-increment
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'nama_lengkap',
        'jenis_kelamin',
        'jenjang',
        'tempat_lahir',
        'tanggal_lahir',
        'nama_orang_tua',
        'nomor_wa',
        'email',
        'asal_sekolah',
        'alamat',
        'gelombang',
        'status',
        'bukti_bayar',
    ];

    protected $appends = ['bukti_bayar_url'];

    // Accessor untuk URL bukti bayar
    public function getBuktiBayarUrlAttribute()
    {
        return $this->bukti_bayar ? url('storage/' . $this->bukti_bayar) : null;
    }
}