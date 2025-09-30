import nodemailer from 'nodemailer';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendAlert(to: string, subject: string, alertDetails: {
    title: string;
    description: string;
    severity: string;
    kpiName?: string;
    departmentName?: string;
  }) {
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1>NITDA SRAP 2.0 Alert</h1>
          </div>
          <div style="padding: 20px; background: #f8fafc;">
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${
              alertDetails.severity === 'critical' ? '#dc2626' : 
              alertDetails.severity === 'high' ? '#ea580c' : 
              alertDetails.severity === 'medium' ? '#d97706' : '#16a34a'
            };">
              <h2 style="color: #1f2937; margin: 0 0 10px 0;">${alertDetails.title}</h2>
              <p style="color: #6b7280; margin: 0 0 15px 0;">${alertDetails.description}</p>
              
              ${alertDetails.kpiName ? `<p><strong>KPI:</strong> ${alertDetails.kpiName}</p>` : ''}
              ${alertDetails.departmentName ? `<p><strong>Department:</strong> ${alertDetails.departmentName}</p>` : ''}
              
              <div style="background: #f3f4f6; padding: 10px; border-radius: 4px; margin-top: 15px;">
                <p style="margin: 0; color: #374151;">
                  <strong>Severity:</strong> 
                  <span style="color: ${
                    alertDetails.severity === 'critical' ? '#dc2626' : 
                    alertDetails.severity === 'high' ? '#ea580c' : 
                    alertDetails.severity === 'medium' ? '#d97706' : '#16a34a'
                  }; text-transform: uppercase; font-weight: bold;">
                    ${alertDetails.severity}
                  </span>
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard" 
                 style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Dashboard
              </a>
            </div>
          </div>
          
          <div style="background: #e5e7eb; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>This is an automated message from NITDA SRAP 2.0 Performance Dashboard</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@nitda.gov.ng',
        to,
        subject: `[NITDA SRAP] ${subject}`,
        html,
      });

      console.log(`Alert email sent to ${to}: ${subject}`);
    } catch (error) {
      console.error('Failed to send alert email:', error);
      throw error;
    }
  }

  async sendKPISubmissionNotification(to: string, kpiDetails: {
    kpiName: string;
    departmentName: string;
    submittedBy: string;
    actualValue: string;
    targetValue: string;
    status: string;
  }) {
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #059669; color: white; padding: 20px; text-align: center;">
            <h1>KPI Submission Received</h1>
          </div>
          <div style="padding: 20px; background: #f8fafc;">
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h2 style="color: #1f2937; margin: 0 0 15px 0;">New KPI Data Submitted</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>KPI:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${kpiDetails.kpiName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Department:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${kpiDetails.departmentName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Submitted by:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${kpiDetails.submittedBy}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Actual Value:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${kpiDetails.actualValue}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Target Value:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${kpiDetails.targetValue}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Status:</strong></td>
                  <td style="padding: 8px 0;">
                    <span style="color: ${kpiDetails.status === 'approved' ? '#059669' : kpiDetails.status === 'rejected' ? '#dc2626' : '#d97706'}; font-weight: bold; text-transform: uppercase;">
                      ${kpiDetails.status}
                    </span>
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard" 
                 style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Review Submission
              </a>
            </div>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@nitda.gov.ng',
        to,
        subject: `[NITDA SRAP] KPI Submission - ${kpiDetails.kpiName}`,
        html,
      });

      console.log(`KPI submission notification sent to ${to}`);
    } catch (error) {
      console.error('Failed to send KPI submission notification:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
