<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->appendToGroup('api', [
            \App\Http\Middleware\AttachBearerTokenFromCookie::class,
        ]);
        // Redirect guests only for non-API requests; avoid redirect for API (prevents 500 due to missing route)
        $middleware->redirectGuestsTo(function (Request $request) {
            return $request->expectsJson() ? null : '/admin/login.html';
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
