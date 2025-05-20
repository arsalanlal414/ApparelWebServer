import Payment from "../models/Payment.js";

export const getPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const payments = await Payment.find().populate('user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Payments retrieved successfully',
      payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve payments', error: error.message });
  }
};