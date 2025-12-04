import Coupon from '../models/Coupon.js';

/**
 * @desc    Get all coupons (Admin)
 * @route   GET /api/admin/coupons
 * @access  Private/Admin
 */
export const getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: coupons.length,
            data: coupons,
        });
    } catch (error) {
        console.error('Get coupons error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch coupons',
            error: error.message,
        });
    }
};

/**
 * @desc    Get single coupon by ID (Admin)
 * @route   GET /api/admin/coupons/:id
 * @access  Private/Admin
 */
export const getCouponById = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found',
            });
        }

        res.status(200).json({
            success: true,
            data: coupon,
        });
    } catch (error) {
        console.error('Get coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch coupon',
            error: error.message,
        });
    }
};

/**
 * @desc    Create new coupon (Admin)
 * @route   POST /api/admin/coupons
 * @access  Private/Admin
 */
export const createCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Coupon created successfully',
            data: coupon,
        });
    } catch (error) {
        console.error('Create coupon error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create coupon',
            error: error.message,
        });
    }
};

/**
 * @desc    Update coupon (Admin)
 * @route   PUT /api/admin/coupons/:id
 * @access  Private/Admin
 */
export const updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Coupon updated successfully',
            data: coupon,
        });
    } catch (error) {
        console.error('Update coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update coupon',
            error: error.message,
        });
    }
};

/**
 * @desc    Delete coupon (Admin)
 * @route   DELETE /api/admin/coupons/:id
 * @access  Private/Admin
 */
export const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Coupon deleted successfully',
        });
    } catch (error) {
        console.error('Delete coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete coupon',
            error: error.message,
        });
    }
};

/**
 * @desc    Validate and apply coupon (User)
 * @route   POST /api/coupons/validate
 * @access  Private
 */
export const validateCoupon = async (req, res) => {
    try {
        const { code, orderAmount } = req.body;

        if (!code || !orderAmount) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code and order amount are required',
            });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Invalid coupon code',
            });
        }

        // Check if coupon is available
        if (!coupon.isAvailable) {
            if (coupon.isExpired) {
                return res.status(400).json({
                    success: false,
                    message: 'This coupon has expired',
                });
            }
            if (coupon.status !== 'Active') {
                return res.status(400).json({
                    success: false,
                    message: 'This coupon is not active',
                });
            }
            if (coupon.usedCount >= coupon.usageLimit) {
                return res.status(400).json({
                    success: false,
                    message: 'This coupon has reached its usage limit',
                });
            }
        }

        // Check minimum order amount
        if (orderAmount < coupon.minOrder) {
            return res.status(400).json({
                success: false,
                message: `Minimum order amount of ₹${coupon.minOrder} required for this coupon`,
            });
        }

        // Check per user limit
        if (req.user && !coupon.canUserUse(req.user.id)) {
            return res.status(400).json({
                success: false,
                message: 'You have already used this coupon the maximum number of times',
            });
        }

        // Calculate discount
        const discountAmount = coupon.calculateDiscount(orderAmount);

        res.status(200).json({
            success: true,
            message: 'Coupon is valid',
            data: {
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                discountAmount,
                minOrder: coupon.minOrder,
                description: coupon.description,
            },
        });
    } catch (error) {
        console.error('Validate coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate coupon',
            error: error.message,
        });
    }
};
