import User from '../models/User.js';

/**
 * Update user profile
 * @route PUT /api/users/me
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Get user addresses
 * @route GET /api/users/me/addresses
 */
export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Sort addresses: default first, then by createdAt (newest first)
    const addresses = (user.addresses || []).sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return new Date(b.createdAt || b._id.getTimestamp()) - new Date(a.createdAt || a._id.getTimestamp());
    });

    res.json({
      success: true,
      data: { addresses },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Add new address
 * @route POST /api/users/me/addresses
 */
export const addAddress = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, street, apartment, city, state, pinCode, country, isDefault } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !street || !city || !state || !pinCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email, phone, street, city, state, pinCode',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    // Add new address
    const newAddress = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      street: street.trim(),
      apartment: apartment ? apartment.trim() : '',
      city: city.trim(),
      state: state.trim(),
      pinCode: pinCode.trim(),
      country: country || 'India',
      isDefault: isDefault || false,
      createdAt: new Date(),
    };

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: { address: user.addresses[user.addresses.length - 1] },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Update address
 * @route PUT /api/users/me/addresses/:addressId
 */
export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { firstName, lastName, email, phone, street, apartment, city, state, pinCode, country, isDefault } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      user.addresses.forEach((addr, idx) => {
        if (idx !== addressIndex) {
          addr.isDefault = false;
        }
      });
    }

    // Update address
    const addressToUpdate = user.addresses[addressIndex];
    if (firstName !== undefined) addressToUpdate.firstName = firstName.trim();
    if (lastName !== undefined) addressToUpdate.lastName = lastName.trim();
    if (email !== undefined) addressToUpdate.email = email.trim().toLowerCase();
    if (phone !== undefined) addressToUpdate.phone = phone.trim();
    if (street !== undefined) addressToUpdate.street = street.trim();
    if (apartment !== undefined) addressToUpdate.apartment = apartment ? apartment.trim() : '';
    if (city !== undefined) addressToUpdate.city = city.trim();
    if (state !== undefined) addressToUpdate.state = state.trim();
    if (pinCode !== undefined) addressToUpdate.pinCode = pinCode.trim();
    if (country !== undefined) addressToUpdate.country = country;
    if (isDefault !== undefined) addressToUpdate.isDefault = isDefault;

    await user.save();

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: { address: user.addresses[addressIndex] },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Delete address
 * @route DELETE /api/users/me/addresses/:addressId
 */
export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);
    
    // If deleted address was default, set first remaining address as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }
    
    await user.save();

    res.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Set default address
 * @route PATCH /api/users/me/addresses/:addressId/default
 */
export const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    // Unset all other defaults
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });

    // Set this address as default
    user.addresses[addressIndex].isDefault = true;
    await user.save();

    res.json({
      success: true,
      message: 'Default address updated successfully',
      data: { address: user.addresses[addressIndex] },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

