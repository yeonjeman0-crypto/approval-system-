import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Button,
  Progress,
  List,
  Avatar,
  Typography,
  Space,
  Alert,
} from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ShipOutlined,
  TeamOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentApprovals, setRecentApprovals] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // API 호출들을 병렬로 실행
      const [statsRes, recentRes, pendingRes] = await Promise.all([
        axios.get('/approvals/stats'),
        axios.get('/approvals?limit=5&sort=created_at&order=DESC'),
        axios.get('/approvals?status=PENDING&limit=5'),
      ]);

      setStats(statsRes.data);
      setRecentApprovals(recentRes.data.approvals || []);
      setPendingApprovals(pendingRes.data.approvals || []);
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 결재 상태에 따른 색상과 아이콘
  const getStatusConfig = (status) => {
    const configs = {
      'PENDING': { color: 'orange', icon: <ClockCircleOutlined />, text: '대기중' },
      'IN_PROGRESS': { color: 'blue', icon: <ClockCircleOutlined />, text: '진행중' },
      'APPROVED': { color: 'green', icon: <CheckCircleOutlined />, text: '승인됨' },
      'REJECTED': { color: 'red', icon: <ExclamationCircleOutlined />, text: '반려됨' },
    };
    return configs[status] || configs['PENDING'];
  };

  // 최근 결재 테이블 컬럼
  const recentColumns = [
    {
      title: '결재번호',
      dataIndex: 'approval_code',
      key: 'approval_code',
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/approvals/${record.approval_id}`)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const config = getStatusConfig(status);
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '신청일',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('ko-KR'),
    },
  ];

  return (
    <div style={{ padding: '0' }}>
      {/* 환영 메시지 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, color: '#262626' }}>
          <ShipOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          환영합니다, {user?.full_name}님! ⚓
        </Title>
        <Text type="secondary">
          해운 결재시스템 대시보드입니다. 오늘도 안전한 항해 되세요.
        </Text>
      </div>

      {/* 통계 카드들 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="전체 결재"
              value={stats.total || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="대기중인 결재"
              value={stats.pending || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="이번달 승인"
              value={stats.approved_this_month || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="총 결재금액"
              value={stats.total_amount || 0}
              prefix={<DollarOutlined />}
              suffix="USD"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 최근 결재 현황 */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                최근 결재 현황
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/approvals')}>
                전체보기
              </Button>
            }
            loading={loading}
          >
            <Table
              dataSource={recentApprovals}
              columns={recentColumns}
              pagination={false}
              size="small"
              rowKey="approval_id"
            />
          </Card>
        </Col>

        {/* 내가 처리할 결재 */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <TeamOutlined />
                내가 처리할 결재
              </Space>
            }
            loading={loading}
          >
            {pendingApprovals.length === 0 ? (
              <Alert
                message="처리할 결재가 없습니다"
                description="현재 승인 대기중인 결재가 없습니다."
                type="info"
                showIcon
              />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={pendingApprovals}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        size="small"
                        onClick={() => navigate(`/approvals/${item.approval_id}`)}
                      >
                        처리
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size="small"
                          icon={<FileTextOutlined />}
                          style={{ backgroundColor: '#1890ff' }}
                        />
                      }
                      title={
                        <Text ellipsis style={{ width: '150px' }}>
                          {item.title}
                        </Text>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {item.approval_code}
                          </Text>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {new Date(item.created_at).toLocaleDateString('ko-KR')}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* 결재 유형별 통계 */}
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col xs={24}>
          <Card
            title={
              <Space>
                <ShipOutlined />
                결재 유형별 현황
              </Space>
            }
            loading={loading}
          >
            <Row gutter={[16, 16]}>
              {stats.by_type && stats.by_type.map((item, index) => (
                <Col xs={24} sm={12} lg={4} key={index}>
                  <Card size="small">
                    <Statistic
                      title={item.type_name}
                      value={item.count}
                      valueStyle={{ 
                        color: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'][index % 6] 
                      }}
                    />
                    <Progress
                      percent={Math.round((item.count / stats.total) * 100)}
                      size="small"
                      strokeColor={['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'][index % 6]}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;