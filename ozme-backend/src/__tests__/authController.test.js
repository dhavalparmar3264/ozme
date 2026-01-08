import { register, login } from '../controllers/authController.js';
import User from '../models/User.js';

// Mock dependencies
jest.mock('../models/User.js');
jest.mock('../utils/generateToken.js', () => ({
  generateToken: jest.fn(() => 'mock-token'),
}));

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      User.findOne = jest.fn().mockResolvedValue(null);
      User.create = jest.fn().mockResolvedValue({
        _id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User registered successfully',
        })
      );
    });

    it('should return error if user already exists', async () => {
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      User.findOne = jest.fn().mockResolvedValue({ email: 'test@example.com' });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User already exists',
        })
      );
    });
  });
});

