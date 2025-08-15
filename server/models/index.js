const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 사용자 모델
const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100)
  },
  department: {
    type: DataTypes.STRING(50)
  },
  position: {
    type: DataTypes.STRING(50)
  },
  rank_level: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'users',
  defaultScope: {
    attributes: { exclude: ['password_hash'] }
  },
  scopes: {
    withPassword: {
      attributes: {}
    }
  }
});

// 결재 종류 모델
const ApprovalType = sequelize.define('ApprovalType', {
  type_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type_code: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  type_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  required_fields: {
    type: DataTypes.JSONB
  },
  approval_flow: {
    type: DataTypes.JSONB
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'approval_types'
});

// 결재 문서 모델
const Approval = sequelize.define('Approval', {
  approval_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  approval_code: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  type_id: {
    type: DataTypes.INTEGER,
    references: {
      model: ApprovalType,
      key: 'type_id'
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2)
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  requester_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'user_id'
    }
  },
  current_step: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  total_steps: {
    type: DataTypes.INTEGER
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'PENDING'
  },
  priority: {
    type: DataTypes.STRING(10),
    defaultValue: 'NORMAL'
  },
  due_date: {
    type: DataTypes.DATEONLY
  },
  form_data: {
    type: DataTypes.JSONB
  },
  submitted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  completed_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'approvals'
});

// 승인 단계 모델
const ApprovalStep = sequelize.define('ApprovalStep', {
  step_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  approval_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Approval,
      key: 'approval_id'
    }
  },
  step_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  approver_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'user_id'
    }
  },
  action: {
    type: DataTypes.STRING(20)
  },
  comment: {
    type: DataTypes.TEXT
  },
  processed_at: {
    type: DataTypes.DATE
  },
  is_current: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'approval_steps'
});

// 첨부파일 모델
const Attachment = sequelize.define('Attachment', {
  attachment_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  approval_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Approval,
      key: 'approval_id'
    }
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  file_size: {
    type: DataTypes.BIGINT
  },
  mime_type: {
    type: DataTypes.STRING(100)
  },
  uploaded_by: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'user_id'
    }
  },
  uploaded_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'attachments'
});

// 알림 모델
const Notification = sequelize.define('Notification', {
  notification_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'user_id'
    }
  },
  approval_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Approval,
      key: 'approval_id'
    }
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'notifications'
});

// 관계 설정
Approval.belongsTo(ApprovalType, { foreignKey: 'type_id', as: 'type' });
Approval.belongsTo(User, { foreignKey: 'requester_id', as: 'requester' });
Approval.hasMany(ApprovalStep, { foreignKey: 'approval_id', as: 'steps' });
Approval.hasMany(Attachment, { foreignKey: 'approval_id', as: 'attachments' });
Approval.hasMany(Notification, { foreignKey: 'approval_id', as: 'notifications' });

ApprovalStep.belongsTo(Approval, { foreignKey: 'approval_id', as: 'approval' });
ApprovalStep.belongsTo(User, { foreignKey: 'approver_id', as: 'approver' });

Attachment.belongsTo(Approval, { foreignKey: 'approval_id', as: 'approval' });
Attachment.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Notification.belongsTo(Approval, { foreignKey: 'approval_id', as: 'approval' });

User.hasMany(Approval, { foreignKey: 'requester_id', as: 'requested_approvals' });
User.hasMany(ApprovalStep, { foreignKey: 'approver_id', as: 'approval_steps' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

module.exports = {
  sequelize,
  User,
  ApprovalType,
  Approval,
  ApprovalStep,
  Attachment,
  Notification
};