import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Check,
  FileText,
  Users,
  Target,
  TrendingUp,
  Award,
  BookOpen,
  Shield,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface AboutSection {
  id: string;
  section_key: string;
  title: string;
  content: string;
  metadata: any;
  updated_at: string;
}

interface TeamMember {
  name: string;
  role: string;
  bio: string;
}

interface StatItem {
  value: string;
  label: string;
}

interface ValueItem {
  icon: string;
  title: string;
  description: string;
}

const AboutPageEditor: React.FC = () => {
  const { user } = useAuth();
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; content: string; metadata: any }>({
    title: '',
    content: '',
    metadata: {}
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('about_page_content')
        .select('*')
        .order('created_at');

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching about page content:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (section: AboutSection) => {
    setEditingSection(section.section_key);
    setEditForm({
      title: section.title || '',
      content: section.content || '',
      metadata: section.metadata || {}
    });
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditForm({ title: '', content: '', metadata: {} });
  };

  const saveSection = async (sectionKey: string) => {
    setSaving(sectionKey);
    try {
      const { error } = await supabase
        .from('about_page_content')
        .update({
          title: editForm.title,
          content: editForm.content,
          metadata: editForm.metadata,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('section_key', sectionKey);

      if (error) throw error;

      setSuccessMessage('Section saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      await fetchSections();
      setEditingSection(null);
    } catch (error) {
      console.error('Error saving section:', error);
    } finally {
      setSaving(null);
    }
  };

  // Team member handlers
  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    const team = [...(editForm.metadata.team || [])];
    team[index] = { ...team[index], [field]: value };
    setEditForm(prev => ({ ...prev, metadata: { ...prev.metadata, team } }));
  };

  const addTeamMember = () => {
    const team = [...(editForm.metadata.team || []), { name: '', role: '', bio: '' }];
    setEditForm(prev => ({ ...prev, metadata: { ...prev.metadata, team } }));
  };

  const removeTeamMember = (index: number) => {
    const team = editForm.metadata.team.filter((_: any, i: number) => i !== index);
    setEditForm(prev => ({ ...prev, metadata: { ...prev.metadata, team } }));
  };

  // Stats handlers
  const updateStat = (index: number, field: keyof StatItem, value: string) => {
    const stats = [...(editForm.metadata.stats || [])];
    stats[index] = { ...stats[index], [field]: value };
    setEditForm(prev => ({ ...prev, metadata: { ...prev.metadata, stats } }));
  };

  const addStat = () => {
    const stats = [...(editForm.metadata.stats || []), { value: '', label: '' }];
    setEditForm(prev => ({ ...prev, metadata: { ...prev.metadata, stats } }));
  };

  const removeStat = (index: number) => {
    const stats = editForm.metadata.stats.filter((_: any, i: number) => i !== index);
    setEditForm(prev => ({ ...prev, metadata: { ...prev.metadata, stats } }));
  };

  // Values handlers
  const updateValue = (index: number, field: keyof ValueItem, value: string) => {
    const values = [...(editForm.metadata.values || [])];
    values[index] = { ...values[index], [field]: value };
    setEditForm(prev => ({ ...prev, metadata: { ...prev.metadata, values } }));
  };

  const addValue = () => {
    const values = [...(editForm.metadata.values || []), { icon: 'BookOpen', title: '', description: '' }];
    setEditForm(prev => ({ ...prev, metadata: { ...prev.metadata, values } }));
  };

  const removeValue = (index: number) => {
    const values = editForm.metadata.values.filter((_: any, i: number) => i !== index);
    setEditForm(prev => ({ ...prev, metadata: { ...prev.metadata, values } }));
  };

  const iconOptions = ['BookOpen', 'Shield', 'Users', 'Lightbulb', 'Target', 'TrendingUp', 'Award'];

  const getSectionIcon = (key: string) => {
    switch (key) {
      case 'mission': return <Target className="w-5 h-5 text-cyan-400" />;
      case 'story': return <TrendingUp className="w-5 h-5 text-purple-400" />;
      case 'stats': return <Award className="w-5 h-5 text-amber-400" />;
      case 'values': return <Shield className="w-5 h-5 text-emerald-400" />;
      case 'team': return <Users className="w-5 h-5 text-blue-400" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">About Page Editor</h2>
          <p className="text-slate-400 text-sm">Edit the content displayed on the About Us page</p>
        </div>
        <button
          onClick={fetchSections}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 flex items-center gap-2">
          <Check className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div
            key={section.id}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-700 rounded-lg">
                  {getSectionIcon(section.section_key)}
                </div>
                <div>
                  <h3 className="font-semibold text-white capitalize">
                    {section.section_key.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Last updated: {new Date(section.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {editingSection !== section.section_key ? (
                <button
                  onClick={() => startEditing(section)}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelEditing}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={() => saveSection(section.section_key)}
                    disabled={saving === section.section_key}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {saving === section.section_key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save
                  </button>
                </div>
              )}
            </div>

            {/* Section Content */}
            <div className="p-4">
              {editingSection === section.section_key ? (
                <div className="space-y-4">
                  {/* Title Field */}
                  {(section.section_key === 'mission' || section.section_key === 'story') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Content</label>
                        <textarea
                          value={editForm.content}
                          onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                          rows={6}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Stats Editor */}
                  {section.section_key === 'stats' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-300">Statistics</label>
                        <button
                          onClick={addStat}
                          className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30"
                        >
                          <Plus className="w-4 h-4" />
                          Add Stat
                        </button>
                      </div>
                      {(editForm.metadata.stats || []).map((stat: StatItem, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                          <input
                            type="text"
                            value={stat.value}
                            onChange={(e) => updateStat(index, 'value', e.target.value)}
                            placeholder="Value (e.g., 50,000+)"
                            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                          />
                          <input
                            type="text"
                            value={stat.label}
                            onChange={(e) => updateStat(index, 'label', e.target.value)}
                            placeholder="Label (e.g., Active Members)"
                            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                          />
                          <button
                            onClick={() => removeStat(index)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Values Editor */}
                  {section.section_key === 'values' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-300">Values</label>
                        <button
                          onClick={addValue}
                          className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30"
                        >
                          <Plus className="w-4 h-4" />
                          Add Value
                        </button>
                      </div>
                      {(editForm.metadata.values || []).map((value: ValueItem, index: number) => (
                        <div key={index} className="p-4 bg-slate-900/50 rounded-lg space-y-3">
                          <div className="flex items-center gap-3">
                            <select
                              value={value.icon}
                              onChange={(e) => updateValue(index, 'icon', e.target.value)}
                              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                            >
                              {iconOptions.map(icon => (
                                <option key={icon} value={icon}>{icon}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={value.title}
                              onChange={(e) => updateValue(index, 'title', e.target.value)}
                              placeholder="Title"
                              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                            />
                            <button
                              onClick={() => removeValue(index)}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <textarea
                            value={value.description}
                            onChange={(e) => updateValue(index, 'description', e.target.value)}
                            placeholder="Description"
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 resize-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Team Editor */}
                  {section.section_key === 'team' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-300">Team Members</label>
                        <button
                          onClick={addTeamMember}
                          className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30"
                        >
                          <Plus className="w-4 h-4" />
                          Add Member
                        </button>
                      </div>
                      {(editForm.metadata.team || []).map((member: TeamMember, index: number) => (
                        <div key={index} className="p-4 bg-slate-900/50 rounded-lg space-y-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={member.name}
                              onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                              placeholder="Name"
                              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                            />
                            <input
                              type="text"
                              value={member.role}
                              onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                              placeholder="Role"
                              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                            />
                            <button
                              onClick={() => removeTeamMember(index)}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <textarea
                            value={member.bio}
                            onChange={(e) => updateTeamMember(index, 'bio', e.target.value)}
                            placeholder="Bio"
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 resize-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-400 text-sm">
                  {section.section_key === 'mission' || section.section_key === 'story' ? (
                    <div>
                      <p className="text-white font-medium mb-2">{section.title}</p>
                      <p className="line-clamp-3">{section.content}</p>
                    </div>
                  ) : section.section_key === 'stats' ? (
                    <div className="flex flex-wrap gap-4">
                      {(section.metadata?.stats || []).map((stat: StatItem, i: number) => (
                        <div key={i} className="px-3 py-2 bg-slate-700/50 rounded-lg">
                          <span className="text-cyan-400 font-bold">{stat.value}</span>
                          <span className="text-slate-400 ml-2">{stat.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : section.section_key === 'values' ? (
                    <div className="flex flex-wrap gap-2">
                      {(section.metadata?.values || []).map((value: ValueItem, i: number) => (
                        <span key={i} className="px-3 py-1 bg-slate-700/50 rounded-lg text-white">
                          {value.title}
                        </span>
                      ))}
                    </div>
                  ) : section.section_key === 'team' ? (
                    <div className="flex flex-wrap gap-2">
                      {(section.metadata?.team || []).map((member: TeamMember, i: number) => (
                        <span key={i} className="px-3 py-1 bg-slate-700/50 rounded-lg text-white">
                          {member.name} - {member.role}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>No content</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AboutPageEditor;
