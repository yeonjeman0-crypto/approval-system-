-- 실제 해운업 데이터 기반 샘플 데이터 (개인정보 변경됨)

-- 기존 사용자 데이터 삭제 후 현실적인 데이터 삽입
DELETE FROM users WHERE user_id > 0;
ALTER SEQUENCE users_user_id_seq RESTART WITH 1;

-- 실제 해운회사 조직 구조 기반 사용자 생성
INSERT INTO users (username, password_hash, full_name, email, department, position, rank_level) VALUES
-- 경영진
('ceo', '$2a$10$rOFrQ7zqnGQV5fGdX4gP1eHh3LrGRwGHq8Q3Mz8xNpDqvL2wE5R1K', '김대표', 'ceo@maritimegroup.com', '경영', '대표이사', 10),
('vp_ops', '$2a$10$rOFrQ7zqnGQV5fGdX4gP1eHh3LrGRwGHq8Q3Mz8xNpDqvL2wE5R1K', '박전무', 'vp@maritimegroup.com', '운영', '전무이사', 9),

-- 육상 관리팀
('mgr_ops', '$2a$10$rOFrQ7zqnGQV5fGdX4gP1eHh3LrGRwGHq8Q3Mz8xNpDqvL2wE5R1K', '이운영부장', 'ops@maritimegroup.com', '운영', '운영부장', 8),
('mgr_finance', '$2a$10$rOFrQ7zqnGQV5fGdX4gP1eHh3LrGRwGHq8Q3Mz8xNpDqvL2wE5R1K', '최재무부장', 'finance@maritimegroup.com', '재무', '재무부장', 8),
('mgr_crew', '$2a$10$rOFrQ7zqnGQV5fGdX4gP1eHh3LrGRwGHq8Q3Mz8xNpDqvL2wE5R1K', '정해무부장', 'crew@maritimegroup.com', '해무', '해무부장', 8),
('supervisor', '$2a$10$rOFrQ7zqnGQV5fGdX4gP1eHh3LrGRwGHq8Q3Mz8xNpDqvL2wE5R1K', '김관리차장', 'supervisor@maritimegroup.com', '관리', '관리차장', 7),

-- 선박 승무원 (M/V OCEAN PRIDE)
('captain_kim', '$2a$10$rOFrQ7zqnGQV5fGdX4gP1eHh3LrGRwGHq8Q3Mz8xNpDqvL2wE5R1K', '김선장', 'captain.kim@vessel.com', '갑판부', '선장', 9),
('chief_lee', '$2a$10$rOFrQ7zqnGQV5fGdX4gP1eHh3LrGRwGHq8Q3Mz8xNpDqvL2wE5R1K', '이기관장', 'chief.lee@vessel.com', '기관부', '기관장', 8),
('co_park', '$2a$10$rOFrQ7zqnGQV5fGdX4gP1eHh3LrGRwGHq8Q3Mz8xNpDqvL2wE5R1K', '박일항사', 'co.park@vessel.com', '갑판부', '일등항해사', 7),
('1e_jung', '$2a$10$rOFrQ7zqnGQV5fGdX4gP1eHh3LrGRwGHq8Q3Mz8xNpDqvL2wE5R1K', '정일기사', '1e.jung@vessel.com', '기관부', '일등기관사', 7),
('2o_han', '$2a$10$rOFrQ7zqnGQV5fGdX4gP1eHh3LrGRwGHq8Q3Mz8xNpDqvL2wE5R1K', '한이항사', '2o.han@vessel.com', '갑판부', '이등항해사', 6),
('2e_oh', '$2a$10$rOFrQ7zqnGQV5fGdX4gP1eHh3LrGRwGHq8Q3Mz8xNpDqvL2wE5R1K', '오이기사', '2e.oh@vessel.com', '기관부', '이등기관사', 6),

