<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GuruStaff extends Model
{
    use HasFactory;

    protected $table = 'guru_staff';

    protected $fillable = [
        'nama',
        'jabatan',
        'pendidikan',
        'mata_pelajaran',
        'quote',
        'foto',
    ];

    protected $appends = ['foto_url'];

    // Accessor: Mengubah 'guru/foto.jpg' menjadi 'http://domain.com/storage/guru/foto.jpg'
    public function getFotoUrlAttribute()
    {
        return $this->foto ? url('storage/' . $this->foto) : null;
    }
}