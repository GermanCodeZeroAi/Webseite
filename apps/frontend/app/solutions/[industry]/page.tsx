import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getIndustry, getIndustryPaths, getIndustryContent } from '@/lib/industries';

// Load i18n content
import deContent from '../../../../config/i18n/de.json';
import enContent from '../../../../config/i18n/en.json';

interface PageProps {
  params: { industry: string };
}

export async function generateStaticParams() {
  return getIndustryPaths();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const industry = getIndustry(params.industry);
  
  if (!industry) {
    return {
      title: 'Industry Not Found',
    };
  }

  return {
    title: `${industry.name} Solutions`,
    description: `Automation solutions specifically designed for ${industry.name}. ${industry.notes}`,
    openGraph: {
      title: `${industry.name} Solutions`,
      description: `Automation solutions specifically designed for ${industry.name}. ${industry.notes}`,
      type: 'website',
    },
  };
}

function ServiceBenefit({ service, content }: { service: string; content: any }) {
  const serviceData = content.services[service];
  
  if (!serviceData) return null;

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {service === 'email' && 'Smart Email Tools'}
        {service === 'telephony' && 'Intelligent Call Flows'}
        {service === 'image' && 'Image Assistant'}
        {service === 'video' && 'Video Assistant'}
        {service === 'music' && 'Music Generation'}
        {service === 'websites' && 'Website Optimization'}
      </h3>
      <p className="text-gray-600 mb-4">{serviceData.short}</p>
      <ul className="space-y-2">
        {serviceData.benefits.map((benefit: string, index: number) => (
          <li key={index} className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700">{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FAQ({ industryName }: { industryName: string }) {
  const faqs = [
    {
      question: `How quickly can we implement automation for ${industryName}?`,
      answer: `Most ${industryName} organizations see initial results within 2-4 weeks. Our pre-configured industry templates accelerate deployment significantly.`
    },
    {
      question: `Is the solution compliant with ${industryName} regulations?`,
      answer: `Yes, our local-first approach ensures your data stays on your infrastructure, meeting the strictest compliance requirements for ${industryName}.`
    },
    {
      question: `What level of customization is available?`,
      answer: `Our solutions are built to adapt to your specific ${industryName} workflows while providing industry-standard templates as a starting point.`
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-8">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {faq.question}
              </h3>
              <p className="text-gray-600">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CallToAction({ content }: { content: any }) {
  return (
    <section className="py-16 bg-blue-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">
          Ready to Transform Your Operations?
        </h2>
        <p className="text-xl text-blue-100 mb-8">
          Join industry leaders who have already automated their critical workflows
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
            {content.cta.primary}
          </button>
          <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
            {content.cta.secondary}
          </button>
        </div>
      </div>
    </section>
  );
}

export default function IndustryPage({ params }: PageProps) {
  const industry = getIndustry(params.industry);
  
  if (!industry) {
    notFound();
  }

  const industryContent = getIndustryContent(industry);
  // Default to English content for now
  const content = enContent;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {industry.name} Solutions
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            {content.hero.sub}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {content.hero.bullets.map((bullet: string, index: number) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-white text-sm">{bullet}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry-Specific Note */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-yellow-600 mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                Optimized for {industry.name}
              </h2>
              <p className="text-yellow-700">
                {industry.notes}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Recommended Solutions for {industry.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industryContent.recommendedServices.map((service: string) => (
              <ServiceBenefit key={service} service={service} content={content} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ industryName={industry.name} />

      {/* CTA Section */}
      <CallToAction content={content} />
    </div>
  );
}