export interface Tool  {
    id: bigint;
    name: string;
    image: string;
    created_by: string;
    created_ts: Date;
    modified_ts: Date;
  }
  export interface ToolsResponse {
  count: number; 
  tools: Tool[];
}
