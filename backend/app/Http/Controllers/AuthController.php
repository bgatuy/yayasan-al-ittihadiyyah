<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // validasi input
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // limiter key (per email + IP)
        $key = 'login:' . $request->email . '|' . $request->ip();
        $maxAttempts = 5;
        $decaySeconds = 60;

        // cek throttle
        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {

            // reset window lama
            RateLimiter::clear($key);

            // bikin lock baru 60 detik
            RateLimiter::hit($key, $decaySeconds);

            return response()->json([
                'message' => "Terlalu banyak percobaan login. Coba lagi dalam {$decaySeconds} detik.",
                'retry_after' => $decaySeconds
            ], 429);
        }


        $credentials = $request->only('email', 'password');

        // attempt login
        if (Auth::attempt($credentials)) {

            // sukses → reset limiter
            RateLimiter::clear($key);

            /** @var User $user */
            $user = Auth::user();
            $token = $user->createToken('admin-token')->plainTextToken;

            return response()->json([
                'message' => 'Login berhasil',
                'user'    => $user,
                'token'   => $token,
            ]);
        }

        // gagal → tambah hit limiter
        RateLimiter::hit($key, $decaySeconds);

        return response()->json([
            'message' => __('auth.failed')
        ], 401);
    }
}
