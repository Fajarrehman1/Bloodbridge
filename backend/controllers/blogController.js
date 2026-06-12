const Blog = require('../models/Blog');

exports.getBlogs = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { published: true };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title:   new RegExp(search, 'i') },
        { excerpt: new RegExp(search, 'i') }
      ];
    }
    const blogs = await Blog.find(filter)
      .populate('postedBy', 'name')
      .sort('-createdAt');
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('postedBy', 'name');
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createBlog = async (req, res) => {
  try {
    const blog = await Blog.create({
      ...req.body,
      postedBy: req.user._id
    });
    res.status(201).json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate('postedBy', 'name')
      .sort('-createdAt');
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};