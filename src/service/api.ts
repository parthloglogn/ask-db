import { AgentsResponse } from "@/typs/agent";
import { Worker, WorkersResponse} from "../typs/worker";
import { ToolsResponse } from "@/typs/tool";

export const fetchProjects = async () => {
    try {
        const response = await fetch("/api/projects", { credentials: "include" });
        if (!response.ok) throw new Error("Failed to fetch projects");

        const text = await response.text();
        if (!text.trim()) throw new Error("Empty response from server");

        return JSON.parse(text);
    } catch (error) {
        console.error("API Error:", error);
        return null;
    }
};


export const fetchWorkersForProject = async (projectId: bigint) => {
    try {
        const response = await fetch(`/api/projects/workers?projectId=${projectId}`, { 
            credentials: "include" 
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: WorkersResponse = await response.json();
        
        // Convert string dates back to Date objects
        if (data.workers) {
            data.workers = data.workers.map(worker => ({
                ...worker,
                created_ts: new Date(worker.created_ts),
                modified_ts: new Date(worker.modified_ts)
            }));
        }
        
        return data;
    } catch (error) {
        console.error("API Error:", error);
        return { count: 0, workers: [] };
    }
};


export const fetchTools = async (): Promise<ToolsResponse> => {
    try {
        const response = await fetch(`/api/tools`, { 
            credentials: "include" 
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ToolsResponse = await response.json();
        
        // Convert string dates back to Date objects
        if (data.tools) {
            data.tools = data.tools.map(tool => ({
                ...tool,
                created_ts: new Date(tool.created_ts),
                modified_ts: tool.modified_ts ? new Date(tool.modified_ts) : new Date(tool.created_ts)
            }));
        }
        
        return data;
    } catch (error) {
        console.error("Error fetching tools:", error);
        return { count: 0, tools: [] };
    }
};

export const fetchAgentsForTool = async (toolId: bigint): Promise<AgentsResponse> => {
    try {
        const response = await fetch(`/api/tools/${toolId}/agents`, { 
            credentials: "include" 
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: AgentsResponse = await response.json();
        
        // Convert string dates back to Date objects
        if (data.agents) {
            data.agents = data.agents.map(agent => ({
                ...agent,
                created_ts: new Date(agent.created_ts),
                modified_ts: agent.modified_ts ? new Date(agent.modified_ts) : new Date(agent.created_ts)
            }));
        }
        
        return data;
    } catch (error) {
        console.error("Error fetching agents:", error);
        return { count: 0, agents: [] };
    }
};