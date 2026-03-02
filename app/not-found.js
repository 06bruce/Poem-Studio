import Link from 'next/link'

export const metadata = {
    title: 'Page Not Found',
}

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="text-center max-w-lg mx-auto glass rounded-[2.5rem] p-10 sm:p-16 animate-fadeIn">
                <div className="text-7xl sm:text-8xl font-black text-gradient mb-6">404</div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-4">
                    Lost in the Verses
                </h1>
                <p className="text-slate-400 leading-relaxed mb-10 text-sm sm:text-base">
                    The page you&apos;re looking for has drifted into the poetic void.
                    Perhaps the words were never meant to be found here.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all duration-300 shadow-xl shadow-blue-900/30 active:scale-95"
                >
                    Return to Studio
                </Link>
            </div>
        </div>
    )
}
