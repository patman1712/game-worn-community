const express = require('express');
const router = express.Router();
const Jersey = require('../models/Jersey');
const CollectionItem = require('../models/CollectionItem');
const Message = require('../models/Message');
const User = require('../models/User');
const JerseyLike = require('../models/JerseyLike');
const PendingUser = require('../models/PendingUser');
const Comment = require('../models/Comment');
const SiteContent = require('../models/SiteContent');

// Map entity names to models
const models = {
  'Jersey': Jersey,
  'CollectionItem': CollectionItem,
  'Message': Message,
  'User': User,
  'JerseyLike': JerseyLike,
  'PendingUser': PendingUser,
  'Comment': Comment,
  'SiteContent': SiteContent
};

// Generic CRUD handler factory
const createHandler = (Model, name) => ({
  list: async (req, res) => {
    try {
      const items = await Model.findAll();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  get: async (req, res) => {
    try {
      const item = await Model.findByPk(req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  create: async (req, res) => {
    try {
      const item = await Model.create(req.body);
      
      // Notify clients via socket.io if available
      const io = req.app.get('io');
      if (io) {
        io.emit('entity:update', { type: name, id: item.id, data: item });
      }
      
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  update: async (req, res) => {
    try {
      const item = await Model.findByPk(req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      
      await item.update(req.body);
      
      // Notify clients via socket.io if available
      const io = req.app.get('io');
      if (io) {
        io.emit('entity:update', { type: name, id: item.id, data: item });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  delete: async (req, res) => {
    try {
      const item = await Model.findByPk(req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      
      await item.destroy();
      
      // Notify clients via socket.io if available
      const io = req.app.get('io');
      if (io) {
        io.emit('entity:delete', { type: name, id: item.id });
      }
      
      res.json({ message: 'Deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Register routes for each entity
Object.entries(models).forEach(([name, Model]) => {
  const handler = createHandler(Model, name);
  
  // Define routes dynamically
  router.get(`/${name}`, handler.list);
  router.get(`/${name}/:id`, handler.get);
  router.post(`/${name}`, handler.create);
  router.patch(`/${name}/:id`, handler.update);
  router.delete(`/${name}/:id`, handler.delete);
});

module.exports = router;
