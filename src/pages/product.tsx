import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { useAuth, useUser } from '@clerk/nextjs';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/router';

function IdeaGenerator() {
    const { getToken } = useAuth();
    const [idea, setIdea] = useState<string>('…loading');

    useEffect(() => {
        
        let buffer = '';
        (async () => {
            const jwt = await getToken();
            if (!jwt) {
                setIdea('Authentication required');
                return;
            }
            
            await fetchEventSource('/api', {
                headers: { Authorization: `Bearer ${jwt}` },
                onmessage(ev) {
                    buffer += ev.data;
                    setIdea(buffer);
                },
                onerror(err) {
                    console.error('SSE error:', err);
                    // Don't throw - let it retry
                }
            });
        })();
    }, [getToken]);

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Header */}
            <header className="text-center mb-12">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                    Business Idea Generator
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                    AI-powered innovation at your fingertips
                </p>
            </header>

            {/* Content Card */}
            <div className="max-w-3xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 backdrop-blur-lg bg-opacity-95">
                    {idea === '…loading' ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-pulse text-gray-400">
                                Generating your business idea...
                            </div>
                        </div>
                    ) : (
                        <div className="markdown-content text-gray-700 dark:text-gray-300">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkBreaks]}
                            >
                                {idea}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Product() {
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();
    const router = useRouter();

    // Check subscription status
    const hasSubscription = user?.publicMetadata?.subscription === 'premium_subscription';

    // Redirect to home if not signed in
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/');
        }
    }, [isLoaded, isSignedIn, router]);

    if (!isLoaded || !isSignedIn) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-pulse text-gray-400">Loading...</div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            {/* User Menu in Top Right */}
            <div className="absolute top-4 right-4">
                <UserButton showName={true} />
            </div>

            {/* Show pricing if no subscription, otherwise show app */}
            {!hasSubscription ? (
                <div className="container mx-auto px-4 py-12">
                    <header className="text-center mb-12">
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                            Choose Your Plan
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
                            Subscribe to unlock unlimited AI-powered business ideas
                        </p>
                    </header>
                    <div className="max-w-sm mx-auto">
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-8 shadow-xl">
                            <h3 className="text-3xl font-bold mb-4 text-center">Premium Subscription</h3>
                            <p className="text-5xl font-bold text-blue-600 mb-6 text-center">
                                $10<span className="text-xl text-gray-600">/month</span>
                            </p>
                            <ul className="text-gray-700 dark:text-gray-300 mb-8 space-y-3">
                                <li className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    Unlimited idea generation
                                </li>
                                <li className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    Advanced AI models
                                </li>
                                <li className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    Priority support
                                </li>
                                <li className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    Cancel anytime
                                </li>
                            </ul>
                            <div className="text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    To subscribe, add to your user metadata in Clerk Dashboard:
                                </p>
                                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded mb-4 text-xs text-left">
                                    <code>{`{"subscription": "premium_subscription"}`}</code>
                                </div>
                                <button 
                                    onClick={() => window.open('https://dashboard.clerk.com', '_blank')}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105"
                                >
                                    Go to Clerk Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <IdeaGenerator />
            )}
        </main>
    );
}