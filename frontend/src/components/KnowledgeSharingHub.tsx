import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Star, MessageSquare, Filter, Search, TrendingUp, Award, Share2, ThumbsUp, Eye, Calendar, Tag, Heart } from 'lucide-react';

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    organization?: string;
    avatar?: string;
    expertise: string[];
  };
  tags: string[];
  sector: string;
  category: 'best-practice' | 'case-study' | 'lesson-learned' | 'methodology' | 'tool';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
  isBookmarked: boolean;
  isLiked: boolean;
  estimatedReadTime: number;
  summary: string;
  keyTakeaways: string[];
  relatedArticles: string[];
  attachments?: {
    type: 'template' | 'tool' | 'guide';
    name: string;
    url: string;
  }[];
}

interface CommunityInsight {
  id: string;
  type: 'trend' | 'challenge' | 'opportunity' | 'innovation';
  title: string;
  description: string;
  impactLevel: 'low' | 'medium' | 'high';
  relevanceScore: number;
  sources: number;
  lastUpdated: string;
  affectedSectors: string[];
}

interface Discussion {
  id: string;
  title: string;
  category: string;
  author: string;
  replies: number;
  views: number;
  lastActivity: string;
  isHot: boolean;
  tags: string[];
}

const KnowledgeSharingHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'articles' | 'insights' | 'discussions' | 'contribute'>('articles');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [insights, setInsights] = useState<CommunityInsight[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockArticles: KnowledgeArticle[] = [
      {
        id: 'art1',
        title: 'Building Effective Theory of Change: A Step-by-Step Guide',
        content: 'Comprehensive guide on developing robust theories of change...',
        author: {
          name: 'Dr. Sarah Chen',
          organization: 'Impact Measurement Institute',
          expertise: ['Theory of Change', 'Impact Strategy', 'Evaluation Design']
        },
        tags: ['theory-of-change', 'strategy', 'foundation'],
        sector: 'General',
        category: 'methodology',
        difficulty: 'intermediate',
        rating: 4.8,
        views: 2341,
        likes: 189,
        comments: 23,
        publishedAt: '2024-01-15',
        isBookmarked: false,
        isLiked: false,
        estimatedReadTime: 12,
        summary: 'Learn how to create compelling theories of change that drive meaningful impact and inform measurement strategies.',
        keyTakeaways: [
          'Start with clear problem definition',
          'Map causal pathways systematically',
          'Include assumptions and external factors',
          'Design for measurement from the beginning'
        ],
        relatedArticles: ['art2', 'art3'],
        attachments: [
          { type: 'template', name: 'Theory of Change Template', url: '/downloads/toc-template.xlsx' },
          { type: 'guide', name: 'ToC Workshop Facilitation Guide', url: '/downloads/toc-workshop-guide.pdf' }
        ]
      },
      {
        id: 'art2',
        title: 'Overcoming Data Collection Challenges in Remote Areas',
        content: 'Real-world strategies for collecting reliable impact data in challenging environments...',
        author: {
          name: 'Marcus Rodriguez',
          organization: 'Rural Development Alliance',
          expertise: ['Data Collection', 'Field Operations', 'Technology Solutions']
        },
        tags: ['data-collection', 'remote', 'technology', 'challenges'],
        sector: 'International Development',
        category: 'case-study',
        difficulty: 'advanced',
        rating: 4.6,
        views: 1876,
        likes: 142,
        comments: 31,
        publishedAt: '2024-01-10',
        isBookmarked: true,
        isLiked: true,
        estimatedReadTime: 8,
        summary: 'Practical solutions for data collection challenges including technology, training, and community engagement approaches.',
        keyTakeaways: [
          'Mobile-first data collection tools are essential',
          'Community engagement improves data quality',
          'Offline capabilities are crucial',
          'Local capacity building is key to sustainability'
        ],
        relatedArticles: ['art1', 'art4']
      },
      {
        id: 'art3',
        title: 'Indicator Selection: Quality over Quantity',
        content: 'Why choosing fewer, better indicators leads to more effective measurement...',
        author: {
          name: 'Dr. Aisha Patel',
          organization: 'Evaluation Excellence',
          expertise: ['Indicator Development', 'Measurement Strategy', 'Evaluation Methods']
        },
        tags: ['indicators', 'measurement', 'strategy', 'quality'],
        sector: 'Health',
        category: 'best-practice',
        difficulty: 'beginner',
        rating: 4.9,
        views: 3021,
        likes: 267,
        comments: 45,
        publishedAt: '2024-01-08',
        isBookmarked: false,
        isLiked: false,
        estimatedReadTime: 6,
        summary: 'Learn why focusing on fewer, high-quality indicators produces better measurement outcomes and decision-making.',
        keyTakeaways: [
          'Quality trumps quantity in indicator selection',
          'Focus on decision-critical metrics',
          'Balance leading and lagging indicators',
          'Consider measurement burden vs. value'
        ],
        relatedArticles: ['art1', 'art2']
      }
    ];

    const mockInsights: CommunityInsight[] = [
      {
        id: 'ins1',
        type: 'trend',
        title: 'Growing Adoption of Real-Time Impact Monitoring',
        description: 'Organizations are increasingly implementing real-time monitoring systems to enable adaptive management and quicker course correction.',
        impactLevel: 'high',
        relevanceScore: 89,
        sources: 156,
        lastUpdated: '2024-01-20',
        affectedSectors: ['Health', 'Education', 'Environment']
      },
      {
        id: 'ins2',
        type: 'challenge',
        title: 'Data Privacy Regulations Affecting Impact Measurement',
        description: 'New data protection laws are creating compliance challenges for organizations collecting beneficiary data.',
        impactLevel: 'medium',
        relevanceScore: 76,
        sources: 89,
        lastUpdated: '2024-01-18',
        affectedSectors: ['General']
      },
      {
        id: 'ins3',
        type: 'innovation',
        title: 'AI-Powered Outcome Prediction Models',
        description: 'Machine learning models are being used to predict long-term outcomes from early indicators, enabling proactive intervention.',
        impactLevel: 'high',
        relevanceScore: 82,
        sources: 67,
        lastUpdated: '2024-01-16',
        affectedSectors: ['Health', 'Education']
      }
    ];

    const mockDiscussions: Discussion[] = [
      {
        id: 'disc1',
        title: 'Best practices for stakeholder engagement in measurement design',
        category: 'Strategy',
        author: 'Emily Foster',
        replies: 23,
        views: 456,
        lastActivity: '2024-01-20',
        isHot: true,
        tags: ['stakeholder-engagement', 'measurement-design']
      },
      {
        id: 'disc2',
        title: 'Tools for automated data visualization and reporting',
        category: 'Technology',
        author: 'David Kim',
        replies: 18,
        views: 321,
        lastActivity: '2024-01-19',
        isHot: false,
        tags: ['data-visualization', 'reporting', 'automation']
      },
      {
        id: 'disc3',
        title: 'Measuring social impact in education programs',
        category: 'Sector-Specific',
        author: 'Lisa Thompson',
        replies: 31,
        views: 578,
        lastActivity: '2024-01-18',
        isHot: true,
        tags: ['education', 'social-impact', 'measurement']
      }
    ];

    setArticles(mockArticles);
    setInsights(mockInsights);
    setDiscussions(mockDiscussions);
    setIsLoading(false);
  }, []);

  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSector = selectedSector === 'all' || article.sector === selectedSector;
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    
    return matchesSearch && matchesSector && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'best-practice': return '⭐';
      case 'case-study': return '📊';
      case 'lesson-learned': return '💡';
      case 'methodology': return '🔬';
      case 'tool': return '🛠️';
      default: return '📝';
    }
  };

  const getImpactLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const renderArticleCard = (article: KnowledgeArticle) => (
    <div key={article.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{getCategoryIcon(article.category)}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(article.difficulty)}`}>
              {article.difficulty}
            </span>
            <span className="text-xs text-gray-500">{article.estimatedReadTime} min read</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer">
            {article.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            {article.summary}
          </p>
        </div>
        <div className="flex space-x-2 ml-4">
          <button 
            className={`p-2 rounded-full ${article.isBookmarked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'} hover:bg-blue-100 hover:text-blue-600`}
          >
            <Star className="h-4 w-4" />
          </button>
          <button 
            className={`p-2 rounded-full ${article.isLiked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'} hover:bg-red-100 hover:text-red-600`}
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {article.tags.slice(0, 3).map(tag => (
          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
            #{tag}
          </span>
        ))}
        {article.tags.length > 3 && (
          <span className="text-xs text-gray-500">+{article.tags.length - 3} more</span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400" />
            <span>{article.rating}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Eye className="h-4 w-4" />
            <span>{article.views.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <ThumbsUp className="h-4 w-4" />
            <span>{article.likes}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageSquare className="h-4 w-4" />
            <span>{article.comments}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span>by {article.author.name}</span>
          <span>•</span>
          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {article.keyTakeaways && article.keyTakeaways.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Key Takeaways:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {article.keyTakeaways.slice(0, 2).map((takeaway, idx) => (
              <li key={idx} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderInsightCard = (insight: CommunityInsight) => (
    <div key={insight.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">
              {insight.type === 'trend' ? '📈' : 
               insight.type === 'challenge' ? '⚠️' : 
               insight.type === 'opportunity' ? '🎯' : '💡'}
            </span>
            <span className="capitalize text-sm font-medium text-gray-600">{insight.type}</span>
            <span className={`text-sm font-medium ${getImpactLevelColor(insight.impactLevel)}`}>
              {insight.impactLevel} impact
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {insight.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            {insight.description}
          </p>
        </div>
        <div className="text-right ml-4">
          <div className="text-lg font-bold text-blue-600">{insight.relevanceScore}%</div>
          <div className="text-xs text-gray-500">relevance</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {insight.affectedSectors.map(sector => (
          <span key={sector} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
            {sector}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <span>{insight.sources} sources</span>
          <span>•</span>
          <span>Updated {new Date(insight.lastUpdated).toLocaleDateString()}</span>
        </div>
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          Learn More →
        </button>
      </div>
    </div>
  );

  const renderDiscussionCard = (discussion: Discussion) => (
    <div key={discussion.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {discussion.isHot && (
              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded">
                🔥 Hot
              </span>
            )}
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              {discussion.category}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer">
            {discussion.title}
          </h3>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {discussion.tags.slice(0, 3).map(tag => (
          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <MessageSquare className="h-4 w-4" />
            <span>{discussion.replies} replies</span>
          </div>
          <div className="flex items-center space-x-1">
            <Eye className="h-4 w-4" />
            <span>{discussion.views} views</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span>by {discussion.author}</span>
          <span>•</span>
          <span>{new Date(discussion.lastActivity).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Knowledge Sharing Hub</h1>
        <p className="text-gray-600">Learn from the community's collective wisdom and share your own insights.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6 border-b border-gray-200">
        {[
          { key: 'articles', label: 'Articles & Guides', icon: BookOpen },
          { key: 'insights', label: 'Community Insights', icon: TrendingUp },
          { key: 'discussions', label: 'Discussions', icon: MessageSquare },
          { key: 'contribute', label: 'Contribute', icon: Share2 }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'articles' && (
        <div className="space-y-6">
          {/* Filters and Search */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search articles, tags, or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Sectors</option>
                <option value="General">General</option>
                <option value="Health">Health</option>
                <option value="Education">Education</option>
                <option value="Environment">Environment</option>
                <option value="International Development">International Development</option>
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="best-practice">Best Practices</option>
                <option value="case-study">Case Studies</option>
                <option value="lesson-learned">Lessons Learned</option>
                <option value="methodology">Methodology</option>
                <option value="tool">Tools</option>
              </select>
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredArticles.map(renderArticleCard)}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {insights.map(renderInsightCard)}
          </div>
        </div>
      )}

      {activeTab === 'discussions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                🔥 Hot Topics
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                📅 Recent
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                💬 Most Replies
              </button>
            </div>
            <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
              + Start Discussion
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {discussions.map(renderDiscussionCard)}
          </div>
        </div>
      )}

      {activeTab === 'contribute' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-8 text-center">
            <Award className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Share Your Knowledge</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Help the impact measurement community by sharing your experiences, insights, and learnings. 
              Your contribution can help others avoid pitfalls and achieve better outcomes.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="text-3xl mb-3">📝</div>
                <h3 className="font-semibold text-gray-900 mb-2">Write an Article</h3>
                <p className="text-gray-600 text-sm mb-4">Share detailed guides, methodologies, or case studies</p>
                <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Start Writing
                </button>
              </div>
              
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="text-3xl mb-3">💡</div>
                <h3 className="font-semibold text-gray-900 mb-2">Share an Insight</h3>
                <p className="text-gray-600 text-sm mb-4">Contribute observations about trends or challenges</p>
                <button className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                  Share Insight
                </button>
              </div>
              
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="text-3xl mb-3">🛠️</div>
                <h3 className="font-semibold text-gray-900 mb-2">Submit a Tool</h3>
                <p className="text-gray-600 text-sm mb-4">Share templates, calculators, or other resources</p>
                <button className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                  Upload Tool
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeSharingHub;