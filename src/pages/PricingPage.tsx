import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckIcon,
  XMarkIcon,
  SparklesIcon,
  BoltIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface Plan {
  id: string;
  name: string;
  tagline: string;
  price: { month: number; year: number };
  icon: typeof SparklesIcon;
  popular?: boolean;
  features: PlanFeature[];
  cta: string;
  color: string;
}

export function PricingPage() {
  const { user } = useAuth();
  const [interval, setInterval] = useState<'month' | 'year'>('month');

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      tagline: 'Perfect for trying out 4matz',
      price: { month: 0, year: 0 },
      icon: BoltIcon,
      color: 'gray',
      features: [
        { text: '50 conversions per month', included: true },
        { text: '1MB file size limit', included: true },
        { text: 'All 8 conversion formats', included: true },
        { text: 'Public templates access', included: true },
        { text: '7 days conversion history', included: true },
        { text: 'Community support', included: true },
        { text: 'Ads displayed', included: true },
        { text: 'Private templates', included: false },
        { text: 'API access', included: false },
        { text: 'Priority support', included: false },
      ],
      cta: user ? 'Current Plan' : 'Get Started Free',
    },
    {
      id: 'pro',
      name: 'Pro',
      tagline: 'For professionals who convert regularly',
      price: { month: 9, year: 90 },
      icon: RocketLaunchIcon,
      popular: true,
      color: 'blue',
      features: [
        { text: 'Unlimited conversions', included: true, highlight: true },
        { text: 'No ads', included: true, highlight: true },
        { text: '10MB file size limit', included: true },
        { text: 'All 8 conversion formats', included: true },
        { text: 'Unlimited private templates', included: true },
        { text: 'Unlimited conversion history', included: true },
        { text: 'API access (1,000 req/month)', included: true, highlight: true },
        { text: 'Batch conversions (10 files)', included: true },
        { text: 'Export history as CSV', included: true },
        { text: 'Priority email support', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Custom templates', included: true },
      ],
      cta: 'Upgrade to Pro',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      tagline: 'For teams and high-volume users',
      price: { month: 49, year: 490 },
      icon: ShieldCheckIcon,
      color: 'purple',
      features: [
        { text: 'Everything in Pro, plus:', included: true, highlight: true },
        { text: '100MB file size limit', included: true },
        { text: 'API access (50,000 req/month)', included: true, highlight: true },
        { text: 'Batch conversions (100 files)', included: true },
        { text: 'Team collaboration (5 seats)', included: true },
        { text: 'Custom conversion templates', included: true },
        { text: 'White-label option', included: true },
        { text: '99.9% SLA guarantee', included: true },
        { text: 'Priority chat + email support', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'Advanced security features', included: true },
      ],
      cta: 'Contact Sales',
    },
  ];

  const yearlyDiscount = Math.round((1 - plans[1].price.year / (plans[1].price.month * 12)) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Convert more data, faster. Choose the plan that's right for you.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-1.5 shadow-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setInterval('month')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                interval === 'month'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('year')}
              className={`px-6 py-3 rounded-lg font-medium transition-all relative ${
                interval === 'year'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Yearly
              <span className="ml-2 px-2 py-0.5 text-xs bg-green-500 text-white rounded-full">
                Save {yearlyDiscount}%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  relative rounded-2xl p-8 transition-all duration-300
                  ${
                    plan.popular
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl scale-105 lg:scale-110 z-10 border-4 border-blue-400'
                      : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 shadow-lg hover:shadow-xl'
                  }
                `}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                      <SparklesIcon className="w-4 h-4" />
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <div className={`w-12 h-12 rounded-xl ${plan.popular ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900'} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${plan.popular ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                  </div>
                  <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${plan.popular ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'}`}>
                    {plan.tagline}
                  </p>
                </div>

                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      ${plan.price[interval]}
                    </span>
                    {plan.price[interval] > 0 && (
                      <span className={`text-lg ${plan.popular ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'}`}>
                        /{interval}
                      </span>
                    )}
                  </div>
                  {interval === 'year' && plan.price.year > 0 && (
                    <p className={`text-sm mt-1 ${plan.popular ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'}`}>
                      ${(plan.price.year / 12).toFixed(2)}/month billed annually
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <Link to={plan.id === 'free' && !user ? '/signup' : plan.id === 'enterprise' ? '/contact' : `/checkout/${plan.id}`}>
                  <Button
                    variant={plan.popular ? 'secondary' : 'primary'}
                    className={`w-full mb-6 ${plan.popular ? 'bg-white text-blue-600 hover:bg-blue-50' : ''}`}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>

                {/* Features List */}
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <CheckIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-white' : 'text-green-500'} ${feature.highlight ? 'font-bold' : ''}`} />
                      ) : (
                        <XMarkIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-blue-200' : 'text-gray-300 dark:text-gray-600'}`} />
                      )}
                      <span className={`text-sm ${
                        feature.included
                          ? plan.popular ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                          : plan.popular ? 'text-blue-200 line-through' : 'text-gray-400 dark:text-gray-600 line-through'
                      } ${feature.highlight ? 'font-semibold' : ''}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 mb-16"
        >
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6 font-medium">
            Trusted by developers and data professionals worldwide
          </p>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">250K+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Conversions/month</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">5,000+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">1,200+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Templates shared</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">99.9%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Uptime SLA</div>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I switch plans later?',
                a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we will prorate the charges.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards (Visa, Mastercard, Amex) via Stripe. Enterprise customers can also pay by invoice.',
              },
              {
                q: 'Is there a free trial for Pro?',
                a: 'Yes! All new Pro subscriptions come with a 7-day free trial. No credit card required to start.',
              },
              {
                q: 'What happens if I exceed my quota?',
                a: 'Free users will see a friendly upgrade prompt. Pro users have unlimited conversions, so no worries!',
              },
              {
                q: 'Do you offer refunds?',
                a: 'Yes, we offer a 30-day money-back guarantee. If you are not satisfied, we will refund your payment, no questions asked.',
              },
            ].map((faq, idx) => (
              <details
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700"
              >
                <summary className="font-semibold cursor-pointer text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                  {faq.q}
                </summary>
                <p className="mt-3 text-gray-600 dark:text-gray-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-16"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Still have questions?
          </p>
          <Link to="/contact">
            <Button variant="secondary" size="lg">
              Contact Sales
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
