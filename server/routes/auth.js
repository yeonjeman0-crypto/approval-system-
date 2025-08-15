const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const router = express.Router();

// JWT 시크릿 키
const JWT_SECRET = process.env.JWT_SECRET || 'vision-sms-secret-key-2025';

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        error: '사용자명과 비밀번호를 입력해주세요.' 
      });
    }

    // 사용자 조회 (비밀번호 포함)
    const user = await User.scope('withPassword').findOne({
      where: { username, status: 'ACTIVE' }
    });

    if (!user) {
      return res.status(401).json({ 
        error: '사용자를 찾을 수 없거나 계정이 비활성화되어 있습니다.' 
      });
    }

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: '비밀번호가 올바르지 않습니다.' 
      });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        user_id: user.user_id,
        username: user.username,
        rank_level: user.rank_level 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 사용자 정보 (비밀번호 제외)
    const userInfo = {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      department: user.department,
      position: user.position,
      rank_level: user.rank_level
    };

    res.json({
      success: true,
      message: '로그인에 성공했습니다.',
      token,
      user: userInfo
    });

  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({ 
      error: '로그인 처리 중 오류가 발생했습니다.' 
    });
  }
});

// 토큰 검증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: '액세스 토큰이 필요합니다.' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: '토큰이 유효하지 않습니다.' 
      });
    }
    req.user = user;
    next();
  });
};

// 현재 사용자 정보 조회
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id);
    
    if (!user) {
      return res.status(404).json({ 
        error: '사용자를 찾을 수 없습니다.' 
      });
    }

    res.json({
      success: true,
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        department: user.department,
        position: user.position,
        rank_level: user.rank_level
      }
    });

  } catch (error) {
    console.error('사용자 정보 조회 에러:', error);
    res.status(500).json({ 
      error: '사용자 정보 조회 중 오류가 발생했습니다.' 
    });
  }
});

// 로그아웃 (클라이언트에서 토큰 삭제)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: '로그아웃되었습니다.'
  });
});

// 비밀번호 변경
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ 
        error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' 
      });
    }

    // 사용자 조회 (비밀번호 포함)
    const user = await User.scope('withPassword').findByPk(req.user.user_id);

    // 현재 비밀번호 확인
    const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ 
        error: '현재 비밀번호가 올바르지 않습니다.' 
      });
    }

    // 새 비밀번호 해시화
    const salt = await bcrypt.genSalt(10);
    const new_password_hash = await bcrypt.hash(new_password, salt);

    // 비밀번호 업데이트
    await user.update({ password_hash: new_password_hash });

    res.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    });

  } catch (error) {
    console.error('비밀번호 변경 에러:', error);
    res.status(500).json({ 
      error: '비밀번호 변경 중 오류가 발생했습니다.' 
    });
  }
});

module.exports = { router, authenticateToken };