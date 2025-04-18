export interface Agent  {
    id: bigint;
    name: string;
    image: string;
    tool_id: bigint;
    created_by: string;
    created_ts: Date;
    modified_ts: Date;
  }
  export interface AgentsResponse {
  count: number; 
  agents: Agent[];
}