-- 선박 승무원 (M/V BLUE STAR)
('captain_choi', '$2a$10$rOFrQ7zqnGQV5fGdX4gP1eHh3LrGRwGHq8Q3Mz8xNpDqvL2wE5R1K', '최선장', 'captain.choi@vessel2.com', '갑판부', '선장', 9),
('chief_song', '$2a$10$rOFrQ7zqnGQV5fGdX4gP1eHh3LrGRwGHq8Q3Mz8xNpDqvL2wE5R1K', '송기관장', 'chief.song@vessel2.com', '기관부', '기관장', 8);

-- 기존 결재 종류 업데이트 (실제 해운업 양식 기반)
DELETE FROM approval_types WHERE type_id > 0;
ALTER SEQUENCE approval_types_type_id_seq RESTART WITH 1;

INSERT INTO approval_types (type_code, type_name, description, required_fields, approval_flow) VALUES
('SP', '선용품발주품의', '선박 운항에 필요한 선용품 구매 품의', 
 '{"items": "required", "amount": "required", "supplier": "optional", "urgent": "optional", "delivery_port": "required", "vessel_name": "required"}',
 '{"steps": [{"level": 7, "name": "일등항해사/일등기관사"}, {"level": 8, "name": "부장급"}, {"level": 9, "name": "선장/전무"}]}'),

('RP', '기부속발주품의', '선박 기관부 예비품 및 수리부품 발주 품의',
 '{"equipment": "required", "part_number": "optional", "amount": "required", "supplier": "optional", "urgent": "optional", "vessel_name": "required", "reason": "required"}',
 '{"steps": [{"level": 7, "name": "기관장/일등기관사"}, {"level": 8, "name": "운영부장"}, {"level": 9, "name": "전무이사"}]}'),

('RQ', '수리품의서', '선박 주요 장비 수리 및 정비 품의',
 '{"equipment": "required", "problem": "required", "repair_method": "required", "estimate": "required", "yard": "optional", "vessel_name": "required", "urgent": "optional"}',
 '{"steps": [{"level": 8, "name": "기관장"}, {"level": 9, "name": "선장"}, {"level": 9, "name": "전무이사"}]}'),

('CR', '승무원품의서', '승무원 관련 제반 사항 품의',
 '{"crew_name": "required", "rank": "required", "request_type": "required", "amount": "optional", "reason": "required", "vessel_name": "optional"}',
 '{"steps": [{"level": 7, "name": "선장/해무차장"}, {"level": 8, "name": "해무부장"}, {"level": 9, "name": "전무이사"}]}'),

('EX', '지출결의서', '선박 운항 관련 각종 비용 지출 품의',
 '{"expense_type": "required", "amount": "required", "purpose": "required", "account": "required", "receipt": "optional", "vessel_name": "optional"}',
 '{"steps": [{"level": 7, "name": "담당자"}, {"level": 8, "name": "부장급"}, {"level": 9, "name": "전무이사"}]}'),

('DN', '입거품의서', '선박 정기검사 및 수리를 위한 입거 품의',
 '{"vessel_name": "required", "dock_yard": "required", "start_date": "required", "end_date": "required", "survey_type": "required", "estimate": "required", "work_scope": "required"}',
 '{"steps": [{"level": 8, "name": "선장"}, {"level": 8, "name": "운영부장"}, {"level": 9, "name": "전무이사"}, {"level": 10, "name": "대표이사"}]}');

-- 실제 결재 샘플 데이터 생성
INSERT INTO approvals (approval_code, type_id, title, content, amount, currency, requester_id, current_step, total_steps, status, priority, form_data, submitted_at) VALUES

-- 선용품 발주 (진행중)
('SP-20250115-001', 1, 'M/V OCEAN PRIDE 선용품 긴급발주', 
 '로프 및 페인트 긴급 보급 필요. 부산항 입항 시 수급 예정.', 
 2500000, 'KRW', 10, 2, 3, 'PENDING', 'HIGH',
 '{"items": "와이어로프 6mm x 200m, 선체페인트 20L x 10통", "supplier": "대양상사", "delivery_port": "부산항", "vessel_name": "M/V OCEAN PRIDE", "urgent": "true"}',
 '2025-01-15 09:30:00'),

