import {EmailAttachment} from './email-attachment';

export interface EmailMessage {
    from: string;
    to: string;
    subject: string;
    body: string;
    attachments: EmailAttachment[];
}