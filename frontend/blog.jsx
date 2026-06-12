import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css'; // We'll include CSS in the same file for single code

const App = () => {
  // Blog Posts Data
  const blogPosts = [
    {
      id: 1,
      category: "GUIDE",
      title: "First Time Donor? 10 Things You MUST Know Before Donating",
      excerpt: "Nervous about your first blood donation? Don't worry! Here's everything from what to eat, what to wear, to what happens during and after your donation.",
      date: "Dec 15, 2024",
      author: "Dr. Sarah Khan",
      icon: "fa fa-hand-holding-heart"
    },
    {
      id: 2,
      category: "MYTHS",
      title: "7 Blood Donation Myths That Are Stopping You From Saving Lives",
      excerpt: "Does donating blood make you weak? Can you donate if you have tattoos? We bust the most common myths holding people back from donating.",
      date: "Dec 12, 2024",
      author: "Health Team",
      icon: "fa fa-times-circle"
    },
    {
      id: 3,
      category: "HEALTH",
      title: "The Science: How Your Body Makes New Blood After Donation",
      excerpt: "Your body replaces the donated blood within 24-48 hours! Learn the amazing science behind blood regeneration and why regular donation is safe.",
      date: "Dec 10, 2024",
      author: "Dr. Ahmed Ali",
      icon: "fa fa-flask"
    },
    {
      id: 4,
      category: "STORIES",
      title: "How One Donation Saved Three Lives: A Mother's Story",
      excerpt: "When Sarah's son needed emergency surgery, she discovered the power of blood donation. Now she donates regularly to pay it forward.",
      date: "Dec 8, 2024",
      author: "Sarah M.",
      icon: "fa fa-heart"
    },
    {
      id: 5,
      category: "NUTRITION",
      title: "Eat This, Not That: Perfect Pre & Post Donation Meal Plan",
      excerpt: "Iron-rich spinach omelets, hydrating coconut water, and foods to avoid. Your complete 24-hour meal guide for successful donation.",
      date: "Dec 5, 2024",
      author: "Nutritionist Rida",
      icon: "fa fa-utensils"
    },
    {
      id: 6,
      category: "GUIDE",
      title: "Blood Types Explained: Find Your Perfect Match",
      excerpt: "O-, AB+, A+, B-... Confused by blood types? Learn compatibility charts, universal donors, and why your type matters.",
      date: "Dec 2, 2024",
      author: "Dr. Fatima R.",
      icon: "fa fa-tint"
    },
    {
      id: 7,
      category: "HEALTH",
      title: "Can You Donate? Complete List of Medications That Affect Eligibility",
      excerpt: "Aspirin, antibiotics, birth control pills... Which medications require deferral and for how long? Check our comprehensive list.",
      date: "Nov 28, 2024",
      author: "Pharmacy Team",
      icon: "fa fa-pills"
    },
    {
      id: 8,
      category: "TIPS",
      title: "5 Ways to Overcome Needle Fear and Donate Confidently",
      excerpt: "Breathing techniques, distraction methods, and mental preparation tips to conquer needle phobia and become a confident donor.",
      date: "Nov 25, 2024",
      author: "Psychologist Ayesha",
      icon: "fa fa-brain"
    },
    {
      id: 9,
      category: "EMERGENCY",
      title: "When Blood is Needed Most: Understanding Trauma & Surgery Needs",
      excerpt: "Car accidents, cancer treatments, childbirth emergencies... Discover when O-negative blood becomes the 'golden lifeline'.",
      date: "Nov 22, 2024",
      author: "Emergency MD",
      icon: "fa fa-ambulance"
    },
    {
      id: 10,
      category: "BENEFITS",
      title: "7 Hidden Health Benefits of Regular Blood Donation",
      excerpt: "Free health screening, reduced heart disease risk, calorie burn equivalent, and more! Why donating is great for YOU too.",
      date: "Nov 20, 2024",
      author: "Health Research",
      icon: "fa fa-award"
    }
  ];

  const [visiblePosts, setVisiblePosts] = useState(6);
  const [allPosts] = useState([...blogPosts]);
  const blogCardsRef = useRef([]);
  const loadMoreRef = useRef(null);

  // Create Blog Card Component
  const BlogCard = React.memo(({ post, onReadMore }) => (
    <article 
      className="blog-card" 
      data-id={post.id}
      ref={el => {
        if (el && blogCardsRef.current[post.id]) {
          blogCardsRef.current[post.id] = el;
        }
      }}
    >
      <div className="blog-image">
        <i className={post.icon}></i>
      </div>
      <div className="blog-content">
        <span className="blog-category">{post.category}</span>
        <h3 className="blog-title">{post.title}</h3>
        <div className="blog-meta">
          <span><i className="fa fa-calendar"></i> {post.date}</span>
          <span><i className="fa fa-user"></i> {post.author}</span>
        </div>
        <p className="blog-excerpt">{post.excerpt}</p>
        <div className="blog-footer">
          <a 
            href={`#blog-${post.id}`} 
            className="read-more"
            onClick={(e) => onReadMore(e, post)}
          >
            Read Story <i className="fa fa-arrow-right"></i>
          </a>
          <span style={{color: 'var(--gray)', fontSize: '0.85rem'}}>
            5 min read
          </span>
        </div>
      </div>
    </article>
  ));

  // Render Posts
  const renderPosts = useCallback(() => {
    const postsToShow = allPosts.slice(0, visiblePosts);
    return postsToShow.map(post => (
      <BlogCard 
        key={post.id} 
        post={post} 
        onReadMore={handleReadMore}
      />
    ));
  }, [visiblePosts, allPosts]);

  // Load More Handler
  const handleLoadMore = useCallback(() => {
    setVisiblePosts(prev => prev + 4);
  }, []);

  // Read More Handler
  const handleReadMore = (e, post) => {
    e.preventDefault();
    alert(`Opening full blog post #${post.id}\n\n"${post.title}"\n\n(Implement modal/full page here)`);
  };

  // Intersection Observer for animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    blogCardsRef.current.forEach((card, index) => {
      if (card) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
      }
    });

    return () => observer.disconnect();
  }, [visiblePosts]);

  const hasMorePosts = visiblePosts < allPosts.length;

  return (
    <div className="App">
      <section className="section blog-section" id="blog-section">
        <div className="container">
          <h2 className="section-title">Blood Donation Blog</h2>
          <p className="section-subtitle">
            Stay informed with expert tips, myths busted, and life-saving stories 
            from our blood donation community
          </p>

          <div id="blog-posts" className="blog-posts">
            {renderPosts()}
          </div>

          <div className="blog-actions">
            <button 
              ref={loadMoreRef}
              id="load-more-posts" 
              className={`btn ${!hasMorePosts ? 'disabled' : ''}`}
              onClick={handleLoadMore}
              disabled={!hasMorePosts}
              style={{ 
                display: hasMorePosts ? 'inline-block' : 'none'
              }}
            >
              Load More Stories
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;