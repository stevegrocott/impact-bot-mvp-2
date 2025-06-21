/**
 * Email Service
 * Handles sending emails for invitations, notifications, and other communications
 */

import * as nodemailer from 'nodemailer';
import { config } from '@/config/environment';
import { logger } from '@/utils/logger';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface InvitationEmailData {
  inviteeEmail: string;
  inviteeFirstName?: string;
  inviterName: string;
  organizationName: string;
  invitationToken: string;
  roleName: string;
  message?: string;
  expiresAt: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // For development, use ethereal email (fake SMTP service)
      if (config.NODE_ENV === 'development') {
        // Create test account for development
        const testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        logger.info('Email service initialized with Ethereal Email', {
          user: testAccount.user,
          password: testAccount.pass,
          previewUrl: 'https://ethereal.email'
        });
      } else {
        // Production email configuration
        // This would use real SMTP settings (SendGrid, AWS SES, etc.)
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        logger.info('Email service initialized with production SMTP');
      }

      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize email service', { error });
      this.isInitialized = false;
    }
  }

  async sendInvitationEmail(data: InvitationEmailData): Promise<boolean> {
    if (!this.isInitialized || !this.transporter) {
      logger.error('Email service not initialized');
      return false;
    }

    try {
      const template = this.generateInvitationTemplate(data);
      const acceptUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invitation/accept?token=${data.invitationToken}`;

      const mailOptions = {
        from: `"Impact Bot" <noreply@impact-bot.com>`,
        to: data.inviteeEmail,
        subject: template.subject,
        html: template.html.replace('{{ACCEPT_URL}}', acceptUrl),
        text: template.text.replace('{{ACCEPT_URL}}', acceptUrl),
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('Invitation email sent successfully', {
        messageId: result.messageId,
        recipient: data.inviteeEmail,
        organization: data.organizationName,
        previewUrl: nodemailer.getTestMessageUrl(result) // For development
      });

      return true;
    } catch (error) {
      logger.error('Failed to send invitation email', {
        error,
        recipient: data.inviteeEmail,
        organization: data.organizationName
      });
      return false;
    }
  }

  private generateInvitationTemplate(data: InvitationEmailData): EmailTemplate {
    const expiryDate = new Date(data.expiresAt).toLocaleDateString();
    
    const subject = `Invitation to join ${data.organizationName} on Impact Bot`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Organization Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
          .role-badge { background: #E0F2FE; color: #0369A1; padding: 4px 12px; border-radius: 20px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎯 Impact Bot Invitation</h1>
          <p>You've been invited to collaborate on impact measurement</p>
        </div>
        
        <div class="content">
          <h2>Hello${data.inviteeFirstName ? ` ${data.inviteeFirstName}` : ''}!</h2>
          
          <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> on Impact Bot - the AI-powered impact measurement platform.</p>
          
          <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3>Invitation Details:</h3>
            <p><strong>Organization:</strong> ${data.organizationName}</p>
            <p><strong>Role:</strong> <span class="role-badge">${data.roleName}</span></p>
            <p><strong>Invited by:</strong> ${data.inviterName}</p>
            ${data.message ? `<p><strong>Personal message:</strong><br><em>"${data.message}"</em></p>` : ''}
          </div>
          
          <p>Impact Bot helps organizations measure what matters through:</p>
          <ul>
            <li>🤖 AI-powered theory of change analysis</li>
            <li>📊 IRIS+ indicator library integration</li>
            <li>⚠️ Pitfall prevention and best practices</li>
            <li>👥 Collaborative measurement design</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{ACCEPT_URL}}" class="button">Accept Invitation</a>
          </div>
          
          <p><strong>Important:</strong> This invitation expires on <strong>${expiryDate}</strong>.</p>
          
          <div class="footer">
            <p>If you have any questions, please contact ${data.inviterName} or reply to this email.</p>
            <p>If the button doesn't work, copy and paste this link into your browser:<br>
               <a href="{{ACCEPT_URL}}">{{ACCEPT_URL}}</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Impact Bot Invitation
      
      Hello${data.inviteeFirstName ? ` ${data.inviteeFirstName}` : ''}!
      
      ${data.inviterName} has invited you to join ${data.organizationName} on Impact Bot.
      
      Invitation Details:
      - Organization: ${data.organizationName}
      - Role: ${data.roleName}
      - Invited by: ${data.inviterName}
      ${data.message ? `- Personal message: "${data.message}"` : ''}
      
      To accept this invitation, visit:
      {{ACCEPT_URL}}
      
      This invitation expires on ${expiryDate}.
      
      Impact Bot is an AI-powered impact measurement platform that helps organizations measure what matters through guided analysis, IRIS+ integration, and collaborative design.
      
      If you have any questions, please contact ${data.inviterName}.
    `;

    return { subject, html, text };
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    // Implementation for password reset emails
    // This would be similar to invitation emails but with different template
    return true;
  }

  async sendWelcomeEmail(userEmail: string, firstName: string, organizationName: string): Promise<boolean> {
    // Implementation for welcome emails after successful registration
    return true;
  }
}

export const emailService = new EmailService();