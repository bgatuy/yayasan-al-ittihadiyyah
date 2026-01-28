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
        Schema::create('settings', function (Blueprint $table) {
            $table->id();

            $table->string('tahun_ajaran');
            $table->string('nama_gelombang');
            $table->string('periode_pendaftaran');
            $table->enum('status_ppdb', ['dibuka', 'ditutup'])->default('ditutup');
            $table->string('brosur')->nullable(); // File Brosur (PDF/Gambar)

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
