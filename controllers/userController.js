const User = require('../models/User');

// GET /api/user/profile — get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// PUT /api/user/profile — update currency, notifyDays, password
exports.updateProfile = async (req, res) => {
  try {
    const { currency, notifyDays, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update currency
    if (currency !== undefined) {
      user.currency = currency;
    }

    // Update notifyDays
    if (notifyDays !== undefined) {
      user.notifyDays = notifyDays;
    }

    // Update password (requires correct current password, new one hashed by pre-save hook)
    if (newPassword !== undefined) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ message: 'Current password is required to change password' });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: 'Current password is incorrect' });
      }
      user.password = newPassword;
    }

    await user.save();

    res.json(user);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error updating profile' });
  }
};
