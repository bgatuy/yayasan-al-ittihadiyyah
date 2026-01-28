<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $table = 'settings';

    protected $fillable = [
        'tahun_ajaran',
        'nama_gelombang',
        'periode_pendaftaran',
        'status_ppdb',
        'brosur',
    ];

    protected $appends = ['brosur_url'];

    // Accessor: URL lengkap untuk download brosur
    public function getBrosurUrlAttribute()
    {
        return $this->brosur ? url('storage/' . $this->brosur) : null;
    }
}