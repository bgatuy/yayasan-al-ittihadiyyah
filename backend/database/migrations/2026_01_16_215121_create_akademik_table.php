<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('akademik', function (Blueprint $table) {
            $table->id();
            $table->string('jenjang')->unique(); // TK / MI
            $table->string('gambar_utama')->nullable();
            $table->text('deskripsi_kurikulum')->nullable();
            $table->text('poin_unggulan')->nullable();
            $table->text('jadwal_harian')->nullable();
            $table->text('biaya_masuk')->nullable();
            $table->text('biaya_bulanan')->nullable();
            $table->text('ekstrakurikuler')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('akademik');
    }
};
