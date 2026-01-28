<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Galeri extends Model
{
    use HasFactory;

    protected $table = 'galeri';

    protected $fillable = [
        'judul',
        'gambar',
    ];

    // Appends agar atribut 'gambar_url' otomatis muncul di JSON response
    protected $appends = ['gambar_url'];

    // Accessor untuk membuat URL lengkap gambar
    public function getGambarUrlAttribute()
    {
        return url('storage/' . $this->gambar);
    }
}