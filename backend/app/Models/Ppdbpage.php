<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @mixin \Illuminate\Database\Eloquent\Builder
 * @property int $id
 * @property ?string $tahun_ajaran
 * @property ?string $nama_gelombang
 * @property ?string $periode_pendaftaran
 * @property string $status_ppdb
 * @property ?string $ppdb_notice
 * @property ?array $ppdb_hero_images
 * @property ?string $ppdb_schedule_closing
 * @property ?string $ppdb_schedule_announcement
 * @property ?string $ppdb_fee_tk
 * @property ?string $ppdb_fee_mi
 * @property ?string $ppdb_contact_wa
 * @property ?\Illuminate\Support\Carbon $created_at
 * @property ?\Illuminate\Support\Carbon $updated_at
 */
class PpdbPage extends Model
{
    use HasFactory;

    protected $table = 'ppdb_page';

    protected $fillable = [
        'tahun_ajaran',
        'nama_gelombang',
        'periode_pendaftaran',
        'status_ppdb',
        'ppdb_notice',
        'ppdb_hero_images',
        'ppdb_schedule_closing',
        'ppdb_schedule_announcement',
        'ppdb_fee_tk',
        'ppdb_fee_mi',
        'ppdb_contact_wa',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'ppdb_hero_images' => 'array',
    ];
}