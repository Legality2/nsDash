import Beat from '../models/beat.model.js';
import User from '../models/user.model.js';

// Get all beats (public + user's own)
export const getBeats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, tags, search, isTemplate } = req.query;
    
    let filter = {
      $or: [
        { public: true },
        { creator: userId }
      ]
    };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (isTemplate === 'true') {
      filter.isTemplate = true;
    }
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    
    if (tags && tags.length > 0) {
      filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }
    
    const beats = await Beat.find(filter)
      .select('name description category tags creator plays likes createdAt')
      .populate('creator', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json(beats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single beat
export const getBeat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const beat = await Beat.findById(id).populate('creator', 'firstName lastName');
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    // Check permissions
    if (!beat.public && beat.creator._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this beat' });
    }
    
    res.json(beat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new beat
export const createBeat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, category, layers, bpm, isTemplate } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Beat name is required' });
    }
    
    // Create initial layer if not provided
    const initialLayers = layers && layers.length > 0 ? layers : [
      {
        name: 'Layer 1',
        bpm: bpm || 128,
        swing: 0,
        stepCount: 16,
        synth: {
          osc: 'square',
          attack: 0.01,
          decay: 0.15,
          sustain: 0.65,
          release: 0.4,
          volume: 0.55
        },
        tracks: [],
        pianoNotes: [],
        masterVolume: 0.75,
        reverbWet: 0.2,
        delayWet: 0,
        delayFeedback: 0.35
      }
    ];
    
    const newBeat = new Beat({
      name,
      description,
      category: category || 'electronic',
      creator: userId,
      layers: initialLayers,
      bpm: bpm || 128,
      isTemplate: isTemplate || false
    });
    
    await newBeat.save();
    await newBeat.populate('creator', 'firstName lastName');
    
    res.status(201).json(newBeat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update beat
export const updateBeat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description, category, tags, layers, activeLayerIndex, bpm, public: isPublic } = req.body;
    
    const beat = await Beat.findById(id);
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    // Check permissions
    if (beat.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this beat' });
    }
    
    // Update allowed fields
    if (name !== undefined) beat.name = name;
    if (description !== undefined) beat.description = description;
    if (category !== undefined) beat.category = category;
    if (tags !== undefined) beat.tags = tags;
    if (layers !== undefined) beat.layers = layers;
    if (activeLayerIndex !== undefined) beat.activeLayerIndex = activeLayerIndex;
    if (bpm !== undefined) beat.bpm = bpm;
    if (isPublic !== undefined) beat.public = isPublic;
    
    await beat.save();
    await beat.populate('creator', 'firstName lastName');
    
    res.json(beat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete beat
export const deleteBeat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const beat = await Beat.findById(id);
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    // Check permissions
    if (beat.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this beat' });
    }
    
    await Beat.findByIdAndDelete(id);
    
    res.json({ message: 'Beat deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add layer to beat
export const addLayer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { layerName } = req.body;
    
    const beat = await Beat.findById(id);
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    if (beat.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const newLayer = beat.addLayer(layerName || 'New Layer');
    await beat.save();
    
    res.json({ layer: newLayer, layerIndex: beat.layers.length - 1 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Duplicate layer
export const duplicateLayer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { layerIndex } = req.body;
    
    const beat = await Beat.findById(id);
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    if (beat.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (typeof layerIndex !== 'number' || layerIndex < 0 || layerIndex >= beat.layers.length) {
      return res.status(400).json({ message: 'Invalid layer index' });
    }
    
    const duplicate = beat.duplicateLayer(layerIndex);
    await beat.save();
    
    res.json({ layer: duplicate, layerIndex: beat.layers.length - 1 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete layer
export const deleteLayer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { layerIndex } = req.body;
    
    const beat = await Beat.findById(id);
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    if (beat.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (beat.layers.length === 1) {
      return res.status(400).json({ message: 'Cannot delete the only layer' });
    }
    
    const success = beat.deleteLayer(layerIndex);
    
    if (!success) {
      return res.status(400).json({ message: 'Invalid layer index' });
    }
    
    await beat.save();
    res.json({ message: 'Layer deleted', activeLayerIndex: beat.activeLayerIndex });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Like beat
export const likeBeat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const beat = await Beat.findById(id);
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    const likeIndex = beat.likes.indexOf(userId);
    if (likeIndex > -1) {
      beat.likes.splice(likeIndex, 1);
    } else {
      beat.likes.push(userId);
    }
    
    await beat.save();
    res.json({ likes: beat.likes.length, isLiked: likeIndex === -1 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Increment play count
export const playBeat = async (req, res) => {
  try {
    const { id } = req.params;
    
    const beat = await Beat.findByIdAndUpdate(
      id,
      { $inc: { plays: 1 } },
      { new: true }
    );
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    res.json({ plays: beat.plays });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
