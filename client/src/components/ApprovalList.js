import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Typography,
  Tooltip,
  Modal,
  message,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
  ReloadOutlined,
  PlusOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ApprovalList = () => {
  const [loading, setLoading] = useState(false);
  const [approvals, setApprovals] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type_id: '',
    date_range: null,
  });
  const [approvalTypes, setApprovalTypes] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadApprovalTypes();
    loadApprovals();
  }, []);

  useEffect(() => {
    loadApprovals();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadApprovalTypes = async () => {
    try {
      const response = await axios.get('/approvals/types');
      setApprovalTypes(response.data);
    } catch (error) {
      console.error('결재 유형 로드 실패:', error);
    }
  };

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
      };

      if (filters.date_range && filters.date_range.length === 2) {
        params.start_date = filters.date_range[0].format('YYYY-MM-DD');
        params.end_date = filters.date_range[1].format('YYYY-MM-DD');
      }

      const response = await axios.get('/approvals', { params });
      
      setApprovals(response.data.approvals || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
      }));
    } catch (error) {
      console.error('결재 목록 로드 실패:', error);
      message.error('결재 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize,
    }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadApprovals();
  };

  const handleReset = () => {
    setFilters({
      search: '',
      status: '',
      type_id: '',
      date_range: null,
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleDelete = async (approval_id) => {
    Modal.confirm({
      title: '결재 삭제',
      content: '정말로 이 결재를 삭제하시겠습니까?',
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      onOk: async () => {
        try {
          await axios.delete(`/approvals/${approval_id}`);
          message.success('결재가 삭제되었습니다.');
          loadApprovals();
        } catch (error) {
          console.error('결재 삭제 실패:', error);
          message.error('결재 삭제에 실패했습니다.');
        }
      },
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      'PENDING': { color: 'orange', icon: <ClockCircleOutlined />, text: '대기중' },
      'IN_PROGRESS': { color: 'blue', icon: <ClockCircleOutlined />, text: '진행중' },
      'APPROVED': { color: 'green', icon: <CheckCircleOutlined />, text: '승인됨' },
      'REJECTED': { color: 'red', icon: <ExclamationCircleOutlined />, text: '반려됨' },
    };
    return configs[status] || configs['PENDING'];
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      'HIGH': { color: 'red', text: '긴급' },
      'NORMAL': { color: 'default', text: '보통' },
      'LOW': { color: 'green', text: '낮음' },
    };
    return configs[priority] || configs['NORMAL'];
  };

  const columns = [
    {
      title: '결재번호',
      dataIndex: 'approval_code',
      key: 'approval_code',
      width: 120,
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
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      ),
    },
    {
      title: '유형',
      dataIndex: 'type_name',
      key: 'type_name',
      width: 100,
      render: (text) => (
        <Tag color="blue">{text}</Tag>
      ),
    },
    {
      title: '신청자',
      dataIndex: 'requester_name',
      key: 'requester_name',
      width: 100,
    },
    {
      title: '금액',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount, record) => {
        if (!amount) return '-';
        return (
          <span>
            ${amount.toLocaleString()} {record.currency}
          </span>
        );
      },
    },
    {
      title: '우선순위',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority) => {
        const config = getPriorityConfig(priority);
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
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
      width: 100,
      render: (date) => dayjs(date).format('MM/DD'),
    },
    {
      title: '작업',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="상세보기">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/approvals/${record.approval_id}`)}
            />
          </Tooltip>
          {record.requester_id === user?.user_id && record.status === 'PENDING' && (
            <>
              <Tooltip title="수정">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/approvals/${record.approval_id}/edit`)}
                />
              </Tooltip>
              <Tooltip title="삭제">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record.approval_id)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 페이지 헤더 */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          결재 관리
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/create')}
        >
          새 결재
        </Button>
      </div>

      {/* 필터 영역 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="제목 또는 결재번호 검색"
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="상태"
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="PENDING">대기중</Option>
              <Option value="IN_PROGRESS">진행중</Option>
              <Option value="APPROVED">승인됨</Option>
              <Option value="REJECTED">반려됨</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="결재 유형"
              value={filters.type_id}
              onChange={(value) => setFilters(prev => ({ ...prev, type_id: value }))}
              style={{ width: '100%' }}
              allowClear
            >
              {approvalTypes.map(type => (
                <Option key={type.type_id} value={type.type_id}>
                  {type.type_name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={filters.date_range}
              onChange={(dates) => setFilters(prev => ({ ...prev, date_range: dates }))}
              placeholder={['시작일', '종료일']}
            />
          </Col>
          <Col xs={24} md={4}>
            <Space>
              <Button
                type="primary"
                icon={<FilterOutlined />}
                onClick={handleSearch}
              >
                검색
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                초기화
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 결재 목록 테이블 */}
      <Card>
        <Table
          columns={columns}
          dataSource={approvals}
          rowKey="approval_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} / 총 ${total}개`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default ApprovalList;