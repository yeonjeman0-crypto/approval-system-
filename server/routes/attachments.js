const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Attachment } = require('../models');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 한글 파일명 처리
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, basename + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // 허용할 파일 타입
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('허용되지 않는 파일 형식입니다.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  }
});

// 파일 업로드 (결재에 첨부)
router.post('/upload/:approvalId', authenticateToken, upload.array('files', 5), async (req, res) => {
  try {
    const { approvalId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: '업로드할 파일이 없습니다.' });
    }

    const attachments = [];

    for (const file of files) {
      const attachment = await Attachment.create({
        approval_id: approvalId,
        file_name: file.originalname,
        file_path: file.filename,
        file_size: file.size,
        file_type: file.mimetype,
        uploaded_by: req.user.user_id
      });

      attachments.push(attachment);
    }

    res.json({
      success: true,
      message: `${files.length}개의 파일이 업로드되었습니다.`,
      attachments
    });

  } catch (error) {
    console.error('파일 업로드 에러:', error);
    res.status(500).json({ error: '파일 업로드에 실패했습니다.' });
  }
});

// 결재의 첨부파일 목록 조회
router.get('/approval/:approvalId', authenticateToken, async (req, res) => {
  try {
    const { approvalId } = req.params;

    const attachments = await Attachment.findAll({
      where: { approval_id: approvalId },
      include: [{
        model: require('../models').User,
        as: 'uploader',
        attributes: ['user_id', 'full_name']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json(attachments);

  } catch (error) {
    console.error('첨부파일 목록 조회 에러:', error);
    res.status(500).json({ error: '첨부파일 목록을 불러오는데 실패했습니다.' });
  }
});

// 파일 다운로드
router.get('/download/:attachmentId', authenticateToken, async (req, res) => {
  try {
    const { attachmentId } = req.params;

    const attachment = await Attachment.findByPk(attachmentId);
    
    if (!attachment) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }

    const filePath = path.join(uploadDir, attachment.file_path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '파일이 존재하지 않습니다.' });
    }

    // 한글 파일명 처리
    const encodedFileName = encodeURIComponent(attachment.file_name);
    
    res.setHeader('Content-Disposition', `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`);
    res.setHeader('Content-Type', attachment.file_type);
    
    res.download(filePath, attachment.file_name);

  } catch (error) {
    console.error('파일 다운로드 에러:', error);
    res.status(500).json({ error: '파일 다운로드에 실패했습니다.' });
  }
});

// 파일 삭제
router.delete('/:attachmentId', authenticateToken, async (req, res) => {
  try {
    const { attachmentId } = req.params;

    const attachment = await Attachment.findByPk(attachmentId);
    
    if (!attachment) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }

    // 파일 업로드자 또는 관리자만 삭제 가능
    if (attachment.uploaded_by !== req.user.user_id && req.user.rank_level < 8) {
      return res.status(403).json({ error: '파일을 삭제할 권한이 없습니다.' });
    }

    // 실제 파일 삭제
    const filePath = path.join(uploadDir, attachment.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // DB에서 삭제
    await attachment.destroy();

    res.json({
      success: true,
      message: '파일이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('파일 삭제 에러:', error);
    res.status(500).json({ error: '파일 삭제에 실패했습니다.' });
  }
});

// 파일 정보 조회
router.get('/:attachmentId', authenticateToken, async (req, res) => {
  try {
    const { attachmentId } = req.params;

    const attachment = await Attachment.findByPk(attachmentId, {
      include: [{
        model: require('../models').User,
        as: 'uploader',
        attributes: ['user_id', 'full_name']
      }]
    });
    
    if (!attachment) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }

    res.json(attachment);

  } catch (error) {
    console.error('파일 정보 조회 에러:', error);
    res.status(500).json({ error: '파일 정보를 불러오는데 실패했습니다.' });
  }
});

module.exports = router;