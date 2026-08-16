import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Target, Users, Award, TrendingUp, Shield, BookOpen, Lightbulb, Loader2, Edit, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface AboutSection {
  section_key: string;
  title: string;
  content: string;
  metadata: any;
}

const iconMap: Record<string, React.ElementType> = {
  BookOpen,
  Shield,
  Users,
  Lightbulb,
  Target,
  TrendingUp,
  Award
};

const AboutPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState<Record<string, AboutSection>>({});
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.is_admin || user?.email === 'naccitheceo@gmail.com';

  // Default content as fallback
  const defaultValues = [
    {
      icon: 'BookOpen',
      title: 'Education First',
      description: 'We believe that financial literacy is the foundation of successful investing. Our mission is to empower individuals with knowledge.'
    },
    {
      icon: 'Shield',
      title: 'Transparency',
      description: 'We provide clear, unbiased information without hidden agendas. Our analysis is based on data, not speculation.'
    },
    {
      icon: 'Users',
      title: 'Community',
      description: 'We foster a supportive community where investors of all levels can learn, share, and grow together.'
    },
    {
      icon: 'Lightbulb',
      title: 'Innovation',
      description: 'We continuously improve our tools and resources to help you make better investment decisions.'
    }
  ];

  const defaultStats = [
    { value: '50,000+', label: 'Active Members' },
    { value: '200+', label: 'Educational Courses' },
    { value: '1,000+', label: 'Stock Analyses' },
    { value: '98%', label: 'Member Satisfaction' }
  ];

  const defaultTeam = [
    {
      name: 'Michael Chen',
      role: 'Founder & CEO',
      bio: 'Former Wall Street analyst with 15+ years of experience in equity research and portfolio management.'
    },
    {
      name: 'Sarah Williams',
      role: 'Chief Education Officer',
      bio: 'PhD in Finance from Wharton, dedicated to making complex financial concepts accessible to everyone.'
    },
    {
      name: 'David Rodriguez',
      role: 'Head of Research',
      bio: 'CFA charterholder with expertise in fundamental analysis and quantitative strategies.'
    },
    {
      name: 'Emily Thompson',
      role: 'Community Director',
      bio: 'Passionate about building engaged communities and helping members achieve their financial goals.'
    }
  ];

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('about_page_content')
        .select('*');

      if (error) throw error;

      const contentMap: Record<string, AboutSection> = {};
      (data || []).forEach((section: AboutSection) => {
        contentMap[section.section_key] = section;
      });
      setSections(contentMap);
    } catch (error) {
      console.error('Error fetching about page content:', error);
    } finally {
      setLoading(false);
    }
  };

  const values = sections.values?.metadata?.values || defaultValues;
  const stats = sections.stats?.metadata?.stats || defaultStats;
  const team = sections.team?.metadata?.team || defaultTeam;
  const missionContent = sections.mission?.content || 'At NACCI Members Club, we\'re on a mission to democratize investment education. We believe that everyone deserves access to the knowledge and tools needed to build wealth and secure their financial future. Through comprehensive courses, real-time market analysis, and a supportive community, we help our members navigate the complex world of investing with confidence.';
  const storyContent = sections.story?.content || `NACCI Members Club was founded in 2020 with a simple idea: make quality investment education accessible to everyone, not just Wall Street insiders.

Our founder, Michael Chen, spent 15 years on Wall Street and witnessed firsthand how the average investor was often left behind. Complex jargon, expensive advisors, and information asymmetry created barriers that prevented everyday people from building wealth through smart investing.

Today, we've grown into a thriving community of over 50,000 members who are taking control of their financial futures. From beginners learning the basics to experienced traders refining their strategies, our platform serves investors at every level.`;


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <Link 
              to="/home" 
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Home
            </Link>
            
            {/* Admin Edit Button */}
            {isAdmin && (
              <button
                onClick={() => navigate('/admin?tab=about-page')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-amber-500/25 transition-all"
              >
                <Edit className="w-4 h-4" />
                Edit Page
              </button>
            )}
          </div>
          
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl">
                <BarChart3 className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">About NACCI Members Club</h1>
            <p className="text-xl text-slate-300">
              Empowering investors with education, tools, and insights to make informed financial decisions.
            </p>
          </div>
        </div>



        {/* Admin Notice Banner */}
        {isAdmin && (
          <div className="mb-8 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Settings className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-amber-400 font-medium">Admin Mode</p>
                <p className="text-slate-400 text-sm">
                  You can edit this page's content. Click "Edit Page" above or go to the{' '}
                  <Link to="/admin?tab=about-page" className="text-cyan-400 hover:underline">
                    Admin Panel → About Page Editor
                  </Link>
                </p>

              </div>
            </div>
          </div>
        )}

        {/* Mission Section */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-8 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-8 h-8 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">{sections.mission?.title || 'Our Mission'}</h2>
          </div>
          <p className="text-lg text-slate-300 leading-relaxed">
            {missionContent}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat: { value: string; label: string }, index: number) => (
            <div 
              key={index}
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center"
            >
              <div className="text-3xl font-bold text-cyan-400 mb-2">{stat.value}</div>
              <div className="text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Values */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">{sections.values?.title || 'Our Values'}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value: { icon: string; title: string; description: string }, index: number) => {
              const IconComponent = iconMap[value.icon] || BookOpen;
              return (
                <div 
                  key={index}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="p-3 bg-cyan-500/20 rounded-lg w-fit mb-4">
                    <IconComponent className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{value.title}</h3>
                  <p className="text-slate-400 text-sm">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">{sections.story?.title || 'Our Story'}</h2>
          </div>
          <div className="space-y-4 text-slate-300">
            {storyContent.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6 justify-center">
            <Award className="w-8 h-8 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">{sections.team?.title || 'Leadership Team'}</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member: { name: string; role: string; bio: string }, index: number) => (
              <div 
                key={index}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center hover:border-cyan-500/50 transition-colors"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{member.name}</h3>
                <p className="text-cyan-400 text-sm mb-3">{member.role}</p>
                <p className="text-slate-400 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Start Your Investment Journey?</h2>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Join thousands of members who are already building their financial future with The Club.
          </p>
          <Link 
            to="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all"
          >
            Explore Our Courses
            <TrendingUp className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
