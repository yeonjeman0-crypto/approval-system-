import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Typography,
  InputNumber,
  message,
  Space,
  Divider,
  Upload,
  Tag,
  Alert,
} from 'antd';
import {
  SaveOutlined,
  SendOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CreateApproval = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [approvalTypes, setApprovalTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [fileList, setFileList] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadApprovalTypes();
  }, []);

  const loadApprovalTypes = async () => {
    try {
      const response = await axios.get('/approvals/types');
      setApprovalTypes(response.data);
    } catch (error) {
      console.error('결재 유형 로드 실패:', error);
      message.error('결재 유형을 불러오는데 실패했습니다.');
    }
  };

  const handleTypeChange = (typeId) => {
    const type = approvalTypes.find(t => t.type_id === typeId);
    setSelectedType(type);
    
    // 결재 유형에 따라 폼 초기값 설정
    if (type) {
      form.setFieldsValue({
        currency: type.default_currency || 'USD',
        priority: 'NORMAL'
      });
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const formData = {
        ...values,
        form_data: {
          items: values.items,
          supplier: values.supplier,
          delivery_date: values.delivery_date,
          reason: values.reason,
          specifications: values.specifications,
        }
      };

      const response = await axios.post('/approvals', formData);
      
      if (response.data.success) {
        message.success('결재가 성공적으로 생성되었습니다.');
        navigate(`/approvals/${response.data.approval.approval_id}`);
      }
    } catch (error) {
      console.error('결재 생성 실패:', error);
      message.error('결재 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields();
      // 임시저장 로직 구현
      message.info('임시저장 기능은 추후 구현 예정입니다.');
    } catch (error) {
      console.log('폼 검증 실패:', error);
    }
  };

  const getFormFields = () => {
    if (!selectedType) return null;

    const commonFields = (
      <>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Form.Item
              name="amount"
              label="금액"
              rules={[
                { required: selectedType.requires_amount, message: '금액을 입력해주세요!' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                formatter={(value) => value ? `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                parser={(value) => value ? value.replace(/\$\s?|(,*)/g, '') : ''}
                placeholder="0.00"
              />
            </Form.Item>
          </Col>
          <Col xs={24} lg={12}>
            <Form.Item
              name="currency"
              label="통화"
              rules={[{ required: true, message: '통화를 선택해주세요!' }]}
            >
              <Select>
                <Option value="USD">USD</Option>
                <Option value="KRW">KRW</Option>
                <Option value="EUR">EUR</Option>
                <Option value="JPY">JPY</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="priority"
          label="우선순위"
          rules={[{ required: true, message: '우선순위를 선택해주세요!' }]}
        >
          <Select>
            <Option value="LOW">
              <Tag color="green">낮음</Tag>
            </Option>
            <Option value="NORMAL">
              <Tag color="default">보통</Tag>
            </Option>
            <Option value="HIGH">
              <Tag color="red">긴급</Tag>
            </Option>
          </Select>
        </Form.Item>
      </>
    );

    // 결재 유형별 특화 필드
    const typeSpecificFields = {
      1: ( // 예비품 주문
        <>
          <Form.Item
            name="items"
            label="주문 품목"
            rules={[{ required: true, message: '주문 품목을 입력해주세요!' }]}
          >
            <TextArea rows={3} placeholder="예: 엔진오일 5L, 필터 10개 등" />
          </Form.Item>
          <Form.Item
            name="supplier"
            label="공급업체"
            rules={[{ required: true, message: '공급업체를 입력해주세요!' }]}
          >
            <Input placeholder="공급업체명을 입력하세요" />
          </Form.Item>
          <Form.Item
            name="delivery_date"
            label="납기 희망일"
          >
            <Input placeholder="예: 2024-01-15" />
          </Form.Item>
        </>
      ),
      2: ( // 선용품 구매
        <>
          <Form.Item
            name="items"
            label="구매 품목"
            rules={[{ required: true, message: '구매 품목을 입력해주세요!' }]}
          >
            <TextArea rows={3} placeholder="예: 식료품, 생필용품 등" />
          </Form.Item>
          <Form.Item
            name="supplier"
            label="구매처"
            rules={[{ required: true, message: '구매처를 입력해주세요!' }]}
          >
            <Input placeholder="구매처명을 입력하세요" />
          </Form.Item>
        </>
      ),
      3: ( // 수리 작업
        <>
          <Form.Item
            name="equipment"
            label="수리 대상"
            rules={[{ required: true, message: '수리 대상을 입력해주세요!' }]}
          >
            <Input placeholder="예: 메인 엔진, 발전기 등" />
          </Form.Item>
          <Form.Item
            name="problem_description"
            label="문제 상황"
            rules={[{ required: true, message: '문제 상황을 입력해주세요!' }]}
          >
            <TextArea rows={3} placeholder="문제 상황을 상세히 기술해주세요" />
          </Form.Item>
          <Form.Item
            name="repair_method"
            label="수리 방법"
          >
            <TextArea rows={2} placeholder="예상 수리 방법을 입력하세요" />
          </Form.Item>
        </>
      ),
      4: ( // 선원 관련
        <>
          <Form.Item
            name="crew_name"
            label="관련 선원"
            rules={[{ required: true, message: '관련 선원을 입력해주세요!' }]}
          >
            <Input placeholder="선원명을 입력하세요" />
          </Form.Item>
          <Form.Item
            name="crew_matter_type"
            label="사안 유형"
            rules={[{ required: true, message: '사안 유형을 선택해주세요!' }]}
          >
            <Select placeholder="사안 유형을 선택하세요">
              <Option value="휴가">휴가</Option>
              <Option value="승진">승진</Option>
              <Option value="교육">교육</Option>
              <Option value="징계">징계</Option>
              <Option value="기타">기타</Option>
            </Select>
          </Form.Item>
        </>
      ),
      5: ( // 비용 지출
        <>
          <Form.Item
            name="expense_category"
            label="비용 분류"
            rules={[{ required: true, message: '비용 분류를 선택해주세요!' }]}
          >
            <Select placeholder="비용 분류를 선택하세요">
              <Option value="연료비">연료비</Option>
              <Option value="항만비">항만비</Option>
              <Option value="수리비">수리비</Option>
              <Option value="보험료">보험료</Option>
              <Option value="기타">기타</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="expense_details"
            label="비용 상세"
            rules={[{ required: true, message: '비용 상세를 입력해주세요!' }]}
          >
            <TextArea rows={3} placeholder="비용 내역을 상세히 입력하세요" />
          </Form.Item>
        </>
      ),
      6: ( // 입거 작업
        <>
          <Form.Item
            name="dock_location"
            label="입거 장소"
            rules={[{ required: true, message: '입거 장소를 입력해주세요!' }]}
          >
            <Input placeholder="입거 예정 조선소명" />
          </Form.Item>
          <Form.Item
            name="dock_period"
            label="입거 기간"
            rules={[{ required: true, message: '입거 기간을 입력해주세요!' }]}
          >
            <Input placeholder="예: 2024-01-15 ~ 2024-02-15" />
          </Form.Item>
          <Form.Item
            name="dock_works"
            label="작업 내용"
            rules={[{ required: true, message: '작업 내용을 입력해주세요!' }]}
          >
            <TextArea rows={4} placeholder="입거 중 수행할 작업 내용을 상세히 기술하세요" />
          </Form.Item>
        </>
      ),
    };

    return (
      <>
        {typeSpecificFields[selectedType.type_id]}
        {commonFields}
        <Form.Item
          name="reason"
          label="신청 사유"
          rules={[{ required: true, message: '신청 사유를 입력해주세요!' }]}
        >
          <TextArea rows={4} placeholder="신청 사유를 상세히 입력해주세요" />
        </Form.Item>
      </>
    );
  };

  return (
    <div>
      {/* 페이지 헤더 */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/approvals')}
          style={{ marginRight: '16px' }}
        >
          목록으로
        </Button>
        <Title level={2} style={{ margin: 0 }}>
          새 결재 생성
        </Title>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                currency: 'USD',
                priority: 'NORMAL'
              }}
            >
              {/* 기본 정보 */}
              <Title level={4}>기본 정보</Title>
              
              <Form.Item
                name="type_id"
                label="결재 유형"
                rules={[{ required: true, message: '결재 유형을 선택해주세요!' }]}
              >
                <Select
                  placeholder="결재 유형을 선택하세요"
                  onChange={handleTypeChange}
                >
                  {approvalTypes.map(type => (
                    <Option key={type.type_id} value={type.type_id}>
                      <Space>
                        <Text strong>{type.type_name}</Text>
                        <Text type="secondary">- {type.description}</Text>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="title"
                label="결재 제목"
                rules={[{ required: true, message: '결재 제목을 입력해주세요!' }]}
              >
                <Input placeholder="결재 제목을 입력하세요" />
              </Form.Item>

              <Form.Item
                name="content"
                label="결재 내용"
                rules={[{ required: true, message: '결재 내용을 입력해주세요!' }]}
              >
                <TextArea rows={4} placeholder="결재 내용을 상세히 입력하세요" />
              </Form.Item>

              <Divider />

              {/* 상세 정보 */}
              {selectedType && (
                <>
                  <Title level={4}>상세 정보</Title>
                  {getFormFields()}
                </>
              )}

              {/* 액션 버튼 */}
              <Divider />
              <Row justify="end">
                <Space>
                  <Button onClick={handleSaveDraft}>
                    <SaveOutlined />
                    임시저장
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SendOutlined />}
                  >
                    결재 신청
                  </Button>
                </Space>
              </Row>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* 결재 유형 안내 */}
          <Card title="결재 유형 안내" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              {approvalTypes.map(type => (
                <Card
                  key={type.type_id}
                  size="small"
                  style={{
                    backgroundColor: selectedType?.type_id === type.type_id ? '#e6f7ff' : '#fafafa'
                  }}
                >
                  <Text strong>{type.type_name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {type.description}
                  </Text>
                </Card>
              ))}
            </Space>
          </Card>

          {/* 신청자 정보 */}
          <Card title="신청자 정보" size="small" style={{ marginTop: '16px' }}>
            <Space direction="vertical">
              <div>
                <Text type="secondary">신청자:</Text>
                <Text strong style={{ marginLeft: '8px' }}>{user?.full_name}</Text>
              </div>
              <div>
                <Text type="secondary">직급:</Text>
                <Text style={{ marginLeft: '8px' }}>레벨 {user?.rank_level}</Text>
              </div>
              <div>
                <Text type="secondary">신청일:</Text>
                <Text style={{ marginLeft: '8px' }}>{new Date().toLocaleDateString('ko-KR')}</Text>
              </div>
            </Space>
          </Card>

          {/* 주의사항 */}
          <Alert
            message="결재 신청 시 주의사항"
            description={
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                <li>모든 필수 항목을 정확히 입력해주세요</li>
                <li>금액 단위를 확인해주세요</li>
                <li>긴급한 경우 우선순위를 '긴급'으로 설정하세요</li>
                <li>신청 후 수정이 제한됩니다</li>
              </ul>
            }
            type="info"
            style={{ marginTop: '16px' }}
          />
        </Col>
      </Row>
    </div>
  );
};

export default CreateApproval;