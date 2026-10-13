export const belongsToProject = (item, projectKey) => (
  item.projectKey ? item.projectKey === projectKey : projectKey === 'QAR'
)
