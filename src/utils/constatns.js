export const UserRolesEnum = {
    ADMIN:"admin",
    PROJECT_aDMIN: "Project_admin",
    MEMBER: "member" 
}

export const availableRoleEnum = Object.values(UserRolesEnum);

export const TaskStatusEnum = {
    TODO: "todo",
    IN_PROGRESS: "in_progress",
    DONE: "done"
}

export const AvailableTaskStatues = Object.values(TaskStatusEnum)