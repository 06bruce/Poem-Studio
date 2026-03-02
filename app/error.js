'use client';

export default function Error({ error, reset }) {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>

            <div className="text-center max-w-lg mx-auto glass rounded-[2.5rem] p-10 sm:p-16 animate-fadeIn border-red-500/20">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.834-1.964-.834-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-4">
                    Something Went Wrong
                </h1>
                <p className="text-slate-400 leading-relaxed mb-8 text-sm sm:text-base">
                    An unexpected error occurred. The verses seem to be tangled.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={reset}
                        className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all duration-300 shadow-xl shadow-blue-900/30 active:scale-95 min-h-[48px]"
                    >
                        Try Again
                    </button>
                    <a
                        href="/"
                        className="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition-all duration-300 border border-white/10 min-h-[48px] flex items-center justify-center"
                    >
                        Return Home
                    </a>
                </div>
            </div>
        </div>
    )
}
