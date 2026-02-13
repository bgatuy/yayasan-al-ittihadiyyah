<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AttachBearerTokenFromCookie
{
    /**
     * If no Authorization header is present, use token from HttpOnly cookie.
     */
    public function handle(Request $request, Closure $next)
    {
        if (!$request->headers->has('Authorization')) {
            $token = $request->cookie('admin_auth_token');
            if ($token) {
                $request->headers->set('Authorization', 'Bearer ' . $token);
            }
        }

        return $next($request);
    }
}
