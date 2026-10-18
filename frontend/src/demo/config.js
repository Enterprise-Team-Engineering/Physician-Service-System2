export const DEMO_ROLES = {
  DOCTOR: 'DOCTOR',
  DEPT_ADMIN: 'DEPT_ADMIN'
}

export const DEMO_USERS = {
  doctor: {
    id: 201,
    userId: 201,
    username: 'doctor',
    password: '123456',
    name: 'Dr. Zhang',
    roleCode: DEMO_ROLES.DOCTOR,
    roleName: 'Doctor',
    departmentId: 1,
    avatar: 'default.jpg'
  },
  admin: {
    id: 301,
    userId: 301,
    username: 'admin',
    password: 'admin123',
    name: 'Internal Medicine Department Admin',
    roleCode: DEMO_ROLES.DEPT_ADMIN,
    roleName: 'Department Admin',
    departmentId: 1,
    avatar: 'default.jpg'
  }
}

export function authenticateUser (username, password) {
  const account = DEMO_USERS[username]
  if (!account || account.password !== password) return null
  return {
    id: account.id,
    userId: account.userId,
    username: account.username,
    name: account.name,
    roleCode: account.roleCode,
    roleName: account.roleName,
    departmentId: account.departmentId,
    avatar: account.avatar
  }
}
