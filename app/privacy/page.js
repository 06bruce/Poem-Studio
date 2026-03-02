import Link from 'next/link'

export const metadata = {
    title: 'Privacy Policy',
    description: 'Privacy policy for Poem Studio — how we handle your data.',
}

export default function PrivacyPolicy() {
    const currentYear = new Date().getFullYear()

    return (
        <div className="min-h-screen p-6 sm:p-12 md:p-16 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] -z-10"></div>

            <div className="max-w-3xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-200 transition-colors mb-8 font-medium text-sm min-h-[44px]">
                    ← Back to Studio
                </Link>

                <div className="glass rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 md:p-14 animate-fadeIn">
                    <h1 className="text-3xl sm:text-4xl font-black text-gradient mb-4">Privacy Policy</h1>
                    <p className="text-slate-500 text-sm mb-10">Last updated: March {currentYear}</p>

                    <div className="space-y-8 text-slate-300 leading-relaxed text-sm sm:text-base">
                        <section>
                            <h2 className="text-xl font-bold text-slate-100 mb-3">1. Information We Collect</h2>
                            <p>When you create an account on Poem Studio, we collect:</p>
                            <ul className="list-disc list-inside mt-3 space-y-2 text-slate-400">
                                <li><strong className="text-slate-300">Account Information:</strong> Email address, username, and password (hashed and stored securely).</li>
                                <li><strong className="text-slate-300">Profile Information:</strong> Bio and other optional profile details you choose to share.</li>
                                <li><strong className="text-slate-300">Content:</strong> Poems, stories, annotations, and other content you create or publish.</li>
                                <li><strong className="text-slate-300">Usage Data:</strong> Information about how you interact with the platform.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-100 mb-3">2. How We Use Your Information</h2>
                            <ul className="list-disc list-inside space-y-2 text-slate-400">
                                <li>To provide and maintain the Poem Studio service</li>
                                <li>To authenticate your identity and secure your account</li>
                                <li>To display your published poems and stories to other users</li>
                                <li>To send notifications about interactions with your content</li>
                                <li>To improve our platform and user experience</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-100 mb-3">3. Data Storage & Security</h2>
                            <p className="text-slate-400">Your data is stored securely in our database. Passwords are hashed using bcrypt before storage. We use JWT tokens and secure session management for authentication. We implement industry-standard security measures to protect your personal information.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-100 mb-3">4. Third-Party Services</h2>
                            <p className="text-slate-400">We use Google OAuth for social authentication. When you sign in with Google, we receive your email address and basic profile information as authorized by Google&apos;s privacy policy. We do not sell your data to any third parties.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-100 mb-3">5. Your Rights</h2>
                            <p className="text-slate-400">You have the right to:</p>
                            <ul className="list-disc list-inside mt-3 space-y-2 text-slate-400">
                                <li>Access and download your personal data</li>
                                <li>Update or correct your information</li>
                                <li>Delete your account and associated data</li>
                                <li>Opt out of non-essential communications</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-100 mb-3">6. Cookies</h2>
                            <p className="text-slate-400">We use essential cookies for authentication and session management. These are required for the platform to function properly. We do not use tracking or advertising cookies.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-100 mb-3">7. Contact</h2>
                            <p className="text-slate-400">If you have any questions about this privacy policy, please reach out to us through the platform.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}