-- 기부속 발주 (완료)
('RP-20250114-003', 2, 'M/V BLUE STAR 주기관 피스톤링 교체',
 '주기관 No.2 실린더 피스톤링 마모로 인한 긴급 교체 필요.',
 8500000, 'KRW', 11, 3, 3, 'APPROVED', 'URGENT',
 '{"equipment": "MAN B&W 6S50MC-C8 주기관", "part_number": "51401-16-001", "supplier": "현대중공업", "vessel_name": "M/V BLUE STAR", "reason": "피스톤링 마모로 인한 압축압력 저하"}',
 '2025-01-14 14:20:00'),

-- 수리품의 (대기중)
('RQ-20250115-002', 3, 'M/V OCEAN PRIDE 보조보일러 수리',
 '보조보일러 버너 계통 이상으로 수리 필요. 차기 입항 시 수리 예정.',
 15000000, 'KRW', 8, 1, 3, 'PENDING', 'NORMAL',
 '{"equipment": "보조보일러 AUX.BOILER", "problem": "버너 점화 불량 및 화염 불안정", "repair_method": "버너헤드 청소 및 노즐 교체", "estimate": "15,000,000원", "vessel_name": "M/V OCEAN PRIDE"}',
 '2025-01-15 11:45:00'),

-- 승무원 품의 (반려됨)
('CR-20250113-001', 4, '박이항사 조기하선 품의',
 '가족 응급상황으로 인한 조기하선 요청.',
 500000, 'KRW', 7, 3, 3, 'REJECTED', 'HIGH',
 '{"crew_name": "박이항사", "rank": "이등항해사", "request_type": "조기하선", "reason": "가족 응급상황", "vessel_name": "M/V OCEAN PRIDE", "amount": "항공료"}',
 '2025-01-13 16:30:00'),

-- 지출결의 (완료)
('EX-20250115-004', 5, '부산항 대리점비 및 선용품비',
 '부산항 입항 관련 대리점비 및 급수료, 선용품비 정산.',
 3200000, 'KRW', 10, 3, 3, 'APPROVED', 'NORMAL',
 '{"expense_type": "항비", "purpose": "부산항 입항비용", "account": "F09001", "vessel_name": "M/V OCEAN PRIDE"}',
 '2025-01-15 08:15:00'),

-- 입거품의 (진행중)
('DN-20250110-001', 6, 'M/V BLUE STAR 정기검사 입거',
 '선급검사 및 정부검사를 위한 정기입거 품의.',
 850000000, 'KRW', 14, 3, 4, 'PENDING', 'NORMAL',
 '{"vessel_name": "M/V BLUE STAR", "dock_yard": "현대미포조선", "start_date": "2025-03-15", "end_date": "2025-04-30", "survey_type": "특별검사(SS)", "estimate": "850,000,000원", "work_scope": "선체정비, 주기관 정비, 화물창 정비"}',
 '2025-01-10 10:00:00');

-- 승인 단계 데이터 생성
INSERT INTO approval_steps (approval_id, step_number, approver_id, action, comment, processed_at, is_current) VALUES
-- SP-20250115-001 (진행중 - 2단계)
(1, 1, 10, 'APPROVE', '긴급 보급 필요성 인정. 승인.', '2025-01-15 10:00:00', false),
(1, 2, 3, null, null, null, true),
(1, 3, 2, null, null, null, false),

-- RP-20250114-003 (완료)
(2, 1, 11, 'APPROVE', '주기관 상태 확인함. 긴급교체 필요.', '2025-01-14 15:00:00', false),
(2, 2, 3, 'APPROVE', '예산 범위 내. 승인.', '2025-01-14 16:30:00', false),
(2, 3, 2, 'APPROVE', '최종 승인.', '2025-01-14 17:45:00', false),

-- RQ-20250115-002 (대기중 - 1단계)
(3, 1, 8, null, null, null, true),
(3, 2, 7, null, null, null, false),
(3, 3, 2, null, null, null, false),

