import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Link } from 'react-router-dom';
import {
  XMarkIcon,
  RocketLaunchIcon,
  CheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: 'limit_reached' | 'file_size' | 'api_access' | 'no_ads' | 'advanced_features';
  currentUsage?: number;
  limit?: number;
}

const upgradeReasons = {
  limit_reached: {
    title: "You've reached your monthly limit",
    description: "Upgrade to Pro for unlimited conversions and advanced features",
    icon: RocketLaunchIcon,
    color: 'orange',
  },
  file_size: {
    title: 'File size too large',
    description: 'Upgrade to Pro for 10MB files or Enterprise for 100MB files',
    icon: SparklesIcon,
    color: 'blue',
  },
  api_access: {
    title: 'API access requires Pro',
    description: 'Get programmatic access with 1,000 API requests per month',
    icon: RocketLaunchIcon,
    color: 'purple',
  },
  no_ads: {
    title: 'Enjoy an ad-free experience',
    description: 'Upgrade to Pro to remove all ads and unlock premium features',
    icon: SparklesIcon,
    color: 'green',
  },
  advanced_features: {
    title: 'Unlock advanced features',
    description: 'Get batch processing, custom templates, and priority support',
    icon: RocketLaunchIcon,
    color: 'blue',
  },
};

export function UpgradeModal({
  isOpen,
  onClose,
  reason,
  currentUsage,
  limit,
}: UpgradeModalProps) {
  const config = upgradeReasons[reason];
  const Icon = config.icon;

  const proFeatures = [
    'Unlimited conversions',
    'No advertisements',
    '10MB file size limit',
    'API access (1K requests/month)',
    'Batch conversions',
    'Priority support',
    'Advanced analytics',
    'Custom templates',
  ];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-8 text-left align-middle shadow-xl transition-all">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 rounded-full bg-${config.color}-100 dark:bg-${config.color}-900 flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-8 h-8 text-${config.color}-600 dark:text-${config.color}-400`} />
                  </div>
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
                  >
                    {config.title}
                  </Dialog.Title>
                  <p className="text-gray-600 dark:text-gray-400">
                    {config.description}
                  </p>
                </div>

                {/* Usage Meter (if applicable) */}
                {reason === 'limit_reached' && currentUsage !== undefined && limit !== undefined && (
                  <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700 dark:text-gray-300">
                        Current usage this month
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {currentUsage} / {limit} conversions
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min((currentUsage / limit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Pro Plan Highlight */}
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-2xl font-bold mb-1">Pro Plan</h4>
                      <p className="text-blue-100">Perfect for professionals</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold">$9</div>
                      <div className="text-sm text-blue-100">/month</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {proFeatures.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex gap-3">
                  <Link to="/pricing" className="flex-1">
                    <Button variant="primary" size="lg" className="w-full">
                      <RocketLaunchIcon className="w-5 h-5 mr-2" />
                      Upgrade to Pro
                    </Button>
                  </Link>
                  <Button variant="secondary" size="lg" onClick={onClose}>
                    Maybe Later
                  </Button>
                </div>

                {/* Money-back guarantee */}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                  30-day money-back guarantee • Cancel anytime
                </p>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
