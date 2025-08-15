const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const approvalRoutes = require('./routes/approvals');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const attachmentRoutes = require('./routes/attachments');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// 미들웨어
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Socket.IO 설정
io.on('connection', (socket) => {
  console.log('사용자 연결:', socket.id);
  
  // 사용자별 방 참여
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`사용자 ${userId}가 알림방에 참여`);
  });

  // 결재 문서별 방 참여  
  socket.on('join_approval_room', (approvalId) => {
    socket.join(`approval_${approvalId}`);
    console.log(`결재문서 ${approvalId} 방에 참여`);
  });

  socket.on('disconnect', () => {
    console.log('사용자 연결 해제:', socket.id);
  });
});

// Socket.IO를 전역에서 사용할 수 있도록 설정
app.set('io', io);

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/attachments', attachmentRoutes);

// 헬스 체크
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Vision SMS 결재시스템 API 서버가 정상 동작 중입니다.',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 에러 처리
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'API 엔드포인트를 찾을 수 없습니다.',
    path: req.originalUrl 
  });
});

// 전역 에러 처리
app.use((err, req, res, next) => {
  console.error('서버 에러:', err);
  res.status(500).json({ 
    error: '서버 내부 오류가 발생했습니다.',
    message: process.env.NODE_ENV === 'development' ? err.message : '관리자에게 문의하세요.'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Vision SMS 결재시스템 API 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📊 개발 모드: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS 허용 주소: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});