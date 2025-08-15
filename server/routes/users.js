const express = require('express');
const { User } = require('../models');
const { authenticateToken } = require('./auth');

const router = express.Router();

// 사용자 목록 조회 (승인자 선택용)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { department, min_rank_level } = req.query;
    
    const where = { status: 'ACTIVE' };
    
    if (department) where.department = department;
    if (min_rank_level) where.rank_level = { [Op.gte]: parseInt(min_rank_level) };
    
    const users = await User.findAll({
      where,
      attributes: ['user_id', 'username', 'full_name', 'email', 'department', 'position', 'rank_level'],
      order: [['rank_level', 'DESC'], ['full_name', 'ASC']]
    });

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('사용자 목록 조회 에러:', error);
    res.status(500).json({ error: '사용자 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 부서 목록 조회
router.get('/departments', authenticateToken, async (req, res) => {
  try {
    const departments = await User.findAll({
      attributes: ['department'],
      where: { 
        status: 'ACTIVE',
        department: { [Op.not]: null }
      },
      group: ['department'],
      order: [['department', 'ASC']]
    });

    const departmentList = departments.map(d => d.department);

    res.json({
      success: true,
      data: departmentList
    });

  } catch (error) {
    console.error('부서 목록 조회 에러:', error);
    res.status(500).json({ error: '부서 목록 조회 중 오류가 발생했습니다.' });
  }
});

module.exports = router;