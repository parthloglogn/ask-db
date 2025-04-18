export interface Worker  {
    id: bigint;
    title: string;
    project_id: bigint;
    created_by: string;
    created_ts: Date;
    modified_ts: Date;
     image?: string | null;
  }
  export interface WorkersResponse {
  count: number; 
  workers: Worker[];
}
