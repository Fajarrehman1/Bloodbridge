import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { useAuth }             from '../context/AuthContext';
import {
  getAdminStats,
  getAllUsers,
  deleteUser,
  changeUserRole,
  getAllAdminDonors,
  getAllAdminRequests,
  deleteAdminRequest,
  broadcastNotif,
  getAllBlogsAdmin,
  createBlog,
  updateBlog,
  deleteBlog
} from '../api/services';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const [activeTab,    setActiveTab]    = useState('overview');
  const [stats,        setStats]        = useState({});
  const [users,        setUsers]        = useState([]);
  const [donors,       setDonors]       = useState([]);
  const [requests,     setRequests]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [success,      setSuccess]      = useState('');
  const [error,        setError]        = useState('');
  const [search,       setSearch]       = useState('');
  const [roleFilter,   setRoleFilter]   = useState('');
  const [broadcast,    setBroadcast]    = useState({ message: '', type: 'system' });
  const [blogs,        setBlogs]        = useState([]);
  const [blogForm,     setBlogForm]     = useState({
    title: '', excerpt: '', content: '',
    category: 'Awareness', author: '', image: '', published: true
  });
  const [editBlog,     setEditBlog]     = useState(null);
  const [showBlogForm, setShowBlogForm] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, donorsRes, reqRes, blogsRes] = await Promise.all([
        getAdminStats(),
        getAllUsers(),
        getAllAdminDonors(),
        getAllAdminRequests(),
        getAllBlogsAdmin()
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users || usersRes.data);
      setDonors(donorsRes.data);
      setRequests(reqRes.data);
      setBlogs(blogsRes.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u._id !== id));
      setSuccess('User deleted');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Delete failed');
    }
  };

  const handleChangeRole = async (id, role) => {
    try {
      await changeUserRole(id, role);
      setUsers(prev => prev.map(u =>
        u._id === id ? { ...u, role } : u
      ));
      setSuccess('Role updated');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Role update failed');
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await deleteAdminRequest(id);
      setRequests(prev => prev.filter(r => r._id !== id));
      setSuccess('Request deleted');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Delete failed');
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    try {
      const res = await broadcastNotif(broadcast);
      setSuccess(res.data.message || 'Broadcast sent!');
      setBroadcast({ message: '', type: 'system' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Broadcast failed');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCreateBlog = async (e) => {
    e.preventDefault();
    try {
      if (editBlog) {
        await updateBlog(editBlog._id, blogForm);
        setSuccess('Blog updated successfully!');
      } else {
        await createBlog(blogForm);
        setSuccess('Blog published successfully!');
      }
      setShowBlogForm(false);
      setEditBlog(null);
      setBlogForm({
        title: '', excerpt: '', content: '',
        category: 'Awareness', author: '', image: '', published: true
      });
      const res = await getAllBlogsAdmin();
      setBlogs(res.data);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Blog operation failed');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEditBlog = (blog) => {
    setEditBlog(blog);
    setBlogForm({
      title:     blog.title,
      excerpt:   blog.excerpt,
      content:   blog.content,
      category:  blog.category,
      author:    blog.author,
      image:     blog.image,
      published: blog.published
    });
    setShowBlogForm(true);
    setActiveTab('blogs');
  };

  const handleDeleteBlog = async (id) => {
    if (!window.confirm('Delete this blog?')) return;
    try {
      await deleteBlog(id);
      setBlogs(prev => prev.filter(b => b._id !== id));
      setSuccess('Blog deleted');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Delete failed');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (loading) {
    return (
      <div className="ad-loading">
        <div className="ad-spinner"></div>
        <p>Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="ad-page">

      {/* ── Sidebar ── */}
      <aside className="ad-sidebar">
        <div className="ad-sidebar-top">
          <div className="ad-logo">🩸 BloodBridge</div>
          <div className="ad-user-info">
            <div className="ad-avatar">A</div>
            <div>
              <p className="ad-user-name">{user?.name}</p>
              <p className="ad-user-role">Administrator</p>
            </div>
          </div>
        </div>

        <nav className="ad-nav">
          {[
            { id: 'overview',  label: '📊 Overview'      },
            { id: 'users',     label: '👥 Users'          },
            { id: 'donors',    label: '🩸 Donors'         },
            { id: 'requests',  label: '🆘 Requests'       },
            { id: 'broadcast', label: '📢 Broadcast'      },
            { id: 'blogs',     label: '📝 Manage Blogs'   },
          ].map(tab => (
            <button
              key={tab.id}
              className={`ad-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="ad-sidebar-bottom">
          <button className="ad-nav-btn" onClick={() => navigate('/')}>
            🏠 View Site
          </button>
          <button className="ad-logout-btn" onClick={logout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="ad-main">
        {success && <div className="ad-success">{success}</div>}
        {error   && <div className="ad-error">{error}</div>}

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div className="ad-content">
            <h2 className="ad-title">📊 Dashboard Overview</h2>
            <div className="ad-stats-grid">
              {[
                { icon: '👥', val: stats.totalUsers,       lbl: 'Total Users'   },
                { icon: '🩸', val: stats.totalDonors,      lbl: 'Total Donors'  },
                { icon: '🆘', val: stats.totalRequests,    lbl: 'Total Requests'},
                { icon: '✅', val: stats.openRequests,     lbl: 'Open Requests' },
                { icon: '🎯', val: stats.fulfilledRequests,lbl: 'Fulfilled'     },
              ].map((s, i) => (
                <div key={i} className="ad-stat-card">
                  <div className="ad-stat-icon">{s.icon}</div>
                  <div className="ad-stat-val">{s.val ?? 0}</div>
                  <div className="ad-stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
            <div className="ad-overview-grid">
              <div className="ad-overview-card">
                <h3>Recent Users</h3>
                <table className="ad-mini-table">
                  <thead>
                    <tr><th>Name</th><th>Role</th><th>City</th></tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 5).map(u => (
                      <tr key={u._id}>
                        <td>{u.name}</td>
                        <td>
                          <span className={`ad-role-badge ${u.role}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>{u.city || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="ad-overview-card">
                <h3>Recent Requests</h3>
                <table className="ad-mini-table">
                  <thead>
                    <tr><th>Blood</th><th>City</th><th>Urgency</th></tr>
                  </thead>
                  <tbody>
                    {requests.slice(0, 5).map(r => (
                      <tr key={r._id}>
                        <td><b style={{color:'#c0392b'}}>{r.bloodGroup}</b></td>
                        <td>{r.city}</td>
                        <td>
                          <span className={`ad-urgency ${r.urgency}`}>
                            {r.urgency}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Users ── */}
        {activeTab === 'users' && (
          <div className="ad-content">
            <h2 className="ad-title">👥 Manage Users</h2>
            <p className="ad-sub">Total: {filteredUsers.length} users</p>
            <div className="ad-filters">
              <input
                className="ad-search"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select
                className="ad-filter-select"
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="donor">Donor</option>
                <option value="receiver">Receiver</option>
                <option value="admin">Admin</option>
              </select>
              <button
                className="ad-clear-btn"
                onClick={() => { setSearch(''); setRoleFilter(''); }}
              >
                Clear
              </button>
            </div>
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Blood</th>
                    <th>City</th>
                    <th>Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <tr key={u._id}>
                      <td>{i + 1}</td>
                      <td className="ad-name-cell">
                        <div className="ad-user-avatar">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        {u.name}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <select
                          className="ad-role-select"
                          value={u.role}
                          onChange={e => handleChangeRole(u._id, e.target.value)}
                        >
                          <option value="donor">donor</option>
                          <option value="receiver">receiver</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td>
                        {u.bloodGroup && (
                          <span className="ad-blood-badge">{u.bloodGroup}</span>
                        )}
                      </td>
                      <td>{u.city || '-'}</td>
                      <td>{u.phone || '-'}</td>
                      <td>
                        <button
                          className="ad-delete-btn"
                          onClick={() => handleDeleteUser(u._id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Donors ── */}
        {activeTab === 'donors' && (
          <div className="ad-content">
            <h2 className="ad-title">🩸 All Donors</h2>
            <p className="ad-sub">Total: {donors.length} donors</p>
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Blood Group</th>
                    <th>City</th>
                    <th>Phone</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {donors.map((d, i) => (
                    <tr key={d._id}>
                      <td>{i + 1}</td>
                      <td>{d.name || d.user?.name}</td>
                      <td>
                        <span className="ad-blood-badge">{d.bloodGroup}</span>
                      </td>
                      <td>{d.city}</td>
                      <td>{d.phone || d.user?.phone || '-'}</td>
                      <td>
                        <span className={`ad-status ${d.available ? 'available' : 'unavailable'}`}>
                          {d.available ? '✅ Available' : '❌ Unavailable'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Requests ── */}
        {activeTab === 'requests' && (
          <div className="ad-content">
            <h2 className="ad-title">🆘 All Blood Requests</h2>
            <p className="ad-sub">Total: {requests.length} requests</p>
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Blood</th>
                    <th>City</th>
                    <th>Urgency</th>
                    <th>Status</th>
                    <th>Posted By</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r, i) => (
                    <tr key={r._id}>
                      <td>{i + 1}</td>
                      <td>
                        <span className="ad-blood-badge">{r.bloodGroup}</span>
                      </td>
                      <td>{r.city}</td>
                      <td>
                        <span className={`ad-urgency ${r.urgency}`}>
                          {r.urgency}
                        </span>
                      </td>
                      <td>
                        <span className={`ad-req-status ${r.status}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>{r.postedBy?.name || '-'}</td>
                      <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="ad-delete-btn"
                          onClick={() => handleDeleteRequest(r._id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Broadcast ── */}
        {activeTab === 'broadcast' && (
          <div className="ad-content">
            <h2 className="ad-title">📢 Broadcast Notification</h2>
            <p className="ad-sub">
              Send a notification to all {stats.totalUsers || 0} registered users
            </p>
            <div className="ad-broadcast-card">
              <form onSubmit={handleBroadcast} className="ad-broadcast-form">
                <h3>✍️ Write Your Message</h3>

                <div className="ad-field">
                  <label>Notification Type</label>
                  <select
                    value={broadcast.type}
                    onChange={e => setBroadcast(b => ({
                      ...b, type: e.target.value
                    }))}
                  >
                    <option value="system">🔔 System Announcement</option>
                    <option value="request">🩸 Blood Request Alert</option>
                  </select>
                </div>

                <div className="ad-field">
                  <label>Message *</label>
                  <textarea
                    placeholder="Example: Blood donation camp this Sunday at Punjab University Lahore! Come and save lives."
                    value={broadcast.message}
                    onChange={e => setBroadcast(b => ({
                      ...b, message: e.target.value
                    }))}
                    rows={6}
                    required
                  />
                </div>

                <button type="submit" className="ad-broadcast-btn">
                  📢 Send to All {stats.totalUsers || 0} Users
                </button>
              </form>

              <div className="ad-broadcast-info">
                <h4>📊 Audience Stats</h4>
                <div className="ad-broadcast-stats">
                  <div>
                    <span>{stats.totalUsers || 0}</span>
                    <p>Total Recipients</p>
                  </div>
                  <div>
                    <span>{stats.totalDonors || 0}</span>
                    <p>Donors</p>
                  </div>
                  <div>
                    <span>
                      {(stats.totalUsers || 0) - (stats.totalDonors || 0)}
                    </span>
                    <p>Receivers</p>
                  </div>
                </div>

                <h4 style={{marginTop: '24px'}}>📌 Tips</h4>
                <ul>
                  <li>All users will see this in Notifications</li>
                  <li>Use for blood drives and campaigns</li>
                  <li>Keep messages clear and concise</li>
                  <li>Users can view at /notifications</li>
                </ul>

                <h4 style={{marginTop: '20px'}}>📝 Message Templates</h4>
                <div className="ad-templates">
                  {[
                    'Blood donation camp this Sunday at Punjab University Lahore!',
                    'Critical shortage of O- blood in Lahore hospitals. Please donate!',
                    'Thank you to all donors! You saved 50 lives this month.',
                  ].map((t, i) => (
                    <button
                      key={i}
                      className="ad-template-btn"
                      type="button"
                      onClick={() => setBroadcast(b => ({ ...b, message: t }))}
                    >
                      {t.substring(0, 50)}...
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Manage Blogs ── */}
        {activeTab === 'blogs' && (
          <div className="ad-content">
            <div className="ad-blogs-header">
              <div>
                <h2 className="ad-title">📝 Manage Blogs</h2>
                <p className="ad-sub">
                  {blogs.length} articles published on /blog page
                </p>
              </div>
              <button
                className="ad-add-blog-btn"
                onClick={() => {
                  setShowBlogForm(!showBlogForm);
                  setEditBlog(null);
                  setBlogForm({
                    title: '', excerpt: '', content: '',
                    category: 'Awareness', author: '', image: '', published: true
                  });
                }}
              >
                {showBlogForm ? '✕ Cancel' : '+ New Blog'}
              </button>
            </div>

            {/* Blog Form */}
            {showBlogForm && (
              <div className="ad-blog-form-card">
                <h3>{editBlog ? '✏️ Edit Blog' : '📝 Create New Blog'}</h3>
                <form onSubmit={handleCreateBlog} className="ad-blog-form">

                  <div className="ad-blog-row">
                    <div className="ad-field">
                      <label>Title *</label>
                      <input
                        placeholder="Blog title..."
                        value={blogForm.title}
                        onChange={e => setBlogForm(f => ({
                          ...f, title: e.target.value
                        }))}
                        required
                      />
                    </div>
                    <div className="ad-field">
                      <label>Category</label>
                      <select
                        value={blogForm.category}
                        onChange={e => setBlogForm(f => ({
                          ...f, category: e.target.value
                        }))}
                      >
                        <option value="Awareness">Awareness</option>
                        <option value="Health Tips">Health Tips</option>
                        <option value="Education">Education</option>
                        <option value="Nutrition">Nutrition</option>
                      </select>
                    </div>
                  </div>

                  <div className="ad-blog-row">
                    <div className="ad-field">
                      <label>Author Name</label>
                      <input
                        placeholder="Dr. Ahmed Khan..."
                        value={blogForm.author}
                        onChange={e => setBlogForm(f => ({
                          ...f, author: e.target.value
                        }))}
                      />
                    </div>
                    <div className="ad-field">
                      <label>Image URL (optional)</label>
                      <input
                        placeholder="https://images.unsplash.com/..."
                        value={blogForm.image}
                        onChange={e => setBlogForm(f => ({
                          ...f, image: e.target.value
                        }))}
                      />
                    </div>
                  </div>

                  <div className="ad-field">
                    <label>Short Excerpt * (shown on blog list)</label>
                    <textarea
                      placeholder="Write a short 1-2 sentence description..."
                      value={blogForm.excerpt}
                      onChange={e => setBlogForm(f => ({
                        ...f, excerpt: e.target.value
                      }))}
                      rows={2}
                      required
                    />
                  </div>

                  <div className="ad-field">
                    <label>Full Content * (full article)</label>
                    <textarea
                      placeholder="Write the full blog article here..."
                      value={blogForm.content}
                      onChange={e => setBlogForm(f => ({
                        ...f, content: e.target.value
                      }))}
                      rows={10}
                      required
                    />
                  </div>

                  <div className="ad-field">
                    <label className="ad-checkbox-label">
                      <input
                        type="checkbox"
                        checked={blogForm.published}
                        onChange={e => setBlogForm(f => ({
                          ...f, published: e.target.checked
                        }))}
                      />
                      <span>✅ Publish immediately (visible to all users on /blog)</span>
                    </label>
                  </div>

                  <div className="ad-blog-form-btns">
                    <button type="submit" className="ad-broadcast-btn">
                      {editBlog ? '✏️ Update Blog' : '📝 Publish Blog'}
                    </button>
                    <button
                      type="button"
                      className="ad-cancel-blog-btn"
                      onClick={() => {
                        setShowBlogForm(false);
                        setEditBlog(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Blogs List */}
            {blogs.length === 0 && !showBlogForm ? (
              <div className="ad-empty-blogs">
                <p style={{fontSize: '48px'}}>📝</p>
                <p style={{fontSize: '20px', fontWeight: '700', marginTop: '8px'}}>
                  No blogs yet
                </p>
                <p style={{color: '#888', marginTop: '6px'}}>
                  Click "+ New Blog" to create your first article
                </p>
                <button
                  className="ad-add-blog-btn"
                  style={{marginTop: '16px'}}
                  onClick={() => setShowBlogForm(true)}
                >
                  + Create First Blog
                </button>
              </div>
            ) : (
              <div className="ad-blogs-list">
                {blogs.map(blog => (
                  <div key={blog._id} className="ad-blog-item">
                    <div className="ad-blog-img">
                      <img
                        src={blog.image ||
                          'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=100'}
                        alt={blog.title}
                        onError={e => {
                          e.target.src = 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=100';
                        }}
                      />
                    </div>
                    <div className="ad-blog-info">
                      <h4>{blog.title}</h4>
                      <p>{blog.excerpt?.substring(0, 100)}...</p>
                      <div className="ad-blog-meta">
                        <span className="ad-blog-cat">{blog.category}</span>
                        <span>✍️ {blog.author || 'BloodBridge Team'}</span>
                        <span>
                          📅 {new Date(blog.createdAt).toLocaleDateString()}
                        </span>
                        <span className={`ad-blog-status ${blog.published ? 'pub' : 'draft'}`}>
                          {blog.published ? '✅ Published' : '📝 Draft'}
                        </span>
                      </div>
                    </div>
                    <div className="ad-blog-actions">
                      <button
                        className="ad-edit-btn"
                        onClick={() => handleEditBlog(blog)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="ad-delete-btn"
                        onClick={() => handleDeleteBlog(blog._id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;