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
      
      // SPECIAL HANDLING FOR LIKES
      // If a Like is created, automatically update the parent entity's count
      if (name === 'JerseyLike') {
         const jerseyId = item.jersey_id;
         if (jerseyId) {
             // Find parent (Jersey or CollectionItem)
             // We try both as we don't know which one it is easily
             const Jersey = require('../models/Jersey');
             const CollectionItem = require('../models/CollectionItem');
             
             let parent = await Jersey.findByPk(jerseyId);
             let ParentModel = Jersey;
             if (!parent) {
                 parent = await CollectionItem.findByPk(jerseyId);
                 ParentModel = CollectionItem;
             }
             
             if (parent) {
                 // Count real likes
                 const count = await Model.count({ where: { jersey_id: jerseyId } });
                 
                 // Update parent with REAL count
                 await parent.update({ likes_count: count });
                 
                 // Also update JSON data if it exists to be safe
                 if (parent.data) {
                     const newData = { ...parent.data, likes_count: count };
                     await parent.update({ data: newData });
                 }
                 
                 // Notify change on parent
                 if (io) {
                    io.emit('entity:update', { type: ParentModel === Jersey ? 'Jersey' : 'CollectionItem', id: parent.id, data: parent });
                 }
             }
         }
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
      
      const jerseyId = item.jersey_id; // Capture ID before delete for Likes
      
      await item.destroy();
      
      // Notify clients via socket.io if available
      const io = req.app.get('io');
      if (io) {
        io.emit('entity:delete', { type: name, id: item.id });
      }
      
      // SPECIAL HANDLING FOR LIKES - UPDATE PARENT COUNT ON DELETE
      if (name === 'JerseyLike' && jerseyId) {
          const Jersey = require('../models/Jersey');
          const CollectionItem = require('../models/CollectionItem');
          
          let parent = await Jersey.findByPk(jerseyId);
          let ParentModel = Jersey;
          if (!parent) {
              parent = await CollectionItem.findByPk(jerseyId);
              ParentModel = CollectionItem;
          }
          
          if (parent) {
             const count = await Model.count({ where: { jersey_id: jerseyId } });
             await parent.update({ likes_count: count });
             if (parent.data) {
                 const newData = { ...parent.data, likes_count: count };
                 await parent.update({ data: newData });
             }
             if (io) {
                io.emit('entity:update', { type: ParentModel === Jersey ? 'Jersey' : 'CollectionItem', id: parent.id, data: parent });
             }
          }
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
