<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

/**
 * @mixin \Illuminate\Database\Eloquent\Builder
 * @property string $id
 * @property string $nama_lengkap
 * @property string $nama_panggilan
 * @property string $jenis_kelamin
 * @property string $jenjang
 * @property string $tempat_lahir
 * @property string $tanggal_lahir
 * @property string $nama_orang_tua
 * @property string $nomor_wa
 * @property ?string $email
 * @property ?string $asal_sekolah
 * @property string $alamat
 * @property string $gelombang
 * @property string $status
 * @property ?string $bukti_bayar
 * @property ?\Illuminate\Support\Carbon $created_at
 * @property ?\Illuminate\Support\Carbon $updated_at
 * @property-read ?string $bukti_bayar_url
 * @property-read string $ttl
 */
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
        'nama_panggilan',
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

    protected $appends = ['bukti_bayar_url', 'ttl'];

    // The 'bukti_bayar_url' is an appended attribute, not a direct column.

    // Accessor untuk URL bukti bayar
    public function getBuktiBayarUrlAttribute()
    {
        return $this->bukti_bayar ? url('storage/' . $this->bukti_bayar) : null;
    }

    // Accessor untuk TTL (Tempat, Tanggal Lahir)
    public function getTtlAttribute()
    {
        return $this->tempat_lahir . ', ' . Carbon::parse($this->tanggal_lahir)->locale('id')->translatedFormat('d F Y');
    }
}