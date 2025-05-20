import Content from "../models/Content.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const createContent = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // The path already includes the correct filename format
    const imagePath = req.file.path.replace(/\\/g, '/');

    // Use the same filename for the title (without the path)
    const title = req.generatedFilename;

    const content = new Content({
      user: req.user._id,
      image: imagePath,
      title: title,
      status: req.body.status || 'draft',
      category: req.body.category ? req.body.category.split(',') : [],
    });

    await content.save();

    res.status(201).json({
      success: true,
      message: "Content created successfully",
      content
    });
  } catch (error) {
    console.error("Content creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create content",
      error: error.message
    });
  }
}

export const getCotent = async (req, res) => {
  try {
    const content = await Content.find().populate('user', 'userId').sort({ createdAt: -1 });
    if (!content) {
      return res.status(404).json({ success: false, message: "Content not found" });
    }

    res.status(200).json({
      success: true,
      message: "Content retrieved successfully",
      content
    });

  } catch (error) {
    console.error("Content retrieval error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve content",
      error: error.message
    });
  }
}

export const updateContentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { contentId } = req.params;

    let updatedStatus = status === true ? 'approved' : 'rejected';

    const content = await Content.findByIdAndUpdate(contentId, { status: updatedStatus }, { new: true });
    if (!content) {
      return res.status(404).json({ success: false, message: "Content not found" });
    }

    res.status(200).json({
      success: true,
      message: "Content status updated successfully",
      content
    });
  } catch (error) {
    console.error("Content status update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update content status",
      error: error.message
    });
  }
}

export const productProvider = async (req, res) => {
  try {
    // Get folder type from query parameter (default to 'products')
    const folderType = req.query.type || 'products';

    // Validate folder type to prevent directory traversal attacks
    const validFolders = ['products', 'background', 'models', 'poses', 'preview', 'customised'];
    if (!validFolders.includes(folderType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid folder type specified"
      });
    }

    // Get absolute path to requested directory
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const targetDir = path.join(__dirname, `../../uploads/${folderType}`);

    // Check if directory exists
    if (!fs.existsSync(targetDir)) {
      return res.status(404).json({
        success: false,
        message: `${folderType} directory not found`
      });
    }

    // Read directory and filter for image files
    const files = fs.readdirSync(targetDir);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });

    // Create array of product objects
    let itemId = 1;

    // Main directory items
    const items = imageFiles.map(file => {
      // Extract name from file (without extension)
      const name = path.basename(file, path.extname(file))
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());

      // Determine credits based on folder type
      let credits = 1;
      if (folderType === 'background') credits = 2;
      if (folderType === 'models') credits = 3;

      return {
        id: itemId++,
        name: name,
        credits,
        img: `/uploads/${folderType}/${file}`,
        type: folderType
      };
    });

    // Process subdirectories
    const subdirs = fs.readdirSync(targetDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // Items by category
    const categorizedItems = {};

    // If subdirectories exist, add items from them
    if (subdirs.length > 0) {
      for (const dir of subdirs) {
        const categoryPath = path.join(targetDir, dir);
        const categoryName = dir.replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());

        if (fs.existsSync(categoryPath)) {
          const categoryFiles = fs.readdirSync(categoryPath)
            .filter(file => {
              const ext = path.extname(file).toLowerCase();
              return imageExtensions.includes(ext);
            });

          const categoryItems = categoryFiles.map(file => {
            const name = path.basename(file, path.extname(file))
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase());

            // Credit determination logic
            let credits = 1;

            // Adjust credits based on folder and category
            if (folderType === 'background') {
              credits = categoryName.includes('Premium') ? 3 : 2;
            } else if (folderType === 'models') {
              credits = categoryName.includes('Premium') ? 4 : 3;
            } else {
              credits = categoryName.includes('Premium') ? 2 : 1;
            }

            return {
              id: itemId++,
              name,
              credits,
              img: `/uploads/${folderType}/${dir}/${file}`,
              category: categoryName,
              type: folderType
            };
          });

          categorizedItems[categoryName] = categoryItems;
          items.push(...categoryItems);
        }
      }
    }

    res.status(200).json({
      success: true,
      folderType,
      items,
      categories: Object.keys(categorizedItems),
      itemsByCategory: categorizedItems,
      baseUrl: `${req.protocol}://${req.get('host')}`
    });

  } catch (error) {
    console.error("Asset provider error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve assets",
      error: error.message
    });
  }
};