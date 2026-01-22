'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Check, 
  X, 
  Zap, 
  Building2, 
  Sparkles, 
  ArrowRight,
  Users,
  Shield,
  Clock,
  BarChart3,
  Leaf,
  HelpCircle,
  ChevronDown
} from 'lucide-react';

type BillingPeriod = 'monthly' | 'annual';

interface PricingTier {
  name: string;
  description: string;
  price: { monthly: number; annual: number } | 'custom';
  icon: React.ElementType;
  popular?: boolean;
  features: string[];
  limitations?: string[];
  cta: string;
  ctaLink: string;
}

const tiers: PricingTier[] = [
  {
    name: 'Solo',
    description: 'For individual developers and small projects',
    price: { monthly: 29, annual: 290 },
    icon: Zap,
    features: [
      'Up to 100 workloads tracked',
      '1 cloud provider integration',
      'Basic carbon reporting',
      'CSV data upload',
      'Email support',
      '7-day data retention',
      'Single user',
    ],
    limitations: [
      'No team collaboration',
      'No API access',
      'No custom assumptions',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/login?plan=solo',
  },
  {
    name: 'Team',
    description: 'For growing teams tracking cloud sustainability',
    price: { monthly: 149, annual: 1490 },
    icon: Users,
    popular: true,
    features: [
      'Up to 1,000 workloads tracked',
      '3 cloud provider integrations',
      'Advanced carbon analytics',
      'CSV & API data upload',
      'Custom assumptions',
      'Team collaboration (up to 10)',
      'Role-based access control',
      'Priority email support',
      '90-day data retention',
      'Weekly scheduled reports',
    ],
    limitations: [
      'No SSO',
      'No audit logging',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/login?plan=team',
  },
  {
    name: 'Enterprise',
    description: 'For organizations with advanced security needs',
    price: { monthly: 499, annual: 4990 },
    icon: Building2,
    features: [
      'Unlimited workloads',
      'Unlimited integrations',
      'Full carbon intelligence suite',
      'Real-time API access',
      'Custom carbon factors',
      'Unlimited team members',
      'Advanced RBAC & custom roles',
      'SSO (Google, Microsoft, SAML)',
      'Audit logging',
      'Dedicated support',
      '1-year data retention',
      'Custom report branding',
      'SLA guarantee',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/login?plan=enterprise',
  },
  {
    name: 'Custom',
    description: 'For large enterprises with unique requirements',
    price: 'custom',
    icon: Sparkles,
    features: [
      'Everything in Enterprise',
      'Dedicated infrastructure',
      'Custom integrations',
      'On-premise deployment option',
      'Custom data retention',
      'Dedicated success manager',
      'Custom SLA',
      'Volume discounts',
      'Multi-region support',
      'Advanced compliance (SOC2, GDPR)',
    ],
    cta: 'Contact Sales',
    ctaLink: '/contact?plan=custom',
  },
];

const faqs = [
  {
    question: 'What counts as a workload?',
    answer: 'A workload is any compute resource we track - this includes EC2 instances, GCP VMs, Azure VMs, Kubernetes pods, Snowflake warehouses, Databricks clusters, or any GPU instance. Each unique resource ID counts as one workload.',
  },
  {
    question: 'Can I switch plans later?',
    answer: 'Yes! You can upgrade or downgrade at any time. When upgrading, you\'ll get immediate access to new features. When downgrading, changes take effect at your next billing cycle.',
  },
  {
    question: 'What integrations are supported?',
    answer: 'We support AWS, Google Cloud, Microsoft Azure, Snowflake, Databricks, and NVIDIA DGX Cloud. Enterprise plans can request custom integrations for other platforms.',
  },
  {
    question: 'How accurate are the carbon calculations?',
    answer: 'Our calculations use the Cloud Carbon Footprint methodology with real grid carbon intensity data. Confidence scores indicate data quality - customer-provided measurements increase accuracy, while estimates may have wider margins.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! All paid plans include a 14-day free trial with full access to features. No credit card required to start.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and can arrange invoicing for annual Enterprise and Custom plans.',
  },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const getPrice = (tier: PricingTier) => {
    if (tier.price === 'custom') return null;
    return billingPeriod === 'annual' ? tier.price.annual : tier.price.monthly;
  };

  const getSavings = (tier: PricingTier) => {
    if (tier.price === 'custom') return null;
    const monthlyCost = tier.price.monthly * 12;
    const annualCost = tier.price.annual;
    return Math.round((1 - annualCost / monthlyCost) * 100);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-sm font-mono font-medium tracking-wider">HELIOS</span>
            </Link>
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="/methodology" className="hidden sm:block text-neutral-500 hover:text-neutral-200 text-xs font-mono uppercase tracking-wider transition-colors">
                Docs
              </Link>
              <Link href="/login" className="text-neutral-500 hover:text-neutral-200 text-xs font-mono uppercase tracking-wider transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-6">
            <Leaf className="w-3 h-3" />
            Carbon Intelligence Pricing
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-mono font-medium text-neutral-100 tracking-tight mb-6">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-10">
            Track, analyze, and optimize your cloud carbon footprint. Start free, scale as you grow.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-neutral-900 border border-neutral-800">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 text-sm font-mono uppercase tracking-wider transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-amber-600 text-neutral-950'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-2 text-sm font-mono uppercase tracking-wider transition-colors flex items-center gap-2 ${
                billingPeriod === 'annual'
                  ? 'bg-amber-600 text-neutral-950'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Annual
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              const price = getPrice(tier);
              const savings = getSavings(tier);

              return (
                <div
                  key={tier.name}
                  className={`relative bg-neutral-900 border ${
                    tier.popular ? 'border-amber-600' : 'border-neutral-800'
                  } p-6 flex flex-col`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-600 text-neutral-950 text-xs font-mono uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <div className={`w-12 h-12 ${tier.popular ? 'bg-amber-950 border-amber-800' : 'bg-neutral-800 border-neutral-700'} border flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 ${tier.popular ? 'text-amber-500' : 'text-neutral-400'}`} />
                    </div>
                    <h3 className="text-xl font-mono font-medium text-neutral-100 mb-2">{tier.name}</h3>
                    <p className="text-sm text-neutral-500">{tier.description}</p>
                  </div>

                  <div className="mb-6">
                    {price !== null ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-mono font-medium text-neutral-100">${price}</span>
                          <span className="text-neutral-500">/{billingPeriod === 'annual' ? 'year' : 'month'}</span>
                        </div>
                        {billingPeriod === 'annual' && savings && (
                          <p className="text-sm text-emerald-500 mt-1">Save {savings}% vs monthly</p>
                        )}
                      </>
                    ) : (
                      <div className="text-2xl font-mono text-neutral-100">Custom pricing</div>
                    )}
                  </div>

                  <Link
                    href={tier.ctaLink}
                    className={`w-full py-3 px-4 text-center font-mono text-sm uppercase tracking-wider transition-colors mb-6 flex items-center justify-center gap-2 ${
                      tier.popular
                        ? 'bg-amber-600 text-neutral-950 hover:bg-amber-500'
                        : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border border-neutral-700'
                    }`}
                  >
                    {tier.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <div className="flex-1">
                    <p className="text-xs font-mono text-neutral-500 uppercase tracking-wider mb-3">What's included</p>
                    <ul className="space-y-2">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span className="text-neutral-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {tier.limitations && tier.limitations.length > 0 && (
                      <>
                        <p className="text-xs font-mono text-neutral-600 uppercase tracking-wider mb-3 mt-4">Not included</p>
                        <ul className="space-y-2">
                          {tier.limitations.map((limitation, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <X className="w-4 h-4 text-neutral-600 mt-0.5 shrink-0" />
                              <span className="text-neutral-500">{limitation}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 border-t border-neutral-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-mono font-medium text-neutral-100 text-center mb-8 sm:mb-12">
            Compare Features
          </h2>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left py-4 px-4 text-neutral-500 font-mono uppercase text-xs">Feature</th>
                  <th className="text-center py-4 px-4 text-neutral-500 font-mono uppercase text-xs">Solo</th>
                  <th className="text-center py-4 px-4 text-neutral-500 font-mono uppercase text-xs bg-amber-950/20">Team</th>
                  <th className="text-center py-4 px-4 text-neutral-500 font-mono uppercase text-xs">Enterprise</th>
                  <th className="text-center py-4 px-4 text-neutral-500 font-mono uppercase text-xs">Custom</th>
                </tr>
              </thead>
              <tbody>
                <FeatureRow feature="Workloads tracked" values={['100', '1,000', 'Unlimited', 'Unlimited']} />
                <FeatureRow feature="Cloud integrations" values={['1', '3', 'Unlimited', 'Unlimited']} />
                <FeatureRow feature="Team members" values={['1', '10', 'Unlimited', 'Unlimited']} />
                <FeatureRow feature="Data retention" values={['7 days', '90 days', '1 year', 'Custom']} />
                <FeatureRow feature="Custom assumptions" values={[false, true, true, true]} />
                <FeatureRow feature="API access" values={[false, true, true, true]} />
                <FeatureRow feature="SSO" values={[false, false, true, true]} />
                <FeatureRow feature="Audit logging" values={[false, false, true, true]} />
                <FeatureRow feature="Custom roles" values={[false, false, true, true]} />
                <FeatureRow feature="Scheduled reports" values={[false, 'Weekly', 'Daily', 'Custom']} />
                <FeatureRow feature="Support" values={['Email', 'Priority', 'Dedicated', 'Dedicated']} />
                <FeatureRow feature="SLA" values={[false, false, '99.9%', 'Custom']} />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 border-t border-neutral-800 bg-neutral-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div>
              <Shield className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-mono text-neutral-200 mb-1">SOC 2 Type II</h3>
              <p className="text-xs text-neutral-500">Enterprise security certified</p>
            </div>
            <div>
              <Clock className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-mono text-neutral-200 mb-1">99.9% Uptime</h3>
              <p className="text-xs text-neutral-500">Enterprise SLA guaranteed</p>
            </div>
            <div>
              <BarChart3 className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <h3 className="font-mono text-neutral-200 mb-1">Open Methodology</h3>
              <p className="text-xs text-neutral-500">Transparent calculations</p>
            </div>
            <div>
              <Leaf className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-mono text-neutral-200 mb-1">Carbon Neutral</h3>
              <p className="text-xs text-neutral-500">We offset our operations</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 border-t border-neutral-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-mono font-medium text-neutral-100 text-center mb-8 sm:mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-neutral-800 bg-neutral-900">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-medium text-neutral-200">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-neutral-400">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-mono font-medium text-neutral-100 mb-4">
            Ready to reduce your cloud carbon footprint?
          </h2>
          <p className="text-neutral-400 mb-8">
            Start your 14-day free trial today. No credit card required.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/login" className="btn-primary px-8 py-3 flex items-center gap-2">
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contact" className="btn-outline px-8 py-3">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            <span className="text-xs font-mono text-neutral-500">© 2026 Helios Energy</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-neutral-500">
            <Link href="/privacy" className="hover:text-neutral-300">Privacy</Link>
            <Link href="/terms" className="hover:text-neutral-300">Terms</Link>
            <Link href="/contact" className="hover:text-neutral-300">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureRow({ feature, values }: { feature: string; values: (string | boolean)[] }) {
  return (
    <tr className="border-b border-neutral-800/50">
      <td className="py-3 px-4 text-neutral-300">{feature}</td>
      {values.map((value, i) => (
        <td key={i} className={`py-3 px-4 text-center ${i === 1 ? 'bg-amber-950/10' : ''}`}>
          {typeof value === 'boolean' ? (
            value ? (
              <Check className="w-4 h-4 text-emerald-500 mx-auto" />
            ) : (
              <X className="w-4 h-4 text-neutral-600 mx-auto" />
            )
          ) : (
            <span className="text-neutral-400">{value}</span>
          )}
        </td>
      ))}
    </tr>
  );
}
