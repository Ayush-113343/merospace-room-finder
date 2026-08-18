const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  // Only one settings document ever exists — enforced by the key field
  key: { type: String, default: 'global', unique: true },

  // General
  siteName:     { type: String, default: 'MeroSpace' },
  tagline:      { type: String, default: 'Find Rooms in the Kathmandu Valley' },
  contactEmail: { type: String, default: 'hello@merospace.com' },
  contactPhone: { type: String, default: '+977 98XXXXXXXX' },

  // Listing rules
  requireApproval: { type: Boolean, default: true },
  maxImages:       { type: Number, default: 5 },
  maxFileSizeMB:   { type: Number, default: 5 },
  allowedRoomTypes:{ type: [String], default: ['Single Room', 'Apartment', 'Studio'] },

  // Locations
  supportedLocations: {
    type: [String],
    default: ['Kathmandu','Lalitpur','Bhaktapur','Thamel','Patan','Jorpati','Baneshwor','Koteshwor']
  },

  // Appearance
  primaryColor:    { type: String, default: '#0D9488' },
  accentColor:     { type: String, default: '#F59E0B' },
  homepageTagline: { type: String, default: 'Find Your Perfect Room in Kathmandu Valley' },
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
