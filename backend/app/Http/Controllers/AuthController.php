<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Controllers\Controller;
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

            $cookieMinutes = 60 * 24 * 7; // 7 hari
            $cookieDomain = config('session.domain');
            $secure = (bool) config('session.secure') || $request->isSecure();

            $cookie = cookie(
                'admin_auth_token',
                $token,
                $cookieMinutes,
                '/',
                $cookieDomain,
                $secure,
                true,   // HttpOnly
                false,  // raw
                'Lax'   // SameSite
            );

            $payload = [
                'message' => 'Login berhasil',
                'user'    => $user,
                // Always return token so frontend can set Authorization header if cookies fail.
                'token'   => $token,
            ];

            return response()->json($payload)->cookie($cookie);
        }

        // gagal → tambah hit limiter
        RateLimiter::hit($key, $decaySeconds);

        return response()->json([
            'message' => __('auth.failed')
        ], 401);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        $cookie = cookie(
            'admin_auth_token',
            '',
            -1,
            '/',
            config('session.domain'),
            (bool) config('session.secure') || $request->isSecure(),
            true,
            false,
            'Lax'
        );

        return response()->json(['message' => 'Logout berhasil.'])->cookie($cookie);
    }
}
