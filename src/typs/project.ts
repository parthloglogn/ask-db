export interface Project  {
    id: bigint;
    title: string;
    user_id: bigint;
    is_deleted: boolean;
    created_by: string;
    created_ts: Date;
    modified_ts: Date;
  }
  export interface ProjectsResponse {
  count: number; 
  projects: Project[];
}