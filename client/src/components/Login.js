import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, ShipOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await login(values.username, values.password);
      
      if (result.success) {
        message.success('로그인에 성공했습니다!');
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 테스트 계정 로그인
  const quickLogin = (username, password) => {
    onFinish({ username, password });
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="ocean-wave"></div>
        <div className="ocean-wave wave2"></div>
      </div>
      
      <Card className="login-card" title={
        <div className="login-header">
          <ShipOutlined className="login-icon" />
          <h2>해운 결재시스템</h2>
          <p>Maritime Approval System</p>
        </div>
      }>
        <Spin spinning={loading}>
          <Form
            name="login"
            className="login-form"
            onFinish={onFinish}
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="username"
              rules={[
                {
                  required: true,
                  message: '사용자명을 입력해주세요!',
                },
              ]}
            >
              <Input
                prefix={<UserOutlined className="site-form-item-icon" />}
                placeholder="사용자명"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: '비밀번호를 입력해주세요!',
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="비밀번호"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                className="login-form-button"
                loading={loading}
              >
                로그인
              </Button>
            </Form.Item>
          </Form>

          <div className="demo-accounts">
            <h4>테스트 계정</h4>
            <div className="demo-buttons">
              <Button 
                size="small" 
                onClick={() => quickLogin('captain_kim', 'password123')}
                disabled={loading}
              >
                김선장
              </Button>
              <Button 
                size="small" 
                onClick={() => quickLogin('chief_lee', 'password123')}
                disabled={loading}
              >
                이기관장
              </Button>
              <Button 
                size="small" 
                onClick={() => quickLogin('mgr_ops', 'password123')}
                disabled={loading}
              >
                이운영부장
              </Button>
              <Button 
                size="small" 
                onClick={() => quickLogin('co_park', 'password123')}
                disabled={loading}
              >
                박일항사
              </Button>
            </div>
            <p className="demo-note">
              * 모든 테스트 계정의 비밀번호는 'password123' 입니다.
            </p>
          </div>
        </Spin>
      </Card>
    </div>
  );
};

export default Login;