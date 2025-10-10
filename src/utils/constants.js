// src/utils/constants.js
export const PRIORITY_OPTIONS = [
  { value: 1, label: 'Level 1 - Can be rescheduled', color: 'green' },
  { value: 2, label: 'Level 2 - Slightly Urgent', color: 'yellow' },
  { value: 3, label: 'Level 3 - Intermediate', color: 'orange' },
  { value: 4, label: 'Level 4 - High Priority', color: 'red' },
  { value: 5, label: 'Level 5 - Urgent', color: '#8B0000' }
];

export const PRIORITY_COLORS = {
  1: 'green',
  2: 'yellow',
  3: 'orange',
  4: 'red',
  5: '#8B0000'
};

export const PRIORITY_LABELS = {
  1: 'Can be rescheduled',
  2: 'Slightly Urgent',
  3: 'Intermediate',
  4: 'High Priority',
  5: 'Urgent'
};

export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', color: 'red', icon: 'UserOutlined' },
  { value: 'top_management', label: 'Top Management', color: 'gold', icon: 'CrownOutlined' },
  { value: 'minor_management', label: 'Minor Management', color: 'blue', icon: 'UsergroupAddOutlined' }
];

export const ROLE_LABELS = {
  admin: 'Admin',
  top_management: 'Top Management',
  minor_management: 'Minor Management'
};

export const ROLE_COLORS = {
  admin: 'red',
  top_management: 'gold',
  minor_management: 'blue'
};