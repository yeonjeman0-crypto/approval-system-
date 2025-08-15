import React, { useState, useEffect } from 'react';
import {
  Upload,
  Button,
  List,
  message,
  Modal,
  Progress,
  Space,
  Typography,
  Tag,
  Tooltip,
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileOutlined,
  PictureOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Text } = Typography;

const FileUpload = ({ approvalId, disabled = false, onFilesChange }) => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (approvalId) {
      loadAttachments();
    }
  }, [approvalId]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/attachments/approval/${approvalId}`);
      setAttachments(response.data);
      if (onFilesChange) {
        onFilesChange(response.data);
      }
    } catch (error) {
      console.error('첨부파일 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('업로드할 파일을 선택해주세요.');
      return;
    }

    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append('files', file);
    });

    try {
      setUploading(true);
      await axios.post(`/attachments/upload/${approvalId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      message.success('파일 업로드가 완료되었습니다.');
      setFileList([]);
      loadAttachments();
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      message.error('파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachmentId, fileName) => {
    try {
      const response = await axios.get(`/attachments/download/${attachmentId}`, {
        responseType: 'blob',
      });

      // Blob으로 파일 다운로드
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      message.error('파일 다운로드에 실패했습니다.');
    }
  };

  const handleDelete = async (attachmentId) => {
    Modal.confirm({
      title: '파일 삭제',
      content: '정말로 이 파일을 삭제하시겠습니까?',
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      onOk: async () => {
        try {
          await axios.delete(`/attachments/${attachmentId}`);
          message.success('파일이 삭제되었습니다.');
          loadAttachments();
        } catch (error) {
          console.error('파일 삭제 실패:', error);
          message.error('파일 삭제에 실패했습니다.');
        }
      },
    });
  };

  const getFileIcon = (fileType, fileName) => {
    if (fileType.startsWith('image/')) {
      return <PictureOutlined style={{ color: '#52c41a' }} />;
    } else if (fileType === 'application/pdf') {
      return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
    } else if (fileType.includes('word')) {
      return <FileWordOutlined style={{ color: '#1890ff' }} />;
    } else if (fileType.includes('excel') || fileType.includes('sheet')) {
      return <FileExcelOutlined style={{ color: '#52c41a' }} />;
    } else {
      return <FileOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const uploadProps = {
    multiple: true,
    fileList,
    beforeUpload: (file) => {
      // 파일 크기 체크 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        message.error('파일 크기는 10MB 이하여야 합니다.');
        return false;
      }

      // 파일 타입 체크
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

      if (!allowedTypes.includes(file.type)) {
        message.error('지원되지 않는 파일 형식입니다.');
        return false;
      }

      setFileList(prev => [...prev, file]);
      return false; // 자동 업로드 방지
    },
    onRemove: (file) => {
      setFileList(prev => prev.filter(item => item.uid !== file.uid));
    },
    showUploadList: {
      showDownloadIcon: false,
      showRemoveIcon: !disabled,
    },
  };

  return (
    <div>
      {/* 파일 업로드 섹션 */}
      {!disabled && approvalId && (
        <div style={{ marginBottom: '16px' }}>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>파일 선택</Button>
          </Upload>
          
          {fileList.length > 0 && (
            <Button
              type="primary"
              onClick={handleUpload}
              loading={uploading}
              style={{ marginTop: '8px' }}
            >
              {uploading ? '업로드 중...' : '업로드'}
            </Button>
          )}
        </div>
      )}

      {/* 첨부파일 목록 */}
      {attachments.length > 0 && (
        <List
          header={<Text strong>첨부파일 ({attachments.length}개)</Text>}
          dataSource={attachments}
          loading={loading}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Tooltip title="다운로드">
                  <Button
                    type="text"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(item.attachment_id, item.file_name)}
                  />
                </Tooltip>,
                !disabled && (
                  <Tooltip title="삭제">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(item.attachment_id)}
                    />
                  </Tooltip>
                ),
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={getFileIcon(item.file_type, item.file_name)}
                title={
                  <Space>
                    <Text ellipsis style={{ maxWidth: '200px' }}>
                      {item.file_name}
                    </Text>
                    <Tag size="small">{formatFileSize(item.file_size)}</Tag>
                  </Space>
                }
                description={
                  <Space>
                    <Text type="secondary">
                      {item.uploader?.full_name || '알 수 없음'}
                    </Text>
                    <Text type="secondary">•</Text>
                    <Text type="secondary">
                      {new Date(item.created_at).toLocaleDateString('ko-KR')}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}

      {attachments.length === 0 && !loading && (
        <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
          첨부된 파일이 없습니다.
        </div>
      )}
    </div>
  );
};

export default FileUpload;