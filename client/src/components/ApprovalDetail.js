import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Button,
  Steps,
  Form,
  Input,
  Modal,
  message,
  Descriptions,
  Timeline,
  Avatar,
  Divider,
  Alert,
  Spin,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import FileUpload from './FileUpload';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Step } = Steps;

const ApprovalDetail = () => {
  const [loading, setLoading] = useState(true);
  const [approval, setApproval] = useState(null);
  const [approvalSteps, setApprovalSteps] = useState([]);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [processAction, setProcessAction] = useState('');
  const [processForm] = Form.useForm();
  const { id } = useParams();
  const { user } = useAuth();
  const { joinApprovalRoom, leaveApprovalRoom } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadApprovalDetail();
      joinApprovalRoom(id);
    }

    return () => {
      if (id) {
        leaveApprovalRoom(id);
      }
    };
  }, [id]);

  const loadApprovalDetail = async () => {
    try {
      setLoading(true);
      const [approvalRes, stepsRes] = await Promise.all([
        axios.get(`/approvals/${id}`),
        axios.get(`/approvals/${id}/steps`)
      ]);

      setApproval(approvalRes.data);
      setApprovalSteps(stepsRes.data);
    } catch (error) {
      console.error('결재 상세 로드 실패:', error);
      message.error('결재 정보를 불러오는데 실패했습니다.');
      navigate('/approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (action) => {
    setProcessAction(action);
    setProcessModalVisible(true);
  };

  const submitProcess = async () => {
    try {
      const values = await processForm.validateFields();
      
      await axios.post(`/approvals/${id}/process`, {
        action: processAction,
        comment: values.comment
      });

      message.success(
        processAction === 'APPROVE' 
          ? '결재가 승인되었습니다.' 
          : '결재가 반려되었습니다.'
      );
      
      setProcessModalVisible(false);
      processForm.resetFields();
      loadApprovalDetail();
      
    } catch (error) {
      console.error('결재 처리 실패:', error);
      message.error('결재 처리에 실패했습니다.');
    }
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

  const getCurrentStep = () => {
    if (!approvalSteps.length) return 0;
    
    const currentStep = approvalSteps.findIndex(step => 
      step.status === 'PENDING' && step.step_order === approval.current_step
    );
    
    return currentStep >= 0 ? currentStep : approvalSteps.length - 1;
  };

  const canUserProcess = () => {
    if (!approval || !user || approval.status !== 'PENDING') return false;
    
    const currentStep = approvalSteps.find(step => 
      step.step_order === approval.current_step
    );
    
    return currentStep && currentStep.approver_id === user.user_id;
  };

  const renderFormData = (formData) => {
    if (!formData) return null;

    return Object.entries(formData).map(([key, value]) => {
      if (!value) return null;
      
      const fieldNames = {
        items: '품목',
        supplier: '공급업체/구매처',
        delivery_date: '납기희망일',
        reason: '신청사유',
        equipment: '수리대상',
        problem_description: '문제상황',
        repair_method: '수리방법',
        crew_name: '관련선원',
        crew_matter_type: '사안유형',
        expense_category: '비용분류',
        expense_details: '비용상세',
        dock_location: '입거장소',
        dock_period: '입거기간',
        dock_works: '작업내용',
        specifications: '사양'
      };

      return (
        <Descriptions.Item key={key} label={fieldNames[key] || key}>
          {typeof value === 'string' && value.length > 50 ? (
            <Paragraph ellipsis={{ rows: 2, expandable: true }}>
              {value}
            </Paragraph>
          ) : (
            value
          )}
        </Descriptions.Item>
      );
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!approval) {
    return (
      <Alert
        message="결재를 찾을 수 없습니다"
        type="error"
        showIcon
        action={
          <Button onClick={() => navigate('/approvals')}>
            목록으로 돌아가기
          </Button>
        }
      />
    );
  }

  const statusConfig = getStatusConfig(approval.status);
  const priorityConfig = getPriorityConfig(approval.priority);

  return (
    <div>
      {/* 페이지 헤더 */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/approvals')}
            style={{ marginRight: '16px' }}
          >
            목록으로
          </Button>
          <Space>
            <Title level={2} style={{ margin: 0 }}>
              {approval.title}
            </Title>
            <Tag color={statusConfig.color} icon={statusConfig.icon}>
              {statusConfig.text}
            </Tag>
          </Space>
        </div>
        
        {canUserProcess() && (
          <Space>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleProcess('APPROVE')}
            >
              승인
            </Button>
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => handleProcess('REJECT')}
            >
              반려
            </Button>
          </Space>
        )}
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          {/* 기본 정보 */}
          <Card title="기본 정보" style={{ marginBottom: '16px' }}>
            <Descriptions column={2}>
              <Descriptions.Item label="결재번호">
                <Text code>{approval.approval_code}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="결재유형">
                <Tag color="blue">{approval.type_name}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="신청자">
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  {approval.requester_name}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="우선순위">
                <Tag color={priorityConfig.color}>{priorityConfig.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="신청일">
                <Space>
                  <CalendarOutlined />
                  {dayjs(approval.created_at).format('YYYY-MM-DD HH:mm')}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="금액">
                {approval.amount ? (
                  <Space>
                    <DollarOutlined />
                    <Text strong>
                      {approval.amount.toLocaleString()} {approval.currency}
                    </Text>
                  </Space>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 결재 내용 */}
          <Card title="결재 내용" style={{ marginBottom: '16px' }}>
            <Paragraph>{approval.content}</Paragraph>
            
            {approval.form_data && (
              <>
                <Divider />
                <Descriptions title="상세 정보" column={1}>
                  {renderFormData(approval.form_data)}
                </Descriptions>
              </>
            )}
          </Card>

          {/* 첨부파일 */}
          <Card title="첨부파일" style={{ marginBottom: '16px' }}>
            <FileUpload 
              approvalId={id} 
              disabled={approval.status !== 'PENDING' || approval.requester_id !== user?.user_id}
            />
          </Card>

          {/* 결재 진행 현황 */}
          <Card title="결재 진행 현황">
            <Steps current={getCurrentStep()} status={approval.status === 'REJECTED' ? 'error' : 'process'}>
              {approvalSteps.map((step, index) => (
                <Step
                  key={step.step_id}
                  title={`${step.step_order}단계`}
                  description={step.approver_name}
                  icon={
                    step.status === 'APPROVED' ? <CheckCircleOutlined /> :
                    step.status === 'REJECTED' ? <CloseCircleOutlined /> :
                    step.status === 'PENDING' ? <ClockCircleOutlined /> :
                    undefined
                  }
                />
              ))}
            </Steps>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* 승인 이력 */}
          <Card title="승인 이력" size="small">
            <Timeline>
              <Timeline.Item
                dot={<Avatar size="small" icon={<UserOutlined />} />}
                color="blue"
              >
                <Text strong>{approval.requester_name}</Text>
                <br />
                <Text type="secondary">결재 신청</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {dayjs(approval.created_at).format('MM/DD HH:mm')}
                </Text>
              </Timeline.Item>
              
              {approvalSteps
                .filter(step => step.status !== 'PENDING')
                .map((step) => (
                  <Timeline.Item
                    key={step.step_id}
                    dot={
                      <Avatar 
                        size="small" 
                        icon={step.status === 'APPROVED' ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 
                        style={{ 
                          backgroundColor: step.status === 'APPROVED' ? '#52c41a' : '#ff4d4f' 
                        }}
                      />
                    }
                    color={step.status === 'APPROVED' ? 'green' : 'red'}
                  >
                    <Text strong>{step.approver_name}</Text>
                    <br />
                    <Text type="secondary">
                      {step.status === 'APPROVED' ? '승인' : '반려'}
                    </Text>
                    {step.comment && (
                      <>
                        <br />
                        <Text style={{ fontSize: '12px' }}>"{step.comment}"</Text>
                      </>
                    )}
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(step.processed_at).format('MM/DD HH:mm')}
                    </Text>
                  </Timeline.Item>
                ))}
            </Timeline>
          </Card>

          {/* 문서 정보 */}
          <Card title="문서 정보" size="small" style={{ marginTop: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">생성일:</Text>
                <Text style={{ marginLeft: '8px' }}>
                  {dayjs(approval.created_at).format('YYYY-MM-DD HH:mm')}
                </Text>
              </div>
              <div>
                <Text type="secondary">수정일:</Text>
                <Text style={{ marginLeft: '8px' }}>
                  {dayjs(approval.updated_at).format('YYYY-MM-DD HH:mm')}
                </Text>
              </div>
              <div>
                <Text type="secondary">현재 단계:</Text>
                <Text style={{ marginLeft: '8px' }}>
                  {approval.current_step}단계 / {approvalSteps.length}단계
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 결재 처리 모달 */}
      <Modal
        title={processAction === 'APPROVE' ? '결재 승인' : '결재 반려'}
        open={processModalVisible}
        onOk={submitProcess}
        onCancel={() => {
          setProcessModalVisible(false);
          processForm.resetFields();
        }}
        okText={processAction === 'APPROVE' ? '승인' : '반려'}
        okType={processAction === 'APPROVE' ? 'primary' : 'danger'}
        cancelText="취소"
      >
        <Form form={processForm} layout="vertical">
          <Form.Item
            name="comment"
            label="의견"
            rules={[
              { required: processAction === 'REJECT', message: '반려 시 의견은 필수입니다!' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder={
                processAction === 'APPROVE'
                  ? '승인 의견을 입력하세요 (선택사항)'
                  : '반려 사유를 입력하세요'
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ApprovalDetail;