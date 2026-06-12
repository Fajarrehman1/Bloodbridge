// Simulated backend API service
const API_BASE_URL = 'https://jsonplaceholder.typicode.com'; // Using placeholder API

// Simulated blog data (since we don't have real backend)
const LOCAL_BLOG_DATA = [
  {
    id: 1,
    category: "GUIDE",
    title: "First Time Donor? 10 Things You MUST Know Before Donating",
    excerpt: "Nervous about your first blood donation? Don't worry! Here's everything from what to eat, what to wear, to what happens during and after your donation.",
    date: "Dec 15, 2024",
    author: "Dr. Sarah Khan",
    icon: "fa fa-hand-holding-heart",
    readTime: 5,
    likes: 124,
    views: 1520
  },
  {
    id: 2,
    category: "MYTHS",
    title: "7 Blood Donation Myths That Are Stopping You From Saving Lives",
    excerpt: "Does donating blood make you weak? Can you donate if you have tattoos? We bust the most common myths holding people back from donating.",
    date: "Dec 12, 2024",
    author: "Health Team",
    icon: "fa fa-times-circle",
    readTime: 4,
    likes: 89,
    views: 980
  },
  {
    id: 3,
    category: "HEALTH",
    title: "The Science: How Your Body Makes New Blood After Donation",
    excerpt: "Your body replaces the donated blood within 24-48 hours! Learn the amazing science behind blood regeneration and why regular donation is safe.",
    date: "Dec 10, 2024",
    author: "Dr. Ahmed Ali",
    icon: "fa fa-flask",
    readTime: 6,
    likes: 156,
    views: 2100
  },
  {
    id: 4,
    category: "STORIES",
    title: "How One Donation Saved Three Lives: A Mother's Story",
    excerpt: "When Sarah's son needed emergency surgery, she discovered the power of blood donation. Now she donates regularly to pay it forward.",
    date: "Dec 8, 2024",
    author: "Sarah M.",
    icon: "fa fa-heart",
    readTime: 7,
    likes: 245,
    views: 3200
  },
  {
    id: 5,
    category: "NUTRITION",
    title: "Eat This, Not That: Perfect Pre & Post Donation Meal Plan",
    excerpt: "Iron-rich spinach omelets, hydrating coconut water, and foods to avoid. Your complete 24-hour meal guide for successful donation.",
    date: "Dec 5, 2024",
    author: "Nutritionist Rida",
    icon: "fa fa-utensils",
    readTime: 5,
    likes: 178,
    views: 1890
  },
  {
    id: 6,
    category: "GUIDE",
    title: "Blood Types Explained: Find Your Perfect Match",
    excerpt: "O-, AB+, A+, B-... Confused by blood types? Learn compatibility charts, universal donors, and why your type matters.",
    date: "Dec 2, 2024",
    author: "Dr. Fatima R.",
    icon: "fa fa-tint",
    readTime: 4,
    likes: 92,
    views: 1100
  },
  {
    id: 7,
    category: "HEALTH",
    title: "Can You Donate? Complete List of Medications That Affect Eligibility",
    excerpt: "Aspirin, antibiotics, birth control pills... Which medications require deferral and for how long? Check our comprehensive list.",
    date: "Nov 28, 2024",
    author: "Pharmacy Team",
    icon: "fa fa-pills",
    readTime: 6,
    likes: 134,
    views: 1650
  },
  {
    id: 8,
    category: "TIPS",
    title: "5 Ways to Overcome Needle Fear and Donate Confidently",
    excerpt: "Breathing techniques, distraction methods, and mental preparation tips to conquer needle phobia and become a confident donor.",
    date: "Nov 25, 2024",
    author: "Psychologist Ayesha",
    icon: "fa fa-brain",
    readTime: 5,
    likes: 267,
    views: 3400
  },
  {
    id: 9,
    category: "EMERGENCY",
    title: "When Blood is Needed Most: Understanding Trauma & Surgery Needs",
    excerpt: "Car accidents, cancer treatments, childbirth emergencies... Discover when O-negative blood becomes the 'golden lifeline'.",
    date: "Nov 22, 2024",
    author: "Emergency MD",
    icon: "fa fa-ambulance",
    readTime: 8,
    likes: 189,
    views: 2200
  },
  {
    id: 10,
    category: "BENEFITS",
    title: "7 Hidden Health Benefits of Regular Blood Donation",
    excerpt: "Free health screening, reduced heart disease risk, calorie burn equivalent, and more! Why donating is great for YOU too.",
    date: "Nov 20, 2024",
    author: "Health Research",
    icon: "fa fa-award",
    readTime: 5,
    likes: 312,
    views: 4100
  }
];

// Simulated API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// API Service Methods
export const blogApi = {
  // Get all blog posts
  getAllPosts: async () => {
    await delay(500); // Simulate network delay
    return {
      success: true,
      data: LOCAL_BLOG_DATA,
      total: LOCAL_BLOG_DATA.length
    };
  },

  // Get single blog post by ID
  getPostById: async (id) => {
    await delay(300);
    const post = LOCAL_BLOG_DATA.find(p => p.id === parseInt(id));
    if (post) {
      return { success: true, data: post };
    }
    return { success: false, error: 'Post not found' };
  },

  // Get posts by category
  getPostsByCategory: async (category) => {
    await delay(400);
    const filtered = LOCAL_BLOG_DATA.filter(p => p.category === category);
    return { success: true, data: filtered };
  },

  // Search posts
  searchPosts: async (query) => {
    await delay(300);
    const searchTerm = query.toLowerCase();
    const filtered = LOCAL_BLOG_DATA.filter(p => 
      p.title.toLowerCase().includes(searchTerm) ||
      p.excerpt.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm)
    );
    return { success: true, data: filtered };
  },

  // Like a post
  likePost: async (id) => {
    await delay(200);
    return { success: true, message: 'Post liked!' };
  },

  // Get categories
  getCategories: async () => {
    await delay(200);
    const categories = [...new Set(LOCAL_BLOG_DATA.map(p => p.category))];
    return { success: true, data: categories };
  }
};

export default blogApi;