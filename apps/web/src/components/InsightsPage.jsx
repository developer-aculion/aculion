import React, { useState, useEffect } from 'react';
import './InsightsPage.css';

// ── Default Blog Articles Data ──
const DEFAULT_BLOGS = [
  {
    id: 'attention-metrics-2026',
    title: 'The Future of Digital Out-of-Home: How AI is Redefining Attention Metrics in 2026',
    excerpt: 'For decades, OOH has relied on daily traffic estimates. Now, computer vision and edge intelligence are transforming billboards into measurable, high-impact digital assets that track direct human attention.',
    category: 'AI & Tech',
    author: {
      name: 'Dr. Elena Rostova',
      role: 'Chief AI Scientist',
      initials: 'ER'
    },
    publishDate: 'July 2, 2026',
    readTime: '6 min read',
    likes: 124,
    image: '/blog_attention_metrics.png',
    trending: true,
    content: [
      { type: 'paragraph', text: 'For over a century, Out-of-Home (OOH) advertising has operated under a shroud of educated guesswork. Media owners sold billboard placements based on average daily traffic counts compiled by local transport departments, while brands and agencies paid premiums based on raw estimates of potential reach. In the digital age, where every click, impression, and scroll is tracked with surgical precision, this lack of attribution made physical billboards vulnerable to budget cuts.' },
      { type: 'paragraph', text: 'That era of ambiguity is officially coming to an end. In 2026, the collision of edge-deployed computer vision and advanced machine learning models is transforming OOH from a static broadcast channel into a highly measurable, interactive digital intelligence asset.' },
      { type: 'heading', text: 'From Opportunities-to-See (OTS) to Actual Attention' },
      { type: 'paragraph', text: 'Traditionally, OOH metrics were built on OTS—meaning how many people had a theoretical opportunity to pass by a billboard. Today, Aculion’s AI-powered camera nodes measure actual attention. By deploying lightweight computer vision algorithms on-site, our intelligence platform measures the exact number of people who look at the screen (Gaze Duration) and how long they remain in the viewing cone (Dwell Time).' },
      { type: 'blockquote', text: '“Measuring attention brings the performance-driven accountability of online marketing into the physical world. It is the key to unlocking the true value of premium OOH locations.”' },
      { type: 'heading', text: 'The Role of Edge AI in Attention Measurement' },
      { type: 'paragraph', text: 'To achieve this level of precision without compromising public privacy, modern systems rely on edge AI. The video feed is analyzed locally on the hardware node itself. The software extracts mathematical vectors representing pedestrian gaze orientation and vehicle dwell times, and then immediately deletes the source frames. No video or personal data ever leaves the device—ensuring 100% compliance with privacy regulations like GDPR and CCPA.' },
      { type: 'heading', text: 'What This Means for Advertisers and Media Owners' },
      { type: 'paragraph', text: 'For media owners, attention data makes it possible to justify premium pricing for high-performing displays. For advertisers, it provides the granularity required to run dynamic, context-aware campaigns. A billboard can now adapt its messaging based on real-time traffic speeds, vehicle classification, and attention levels—delivering unprecedented contextual relevance and skyrocketing ROI.' }
    ]
  },
  {
    id: 'privacy-first-analytics',
    title: 'Privacy-First Analytics in Physical Spaces: The New Edge Computing Standard',
    excerpt: 'Can physical spaces be analyzed without compromising citizen privacy? Explore Aculion’s on-device processing where faces are blurred instantly at the hardware level, satisfying GDPR and CCPA.',
    category: 'Privacy & Ethics',
    author: {
      name: 'Marcus Vance',
      role: 'VP of Product',
      initials: 'MV'
    },
    publishDate: 'June 28, 2026',
    readTime: '8 min read',
    likes: 98,
    image: '/blog_privacy_edge.png',
    trending: true,
    content: [
      { type: 'paragraph', text: 'As AI sensors and smart cameras become integrated into public spaces, a critical question emerges: how can we gather actionable traffic and audience intelligence while safeguarding the privacy of individual citizens?' },
      { type: 'paragraph', text: 'At Aculion, we believe that data collection and individual privacy are not mutually exclusive. The solution lies in a structural shift away from cloud-centric data pipelines toward decentralized, privacy-by-design edge computing architectures.' },
      { type: 'heading', text: 'What is Privacy-by-Design?' },
      { type: 'paragraph', text: 'Privacy-by-design means security is built into the architecture from day one, not bolted on as a policy afterthought. In our edge nodes, raw video streams are processed in the volatile memory (RAM) of the local hardware. Faces and license plates are blurred immediately at the frame-acquisition stage using neural face-detection layers running directly on the sensor chipset.' },
      { type: 'blockquote', text: '“Data that does not exist in a database cannot be leaked, stolen, or compromised. The safest way to store raw video is to never store it at all.”' },
      { type: 'heading', text: 'Anonymized Vectorization vs. Tracking' },
      { type: 'paragraph', text: 'Instead of identifying individuals, Aculion’s algorithms vectorize movement. The system registers a pedestrian as a point coordinate moving at a specific velocity, or a vehicle as a generalized bounding box classified under standard categories (e.g., sedan, SUV, commercial truck). This metadata is compiled into aggregates (e.g., “142 vehicles crossed this intersection between 2:00 PM and 2:15 PM”) and sent to the console via secure encrypted payloads. The raw frames are wiped milliseconds after processing.' },
      { type: 'heading', text: 'Navigating Global Compliance Standards' },
      { type: 'paragraph', text: 'In today’s regulatory climate, failing to protect biometric data carries massive legal risks. By enforcing edge-level classification, our clients remain perfectly insulated from GDPR, CCPA, and regional facial recognition bans. This guarantees that media networks can scale confidently across international borders, operating as a trusted, ethical digital citizen in any smart municipality.' }
    ]
  },
  {
    id: 'maximizing-billboard-roi',
    title: 'Maximizing Billboard ROI: Data-Driven Optimization for Modern Media Owners',
    excerpt: 'Outdoor billboard inventory is highly valuable, but selling it requires absolute proof of performance. Learn how real-time vehicle classification and dwell time analytics attract tier-1 brands.',
    category: 'OOH Advertising',
    author: {
      name: 'Sarah Jenkins',
      role: 'Director of OOH Strategy',
      initials: 'SJ'
    },
    publishDate: 'June 15, 2026',
    readTime: '5 min read',
    likes: 87,
    image: '/blog_billboard_roi.png',
    trending: false,
    content: [
      { type: 'paragraph', text: 'For billboard operators and media owners, the traditional sales pitch was simple: show a demographic map of a zip code, list the historical highway traffic volume, and name a price. But as programmatic digital advertising continues to swallow budgets, brands are demanding deeper performance indicators. They want proof of who saw their campaign, when they saw it, and what demographics were reached.' },
      { type: 'paragraph', text: 'To protect inventory pricing and win premium ad dollars, media owners must modernize. Here is how data-driven analytics are maximizing Out-of-Home ROI.' },
      { type: 'heading', text: 'Unlocking Vehicle Classification Data' },
      { type: 'paragraph', text: 'Raw impressions tell only part of the story. Knowing the mix of vehicles passing a billboard can dramatically alter its value. For example, a billboard on an urban highway with a high concentration of premium luxury vehicles represents an ideal target for luxury retail, high-end real estate, and finance brands. Aculion’s real-time vehicle classification allows media owners to catalog these premium vehicle ratios, enabling them to command up to 40% higher CPMs for specific inventory spots.' },
      { type: 'blockquote', text: '“Don’t just sell a billboard location. Sell a verified audience profile that aligns perfectly with a brand’s target customer.”' },
      { type: 'heading', text: 'Dwell Time: The Ultimate Value Metric' },
      { type: 'paragraph', text: 'In OOH, slow traffic is a premium feature. Billboards positioned at congested intersections or highway bottlenecks experience significantly higher dwell times. If a vehicle remains in front of a billboard for an average of 45 seconds rather than 4 seconds, the likelihood of ad retention increases exponentially. By capturing and documenting verified dwell times, operators can sell slower traffic locations as high-impact engagement zones.' },
      { type: 'heading', text: 'Real-Time Dynamic Scheduling' },
      { type: 'paragraph', text: 'With Aculion’s live data integrations, media owners can enable dynamic ad scheduling. Instead of displaying a single loop, billboards can trigger specific ads based on traffic speed, weather conditions, or local events. This dynamic capability increases occupancy rates and allows operators to sell their boards multiple times over across distinct dayparts, maximizing asset profitability.' }
    ]
  },
  {
    id: 'smart-cities-and-interactive-ooh',
    title: 'Smart Cities and Interactive OOH: Creating Context-Aware Citizen Experiences',
    excerpt: 'How street furniture, transit shelters, and digital billboards integrate into the IoT grid to deliver weather-triggered advertisements and public utility messaging in real time.',
    category: 'Smart Cities',
    author: {
      name: 'Liam Chen',
      role: 'Urban Technology Lead',
      initials: 'LC'
    },
    publishDate: 'May 30, 2026',
    readTime: '7 min read',
    likes: 112,
    image: '/blog_smart_city.png',
    trending: false,
    content: [
      { type: 'paragraph', text: 'The modern city is fast becoming an interconnected grid of internet-of-things (IoT) devices, sensors, and autonomous systems. In this new landscape, digital billboards and interactive street furniture are evolving beyond simple marketing screens. They are becoming critical components of the urban communications infrastructure.' },
      { type: 'paragraph', text: 'By integrating interactive displays with live environmental sensors, smart cities are building context-aware communication portals that improve citizen utility while funding public services through premium local advertising.' },
      { type: 'heading', text: 'Transit Shelters as Information Hubs' },
      { type: 'paragraph', text: 'Consider the humble bus shelter. By upgrading these sites with interactive digital displays coupled with edge computing modules, cities can display real-time transit schedules, local news, and safety notifications. Simultaneously, these screens serve highly relevant advertisements. During a sudden downpour, the screen can automatically display ads for nearby coffee shops offering hot drinks or ride-sharing discounts—delivering immediate utility to waiting commuters.' },
      { type: 'blockquote', text: '“The future of advertising is contextual. When an ad provides immediate value based on your physical surroundings, it ceases to be an annoyance and becomes a utility.”' },
      { type: 'heading', text: 'Sensor Integration and Public Safety' },
      { type: 'paragraph', text: 'Smart billboards can house more than cameras. They can support air quality sensors, temperature monitors, and acoustic microphones that detect emergency events. In the event of an Amber Alert or weather emergency, the entire billboard network can instantly override commercial advertising to display safety maps and emergency warnings, showing the power of OOH as a public communications safety net.' },
      { type: 'heading', text: 'Closing the Loop on Citizen Interaction' },
      { type: 'paragraph', text: 'As pedestrian traffic becomes more interactive, touchless technologies and QR code check-ins are bridging physical ads with mobile devices. A commuter can scan a localized coupon from a bus shelter ad, redeem it at a shop down the street, and give the brand complete closed-loop measurement. By acting as the physical anchor for digital interactions, interactive OOH is proving that offline and online experiences are merging.' }
    ]
  }
];

