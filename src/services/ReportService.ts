import { supabase } from "@/integrations/supabase/client";
import { Report, ReportType } from "@/types";

export interface IReportService {
  submitReport(
    reportedEntityId: string, 
    type: ReportType, 
    reason: string, 
    reporterNote?: string, 
    messageId?: string,
    reporterIdOverride?: string // Optional parameter to avoid redundant auth calls
  ): Promise<{ success: boolean; message?: string; report_id?: string }>;
}

class ReportService implements IReportService {
  async submitReport(
    reportedEntityId: string, 
    type: ReportType, 
    reason: string, 
    reporterNote?: string, 
    messageId?: string,
    reporterIdOverride?: string // Allow passing the reporter ID directly
  ): Promise<{ success: boolean; message?: string; report_id?: string }> {
    try {
      let reporterId: string;
      
      // Use the provided reporter ID if available (to avoid redundant auth calls)
      if (reporterIdOverride) {
        reporterId = reporterIdOverride;
      } else {
        // Get current authenticated user only if not provided
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authData.user) {
          return { success: false, message: 'You must be logged in to submit a report' };
        }
        
        reporterId = authData.user.id;
      }
      
      // Call the RPC function to submit the report
      const { data, error } = await supabase
        .rpc('submit_report', {
          p_reporter_id: reporterId,
          p_reported_entity_id: reportedEntityId,
          p_type: type,
          p_reason: reason,
          p_reporter_note: reporterNote || null,
          p_message_id: messageId || null
        });
      
      if (error) {
        console.error('Error submitting report:', error);
        return { success: false, message: error.message || 'Failed to submit report' };
      }
      
      return data as { success: boolean; message?: string; report_id?: string };
    } catch (error) {
      console.error('Error in submitReport:', error);
      return { success: false, message: 'An unexpected error occurred' };
    }
  }
}

export const reportService = new ReportService(); 