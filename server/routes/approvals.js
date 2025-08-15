const express = require('express');
const { Op } = require('sequelize');
const { Approval, ApprovalType, ApprovalStep, User, Attachment, Notification } = require('../models');
const { authenticateToken } = require('./auth');

const router = express.Router();

// 결재 문서 목록 조회
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      status, 
      type_id, 
      page = 1, 
      limit = 20,
      my_requests = false,
      pending_for_me = false 
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};
    
    // 필터 조건
    if (status) where.status = status;
    if (type_id) where.type_id = type_id;
    if (my_requests === 'true') where.requester_id = req.user.user_id;

    let include = [
      { model: ApprovalType, as: 'type' },
      { model: User, as: 'requester', attributes: ['user_id', 'full_name', 'position'] },
      { 
        model: ApprovalStep, 
        as: 'steps',
        include: [{ model: User, as: 'approver', attributes: ['user_id', 'full_name', 'position'] }]
      }
    ];

    // 내가 승인해야 할 문서들
    if (pending_for_me === 'true') {
      include.push({
        model: ApprovalStep,
        as: 'steps',
        where: {
          approver_id: req.user.user_id,
          is_current: true,
          action: null
        },
        required: true
      });
      where.status = 'PENDING';
    }

    const { count, rows } = await Approval.findAndCountAll({
      where,
      include,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
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
    console.error('결재 목록 조회 에러:', error);
    res.status(500).json({ error: '결재 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 결재 문서 상세 조회
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const approval = await Approval.findByPk(req.params.id, {
      include: [
        { model: ApprovalType, as: 'type' },
        { model: User, as: 'requester', attributes: ['user_id', 'full_name', 'position', 'department'] },
        { 
          model: ApprovalStep, 
          as: 'steps',
          include: [{ model: User, as: 'approver', attributes: ['user_id', 'full_name', 'position'] }],
          order: [['step_number', 'ASC']]
        },
        { 
          model: Attachment, 
          as: 'attachments',
          include: [{ model: User, as: 'uploader', attributes: ['user_id', 'full_name'] }]
        }
      ]
    });

    if (!approval) {
      return res.status(404).json({ error: '결재 문서를 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      data: approval
    });

  } catch (error) {
    console.error('결재 상세 조회 에러:', error);
    res.status(500).json({ error: '결재 상세 조회 중 오류가 발생했습니다.' });
  }
});

// 결재 문서 생성
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      type_id,
      title,
      content,
      amount,
      currency = 'USD',
      priority = 'NORMAL',
      due_date,
      form_data
    } = req.body;

    // 결재 종류 조회
    const approvalType = await ApprovalType.findByPk(type_id);
    if (!approvalType) {
      return res.status(400).json({ error: '유효하지 않은 결재 종류입니다.' });
    }

    // 결재 문서 번호 생성 (예: PO-20250115-001)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Approval.count({
      where: {
        approval_code: { [Op.like]: `${approvalType.type_code}-${today}-%` }
      }
    });
    const approval_code = `${approvalType.type_code}-${today}-${String(count + 1).padStart(3, '0')}`;

    // 승인 라인 설정
    const approvalFlow = approvalType.approval_flow;
    const total_steps = approvalFlow.steps.length;

    // 결재 문서 생성
    const approval = await Approval.create({
      approval_code,
      type_id,
      title,
      content,
      amount,
      currency,
      priority,
      due_date,
      form_data,
      requester_id: req.user.user_id,
      total_steps,
      current_step: 1
    });

    // 승인 단계 생성
    for (let i = 0; i < approvalFlow.steps.length; i++) {
      const step = approvalFlow.steps[i];
      
      // 해당 레벨의 승인자 찾기
      const approver = await User.findOne({
        where: { rank_level: { [Op.gte]: step.level }, status: 'ACTIVE' },
        order: [['rank_level', 'ASC']]
      });

      await ApprovalStep.create({
        approval_id: approval.approval_id,
        step_number: i + 1,
        approver_id: approver ? approver.user_id : null,
        is_current: i === 0 // 첫 번째 단계는 현재 단계
      });
    }

    // 첫 번째 승인자에게 알림 발송
    const firstStep = await ApprovalStep.findOne({
      where: { approval_id: approval.approval_id, step_number: 1 },
      include: [{ model: User, as: 'approver' }]
    });

    if (firstStep && firstStep.approver) {
      await Notification.create({
        user_id: firstStep.approver.user_id,
        approval_id: approval.approval_id,
        type: 'NEW_REQUEST',
        title: `새로운 결재 요청: ${title}`,
        message: `${req.user.username}님이 새로운 결재를 요청했습니다.`
      });

      // 실시간 알림 전송
      const io = req.app.get('io');
      io.to(`user_${firstStep.approver.user_id}`).emit('new_notification', {
        type: 'NEW_REQUEST',
        title: `새로운 결재 요청: ${title}`,
        approval_id: approval.approval_id,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: '결재 문서가 성공적으로 생성되었습니다.',
      data: { approval_id: approval.approval_id, approval_code }
    });

  } catch (error) {
    console.error('결재 생성 에러:', error);
    res.status(500).json({ error: '결재 생성 중 오류가 발생했습니다.' });
  }
});

