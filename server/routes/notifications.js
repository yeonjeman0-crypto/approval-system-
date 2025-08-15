const express = require('express');
const { Op } = require('sequelize');
const { Notification, Approval, User } = require('../models');
const { authenticateToken } = require('./auth');

const router = express.Router();

// 알림 목록 조회
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, is_read } = req.query;
    const offset = (page - 1) * limit;
    
    const where = { user_id: req.user.user_id };
    if (is_read !== undefined) where.is_read = is_read === 'true';

    const { count, rows } = await Notification.findAndCountAll({
      where,
      include: [
        { 
          model: Approval, 
          as: 'approval',
          attributes: ['approval_id', 'approval_code', 'title', 'status'],
          include: [
            { model: User, as: 'requester', attributes: ['full_name', 'position'] }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('알림 목록 조회 에러:', error);
    res.status(500).json({ error: '알림 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 알림 읽음 처리
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        notification_id: req.params.id,
        user_id: req.user.user_id
      }
    });

    if (!notification) {
      return res.status(404).json({ error: '알림을 찾을 수 없습니다.' });
    }

    await notification.update({ is_read: true });

    res.json({
      success: true,
      message: '알림이 읽음 처리되었습니다.'
    });

  } catch (error) {
    console.error('알림 읽음 처리 에러:', error);
    res.status(500).json({ error: '알림 읽음 처리 중 오류가 발생했습니다.' });
  }
});

// 모든 알림 읽음 처리
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      { 
        where: { 
          user_id: req.user.user_id,
          is_read: false 
        } 
      }
    );

    res.json({
      success: true,
      message: '모든 알림이 읽음 처리되었습니다.'
    });

  } catch (error) {
    console.error('전체 알림 읽음 처리 에러:', error);
    res.status(500).json({ error: '전체 알림 읽음 처리 중 오류가 발생했습니다.' });
  }
});

// 읽지 않은 알림 개수 조회
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.count({
      where: {
        user_id: req.user.user_id,
        is_read: false
      }
    });

    res.json({
      success: true,
      data: { count }
    });

  } catch (error) {
    console.error('읽지 않은 알림 개수 조회 에러:', error);
    res.status(500).json({ error: '읽지 않은 알림 개수 조회 중 오류가 발생했습니다.' });
  }
});

module.exports = router;