-- CR-20250113-001 (반려됨)
(4, 1, 7, 'APPROVE', '부득이한 사정 인정.', '2025-01-13 17:00:00', false),
(4, 2, 5, 'APPROVE', '승무원 복리후생 차원에서 승인.', '2025-01-13 18:15:00', false),
(4, 3, 2, 'REJECT', '대체 승무원 배치 어려움으로 반려.', '2025-01-14 09:30:00', false),

-- EX-20250115-004 (완료)
(5, 1, 10, 'APPROVE', '영수증 확인완료.', '2025-01-15 09:00:00', false),
(5, 2, 3, 'APPROVE', '정당한 항비 지출.', '2025-01-15 10:30:00', false),
(5, 3, 2, 'APPROVE', '최종 승인.', '2025-01-15 11:00:00', false),

-- DN-20250110-001 (진행중 - 3단계)
(6, 1, 14, 'APPROVE', '정기검사 일정 적정.', '2025-01-10 11:00:00', false),
(6, 2, 3, 'APPROVE', '예산 검토완료.', '2025-01-10 14:30:00', false),
(6, 3, 2, null, null, null, true),
(6, 4, 1, null, null, null, false);

-- 알림 데이터 생성
INSERT INTO notifications (user_id, approval_id, type, title, message, is_read, created_at) VALUES
-- 대기중인 승인자들에게 알림
(3, 1, 'NEW_REQUEST', 'M/V OCEAN PRIDE 선용품 긴급발주 승인요청', '박일항사님이 새로운 결재를 요청했습니다.', false, '2025-01-15 10:00:00'),
(8, 3, 'NEW_REQUEST', 'M/V OCEAN PRIDE 보조보일러 수리 승인요청', '이기관장님이 새로운 결재를 요청했습니다.', false, '2025-01-15 11:45:00'),
(2, 6, 'NEW_REQUEST', 'M/V BLUE STAR 정기검사 입거 최종승인', '이운영부장님이 승인했습니다. 최종 검토 바랍니다.', false, '2025-01-10 14:30:00'),

-- 처리 완료된 결재들에 대한 알림
(11, 2, 'APPROVED', '기부속발주품의 최종승인 완료', '피스톤링 교체 품의가 최종 승인되었습니다.', true, '2025-01-14 17:45:00'),
(12, 4, 'REJECTED', '조기하선 품의 반려', '조기하선 품의가 반려되었습니다.', true, '2025-01-14 09:30:00'),
(10, 5, 'APPROVED', '부산항 대리점비 승인완료', '지출결의서가 승인되었습니다.', true, '2025-01-15 11:00:00');

-- 첨부파일 샘플 데이터
INSERT INTO attachments (approval_id, file_name, file_path, file_size, mime_type, uploaded_by, uploaded_at) VALUES
(1, '선용품견적서_대양상사.pdf', '/uploads/2025/01/15/quote_daeyang_001.pdf', 524288, 'application/pdf', 10, '2025-01-15 09:35:00'),
(2, '피스톤링사양서.pdf', '/uploads/2025/01/14/piston_ring_spec.pdf', 1048576, 'application/pdf', 11, '2025-01-14 14:25:00'),
(3, '보일러점검보고서.pdf', '/uploads/2025/01/15/boiler_inspection.pdf', 2097152, 'application/pdf', 8, '2025-01-15 11:50:00'),
(5, '부산항영수증.jpg', '/uploads/2025/01/15/busan_receipt.jpg', 307200, 'image/jpeg', 10, '2025-01-15 08:20:00'),
(6, '입거계획서.xlsx', '/uploads/2025/01/10/docking_plan.xlsx', 1572864, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 14, '2025-01-10 10:05:00');

COMMENT ON TABLE approvals IS '실제 해운회사 결재 문서 (개인정보 변경됨)';
COMMENT ON TABLE users IS '해운회사 조직도 기반 사용자 정보';
COMMENT ON COLUMN approvals.form_data IS '해운업 특화 동적 폼 데이터';