// ── Default Discussion Comments Seed Data ──
const SEED_COMMENTS = {
  'attention-metrics-2026': [
    {
      id: 'comment-1',
      parentId: null,
      author: { name: 'Devon Lane', email: 'devon@agency.com', role: 'Marketing Agency Lead' },
      content: 'This is a massive shift for media agencies. We\'ve been looking for exact attention dwell times rather than just daily traffic estimates for years. It makes physical ads feel as measurable as programmatic web banners.',
      timestamp: '2026-07-06T14:32:00.000Z',
      likes: 8,
      likedBy: []
    },
    {
      id: 'comment-1-1',
      parentId: 'comment-1',
      author: { name: 'Kristin Watson', email: 'kristin@brand.com', role: 'Brand Advertiser' },
      content: 'Completely agree, Devon. The gap between online attribution and physical billboards is finally closing. We\'re already planning to allocate more budget to locations backed by Aculion metrics.',
      timestamp: '2026-07-07T09:15:00.000Z',
      likes: 4,
      likedBy: []
    },
    {
      id: 'comment-2',
      parentId: null,
      author: { name: 'Bessie Cooper', email: 'bessie@luxury.com', role: 'Director of Luxury Media' },
      content: 'Is this model capable of distinguishing between vehicle types? Knowing the percentage of premium vehicle mix is critical for luxury brand campaigns.',
      timestamp: '2026-07-05T11:20:00.000Z',
      likes: 12,
      likedBy: []
    },
    {
      id: 'comment-2-1',
      parentId: 'comment-2',
      author: { name: 'Dr. Elena Rostova', email: 'elena.rostova@aculion.com', role: 'Chief AI Scientist' },
      content: 'Yes, it does, Bessie. In our latest tests, the system tracks vehicle classification (SUVs, trucks, sedans, luxury cars) with over 92% accuracy, allowing you to isolate and target luxury demographics specifically.',
      timestamp: '2026-07-05T16:45:00.000Z',
      likes: 19,
      likedBy: []
    }
  ],
  'privacy-first-analytics': [
    {
      id: 'comment-3',
      parentId: null,
      author: { name: 'Cody Fisher', email: 'cody.f@municipality.gov', role: 'Smart City Partner' },
      content: 'As a public official, citizen privacy is our absolute priority. This edge-blurring technology is exactly what we need to get city council approval for smart city advertising initiatives.',
      timestamp: '2026-06-29T10:10:00.000Z',
      likes: 15,
      likedBy: []
    },
    {
      id: 'comment-3-1',
      parentId: 'comment-3',
      author: { name: 'Marcus Vance', email: 'marcus.vance@aculion.com', role: 'VP of Product' },
      content: 'Thanks, Cody. That\'s precisely why we built it this way. We wanted to take biometric tracking arguments completely off the table. The local processor physically cannot output unblurred faces.',
      timestamp: '2026-06-29T15:20:00.000Z',
      likes: 11,
      likedBy: []
    }
  ],
  'maximizing-billboard-roi': [
    {
      id: 'comment-4',
      parentId: null,
      author: { name: 'Robert Fox', email: 'robert@foxoutdoor.com', role: 'Media Owner' },
      content: 'We installed Aculion nodes on three of our slow-traffic arterial displays last month. The dwell time reports let us sell our digital loop to a major premium automotive brand in a week. Outstanding tech!',
      timestamp: '2026-06-18T08:40:00.000Z',
      likes: 9,
      likedBy: []
    }
  ],
  'smart-cities-and-interactive-ooh': []
};

