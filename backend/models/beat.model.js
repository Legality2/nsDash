import mongoose from 'mongoose';

const beatSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    public: { type: Boolean, default: false },
    
    // Beat metadata
    bpm: { type: Number, default: 128 },
    timeSignature: { type: String, default: '4/4' },
    
    // Layers - each beat can have multiple variations
    layers: [
      {
        name: { type: String, default: 'Layer 1' },
        bpm: { type: Number },
        swing: { type: Number, default: 0 },
        stepCount: { type: Number, default: 16 },
        
        // Synth settings for this layer
        synth: {
          osc: { type: String, default: 'square' },
          attack: { type: Number, default: 0.01 },
          decay: { type: Number, default: 0.15 },
          sustain: { type: Number, default: 0.65 },
          release: { type: Number, default: 0.4 },
          volume: { type: Number, default: 0.55 }
        },
        
        // Drum tracks data
        tracks: [
          {
            id: String,
            name: String,
            color: String,
            volume: Number,
            muted: Boolean,
            solo: Boolean,
            pitch: Number,
            steps: [Number]  // 0=off, 1=light, 2=medium, 3=hard
          }
        ],
        
        // Piano notes (if any)
        pianoNotes: [
          {
            key: String,
            octave: Number,
            startStep: Number,
            duration: Number
          }
        ],
        
        // Effects
        masterVolume: { type: Number, default: 0.75 },
        reverbWet: { type: Number, default: 0.2 },
        delayWet: { type: Number, default: 0 },
        delayFeedback: { type: Number, default: 0.35 }
      }
    ],
    
    // Current active layer index
    activeLayerIndex: { type: Number, default: 0 },
    
    // Tags for organization
    tags: [String],
    
    // Genre/category
    category: { type: String, enum: ['electronic', 'hiphop', 'house', 'techno', 'ambient', 'other'], default: 'electronic' },
    
    // Likes/plays
    plays: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // Metadata
    duration: { type: Number }, // in seconds
    isTemplate: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Add method to get current layer
beatSchema.methods.getCurrentLayer = function() {
  return this.layers[this.activeLayerIndex] || this.layers[0] || null;
};

// Add method to add new layer
beatSchema.methods.addLayer = function(layerName = 'New Layer') {
  const currentLayer = this.getCurrentLayer();
  const newLayer = {
    name: layerName,
    bpm: currentLayer?.bpm,
    swing: currentLayer?.swing || 0,
    stepCount: currentLayer?.stepCount || 16,
    synth: currentLayer?.synth || {
      osc: 'square',
      attack: 0.01,
      decay: 0.15,
      sustain: 0.65,
      release: 0.4,
      volume: 0.55
    },
    tracks: currentLayer?.tracks ? JSON.parse(JSON.stringify(currentLayer.tracks)) : [],
    pianoNotes: [],
    masterVolume: currentLayer?.masterVolume || 0.75,
    reverbWet: currentLayer?.reverbWet || 0.2,
    delayWet: currentLayer?.delayWet || 0,
    delayFeedback: currentLayer?.delayFeedback || 0.35
  };
  this.layers.push(newLayer);
  return newLayer;
};

// Add method to duplicate layer
beatSchema.methods.duplicateLayer = function(layerIndex) {
  const layer = this.layers[layerIndex];
  if (!layer) return null;
  
  const duplicate = JSON.parse(JSON.stringify(layer));
  duplicate.name = `${layer.name} (Copy)`;
  this.layers.push(duplicate);
  return duplicate;
};

// Add method to delete layer
beatSchema.methods.deleteLayer = function(layerIndex) {
  if (this.layers.length > 1 && layerIndex >= 0 && layerIndex < this.layers.length) {
    this.layers.splice(layerIndex, 1);
    if (this.activeLayerIndex >= this.layers.length) {
      this.activeLayerIndex = this.layers.length - 1;
    }
    return true;
  }
  return false;
};

export default mongoose.model('Beat', beatSchema);
