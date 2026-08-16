import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Database, Lock, Share2, Cookie, UserCheck, Globe, Mail } from 'lucide-react';

const PrivacyPage: React.FC = () => {
  const sections = [
    {
      icon: Eye,
      title: '1. Information We Collect',
      content: `We collect information you provide directly to us, such as when you create an account, subscribe to our services, or contact us for support.

Personal Information:
• Name and email address
• Account credentials
• Payment information (processed securely through third-party providers)
• Profile information and preferences

Automatically Collected Information:
• Device and browser information
• IP address and location data
• Usage patterns and interactions with our Platform
• Cookies and similar tracking technologies`
    },
    {
      icon: Database,
      title: '2. How We Use Your Information',
      content: `We use the information we collect to:
• Provide, maintain, and improve our services
• Process transactions and send related information
• Send you technical notices, updates, and support messages
• Respond to your comments, questions, and customer service requests
• Communicate with you about products, services, and events
• Monitor and analyze trends, usage, and activities
• Detect, investigate, and prevent fraudulent transactions
• Personalize and improve your experience on the Platform`
    },
    {
      icon: Share2,
      title: '3. Information Sharing',
      content: `We do not sell, trade, or otherwise transfer your personal information to outside parties except in the following circumstances:

• Service Providers: We may share information with third-party vendors who assist us in operating our Platform
• Legal Requirements: When required by law or to respond to legal process
• Protection of Rights: To protect the rights, property, or safety of NACCI Members Club, our users, or others
• Business Transfers: In connection with any merger, sale, or acquisition of our company


We require all third parties to respect the security of your personal data and to treat it in accordance with the law.`
    },
    {
      icon: Lock,
      title: '4. Data Security',
      content: `We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

Security measures include:
• Encryption of data in transit and at rest
• Regular security assessments and audits
• Access controls and authentication mechanisms
• Secure data storage practices
• Employee training on data protection

However, no method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.`
    },
    {
      icon: Cookie,
      title: '5. Cookies & Tracking',
      content: `We use cookies and similar tracking technologies to track activity on our Platform and hold certain information.

Types of cookies we use:
• Essential Cookies: Required for the Platform to function properly
• Analytics Cookies: Help us understand how visitors interact with our Platform
• Preference Cookies: Remember your settings and preferences
• Marketing Cookies: Used to deliver relevant advertisements

You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, some features of the Platform may not function properly without cookies.`
    },
    {
      icon: UserCheck,
      title: '6. Your Rights',
      content: `Depending on your location, you may have certain rights regarding your personal information:

• Access: Request access to your personal data
• Correction: Request correction of inaccurate data
• Deletion: Request deletion of your personal data
• Portability: Request a copy of your data in a portable format
• Objection: Object to processing of your personal data
• Restriction: Request restriction of processing
• Withdrawal: Withdraw consent at any time

To exercise any of these rights, please contact us using the information provided below.`
    },
    {
      icon: Globe,
      title: '7. International Transfers',
      content: `Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ.

If you are located outside the United States and choose to provide information to us, please note that we transfer the data to the United States and process it there.

We ensure appropriate safeguards are in place to protect your information when transferred internationally, including standard contractual clauses and other legally recognized transfer mechanisms.`
    },
    {
      icon: Shield,
      title: '8. Children\'s Privacy',
      content: `Our Platform is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18.

If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us. If we become aware that we have collected personal information from children without verification of parental consent, we take steps to remove that information from our servers.`
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/home" 
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
              <p className="text-slate-400">Last updated: December 22, 2025</p>
            </div>
          </div>
          
          <p className="text-slate-300 text-lg">
            Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
          </p>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <div 
              key={index}
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-cyan-500/20 rounded-lg flex-shrink-0">
                  <section.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white mb-3">{section.title}</h2>
                  <div className="text-slate-300 whitespace-pre-line leading-relaxed">
                    {section.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">Privacy Concerns?</h2>
          </div>
          <p className="text-slate-300 mb-4">
            If you have any questions about this Privacy Policy or our data practices, please contact our Data Protection Officer at:
          </p>
          <a 
            href="mailto:privacy@naccimembersclub.com" 
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            privacy@naccimembersclub.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
