import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Twitter, Linkedin, Github, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Platform: [
      { label: 'Home', path: '/home' },
      { label: 'Industries', path: '/industries' },
      { label: 'News', path: '/news' },
      { label: 'Courses', path: '/courses' },
      { label: 'Resources', path: '/resources' },
    ],
    Learn: [
      { label: 'Investment Basics', path: '/courses' },
      { label: 'Technical Analysis', path: '/courses' },
      { label: 'Portfolio Management', path: '/courses' },
      { label: 'Market News', path: '/news' },
    ],
    Company: [
      { label: 'About Us', path: '/about' },
      { label: 'Contact', path: '/contact' },
      { label: 'Careers', path: '/about' },
      { label: 'Blog', path: '/news' },
    ],

    Legal: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Disclaimer', path: '/terms' },
      { label: 'Cookie Policy', path: '/privacy' },
    ],
  };


  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Github, href: 'https://github.com', label: 'GitHub' },
    { icon: Mail, href: 'mailto:hello@naccimembersclub.com', label: 'Email' },

  ];

  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 md:col-span-2">
            <Link to="/home" className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-white">
                NACCI <span className="text-cyan-400">Members Club</span>
              </span>

            </Link>
            <p className="text-slate-400 text-xs sm:text-sm mb-4 sm:mb-6 max-w-xs">
              Your premier destination for investment education, stock analysis, and market insights.
            </p>
            <p className="text-slate-500 text-xs mb-4">
              <a href="https://naccimembersclub.com" className="hover:text-cyan-400 transition-colors">
                naccimembersclub.com
              </a>
            </p>
            <div className="flex items-center gap-2 sm:gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:bg-cyan-500/20 hover:text-cyan-400 transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="col-span-1">
              <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{category}</h3>
              <ul className="space-y-1.5 sm:space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="text-slate-400 text-xs sm:text-sm hover:text-cyan-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-6 sm:pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-slate-500 text-xs sm:text-sm text-center sm:text-left">
            © {currentYear} NACCI Members Club. All rights reserved.
          </p>
          <p className="text-slate-500 text-[10px] sm:text-xs text-center sm:text-right">
            Investment involves risk. Past performance is not indicative of future results.
          </p>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
