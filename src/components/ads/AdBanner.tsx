import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface AdBannerProps {
  slot: 'header' | 'sidebar' | 'footer' | 'native';
  size?: '728x90' | '300x250' | '320x50' | 'responsive';
  lazyLoad?: boolean;
  hideForPro?: boolean;
  className?: string;
}

export function AdBanner({
  slot,
  size = 'responsive',
  lazyLoad = true,
  hideForPro = true,
  className = '',
}: AdBannerProps) {
  const { user } = useAuth();
  const [shouldShow, setShouldShow] = useState(!lazyLoad);
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);

  // Hide ads for Pro/Enterprise users
  const isPaidUser = user && (user as any).plan_type !== 'free';
  if (hideForPro && isPaidUser) {
    return null;
  }

  // Lazy loading
  useEffect(() => {
    if (lazyLoad) {
      const timer = setTimeout(() => setShouldShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [lazyLoad]);

  // Intersection Observer for viewability tracking
  useEffect(() => {
    if (!shouldShow || !adRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);

        // Track impression when ad becomes visible
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          trackImpression();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(adRef.current);

    return () => observer.disconnect();
  }, [shouldShow]);

  const trackImpression = async () => {
    try {
      await supabase.from('ad_impressions').insert({
        user_id: user?.id || null,
        ad_slot: slot,
        ad_network: 'carbon', // or detect dynamically
        ad_size: size,
        viewable_impressions: 1,
        page_url: window.location.pathname,
      });
    } catch (error) {
      console.error('Failed to track ad impression:', error);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Store dismissal in localStorage
    localStorage.setItem(`ad_${slot}_dismissed`, Date.now().toString());
  };

  if (!shouldShow || dismissed) return null;

  // Render upgrade CTA instead of real ad (for now)
  return (
    <div
      ref={adRef}
      className={`ad-banner ad-banner-${slot} ${className}`}
      data-ad-slot={slot}
      data-visible={isVisible}
    >
      {slot === 'header' && (
        <HeaderAdBanner onDismiss={slot === 'footer' ? handleDismiss : undefined} />
      )}
      {slot === 'sidebar' && <SidebarAdBanner />}
      {slot === 'footer' && <FooterAdBanner onDismiss={handleDismiss} />}
      {slot === 'native' && <NativeAdBanner />}
    </div>
  );
}

function HeaderAdBanner({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <div className="w-full max-w-[728px] mx-auto my-4 relative">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-6 h-6" />
            <div>
              <p className="font-semibold">Enjoying 4matz?</p>
              <p className="text-sm text-blue-100">
                Upgrade to Pro for unlimited conversions and no ads
              </p>
            </div>
          </div>
          <Link
            to="/pricing"
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Upgrade
          </Link>
        </div>
      </div>
    </div>
  );
}

function SidebarAdBanner() {
  return (
    <div className="w-[300px] sticky top-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-200 dark:border-blue-800 p-6 shadow-lg">
        <div className="text-center">
          <SparklesIcon className="w-12 h-12 mx-auto text-blue-600 dark:text-blue-400 mb-3" />
          <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
            Go Pro
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Unlimited conversions, no ads, 10MB files, and API access
          </p>
          <Link
            to="/pricing"
            className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Upgrade for $9/mo
          </Link>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}

function FooterAdBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 animate-slide-up">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 shadow-2xl">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-5 h-5" />
            <span className="text-sm font-medium">
              <strong>Limited Offer:</strong> Upgrade to Pro for $9/month and get unlimited conversions
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/pricing"
              className="bg-white text-blue-600 px-4 py-1.5 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors"
            >
              Upgrade Now
            </Link>
            <button
              onClick={onDismiss}
              className="text-white hover:text-blue-100 transition-colors"
              aria-label="Dismiss"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NativeAdBanner() {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 hover:shadow-lg transition-shadow">
      <div className="flex gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <SparklesIcon className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Upgrade to Pro
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Get unlimited conversions, remove ads, and unlock advanced features
              </p>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Special offer: $9/month
              </span>
            </div>
            <Link
              to="/pricing"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium whitespace-nowrap ml-4"
            >
              Learn More →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
