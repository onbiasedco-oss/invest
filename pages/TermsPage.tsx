import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Shield, AlertTriangle, Scale, Users, CreditCard, Ban, RefreshCw, Mail } from 'lucide-react';

const TermsPage: React.FC = () => {
  const sections = [
    {
      icon: FileText,
      title: '1. Acceptance of Terms',
      content: `By accessing and using NACCI Members Club ("the Platform"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this service.

These Terms of Service govern your use of our website, mobile applications, and all related services provided by NACCI Members Club. We reserve the right to update these terms at any time, and your continued use of the Platform constitutes acceptance of any modifications.`
    },
    {
      icon: Users,
      title: '2. User Accounts',
      content: `To access certain features of the Platform, you must register for an account. When creating your account, you must provide accurate and complete information. You are solely responsible for the activity that occurs on your account, and you must keep your account password secure.

You must notify us immediately of any breach of security or unauthorized use of your account. We will not be liable for any losses caused by any unauthorized use of your account. You may not use another user's account without permission.`
    },
    {
      icon: Shield,
      title: '3. Privacy & Data Protection',
      content: `Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal information. By using the Platform, you consent to our collection and use of personal data as outlined in our Privacy Policy.

We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security of your information.`
    },
    {
      icon: AlertTriangle,
      title: '4. Investment Disclaimer',
      content: `The information provided on NACCI Members Club is for educational and informational purposes only. It should not be considered as financial advice, investment advice, trading advice, or any other sort of advice.

All content on this Platform is information of a general nature and does not address the circumstances of any particular individual or entity. Nothing on this Platform constitutes professional and/or financial advice.

You alone assume the sole responsibility of evaluating the merits and risks associated with the use of any information or other content on the Platform before making any decisions based on such information. Past performance is not indicative of future results.`
    },
    {
      icon: Scale,
      title: '5. Intellectual Property',
      content: `The Platform and its original content, features, and functionality are owned by NACCI Members Club and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.

You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Platform without prior written consent.`
    },
    {
      icon: CreditCard,
      title: '6. Subscription & Payments',
      content: `Certain features of the Platform require a paid subscription. By subscribing, you agree to pay all fees associated with your chosen subscription plan. All fees are non-refundable unless otherwise stated.

We reserve the right to change our subscription fees at any time. Any price changes will be communicated to you in advance and will apply to subsequent billing cycles. Failure to pay may result in suspension or termination of your account.`
    },

    {
      icon: Ban,
      title: '7. Prohibited Activities',
      content: `You agree not to engage in any of the following prohibited activities:
• Copying, distributing, or disclosing any part of the Platform
• Using any automated system to access the Platform
• Transmitting spam, chain letters, or other unsolicited communications
• Attempting to interfere with or compromise the system integrity
• Collecting or harvesting any personally identifiable information
• Using the Platform for any illegal or unauthorized purpose
• Impersonating another person or entity`
    },
    {
      icon: RefreshCw,
      title: '8. Termination',
      content: `We may terminate or suspend your account and bar access to the Platform immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.

If you wish to terminate your account, you may simply discontinue using the Platform or contact us to request account deletion. All provisions of the Terms which by their nature should survive termination shall survive.`
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
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
              <p className="text-slate-400">Last updated: December 22, 2025</p>
            </div>
          </div>
          
          <p className="text-slate-300 text-lg">
            Please read these terms carefully before using NACCI Members Club. By using our platform, you agree to these terms.
          </p>
        </div>


        {/* Terms Sections */}
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
            <h2 className="text-xl font-semibold text-white">Questions About These Terms?</h2>
          </div>
          <p className="text-slate-300 mb-4">
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <a 
            href="mailto:legal@naccimembersclub.com" 
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            legal@naccimembersclub.com
          </a>

        </div>
      </div>
    </div>
  );
};

export default TermsPage;
