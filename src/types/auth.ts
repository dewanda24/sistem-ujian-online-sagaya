export type RoleName =
  | "super_admin"
  | "admin"
  | "principal"
  | "teacher"
  | "student"
  | "proctor";

export interface UserPermission {
  id: string;
  code: string;
  module: string;
  action: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  username: string;
  status: string;
  role_id: string | null;
  school_id: string | null;
  school_name: string | null;
  is_demo_user?: boolean;

  roles: {
    id?: string;
    name: RoleName;
    label: string;
  } | null;

  user_profiles: {
    full_name: string;
    avatar_url: string | null;
  } | null;

  permissions: UserPermission[];
  has_active_proctor_assignment?: boolean;
}
