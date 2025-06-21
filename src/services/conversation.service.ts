import { supabase } from '@/lib/supabase';

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  conversation_type: string | null;
  is_archived: boolean;
  message_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens_used: number | null;
  model_used: string | null;
  response_time_ms: number | null;
  is_favorite: boolean;
  created_at: string;
}

export interface ConversationSession {
  id: string;
  conversation_id: string;
  user_id: string;
  start_time: string | null;
  end_time: string | null;
  duration_seconds: number | null;
  session_type: string | null;
  created_at: string;
}

class ConversationService {
  // Create a new conversation
  async createConversation(userId: string, title?: string, type: string = 'voice') {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          title: title || `会話 ${new Date().toLocaleDateString('ja-JP')}`,
          conversation_type: type,
        })
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Get user's conversations
  async getConversations(userId: string, limit: number = 20, offset: number = 0) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Get single conversation
  async getConversation(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Update conversation
  async updateConversation(conversationId: string, updates: Partial<Conversation>) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Archive conversation
  async archiveConversation(conversationId: string) {
    return this.updateConversation(conversationId, { is_archived: true });
  }

  // Delete conversation
  async deleteConversation(conversationId: string) {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Add message to conversation
  async addMessage(message: {
    conversation_id: string;
    user_id: string;
    role: 'user' | 'assistant';
    content: string;
    tokens_used?: number;
    model_used?: string;
    response_time_ms?: number;
  }) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();

      if (error) throw error;

      // Update conversation's last message time and count
      await this.updateConversation(message.conversation_id, {
        last_message_at: new Date().toISOString(),
        message_count: (await this.getMessageCount(message.conversation_id)) + 1,
      });

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId: string, limit: number = 50, offset: number = 0) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Get message count for conversation
  private async getMessageCount(conversationId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  // Toggle message favorite
  async toggleMessageFavorite(messageId: string, isFavorite: boolean) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ is_favorite: isFavorite })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Start conversation session (for time tracking)
  async startSession(conversationId: string, userId: string): Promise<{ data: string | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .rpc('start_conversation_session', {
          p_conversation_id: conversationId,
          p_user_id: userId,
        });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // End conversation session
  async endSession(sessionId: string): Promise<{ data: number | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .rpc('end_conversation_session', {
          p_session_id: sessionId,
        });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Check if user can start new conversation (daily limit)
  async checkDailyLimit(userId: string): Promise<{ data: boolean | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .rpc('check_daily_message_limit', {
          p_user_id: userId,
        });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Get favorite messages
  async getFavoriteMessages(userId: string, limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, conversations!inner(title)')
        .eq('user_id', userId)
        .eq('is_favorite', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Search conversations
  async searchConversations(userId: string, searchTerm: string) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .ilike('title', `%${searchTerm}%`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Get conversation statistics
  async getConversationStats(conversationId: string) {
    try {
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId);

      if (messagesError) throw messagesError;

      const { data: sessions, error: sessionsError } = await supabase
        .from('conversation_sessions')
        .select('duration_seconds')
        .eq('conversation_id', conversationId);

      if (sessionsError) throw sessionsError;

      const totalDuration = sessions?.reduce((acc, session) => acc + (session.duration_seconds || 0), 0) || 0;
      const userMessages = messages?.filter(m => m.role === 'user').length || 0;
      const assistantMessages = messages?.filter(m => m.role === 'assistant').length || 0;

      return {
        data: {
          totalMessages: messages?.length || 0,
          userMessages,
          assistantMessages,
          totalDurationSeconds: totalDuration,
          averageMessageLength: messages?.reduce((acc, m) => acc + m.content.length, 0) / (messages?.length || 1) || 0,
        },
        error: null,
      };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }
}

export const conversationService = new ConversationService();