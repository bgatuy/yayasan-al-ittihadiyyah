<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prestasi', function (Blueprint $table) {
            $table->id();
            $table->string('jenjang'); // TK / MI (Menggantikan relasi akademik_id)
            $table->string('nama_siswa')->nullable(); // Nama Siswa/Tim
            $table->string('judul'); // Nama Lomba/Prestasi
            $table->string('peringkat')->nullable();
            $table->text('deskripsi')->nullable();
            $table->date('tanggal')->nullable(); // Tanggal prestasi diraih
            $table->string('gambar')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prestasi');
    }
};