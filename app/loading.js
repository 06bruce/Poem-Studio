export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center animate-fadeIn">
                <div className="relative mx-auto mb-8">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 backdrop-blur-sm"></div>
                    </div>
                </div>
                <p className="text-slate-400 font-medium tracking-wide animate-pulse">
                    Loading verses...
                </p>
            </div>
        </div>
    )
}
