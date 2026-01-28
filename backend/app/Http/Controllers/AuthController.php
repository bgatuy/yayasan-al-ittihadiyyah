<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) {

            /** @var User $user */
            $user = Auth::user();

            $token = $user->createToken('admin-token')->plainTextToken;

            return response()->json([
                'message' => 'Login berhasil',
                'user'    => $user,
                'token'   => $token,
            ]);
        }

        return response()->json([
            'message' => 'Email atau password salah'
        ], 401);
    }
}
