-- Vision SMS 결재시스템 데이터베이스 스키마

-- 사용자 테이블
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    department VARCHAR(50),
    position VARCHAR(50),
    rank_level INTEGER DEFAULT 1, -- 승인 권한 레벨
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 결재 종류 마스터
CREATE TABLE approval_types (
    type_id SERIAL PRIMARY KEY,
    type_code VARCHAR(20) UNIQUE NOT NULL, -- PO, EXPENSE, REPAIR, CREW
    type_name VARCHAR(100) NOT NULL,
    description TEXT,
    required_fields JSONB, -- 필수 입력 필드 정의
    approval_flow JSONB, -- 승인 라인 정의
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 결재 문서
CREATE TABLE approvals (
    approval_id SERIAL PRIMARY KEY,
    approval_code VARCHAR(50) UNIQUE NOT NULL, -- 문서번호 (자동생성)
    type_id INTEGER REFERENCES approval_types(type_id),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    amount DECIMAL(12,2), -- 금액 (있는 경우)
    currency VARCHAR(3) DEFAULT 'USD',
    requester_id INTEGER REFERENCES users(user_id),
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CANCELLED
    priority VARCHAR(10) DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
    due_date DATE,
    form_data JSONB, -- 동적 폼 데이터
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 승인 단계
CREATE TABLE approval_steps (
    step_id SERIAL PRIMARY KEY,
    approval_id INTEGER REFERENCES approvals(approval_id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    approver_id INTEGER REFERENCES users(user_id),
    action VARCHAR(20), -- APPROVE, REJECT, DELEGATE
    comment TEXT,
    processed_at TIMESTAMP,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 첨부파일
CREATE TABLE attachments (
    attachment_id SERIAL PRIMARY KEY,
    approval_id INTEGER REFERENCES approvals(approval_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(user_id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 알림
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    approval_id INTEGER REFERENCES approvals(approval_id),
    type VARCHAR(50) NOT NULL, -- NEW_REQUEST, APPROVED, REJECTED, REMINDER
    title VARCHAR(200) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 승인 라인 템플릿
CREATE TABLE approval_templates (
    template_id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    type_id INTEGER REFERENCES approval_types(type_id),
    approval_flow JSONB NOT NULL, -- 승인자 순서 및 조건
    is_default BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_requester ON approvals(requester_id);
CREATE INDEX idx_approvals_type ON approvals(type_id);
CREATE INDEX idx_approval_steps_approver ON approval_steps(approver_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- 기본 데이터 삽입

-- 사용자 생성 (비밀번호: password123)
INSERT INTO users (username, password_hash, full_name, email, department, position, rank_level) VALUES
('admin', '$2a$10$rOFrQ7zqnGQV5fGdX4gP1eHh3LrGRwGHq8Q3Mz8xNpDqvL2wE5R1K', '관리자', 'admin@company.com', 'IT', '팀장', 10),
('captain', '$2a$10$rOFrQ7zqnGQV5fGdX4gP1eHh3LrGRwGHq8Q3Mz8xNpDqvL2wE5R1K', '선장', 'captain@company.com', '운항', '선장', 9),
('manager', '$2a$10$rOFrQ7zqnGQV5fGdX4gP1eHh3LrGRwGHq8Q3Mz8xNpDqvL2wE5R1K', '부장', 'manager@company.com', '관리', '부장', 8),
('chief', '$2a$10$rOFrQ7zqnGQV5fGdX4gP1eHh3LrGRwGHq8Q3Mz8xNpDqvL2wE5R1K', '기관장', 'chief@company.com', '기관', '기관장', 7),
('officer', '$2a$10$rOFrQ7zqnGQV5fGdX4gP1eHh3LrGRwGHq8Q3Mz8xNpDqvL2wE5R1K', '일등항해사', 'officer@company.com', '운항', '일등항해사', 5);

-- 결재 종류 생성
INSERT INTO approval_types (type_code, type_name, description, required_fields, approval_flow) VALUES
('PO', '발주품의서', '선용품, 기부속, 수리 등 발주 요청', 
 '{"items": "required", "amount": "required", "supplier": "optional", "reason": "required"}',
 '{"steps": [{"level": 5, "name": "부서장"}, {"level": 8, "name": "관리부장"}, {"level": 9, "name": "선장"}]}'),
 
('EXPENSE', '지출결의서', '각종 비용 지출 요청',
 '{"amount": "required", "purpose": "required", "account": "required", "receipt": "optional"}',
 '{"steps": [{"level": 7, "name": "팀장"}, {"level": 8, "name": "부장"}]}'),
 
('REPAIR', '수리품의서', '선박 수리 관련 품의',
 '{"equipment": "required", "problem": "required", "solution": "required", "estimate": "optional"}',
 '{"steps": [{"level": 7, "name": "기관장"}, {"level": 9, "name": "선장"}]}'),
 
('CREW', '승무원관련품의', '승무원 관련 각종 품의',
 '{"crew_name": "required", "request_type": "required", "details": "required"}',
 '{"steps": [{"level": 8, "name": "관리부장"}, {"level": 9, "name": "선장"}]}');

-- 승인 라인 템플릿
INSERT INTO approval_templates (template_name, type_id, approval_flow, is_default) VALUES
('기본 발주 승인라인', 1, 
 '{"steps": [{"position": "부서장", "level": 5}, {"position": "관리부장", "level": 8}, {"position": "선장", "level": 9}]}', 
 true),
('긴급 승인라인', 1,
 '{"steps": [{"position": "선장", "level": 9}]}',
 false);

COMMENT ON TABLE approvals IS '결재 문서 메인 테이블';
COMMENT ON TABLE approval_steps IS '결재 승인 단계별 처리 기록';
COMMENT ON COLUMN approvals.form_data IS '동적 폼 데이터 (JSON 형태로 다양한 필드 저장)';
COMMENT ON COLUMN approval_types.approval_flow IS '승인 라인 정의 (JSON 형태)';