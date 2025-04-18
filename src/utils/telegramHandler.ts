// app/utils/telegramHandler.ts
import TelegramBot from 'node-telegram-bot-api';

interface Agent {
  id: string;
  agent_name: string;
  project: {
    id: string;
    project_name: string;
    db_credential: any;
  };
  credential: {
    data: {
      botToken: string;
      chatId: string;
    };
  };
}

export async function verifyTelegramConnection(credential: { botToken: string, chatId: string }): Promise<boolean> {
  try {
    const bot = new TelegramBot(credential.botToken);
    await bot.getMe();
    return true;
  } catch (error) {
    console.error('Telegram connection verification failed:', error);
    return false;
  }
}

export function startTelegramAgent(
  agent: Agent, 
  onMessage: (query: string) => Promise<string>,
  onError?: (error: Error) => void
) {
  const { botToken, chatId } = agent.credential.data;
  const bot = new TelegramBot(botToken, { polling: true });

  // Queue to handle messages one at a time
  let isProcessing = false;
  const messageQueue: { msg: any, text: string }[] = [];

  const processQueue = async () => {
    if (isProcessing || messageQueue.length === 0) return;
    
    isProcessing = true;
    const { msg, text } = messageQueue.shift()!;
    
    try {
      // Send "processing" indicator
      await bot.sendChatAction(chatId, 'typing');
      
      const response = await onMessage(text);
      await bot.sendMessage(chatId, response);
    } catch (error) {
      console.error('Error processing message:', error);
      if (onError) onError(error as Error);
      await bot.sendMessage(chatId, 'Error processing your request');
    } finally {
      isProcessing = false;
      processQueue(); // Process next message in queue
    }
  };

  bot.on('message', async (msg) => {
    if (msg.chat.id.toString() !== chatId || !msg.text) return;
    
    // Add message to queue
    messageQueue.push({ msg, text: msg.text });
    
    // If not currently processing, start processing
    if (!isProcessing) {
      processQueue();
    }
  });

  return () => {
    bot.stopPolling();
  };
}