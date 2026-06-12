import { useState, useEffect } from 'react';
import { useAuth }             from '../context/AuthContext';
import { getBlogs }            from '../api/services';
import './Blog.css';

const Blog = () => {
  const { user }       = useAuth();
  const [blogs,        setBlogs]       = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [search,       setSearch]      = useState('');
  const [category,     setCategory]    = useState('');
  const [selectedBlog, setSelectedBlog]= useState(null);

  const staticBlogs = [
    {
      _id: '1',
      title: 'Why Blood Donation Saves Lives',
      category: 'Awareness',
      author: 'Dr. Ahmed Khan',
      createdAt: '2025-05-10',
      image: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=400',
      excerpt: 'Blood donation is one of the most powerful acts of kindness. Every unit of donated blood can save up to three lives...',
      content: 'Blood donation is one of the most powerful acts of kindness a person can perform. Every unit of donated blood can save up to three lives. In Pakistan alone, over 1.5 million units of blood are needed annually, but only a fraction of that is available. By becoming a regular blood donor, you can make a measurable difference in your community. The process is safe, takes only 30-45 minutes, and your body replenishes the donated blood within weeks. Join BloodBridge today and start saving lives!'
    },
    {
      _id: '2',
      title: 'Who Can Donate Blood?',
      category: 'Health Tips',
      author: 'Dr. Sara Malik',
      createdAt: '2025-04-22',
      image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400',
      excerpt: 'Before donating blood, it is important to understand the eligibility criteria...',
      content: 'To donate blood safely, you must meet certain criteria. You must be between 18-65 years old and weigh at least 50 kg. Your hemoglobin level must be above 12.5 g/dL. You should not have donated blood in the past 56 days. You must be free from infections, recent surgeries, or certain medications. If you meet these criteria, you are likely eligible to donate blood and save lives!'
    },
    {
      _id: '3',
      title: 'Blood Types Explained',
      category: 'Education',
      author: 'Dr. Usman Ali',
      createdAt: '2025-04-15',
      image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400',
      excerpt: 'Understanding blood types is crucial for safe transfusions...',
      content: 'There are 8 main blood types: A+, A-, B+, B-, AB+, AB-, O+, and O-. Your blood type is determined by antigens on the surface of your red blood cells. O- is the universal donor, meaning anyone can receive O- blood. AB+ is the universal recipient, meaning AB+ individuals can receive any blood type. Knowing your blood type is essential for safe transfusions and can save your life in an emergency.'
    },
  ];

  useEffect(() => {
    fetchBlogs();
  }, [category, search]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
      if (search)   params.search   = search;
      const res = await getBlogs(params);
      if (res.data.length > 0) {
        setBlogs(res.data);
      } else {
        setBlogs(staticBlogs);
      }
      setLoading(false);
    } catch (err) {
      setBlogs(staticBlogs);
      setLoading(false);
    }
  };

  const categories = ['All', 'Awareness', 'Health Tips', 'Education', 'Nutrition'];

  const filtered = blogs.filter(b => {
    const matchSearch = !search ||
      b.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = !category || category === 'All' || b.category === category;
    return matchSearch && matchCat;
  });

  if (selectedBlog) {
    return (
      <div className="blog-page">
        <header className="blog-navbar">
          <div className="blog-nav-inner">
            <a href="/" className="blog-brand">🩸 BloodBridge</a>
            <button
              className="blog-back-btn"
              onClick={() => setSelectedBlog(null)}
            >
              ← Back to Blog
            </button>
          </div>
        </header>
        <div className="blog-single-container">
          <img
            src={selectedBlog.image || 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=800'}
            alt={selectedBlog.title}
            className="blog-single-img"
          />
          <div className="blog-single-body">
            <span className="blog-cat-badge">{selectedBlog.category}</span>
            <h1 className="blog-single-title">{selectedBlog.title}</h1>
            <div className="blog-single-meta">
              <span>✍️ {selectedBlog.author || selectedBlog.postedBy?.name}</span>
              <span>📅 {new Date(selectedBlog.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="blog-single-content">
              {selectedBlog.content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-page">
      <header className="blog-navbar">
        <div className="blog-nav-inner">
          <a href="/" className="blog-brand">🩸 BloodBridge</a>
          <nav className="blog-nav-links">
            <a href="/">Home</a>
            <a href="/requests">Requests</a>
            <a href="/donors">Donors</a>
            <a href="/blog" className="active">Blog</a>
          </nav>
          <div className="blog-nav-auth">
            {user ? (
              <a href={
                user.role === 'donor'    ? '/donor/dashboard'    :
                user.role === 'receiver' ? '/receiver/dashboard' :
                '/admin/dashboard'
              } className="blog-dashboard-btn">Dashboard</a>
            ) : (
              <>
                <a href="/login"    className="blog-signin">Sign In</a>
                <a href="/register" className="blog-register">Register</a>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="blog-container">
        <div className="blog-hero">
          <h1>📖 Blood Donation Blog</h1>
          <p>Latest articles on blood donation, health tips, and awareness</p>
        </div>

        <div className="blog-controls">
          <input
            className="blog-search"
            placeholder="Search articles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="blog-categories">
            {categories.map(cat => (
              <button
                key={cat}
                className={`blog-cat-btn ${(category === cat || (cat === 'All' && !category)) ? 'active' : ''}`}
                onClick={() => setCategory(cat === 'All' ? '' : cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="blog-loading">Loading articles...</div>
        ) : filtered.length === 0 ? (
          <div className="blog-empty">
            <p>😔</p>
            <p>No articles found</p>
          </div>
        ) : (
          <div className="blog-grid">
            {filtered.map(blog => (
              <div key={blog._id} className="blog-card">
                <div className="blog-card-img">
                  <img
                    src={blog.image || 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=400'}
                    alt={blog.title}
                  />
                  <span className="blog-cat-badge">{blog.category}</span>
                </div>
                <div className="blog-card-body">
                  <h3 className="blog-card-title">{blog.title}</h3>
                  <p className="blog-card-excerpt">{blog.excerpt}</p>
                  <div className="blog-card-meta">
                    <span>✍️ {blog.author || blog.postedBy?.name}</span>
                    <span>📅 {new Date(blog.createdAt).toLocaleDateString()}</span>
                  </div>
                  <button
                    className="blog-read-btn"
                    onClick={() => setSelectedBlog(blog)}
                  >
                    Read More →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;