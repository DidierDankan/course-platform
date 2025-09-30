import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "15m" } // short-lived
    );
};

export const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" } // long-lived
    );
};