export default function InsightsPage({ user, isLoggedIn, setShowSignin, setShowRegister }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBlog, setActiveBlog] = useState(null);

  // Likes and comments lists synced with localStorage
  const [blogsLikes, setBlogsLikes] = useState({});
  const [commentsState, setCommentsState] = useState({});

  // Dynamic user tracking
  const [userLikesState, setUserLikesState] = useState({
    blogs: [],
    comments: []
  });

  // State to manage edit/delete menus for comments
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // State to manage inline reply editors
  const [replyParentId, setReplyParentId] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Primary comment box state
  const [mainCommentText, setMainCommentText] = useState('');

  // Initialize and load counts and comments from localStorage
  useEffect(() => {
    // 1. Load blog likes
    const localLikes = localStorage.getItem('aculion_blog_likes');
    if (localLikes) {
      setBlogsLikes(JSON.parse(localLikes));
    } else {
      const initialLikes = {};
      DEFAULT_BLOGS.forEach(b => {
        initialLikes[b.id] = b.likes;
      });
      localStorage.setItem('aculion_blog_likes', JSON.stringify(initialLikes));
      setBlogsLikes(initialLikes);
    }

    // 2. Load comments
    const localComments = localStorage.getItem('aculion_blog_comments');
    if (localComments) {
      setCommentsState(JSON.parse(localComments));
    } else {
      localStorage.setItem('aculion_blog_comments', JSON.stringify(SEED_COMMENTS));
      setCommentsState(SEED_COMMENTS);
    }

    // 3. Load active user like/interaction status
    if (user?.email) {
      const userKey = `aculion_user_likes_${user.email}`;
      const localUserLikes = localStorage.getItem(userKey);
      if (localUserLikes) {
        setUserLikesState(JSON.parse(localUserLikes));
      } else {
        const initialUserLikes = { blogs: [], comments: [] };
        localStorage.setItem(userKey, JSON.stringify(initialUserLikes));
        setUserLikesState(initialUserLikes);
      }
    } else {
      setUserLikesState({ blogs: [], comments: [] });
    }
  }, [user]);

  // Sync user like patterns to localStorage on change
  const saveUserLikes = (updatedState) => {
    setUserLikesState(updatedState);
    if (user?.email) {
      const userKey = `aculion_user_likes_${user.email}`;
      localStorage.setItem(userKey, JSON.stringify(updatedState));
    }
  };

  // Close menus on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuId(null);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Format category list
  const categories = ['All', 'AI & Tech', 'OOH Advertising', 'Privacy & Ethics', 'Smart Cities'];

  // Handle URL hash mapping
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#insights/')) {
        const blogId = hash.replace('#insights/', '');
        const matched = DEFAULT_BLOGS.find(b => b.id === blogId);
        if (matched) {
          setActiveBlog(matched);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setActiveBlog(null);
        }
      } else if (hash === '#insights') {
        setActiveBlog(null);
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Open blog article
  const openArticle = (blog) => {
    window.location.hash = `#insights/${blog.id}`;
  };

  // Close blog article
  const closeArticle = () => {
    window.location.hash = '#insights';
  };

  // Toggle Blog Like
  const handleLikeBlog = (blogId) => {
    if (!isLoggedIn) {
      setShowSignin(true);
      return;
    }

    const hasLiked = userLikesState.blogs.includes(blogId);
    let updatedBlogs;

    if (hasLiked) {
      // Unlike
      updatedBlogs = { ...blogsLikes, [blogId]: Math.max(0, (blogsLikes[blogId] || 0) - 1) };
      const updatedUser = {
        ...userLikesState,
        blogs: userLikesState.blogs.filter(id => id !== blogId)
      };
      saveUserLikes(updatedUser);
    } else {
      // Like
      updatedBlogs = { ...blogsLikes, [blogId]: (blogsLikes[blogId] || 0) + 1 };
      const updatedUser = {
        ...userLikesState,
        blogs: [...userLikesState.blogs, blogId]
      };
      saveUserLikes(updatedUser);
    }

    setBlogsLikes(updatedBlogs);
    localStorage.setItem('aculion_blog_likes', JSON.stringify(updatedBlogs));
  };

  // Parse display role nicely
  const formatUserRole = (role) => {
    if (!role) return 'Community Member';
    if (role.includes('Media Owner')) return 'Media Owner';
    if (role.includes('Advertiser')) return 'Brand Advertiser';
    if (role.includes('Agency')) return 'Agency Partner';
    if (role.includes('City') || role.includes('Municipality')) return 'Smart City Partner';
    if (role === 'Administrator') return 'Admin';
    return role;
  };

  // Get active commenters count
  const getCommentCount = (blogId) => {
    const list = commentsState[blogId] || [];
    return list.filter(c => c.content !== '[Comment deleted]' || list.some(r => r.parentId === c.id)).length;
  };

  // ── Comment System Functionalities ──

  // Add Comment/Reply
  const handleAddComment = (text, parentId = null) => {
    if (!isLoggedIn || !user) {
      setShowSignin(true);
      return;
    }
    if (!text.trim()) return;

    const blogId = activeBlog.id;
    const currentBlogComments = commentsState[blogId] ? [...commentsState[blogId]] : [];

    const newComment = {
      id: `comment-${Date.now()}`,
      parentId: parentId,
      author: {
        name: user.name ? user.name.charAt(0).toUpperCase() + user.name.slice(1) : 'User',
        email: user.email,
        role: formatUserRole(user.role)
      },
      content: text,
      timestamp: new Date().toISOString(),
      likes: 0,
      likedBy: []
    };

    const updatedComments = {
      ...commentsState,
      [blogId]: [...currentBlogComments, newComment]
    };

    setCommentsState(updatedComments);
    localStorage.setItem('aculion_blog_comments', JSON.stringify(updatedComments));

    if (parentId) {
      setReplyParentId(null);
      setReplyText('');
    } else {
      setMainCommentText('');
    }
  };

  // Toggle Comment Like
  const handleLikeComment = (commentId) => {
    if (!isLoggedIn) {
      setShowSignin(true);
      return;
    }

    const blogId = activeBlog.id;
    const currentBlogComments = commentsState[blogId] ? [...commentsState[blogId]] : [];
    const hasLiked = userLikesState.comments.includes(commentId);

    const updatedBlogComments = currentBlogComments.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          likes: hasLiked ? Math.max(0, c.likes - 1) : c.likes + 1
        };
      }
      return c;
    });

    const updatedComments = {
      ...commentsState,
      [blogId]: updatedBlogComments
    };

    setCommentsState(updatedComments);
    localStorage.setItem('aculion_blog_comments', JSON.stringify(updatedComments));

    const updatedUser = {
      ...userLikesState,
      comments: hasLiked
        ? userLikesState.comments.filter(id => id !== commentId)
        : [...userLikesState.comments, commentId]
    };
    saveUserLikes(updatedUser);
  };

  // Edit Comment
  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.content);
    setActiveMenuId(null);
  };

  const handleSaveEdit = (commentId) => {
    if (!editingText.trim()) return;
    const blogId = activeBlog.id;
    const currentBlogComments = commentsState[blogId] ? [...commentsState[blogId]] : [];

    const updatedBlogComments = currentBlogComments.map(c => {
      if (c.id === commentId) {
        return { ...c, content: editingText, timestamp: new Date().toISOString() };
      }
      return c;
    });

    const updatedComments = {
      ...commentsState,
      [blogId]: updatedBlogComments
    };

    setCommentsState(updatedComments);
    localStorage.setItem('aculion_blog_comments', JSON.stringify(updatedComments));
    setEditingCommentId(null);
    setEditingText('');
  };

  // Delete Comment
  const handleDeleteComment = (commentId) => {
    const blogId = activeBlog.id;
    const currentBlogComments = commentsState[blogId] ? [...commentsState[blogId]] : [];

    // Check if this comment has replies
    const hasReplies = currentBlogComments.some(c => c.parentId === commentId);
    let updatedBlogComments;

    if (hasReplies) {
      // Mark as deleted to keep child structure intact
      updatedBlogComments = currentBlogComments.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            author: { name: 'Deleted Commenter', email: '', role: 'N/A' },
            content: '[Comment deleted]',
            likes: 0
          };
        }
        return c;
      });
    } else {
      // Completely remove it
      updatedBlogComments = currentBlogComments.filter(c => c.id !== commentId);
    }

    const updatedComments = {
      ...commentsState,
      [blogId]: updatedBlogComments
    };

    setCommentsState(updatedComments);
    localStorage.setItem('aculion_blog_comments', JSON.stringify(updatedComments));
    setActiveMenuId(null);
  };

  // Format Comment Time
  const formatTimeAgo = (isoString) => {
    const date = new Date(isoString);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filtering and Searching
  const filteredBlogs = DEFAULT_BLOGS.filter(blog => {
    const matchesCategory = selectedCategory === 'All' || blog.category === selectedCategory;
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const trendingBlogs = DEFAULT_BLOGS.filter(b => b.trending);
  const latestBlogs = DEFAULT_BLOGS.slice().sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate)).slice(0, 3);

  // Comment Thread Node component
  const CommentNode = ({ comment, depth = 0 }) => {
    const blogId = activeBlog.id;
    const allComments = commentsState[blogId] || [];
    const childReplies = allComments.filter(c => c.parentId === comment.id);
    const isAuthor = user?.email && comment.author.email === user.email;
    const isDeleted = comment.content === '[Comment deleted]';
    const hasLiked = userLikesState.comments.includes(comment.id);

    return (
      <div className="comment-thread-container">
        {/* Comment Card */}
        <div className="comment-card">
          <div className="comment-card-header">
            <div className="commenter-profile">
              <div className="commenter-avatar">
                {comment.author.initials || comment.author.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="commenter-info">
                <div className="commenter-name-row">
                  <span className="commenter-name">{comment.author.name}</span>
                  {!isDeleted && comment.author.role && (
                    <span className="commenter-role-tag">{comment.author.role}</span>
                  )}
                </div>
                <span className="comment-date">{formatTimeAgo(comment.timestamp)}</span>
              </div>
            </div>

            {/* Edit/Delete Options dropdown for Author */}
            {isAuthor && !isDeleted && (
              <div className="comment-actions-dropdown">
                <button
                  className="comment-menu-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === comment.id ? null : comment.id);
                  }}
                  aria-label="Comment options"
                >
                  <i className="fa-solid fa-ellipsis-vertical"></i>
                </button>
                {activeMenuId === comment.id && (
                  <div className="comment-options-menu" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="comment-option-item"
                      onClick={() => handleStartEdit(comment)}
                    >
                      <i className="fa-solid fa-pen"></i> Edit
                    </button>
                    <button
                      className="comment-option-item danger"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <i className="fa-solid fa-trash-can"></i> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comment Body */}
          {editingCommentId === comment.id ? (
            <div className="comment-edit-container">
              <textarea
                className="comment-edit-textarea"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
              />
              <div className="comment-edit-actions">
                <button
                  className="comment-edit-btn cancel"
                  onClick={() => setEditingCommentId(null)}
                >
                  Cancel
                </button>
                <button
                  className="comment-edit-btn save"
                  onClick={() => handleSaveEdit(comment.id)}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className={`comment-content ${isDeleted ? 'deleted' : ''}`}>
              {comment.content}
            </p>
          )}

          {/* Footer Metrics & Actions */}
          {!isDeleted && (
            <div className="comment-card-footer">
              <button
                className={`comment-like-btn ${hasLiked ? 'liked' : ''}`}
                onClick={() => handleLikeComment(comment.id)}
              >
                <i className={`${hasLiked ? 'fa-solid' : 'fa-regular'} fa-thumbs-up`}></i>
                <span>{comment.likes || 0}</span>
              </button>
              <button
                className="comment-reply-btn"
                onClick={() => {
                  setReplyParentId(replyParentId === comment.id ? null : comment.id);
                  setReplyText('');
                }}
              >
                <i className="fa-solid fa-reply"></i>
                <span>Reply</span>
              </button>
            </div>
          )}

          {/* Inline Reply input block */}
          {replyParentId === comment.id && (
            <div className="reply-input-wrapper" onClick={(e) => e.stopPropagation()}>
              <textarea
                className="reply-textarea"
                placeholder={`Reply to ${comment.author.name}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="reply-input-actions">
                <button
                  className="reply-btn cancel"
                  onClick={() => setReplyParentId(null)}
                >
                  Cancel
                </button>
                <button
                  className="reply-btn submit"
                  onClick={() => handleAddComment(replyText, comment.id)}
                  disabled={!replyText.trim()}
                >
                  Post Reply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Child comments wrapper (indented recursively) */}
        {childReplies.length > 0 && (
          <div className="comment-replies-wrapper">
            {childReplies.map(reply => (
              <CommentNode key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="insights-page-container">
      {/* Background Orbs */}
      <div className="insights-hero-glow"></div>

      <div className="insights-content-wrapper">
        {!activeBlog ? (
          /* Catalog Listing View */
          <>
            {/* Hero Header */}
            <div className="insights-hero">
              <span className="insights-hero-tag">Aculion Intelligence Hub</span>
              <h1 className="insights-hero-title">Insights & Perspectives</h1>
              <p className="insights-hero-desc">
                Deep dives into edge computer vision, data attribution models, physical privacy parameters, and the future of outdoor media.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="insights-controls">
              <div className="insights-search-wrapper">
                <i className="fa-solid fa-magnifying-glass insights-search-icon"></i>
                <input
                  type="text"
                  className="insights-search-input"
                  placeholder="Search articles by title or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="insights-categories">
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Split: Main Grid + Sidebar */}
            <div className="insights-layout">
              {/* Blog Grid */}
              <div className="articles-grid">
                {filteredBlogs.length > 0 ? (
                  filteredBlogs.map(blog => {
                    const commentsCount = getCommentCount(blog.id);
                    const likesCount = blogsLikes[blog.id] || blog.likes;
                    return (
                      <article key={blog.id} className="blog-card">
                        <div className="blog-card-image-wrapper">
                          <img
                            src={blog.image}
                            alt={blog.title}
                            className="blog-card-image"
                          />
                          <span className="blog-card-badge">{blog.category}</span>
                        </div>
                        <div className="blog-card-content">
                          <div className="blog-meta">
                            <span>{blog.publishDate}</span>
                            <span className="blog-meta-dot"></span>
                            <span>{blog.readTime}</span>
                          </div>
                          <h2 className="blog-card-title">{blog.title}</h2>
                          <p className="blog-card-excerpt">{blog.excerpt}</p>
                          <div className="blog-card-footer">
                            <div className="blog-author-info">
                              <div className="blog-author-avatar">
                                {blog.author.initials}
                              </div>
                              <span className="blog-author-name">{blog.author.name}</span>
                            </div>
                            <div className="blog-stats">
                              <span className="blog-stat-item">
                                <i className="fa-regular fa-heart"></i>
                                {likesCount}
                              </span>
                              <span className="blog-stat-item">
                                <i className="fa-regular fa-comment"></i>
                                {commentsCount}
                              </span>
                            </div>
                          </div>
                          <button
                            className="blog-read-btn"
                            style={{ marginTop: '20px', alignSelf: 'flex-start' }}
                            onClick={() => openArticle(blog)}
                          >
                            Read More <i className="fa-solid fa-arrow-right"></i>
                          </button>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="no-results">
                    <i className="fa-regular fa-folder-open no-results-icon"></i>
                    <h3>No Articles Found</h3>
                    <p>We couldn't find any articles matching your search criteria. Try using different keywords or resetting filters.</p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <aside className="insights-sidebar">
                {/* Trending Articles */}
                <div className="sidebar-widget">
                  <h3 className="widget-title">
                    <i className="fa-solid fa-fire-flame-curved"></i> Trending Articles
                  </h3>
                  <div className="trending-list">
                    {trendingBlogs.map((blog, idx) => (
                      <div
                        key={blog.id}
                        className="trending-item"
                        onClick={() => openArticle(blog)}
                      >
                        <span className="trending-rank">0{idx + 1}</span>
                        <div className="trending-details">
                          <h4 className="trending-title">{blog.title}</h4>
                          <div className="trending-meta">
                            <span>{blog.category}</span>
                            <span>•</span>
                            <span>{blog.readTime}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Latest Articles */}
                <div className="sidebar-widget">
                  <h3 className="widget-title">
                    <i className="fa-regular fa-clock"></i> Latest Posts
                  </h3>
                  <div className="latest-list">
                    {latestBlogs.map(blog => (
                      <div
                        key={blog.id}
                        className="latest-item"
                        onClick={() => openArticle(blog)}
                      >
                        <div className="latest-details">
                          <h4 className="latest-title">{blog.title}</h4>
                          <div className="latest-meta">
                            <span>{blog.publishDate}</span>
                            <span>•</span>
                            <span>{blog.readTime}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </>
        ) : (
          /* Single Blog Reader View */
          <div className="article-view-container">
            {/* Header Actions */}
            <div className="article-header">
              <button className="article-back-btn" onClick={closeArticle}>
                <i className="fa-solid fa-arrow-left"></i> Back to Insights
              </button>
              <div>
                <span className="article-badge">{activeBlog.category}</span>
                <h1 className="article-title">{activeBlog.title}</h1>
                <div className="article-meta-bar">
                  <div className="article-author-card">
                    <div className="blog-author-avatar" style={{ width: '40px', height: '40px', fontSize: '15px' }}>
                      {activeBlog.author.initials}
                    </div>
                    <div className="article-author-details">
                      <span className="article-author-name">{activeBlog.author.name}</span>
                      <span className="article-author-role">{activeBlog.author.role}</span>
                    </div>
                  </div>
                  <div className="article-reading-info">
                    <span>{activeBlog.publishDate}</span>
                    <span>•</span>
                    <span>{activeBlog.readTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <img
              src={activeBlog.image}
              alt={activeBlog.title}
              className="article-hero-image"
            />

            {/* Article Content */}
            <div className="article-body">
              {activeBlog.content.map((block, idx) => {
                if (block.type === 'paragraph') {
                  return <p key={idx}>{block.text}</p>;
                } else if (block.type === 'heading') {
                  return <h2 key={idx}>{block.text}</h2>;
                } else if (block.type === 'blockquote') {
                  return <blockquote key={idx}>{block.text}</blockquote>;
                }
                return null;
              })}
            </div>

            {/* Social Panel */}
            <div className="article-social-bar">
              <div className="social-action-group">
                <button
                  className={`social-btn ${userLikesState.blogs.includes(activeBlog.id) ? 'liked' : ''}`}
                  onClick={() => handleLikeBlog(activeBlog.id)}
                >
                  <i className={`${userLikesState.blogs.includes(activeBlog.id) ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
                  <span>Like Article ({blogsLikes[activeBlog.id] ?? activeBlog.likes})</span>
                </button>
              </div>
              <div className="social-action-group">
                <button
                  className="social-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Article link copied to clipboard!');
                  }}
                >
                  <i className="fa-solid fa-share-nodes"></i> Share
                </button>
              </div>
            </div>

            {/* Threaded Discussion Section */}
            <section className="discussion-section">
              <div className="discussion-header">
                <h3 className="discussion-title">Community Discussion</h3>
                <span className="comment-count-badge">
                  {getCommentCount(activeBlog.id)} comments
                </span>
              </div>

              {/* Add Comment Input Card */}
              {isLoggedIn ? (
                <div className="comment-input-card">
                  <div className="comment-textarea-wrapper">
                    <textarea
                      className="comment-textarea"
                      placeholder="Share your thoughts with the Aculion community..."
                      value={mainCommentText}
                      onChange={(e) => setMainCommentText(e.target.value)}
                    />
                  </div>
                  <div className="comment-input-footer">
                    <span className="comment-tip">
                      <i className="fa-regular fa-lightbulb"></i>
                      Please maintain a constructive and respectful dialogue.
                    </span>
                    <button
                      className="post-comment-btn"
                      onClick={() => handleAddComment(mainCommentText)}
                      disabled={!mainCommentText.trim()}
                    >
                      Post Comment <i className="fa-solid fa-paper-plane"></i>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="auth-prompt-card">
                  <span className="auth-prompt-title">Join the Conversation</span>
                  <p className="auth-prompt-desc">
                    Sign in to share your thoughts, ask questions, reply to other industry peers, and interact with the Aculion developer community.
                  </p>
                  <button className="auth-prompt-btn" onClick={() => setShowSignin(true)}>
                    Sign In to Comment
                  </button>
                </div>
              )}

              {/* Threaded Comment list tree */}
              <div className="comments-list">
                {(commentsState[activeBlog.id] || []).filter(c => c.parentId === null).length > 0 ? (
                  (commentsState[activeBlog.id] || [])
                    .filter(c => c.parentId === null)
                    .map(comment => (
                      <CommentNode key={comment.id} comment={comment} />
                    ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                    <i className="fa-regular fa-comments" style={{ fontSize: '32px', display: 'block', marginBottom: '10px', opacity: 0.3 }}></i>
                    No thoughts shared yet. Be the first to start the discussion!
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
