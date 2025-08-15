import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { message, notification } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // 소켓 연결
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          userId: user.user_id
        }
      });

      newSocket.on('connect', () => {
        console.log('소켓 연결됨:', newSocket.id);
        setIsConnected(true);
        
        // 사용자 방에 참여
        newSocket.emit('join_user_room', user.user_id);
      });

      newSocket.on('disconnect', () => {
        console.log('소켓 연결 해제');
        setIsConnected(false);
      });

      // 새로운 결재 요청 알림
      newSocket.on('new_notification', (data) => {
        console.log('새 알림:', data);
        
        notification.info({
          message: '새로운 알림',
          description: data.title,
          icon: <BellOutlined style={{ color: '#1890ff' }} />,
          placement: 'topRight',
          duration: 4,
          onClick: () => {
            // 결재 상세 페이지로 이동
            if (data.approval_id) {
              window.location.href = `/approvals/${data.approval_id}`;
            }
          }
        });
      });

      // 결재 상태 업데이트 알림
      newSocket.on('approval_updated', (data) => {
        console.log('결재 상태 업데이트:', data);
        
        const statusText = data.status === 'APPROVED' ? '승인' : 
                          data.status === 'REJECTED' ? '반려' : '처리';
        
        message.success(`${data.processed_by}님이 결재를 ${statusText}했습니다.`);
      });

      // 에러 처리
      newSocket.on('error', (error) => {
        console.error('소켓 에러:', error);
        message.error('실시간 연결에 문제가 발생했습니다.');
      });

      setSocket(newSocket);

      // 컴포넌트 언마운트 시 소켓 연결 해제
      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  // 결재 문서 방에 참여
  const joinApprovalRoom = (approvalId) => {
    if (socket) {
      socket.emit('join_approval_room', approvalId);
    }
  };

  // 결재 문서 방에서 나가기
  const leaveApprovalRoom = (approvalId) => {
    if (socket) {
      socket.emit('leave_approval_room', approvalId);
    }
  };

  const value = {
    socket,
    isConnected,
    joinApprovalRoom,
    leaveApprovalRoom
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};