// 결재 승인/반려 처리
router.post('/:id/process', authenticateToken, async (req, res) => {
  try {
    const { action, comment } = req.body; // action: 'APPROVE' or 'REJECT'
    const approval_id = req.params.id;

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ error: '유효하지 않은 처리 액션입니다.' });
    }

    // 현재 승인 단계 조회
    const currentStep = await ApprovalStep.findOne({
      where: {
        approval_id,
        approver_id: req.user.user_id,
        is_current: true,
        action: null
      },
      include: [
        { model: Approval, as: 'approval' },
        { model: User, as: 'approver' }
      ]
    });

    if (!currentStep) {
      return res.status(403).json({ 
        error: '승인 권한이 없거나 이미 처리된 결재입니다.' 
      });
    }

    const approval = currentStep.approval;

    // 승인 단계 업데이트
    await currentStep.update({
      action,
      comment,
      processed_at: new Date(),
      is_current: false
    });

    let newStatus = approval.status;
    let nextStep = null;

    if (action === 'REJECT') {
      // 반려 처리
      newStatus = 'REJECTED';
      await approval.update({ 
        status: newStatus, 
        completed_at: new Date() 
      });
    } else if (action === 'APPROVE') {
      // 승인 처리
      if (currentStep.step_number === approval.total_steps) {
        // 최종 승인
        newStatus = 'APPROVED';
        await approval.update({ 
          status: newStatus, 
          completed_at: new Date() 
        });
      } else {
        // 다음 단계로 진행
        nextStep = await ApprovalStep.findOne({
          where: {
            approval_id,
            step_number: currentStep.step_number + 1
          },
          include: [{ model: User, as: 'approver' }]
        });

        if (nextStep) {
          await nextStep.update({ is_current: true });
          await approval.update({ current_step: nextStep.step_number });
        }
      }
    }

    // 요청자에게 알림
    await Notification.create({
      user_id: approval.requester_id,
      approval_id: approval.approval_id,
      type: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      title: `결재 ${action === 'APPROVE' ? '승인' : '반려'}: ${approval.title}`,
      message: `${currentStep.approver.full_name}님이 결재를 ${action === 'APPROVE' ? '승인' : '반려'}했습니다.`
    });

    // 다음 승인자에게 알림 (승인인 경우)
    if (action === 'APPROVE' && nextStep && nextStep.approver) {
      await Notification.create({
        user_id: nextStep.approver.user_id,
        approval_id: approval.approval_id,
        type: 'NEW_REQUEST',
        title: `결재 요청: ${approval.title}`,
        message: `새로운 결재 승인 요청이 있습니다.`
      });

      // 실시간 알림 전송
      const io = req.app.get('io');
      io.to(`user_${nextStep.approver.user_id}`).emit('new_notification', {
        type: 'NEW_REQUEST',
        title: `결재 요청: ${approval.title}`,
        approval_id: approval.approval_id,
        timestamp: new Date()
      });
    }

    // 실시간 상태 업데이트
    const io = req.app.get('io');
    io.to(`approval_${approval_id}`).emit('approval_updated', {
      approval_id,
      status: newStatus,
      current_step: approval.current_step,
      processed_by: currentStep.approver.full_name,
      action,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: `결재가 성공적으로 ${action === 'APPROVE' ? '승인' : '반려'}되었습니다.`,
      data: {
        status: newStatus,
        current_step: approval.current_step,
        is_completed: ['APPROVED', 'REJECTED'].includes(newStatus)
      }
    });

  } catch (error) {
    console.error('결재 처리 에러:', error);
    res.status(500).json({ error: '결재 처리 중 오류가 발생했습니다.' });
  }
});

// 결재 종류 목록 조회
router.get('/types/list', authenticateToken, async (req, res) => {
  try {
    const types = await ApprovalType.findAll({
      where: { is_active: true },
      attributes: ['type_id', 'type_code', 'type_name', 'description', 'required_fields'],
      order: [['type_name', 'ASC']]
    });

    res.json({
      success: true,
      data: types
    });

  } catch (error) {
    console.error('결재 종류 조회 에러:', error);
    res.status(500).json({ error: '결재 종류 조회 중 오류가 발생했습니다.' });
  }
});

// 통계 조회
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const stats = await Promise.all([
      // 대기 중인 결재 (내가 승인해야 할)
      ApprovalStep.count({
        where: {
          approver_id: req.user.user_id,
          is_current: true,
          action: null
        },
        include: [{
          model: Approval,
          as: 'approval',
          where: { status: 'PENDING' }
        }]
      }),
      
      // 내가 요청한 결재
      Approval.count({
        where: { requester_id: req.user.user_id }
      }),
      
      // 이번 달 처리한 결재
      ApprovalStep.count({
        where: {
          approver_id: req.user.user_id,
          action: { [Op.not]: null },
          processed_at: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      
      // 전체 대기 중인 결재
      Approval.count({
        where: { status: 'PENDING' }
      })
    ]);

    res.json({
      success: true,
      data: {
        pending_for_me: stats[0],
        my_requests: stats[1],
        processed_this_month: stats[2],
        total_pending: stats[3]
      }
    });

  } catch (error) {
    console.error('통계 조회 에러:', error);
    res.status(500).json({ error: '통계 조회 중 오류가 발생했습니다.' });
  }
});

module.exports = router;