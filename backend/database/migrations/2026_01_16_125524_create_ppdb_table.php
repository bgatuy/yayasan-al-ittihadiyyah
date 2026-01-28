<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ppdb', function (Blueprint $table) {
            $table->string('id')->primary(); // Custom ID: REG-20240116001
            $table->string('nama_lengkap');
            $table->string('jenis_kelamin'); // L / P
            $table->string('jenjang'); // TK / MI
            $table->string('tempat_lahir');
            $table->date('tanggal_lahir');
            $table->string('nama_orang_tua');
            $table->string('nomor_wa');
            $table->string('email')->nullable();
            $table->string('asal_sekolah')->nullable();
            $table->text('alamat');
            $table->string('gelombang')->nullable();
            $table->string('status')->default('Menunggu Pembayaran'); // Status: Menunggu Pembayaran, Menunggu Verifikasi, Terverifikasi, Diterima, Tidak Diterima
            $table->string('bukti_bayar')->nullable(); // Path gambar
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ppdb');
    }
};
