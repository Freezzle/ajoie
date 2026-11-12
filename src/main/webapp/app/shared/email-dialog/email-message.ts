import {EmailAttachment} from './email-attachment';

export interface EmailMessage {
    from: string;
    to: string;
    bcc?: string[];
    recipientsCount?: number;
    subject: string;
    body: string;
    attachments: EmailAttachment[];
}