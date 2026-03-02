import Link from 'next/link'

export const metadata = {
    title: 'Terms of Service',
    description: 'Terms of service for Poem Studio.',
}

export default function TermsOfService() {
    const currentYear = new Date().getFullYear()

    return (
        <div className="min-h-screen p-6 sm:p-12 md:p-16 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px] -z-10"></div>

            <div className="max-w-3xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-200 transition-colors mb-8 font-medium text-sm min-h-[44px]">
                    ← Back to Studio
                </Link>

                <div className="glass rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 md:p-14 animate-fadeIn">
                    <h1 className="text-3xl sm:text-4xl font-black text-gradient mb-4">Terms of Service</h1>
                    <p className="text-slate-500 text-sm mb-10">Last updated: March {currentYear}</p>

                    <div className="space-y-8 text-slate-300 leading-relaxed text-sm sm:text-base">
                        <section>
                            <h2 className="text-xl font-bold text-slate-100 mb-3">1. Acceptance of Terms</h2>
                            <p className="text-slate-400">By accessing and using Poem Studio, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our service.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-100 mb-3">2. User Accounts</h2>
                            <ul className="list-disc list-inside space-y-2 text-slate-400">
                                <li>You must provide accurate and complete registration information</li>
                                <li>You are responsible for maintaining the security of your account</li>
                                <li>You must be at least 13 years of age to use this service</li>
                                <li>One person may not maintain more than one account</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-100 mb-3">3. Content Ownership</h2>
                            <p className="text-slate-400">You retain full ownership of all poems, stories, and content you create on Poem Studio. By publishing content on the platform, you grant us a non-exclusive, worldwide license to display your content within the service. You may remove your content at any time, which will revoke this license.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-100 mb-3">4. Acceptable Use</h2>
                            <p className="text-slate-400">You agree not to:</p>
                            <ul className="list-disc list-inside mt-3 space-y-2 text-slate-400">
                                <li>Post content that is illegal, harmful, threatening, or discriminatory</li>
                                <li>Plagiarize or claim authorship of content created by others</li>
                                <li>Use the platform for spamming or commercial solicitation</li>
                                <li>Attempt to access other users&apos; accounts without authorization</li>
                                <li>Disrupt or interfere with the platform&apos;s infrastructure</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-100 mb-3">5. Co-authored Content</h2>
                            <p className="text-slate-400">When you tag co-authors on a poem, you represent that you have their consent to be credited. Co-authored works are jointly owned by all credited authors.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-100 mb-3">6. Ephemeral Stories</h2>
                            <p className="text-slate-400">Stories (Ephemeral Verses) are automatically deleted after 24 hours. We do not guarantee the preservation of story content beyond this period.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-100 mb-3">7. Termination</h2>
                            <p className="text-slate-400">We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time through your profile settings.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-100 mb-3">8. Changes to Terms</h2>
                            <p className="text-slate-400">We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-100 mb-3">9. Disclaimer</h2>
                            <p className="text-slate-400">Poem Studio is provided &quot;as is&quot; without warranties of any kind. We are not liable for any content posted by users on the platform.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}
