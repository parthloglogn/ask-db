"use client"
import { useState, useEffect,useRef } from 'react';
import { FaSignOutAlt, FaSitemap, FaQuestion, FaToolbox, FaChevronDown, FaChevronRight, FaSave } from 'react-icons/fa';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from "next/navigation";
import { Tool, ToolsResponse } from "../../typs/tool";
import { Agent, AgentsResponse } from "../../typs/agent";
import { fetchTools, fetchAgentsForTool } from "../../service/api";

interface Position {
  x: number;
  y: number;
}

interface Connection {
  target: Position;
  label?: string;
}

interface PlaygroundAgent extends Agent {
  position?: Position;
  connections?: Connection[];
}

export default function WorkerScreen() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tools, setTools] = useState<Tool[]>([]);
  const [expandedTool, setExpandedTool] = useState<bigint | null>(null);
  const [agents, setAgents] = useState<Record<string, Agent[]>>({});
  const [playgroundAgents, setPlaygroundAgents] = useState<PlaygroundAgent[]>([]);
  const playgroundRef = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<{ from: string; to: string }[]>([]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/signin");
    else loadTools();
  }, [session, status]);

  const loadTools = async () => {
    try {
      const data = await fetchTools();
      data && data.count > 0 && setTools(data.tools);
    } catch (error) {
      console.error("Error fetching tools:", error);
    }
  };

  const loadAgentsForTool = async (toolId: bigint) => {
    try {
      const data = await fetchAgentsForTool(toolId);
      data && data.count > 0 && setAgents(prev => ({
        ...prev,
        [toolId.toString()]: data.agents
      }));
    } catch (error) {
      console.error("Error fetching agents:", error);
    }
  };

  const handleToolClick = (toolId: bigint) => {
    const toolKey = toolId.toString();
    setExpandedTool(prev => prev === toolId ? null : toolId);
    !agents[toolKey] && loadAgentsForTool(toolId);
  };

  const handleDragStart = (agent: Agent) => (e: React.DragEvent) => {
    e.dataTransfer.setData('agent', JSON.stringify(agent));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const agentData = e.dataTransfer.getData('agent');
    const type = e.dataTransfer.getData('type');

    if (type === 'move' || !agentData || !playgroundRef.current) return;

    const agent: PlaygroundAgent = JSON.parse(agentData);
    const playgroundRect = playgroundRef.current.getBoundingClientRect();
    
    setPlaygroundAgents(prev => [...prev, {
      ...agent,
      position: {
        x: e.clientX - playgroundRect.left - 40,
        y: e.clientY - playgroundRect.top - 40
      }
    }]);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleCreateConnection = (fromAgent: PlaygroundAgent, toAgent: PlaygroundAgent) => {
  setConnections(prev => [...prev, { 
    from: fromAgent.id.toString(), 
    to: toAgent.id.toString() 
  }]);
 };

 const handleAgentRightClick = (
  e: React.MouseEvent<HTMLDivElement>, 
  agent: PlaygroundAgent
) => {
  e.preventDefault();
  const fromAgent = agent;
  const toAgentId = prompt("Enter target agent ID:");
  const toAgent = playgroundAgents.find(a => a.id.toString() === toAgentId);
  
  if (toAgent) {
    handleCreateConnection(fromAgent, toAgent);
  }
};

  const handleSaveWorker = () => {
    console.log("Worker saved:", playgroundAgents);
    alert("Worker saved successfully!");
  };

  return (
    <div className="bg-gray-900 min-h-screen text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg p-4 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center">
          <img
            alt="Logo"
            className="h-10 w-10 rounded"
            src="https://storage.googleapis.com/a1aa/image/szrjCb6fYlgKcF2TSiBAUb_7g3jWkaBj0RxhWhNsEqQ.jpg"
          />
          <h1 className="ml-3 text-xl font-bold text-white">Worker Builder</h1>
        </div>
        <button 
          onClick={() => signOut()} 
          className="flex items-center bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
        >
          <FaSignOutAlt className="mr-2" />
          Logout
        </button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="bg-gray-800 w-64 p-4 border-r border-gray-700 overflow-y-auto">
          <button className="flex items-center justify-center bg-gray-600 hover:bg-gray-500 text-white w-full py-2 rounded-lg mb-6">
            <FaSitemap className="mr-2" />
            Create Worker
          </button>
          
          <nav>
            <div className="flex items-center text-gray-400 px-3 py-2">
              <FaToolbox className="mr-3" />
              Tools
            </div>
            <ul className="ml-2 mt-2">
              {tools.map(tool => (
                <li key={tool.id.toString()} className="mb-1">
                  <button
                    className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg ${
                      expandedTool === tool.id 
                        ? 'bg-gray-700 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                    onClick={() => handleToolClick(tool.id)}
                  >
                    <div className="flex items-center group relative">
                      <svg 
                        className="mr-3 h-5 w-5 text-accent-400" 
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        fill="none"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" 
                        />
                      </svg>
                       <div
    className="h-6 w-6"
    dangerouslySetInnerHTML={{ __html: tool.image || '' }}
  />
                      <span className="group-hover:opacity-100 opacity-0 bg-gray-800 text-white px-2 py-1 rounded absolute left-8 top-6 transition-opacity">
                        {tool.name}
                      </span>
                      {tool.name || 'Untitled Tool'}
                    </div>
                    {expandedTool === tool.id ? <FaChevronDown /> : <FaChevronRight />}
                  </button>

                  {expandedTool === tool.id && agents[tool.id.toString()] && (
                    <ul className="ml-6 mt-1">
                      {agents[tool.id.toString()].map(agent => (
                        <li 
                          key={agent.id.toString()}
                          className="px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg cursor-move mb-1"
                          draggable
                          onDragStart={handleDragStart(agent)}
                        >
                          <div className="flex items-center gap-2">
  <div
    className="h-6 w-6"
    dangerouslySetInnerHTML={{ __html: agent.image || '' }}
  />
  <span>{agent.name || 'Untitled Agent'}</span>
</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Playground Area */}
        <main
          ref={playgroundRef} 
          className="flex-1 p-8 bg-gray-900 overflow-auto"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Worker Playground</h2>
            <button 
              onClick={handleSaveWorker}
              className="flex items-center bg-accent-500 hover:bg-accent-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              <FaSave className="mr-2" />
              Save Worker
            </button>
          </div>

          <div className="min-h-[70vh] border-2 border-dashed border-gray-700 rounded-xl p-6 relative">
            {playgroundAgents.map((agent, index) => (
              <div
                key={`${agent.id}-${index}`}
                  onContextMenu={(e) => handleAgentRightClick(e, agent)}
                  className="bg-gray-800 p-4 rounded-lg shadow border border-accent-400 absolute cursor-move hover:border-accent-300 transition-all group"
                style={{
                  left: `${agent.position?.x || 0}px`,
                  top: `${agent.position?.y || 0}px`,
                }}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('agent', JSON.stringify(agent));
                  e.dataTransfer.setData('type', 'move');
                }}
                 onDragEnd={(e) => {
                   if (!playgroundRef.current) return;
                   
                   const playgroundRect = playgroundRef.current.getBoundingClientRect();
                   const newX = e.clientX - playgroundRect.left - 40;
                   const newY = e.clientY - playgroundRect.top - 40;
                 
                   setPlaygroundAgents(prev => 
                     prev.map(a => 
                       a.id === agent.id ? {
                         ...a,
                         position: { x: newX, y: newY }
                       } : a
                     )
                   );
                 }}

              >
                <div className="flex flex-col items-center">
                <div
                  className="h-6 w-6"
                    dangerouslySetInnerHTML={{ __html: agent.image || '' }}
                    />
                  <h3 className="text-gray-200 font-medium text-sm">
                    {agent.name || 'Untitled Agent'}
                  </h3>
                </div>
              </div>
            ))}

            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {playgroundAgents.flatMap(agent =>
                agent.connections?.map((conn, i) => (
                  <line
                    key={`${agent.id}-${i}`}
                    x1={(agent.position?.x || 0) + 40}
                    y1={(agent.position?.y || 0) + 40}
                    x2={(conn.target.x || 0) + 40}
                    y2={(conn.target.y || 0) + 40}
                    stroke="#4F46E5"
                    strokeWidth="2"
                  />
                ))
              )}
            </svg>

            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
  {connections.map((conn, index) => {
    const fromAgent = playgroundAgents.find(a => a.id.toString() === conn.from);
    const toAgent = playgroundAgents.find(a => a.id.toString() === conn.to);

    if (!fromAgent?.position || !toAgent?.position) return null;

    return (
      <line
        key={index}
        x1={fromAgent.position.x + 40}
        y1={fromAgent.position.y + 40}
        x2={toAgent.position.x + 40}
        y2={toAgent.position.y + 40}
        stroke="#4F46E5"
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
      />
    );
  })}
  
  {/* Arrowhead definition */}
  <defs>
    <marker
      id="arrowhead"
      markerWidth="10"
      markerHeight="7"
      refX="9"
      refY="3.5"
      orient="auto"
    >
      <polygon points="0 0, 10 3.5, 0 7" fill="#4F46E5" />
    </marker>
  </defs>
</svg>

            {playgroundAgents.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <p className="text-lg mb-2">Drag and drop agents here</p>
                <p className="text-sm">Select a tool from the sidebar to view its agents</p>
              </div>
            )}
          </div>
        </main>

      </div>

      <button className="fixed bottom-6 right-6 bg-accent-500 hover:bg-accent-600 text-white p-4 rounded-full shadow-lg">
        <FaQuestion className="text-xl" />
      </button>
    </div>
  );
}