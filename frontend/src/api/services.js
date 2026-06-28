import API from './axios';

// ─── Auth ─────────────────────────────────────────────────
export const loginUser          = (data)   => API.post('/auth/login', data);
export const registerDonorAPI   = (data)   => API.post('/auth/register-donor', data);
export const registerReceiverAPI= (data)   => API.post('/auth/register-receiver', data);
export const forgotPasswordAPI  = (data)   => API.post('/auth/forgot-password', data);
export const verifyOTPAPI       = (data)   => API.post('/auth/verify-otp', data);
export const resetPasswordAPI   = (data)   => API.post('/auth/reset-password', data);
export const matchDonorsAPI     = (params) => API.get('/auth/match-donors', { params });

// ─── Donors ───────────────────────────────────────────────
export const searchDonors       = (params) => API.get('/donors', { params });
export const updateDonorProfile = (data)   => API.put('/donors/me', data);

// ─── Blood Requests ───────────────────────────────────────
export const getBloodRequests   = (params) => API.get('/requests', { params });
export const postBloodRequest   = (data)   => API.post('/requests', data);
export const closeBloodRequest  = (id)     => API.put(`/requests/${id}/close`);
export const getMyRequests = () => API.get('/requests/my-requests');

// ─── Responses ────────────────────────────────────────────
export const respondToRequest   = (id, data) => API.post(`/responses/respond/${id}`, data);
export const getRequestResponses= (id)      => API.get(`/responses/request/${id}`);
export const acceptResponse     = (id)      => API.put(`/responses/accept/${id}`);
export const rejectResponse     = (id)      => API.put(`/responses/reject/${id}`);
export const getMyResponses     = ()        => API.get('/responses/my-responses');

// ─── Notifications ────────────────────────────────────────
export const getNotifications   = ()   => API.get('/notifications');
export const markAllRead        = ()   => API.put('/notifications/read-all');
export const markOneRead        = (id) => API.put(`/notifications/${id}/read`);
export const deleteNotification = (id) => API.delete(`/notifications/${id}`);

// ── Bookmarks ─────────────────────────────────────────────
export const getBookmarks    = ()        => API.get('/bookmarks');
export const addBookmark     = (donorId) => API.post('/bookmarks', { donorId });
export const removeBookmark  = (donorId) => API.delete(`/bookmarks/${donorId}`);
export const checkBookmark   = (donorId) => API.get(`/bookmarks/check/${donorId}`);

// ─── Chat ─────────────────────────────────────────────────
export const getChatInbox       = ()       => API.get('/chat/inbox');
export const getConversation    = (userId) => API.get(`/chat/${userId}`);
export const markMessagesRead   = (userId) => API.put(`/chat/${userId}/read`);

// ─── Location ─────────────────────────────────────────────
export const updateLocation     = (data)   => API.put('/location/update', data);
export const getMyLocation      = ()       => API.get('/location/me');
export const findNearestDonors  = (params) => API.get('/location/nearest-donors', { params });
export const findNearestRequests= (params) => API.get('/location/nearest-requests', { params });

// ─── Admin ────────────────────────────────────────────────
export const getAdminStats      = ()         => API.get('/admin/stats');
export const getAllUsers         = (params)   => API.get('/admin/users', { params });
export const deleteUser         = (id)       => API.delete(`/admin/users/${id}`);
export const changeUserRole     = (id, role) => API.put(`/admin/users/${id}/role`, { role });
export const getAllAdminDonors   = ()         => API.get('/admin/donors');
export const getAllAdminRequests = ()         => API.get('/admin/requests');
export const deleteAdminRequest = (id)       => API.delete(`/admin/requests/${id}`);
export const broadcastNotif     = (data)     => API.post('/admin/broadcast', data);
// ─── Blogs ────────────────────────────────────────────────
export const getBlogs        = (params)    => API.get('/blogs', { params });
export const getBlog         = (id)        => API.get(`/blogs/${id}`);
export const createBlog      = (data)      => API.post('/blogs', data);
export const updateBlog      = (id, data)  => API.put(`/blogs/${id}`, data);
export const deleteBlog      = (id)        => API.delete(`/blogs/${id}`);
export const getAllBlogsAdmin = ()          => API.get('/blogs/admin/all');
// ── Leaderboard ───────────────────────────────────────────
export const getLeaderboard = (params) =>
  API.get('/leaderboard', { params });
export const getMyRank = () =>
  API.get('/leaderboard/my-rank');

// ── Donation Confirmation ───────────────────────────────────
export const confirmDonation = (responseId, hospitalName) =>
  API.post(`/donations/confirm/${responseId}`, { hospitalName });
export const getPendingConfirmations = () =>
  API.get('/donations/pending-confirmations');