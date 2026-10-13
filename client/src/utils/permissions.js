const elevatedRoles = ['Admin', 'QA Lead', 'Project Manager']

export const canCreateIssue = () => true

export const canManageProjects = (role) => elevatedRoles.includes(role)

export const canManageSprints = (role) => elevatedRoles.includes(role)

export const canDeleteIssue = (role) => elevatedRoles.includes(role)

export const canEditIssue = (role) => Boolean(role)
