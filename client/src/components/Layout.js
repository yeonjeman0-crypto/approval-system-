import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Badge, Button, Space } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  PlusOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShipOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const { Header, Sider, Content } = AntLayout;

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '내 프로필',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '로그아웃',
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">대시보드</Link>,
    },
    {
      key: '/approvals',
      icon: <FileTextOutlined />,
      label: <Link to="/approvals">결재 관리</Link>,
    },
    {
      key: '/create',
      icon: <PlusOutlined />,
      label: <Link to="/create">결재 생성</Link>,
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: '#001529',
        }}
      >
        <div style={{
          height: '64px',
          margin: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          color: 'white',
          fontSize: '20px',
          fontWeight: 'bold',
        }}>
          <ShipOutlined style={{ marginRight: collapsed ? 0 : 8, fontSize: '24px', color: '#1890ff' }} />
          {!collapsed && '해운결재'}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['/']}
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>

      <AntLayout>
        <Header style={{
          padding: '0 16px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
        }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
          </Space>

          <Space size="large">
            {/* 연결 상태 표시 */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              fontSize: '12px',
              color: isConnected ? '#52c41a' : '#ff4d4f'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#52c41a' : '#ff4d4f',
                marginRight: '4px',
              }} />
              {isConnected ? '실시간 연결' : '연결 끊김'}
            </div>

            {/* 알림 */}
            <Badge count={0} size="small">
              <Button
                type="text"
                shape="circle"
                icon={<BellOutlined style={{ fontSize: '18px' }} />}
              />
            </Badge>

            {/* 사용자 정보 */}
            <Dropdown
              menu={{ items: userMenu }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                />
                <span style={{ color: '#262626', fontWeight: '500' }}>
                  {user?.full_name || '사용자'}
                </span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{
          margin: '16px',
          padding: '24px',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;