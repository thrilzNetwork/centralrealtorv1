"use client";

interface Props {
  connected: boolean;
  justConnected?: boolean;
  error?: boolean;
}

export function GoogleConnectionCard({ connected, justConnected, error }: Props) {
  return (
    <div className="mt-8 p-6 bg-white border border-[#EAE7DC] rounded-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <span className="label-caps text-[#6B7565]">Integraciones</span>
          <h3 className="text-[#262626] mt-1 font-serif text-lg">Google Calendar &amp; Gmail</h3>
          <p className="text-sm text-[#6B7565] mt-1">
            Sincroniza tu calendario para que el chatbot ofrezca citas y envíe confirmaciones automáticas por email.
          </p>

          {error && (
            <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
              No se pudo conectar Google. Intenta de nuevo.
            </p>
          )}

          {justConnected && (
            <p className="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-sm px-3 py-2">
              Google Calendar conectado correctamente.
            </p>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          {connected ? (
            <>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-medium rounded-sm">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Conectado
              </span>
            </>
          ) : (
            <a
              href="/api/auth/google-link"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#262626] text-white text-xs font-medium rounded-sm hover:bg-[#1a1a1a] transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Conectar Google
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
