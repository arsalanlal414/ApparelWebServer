import Library from '../models/Library.js';
import { createLibrarySchema } from '../validators/libraryValidator.js';
import fs from 'fs';

export const createLibrary = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (req.body.tags) {
      // Handle both JSON and comma-separated strings
      payload.tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : req.body.tags.split(',').map(tag => tag.trim());
    }

    payload.createdBy = req.user._id;

    // Simplified image handling
    if (req.files && req.files.length > 0) {
      payload.images = req.files.map(file => `/uploads/library/${file.filename}`);
    }

    console.log({ payload })

    // Validate the payload
    const { error, value } = createLibrarySchema.validate(payload, { abortEarly: false });
    if (error) {
      // Delete uploaded files if validation fails
      console.log(error)
      if (req.files) {
        req.files.forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((e) => e.message),
      });
    }

    const newLibraryItem = await Library.create(value);

    res.status(201).json({
      success: true,
      message: 'Library item created successfully',
      data: newLibraryItem,
    });
  } catch (err) {
    // Delete uploaded files if something goes wrong
    if (req.files) {
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
    }
    console.error('Create Library Error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

export const getLibraryItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sort = '-createdAt',
      type,
      category,
      search
    } = req.query;

    // Build query
    const query = {};

    // Add filters if provided
    if (type) query.type = type;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { tags: { $regex: search, $options: 'i' } },
        { templateGroup: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const total = await Library.countDocuments(query);

    // Execute query with pagination and sorting
    const items = await Library.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          totalItems: total
        }
      }
    });
  } catch (err) {
    console.error('Get Library Items Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch library items',
      error: err.message
    });
  }
};
