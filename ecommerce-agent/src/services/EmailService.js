import Imap from 'imap';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import { promisify } from 'util';
import EventEmitter from 'events';

export class EmailService extends EventEmitter {
  constructor(config) {
    super();
    this.imapConfig = {
      user: config.emailUser,
      password: config.emailPassword,
      host: config.emailHost,
      port: config.emailPort,
      tls: config.emailSecure,
      tlsOptions: { rejectUnauthorized: false }
    };

    this.smtpConfig = {
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword
      }
    };

    this.transporter = nodemailer.createTransport(this.smtpConfig);
    this.imap = null;
    this.isConnected = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.imap = new Imap(this.imapConfig);

      this.imap.once('ready', () => {
        this.isConnected = true;
        console.log('IMAP connection established');
        resolve();
      });

      this.imap.once('error', (err) => {
        console.error('IMAP error:', err);
        this.isConnected = false;
        reject(err);
      });

      this.imap.once('end', () => {
        console.log('IMAP connection ended');
        this.isConnected = false;
      });

      this.imap.connect();
    });
  }

  async disconnect() {
    if (this.imap && this.isConnected) {
      this.imap.end();
      this.isConnected = false;
    }
  }

  async openInbox() {
    const openBox = promisify(this.imap.openBox.bind(this.imap));
    return await openBox('INBOX', false);
  }

  async fetchUnreadEmails(limit = 50) {
    if (!this.isConnected) {
      await this.connect();
    }

    await this.openInbox();

    return new Promise((resolve, reject) => {
      this.imap.search(['UNSEEN'], (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        if (!results || results.length === 0) {
          resolve([]);
          return;
        }

        const fetchResults = results.slice(-limit);
        const emails = [];

        const fetch = this.imap.fetch(fetchResults, {
          bodies: '',
          markSeen: false
        });

        fetch.on('message', (msg, seqno) => {
          const emailData = {
            seqno,
            attributes: null,
            body: null
          };

          msg.on('body', (stream, info) => {
            let buffer = '';
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });
            stream.once('end', () => {
              emailData.body = buffer;
            });
          });

          msg.once('attributes', (attrs) => {
            emailData.attributes = attrs;
          });

          msg.once('end', () => {
            emails.push(emailData);
          });
        });

        fetch.once('error', (err) => {
          reject(err);
        });

        fetch.once('end', async () => {
          const parsedEmails = [];
          for (const email of emails) {
            try {
              const parsed = await simpleParser(email.body);
              parsedEmails.push({
                messageId: parsed.messageId,
                from: parsed.from?.text || '',
                to: parsed.to?.text || '',
                subject: parsed.subject || '',
                date: parsed.date || new Date(),
                text: parsed.text || '',
                html: parsed.html || '',
                attachments: parsed.attachments || [],
                uid: email.attributes.uid,
                flags: email.attributes.flags
              });
            } catch (parseErr) {
              console.error('Error parsing email:', parseErr);
            }
          }
          resolve(parsedEmails);
        });
      });
    });
  }

  async fetchEmailsByDateRange(startDate, endDate) {
    if (!this.isConnected) {
      await this.connect();
    }

    await this.openInbox();

    return new Promise((resolve, reject) => {
      const searchCriteria = [
        ['SINCE', startDate.toISOString().split('T')[0]],
        ['BEFORE', endDate.toISOString().split('T')[0]]
      ];

      this.imap.search(searchCriteria, (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        if (!results || results.length === 0) {
          resolve([]);
          return;
        }

        const emails = [];
        const fetch = this.imap.fetch(results, {
          bodies: '',
          markSeen: false
        });

        fetch.on('message', (msg, seqno) => {
          const emailData = {
            seqno,
            body: null
          };

          msg.on('body', (stream) => {
            let buffer = '';
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });
            stream.once('end', () => {
              emailData.body = buffer;
            });
          });

          msg.once('end', () => {
            emails.push(emailData);
          });
        });

        fetch.once('error', reject);

        fetch.once('end', async () => {
          const parsedEmails = [];
          for (const email of emails) {
            try {
              const parsed = await simpleParser(email.body);
              parsedEmails.push({
                messageId: parsed.messageId,
                from: parsed.from?.text || '',
                to: parsed.to?.text || '',
                subject: parsed.subject || '',
                date: parsed.date || new Date(),
                text: parsed.text || '',
                html: parsed.html || '',
                attachments: parsed.attachments || []
              });
            } catch (parseErr) {
              console.error('Error parsing email:', parseErr);
            }
          }
          resolve(parsedEmails);
        });
      });
    });
  }

  async markAsRead(uid) {
    if (!this.isConnected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      this.imap.addFlags(uid, ['\\Seen'], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async markAsUnread(uid) {
    if (!this.isConnected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      this.imap.delFlags(uid, ['\\Seen'], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async sendEmail(to, subject, text, html, attachments = [], replyTo = null) {
    const mailOptions = {
      from: `${process.env.COMPANY_NAME} <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      attachments,
      headers: {}
    };

    if (replyTo) {
      mailOptions.headers['In-Reply-To'] = replyTo;
      mailOptions.headers['References'] = replyTo;
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendReply(originalEmail, replyText, replyHtml) {
    const replySubject = originalEmail.subject.startsWith('Re:') 
      ? originalEmail.subject 
      : `Re: ${originalEmail.subject}`;

    return await this.sendEmail(
      originalEmail.from,
      replySubject,
      replyText,
      replyHtml,
      [],
      originalEmail.messageId
    );
  }

  async moveToFolder(uid, folderName) {
    if (!this.isConnected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      this.imap.move(uid, folderName, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async createFolder(folderName) {
    if (!this.isConnected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      this.imap.addBox(folderName, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async listFolders() {
    if (!this.isConnected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      this.imap.getBoxes((err, boxes) => {
        if (err) {
          reject(err);
        } else {
          resolve(boxes);
        }
      });
    });
  }

  startListening(interval = 60000) {
    setInterval(async () => {
      try {
        const unreadEmails = await this.fetchUnreadEmails();
        if (unreadEmails.length > 0) {
          this.emit('new-emails', unreadEmails);
        }
      } catch (error) {
        console.error('Error checking for new emails:', error);
        this.emit('error', error);
      }
    }, interval);
  }

  async searchEmails(criteria) {
    if (!this.isConnected) {
      await this.connect();
    }

    await this.openInbox();

    return new Promise((resolve, reject) => {
      const searchCriteria = [];
      
      if (criteria.from) {
        searchCriteria.push(['FROM', criteria.from]);
      }
      if (criteria.subject) {
        searchCriteria.push(['SUBJECT', criteria.subject]);
      }
      if (criteria.text) {
        searchCriteria.push(['TEXT', criteria.text]);
      }
      if (criteria.since) {
        searchCriteria.push(['SINCE', criteria.since]);
      }
      if (criteria.before) {
        searchCriteria.push(['BEFORE', criteria.before]);
      }

      this.imap.search(searchCriteria, async (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        if (!results || results.length === 0) {
          resolve([]);
          return;
        }

        // Process results similar to fetchUnreadEmails
        // ... (implementation similar to above)
        resolve(results);
      });
    });
  }
}