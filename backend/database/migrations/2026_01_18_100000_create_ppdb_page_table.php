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
        Schema::create('ppdb_page', function (Blueprint $table) {
            $table->id();
            $table->string('tahun_ajaran')->nullable();
            $table->string('nama_gelombang')->nullable();
            $table->string('periode_pendaftaran')->nullable();
            $table->enum('status_ppdb', ['dibuka', 'ditutup'])->default('ditutup');
            $table->text('ppdb_notice')->nullable();
            $table->json('ppdb_hero_images')->nullable();
            $table->string('ppdb_schedule_closing')->nullable();
            $table->string('ppdb_schedule_announcement')->nullable();
            $table->string('ppdb_fee_tk')->nullable();
            $table->string('ppdb_fee_mi')->nullable();
            $table->string('ppdb_contact_wa')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ppdb_page');
    }
};