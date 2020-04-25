const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');

const Blog = mongoose.model('Blog');

module.exports = app => {
  app.get('/api/blogs/:id', requireLogin, async (req, res) => {
    const blog = await Blog.findOne({
      _user: req.user.id,
      _id: req.params.id
    });

    res.send(blog);
  });

  app.get('/api/blogs', requireLogin, async (req, res) => {
    const redis = require('redis');
    const redisUrl = 'redis://172.17.0.2';
    const client = redis.createClient(redisUrl);
    const util = require('util');

    // client.get from node-redis doesn't return a promise object, 
    // but instead accepting a callback to handle its returned result
    // e.g client.get('key',(r)=>{console.log(r)}) 
    // promisify will overwrite client.get and make it return a promise object
    // so that the new client.get is easier to read and write. 
    client.get = util.promisify(client.get); 

    // Do we have any cached data in redis related 
    // to this query 

    const cacheBlogs = await client.get( req.user.id );

    // if yes, then respond to the request right away 
    // and return

    if (cacheBlogs) {
      console.log('SERVER FROM CACHE')
      return res.send(JSON.parse(cacheBlogs)) // JSON -> js object
    }

    // if no, we need to respond to request 
    // and updata our cach to store the data

    console.log('SERVER FROM MONGODB')
    const blogs = await Blog.find({ _user: req.user.id });

    res.send(blogs);

    client.set(req.user.id, JSON.stringify(blogs));
  });

  app.post('/api/blogs', requireLogin, async (req, res) => {
    const { title, content } = req.body;

    const blog = new Blog({
      title,
      content,
      _user: req.user.id
    });

    try {
      await blog.save();
      res.send(blog);
    } catch (err) {
      res.send(400, err);
    }
  });
};
